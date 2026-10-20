import { useCallback, useEffect, useMemo, useState } from 'react';
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
  GlitchBox,
  HolographicPanel,
  HudFrame,
  HudRadar,
  HudToggle,
  RadarBlip,
  ScanlineOverlay,
  StatusBadge,
  Typewriter,
  playSound,
  useAnimation,
} from '../src';

const MODES: AnimationMode[] = ['cinematic', 'balanced', 'minimal', 'reduced-motion'];
const THEMES: FuiTheme[] = ['cyan', 'magenta', 'amber'];

const LOG_EVENTS = [
  'SYS_INIT_SUCCESSFUL',
  'CONNECT_GRID_NODE_07',
  'TELEMETRY_STABLE_60FPS',
  'UPLINK_HANDSHAKE_OK',
  'PING 12ms // NODE_03',
  'THERMAL_NOMINAL 41.2C',
  'PACKET_LOSS 0.00%',
  'SECTOR_GRID_SYNC',
  'CIPHER_ROTATE AES-256',
  'DRONE_04 RTB',
];
const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
const nextLog = () => (Math.random() < 0.35 ? `0x${hex(8)} :: ${hex(4)}-${hex(4)}` : LOG_EVENTS[Math.floor(Math.random() * LOG_EVENTS.length)]);

const randomBlips = (): RadarBlip[] =>
  Array.from({ length: 5 }, (_, i) => ({
    id: i,
    angle: Math.random() * 360,
    distance: 0.25 + Math.random() * 0.7,
    label: `TGT-${String(i + 1).padStart(2, '0')}`,
    tone: i === 0 ? 'danger' : undefined,
  }));

function ModeReadout() {
  const { mode, requestedMode } = useAnimation();
  return (
    <span className="font-mono text-[11px] text-cyan-200/60">
      MOTION: {mode.toUpperCase()}
      {mode !== requestedMode && ' (OS PREFERS REDUCED MOTION)'}
    </span>
  );
}

export function App() {
  const [mode, setMode] = useState<AnimationMode>('balanced');
  const [theme, setTheme] = useState<FuiTheme>('cyan');
  const [sound, setSound] = useState(true);
  const [bootKey, setBootKey] = useState(0);

  return (
    <FuiGridProvider key={bootKey} theme={theme} animationMode={mode} sound={sound} className="min-h-screen">
      {mode === 'cinematic' && <ScanlineOverlay fixed intensity={0.22} />}
      <Dashboard
        mode={mode}
        theme={theme}
        sound={sound}
        onMode={setMode}
        onTheme={setTheme}
        onSound={setSound}
        onReboot={() => setBootKey((k) => k + 1)}
      />
    </FuiGridProvider>
  );
}

interface DashboardProps {
  mode: AnimationMode;
  theme: FuiTheme;
  sound: boolean;
  onMode: (m: AnimationMode) => void;
  onTheme: (t: FuiTheme) => void;
  onSound: (s: boolean) => void;
  onReboot: () => void;
}

function Dashboard({ mode, theme, sound, onMode, onTheme, onSound, onReboot }: DashboardProps) {
  const [sectorStatus, setSectorStatus] = useState('SECURED');
  const [energyLevel, setEnergyLevel] = useState(87.4);
  const [blips, setBlips] = useState(randomBlips);
  const [alert, setAlert] = useState(false);
  const [shields, setShields] = useState(true);
  const [stealth, setStealth] = useState(false);
  const [autopilot, setAutopilot] = useState(true);
  const [metrics, setMetrics] = useState({ lat: 35.6895, lon: 139.6917, alt: 1204, vel: 342 });

  useEffect(() => {
    const id = setInterval(() => {
      setMetrics((m) => ({
        lat: +(m.lat + (Math.random() - 0.5) * 0.002).toFixed(4),
        lon: +(m.lon + (Math.random() - 0.5) * 0.002).toFixed(4),
        alt: Math.round(m.alt + (Math.random() - 0.5) * 40),
        vel: Math.round(m.vel + (Math.random() - 0.5) * 12),
      }));
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const handleScan = () => {
    setSectorStatus('SCANNING...');
    setTimeout(() => {
      setSectorStatus('SECURED');
      setBlips(randomBlips());
      setEnergyLevel((prev) => Math.max(0, Math.min(100, +(prev + (Math.random() * 10 - 6)).toFixed(1))));
    }, 1200);
  };

  const handleOverride = () => {
    setAlert(true);
    setSectorStatus('OVERRIDE');
    setTimeout(() => {
      setAlert(false);
      setSectorStatus('SECURED');
    }, 1400);
  };

  const scanning = sectorStatus === 'SCANNING...';
  const generate = useCallback(nextLog, []);
  const coords = useMemo(
    () => ['LAT 35.6895N', 'LON 139.6917E', 'GRID 54SUE', 'HDG 274°', 'WIND 12KT', 'VIS 10KM', 'SAT LOCK 11/12', 'UPLINK 98.2%', 'NODE_07 ONLINE'],
    [],
  );

  return (
    <HudFrame className="p-4 md:p-6 m-2 md:m-5 min-h-[calc(100vh-2.5rem)]" animatedBorder>
      <BootSequence staggerDelay={0.12}>
        <FuiGrid cols={12} gap="md" showGridLines crosshairs>
          {/* Header */}
          <FuiGridItem span={12} coordinate="SYS-HDR">
            <div className="flex flex-wrap gap-3 justify-between items-center bg-cyan-950/30 p-4 border-b border-current/30">
              <h1 className="text-lg md:text-2xl font-mono tracking-[0.2em] text-[var(--fui-accent)] m-0">
                <DataScrambleText text="TACTICAL COMMAND // SYSTEM_v3.0" triggerOnMount />
              </h1>
              <div className="flex items-center gap-3">
                <ModeReadout />
                <StatusBadge status={alert ? 'ERROR' : scanning ? 'WARNING' : 'ONLINE'} pulse />
              </div>
            </div>
          </FuiGridItem>

          {/* Config strip */}
          <FuiGridItem span={12} coordinate="SYS-CFG" label="RENDER_PIPELINE">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Animation mode">
                {MODES.map((m) => (
                  <CyberButton key={m} size="sm" variant={m === mode ? 'cyan' : 'ghost'} aria-pressed={m === mode} onClick={() => onMode(m)} soundOnClick>
                    {m}
                  </CyberButton>
                ))}
              </div>
              <div className="flex gap-2" role="group" aria-label="Theme">
                {THEMES.map((t) => (
                  <CyberButton key={t} size="sm" variant={t === theme ? t : 'ghost'} aria-pressed={t === theme} onClick={() => onTheme(t)} soundOnClick>
                    {t}
                  </CyberButton>
                ))}
              </div>
              <HudToggle label="Audio FX" checked={sound} onChange={onSound} sound />
              <CyberButton size="sm" variant="amber" onClick={onReboot} soundOnClick="confirm">
                ↻ Reboot
              </CyberButton>
            </div>
          </FuiGridItem>

          {/* Main view (70%) */}
          <FuiGridItem span={8} coordinate="MAIN-MAP" label="PRIMARY_TACTICAL_VIEW">
            <GlitchBox trigger="manual" active={alert} intensity="high" className="h-full">
              <HolographicPanel className="min-h-[480px] h-full p-4 md:p-6 flex flex-col justify-between" flickerEffect scanlines>
                <div className="flex-1 flex flex-wrap items-center justify-around gap-8 py-6 border border-dashed border-cyan-800/40 relative overflow-hidden">
                  <CircularGauge value={energyLevel} label="ENERGY_OUTPUT" animatedSweep thresholds={{ warning: 40, danger: 20 }} invertThresholds />
                  <HudRadar blips={blips} label="SECTOR_RADAR" size={240} />
                </div>
                <div className="flex flex-wrap gap-3 justify-between items-center mt-4">
                  <span className="font-mono text-xs text-cyan-200/70">
                    STATUS: <DataScrambleText text={sectorStatus} className="text-[var(--fui-accent)]" />
                  </span>
                  <CyberButton variant={theme} soundOnClick onClick={handleScan} disabled={scanning} animateHover>
                    INITIATE SECTOR SCAN
                  </CyberButton>
                </div>
              </HolographicPanel>
            </GlitchBox>
          </FuiGridItem>

          {/* Side telemetry (30%) */}
          <FuiGridItem span={4} coordinate="SIDE-LOG" label="TELEMETRY_FEED">
            <HolographicPanel className="min-h-[480px] h-full p-4 flex flex-col justify-between gap-4">
              <div className="font-mono text-xs space-y-2">
                <p className="text-[var(--fui-accent)] border-b border-current/30 pb-1 m-0">&gt; LOG_OUTPUT_STREAM</p>
                <DataStreamTicker items={LOG_EVENTS.slice(0, 3)} generate={generate} interval={1100} maxLines={14} timestamp className="h-[300px]" />
              </div>
              <CyberButton variant="danger" soundOnClick fullWidth onClick={handleOverride}>
                EMERGENCY OVERRIDE
              </CyberButton>
            </HolographicPanel>
          </FuiGridItem>

          {/* Secondary row */}
          <FuiGridItem span={{ md: 6, lg: 4 }} coordinate="SEC-01:A" label="NAV_TELEMETRY">
            <HolographicPanel className="p-4 h-full">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 m-0 font-mono">
                {[
                  ['LATITUDE', <AnimatedNumber key="a" value={metrics.lat} decimals={4} suffix="°N" />],
                  ['LONGITUDE', <AnimatedNumber key="b" value={metrics.lon} decimals={4} suffix="°E" />],
                  ['ALTITUDE', <AnimatedNumber key="c" value={metrics.alt} pad={5} suffix=" M" />],
                  ['VELOCITY', <AnimatedNumber key="d" value={metrics.vel} pad={4} suffix=" KM/H" />],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-[10px] tracking-[0.25em] text-cyan-200/50">{k}</dt>
                    <dd className="m-0 text-lg text-[var(--fui-accent)]">{v}</dd>
                  </div>
                ))}
              </dl>
            </HolographicPanel>
          </FuiGridItem>

          <FuiGridItem span={{ md: 6, lg: 4 }} coordinate="SEC-01:B" label="SUBSYSTEMS">
            <HolographicPanel className="p-4 h-full flex flex-col gap-3">
              <HudToggle label="Deflector shields" checked={shields} onChange={setShields} sound tone="success" />
              <HudToggle label="Stealth mode" checked={stealth} onChange={setStealth} sound tone="magenta" />
              <HudToggle label="Autopilot" checked={autopilot} onChange={setAutopilot} sound />
              <div className="flex flex-wrap gap-2 pt-1">
                <StatusBadge status={shields ? 'ONLINE' : 'OFFLINE'} label="SHIELD" pulse />
                <StatusBadge status={stealth ? 'SCANNING' : 'STANDBY'} label="CLOAK" pulse={stealth} />
                <StatusBadge status={autopilot ? 'ONLINE' : 'WARNING'} label="NAV-AI" pulse />
              </div>
            </HolographicPanel>
          </FuiGridItem>

          <FuiGridItem span={{ md: 12, lg: 4 }} coordinate="SEC-01:C" label="COMMS_TERMINAL">
            <HolographicPanel className="p-4 h-full font-mono text-xs leading-relaxed" onClick={() => sound && playSound('noise')}>
              <p className="m-0 text-cyan-200/50">&gt; INCOMING TRANSMISSION</p>
              <p className="m-0 mt-2">
                <Typewriter text="COMMAND TO ALL UNITS: SECTOR 7 PERIMETER HOLDING. MAINTAIN SILENT RUNNING UNTIL 0400. AWAIT FURTHER ORDERS." />
              </p>
              <p className="m-0 mt-3 text-cyan-200/50">
                HOVER TO DECRYPT: <DataScrambleText text="KEY-7F3A-91C0-DD2E" className="text-[var(--fui-accent)] cursor-crosshair" />
              </p>
            </HolographicPanel>
          </FuiGridItem>

          {/* Footer stream */}
          <FuiGridItem span={12} coordinate="SYS-FTR">
            <DataStreamTicker direction="horizontal" items={coords} speed={40} className="py-2 border-y border-current/20 text-[var(--fui-accent)]" />
          </FuiGridItem>
        </FuiGrid>
      </BootSequence>
    </HudFrame>
  );
}
