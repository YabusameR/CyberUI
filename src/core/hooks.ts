import { useEffect, useRef, useState } from 'react';

/** Calls `callback(dt, t)` every animation frame while `active`. */
export function useRafLoop(callback: (dt: number, t: number) => void, active = true) {
  const cb = useRef(callback);
  cb.current = callback;
  useEffect(() => {
    if (!active) return;
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      cb.current(now - last, now);
      last = now;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Smoothly interpolates towards `target` with rAF (ease-out). */
export function useAnimatedNumber(target: number, { duration = 800, enabled = true, from }: { duration?: number; enabled?: boolean; from?: number } = {}) {
  const [value, setValue] = useState(from ?? target);
  const current = useRef(from ?? target);
  useEffect(() => {
    if (!enabled) {
      current.current = target;
      setValue(target);
      return;
    }
    const start = current.current;
    const delta = target - start;
    if (delta === 0) return;
    const t0 = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const v = start + delta * easeOutCubic(p);
      current.current = v;
      setValue(v);
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, duration, enabled]);
  return value;
}

/** Border-box size (padding included) via ResizeObserver. */
export function useElementSize<T extends Element>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      const rect = box ? null : el.getBoundingClientRect();
      const width = box ? box.inlineSize : rect!.width;
      const height = box ? box.blockSize : rect!.height;
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
    });
    ro.observe(el, { box: 'border-box' });
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
