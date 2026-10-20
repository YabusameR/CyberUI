import React, { useRef } from 'react';
import { useBootStep } from '../core/boot';
import { cx, useElementSize } from '../core/hooks';
import { useFuiStyles } from '../core/styles';

export type FuiTone = 'cyan' | 'magenta' | 'amber' | 'danger' | 'success';

export interface HudFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the chamfered corners in px. */
  chamfer?: number;
  /** Corner bracket decorations. */
  brackets?: boolean;
  /** Draw the border on boot and run a light along it. */
  animatedBorder?: boolean;
  tone?: FuiTone;
}

function framePath(w: number, h: number, c: number) {
  const o = 0.5;
  c = Math.min(c, w / 2, h / 2);
  return `M${c + o},${o} H${w - o} V${h - c - o} L${w - c - o},${h - o} H${o} V${c + o} Z`;
}

function bracketPath(w: number, h: number, len: number, inset: number) {
  const i = inset;
  return [
    `M${w - len - i},${i} H${w - i} V${len + i}`, // top-right
    `M${i},${h - len - i} V${h - i} H${len + i}`, // bottom-left
    `M${w / 2 - len},${i} H${w / 2 + len}`, // top tick
    `M${w / 2 - len},${h - i} H${w / 2 + len}`, // bottom tick
  ].join(' ');
}

/** Chamfered SVG frame with brackets and a stroke-draw boot animation. */
export function HudFrame({ chamfer = 18, brackets = true, animatedBorder = false, tone, className, style, children, ...rest }: HudFrameProps) {
  useFuiStyles();
  const [sizeRef, { width, height }] = useElementSize<HTMLDivElement>();
  const bootRef = useRef<HTMLDivElement>(null);
  const boot = useBootStep(bootRef);
  const setRef = (el: HTMLDivElement | null) => {
    (sizeRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    bootRef.current = el;
  };
  const ready = width > 0 && height > 0;
  return (
    <div
      ref={setRef}
      className={cx('fui-frame', animatedBorder && 'fui-frame--animated', className)}
      data-tone={tone}
      {...boot.props}
      style={{ ...boot.style, ['--fui-chamfer' as string]: `${chamfer}px`, ...style }}
      {...rest}
    >
      <svg className="fui-frame__svg" width={width} height={height} aria-hidden focusable="false">
        {ready && (
          <>
            <path className="fui-frame__border" d={framePath(width, height, chamfer)} pathLength={1} />
            {animatedBorder && <path className="fui-frame__runner fui-loop" d={framePath(width, height, chamfer)} pathLength={1} />}
            {brackets && <path className="fui-frame__brackets" d={bracketPath(width, height, Math.min(28, width / 6), 3)} />}
          </>
        )}
      </svg>
      <div className="fui-frame__content">{children}</div>
    </div>
  );
}
