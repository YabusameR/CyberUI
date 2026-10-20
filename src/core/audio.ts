// Programmatic UI sounds via Web Audio — no audio files, zero network latency.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export type FuiSound = 'click' | 'confirm' | 'alert' | 'hover' | 'noise';

export interface BeepOptions {
  frequency?: number;
  /** Seconds. */
  duration?: number;
  type?: OscillatorType;
  volume?: number;
  /** Frequency at the end of the beep (pitch slide). */
  slideTo?: number;
}

export function playBeep({ frequency = 880, duration = 0.06, type = 'sine', volume = 0.08, slideTo }: BeepOptions = {}) {
  const ac = getContext();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export function playNoise(duration = 0.05, volume = 0.05) {
  const ac = getContext();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;
  gain.gain.value = volume;
  src.buffer = buffer;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

export function playSound(sound: FuiSound) {
  switch (sound) {
    case 'click':
      return playBeep({ frequency: 1320, duration: 0.05, type: 'square', volume: 0.04, slideTo: 880 });
    case 'confirm':
      playBeep({ frequency: 660, duration: 0.07, type: 'sine', volume: 0.07 });
      setTimeout(() => playBeep({ frequency: 990, duration: 0.09, type: 'sine', volume: 0.07 }), 70);
      return;
    case 'alert':
      return playBeep({ frequency: 440, duration: 0.18, type: 'sawtooth', volume: 0.05, slideTo: 220 });
    case 'hover':
      return playBeep({ frequency: 2400, duration: 0.02, type: 'sine', volume: 0.015 });
    case 'noise':
      return playNoise();
  }
}
