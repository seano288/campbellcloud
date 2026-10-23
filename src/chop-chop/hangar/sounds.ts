// Helicopter sounds, made in code with Web Audio like the rest of the game's effects (src/audio/sfx.ts): a turbine whine
// under the whup-whup-whup of the blades, faster and beefier with each Rotor Mod. Missiles, bombs, bangs and fireworks
// are Time Flies' (src/time-flies/hangar/sounds.ts).
import { noise, tone } from '../../audio/sfx';
import type { Rung } from './catalog';
export { bombSound, boomSound, fireworkSound, missileSound, trickSound } from '../../time-flies/hangar/sounds';

/** One spin-up of the rotors, by Rotor Mod. */
export function rotorSound(rung: Rung) {
  tone(300 + rung * 40, 1.8, 'sawtooth', 0, 0.03, 1400 + rung * 300); // turbine whine
  noise({ dur: 1.8, vol: 0.32 + rung * 0.04, f: 180 + rung * 25, beat: 0.11 - rung * 0.01, grow: true }); // blade slap
  tone(38, 1.6, 'sine', 0.1, 0.25, 46);
  if (rung >= 2) noise({ dur: 1.3, vol: 0.12, type: 'bandpass', f: 900, f2: 2400, when: 0.4 });
  if (rung === 4) [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.25, 'triangle', 0.5 + i * 0.1, 0.06));
}

/** Lift Off: the whine winds up and the whup-whup builds until it lifts. */
export function liftOffSound() {
  tone(180, 2.6, 'sawtooth', 0, 0.03, 1200);
  noise({ dur: 4.2, vol: 0.4, f: 220, beat: 0.1, grow: true });
  tone(36, 4, 'sine', 0, 0.28, 50);
}
/** Coming in to land: the rotors thump steadily as it sinks, then wind down after touchdown. */
export function approachSound() {
  noise({ dur: 6.5, vol: 0.32, f: 220, beat: 0.1 });
  tone(40, 6.5, 'sine', 0, 0.2, 36);
}
export function windDownSound() {
  tone(900, 2.4, 'sawtooth', 0, 0.025, 150);
  noise({ dur: 2.4, vol: 0.25, f: 200, beat: 0.16 });
}
/** Skids or wheels on the pad: a soft thump. */
export const touchdownSound = () => { tone(70, 0.3, 'sine', 0, 0.35, 45); noise({ dur: 0.25, vol: 0.25, f: 400 }); };
/** Half a second of the chin gun: a fast heavy rattle. */
export function gunSound() {
  noise({ dur: 0.5, vol: 0.45, f: 520, beat: 0.075 });
  tone(70, 0.5, 'square', 0, 0.06, 60);
}
