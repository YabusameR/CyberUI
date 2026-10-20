import React, { useRef } from 'react';
import { useAnimation } from '../core/animation';
import { FuiSound, playSound } from '../core/audio';
import { useBootStep } from '../core/boot';
import { cx } from '../core/hooks';
import { useFuiStyles } from '../core/styles';

export type CyberButtonVariant = 'cyan' | 'magenta' | 'amber' | 'danger' | 'ghost';

export interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CyberButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Play a synthesized beep on click (`true` = `click`, or pick a sound). */
  soundOnClick?: boolean | FuiSound;
  soundOnHover?: boolean;
  /** Laser glow sweep along the frame on hover. */
  animateHover?: boolean;
  fullWidth?: boolean;
}

/** Chamfered button with glow sweep, click flash, focus reticle and synthesized sound. */
export function CyberButton({
  variant = 'cyan',
  size = 'md',
  soundOnClick = false,
  soundOnHover = false,
  animateHover = true,
  fullWidth,
  className,
  style,
  onClick,
  onMouseEnter,
  children,
  type = 'button',
  ...rest
}: CyberButtonProps) {
  useFuiStyles();
  const ref = useRef<HTMLButtonElement>(null);
  const boot = useBootStep(ref);
  const { transitions, sound } = useAnimation();
  const defaultSound: FuiSound = variant === 'danger' ? 'alert' : 'click';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (transitions) {
      // 0.08s flash: scale-down + brightness spike (compositor-friendly).
      ref.current?.animate(
        [
          { transform: 'scale(0.98)', filter: 'brightness(1.8)' },
          { transform: 'scale(0.98)', filter: 'brightness(1.8)', offset: 0.4 },
          { transform: 'scale(1)', filter: 'brightness(1)' },
        ],
        { duration: 200, easing: 'ease-out' },
      );
    }
    if (soundOnClick && sound) playSound(soundOnClick === true ? defaultSound : soundOnClick);
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      type={type}
      className={cx('fui-btn', `fui-btn--${size}`, animateHover && 'fui-btn--sweep', fullWidth && 'fui-btn--full', className)}
      data-tone={variant}
      {...boot.props}
      style={{ ...boot.style, ...style }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (soundOnHover && sound) playSound('hover');
        onMouseEnter?.(e);
      }}
      {...rest}
    >
      <span className="fui-btn__bg" aria-hidden>
        <span className="fui-btn__sweep" />
      </span>
      <span className="fui-btn__label">{children}</span>
      <span className="fui-btn__reticle" aria-hidden>
        <i data-pos="tl" />
        <i data-pos="tr" />
        <i data-pos="bl" />
        <i data-pos="br" />
      </span>
    </button>
  );
}
