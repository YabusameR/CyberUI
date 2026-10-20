import React, { useEffect, useState } from 'react';
import { cx } from '../core/hooks';

export interface ScanlineOverlayProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 0–1 line opacity. */
  intensity?: number;
  /** Slow luminous band travelling top → bottom. */
  sweep?: boolean;
  /** Seconds per sweep. */
  sweepDuration?: number;
  /** Cover the viewport instead of the nearest positioned ancestor. */
  fixed?: boolean;
}

/** CRT / hologram scanlines. Place inside a positioned container. */
export function ScanlineOverlay({ intensity = 0.35, sweep = true, sweepDuration = 7, fixed, className, style, ...rest }: ScanlineOverlayProps) {
  return (
    <span
      className={cx('fui-scanlines', fixed && 'fui-scanlines--fixed', className)}
      aria-hidden
      style={{ ['--fui-scan-alpha' as string]: intensity, ['--fui-scan-duration' as string]: `${sweepDuration}s`, ...style }}
      {...rest}
    >
      {sweep && <span className="fui-scanlines__sweep fui-loop" />}
    </span>
  );
}

export interface HolographicFlickerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'span';
}

/** Irregular 1–3% alpha flicker of a projected hologram. */
export function HolographicFlicker({ as: Tag = 'div', className, ...rest }: HolographicFlickerProps) {
  return <Tag className={cx('fui-flicker', className)} {...rest} />;
}

export interface GlitchBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `hover`: on pointer hover · `always`: periodic bursts · `manual`: driven by `active`. */
  trigger?: 'hover' | 'always' | 'manual';
  /** For `manual`: glitch while true (e.g. an error state). */
  active?: boolean;
  /** Burst length in ms when `active` flips to true. Omit to glitch continuously while active. */
  burst?: number;
  intensity?: 'low' | 'high';
}

/** Geometric displacement + chromatic split for errors and hovers. */
export function GlitchBox({ trigger = 'hover', active = false, burst, intensity = 'low', className, ...rest }: GlitchBoxProps) {
  const [on, setOn] = useState(active);
  useEffect(() => {
    setOn(active);
    if (!active || !burst) return;
    const t = setTimeout(() => setOn(false), burst);
    return () => clearTimeout(t);
  }, [active, burst]);
  return (
    <div
      className={cx('fui-glitch', className)}
      data-trigger={trigger}
      data-intensity={intensity}
      data-active={trigger === 'manual' && on ? '' : undefined}
      {...rest}
    />
  );
}
