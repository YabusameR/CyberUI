import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AnimatedNumber,
  AnimationMode,
  BootSequence,
  CircularGauge,
  CyberButton,
  DataScrambleText,
  DataStreamTicker,
  FuiGrid,
  FuiGridItem,
  FuiGridProvider,
  FuiTheme,
  HolographicPanel,
  HudFrame,
  HudRadar,
  HudToggle,
  RadarBlip,
  ScanlineOverlay,
  StatusBadge,
  StatusKind,
  useAnimation,
} from '../src';
import {
  deviceSummary,
  useFrameStats,
  useHeap,
  useLongTasks,
  useNavigationTiming,
  useNetworkStatus,
  usePing,
} from './useSystemMetrics';

const MODES: AnimationMode[] = ['cinematic', 'balanced', 'minimal', 'reduced-motion'];
const THEMES: FuiTheme[] = ['cyan', 'magenta', 'amber'];
const LATENCY_SCALE = 300; // ms at the radar's outer ring

export function App() {
  const [mode, setMode] = useState<AnimationMode>('balanced');
  const [theme, setTheme] = useState<FuiTheme>('cyan');
  const [sound, setSound] = useState(true);
  const [scanlines, setScanlines] = useState(false);
  const [bootKey, setBootKey] = useState(0);
  const [log, setLog] = useState<string[]>(['MONITOR STARTED']);
  const addLog = useCallback((line: string) => setLog((l) => [...l, line].slice(-200)), []);

  return (
    <FuiGridProvider key={bootKey} theme={theme} animationMode={mode} sound={sound} className="min-h-screen py-2 px-2 md:py-5 md:px-5">
      {scanlines && <ScanlineOverlay fixed intensity={0.22} />}
      <Monitor
        mode={mode}
        theme={theme}
        sound={sound}
        scanlines={scanlines}
        log={log}
        addLog={addLog}
        onMode={(m) => (setMode(m), addLog(`ANIMATION MODE → ${m.toUpperCase()}`))}
        onTheme={(t) => (setTheme(t), addLog(`THEME → ${t.toUpperCase()}`))}
        onSound={(s) => (setSound(s), addLog(`AUDIO FX ${s ? 'ON' : 'OFF'}`))}
        onScanlines={(s) => (setScanlines(s), addLog(`SCANLINES ${s ? 'ON' : 'OFF'}`))}
        onReboot={() => (setBootKey((k) => k + 1), addLog('REBOOT SEQUENCE'))}
        onClearLog={() => setLog([])}
      />
    </FuiGridProvider>
  );
}

interface MonitorProps {
  mode: AnimationMode;
  theme: FuiTheme;
  sound: boolean;
  scanlines: boolean;
  log: string[];
  addLog: (line: string) => void;
  onMode: (m: AnimationMode) => void;
  onTheme: (t: FuiTheme) => void;
  onSound: (s: boolean) => void;
  onScanlines: (s: boolean) => void;
  onReboot: () => void;
  onClearLog: () => void;
}

function MotionReadout() {
  const { mode, requestedMode } = useAnimation();
  return (
    <span className="font-mono text-[11px] opacity-60">
      MOTION: {mode.toUpperCase()}
      {mode !== requestedMode && ' (OS SETTING)'}
    </span>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-sm tabular-nums text-[var(--fui-accent)]">{now.toLocaleTimeString('en-GB')}</span>;
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] tracking-[0.25em] opacity-50">{label}</dt>
      <dd className="m-0 text-lg font-mono tabular-nums text-[var(--fui-accent)] truncate">{children}</dd>
    </div>
  );
}

function Monitor(props: MonitorProps) {
  const { mode, theme, sound, scanlines, log, addLog } = props;
  const [stress, setStress] = useState(false);
  const [autoPing, setAutoPing] = useState(true);
  const [startedAt] = useState(() => Date.now());
  const [uptime, setUptime] = useState(0);

  const { fps, frameTime } = useFrameStats(stress);
  const { heap, domNodes } = useHeap();
  const timing = useNavigationTiming();
  const net = useNetworkStatus((online) => addLog(online ? 'NETWORK ONLINE' : 'NETWORK OFFLINE'));
  const { samples, pending, ping } = usePing((ms) => addLog(ms === null ? 'PING FAILED' : `PING ${ms}ms`));
  useLongTasks((ms) => addLog(`LONG TASK ${ms}ms ON MAIN THREAD`));

  useEffect(() => {
    const id = setInterval(() => setUptime(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    void ping();
    if (!autoPing) return;
    const id = setInterval(() => void ping(), 5000);
    return () => clearInterval(id);
  }, [autoPing, ping]);

  useEffect(() => {
    const onVis = () => addLog(document.hidden ? 'TAB HIDDEN' : 'TAB VISIBLE');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [addLog]);

  const lastPing = samples.at(-1)?.ms;
  const pings = samples.map((s) => s.ms);
  const avgPing = pings.length ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : 0;

  // Each ping becomes a radar blip: bearing = sample slot, distance = latency.
  const blips: RadarBlip[] = samples.map((s, i) => ({
    id: s.at,
    angle: i * 30,
    distance: Math.min(1, s.ms / LATENCY_SCALE),
    label: i === samples.length - 1 ? `${s.ms}ms` : undefined,
    tone: s.ms > LATENCY_SCALE ? 'danger' : s.ms > 150 ? 'amber' : undefined,
  }));

  const health: StatusKind = !net.online || fps < 20 ? 'ERROR' : fps < 50 || (lastPing ?? 0) > LATENCY_SCALE ? 'WARNING' : 'ONLINE';
  const healthText = { ONLINE: 'NOMINAL', WARNING: 'DEGRADED', ERROR: 'CRITICAL' }[health as 'ONLINE' | 'WARNING' | 'ERROR'];
  const device = useMemo(deviceSummary, []);
  const hms = (s: number) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':');

  return (
    <HudFrame className="p-4 md:p-6 mx-auto max-w-[1600px]" animatedBorder>
      <BootSequence staggerDelay={0.1}>
        <FuiGrid cols={12} gap="md" showGridLines crosshairs>
          {/* Header */}
          <FuiGridItem span={12} coordinate="SYS-HDR">
            <div className="flex flex-wrap gap-3 justify-between items-center p-4 border-b border-current/30 bg-[rgb(var(--fui-accent-rgb)/0.05)]">
              <h1 className="m-0 text-lg md:text-2xl font-mono tracking-[0.2em] text-[var(--fui-accent)]">
                <DataScrambleText text="BROWSER RUNTIME MONITOR" triggerOnMount />
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <MotionReadout />
                <Clock />
                <StatusBadge status={health} label={healthText} pulse />
              </div>
            </div>
          </FuiGridItem>

          {/* Settings */}
          <FuiGridItem span={12} coordinate="SYS-CFG" label="DISPLAY_SETTINGS">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Animation mode">
                {MODES.map((m) => (
                  <CyberButton key={m} size="sm" variant={m === mode ? 'cyan' : 'ghost'} aria-pressed={m === mode} onClick={() => props.onMode(m)} soundOnClick>
                    {m}
                  </CyberButton>
                ))}
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Theme">
                {THEMES.map((t) => (
                  <CyberButton key={t} size="sm" variant={t === theme ? t : 'ghost'} aria-pressed={t === theme} onClick={() => props.onTheme(t)} soundOnClick>
                    {t}
                  </CyberButton>
                ))}
              </div>
              <HudToggle label="Audio FX" checked={sound} onChange={props.onSound} sound />
              <HudToggle label="Scanlines" checked={scanlines} onChange={props.onScanlines} sound />
              <CyberButton size="sm" variant="amber" onClick={props.onReboot} soundOnClick="confirm">
                ↻ Replay boot
              </CyberButton>
            </div>
          </FuiGridItem>

          {/* Performance (70%) */}
          <FuiGridItem span={{ lg: 8 }} coordinate="PERF-01" label="RENDER_PERFORMANCE">
            <HolographicPanel className="h-full p-4 md:p-6 flex flex-col gap-4" flickerEffect scanlines>
              <div className="flex-1 flex flex-wrap items-center justify-around gap-x-6 gap-y-10 py-6 border border-dashed border-current/20">
                <CircularGauge value={fps} max={Math.max(60, fps)} decimals={0} unit="fps" label="FRAME_RATE" size={200} animatedSweep thresholds={{ warning: 50, danger: 30 }} invertThresholds />
                <CircularGauge value={frameTime} max={50} unit="ms" label="WORST_FRAME" size={200} thresholds={{ warning: 20, danger: 34 }} />
                <HudRadar blips={blips} label={`LATENCY · RING=${LATENCY_SCALE}ms`} size={200} />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 justify-between items-center">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <HudToggle label="Stress test" checked={stress} onChange={(v) => (setStress(v), addLog(`STRESS TEST ${v ? 'ENGAGED' : 'RELEASED'}`))} tone="danger" sound />
                  <HudToggle label="Auto ping 5s" checked={autoPing} onChange={setAutoPing} sound />
                </div>
                <CyberButton variant={theme} soundOnClick onClick={() => void ping()} disabled={pending}>
                  {pending ? 'MEASURING…' : 'RUN LATENCY TEST'}
                </CyberButton>
              </div>
            </HolographicPanel>
          </FuiGridItem>

          {/* Event log (30%) */}
          <FuiGridItem span={{ lg: 4 }} coordinate="LOG-01" label="EVENT_LOG">
            <HolographicPanel className="h-full p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-current/30 pb-1 font-mono text-xs text-[var(--fui-accent)]">
                <span>&gt; EVENT_STREAM</span>
                <span className="opacity-60">{log.length} EVENTS</span>
              </div>
              <DataStreamTicker items={log} maxLines={16} timestamp className="flex-1 min-h-[260px]" />
              <CyberButton variant="ghost" size="sm" fullWidth onClick={props.onClearLog} soundOnClick>
                CLEAR LOG
              </CyberButton>
            </HolographicPanel>
          </FuiGridItem>

          {/* Detail panels */}
          <FuiGridItem span={{ md: 6, lg: 4 }} coordinate="NET-01" label="NETWORK">
            <HolographicPanel className="p-4 h-full flex flex-col gap-4">
              <StatusBadge status={net.online ? 'ONLINE' : 'OFFLINE'} pulse={net.online} className="self-start" />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 m-0">
                <Stat label="LAST PING">{lastPing !== undefined ? <AnimatedNumber value={lastPing} suffix=" ms" /> : '—'}</Stat>
                <Stat label="AVG (12)">{pings.length ? <AnimatedNumber value={avgPing} suffix=" ms" /> : '—'}</Stat>
                <Stat label="LINK TYPE">{net.effectiveType?.toUpperCase() ?? 'N/A'}</Stat>
                <Stat label="DOWNLINK">{net.downlink !== undefined ? `${net.downlink} Mb/s` : 'N/A'}</Stat>
              </dl>
            </HolographicPanel>
          </FuiGridItem>

          <FuiGridItem span={{ md: 6, lg: 4 }} coordinate="MEM-01" label="RUNTIME">
            <HolographicPanel className="p-4 h-full">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 m-0">
                <Stat label="JS HEAP">{heap ? <AnimatedNumber value={heap.usedMB} decimals={1} suffix=" MB" /> : 'N/A'}</Stat>
                <Stat label="HEAP LIMIT">{heap ? `${Math.round(heap.limitMB)} MB` : 'N/A'}</Stat>
                <Stat label="DOM NODES">
                  <AnimatedNumber value={domNodes} />
                </Stat>
                <Stat label="UPTIME">{hms(uptime)}</Stat>
              </dl>
            </HolographicPanel>
          </FuiGridItem>

          <FuiGridItem span={{ md: 12, lg: 4 }} coordinate="NAV-01" label="PAGE_LOAD">
            <HolographicPanel className="p-4 h-full">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 m-0">
                <Stat label="TTFB">{timing ? <AnimatedNumber value={timing.ttfb} suffix=" ms" /> : '—'}</Stat>
                <Stat label="DOM READY">{timing ? <AnimatedNumber value={timing.dcl} suffix=" ms" /> : '—'}</Stat>
                <Stat label="FULL LOAD">{timing ? <AnimatedNumber value={timing.load} suffix=" ms" /> : '—'}</Stat>
                <Stat label="RESOURCES">{timing ? `${timing.resources} / ${timing.transferKB} KB` : '—'}</Stat>
              </dl>
            </HolographicPanel>
          </FuiGridItem>

          {/* Footer */}
          <FuiGridItem span={12} coordinate="DEV-01">
            <DataStreamTicker direction="horizontal" items={device} speed={45} className="py-2 border-y border-current/20 text-[var(--fui-accent)]" />
          </FuiGridItem>
        </FuiGrid>
      </BootSequence>
    </HudFrame>
  );
}
