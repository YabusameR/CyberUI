import { useCallback, useEffect, useRef, useState } from 'react';

// Live browser/runtime metrics that feed the monitor sample.

export interface PingSample {
  ms: number;
  at: number;
}

interface ChromePerformance extends Performance {
  memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
}
interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: 'change', cb: () => void) => void;
  removeEventListener?: (type: 'change', cb: () => void) => void;
}
const connection = () => (navigator as Navigator & { connection?: NetworkInformation }).connection;

/** Measures real FPS and worst frame time over 500ms windows. `stress` burns main-thread time to demo degradation. */
export function useFrameStats(stress: boolean) {
  const [stats, setStats] = useState({ fps: 60, frameTime: 16.7 });
  const stressRef = useRef(stress);
  stressRef.current = stress;
  useEffect(() => {
    let id = 0;
    let frames = 0;
    let worst = 0;
    let last = performance.now();
    let windowStart = last;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      frames++;
      worst = Math.max(worst, dt);
      if (stressRef.current) {
        // ~22ms of work per frame, plus a 120ms spike every 30 frames (shows up as a long task).
        const until = performance.now() + (frames % 30 === 0 ? 120 : 22);
        while (performance.now() < until) { /* busy */ }
      }
      if (now - windowStart >= 500) {
        setStats({ fps: Math.round((frames * 1000) / (now - windowStart)), frameTime: +worst.toFixed(1) });
        frames = 0;
        worst = 0;
        windowStart = now;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  return stats;
}

/** Round-trip time to the page's own origin (a same-origin asset, cache bypassed). */
export function usePing(onResult: (ms: number | null) => void) {
  const [samples, setSamples] = useState<PingSample[]>([]);
  const [pending, setPending] = useState(false);
  const cb = useRef(onResult);
  cb.current = onResult;
  const ping = useCallback(async () => {
    setPending(true);
    const link = document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="assets"]');
    const url = new URL(link?.href ?? location.href);
    url.searchParams.set('ping', String(Date.now()));
    const t0 = performance.now();
    try {
      await fetch(url, { cache: 'no-store' });
      const ms = Math.round(performance.now() - t0);
      setSamples((s) => [...s, { ms, at: Date.now() }].slice(-12));
      cb.current(ms);
    } catch {
      cb.current(null);
    } finally {
      setPending(false);
    }
  }, []);
  return { samples, pending, ping };
}

export function useHeap() {
  const read = () => {
    const m = (performance as ChromePerformance).memory;
    return m ? { usedMB: m.usedJSHeapSize / 1048576, limitMB: m.jsHeapSizeLimit / 1048576 } : null;
  };
  const [heap, setHeap] = useState(read);
  const [domNodes, setDomNodes] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setHeap(read());
      setDomNodes(document.getElementsByTagName('*').length);
    }, 2000);
    setDomNodes(document.getElementsByTagName('*').length);
    return () => clearInterval(id);
  }, []);
  return { heap, domNodes };
}

export function useNavigationTiming() {
  const [timing, setTiming] = useState<{ ttfb: number; dcl: number; load: number; resources: number; transferKB: number } | null>(null);
  useEffect(() => {
    const read = () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      if (!nav) return;
      const transfer = resources.reduce((sum, r) => sum + (r.transferSize || 0), nav.transferSize || 0);
      setTiming({
        ttfb: Math.round(nav.responseStart),
        dcl: Math.round(nav.domContentLoadedEventEnd),
        load: Math.round(nav.loadEventEnd || performance.now()),
        resources: resources.length,
        transferKB: Math.round(transfer / 1024),
      });
    };
    if (document.readyState === 'complete') setTimeout(read, 0);
    else window.addEventListener('load', () => setTimeout(read, 0), { once: true });
  }, []);
  return timing;
}

export function useNetworkStatus(onChange: (online: boolean) => void) {
  const [online, setOnline] = useState(navigator.onLine);
  const [info, setInfo] = useState(() => ({ ...connection() }));
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    const up = () => (setOnline(true), cb.current(true));
    const down = () => (setOnline(false), cb.current(false));
    const conn = connection();
    const onConn = () => setInfo({ ...connection() });
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    conn?.addEventListener?.('change', onConn);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      conn?.removeEventListener?.('change', onConn);
    };
  }, []);
  return { online, effectiveType: info.effectiveType, downlink: info.downlink, rtt: info.rtt };
}

/** Long tasks (>50ms) reported by the browser — Chromium only. */
export function useLongTasks(onTask: (ms: number) => void) {
  const cb = useRef(onTask);
  cb.current = onTask;
  useEffect(() => {
    if (!PerformanceObserver.supportedEntryTypes?.includes('longtask')) return;
    const po = new PerformanceObserver((list) => list.getEntries().forEach((e) => cb.current(Math.round(e.duration))));
    po.observe({ type: 'longtask' });
    return () => po.disconnect();
  }, []);
}

export function deviceSummary(): string[] {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return [
    `CPU ${nav.hardwareConcurrency ?? '?'} THREADS`,
    nav.deviceMemory ? `RAM ≥${nav.deviceMemory}GB` : 'RAM N/A',
    `SCREEN ${screen.width}×${screen.height} @${devicePixelRatio}x`,
    `VIEWPORT ${innerWidth}×${innerHeight}`,
    `LANG ${navigator.language.toUpperCase()}`,
    `TZ ${Intl.DateTimeFormat().resolvedOptions().timeZone.toUpperCase()}`,
    `REDUCED MOTION ${matchMedia('(prefers-reduced-motion: reduce)').matches ? 'ON' : 'OFF'}`,
    `COLOR ${matchMedia('(dynamic-range: high)').matches ? 'HDR' : 'SDR'}`,
  ];
}
