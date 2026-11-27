import React, { useState } from 'react';
import { useAnimation } from '../core/animation';
import { playSound } from '../core/audio';
import { cx } from '../core/hooks';
import type { FuiTone } from '../layout/HudFrame';
import { useFuiStyles } from '../core/styles';

interface HudToggleBase extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  sound?: boolean;
  tone?: FuiTone;
}

/**
 * A switch needs a name: the ON/OFF text is decoration (the state is read from `aria-checked`), so without a
 * `label` a screen reader would announce a nameless switch. Pass `label`, or `aria-label` / `aria-labelledby`.
 */
export type HudToggleProps = HudToggleBase &
  ({ label: React.ReactNode } | { label?: undefined; 'aria-label': string } | { label?: undefined; 'aria-labelledby': string });

/** Accessible switch (`role="switch"`) styled as a HUD toggle. */
export function HudToggle({
  checked,
  defaultChecked = false,
  onChange,
  label,
  onLabel = 'ON',
  offLabel = 'OFF',
  sound: withSound = false,
  tone,
  className,
  onClick,
  ...rest
}: HudToggleProps) {
  useFuiStyles();
  const [inner, setInner] = useState(defaultChecked);
  const isOn = checked ?? inner;
  const { sound } = useAnimation();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      className={cx('fui-toggle', className)}
      data-tone={tone}
      data-on={isOn ? '' : undefined}
      onClick={(e) => {
        const next = !isOn;
        if (checked === undefined) setInner(next);
        if (withSound && sound) playSound(next ? 'confirm' : 'click');
        onChange?.(next);
        onClick?.(e);
      }}
      {...rest}
    >
      <span className="fui-toggle__track" aria-hidden>
        <span className="fui-toggle__thumb" />
      </span>
      <span className="fui-toggle__state" aria-hidden>
        {isOn ? onLabel : offLabel}
      </span>
      {label && <span className="fui-toggle__label">{label}</span>}
    </button>
  );
}
