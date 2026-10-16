// →  src/components/shop/qrPassCanvas.js
//
// Paints the product "share card": a 1080×1440 jersey-pinstripe poster with a
// liquid-style QR, the product photo in a ringed avatar, price and discount.
//
// The modal shows THIS canvas and the download button exports THIS canvas, so
// what the admin sees is exactly the PNG he gets. Corners are transparent, so
// the PNG can be dropped on top of a video as an overlay.
//
// Progressive by design: everything the product card already knows (name,
// price, discount) is painted in the very first, synchronous pass. The things
// that take time (QR matrix, photo, logo, script font) are filled in as each
// one arrives — the whole card is repainted from one `state` object, so the
// layers can never end up in the wrong order. Anything seen before (QR for a
// product you already opened, the logo, the font) comes from a small cache and
// is in that very first paint.

import { getImageProps } from 'next/image';
import { formatPrice } from '@/lib/format';

export const PASS_W = 1080;
export const PASS_H = 1440;

const FRAME_RADIUS = 72;
const TAU = Math.PI * 2;
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Layout (canvas px). Everything below is positioned from these, and the
// modal reads them to place its loading skeletons exactly on top.
const CARD = { x: 200, y: 410, w: 680, h: 700, r: 72 };
const QR = { x: 270, y: 470, size: 540, knockout: 144 };
const AVATAR = { x: 540, y: 300, ring: 148, photo: 134 };

export const PASS_LAYOUT = { qr: QR, avatar: AVATAR };

/* ------------------------------------------------------------------ */
/* small drawing helpers                                               */
/* ------------------------------------------------------------------ */

// Rounded rect with per-corner radii [tl, tr, br, bl]. Always clockwise, so
// many of these in one path union together under the nonzero fill rule.
function rrPath(ctx, x, y, w, h, r) {
  const [tl, tr, br, bl] = typeof r === 'number' ? [r, r, r, r] : r;
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}

function glow(ctx, x, y, radius, [r, g, b], alpha) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function sparkle(ctx, x, y, r, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

// ctx.letterSpacing isn't available everywhere, so tracking is done by hand.
function measureSpaced(ctx, text, spacing) {
  const chars = [...text];
  return chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) + spacing * (chars.length - 1);
}

function drawSpaced(ctx, text, cx, y, spacing) {
  const chars = [...text];
  let x = cx - measureSpaced(ctx, text, spacing) / 2;
  ctx.textAlign = 'left';
  chars.forEach((ch) => {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  });
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (!line || ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines - 1) {
        line = words.slice(i).join(' '); // last line takes whatever is left
        break;
      }
    }
  }
  if (line) lines.push(line);

  const last = lines.length - 1;
  if (last >= 0 && ctx.measureText(lines[last]).width > maxWidth) {
    let t = lines[last];
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
    lines[last] = `${t.trimEnd()}…`;
  }
  return lines.slice(0, maxLines);
}

/* ------------------------------------------------------------------ */
/* loading + caches                                                    */
/* ------------------------------------------------------------------ */

const CACHE_LIMIT = 8;
const matrixCache = new Map(); // url → QR matrix
const matrixInflight = new Map();
const imageCache = new Map(); // product image src → decoded <img>
const imageInflight = new Map();
const logoCache = new Map(); // logo src → <img> | null (null = failed, don't retry)
const fontLoads = new Map();
let enginePromise = null;

function remember(map, key, value) {
  map.set(key, value);
  if (map.size > CACHE_LIMIT) map.delete(map.keys().next().value); // oldest out
  return value;
}

function loadImage(src, cors = false) {
  return new Promise((resolve) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Prefers Next's own /_next/image URL: it's same-origin (so the canvas never
// gets tainted and toBlob keeps working) and is often the exact file the
// product card already downloaded. Falls back to a CORS request on the raw
// URL, then to "no photo" — the card still renders, with a monogram.
async function fetchProductImage(src) {
  if (src.startsWith('data:')) return loadImage(src);

  let optimized = null;
  try {
    // Next puts the 2x entry in `src`: asking for 320px gives a w=640 URL —
    // plenty for the 268px avatar, and far lighter than a 1080 request (which
    // would resolve to the 3840px variant).
    optimized = getImageProps({ src, alt: '', width: 320, height: 320 }).props.src;
  } catch {
    // not optimizable — use the direct URL below
  }

  const viaOptimizer = optimized ? await loadImage(optimized) : null;
  return viaOptimizer ?? loadImage(src, true);
}

function loadProductImage(src) {
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);
  if (!imageInflight.has(src)) {
    imageInflight.set(
      src,
      fetchProductImage(src)
        .then((img) => (img ? remember(imageCache, src, img) : null))
        .finally(() => imageInflight.delete(src))
    );
  }
  return imageInflight.get(src);
}

function loadLogo(src) {
  if (logoCache.has(src)) return Promise.resolve(logoCache.get(src));
  return loadImage(src).then((img) => remember(logoCache, src, img));
}

function isFontReady(family) {
  if (typeof document === 'undefined' || !document.fonts?.check) return true;
  try {
    return document.fonts.check(`700 64px ${family}`, 'Nique Scan to view');
  } catch {
    return true;
  }
}

function ensureFont(family) {
  if (isFontReady(family)) return Promise.resolve();
  if (!fontLoads.has(family)) {
    fontLoads.set(
      family,
      document.fonts.load(`700 64px ${family}`, 'Nique Scan to view').then(
        () => undefined,
        () => undefined // falls back to the generic cursive stack
      )
    );
  }
  return fontLoads.get(family);
}

function loadEngine() {
  if (!enginePromise) {
    enginePromise = import('qrcode-generator')
      .then((mod) =>
        typeof mod.default === 'function' ? mod.default : typeof mod.qrcode === 'function' ? mod.qrcode : mod
      )
      .catch((error) => {
        enginePromise = null; // let a retry try the import again
        throw error;
      });
  }
  return enginePromise;
}

async function buildQrMatrix(text) {
  const qrcode = await loadEngine();
  const qr = qrcode(0, 'H'); // level H survives the logo knockout in the middle
  qr.addData(text);
  qr.make();

  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

function loadQrMatrix(text) {
  const cached = matrixCache.get(text);
  if (cached) return Promise.resolve(cached);
  if (!matrixInflight.has(text)) {
    matrixInflight.set(
      text,
      buildQrMatrix(text)
        .then((rows) => remember(matrixCache, text, rows))
        .finally(() => matrixInflight.delete(text))
    );
  }
  return matrixInflight.get(text);
}

/* ------------------------------------------------------------------ */
/* painting                                                            */
/* ------------------------------------------------------------------ */

function paintBackground(ctx, script, fontReady) {
  const base = ctx.createLinearGradient(0, 0, PASS_W * 0.7, PASS_H);
  base.addColorStop(0, '#0a2f38');
  base.addColorStop(0.5, '#15535f');
  base.addColorStop(1, '#2a8191');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, PASS_W, PASS_H);

  glow(ctx, 900, 120, 520, [123, 198, 208], 0.5);
  glow(ctx, 120, 1250, 560, [92, 179, 193], 0.38);
  glow(ctx, AVATAR.x, AVATAR.y + 20, 460, [123, 198, 208], 0.3);

  // jersey pinstripes, slanted like speed lines
  ctx.save();
  ctx.transform(1, 0, -0.18, 1, 0, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = -80; x < PASS_W + 360; x += 76) ctx.fillRect(x, -10, 38, PASS_H + 20);
  ctx.restore();

  // oversized brand script, barely there (waits for the font so it never flashes in a fallback face)
  if (fontReady) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 380px ${script}`;
    ctx.textAlign = 'center';
    ctx.fillText('Nique', PASS_W / 2, 470);
    ctx.restore();
  }

  // diagonal sheen
  const sheen = ctx.createLinearGradient(0, 0, PASS_W, PASS_H);
  sheen.addColorStop(0.3, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.46, 'rgba(255,255,255,0.09)');
  sheen.addColorStop(0.62, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, PASS_W, PASS_H);

  sparkle(ctx, 140, 250, 34, 0.9);
  sparkle(ctx, 950, 210, 24, 0.85);
  sparkle(ctx, 990, 520, 16, 0.6);
  sparkle(ctx, 95, 560, 18, 0.55);
}

function paintHeader(ctx) {
  ctx.save();
  ctx.font = `700 30px ${SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.textBaseline = 'alphabetic';
  const label = 'NIQUE SPORTS';
  const width = measureSpaced(ctx, label, 14);
  drawSpaced(ctx, label, PASS_W / 2, 92, 14);
  sparkle(ctx, PASS_W / 2 - width / 2 - 40, 82, 14, 0.9);
  sparkle(ctx, PASS_W / 2 + width / 2 + 40, 82, 14, 0.9);
  ctx.restore();
}

function paintCardStack(ctx) {
  const cx = CARD.x + CARD.w / 2;
  const cy = CARD.y + CARD.h / 2;

  // two ghost cards behind, fanned out
  [
    [-5.5, 0.16],
    [4.5, 0.1],
  ].forEach(([deg, alpha]) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.beginPath();
    rrPath(ctx, -CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, CARD.r);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.stroke();
    ctx.restore();
  });

  ctx.save();
  ctx.shadowColor = 'rgba(3,24,30,0.5)';
  ctx.shadowBlur = 90;
  ctx.shadowOffsetY = 40;
  const paper = ctx.createLinearGradient(0, CARD.y, 0, CARD.y + CARD.h);
  paper.addColorStop(0, '#ffffff');
  paper.addColorStop(1, '#eef7f8');
  ctx.fillStyle = paper;
  ctx.beginPath();
  rrPath(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r);
  ctx.fill();
  ctx.restore();
}

// The static part of the QR area: corner brackets + label. Painted straight
// away, so the loading state already looks like the finished card.
function paintQrFrame(ctx, script, fontReady) {
  const { x, y, size } = QR;

  const off = 40;
  const arm = 60;
  ctx.save();
  ctx.strokeStyle = '#308898';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  [
    [x - off, y - off, 1, 1],
    [x + size + off, y - off, -1, 1],
    [x - off, y + size + off, 1, -1],
    [x + size + off, y + size + off, -1, -1],
  ].forEach(([bx, by, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(bx, by + arm * dy);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + arm * dx, by);
    ctx.stroke();
  });
  ctx.restore();

  if (fontReady) {
    ctx.save();
    const label = ctx.createLinearGradient(370, 0, 710, 0);
    label.addColorStop(0, '#1b5661');
    label.addColorStop(1, '#308898');
    ctx.fillStyle = label;
    ctx.font = `700 58px ${script}`;
    ctx.textAlign = 'center';
    ctx.fillText('Scan to view', PASS_W / 2, 1082);
    ctx.restore();
  }
}

// Data modules as one "liquid" path: a corner is only rounded when both
// neighbours on that corner are empty, so touching modules melt together and
// lone ones become dots. One fill() = no hairline seams between modules.
function paintQrModules(ctx, rows) {
  const n = rows.length;
  const { x, y, size, knockout } = QR;
  const cell = size / n;
  const half = knockout / 2;

  const inEye = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const inLogo = (r, c) =>
    Math.abs((c + 0.5) * cell - size / 2) < half && Math.abs((r + 0.5) * cell - size / 2) < half;
  const dark = (r, c) => r >= 0 && c >= 0 && r < n && c < n && rows[r][c] && !inEye(r, c) && !inLogo(r, c);

  const R = cell * 0.5;
  ctx.beginPath();
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (!dark(r, c)) continue;
      const up = dark(r - 1, c);
      const down = dark(r + 1, c);
      const left = dark(r, c - 1);
      const right = dark(r, c + 1);
      rrPath(ctx, x + c * cell, y + r * cell, cell, cell, [
        !up && !left ? R : 0,
        !up && !right ? R : 0,
        !down && !right ? R : 0,
        !down && !left ? R : 0,
      ]);
    }
  }
  ctx.fill();

  // finder eyes: soft ring + soft dot
  [
    [0, 0],
    [0, n - 7],
    [n - 7, 0],
  ].forEach(([r, c]) => {
    const ex = x + c * cell;
    const ey = y + r * cell;
    ctx.beginPath();
    rrPath(ctx, ex, ey, cell * 7, cell * 7, cell * 2.2);
    rrPath(ctx, ex + cell, ey + cell, cell * 5, cell * 5, cell * 1.4);
    ctx.fill('evenodd');
    ctx.beginPath();
    rrPath(ctx, ex + cell * 2, ey + cell * 2, cell * 3, cell * 3, cell * 1.1);
    ctx.fill();
  });
}

// The part that needs the QR matrix (and the logo): modules, eyes, centre badge.
function paintQrCode(ctx, rows, logo, script) {
  const { x, y, size } = QR;

  const ink = ctx.createLinearGradient(x, y, x + size, y + size);
  ink.addColorStop(0, '#0b3a45');
  ink.addColorStop(1, '#2b7f8f');
  ctx.fillStyle = ink;
  paintQrModules(ctx, rows);

  const cx = x + size / 2;
  const cy = y + size / 2;
  
  // Outer white border square (120x120)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 60, cy - 60, 120, 120);
  ctx.restore();

  // Inner logo / fallback area square (100x100)
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - 50, cy - 50, 100, 100);
  ctx.clip();
  if (logo) {
    drawCover(ctx, logo, cx - 50, cy - 50, 100, 100);
  } else {
    ctx.fillStyle = '#308898';
    ctx.fillRect(cx - 50, cy - 50, 100, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 76px ${script}`;
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, cy + 24);
  }
  ctx.restore();
}

// `photo`: undefined = still loading (ring only), null = failed (monogram), image = done.
function paintAvatar(ctx, photo, name, face) {
  const { x, y, ring, photo: pr } = AVATAR;

  // lift
  ctx.save();
  ctx.shadowColor = 'rgba(3,24,30,0.45)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, ring + 7, 0, TAU);
  ctx.fill();
  ctx.restore();

  // gradient ring
  const rg = ctx.createLinearGradient(x - ring, y - ring, x + ring, y + ring);
  rg.addColorStop(0, '#ffffff');
  rg.addColorStop(0.35, '#9fe3ec');
  rg.addColorStop(0.7, '#308898');
  rg.addColorStop(1, '#1b5661');
  ctx.save();
  ctx.lineWidth = 14;
  ctx.strokeStyle = rg;
  ctx.beginPath();
  ctx.arc(x, y, ring, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, ring - 7, 0, TAU);
  ctx.fill();
  ctx.restore();

  if (photo === undefined) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, pr, 0, TAU);
  ctx.clip();
  if (photo) {
    drawCover(ctx, photo, x - pr, y - pr, pr * 2, pr * 2);
  } else {
    const fallback = ctx.createLinearGradient(x - pr, y - pr, x + pr, y + pr);
    fallback.addColorStop(0, '#e5f2f4');
    fallback.addColorStop(1, '#7bc6d0');
    ctx.fillStyle = fallback;
    ctx.fillRect(x - pr, y - pr, pr * 2, pr * 2);
    const initials =
      String(name ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || 'N';
    ctx.fillStyle = '#236b79';
    ctx.font = `700 120px ${face}`;
    ctx.textAlign = 'center';
    ctx.fillText(initials, x, y + 40);
  }
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.arc(x, y, pr, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// Sticker slapped on the avatar ring, like a notification badge.
function paintDiscount(ctx, percent) {
  const R = 60;
  const points = 14;

  ctx.save();
  ctx.translate(654, 392);
  ctx.rotate((-12 * Math.PI) / 180);

  ctx.shadowColor = 'rgba(120,20,20,0.45)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const angle = (Math.PI * i) / points;
    const radius = i % 2 === 0 ? R : R * 0.86;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#d94b4b';
  ctx.fill();

  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 34px ${SANS}`;
  ctx.fillText(`-${percent}%`, 0, 6);
  ctx.font = `700 16px ${SANS}`;
  ctx.fillText('OFF', 0, 28);
  ctx.restore();
}

function paintInfo(ctx, { name, price, originalPrice }) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // name
  ctx.font = `800 54px ${SANS}`;
  const lines = wrapText(ctx, name || 'Jersey', 880, 2);
  const lineHeight = 64;
  const startY = 1150 + (2 * lineHeight - lines.length * lineHeight) / 2 + 50;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  lines.forEach((line, i) => ctx.fillText(line, PASS_W / 2, startY + i * lineHeight));
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // price pill
  const priceText = `${formatPrice(Number(price) || 0)}৳`;
  const hasOriginal = Number(originalPrice) > Number(price);
  const originalText = hasOriginal ? `${formatPrice(Number(originalPrice))}৳` : '';

  ctx.font = `800 46px ${SANS}`;
  const priceW = ctx.measureText(priceText).width;
  ctx.font = `600 30px ${SANS}`;
  const originalW = hasOriginal ? ctx.measureText(originalText).width : 0;

  const gap = hasOriginal ? 22 : 0;
  const padX = 46;
  const pillW = padX * 2 + originalW + gap + priceW;
  const pillH = 84;
  const pillX = (PASS_W - pillW) / 2;
  const pillY = 1304;
  const baseline = pillY + pillH / 2 + 16;

  ctx.save();
  ctx.shadowColor = 'rgba(3,24,30,0.35)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  rrPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = 'left';
  let cursor = pillX + padX;
  if (hasOriginal) {
    ctx.font = `600 30px ${SANS}`;
    ctx.fillStyle = '#7b898c';
    ctx.fillText(originalText, cursor, baseline);
    ctx.strokeStyle = '#7b898c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cursor - 2, baseline - 11);
    ctx.lineTo(cursor + originalW + 2, baseline - 11);
    ctx.stroke();
    cursor += originalW + gap;
  }
  ctx.font = `800 46px ${SANS}`;
  ctx.fillStyle = '#1b5661';
  ctx.fillText(priceText, cursor, baseline);

  ctx.restore();
}

function paintEdge(ctx) {
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  rrPath(ctx, 3, 3, PASS_W - 6, PASS_H - 6, FRAME_RADIUS - 3);
  ctx.stroke();
  ctx.restore();
}

// One full, deterministic repaint from whatever `state` currently holds.
function paint(canvas, options, state) {
  const { name, price, originalPrice, discountPercent } = options;
  const script = options.scriptFamily || 'cursive';

  if (canvas.width !== PASS_W) canvas.width = PASS_W;
  if (canvas.height !== PASS_H) canvas.height = PASS_H;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, PASS_W, PASS_H);

  ctx.save();
  ctx.beginPath();
  rrPath(ctx, 0, 0, PASS_W, PASS_H, FRAME_RADIUS);
  ctx.clip();

  paintBackground(ctx, script, state.fontReady);
  paintHeader(ctx);
  paintCardStack(ctx);
  paintQrFrame(ctx, script, state.fontReady);
  if (state.rows && state.logo !== undefined) paintQrCode(ctx, state.rows, state.logo, script);
  paintAvatar(ctx, state.photo, name, state.fontReady ? script : SANS);
  if (state.photo !== undefined && Number(discountPercent) > 0) paintDiscount(ctx, discountPercent);
  paintInfo(ctx, { name, price, originalPrice });
  paintEdge(ctx);

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* public                                                              */
/* ------------------------------------------------------------------ */

// Paints the card right now with everything already known, then keeps
// repainting as the slow pieces arrive. `onProgress` gets
//   { avatar, qr, font, error }
// every time something lands (and once up front), so the UI can drop its
// loading skeletons piece by piece. Returns { cancel, done }.
export function startProductPass(canvas, options, onProgress) {
  const { url, imageSrc, logoSrc } = options;
  const script = options.scriptFamily || 'cursive';

  // undefined = still loading, null = finished without a result
  const state = {
    rows: matrixCache.get(url) ?? null,
    photo: imageSrc ? imageCache.get(imageSrc) : null,
    logo: logoSrc ? logoCache.get(logoSrc) : null,
    fontReady: isFontReady(script),
    error: false,
  };

  let cancelled = false;
  let scheduled = false;

  const emit = () =>
    onProgress?.({
      avatar: state.photo !== undefined,
      qr: Boolean(state.rows) && state.logo !== undefined,
      font: state.fontReady,
      error: state.error,
    });

  const flush = () => {
    scheduled = false;
    if (cancelled) return;
    paint(canvas, options, state);
    emit();
  };

  // coalesce several arrivals in the same frame into one repaint
  const schedule = () => {
    if (scheduled || cancelled) return;
    scheduled = true;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
    else setTimeout(flush, 0);
  };

  flush(); // first paint, synchronous

  const tasks = [
    loadQrMatrix(url).then(
      (rows) => {
        state.rows = rows;
        state.error = false;
      },
      (error) => {
        console.error('QR generation failed:', error);
        state.error = true;
      }
    ),
    imageSrc
      ? loadProductImage(imageSrc).then((img) => {
          state.photo = img;
        })
      : null,
    logoSrc
      ? loadLogo(logoSrc).then((img) => {
          state.logo = img;
        })
      : null,
    ensureFont(script).then(() => {
      state.fontReady = true;
    }),
  ].filter(Boolean);

  tasks.forEach((task) => task.then(schedule));
  const done = Promise.all(tasks).then(flush);

  return {
    cancel() {
      cancelled = true;
    },
    done,
  };
}

// Warms the slow, shared pieces (QR engine, logo, script font) while the
// browser is idle, so the first tap on a QR button is already fast.
export function prewarmProductPass({ scriptFamily, logoSrc } = {}) {
  loadEngine().catch(() => {});
  if (logoSrc) loadLogo(logoSrc);
  ensureFont(scriptFamily || 'cursive');
}

// A QR-looking placeholder: the same 3 finder eyes and the same clear centre
// as the real code, with seeded-random blocks between. Used as a CSS mask so
// the modal can shimmer it while the real QR is being made.
export function buildQrSkeletonSvg(n = 41) {
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const mid = n / 2;
  const inEye = (r, c) => (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
  const inCenter = (r, c) => Math.abs(c + 0.5 - mid) < 6.5 && Math.abs(r + 0.5 - mid) < 6.5;
  const free = (r, c) => c < n && !inEye(r, c) && !inCenter(r, c);

  let d = '';
  for (let r = 0; r < n; r += 1) {
    let c = 0;
    while (c < n) {
      if (!free(r, c) || rand() > 0.5) {
        c += 1;
        continue;
      }
      let run = 1;
      while (run < 3 && free(r, c + run) && rand() > 0.45) run += 1;
      d += `M${c + 0.25} ${r + 0.25}h${run - 0.5}v0.5h${-(run - 0.5)}z`;
      c += run;
    }
  }

  const eye = (x, y) =>
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.8" fill="none" stroke="#000" stroke-width="1"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="1"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}">` +
    `<path d="${d}" fill="#000" stroke="#000" stroke-width="0.5" stroke-linejoin="round"/>` +
    `${eye(0, 0)}${eye(n - 7, 0)}${eye(0, n - 7)}` +
    `<circle cx="${mid}" cy="${mid}" r="4.6"/></svg>`
  );
}