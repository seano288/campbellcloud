// Deep Light's sounds, made in code (no files): a plucked string's hum (stopped when a finger stops it), a lighthouse beep, each horn
// he can buy, the sonar ping, the camera click and the claw's clunk. Built on the shared tone() and noise() in src/audio/sfx.ts.
import { audio } from '../audio/context';
import { noise, tone } from '../audio/sfx';
import type { HORNS } from './dock/parts';

/** A string humming for up to `dur` seconds; the returned stop() silences it at once, as a finger on the string does. */
export function hum(dur: number, vol = 0.12): () => void {
  try {
    const c = audio(), t = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o2.type = 'sine';
    o.frequency.setValueAtTime(196, t); o2.frequency.setValueAtTime(392, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); o2.connect(g); g.connect(c.destination);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    return () => { try { const n = c.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.06); o.stop(n + 0.08); o2.stop(n + 0.08); } catch {} };
  } catch { return () => {}; }
}

/** A lighthouse flash's beep: short or long. */
export const beep = (dur: number) => tone(880, dur, 'sine', 0, 0.08);
/** A loud or quiet sound, for the loud/quiet pictures (rings show it too, so the question never depends on the volume). */
export const loudness = (loud: number) => (loud >= 3 ? noise({ dur: 0.5, vol: 0.4, f: 500 }) : tone(1200, 0.12, 'sine', 0, 0.03));

export const ping = () => { tone(1480, 0.5, 'sine', 0, 0.06, 1400); tone(1480, 0.4, 'sine', 0.22, 0.02, 1400); };
export const click = () => { noise({ dur: 0.06, vol: 0.4, type: 'highpass', f: 2500 }); tone(2400, 0.05, 'square', 0.04, 0.04); };
export const clunk = () => { tone(140, 0.18, 'square', 0, 0.08, 90); noise({ dur: 0.12, vol: 0.2, f: 600 }); };
export const flashPop = () => { tone(3000, 0.3, 'sine', 0, 0.05, 6000); noise({ dur: 0.2, vol: 0.2, type: 'highpass', f: 3000 }); };
export const bubble = () => tone(500 + Math.random() * 300, 0.12, 'sine', 0, 0.04, 1100);

/** One toot of his horn. */
export function horn(id: (typeof HORNS)[number]['id']) {
  if (id === 'toot') { tone(330, 0.35, 'square', 0, 0.06); return; }
  if (id === 'beep') { tone(880, 0.12, 'square', 0, 0.05); tone(880, 0.12, 'square', 0.18, 0.05); return; }
  if (id === 'honk') { tone(392, 0.4, 'sawtooth', 0, 0.07); tone(494, 0.4, 'sawtooth', 0, 0.06); return; }
  if (id === 'foghorn') { tone(90, 1.1, 'sawtooth', 0, 0.12); tone(92, 1.1, 'square', 0, 0.05); return; }
  if (id === 'whale') { tone(300, 1.2, 'sine', 0, 0.12, 700); tone(600, 0.9, 'sine', 0.5, 0.06, 260); return; }
  if (id === 'bubble') { for (let i = 0; i < 6; i++) tone(400 + i * 90, 0.1, 'sine', i * 0.07, 0.06, 900 + i * 60); return; }
  if (id === 'dolphin') { for (let i = 0; i < 8; i++) tone(2400, 0.03, 'square', i * 0.05, 0.04); return; }
  if (id === 'trumpet') { [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'sawtooth', i * 0.14, 0.06)); return; }
  if (id === 'duck') { tone(620, 0.16, 'sawtooth', 0, 0.07, 380); tone(620, 0.16, 'sawtooth', 0.22, 0.07, 380); return; }
  if (id === 'robot') { [880, 660, 990, 550].forEach((f, i) => tone(f, 0.09, 'square', i * 0.1, 0.05)); return; }
  if (id === 'tune') { [392, 440, 494, 587, 494].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.18, 0.08)); return; }
  tone(300, 0.25, 'triangle', 0, 0.08, 900); tone(900, 0.25, 'triangle', 0.25, 0.08, 250);
}
