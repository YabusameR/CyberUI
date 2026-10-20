import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AnimationMode = 'cinematic' | 'balanced' | 'minimal' | 'reduced-motion';

export interface AnimationSettings {
  /** Mode requested by the app. */
  requestedMode: AnimationMode;
  /** Mode actually applied (OS `prefers-reduced-motion` forces `reduced-motion`). */
  mode: AnimationMode;
  /** Ambient loops (flicker, scanlines, sweeps) are allowed. */
  loops: boolean;
  /** Transitions / one-shot motion (boot, scramble, count-up) are allowed. */
  transitions: boolean;
  /** Heavy effects (SVG filters, blur, glitch layers, particles) are allowed. */
  heavy: boolean;
  /** UI sound effects are enabled. */
  sound: boolean;
}

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia ? window.matchMedia(REDUCE_QUERY).matches : false,
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia(REDUCE_QUERY);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function resolveAnimation(requested: AnimationMode, osReduced: boolean, sound: boolean): AnimationSettings {
  const mode: AnimationMode = osReduced ? 'reduced-motion' : requested;
  return {
    requestedMode: requested,
    mode,
    loops: mode === 'cinematic' || mode === 'balanced',
    transitions: mode !== 'reduced-motion',
    heavy: mode === 'cinematic',
    sound,
  };
}

const AnimationContext = createContext<AnimationSettings>(resolveAnimation('balanced', false, true));

export interface AnimationProviderProps {
  mode?: AnimationMode;
  /** Respect the OS `prefers-reduced-motion` setting (default: true). */
  respectReducedMotion?: boolean;
  sound?: boolean;
  children?: React.ReactNode;
}

export function AnimationProvider({
  mode = 'balanced',
  respectReducedMotion = true,
  sound = true,
  children,
}: AnimationProviderProps) {
  const osReduced = usePrefersReducedMotion();
  const value = useMemo(
    () => resolveAnimation(mode, respectReducedMotion && osReduced, sound),
    [mode, respectReducedMotion, osReduced, sound],
  );
  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>;
}

export function useAnimation(): AnimationSettings {
  return useContext(AnimationContext);
}
