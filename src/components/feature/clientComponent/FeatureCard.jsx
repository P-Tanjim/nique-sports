"use client";

import { useState, useEffect, useRef } from "react";
import { useAnimate } from "framer-motion";
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

// Framer Motion transition equivalents for GSAP eases
const T_ELASTIC_IN  = { type: "spring", stiffness: 65, damping: 11 }; // elastic.out(1.05,.78) ~1.2s
const T_HOVER       = { type: "spring", stiffness: 100, damping: 14 }; // elastic.out(1,.75)  ~0.5s

const ARROW_CLASSES = "relative flex items-center justify-center rounded-full shadow-[inset_0_8px_8px_-8px_rgba(255,255,255,1),inset_0_-8px_8px_-8px_rgba(255,255,255,1)] backdrop-blur-sm text-accent cursor-pointer shrink-0 z-30 outline-none hover:text-primary/70 active:opacity-70 transition-colors duration-300 before:content-[''] ";

// Hoisted — pure, never needs to re-create
const Chevron = ({ direction }) => (
  <svg className="relative z-2 w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
  </svg>
);

export default function FeatureCard({ cards = [] }) {
  // useAnimate gives an imperative animate() function — replaces gsap.set/gsap.to
  const [scope, animate] = useAnimate();
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef(null);
  const prevVisible = useRef(new Set());
  const mults = useRef({ m: 1, hMult: 1 });

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
    const container = scope.current;
    if (!container || !totalCards) return;

    mults.current = getMultipliers(window.innerWidth);
    const cardElements = Array.from(container.querySelectorAll(".fan-card"));

    // Build visible map
    const visibleMap = new Map();
    if (!needsPagination) cards.forEach((_, i) => visibleMap.set(i, i));
    else for (let slot = 0; slot < MAX_VISIBLE; slot++)
      visibleMap.set(((centerIndex + slot - HALF) % totalCards + totalCards) % totalCards, slot);

    const previouslyVisible = prevVisible.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const { m, hMult } = mults.current;
    const slotCount = needsPagination ? MAX_VISIBLE : totalCards;
    let isMobile = window.innerWidth < 768;
    let isTouchDevice = window.matchMedia("(hover: none)").matches;

    if (isFirstMount) isAnimating.current = true;

    let completedCount = 0;
    const onCardDone = () => {
      if (++completedCount >= visibleMap.size) {
        isAnimating.current = false;
        hasEntered.current = true;
      }
    };

    // Single pass: animate + build visibleEntries
    const visibleEntries = [];
    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);

      if (slot !== undefined) {
        visibleEntries.push({ el: card, slot });
        const { x, y, rot, scale, zIndex } = getSlotConfig(slotCount, slot);
        // Set zIndex directly — bypasses animation pipeline, no compositor cost
        card.style.zIndex = zIndex;
        // Only animate GPU-compositable properties: translate, rotate, scale, opacity
        const target = { x: `${x * m}rem`, y: `${y * hMult}rem`, rotate: rot, scale, opacity: 1 };

        if (isFirstMount) {
          animate(card, { x: 0, y: `${12 * hMult}rem`, rotate: 0, scale: 0.5, opacity: 0 }, { duration: 0 });
          // Mobile: simple easeOut with fixed duration — settles fast on weak CPUs
          // Desktop: elastic spring for the premium bounce feel
          const entryTx = isMobile
            ? { ease: "easeOut", duration: 0.4, delay: 0.08 + slot * 0.04 }
            : { ...T_ELASTIC_IN, delay: 0.2 + slot * 0.06 };
          animate(card, target, entryTx).then(onCardDone);
        } else if (!wasVisible) {
          animate(card, { x: `${direction === "right" ? 40 : -40}rem`, y: `${y * hMult}rem`, rotate: direction === "right" ? 30 : -30, scale: 0.5, opacity: 0 }, { duration: 0 });
          animate(card, target, { ease: "easeOut", duration: isMobile ? 0.35 : 0.6 }).then(onCardDone);
        } else {
          animate(card, target, { ease: "easeOut", duration: isMobile ? 0.3 : 0.5 }).then(onCardDone);
        }
      } else if (wasVisible) {
        card.style.zIndex = 0;
        animate(card, { x: `${direction === "right" ? -40 : 40}rem`, opacity: 0, scale: 0.5, rotate: direction === "right" ? -30 : 30 }, { ease: "easeIn", duration: 0.4 });
      } else if (isFirstMount) {
        card.style.zIndex = 0;
        animate(card, { opacity: 0, scale: 0.3, x: 0, y: 0 }, { duration: 0 });
      }
    });

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
        // Set zIndex directly — avoids routing it through the animation pipeline
        el.style.zIndex = base.zIndex;
        animate(el, { x: `${tx}rem`, y: `${ty}rem`, rotate: tr, scale: ts }, { ...T_HOVER, delay: d });
      });
    };

    // Skip hover wiring entirely on touch devices — saves listener overhead
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

    const onResize = () => {
      mults.current = getMultipliers(window.innerWidth);
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
        <div ref={scope} className="fan-layout flex relative justify-center items-center w-full h-96 sm:h-112 md:h-136 max-w-7xl">
          {cards.map((card, index) => {
            const imgSrc = card.imgURL || card.imgUrl;
            return (
              <Link
                key={index}
                href={card.linkUrl || "#"}
                // will-change-transform: promotes each card to its own GPU compositing
                // layer BEFORE animation starts — eliminates CPU-side repaints entirely
                className="fan-card will-change-transform absolute w-48 h-72 sm:w-56 sm:h-80 md:w-64 md:h-96 rounded-2xl shadow-xl overflow-hidden cursor-pointer"
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
