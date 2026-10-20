import React, { useRef } from 'react';
import { useBootStep } from '../core/boot';
import { cx } from '../core/hooks';
import { useFuiStyles } from '../core/styles';

export interface RadarBlip {
  id?: string | number;
  /** Bearing in degrees, 0 = north, clockwise. */
  angle: number;
  /** 0 (center) – 1 (edge). */
  distance: number;
  label?: string;
  tone?: 'cyan' | 'magenta' | 'amber' | 'danger' | 'success';
}

export interface HudRadarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  blips?: RadarBlip[];
  /** Seconds per revolution. */
  sweepDuration?: number;
  rings?: number;
  label?: string;
}

/** 360° radar with rotating sweep; blips light up as the beam passes. */
export function HudRadar({ size = 260, blips = [], sweepDuration = 4, rings = 4, label, className, style, ...rest }: HudRadarProps) {
  useFuiStyles();
  const ref = useRef<HTMLDivElement>(null);
  const boot = useBootStep(ref);
  const c = size / 2;
  return (
    <div
      ref={ref}
      role="img"
      aria-label={`${label ?? 'Radar'}: ${blips.length} contacts`}
      className={cx('fui-radar', className)}
      {...boot.props}
      style={{ ...boot.style, width: size, height: size, ['--fui-radar-period' as string]: `${sweepDuration}s`, ...style }}
      {...rest}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
        {Array.from({ length: rings }, (_, i) => (
          <circle key={i} className="fui-radar__ring" cx={c} cy={c} r={((c - 2) * (i + 1)) / rings} />
        ))}
        <line className="fui-radar__axis" x1={c} y1={2} x2={c} y2={size - 2} />
        <line className="fui-radar__axis" x1={2} y1={c} x2={size - 2} y2={c} />
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i * 5 * Math.PI) / 180;
          const len = i % 6 === 0 ? 8 : 4;
          return (
            <line
              key={i}
              className="fui-radar__tick"
              x1={c + Math.sin(a) * (c - 2)}
              y1={c - Math.cos(a) * (c - 2)}
              x2={c + Math.sin(a) * (c - 2 - len)}
              y2={c - Math.cos(a) * (c - 2 - len)}
            />
          );
        })}
      </svg>
      <span className="fui-radar__sweep fui-loop" aria-hidden />
      {blips.map((b, i) => {
        const a = (b.angle * Math.PI) / 180;
        const d = Math.min(1, Math.max(0, b.distance)) * 50;
        return (
          <span
            key={b.id ?? i}
            className="fui-radar__blip fui-loop"
            data-tone={b.tone}
            aria-hidden
            style={{
              left: `${50 + Math.sin(a) * d}%`,
              top: `${50 - Math.cos(a) * d}%`,
              animationDelay: `${(((b.angle % 360) + 360) % 360 / 360) * sweepDuration}s`,
            }}
          >
            {b.label && <em>{b.label}</em>}
          </span>
        );
      })}
      {label && <span className="fui-radar__label">{label}</span>}
    </div>
  );
}
