import React, { useEffect, useRef, useState } from 'react';
import { useBootStep } from '../core/boot';
import { cx } from '../core/hooks';
import { useFuiStyles } from '../core/styles';

export interface DataStreamTickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Lines to show (vertical) or the marquee content (horizontal).
   * Without `generate`, vertical mode is controlled: append to `items` to push new lines.
   */
  items?: string[];
  /** Produces a new line every `interval` ms (vertical mode, uncontrolled). */
  generate?: () => string;
  interval?: number;
  maxLines?: number;
  direction?: 'vertical' | 'horizontal';
  /** Seconds per full marquee loop (horizontal mode). */
  speed?: number;
  /** Prefix each line with a `[hh:mm:ss]` timestamp. */
  timestamp?: boolean;
  /** Announce new lines to screen readers. */
  live?: boolean;
}

const stamp = () => new Date().toTimeString().slice(0, 8);

/** Scrolling log / coordinate stream. */
export function DataStreamTicker({
  items = [],
  generate,
  interval = 900,
  maxLines = 8,
  direction = 'vertical',
  speed = 30,
  timestamp = false,
  live = false,
  className,
  style,
  ...rest
}: DataStreamTickerProps) {
  useFuiStyles();
  const ref = useRef<HTMLDivElement>(null);
  const boot = useBootStep(ref);
  const seq = useRef(0);
  const [generated, setGenerated] = useState(() =>
    items.slice(-maxLines).map((text) => ({ id: seq.current++, text, time: stamp(), fresh: false })),
  );
  const gen = useRef(generate);
  gen.current = generate;

  useEffect(() => {
    if (direction !== 'vertical' || !generate) return;
    const id = setInterval(() => {
      const text = gen.current?.();
      if (text == null) return;
      setGenerated((prev) => [...prev, { id: seq.current++, text, time: stamp(), fresh: true }].slice(-maxLines));
    }, interval);
    return () => clearInterval(id);
    // `generate` identity is tracked through the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, interval, maxLines, !!generate]);

  // Controlled mode: lines appended after mount slide in; timestamps are taken on arrival.
  const initialCount = useRef(items.length);
  const times = useRef<string[]>([]);
  const lines = generate
    ? generated
    : items.slice(-maxLines).map((text, i) => {
        const index = items.length - Math.min(items.length, maxLines) + i;
        times.current[index] ??= stamp();
        return { id: index, text, time: times.current[index], fresh: index >= initialCount.current };
      });

  if (direction === 'horizontal') {
    const content = items.join('   ///   ');
    return (
      <div
        ref={ref}
        className={cx('fui-ticker fui-ticker--h', className)}
        {...boot.props}
        style={{ ...boot.style, ['--fui-ticker-speed' as string]: `${speed}s`, ...style }}
        {...rest}
      >
        <span className="fui-sr-only">{items.join(', ')}</span>
        <div className="fui-ticker__track fui-loop" aria-hidden>
          <span>{content}&nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;</span>
          <span>{content}&nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="log"
      aria-live={live ? 'polite' : 'off'}
      className={cx('fui-ticker fui-ticker--v', className)}
      {...boot.props}
      style={{ ...boot.style, ...style }}
      {...rest}
    >
      {lines.map((l) => (
        <div key={l.id} className="fui-ticker__line" data-fresh={l.fresh ? '' : undefined}>
          {timestamp && <span className="fui-ticker__time">[{l.time}]</span>} {l.text}
        </div>
      ))}
    </div>
  );
}
