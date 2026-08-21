"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const MAX_VISIBLE = 7;
const HALF = 3;

const FAN_POSITIONS = [
  { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
  { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
  { rot: -7,  scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
  { rot: 0,   scale: 1.0,    x: 0,   y: 0.0, zIndex: 10 },
  { rot: 7,   scale: 0.9346, x: 11,  y: 1.3, zIndex: 3 },
  { rot: 14,  scale: 0.8498, x: 22,  y: 4.0, zIndex: 2 },
  { rot: 21,  scale: 0.7756, x: 30,  y: 7.3, zIndex: 1 },
];

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

function getSlotConfig(totalCards, slot) {
  if (totalCards >= MAX_VISIBLE) return FAN_POSITIONS[slot];
  const center = totalCards >> 1;
  const distance = totalCards > 1 ? (slot - center) / center : 0;
  const absDistance = Math.abs(distance);
  return {
    rot: distance * 21,
    scale: 1.0 - 0.2244 * absDistance * absDistance,
    x: distance * 30,
    y: absDistance * absDistance * 7.3,
    zIndex: 10 - Math.abs(slot - center),
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

// Instantly writes a style with transitions switched off — the CSS
// equivalent of gsap.set()/animate(..., {duration:0}).
function setInstant(el, props) {
  el.style.transitionProperty = "none";
  applyTransform(el, props);
  el.style.opacity = props.opacity ?? 1;
}

// Starts (or retargets) a transition toward `props`. `willChange` is toggled
// on only for the lifetime of the transition, not left on permanently.
// Any previous listener from an interrupted transition is swapped out so
// rapid hover changes can't leak `transitionend` listeners.
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
  const needsPagination = totalCards > MAX_VISIBLE;
  const [centerIndex, setCenterIndex] = useState(needsPagination ? HALF : totalCards >> 1);

  const cycle = (direction) => {
    if (isAnimating.current || !needsPagination) return;
    isAnimating.current = true;
    directionRef.current = direction;
    setCenterIndex(prev => direction === "right" ? (prev + 1) % totalCards : (prev - 1 + totalCards) % totalCards);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !totalCards) return;

    lastWidthRef.current = window.innerWidth;
    mults.current = getMultipliers(window.innerWidth);
    const cardElements = Array.from(container.querySelectorAll(".fan-card"));

    const visibleMap = new Map();
    if (!needsPagination) cards.forEach((_, i) => visibleMap.set(i, i));
    else for (let slot = 0; slot < MAX_VISIBLE; slot++)
      visibleMap.set(((centerIndex + slot - HALF) % totalCards + totalCards) % totalCards, slot);

    const previouslyVisible = prevVisible.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const { m, hMult } = mults.current;
    const slotCount = needsPagination ? MAX_VISIBLE : totalCards;
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

    // Cards that need a fake "from" state written before they can transition
    // in (first mount + cards newly entering during pagination). Batched so
    // we force exactly one reflow for the whole group, not one per card.
    const pendingEntrances = [];
    // Cards that are simply moving from wherever they already are, or
    // leaving — no fake state needed, just retarget straight from "now".
    const directRetargets = [];
    const visibleEntries = [];

    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);

      if (slot !== undefined) {
        visibleEntries.push({ el: card, slot });
        const { x, y, rot, scale, zIndex } = getSlotConfig(slotCount, slot);
        card.style.zIndex = zIndex; // not transitioned — instant, same as before
        const target = { x: x * m, y: y * hMult, rot, scale, opacity: 1 };

        if (isFirstMount) {
          pendingEntrances.push({
            el: card,
            from: { x: 0, y: 12 * hMult, rot: 0, scale: 0.5, opacity: 0 },
            to: target,
            timing: isMobile
              ? { duration: 0.4, ease: EASE_OUT, delay: 0.08 + slot * 0.04 }
              : { duration: 0.9, ease: EASE_ELASTIC, delay: 0.2 + slot * 0.06 },
            onDone: onCardDone,
          });
        } else if (!wasVisible) {
          const enterX = direction === "right" ? 40 : -40;
          pendingEntrances.push({
            el: card,
            from: { x: enterX, y: y * hMult, rot: direction === "right" ? 30 : -30, scale: 0.5, opacity: 0 },
            to: target,
            timing: { duration: isMobile ? 0.35 : 0.6, ease: EASE_OUT },
            onDone: onCardDone,
          });
        } else {
          directRetargets.push({
            el: card,
            to: target,
            timing: { duration: isMobile ? 0.3 : 0.5, ease: EASE_OUT },
            onDone: onCardDone,
          });
        }
      } else if (wasVisible) {
        card.style.zIndex = 0;
        const exitX = direction === "right" ? -40 : 40;
        directRetargets.push({
          el: card,
          to: { x: exitX, opacity: 0, scale: 0.5, rot: direction === "right" ? -30 : 30 },
          timing: { duration: 0.4, ease: EASE_IN },
        });
      } else if (isFirstMount) {
        card.style.zIndex = 0;
        setInstant(card, { opacity: 0, scale: 0.3, x: 0, y: 0 });
      }
    });

    // Phase 1: write every fake "from" state with transitions off, then
    // force exactly one reflow so the browser commits them...
    if (pendingEntrances.length) {
      pendingEntrances.forEach(({ el, from }) => setInstant(el, from));
      void container.offsetHeight;
      // ...phase 2: kick off the real transition toward each target slot.
      pendingEntrances.forEach(({ el, to, timing, onDone }) => animateCard(el, to, timing, onDone));
    }

    // Plain retargets never needed the reflow trick — they animate from
    // whatever was already committed on screen.
    directRetargets.forEach(({ el, to, timing, onDone }) => animateCard(el, to, timing, onDone));

    prevVisible.current = new Set(visibleMap.keys());
    visibleEntries.sort((a, b) => a.slot - b.slot);

    let activeSlot = null;
    let leaveTimer = null;
    const centerSlot = visibleEntries.length >> 1;

    const updateHoverLayout = (hoveredSlot) => {
      const { m: currM, hMult: currH } = mults.current;

      visibleEntries.forEach(({ el, slot }) => {
        const base = getSlotConfig(slotCount, slot);
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

    // Touch devices never wire up hover at all — no listeners, no cost.
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

    // Fix: mobile browsers fire `resize` when the URL bar hides/shows during
    // a scroll gesture, which only ever changes innerHeight. That used to
    // re-run updateHoverLayout() (a full re-animate of every visible card)
    // on every one of those ticks — the actual cause of the scroll lag.
    // Only do any work when the width genuinely changes (rotation, an
    // actual window resize) — height-only churn is ignored outright.
    const onResize = () => {
      const w = window.innerWidth;
      if (w === lastWidthRef.current) return;
      lastWidthRef.current = w;
      mults.current = getMultipliers(w);
      if (!isAnimating.current) updateHoverLayout(activeSlot);
    };
    window.addEventListener("resize", onResize);

    return () => {
      listeners.forEach(({ el, handler }) => el.removeEventListener("mouseenter", handler));
      if (!isTouchDevice) container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [centerIndex, totalCards, needsPagination, cards]);

  if (!totalCards) return null;

  return (
    <section className="flex flex-col items-center w-full py-4 lg:py-8 px-4 md:px-8 relative z-20">
      <div className="flex items-center justify-center w-full max-w-360">
        <div ref={containerRef} className="fan-layout flex relative justify-center items-center w-full h-96 sm:h-112 md:h-136 max-w-7xl">
          {cards.map((card, index) => {
            const imgSrc = card.imgURL || card.imgUrl;
            return (
              <Link
                key={index}
                href={card.linkUrl || "#"}
                className="fan-card absolute w-48 h-72 sm:w-56 sm:h-80 md:w-64 md:h-96 rounded-2xl shadow-xl overflow-hidden cursor-pointer"
              >
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={imgSrc}
                    alt={card.alt || `Card ${index}`}
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