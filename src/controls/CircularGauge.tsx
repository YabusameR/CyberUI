import React, { useId, useRef } from 'react';
import { useAnimation } from '../core/animation';
import { useBootStep } from '../core/boot';
import { cx, useAnimatedNumber } from '../core/hooks';
import { useFuiStyles } from '../core/styles';

export interface CircularGaugeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  decimals?: number;
  size?: number;
  /** Rotating radar-style sweep line. */
  animatedSweep?: boolean;
  /** Switch to amber / danger tones at these values. */
  thresholds?: { warning?: number; danger?: number };
  /** Raise the danger tone when the value is *below* the thresholds instead. */
  invertThresholds?: boolean;
}

const START = 135;
const SWEEP = 270;
const rad = (d: number) => (d * Math.PI) / 180;

/** 270° gauge with eased needle, tick ring and optional sweep line. */
export function CircularGauge({
  value,
  min = 0,
  max = 100,
  label,
  unit = '%',
  decimals = 1,
  size = 240,
  animatedSweep = false,
  thresholds,
  invertThresholds = false,
  className,
  style,
  ...rest
}: CircularGaugeProps) {
  useFuiStyles();
  const ref = useRef<HTMLDivElement>(null);
  const boot = useBootStep(ref);
  const { transitions } = useAnimation();
  const gradId = useId();
  const shown = useAnimatedNumber(value, { duration: 900, enabled: transitions, from: transitions ? min : value });
  const p = Math.min(1, Math.max(0, (shown - min) / (max - min || 1)));

  const c = size / 2;
  const r = c - 26;
  const pt = (deg: number, radius: number) => [c + radius * Math.cos(rad(deg)), c + radius * Math.sin(rad(deg))] as const;
  const [sx, sy] = pt(START, r);
  const [ex, ey] = pt(START + SWEEP, r);
  const arc = `M${sx},${sy} A${r},${r} 0 1 1 ${ex},${ey}`;

  const ticks = Array.from({ length: 55 }, (_, i) => {
    const deg = START + (SWEEP / 54) * i;
    const major = i % 9 === 0;
    const [x1, y1] = pt(deg, r + 9);
    const [x2, y2] = pt(deg, r + (major ? 19 : 14));
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={major ? 'fui-gauge__tick--major' : 'fui-gauge__tick'} />;
  });

  let tone: string | undefined;
  if (thresholds) {
    const hit = (t?: number) => t !== undefined && (invertThresholds ? value <= t : value >= t);
    tone = hit(thresholds.danger) ? 'danger' : hit(thresholds.warning) ? 'amber' : undefined;
  }

  const [wx, wy] = pt(-24, r - 4);
  return (
    <div
      ref={ref}
      role="meter"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={cx('fui-gauge', className)}
      data-tone={tone}
      {...boot.props}
      style={{ ...boot.style, width: size, height: size, ...style }}
      {...rest}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <circle className="fui-gauge__ring" cx={c} cy={c} r={c - 3} />
        <circle className="fui-gauge__ring fui-gauge__ring--inner" cx={c} cy={c} r={r - 16} />
        {ticks}
        <path className="fui-gauge__track" d={arc} pathLength={1} />
        <path className="fui-gauge__value" d={arc} pathLength={1} strokeDasharray={`${p} 1`} />
        {animatedSweep && (
          <g className="fui-gauge__sweep fui-loop">
            <path d={`M${c},${c} L${wx},${wy} A${r - 4},${r - 4} 0 0 1 ${c + r - 4},${c} Z`} fill={`url(#${gradId})`} />
            <line x1={c} y1={c} x2={c + r - 4} y2={c} />
          </g>
        )}
        <g className="fui-gauge__needle" style={{ transform: `rotate(${START + SWEEP * p}deg)` }}>
          <line x1={c + r - 12} y1={c} x2={c + r + 6} y2={c} />
        </g>
        <circle className="fui-gauge__hub" cx={c} cy={c} r={3} />
      </svg>
      <div className="fui-gauge__readout">
        <span className="fui-gauge__value-text">
          {shown.toFixed(decimals)}
          <small>{unit}</small>
        </span>
        {label && <span className="fui-gauge__label">{label}</span>}
      </div>
    </div>
  );
}
