"use client";

/**
 * TestimonialCarousel — customer-photo version (jersey project)
 * ---------------------------------------------------------------
 * Optimizations (mobile-first):
 * - Windowed render: only the active card +/- 2 neighbors ever
 *   mount, so a list of 50 customer photos costs the same as 5.
 * - next/image handles resizing/format/lazy-loading per photo —
 *   only the active (in-view) card gets `priority`, the rest lazy.
 * - Every animated value (x, y, scale, rotate, opacity) is a
 *   transform/opacity property -> GPU compositing only.
 * - Centering is done with `inset-0 m-auto` (no transform), so
 *   Framer's transform never fights Tailwind's transform utilities.
 * - No icon library — chevrons are inline SVG.
 * - Autoplay pauses on hover/focus and when the tab is hidden.
 * - Swipe is detected via onPanEnd (gesture-only, doesn't drag
 *   the DOM), so there's no extra reflow while touching.
 * - Respects prefers-reduced-motion.
 * ---------------------------------------------------------------
 * If your photos are on a remote host (not /public), add that
 * domain to images.remotePatterns in next.config.js or next/image
 * will refuse to load it.
 */

import { useState, useEffect, useCallback, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

/**
 * @typedef {Object} Testimonial
 * @property {string|number} id
 * @property {string} image   - path or URL to the customer photo
 * @property {string} name    - shown below the card stack
 * @property {string} [subtitle] - optional second line (team, city, order #...)
 */

const CARD_W = 240;
const CARD_H = 320;

/** shortest signed distance from `index` to `activeIndex` on a circular list */
function getOffset(index, activeIndex, length) {
  let diff = index - activeIndex;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  return diff;
}

function getCardMotion(offset) {
  const abs = Math.abs(offset);
  const dir = Math.sign(offset);
  if (abs === 0) return { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, zIndex: 30 };
  if (abs === 1)
    return { x: dir * 68, y: -18, scale: 0.9, rotate: dir * 4, opacity: 0.5, zIndex: 20 };
  return { x: dir * 112, y: -30, scale: 0.82, rotate: dir * 7, opacity: 0.16, zIndex: 10 };
}

const Card = memo(function Card({ testimonial, offset, onClick, reduceMotion }) {
  const isActive = offset === 0;
  const m = getCardMotion(offset);

  return (
    <motion.div
      role="group"
      aria-roledescription="slide"
      aria-hidden={!isActive}
      aria-label={isActive ? testimonial.name : undefined}
      onClick={!isActive ? onClick : undefined}
      animate={{ x: m.x, y: m.y, scale: m.scale, rotate: m.rotate, opacity: m.opacity }}
      transition={
        reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28, mass: 0.9 }
      }
      style={{ zIndex: m.zIndex, width: CARD_W, height: CARD_H }}
      className={`absolute inset-0 m-auto overflow-hidden rounded-[28px] border ${
        isActive
          ? "cursor-default border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)]"
          : "cursor-pointer border-white/5"
      }`}
    >
      <Image
        src={testimonial.image}
        alt={`${testimonial.name} wearing their jersey`}
        fill
        sizes={`${CARD_W}px`}
        priority={isActive}
        loading={isActive ? undefined : "lazy"}
        className="object-cover"
      />
      {/* scrim so the card edge/border stays readable against bright photos */}
      <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
    </motion.div>
  );
});

const NavButton = memo(function NavButton({ direction, onClick }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      aria-label={direction === "next" ? "Next testimonial" : "Previous testimonial"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d={direction === "next" ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
});

export default function TestimonialCarousel({
  testimonials = DEFAULT_TESTIMONIALS,
  autoPlay = false,
  autoPlayInterval = 5500,
  className = "",
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const total = testimonials.length;

  const goNext = useCallback(() => setActiveIndex((i) => (i + 1) % total), [total]);
  const goPrev = useCallback(() => setActiveIndex((i) => (i - 1 + total) % total), [total]);
  const goTo = useCallback((i) => setActiveIndex(i), []);

  // autoplay, paused on hover/focus/hidden tab
  useEffect(() => {
    if (!autoPlay || isPaused || total <= 1) return;
    const id = setInterval(goNext, autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlay, isPaused, autoPlayInterval, goNext, total]);

  useEffect(() => {
    const onVisibility = () => setIsPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // only mount the cards actually near-visible -> stays light no matter the list size
  const visible = testimonials
    .map((t, i) => ({ t, i, offset: getOffset(i, activeIndex, total) }))
    .filter(({ offset }) => Math.abs(offset) <= 2);

  const active = testimonials[activeIndex];

  return (
    <div
      className={`w-full select-none outline-none ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goNext();
        if (e.key === "ArrowLeft") goPrev();
      }}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
    >
      <motion.div
        className="relative mx-auto"
        style={{ width: "100%", maxWidth: 380, height: CARD_H + 40, touchAction: "pan-y" }}
        onPanEnd={(_, info) => {
          const threshold = 40;
          if (info.offset.x < -threshold) goNext();
          else if (info.offset.x > threshold) goPrev();
        }}
      >
        {visible.map(({ t, i, offset }) => (
          <Card
            key={t.id}
            testimonial={t}
            offset={offset}
            reduceMotion={reduceMotion}
            onClick={() => goTo(i)}
          />
        ))}
      </motion.div>

      <div className="mt-6 text-center">
        <p className="text-base font-semibold text-primary">{active.name}</p>
        {active.subtitle && <p className="text-sm text-primary-dark">{active.subtitle}</p>}
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <NavButton direction="prev" onClick={goPrev} />

        <div className="flex items-center gap-2">
          {testimonials.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className="flex h-2 items-center"
            >
              {i === activeIndex ? (
                <motion.span
                  layoutId="active-dot"
                  className="h-2 w-6 rounded-full bg-white"
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                />
              ) : (
                <span className="h-2 w-2 rounded-full bg-white/25 transition-colors hover:bg-white/40" />
              )}
            </button>
          ))}
        </div>

        <NavButton direction="next" onClick={goNext} />
      </div>
    </div>
  );
}
