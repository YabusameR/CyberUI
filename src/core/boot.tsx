import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { useAnimation } from './animation';
import { cx } from './hooks';

interface BootContextValue {
  containerRef: React.RefObject<HTMLElement | null>;
  startDelay: number;
  staggerDelay: number;
  startedAt: number;
}

const BootContext = createContext<BootContextValue | null>(null);

export const BOOT_ATTR = 'data-fui-boot';

export interface BootSequenceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay (s) between consecutive boot steps. */
  staggerDelay?: number;
  /** Delay (s) before the first step. */
  startDelay?: number;
}

/**
 * Orchestrates the mount animation of every boot-aware descendant
 * (frames draw → panels fade in → text scrambles) in document order.
 */
export function BootSequence({ staggerDelay = 0.12, startDelay = 0, className, children, ...rest }: BootSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startedAt] = useState(() => (typeof performance !== 'undefined' ? performance.now() : 0));
  return (
    <BootContext.Provider value={{ containerRef, startDelay, staggerDelay, startedAt }}>
      <div ref={containerRef} className={cx('fui-boot-sequence', className)} {...rest}>
        {children}
      </div>
    </BootContext.Provider>
  );
}

/** Alias kept for API parity with the spec. */
export const StaggerContainer = BootSequence;

/**
 * Registers an element as a boot step. Returns props to spread on the element:
 * a `data-fui-boot` marker plus the `--fui-boot-delay` CSS variable.
 */
export function useBootStep<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const boot = useContext(BootContext);
  const { transitions } = useAnimation();
  const [delay, setDelay] = useState(0);
  const enabled = !!boot && transitions;

  useLayoutEffect(() => {
    if (!boot || !ref.current) return;
    const container = boot.containerRef.current;
    if (!container) return;
    const steps = Array.from(container.querySelectorAll(`[${BOOT_ATTR}]`));
    const index = Math.max(0, steps.indexOf(ref.current));
    const elapsed = (performance.now() - boot.startedAt) / 1000;
    setDelay(Math.max(0, boot.startDelay + index * boot.staggerDelay - elapsed));
    // Index is computed once on mount on purpose: re-renders must not replay the boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    enabled,
    delay,
    props: {
      [BOOT_ATTR]: '',
      'data-fui-booting': enabled ? '' : undefined,
    } as Record<string, string | undefined>,
    style: { ['--fui-boot-delay' as string]: `${delay}s` } as React.CSSProperties,
  };
}

/** Delay (ms) of the closest boot step above `el`, or 0. */
export function closestBootDelay(el: Element | null): number {
  const step = el?.closest(`[${BOOT_ATTR}][data-fui-booting]`) as HTMLElement | null;
  if (!step) return 0;
  const v = parseFloat(step.style.getPropertyValue('--fui-boot-delay'));
  return Number.isFinite(v) ? v * 1000 : 0;
}
