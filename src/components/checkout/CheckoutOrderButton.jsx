'use client';

import { useRef, useState } from 'react';
import { useAnimate } from 'framer-motion';
import styles from './CheckoutOrderButton.module.css';

export default function CheckoutOrderButton({ onSubmit, onSuccess, onFlowStart, onFlowEnd, disabled = false }) {
  const [scope, animate] = useAnimate();
  const [phase, setPhase] = useState('idle');
  const runningRef = useRef(false);

  async function resetButton(button, stage, track, defaultText, successText, loadingText, truck) {
    await Promise.all([
      animate(stage, {
        '--progress': 0,
        '--box-s': 0.5,
        '--box-o': 0,
        '--box-x': -24,
        '--box-y': -6,
        '--bx': 0,
        '--hx': 0,
      }, { duration: 0.3, ease: 'easeOut' }),
      animate(track, { opacity: 0 }, { duration: 0.3, ease: 'easeOut' }),
      animate(button, { scaleY: 1, borderRadius: 15 }, { duration: 0.3, ease: 'easeOut' }),
      animate(truck, { x: 4, y: 0, opacity: 0 }, { duration: 0.3, ease: 'easeOut' }),
      animate(defaultText, { opacity: 1 }, { duration: 0.2 }),
      animate(loadingText, { opacity: 0 }, { duration: 0.15 }),
      animate(successText, { opacity: 0 }, { duration: 0.15 }),
    ]);
  }

  async function handleClick() {
    if (disabled || runningRef.current) return;
    if (onFlowStart?.() === false) return;

    runningRef.current = true;
    setPhase('animating');

    const button = scope.current;
    const stage = button.parentElement;
    const defaultText = button.querySelector(`.${styles.default}`);
    const successText = button.querySelector(`.${styles.success}`);
    const loadingText = button.querySelector(`.${styles.loading}`);
    const checkPath = button.querySelector(`.${styles.check}`);
    const truck = stage.querySelector(`.${styles.truck}`);
    const track = stage.querySelector(`.${styles.track}`);
    const travelDistance = Math.max(4, stage.getBoundingClientRect().width - 76);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    try {
      // pin the truck's pose while it's still invisible, so nothing snaps later
      await animate(truck, { x: 4, y: 0 }, { duration: 0 });

      if (!reducedMotion) {
        await Promise.all([
          animate(defaultText, { opacity: 0 }, { duration: 0.3 }),
          animate(button, { scaleY: 0.12, borderRadius: 2 }, { duration: 0.45, ease: 'easeInOut' }),
        ]);

        await Promise.all([
          animate(track, { opacity: 1 }, { duration: 0.2 }),
          animate(truck, { opacity: 1 }, { duration: 0.2 }),
          animate(stage, { '--box-s': 1, '--box-o': 1 }, { duration: 0.3, delay: 0.05, ease: 'easeOut' }),
          animate(stage, { '--box-x': 0 }, { duration: 0.4, delay: 0.25, ease: 'easeOut' }),
          animate(stage, { '--hx': -5, '--bx': 50 }, { duration: 0.18, delay: 0.47, ease: 'easeOut' }),
          animate(stage, { '--box-y': 0 }, { duration: 0.1, delay: 0.7, ease: 'easeOut' }),
        ]);

        await Promise.all([
          animate(truck, { x: [4, 4, 44, 24, travelDistance] }, {
            duration: 2.4,
            times: [0, 1 / 6, 7 / 12, 5 / 6, 1],
            ease: ['linear', 'easeInOut', 'easeInOut', 'easeIn'],
          }),
          animate(stage, { '--progress': 1 }, { duration: 2.4, ease: 'easeIn' }),
        ]);
      } else {
        await animate(defaultText, { opacity: 0 }, { duration: 0.1 });
      }

      setPhase('submitting');
      await Promise.all([
        animate(button, { scaleY: 1, borderRadius: 15 }, { duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }),
        animate(stage, { '--progress': 0, '--box-o': 0 }, { duration: reducedMotion ? 0 : 0.25 }),
        animate(track, { opacity: 0 }, { duration: reducedMotion ? 0 : 0.25 }),
        animate(truck, { opacity: 0 }, { duration: reducedMotion ? 0 : 0.2 }),
        animate(loadingText, { opacity: 1 }, { duration: 0.2 }),
      ]);

      const result = await onSubmit();
      if (!result?.success) {
        await resetButton(button, stage, track, defaultText, successText, loadingText, truck);
        setPhase('idle');
        return;
      }

      setPhase('success');
      await Promise.all([
        animate(loadingText, { opacity: 0 }, { duration: 0.15 }),
        animate(successText, { opacity: 1 }, { duration: 0.3 }),
        animate(checkPath, { strokeDashoffset: 0 }, { duration: 0.4, delay: 0.45, ease: 'easeOut' }),
      ]);
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      await onSuccess(result);
    } catch (error) {
      console.error('Order button animation failed:', error);
      await resetButton(button, stage, track, defaultText, successText, loadingText, truck);
      setPhase('idle');
    } finally {
      runningRef.current = false;
      onFlowEnd?.();
    }
  }

  return (
    <div className={styles.stage}>
      <button
        ref={scope}
        type="button"
        onClick={handleClick}
        disabled={disabled || phase !== 'idle'}
        aria-label={phase === 'submitting' ? 'Placing order' : phase === 'success' ? 'Order placed' : 'Complete order'}
        aria-busy={phase === 'animating' || phase === 'submitting'}
        className={styles.button}
      >
        <span className={styles.default}>Complete Order</span>
        <span className={styles.success}>
          Order Placed
          <svg viewBox="0 0 12 10" aria-hidden="true">
            <path className={styles.check} d="M1.5 6 4.5 9 10.5 1" fill="none" strokeDasharray="16px" strokeDashoffset="16px" />
          </svg>
        </span>
        <span className={styles.loading}>Placing Order…</span>
      </button>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.trackFill} />
      </span>
      <span className={styles.truck} aria-hidden="true">
        <span className={styles.back} />
        <span className={styles.front} />
        <span className={styles.box} />
        <span className={styles.wheel} />
        <span className={styles.wheelRear} />
      </span>
    </div>
  );
}