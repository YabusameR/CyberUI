import React, { useRef } from 'react';
import { useBootStep } from '../core/boot';
import { cx } from '../core/hooks';
import { useFuiStyles } from '../core/styles';

export type StatusKind = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR' | 'STANDBY' | 'SCANNING';

const TONE: Record<StatusKind, string> = {
  ONLINE: 'success',
  OFFLINE: 'muted',
  WARNING: 'amber',
  ERROR: 'danger',
  STANDBY: 'cyan',
  SCANNING: 'magenta',
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusKind;
  /** LED pulse ring. */
  pulse?: boolean;
  /** Override the displayed text (defaults to the status). */
  label?: React.ReactNode;
  /**
   * Announce changes to screen readers (`role="status"`). Off by default: a badge that never changes should not
   * be a live region, and a page full of them makes each update noisy.
   */
  live?: boolean;
}

/** LED status indicator. */
export function StatusBadge({ status, pulse = false, label, live = false, className, style, ...rest }: StatusBadgeProps) {
  useFuiStyles();
  const ref = useRef<HTMLSpanElement>(null);
  const boot = useBootStep(ref);
  return (
    <span
      ref={ref}
      role={live ? 'status' : undefined}
      className={cx('fui-badge', className)}
      data-tone={TONE[status]}
      data-pulse={pulse && status !== 'OFFLINE' ? '' : undefined}
      {...boot.props}
      style={{ ...boot.style, ...style }}
      {...rest}
    >
      <span className="fui-badge__led" aria-hidden />
      <span className="fui-badge__text">{label ?? status}</span>
    </span>
  );
}
