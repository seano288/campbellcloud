// The Camp's sounds, synthesised like the rest of the family's effects (src/audio/sfx.ts): a marching drum, a bugle, the
// pop of a foam ball, the splash of a water balloon, a robot's wind-up whirr and its clatter as it falls.
import { noise, tone } from '../../audio/sfx';

/** Snare and bass drum: rat-a-tat, BOOM. */
const snare = (when = 0, vol = 0.22) => noise({ dur: 0.09, vol, type: 'highpass', f: 1800, when });
const bass = (when = 0) => tone(70, 0.22, 'sine', when, 0.35, 45);
export function sMarch() { snare(0); snare(0.12, 0.14); snare(0.24, 0.14); bass(0.36); snare(0.6); bass(0.84); }
/** One beat of the parade drum: left (a bass drum) or right (a snare). */
export const sStep = (left: boolean) => (left ? bass() : snare(0, 0.16));
/** A bugle call: da-da-da-DAAA. */
export function sBugle() {
  [392, 523, 659].forEach((f, i) => tone(f, 0.16, 'triangle', i * 0.18, 0.12));
  tone(784, 0.6, 'triangle', 0.56, 0.14);
  tone(784 * 2, 0.6, 'sine', 0.56, 0.03);
}
/** A new soldier: a quick drum roll and a clink. */
export function sRecruit() { for (let i = 0; i < 6; i++) snare(i * 0.05, 0.08 + i * 0.02); tone(1600, 0.12, 'triangle', 0.32, 0.1); tone(2400, 0.14, 'triangle', 0.36, 0.06); }

/** What his army throws, by Boom Mod: a soft foam thup, a wobbly water balloon, a paint splat, a firework, a rainbow zing. */
export function sThrow(boom: number) {
  if (boom === 0) tone(300, 0.08, 'sine', 0, 0.12, 180);
  else if (boom === 1) tone(500, 0.18, 'sine', 0, 0.08, 260);
  else if (boom === 2) noise({ dur: 0.08, vol: 0.12, type: 'bandpass', f: 1200 });
  else if (boom === 3) noise({ dur: 0.35, vol: 0.12, type: 'bandpass', f: 2600, f2: 5000 });
  else { tone(900, 0.25, 'sine', 0, 0.06, 1800); tone(1350, 0.25, 'sine', 0.03, 0.04, 2400); }
}
/** It lands. */
export function sHit(boom: number) {
  if (boom === 1) { noise({ dur: 0.3, vol: 0.25, type: 'lowpass', f: 900 }); tone(180, 0.15, 'sine', 0, 0.12, 90); }
  else if (boom === 2) { noise({ dur: 0.16, vol: 0.3, type: 'lowpass', f: 600 }); }
  else if (boom === 3) { noise({ dur: 0.2, vol: 0.35, type: 'highpass', f: 1500 }); noise({ dur: 0.7, vol: 0.08, type: 'highpass', f: 4000, when: 0.1, beat: 0.06 }); }
  else if (boom === 4) { [1047, 1319, 1568].forEach((f, i) => tone(f, 0.18, 'triangle', i * 0.05, 0.07)); }
  else tone(220, 0.1, 'sine', 0, 0.18, 120);
}
/** A robot topples over: a tinny clatter and a spring's boing. */
export function sTopple() { noise({ dur: 0.18, vol: 0.2, type: 'bandpass', f: 3000 }); tone(240, 0.3, 'sine', 0.1, 0.1, 720); }
/** Poof: it vanishes in a puff of confetti. */
export function sPoof() { noise({ dur: 0.25, vol: 0.22, type: 'bandpass', f: 700, f2: 2400 }); }
/** The robots wind up: a rising whirr. */
export function sWindUp() { for (let i = 0; i < 5; i++) noise({ dur: 0.07, vol: 0.12, type: 'bandpass', f: 2200 + i * 300, when: i * 0.1 }); tone(300, 0.6, 'square', 0, 0.03, 600); }
/** One of his soldiers is knocked over and springs back up. */
export function sBounce() { tone(260, 0.2, 'sine', 0, 0.14, 700); }
