"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// How many cards sit in the fan at once, per breakpoint. This is the real
// lever for mobile perf — fewer mounted <Image>/transition targets, not
// just smaller spacing.
function getDesiredVisibleSlots(width) {
  if (width < 480) return 3;
  if (width < 768) return 5;
  return 7;
}

// One extra card mounted (but hidden) on each side of the visible window so
// it's already loaded and ready the instant it needs to slide in.
const PRELOAD_MARGIN = 1;

function getMultipliers(width) {
  let m = 1.0;
  if (width < 480) m = 0.28;
  else if (width < 640) m = 0.38;
  else if (width < 768) m = 0.5;
  else if (width < 1024) m = 0.75;

  let ideal = 38 * 16;
  if (width < 480) ideal = 22 * 16;
  else if (width < 640) ideal = 26 * 16;
  else if (width < 768) ideal = 28 * 16;
  else if (width < 1024) ideal = 34 * 16;

  const hMult = Math.min(1, (window.innerHeight * 0.7) / ideal);
  return { m, hMult };
}

// The fan's shape as a curve over normalized distance from center
// (-1 = far left edge, 0 = center, 1 = far right edge), sampled from the
// original hand-tuned 7-card layout at |distance| = 0, 1/3, 2/3, 1.
// Any other card count just interpolates between these same anchor points,
// so 3, 5, 7 (or anything) all read as "the same fan" — this is also what
// fixes the lopsided distribution bug for counts under 7, since distance is
// now always computed from a float center and always spans exactly -1..1.
const CURVE_ROT = [0, 7, 14, 21];
const CURVE_SCALE = [1, 0.9346, 0.8498, 0.7756];
const CURVE_X = [0, 11, 22, 30];
const CURVE_Y = [0, 1.3, 4.0, 7.3];

function sampleCurve(points, t) {
  const scaled = Math.min(1, t) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(scaled));
  const frac = scaled - i;
  return points[i] + (points[i + 1] - points[i]) * frac;
}

function getSlotConfig(visibleSlots, slot) {
  const center = (visibleSlots - 1) / 2;
  const distance = center > 0 ? (slot - center) / center : 0;
  const absDistance = Math.min(1, Math.abs(distance));
  const sign = Math.sign(distance);

  return {
    rot: sampleCurve(CURVE_ROT, absDistance) * sign,
    scale: sampleCurve(CURVE_SCALE, absDistance),
    x: sampleCurve(CURVE_X, absDistance) * sign,
    y: sampleCurve(CURVE_Y, absDistance),
    zIndex: Math.round((1 - absDistance) * 9) + 1,
  };
}

// Native CSS-transition curves standing in for the old GSAP/spring eases.
// "Back"-style cubic-beziers overshoot past 100% before settling — the
// closest a single curve can get to a lightly-damped spring, with no JS
// tween engine required at runtime.
const EASE_ELASTIC = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EASE_HOVER    = "cubic-bezier(0.34, 1.7, 0.64, 1)";
const EASE_OUT       = "cubic-bezier(0.25, 0.46, 0.45, 0.94)"; // ~ GSAP power2.out
const EASE_IN        = "cubic-bezier(0.55, 0.06, 0.68, 0.19)"; // ~ GSAP power2.in

const ARROW_CLASSES = "relative flex items-center justify-center rounded-full shadow-[inset_0_8px_8px_-8px_rgba(255,255,255,1),inset_0_-8px_8px_-8px_rgba(255,255,255,1)] backdrop-blur-sm text-accent cursor-pointer shrink-0 z-30 outline-none hover:text-primary/70 active:opacity-70 transition-colors duration-300 before:content-[''] ";

const Chevron = ({ direction }) => (
  <svg className="relative z-2 w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
  </svg>
);

// ---- vanilla, library-free card positioning --------------------------------
// Everything here only ever touches `transform` and `opacity`, so once a
// transition starts the browser runs it on the compositor thread — no JS
// tick is needed, which is what keeps this from competing with scroll.

function applyTransform(el, { x = 0, y = 0, rot = 0, scale = 1 }) {
  el.style.transform = `translate(${x}rem, ${y}rem) rotate(${rot}deg) scale(${scale})`;
}

function setInstant(el, props) {
  el.style.transitionProperty = "none";
  applyTransform(el, props);
  el.style.opacity = props.opacity ?? 1;
}

// Schedules a card's z-index for its next transition. Rising happens
// immediately — a card becoming more prominent should render on top right
// away. Dropping is deferred: the card keeps its OLD (higher) z-index for
// the whole transition and only settles to the real, lower value once it's
// actually finished moving. Without this, a card leaving the center slot
// drops behind the incoming one immediately — while it's still big and
// centered — so the incoming card visually punches through it instead of
// the front card gracefully scaling down and sliding aside.
function scheduleZIndex(el, targetZ) {
  const currentZ = Number(el.style.zIndex) || 0;
  if (targetZ >= currentZ) {
    el.style.zIndex = targetZ;
    return null;
  }
  el.style.zIndex = currentZ + 1000;
  return targetZ;
}

function animateCard(el, props, { duration, ease, delay = 0 }, onDone) {
  if (el.__transitionEndHandler) {
    el.removeEventListener("transitionend", el.__transitionEndHandler);
    el.__transitionEndHandler = null;
  }

  el.style.willChange = "transform, opacity";
  el.style.transitionProperty = "transform, opacity";
  el.style.transitionDuration = `${duration}s`;
  el.style.transitionTimingFunction = ease;
  el.style.transitionDelay = `${delay}s`;
  applyTransform(el, props);
  el.style.opacity = props.opacity ?? 1;

  const handleEnd = (e) => {
    if (e.target !== el || e.propertyName !== "transform") return;
    el.removeEventListener("transitionend", handleEnd);
    el.__transitionEndHandler = null;
    el.style.willChange = "auto";
    onDone?.();
  };
  el.__transitionEndHandler = handleEnd;
  el.addEventListener("transitionend", handleEnd);
}

export default function FeatureCard({ cards = [] }) {
  const containerRef = useRef(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef(null);
  const prevVisible = useRef(new Set());
  const mults = useRef({ m: 1, hMult: 1 });
  const lastWidthRef = useRef(0);

  const totalCards = cards.length;

  // SSR-safe default (desktop count); corrected to the real viewport right
  // after mount so the very first paint never mismatches server HTML.
  const [desiredVisible, setDesiredVisible] = useState(7);
  useEffect(() => {
    setDesiredVisible(getDesiredVisibleSlots(window.innerWidth));
  }, []);

  const needsPagination = totalCards > desiredVisible;
  const visibleSlots = needsPagination ? desiredVisible : totalCards;
  const half = Math.floor(visibleSlots / 2);

  const [centerIndex, setCenterIndex] = useState(needsPagination ? half : totalCards >> 1);

  const cycle = (direction) => {
    if (isAnimating.current || !needsPagination) return;
    isAnimating.current = true;
    directionRef.current = direction;
    setCenterIndex(prev =>
      direction === "right" ? (prev + 1) % totalCards : (prev - 1 + totalCards) % totalCards
    );
  };

  // Which original card indices actually get a DOM node this render: the
  // visible fan window plus one preload ring on each side. Everything else
  // stays unmounted entirely — that's the actual mobile perf win.
  const mountedIndices = useMemo(() => {
    if (totalCards === 0) return [];
    if (!needsPagination) return Array.from({ length: totalCards }, (_, i) => i);
    const radius = half + PRELOAD_MARGIN;
    const seen = new Set();
    const list = [];
    for (let d = -radius; d <= radius; d++) {
      const idx = ((centerIndex + d) % totalCards + totalCards) % totalCards;
      if (!seen.has(idx)) {
        seen.add(idx);
        list.push(idx);
      }
    }
    return list;
  }, [needsPagination, totalCards, centerIndex, half]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !totalCards) return;

    lastWidthRef.current = window.innerWidth;
    mults.current = getMultipliers(window.innerWidth);
    const cardElements = Array.from(container.querySelectorAll(".fan-card"));

    const visibleMap = new Map();
    if (!needsPagination) cards.forEach((_, i) => visibleMap.set(i, i));
    else
      for (let slot = 0; slot < visibleSlots; slot++)
        visibleMap.set(((centerIndex + slot - half) % totalCards + totalCards) % totalCards, slot);

    const previouslyVisible = prevVisible.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const { m, hMult } = mults.current;
    const isMobile = window.innerWidth < 768;
    const isTouchDevice = window.matchMedia("(hover: none)").matches;

    if (isFirstMount) isAnimating.current = true;

    let completedCount = 0;
    const onCardDone = () => {
      if (++completedCount >= visibleMap.size) {
        isAnimating.current = false;
        hasEntered.current = true;
      }
    };

    const pendingEntrances = [];
    const directRetargets = [];
    const visibleEntries = [];

    // Cards are matched to their original index via data-card-index, since
    // windowing means DOM position no longer equals the card's real index.
    cardElements.forEach((card) => {
      const cardIndex = Number(card.dataset.cardIndex);
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);

      if (slot !== undefined) {
        visibleEntries.push({ el: card, slot });
        const { x, y, rot, scale, zIndex } = getSlotConfig(visibleSlots, slot);
        const deferredZ = scheduleZIndex(card, zIndex);
        const target = { x: x * m, y: y * hMult, rot, scale, opacity: 1 };
        const finishDone = () => {
          if (deferredZ !== null) card.style.zIndex = deferredZ;
          onCardDone();
        };

        if (isFirstMount) {
          pendingEntrances.push({
            el: card,
            from: { x: 0, y: 12 * hMult, rot: 0, scale: 0.5, opacity: 0 },
            to: target,
            timing: isMobile
              ? { duration: 0.4, ease: EASE_OUT, delay: 0.08 + slot * 0.04 }
              : { duration: 0.9, ease: EASE_ELASTIC, delay: 0.2 + slot * 0.06 },
            onDone: finishDone,
          });
        } else if (!wasVisible) {
          const enterX = (direction === "right" ? 40 : -40) * m;
          pendingEntrances.push({
            el: card,
            from: { x: enterX, y: y * hMult, rot: direction === "right" ? 30 : -30, scale: 0.5, opacity: 0 },
            to: target,
            timing: { duration: isMobile ? 0.35 : 0.6, ease: EASE_OUT },
            onDone: finishDone,
          });
        } else {
          directRetargets.push({
            el: card,
            to: target,
            timing: { duration: isMobile ? 0.3 : 0.5, ease: EASE_OUT },
            onDone: finishDone,
          });
        }
      } else if (wasVisible) {
        const exitX = direction === "right" ? -40 : 40;
        const deferredZ = scheduleZIndex(card, 0);
        directRetargets.push({
          el: card,
          to: { x: exitX, opacity: 0, scale: 0.5, rot: direction === "right" ? -30 : 30 },
          timing: { duration: 0.4, ease: EASE_IN },
          onDone: deferredZ !== null ? () => { card.style.zIndex = deferredZ; } : undefined,
        });
      } else {
        // Preload-only (or first-paint off-screen) card: hide it instantly.
        // It gets a real entrance animation the moment it actually enters a slot.
        card.style.zIndex = 0;
        setInstant(card, { opacity: 0, scale: 0.5, x: 0, y: 0 });
      }
    });

    if (pendingEntrances.length) {
      pendingEntrances.forEach(({ el, from }) => setInstant(el, from));
      void container.offsetHeight;
      pendingEntrances.forEach(({ el, to, timing, onDone }) => animateCard(el, to, timing, onDone));
    }

    directRetargets.forEach(({ el, to, timing, onDone }) => animateCard(el, to, timing, onDone));

    prevVisible.current = new Set(visibleMap.keys());
    visibleEntries.sort((a, b) => a.slot - b.slot);

    let activeSlot = null;
    let leaveTimer = null;
    const centerSlot = visibleEntries.length >> 1;

    const updateHoverLayout = (hoveredSlot) => {
      const { m: currM, hMult: currH } = mults.current;

      visibleEntries.forEach(({ el, slot }) => {
        const base = getSlotConfig(visibleSlots, slot);
        let tx = base.x * currM, ty = base.y * currH, tr = base.rot, ts = base.scale;
        let d = Math.abs(slot - centerSlot) * 0.02;

        if (hoveredSlot !== null) {
          const dist = Math.abs(slot - hoveredSlot);
          d = dist * 0.02;
          if (slot === hoveredSlot) {
            ty -= 2.5 * currH; ts *= 1.08;
          } else {
            const norm = (slot - centerSlot) / (centerSlot || 1);
            const push = 8 * (1 - Math.abs(norm)) * (1 + 0.2 * Math.max(0, 3 - dist));
            if (slot < hoveredSlot) { tx -= push * currM; tr -= 3 / (dist + 1); }
            else                    { tx += push * currM; tr += 3 / (dist + 1); }
            if ((slot === visibleEntries.length - 1 && hoveredSlot < centerSlot) ||
                (slot === 0 && hoveredSlot > centerSlot)) ty -= currH;
          }
        }
        el.style.zIndex = base.zIndex;
        animateCard(el, { x: tx, y: ty, rot: tr, scale: ts, opacity: 1 }, { duration: 0.45, ease: EASE_HOVER, delay: d });
      });
    };

    const listeners = isTouchDevice ? [] : visibleEntries.map(({ el, slot }) => {
      const handler = () => {
        if (!isAnimating.current) {
          if (leaveTimer) clearTimeout(leaveTimer);
          if (activeSlot !== slot) updateHoverLayout(activeSlot = slot);
        }
      };
      el.addEventListener("mouseenter", handler);
      return { el, handler };
    });

    const onMouseLeave = () => {
      if (!isAnimating.current)
        leaveTimer = setTimeout(() => { activeSlot = null; updateHoverLayout(null); }, 50);
    };
    if (!isTouchDevice) container.addEventListener("mouseleave", onMouseLeave);

    // Width-gated: mobile toolbar collapse fires `resize` on height changes
    // only, so this ignores those and only reacts to real width changes.
    const onResize = () => {
      const w = window.innerWidth;
      if (w === lastWidthRef.current) return;
      lastWidthRef.current = w;
      mults.current = getMultipliers(w);
      const nextDesired = getDesiredVisibleSlots(w);
      if (nextDesired !== desiredVisible) {
        setDesiredVisible(nextDesired); // crosses a breakpoint — let the effect fully re-run
        return;
      }
      if (!isAnimating.current) updateHoverLayout(activeSlot);
    };
    window.addEventListener("resize", onResize);

    return () => {
      listeners.forEach(({ el, handler }) => el.removeEventListener("mouseenter", handler));
      if (!isTouchDevice) container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [centerIndex, totalCards, needsPagination, visibleSlots, half, mountedIndices, cards, desiredVisible]);

  if (!totalCards) return null;

  return (
    <section className="flex flex-col items-center w-full py-4 lg:py-8 px-4 md:px-8 relative z-20">
      <div className="flex items-center justify-center w-full max-w-360">
        <div ref={containerRef} className="fan-layout flex relative justify-center items-center w-full h-96 sm:h-112 md:h-136 max-w-7xl">
          {mountedIndices.map((idx) => {
            const card = cards[idx];
            return (
              <Link
                key={card._id ?? idx}
                data-card-index={idx}
                href={`/shop/product/${card._id || "#"}`}
                className="fan-card absolute w-48 h-72 sm:w-56 sm:h-80 md:w-64 md:h-96 rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={card.imageLink}
                    alt={card.alt || `Card ${idx}`}
                    fill
                    sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, 256px"
                    className="object-cover z-10"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      {needsPagination && (
        <div className="flex items-center justify-center gap-4 mt-4 md:mt-6 z-30">
          <button className={`${ARROW_CLASSES} w-12 h-12`} onClick={() => cycle("left")} aria-label="Previous"><Chevron direction="left" /></button>
          <div className="flex items-center gap-2">
            {cards.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === centerIndex ? "bg-primary-light scale-[1.3]" : "bg-black/15 dark:bg-white/15"}`} />
            ))}
          </div>
          <button className={`${ARROW_CLASSES} w-12 h-12`} onClick={() => cycle("right")} aria-label="Next"><Chevron direction="right" /></button>
        </div>
      )}
    </section>
  );
}