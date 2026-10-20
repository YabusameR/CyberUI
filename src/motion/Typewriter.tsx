import React, { useEffect, useRef, useState } from 'react';
import { useAnimation } from '../core/animation';
import { closestBootDelay } from '../core/boot';
import { cx } from '../core/hooks';

export interface TypewriterProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  text: string;
  /** ms per character. */
  speed?: number;
  /** ms before typing starts (added to the enclosing boot delay). */
  startDelay?: number;
  caret?: boolean;
  onDone?: () => void;
}

/** Character-by-character terminal typing with a block caret. */
export function Typewriter({ text, speed = 28, startDelay = 0, caret = true, onDone, className, ...rest }: TypewriterProps) {
  const { transitions } = useAnimation();
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(transitions ? 0 : text.length);
  const done = useRef(onDone);
  const firstRun = useRef(true);
  done.current = onDone;

  useEffect(() => {
    if (!transitions) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) {
          clearInterval(interval);
          done.current?.();
        }
      }, speed);
    }, (firstRun.current ? closestBootDelay(ref.current) : 0) + startDelay);
    firstRun.current = false;
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, speed, startDelay, transitions]);

  return (
    <span ref={ref} className={cx('fui-typewriter', className)} {...rest}>
      <span className="fui-sr-only">{text}</span>
      <span aria-hidden>{text.slice(0, count)}</span>
      {caret && <span className="fui-caret fui-loop" aria-hidden />}
    </span>
  );
}
