'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AddToCartButton.module.css';

// CSS timeline = 0.2s delay + 3.4s cart animation = 3.6s, plus a small buffer.
// If you ever change the animation duration in the CSS file, change this too.
const ANIMATION_MS = 3700;

export default function AddToCartButton({
  onAdd, // called on click. Return false to cancel (e.g. validation failed)
  onDone, // called when the animation has finished (optional)
  label = 'Add to cart',
  disabled = false,
  className = 'h-12 w-full rounded-xl',
}) {
  const buttonRef = useRef(null);
  const timerRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleClick() {
    if (loading || disabled) return;
    if (onAdd?.() === false) return; // validation failed, so no animation

    // The cart has to travel past the button edges, whatever the button's width
    const button = buttonRef.current;
    if (button) button.style.setProperty('--travel', `${button.offsetWidth / 2 + 50}px`);

    setLoading(true);
    timerRef.current = setTimeout(() => {
      setLoading(false);
      onDone?.();
    }, ANIMATION_MS);
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-label={loading ? 'Adding to cart' : label}
      className={`${styles.button} ${loading ? styles.loading : ''} ${className}`}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.cart} aria-hidden="true">
        <svg viewBox="0 0 36 26">
          <polyline points="1 2.5 6 2.5 10 18.5 25.5 18.5 28.5 7.5 7.5 7.5" />
          <polyline points="15 13.5 17 15.5 22 10.5" />
        </svg>
      </span>
    </button>
  );
}