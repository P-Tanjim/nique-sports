"use client";

const cache = new Map();

function brightnessFromImage(src) {
  if (cache.has(src)) return Promise.resolve(cache.get(src));

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous"; // needed only for cross-domain images
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 1, 1); // whole image squashed to 1 px = average color
      try {
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        cache.set(src, brightness);
        resolve(brightness);
      } catch (err) {
        reject(err); // tainted canvas — cross-origin image without CORS headers
      }
    };
    img.onerror = reject;
  });
}

function brightnessFromColor(colorStr) {
  const rgb = colorStr.match(/\d+/g);
  if (!rgb || rgb.length < 3) return null;
  return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
}

export async function sampleBrightnessBehind(el) {
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // whatever is actually rendered at that point — img, bg-image, or color
  const stack = document.elementsFromPoint(x, y).filter((n) => !el.contains(n));

  for (const node of stack) {
    if (node.tagName === "IMG" && node.currentSrc) {
      try {
        return await brightnessFromImage(node.currentSrc);
      } catch {
        continue;
      }
    }

    const style = window.getComputedStyle(node);
    const match = style.backgroundImage?.match(/url\(["']?(.*?)["']?\)/);
    if (match) {
      try {
        return await brightnessFromImage(match[1]);
      } catch {
        continue;
      }
    }

    if (style.backgroundColor && style.backgroundColor !== "transparent" && !style.backgroundColor.endsWith(", 0)")) {
      const b = brightnessFromColor(style.backgroundColor);
      if (b !== null) return b;
    }
  }

  return 255; // nothing found → treat as light background
}