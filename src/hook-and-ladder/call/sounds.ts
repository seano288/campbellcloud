// The Call's sounds, made in code (no files): each Siren he can buy, the hose hissing while he sprays (louder with a bigger Hose),
// a sizzle when a fire goes out, the ladder's motor, the tank refilling. Built on the shared tone() and noise() in src/audio/sfx.ts.
import { audio } from '../../audio/context';
import { noise, tone } from '../../audio/sfx';
import type { SirenId } from '../station/parts';

let sirenUntil = 0;
/** One go of his siren, about two seconds. A siren already sounding isn't doubled up. */
export function siren(id: SirenId) {
  let now = 0;
  try { now = audio().currentTime; } catch { return; }
  if (now < sirenUntil) return;
  sirenUntil = now + 1.8;
  try {
    const c = audio(), t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = id === 'airhorn' || id === 'bighorn' ? 'square' : id === 'silly' ? 'triangle' : 'sawtooth';
    const f = o.frequency;
    if (id === 'wail') { f.setValueAtTime(600, t); f.linearRampToValueAtTime(1200, t + 0.8); f.linearRampToValueAtTime(600, t + 1.7); }
    else if (id === 'yelp') { for (let k = 0; k < 6; k++) { f.setValueAtTime(700, t + k * 0.28); f.linearRampToValueAtTime(1300, t + k * 0.28 + 0.26); } }
    else if (id === 'hilo') { for (let k = 0; k < 4; k++) { f.setValueAtTime(960, t + k * 0.42); f.setValueAtTime(720, t + k * 0.42 + 0.21); } }
    else if (id === 'whoop') { for (let k = 0; k < 3; k++) { f.setValueAtTime(400, t + k * 0.58); f.exponentialRampToValueAtTime(1400, t + k * 0.58 + 0.5); } }
    else if (id === 'airhorn') { f.setValueAtTime(220, t); f.setValueAtTime(220, t + 0.6); f.setValueAtTime(0.01, t + 0.62); f.setValueAtTime(220, t + 0.8); }
    else if (id === 'bighorn') { f.setValueAtTime(110, t); f.linearRampToValueAtTime(140, t + 1.6); }
    else if (id === 'silly') { for (let k = 0; k < 4; k++) { f.setValueAtTime(300, t + k * 0.42); f.exponentialRampToValueAtTime(900, t + k * 0.42 + 0.2); f.exponentialRampToValueAtTime(250, t + k * 0.42 + 0.4); } }
    else { f.setValueAtTime(1600, t); }
    const vol = id === 'bighorn' ? 0.12 : id === 'airhorn' ? 0.09 : 0.06;
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
    g.gain.setValueAtTime(vol, t + 1.6); g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    if (id === 'bell') {
      // a fire bell: rings, no wail
      for (let k = 0; k < 8; k++) { tone(1568, 0.18, 'triangle', k * 0.2, 0.09); tone(2093, 0.14, 'sine', k * 0.2, 0.05); }
      return;
    }
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 1.85);
  } catch { /* no audio */ }
}

/** The hose's hiss: on while he sprays. */
export function createHose(size: number) {
  let node: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  try {
    const c = audio(), n = Math.floor(c.sampleRate * 1.5), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    src.buffer = buf; src.loop = true;
    filter.type = 'bandpass'; filter.frequency.value = 2400 - size * 150; filter.Q.value = 0.7;
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
    node = { src, gain };
  } catch { /* no audio */ }
  return {
    set(on: boolean) {
      if (!node) return;
      try { const c = audio(); node.gain.gain.setTargetAtTime(on ? 0.05 + size * 0.01 : 0, c.currentTime, 0.05); } catch { /* */ }
    },
    stop() { try { node?.src.stop(); node?.src.disconnect(); } catch { /* */ } node = null; },
  };
}

export const sizzle = () => noise({ dur: 0.6, vol: 0.22, type: 'highpass', f: 3000, f2: 6000 });
export const whirr = () => { tone(90, 0.7, 'sawtooth', 0, 0.05, 140); };
export const gurgle = () => { for (let k = 0; k < 5; k++) tone(200 + k * 60, 0.12, 'sine', k * 0.12, 0.08, 120); };
export const chop = () => noise({ dur: 1.2, vol: 0.2, type: 'lowpass', f: 300, beat: 0.07 });
export const ding = () => { tone(1319, 0.3, 'triangle', 0, 0.1); tone(1760, 0.4, 'triangle', 0.1, 0.08); };
