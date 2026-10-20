import React, { useRef } from 'react';
import { useBootStep } from '../core/boot';
import { cx } from '../core/hooks';
import type { FuiTone } from './HudFrame';

export interface HolographicPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Irregular 1–3% alpha flicker. */
  flickerEffect?: boolean;
  /** CRT scanline overlay. */
  scanlines?: boolean;
  /** Frosted-glass backdrop blur (disabled in `minimal`). */
  glass?: boolean;
  tone?: FuiTone;
}

/** Translucent frosted card with holographic shimmer. */
export function HolographicPanel({ flickerEffect, scanlines, glass = true, tone, className, style, children, ...rest }: HolographicPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const boot = useBootStep(ref);
  return (
    <div
      ref={ref}
      className={cx('fui-panel', glass && 'fui-panel--glass', flickerEffect && 'fui-flicker', className)}
      data-tone={tone}
      {...boot.props}
      style={{ ...boot.style, ...style }}
      {...rest}
    >
      <span className="fui-panel__corners" aria-hidden />
      {scanlines && <span className="fui-scanlines fui-scanlines--static" aria-hidden />}
      {children}
    </div>
  );
}
