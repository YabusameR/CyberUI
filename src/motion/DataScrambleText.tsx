import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimation } from '../core/animation';
import { closestBootDelay } from '../core/boot';
import { cx } from '../core/hooks';

export const SCRAMBLE_CHARSET = '0123456789ABCDEF!@#$%^&*';

export interface DataScrambleTextProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  text: string;
  /** Scramble in on mount (after the enclosing boot step, if any). */
  triggerOnMount?: boolean;
  /** Re-scramble on pointer hover. */
  scrambleOnHover?: boolean;
  /** Total time (ms) until every character settles. */
  duration?: number;
  /** Interval (ms) between shuffles — lower is faster. */
  frameInterval?: number;
  charset?: string;
  as?: 'span' | 'div' | 'p' | 'strong' | 'code';
}

const randomChar = (set: string) => set[Math.floor(Math.random() * set.length)];

/** Text that shuffles through random glyphs before converging on its value. */
export function DataScrambleText({
  text,
  triggerOnMount = false,
  scrambleOnHover = true,
  duration = 650,
  frameInterval = 40,
  charset = SCRAMBLE_CHARSET,
  as: Tag = 'span',
  className,
  onMouseEnter,
  ...rest
}: DataScrambleTextProps) {
  const { transitions } = useAnimation();
  const ref = useRef<HTMLElement>(null);
  const raf = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevText = useRef(text);
  const [display, setDisplay] = useState(() => (triggerOnMount && transitions ? text.replace(/\S/g, ' ') : text));

  const run = useCallback(
    (delay = 0) => {
      cancelAnimationFrame(raf.current);
      clearTimeout(timer.current);
      if (!transitions) {
        setDisplay(text);
        return;
      }
      const chars = Array.from(text);
      // Each glyph settles at a staggered time with a bit of jitter.
      const settleAt = chars.map((_, i) => (i / Math.max(1, chars.length)) * duration * 0.75 + Math.random() * duration * 0.25);
      timer.current = setTimeout(() => {
        const t0 = performance.now();
        let lastFrame = 0;
        const tick = (now: number) => {
          const elapsed = now - t0;
          if (now - lastFrame >= frameInterval) {
            lastFrame = now;
            setDisplay(chars.map((c, i) => (c === ' ' || elapsed >= settleAt[i] ? c : randomChar(charset))).join(''));
          }
          if (elapsed < duration) raf.current = requestAnimationFrame(tick);
          else setDisplay(text);
        };
        raf.current = requestAnimationFrame(tick);
      }, delay);
    },
    [text, transitions, duration, frameInterval, charset],
  );

  useEffect(() => {
    if (triggerOnMount) run(closestBootDelay(ref.current) + 150);
    // mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevText.current === text) return;
    prevText.current = text;
    run();
  }, [text, run]);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    clearTimeout(timer.current);
  }, []);

  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={cx('fui-scramble', className)}
      onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => {
        if (scrambleOnHover) run();
        onMouseEnter?.(e);
      }}
      {...rest}
    >
      <span className="fui-sr-only">{text}</span>
      <span aria-hidden>{display}</span>
    </Comp>
  );
}
