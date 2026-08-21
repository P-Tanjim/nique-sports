"use client";

/**
 * TestimonialCarousel — customer-photo version (jersey project)
 * ---------------------------------------------------------------
 * Optimizations (mobile-first):
 * - Windowed render: only cards within VISIBLE_RADIUS mount and
 *   animate, so a list of 50 customer photos costs the same as 5.
 * - A hidden PRELOAD_RADIUS ring (one step further out, opacity 0)
 *   stays mounted+loaded so the *next* swipe never has to fetch a
 *   fresh photo mid-animation — that mid-swipe fetch/decode was the
 *   main cause of jank on longer testimonial lists.
 * - Only x/y/scale/opacity are animated (no rotate) — one less
 *   value to recompute per frame on a clipped, rounded raster layer,
 *   which is the more expensive thing to composite on mobile GPUs.
 * - The dark scrim only renders on the active card — the 4 peek
 *   cards skip that extra paint layer entirely.
 * - `will-change: transform, opacity` hints the browser to promote
 *   each card to its own compositor layer up front, instead of
 *   paying that cost on the first animation frame.
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
 * will refuse to load it. Also worth checking: next/image should be
 * serving photos at roughly 240px wide (check the Network tab) — if
 * it's serving the original multi-MB file, optimization is being
 * bypassed somewhere (unoptimized prop, a custom loader, etc.) and
 * that alone can cause exactly this kind of stutter.
 * Still laggy on low-end phones after this? Drop VISIBLE_RADIUS to 1
 * below — that halves the number of simultaneously animating photo
 * layers at the cost of the far "peek" cards.
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

// How many cards show on each side of the active one (2 = the fanned
// look in the reference design). PRELOAD_RADIUS mounts one ring further
// out, invisibly, so it's already loaded by the time it needs to appear.
const VISIBLE_RADIUS = 2;
const PRELOAD_RADIUS = VISIBLE_RADIUS + 1;

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
  if (abs === 0) return { x: 0, y: 0, scale: 1, opacity: 1, zIndex: 30 };
  if (abs === 1) return { x: dir * 68, y: -18, scale: 0.9, opacity: 0.5, zIndex: 20 };
  if (abs === VISIBLE_RADIUS) return { x: dir * 112, y: -30, scale: 0.82, opacity: 0.16, zIndex: 10 };
  // preload ring: mounted and positioned, but invisible + inert until it
  // becomes VISIBLE_RADIUS on a future swipe.
  return { x: dir * 112, y: -30, scale: 0.82, opacity: 0, zIndex: 0 };
}

const Card = memo(function Card({ testimonial, offset, onClick, reduceMotion }) {
  const isActive = offset === 0;
  const isInteractive = !isActive && Math.abs(offset) <= VISIBLE_RADIUS;
  const m = getCardMotion(offset);

  return (
    <motion.div
      role="group"
      aria-roledescription="slide"
      aria-hidden={!isActive}
      aria-label={isActive ? testimonial.name : undefined}
      onClick={isInteractive ? onClick : undefined}
      animate={{ x: m.x, y: m.y, scale: m.scale, opacity: m.opacity }}
      transition={
        reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30, mass: 0.7 }
      }
      style={{ zIndex: m.zIndex, width: CARD_W, height: CARD_H, willChange: "transform, opacity" }}
      className={`absolute inset-0 m-auto overflow-hidden rounded-[28px] border ${
        isActive
          ? "cursor-default border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)]"
          : isInteractive
            ? "cursor-pointer border-white/5"
            : "pointer-events-none border-transparent"
      }`}
    >
      <Image
        src={testimonial.image}
        alt={`${testimonial.name} wearing their jersey`}
        fill
        sizes={`${CARD_W}px`}
        priority={isActive}
        loading={isActive ? undefined : "eager"}
        className="object-cover"
      />
      {/* scrim only on the active card — peek cards are already dimmed via opacity */}
      {isActive && (
        <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
      )}
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

  // mounts VISIBLE_RADIUS cards + one invisible preload ring — stays light
  // no matter the list size, and the next swipe never waits on a fetch
  const visible = testimonials
    .map((t, i) => ({ t, i, offset: getOffset(i, activeIndex, total) }))
    .filter(({ offset }) => Math.abs(offset) <= PRELOAD_RADIUS);

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
        <p className="text-base font-semibold text-white">{active.name}</p>
        {active.subtitle && <p className="text-sm text-neutral-500">{active.subtitle}</p>}
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
