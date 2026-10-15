// Sound effects, all made in code with Web Audio. No sound files.
import { audio } from './context';

let soundLifetime: AbortSignal | undefined;

export const soundFor = (signal?: AbortSignal) => <A extends unknown[]>(effect: (...args: A) => void, ...args: A) => {
  if (signal?.aborted) return;
  const previous = soundLifetime;
  soundLifetime = signal;
  try { effect(...args); }
  finally { soundLifetime = previous; }
};

function ownSound(source: AudioScheduledSourceNode, cancelled?: () => void) {
  const signal = soundLifetime;
  if (!signal) return;
  const release = () => { signal.removeEventListener('abort', stop); source.removeEventListener('ended', release); };
  const stop = () => { release(); try { source.stop(); } catch {} cancelled?.(); };
  if (signal.aborted) stop();
  else {
    signal.addEventListener('abort', stop, { once: true });
    source.addEventListener('ended', release, { once: true });
  }
}

export function tone(f: number, dur: number, type: OscillatorType = 'sine', when = 0, vol = 0.15, slide?: number) {
  try {
    const c = audio(), t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
    ownSound(o);
  } catch { /* no audio: play on silently */ }
}

export interface NoiseOpts { dur: number; vol?: number; type?: BiquadFilterType; f?: number; f2?: number; when?: number; beat?: number; grow?: boolean }
export function noise({ dur, vol = 0.25, type = 'lowpass', f = 800, f2, when = 0, beat = 0, grow = false }: NoiseOpts) {
  try {
    const c = audio(), t = c.currentTime + when, b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b;
    fl.type = type;
    fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    if (beat) for (let x = 0; x < dur; x += beat) { const v = grow ? vol * (0.25 + (0.75 * x) / dur) : vol; g.gain.setValueAtTime(v, t + x); g.gain.setValueAtTime(v * 0.15, t + x + beat * 0.5); }
    else { g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); }
    s.connect(fl).connect(g).connect(c.destination);
    s.start(t);
    ownSound(s);
  } catch { /* no audio */ }
}

export const sGood = () => { tone(523, 0.15, 'triangle'); tone(659, 0.15, 'triangle', 0.12); tone(784, 0.3, 'triangle', 0.24); };
export const sBad = () => tone(160, 0.3, 'square', 0, 0.08);
export const sClink = (when = 0) => { tone(1800, 0.08, 'triangle', when, 0.1); tone(2600, 0.1, 'triangle', when + 0.04, 0.06); };
export const sCount = (i: number) => tone(400 + i * 60, 0.12, 'triangle', 0, 0.1);
export const sFanfare = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', i * 0.12, 0.14));

/** The five Horn Mods, by Rung: Beep, Honk, Air Horn, Roar, Train Horn. */
export const HORNS: readonly (() => void)[] = [
  () => tone(880, 0.18, 'square', 0, 0.2),
  () => { tone(392, 0.45, 'sawtooth', 0, 0.14); tone(494, 0.45, 'sawtooth', 0, 0.14); },
  () => { tone(233, 1, 'sawtooth', 0, 0.16); tone(311, 1, 'sawtooth', 0, 0.16); tone(370, 1, 'sawtooth', 0, 0.1); },
  () => { tone(110, 1.2, 'sawtooth', 0, 0.3, 45); tone(160, 1.1, 'square', 0, 0.1, 60); noise({ dur: 1.1, f: 500 }); },
  () => { for (const w of [0, 0.75]) for (const f of [185, 233, 277, 370]) tone(f, w ? 1.3 : 0.55, 'sawtooth', w, 0.09); }, // a three-chime train horn, twice
];
/** The five Engine Mods, by Rung, each beefier than the last: Putt-Putt, Rumble, V8, Jet Turbine, Rocket. */
export const ENGINES: readonly (() => void)[] = [
  () => { for (let i = 0; i < 5; i++) tone(95, 0.07, 'square', i * 0.14, 0.1, 80); },
  () => { tone(55, 0.9, 'sawtooth', 0, 0.16, 75); noise({ dur: 0.9, vol: 0.18, f: 250, beat: 0.07 }); },
  () => { tone(58, 1.1, 'sawtooth', 0, 0.2, 190); tone(87, 1.1, 'square', 0, 0.07, 280); noise({ dur: 1.1, vol: 0.28, f: 450, beat: 0.045, grow: true }); },
  () => { tone(420, 1.4, 'sawtooth', 0, 0.05, 2600); tone(70, 1.4, 'sawtooth', 0, 0.16, 120); noise({ dur: 1.4, vol: 0.32, type: 'bandpass', f: 500, f2: 3200 }); },
  () => { // a whoosh as it lights, then a roar
    noise({ dur: 0.5, vol: 0.3, type: 'bandpass', f: 300, f2: 4000 });
    noise({ dur: 1.6, vol: 0.5, f: 1400, when: 0.35 }); tone(48, 1.6, 'sawtooth', 0.35, 0.28, 32); tone(96, 1.4, 'square', 0.35, 0.08, 60);
  },
];
/** The Siren Roof Topper: a wail that rises and falls twice. A wail already going isn't doubled up. */
let sirenUntil = 0;
let siren: OscillatorNode | null = null;
export function sSiren() {
  try {
    const c = audio(), t = c.currentTime;
    if (t < sirenUntil) return;
    sirenUntil = t + 1.8;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(620, t);
    for (const k of [0, 1]) { o.frequency.linearRampToValueAtTime(1250, t + k * 0.9 + 0.45); o.frequency.linearRampToValueAtTime(620, t + k * 0.9 + 0.9); }
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.08);
    g.gain.setValueAtTime(0.07, t + 1.6);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 1.85);
    siren = o;
    ownSound(o, () => { if (siren === o) { siren = null; sirenUntil = 0; } });
  } catch { /* no audio */ }
}
export const sNope = () => tone(220, 0.22, 'square', 0, 0.08, 160);

// ---------- celebration sounds ----------
export const sChime = () => { tone(1319, 0.35, 'triangle', 0, 0.12); tone(1760, 0.45, 'triangle', 0.08, 0.1); };
export const sBigFanfare = () => {
  [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', i * 0.13, 0.14));
  [1047, 1319, 1568].forEach(f => tone(f, 1.2, 'triangle', 0.8, 0.09));
};
export const sDrumroll = (dur: number) => noise({ dur, vol: 0.3, type: 'bandpass', f: 1200, beat: 0.05, grow: true });
export const sWhoosh = (dur = 0.5) => noise({ dur, vol: 0.3, type: 'bandpass', f: 400, f2: 3500 });
export const sEngine = (dur = 0.9) => { tone(55, dur, 'sawtooth', 0, 0.12, 150); tone(82, dur, 'square', 0, 0.05, 220); };
export const sCrunch = () => { noise({ dur: 0.3, vol: 0.5, f: 900 }); tone(120, 0.3, 'square', 0, 0.12, 50); };
export const sThud = () => { tone(90, 0.35, 'sine', 0, 0.4, 40); noise({ dur: 0.2, vol: 0.3, f: 300 }); };
export const sHonk = () => { tone(392, 0.4, 'sawtooth', 0, 0.1); tone(494, 0.4, 'sawtooth', 0, 0.1); };
export const sBoing = () => tone(260, 0.25, 'sine', 0, 0.2, 780);
export const sPop = () => { noise({ dur: 0.15, vol: 0.35, type: 'highpass', f: 1500 }); noise({ dur: 0.6, vol: 0.08, type: 'highpass', f: 4000, when: 0.1, beat: 0.06 }); };

// ---------- Show Off ----------
/** A crowd cheering: a swell of noise with whistles on top. */
export const sCheer = () => {
  noise({ dur: 2.2, vol: 0.22, type: 'bandpass', f: 900, f2: 1400, beat: 0.04 });
  noise({ dur: 2.4, vol: 0.12, type: 'bandpass', f: 2400 });
  tone(1900, 0.5, 'sine', 0.3, 0.05, 2600); tone(2200, 0.4, 'sine', 0.9, 0.04, 1600);
};
