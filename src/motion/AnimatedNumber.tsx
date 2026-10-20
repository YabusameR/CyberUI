import React from 'react';
import { useAnimation } from '../core/animation';
import { cx, useAnimatedNumber } from '../core/hooks';
import { useFuiStyles } from '../core/styles';

export interface AnimatedNumberProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: number;
  decimals?: number;
  /** Zero-pad the integer part to this many digits. */
  pad?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

/** Count up/down on a monospaced face so digits never jitter. */
export function AnimatedNumber({ value, decimals = 0, pad = 0, duration = 800, prefix = '', suffix = '', className, ...rest }: AnimatedNumberProps) {
  useFuiStyles();
  const { transitions } = useAnimation();
  const v = useAnimatedNumber(value, { duration, enabled: transitions });
  const [int, frac] = Math.abs(v).toFixed(decimals).split('.');
  const formatted = `${v < 0 ? '-' : ''}${int.padStart(pad, '0')}${frac ? `.${frac}` : ''}`;
  return (
    <span className={cx('fui-number', className)} {...rest}>
      <span className="fui-sr-only">{`${prefix}${value.toFixed(decimals)}${suffix}`}</span>
      <span aria-hidden>{`${prefix}${formatted}${suffix}`}</span>
    </span>
  );
}
