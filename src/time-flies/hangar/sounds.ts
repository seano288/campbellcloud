// Aircraft sounds, made in code with Web Audio like the rest of the game's effects (src/audio/sfx.ts): jets spool up with
// a rising turbine whine and roar into the afterburner; propeller aircraft drone and rumble. Each Engine Mod is beefier.
import { noise, tone } from '../../audio/sfx';
import type { Rung } from './catalog';

/** One rev of the engine, by Engine Mod. */
export function engineSound(rung: Rung, prop: boolean) {
  if (prop) {
    const beat = [0.06, 0.05, 0.045, 0.04, 0.035][rung]!;
    tone(48 + rung * 4, 1.6, 'sawtooth', 0, 0.16, 70 + rung * 6);
    noise({ dur: 1.6, vol: 0.22 + rung * 0.04, f: 300 + rung * 80, beat, grow: true });
    if (rung >= 2) noise({ dur: 1.2, vol: 0.18, type: 'bandpass', f: 500, f2: 1600, when: 0.3 });
    if (rung === 4) [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.4 + i * 0.1, 0.06));
    return;
  }
  tone(380 + rung * 60, 1.6, 'sawtooth', 0, 0.035, 2000 + rung * 500); // turbine whine
  noise({ dur: 1.7, vol: 0.2 + rung * 0.05, type: 'bandpass', f: 400, f2: 2600 });
  if (rung >= 2) { // afterburner: a whoomp as it lights, then a roar
    noise({ dur: 0.35, vol: 0.4, f: 220, when: 0.45 });
    noise({ dur: 1.5, vol: 0.32 + rung * 0.05, f: 1100 + rung * 200, when: 0.5 });
    tone(42, 1.4, 'sawtooth', 0.5, 0.2, 30);
  }
  if (rung === 4) [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.3, 'triangle', 0.6 + i * 0.12, 0.06));
}

/** Take off: a long roar building up, and a whoosh past. */
export function takeOffSound(prop: boolean) {
  if (prop) { tone(52, 3, 'sawtooth', 0, 0.18, 95); noise({ dur: 3, vol: 0.3, f: 450, beat: 0.04, grow: true }); }
  else { noise({ dur: 3.2, vol: 0.45, f: 1200, grow: true }); tone(40, 3, 'sawtooth', 0, 0.22, 34); tone(500, 3, 'sawtooth', 0, 0.03, 2600); }
  noise({ dur: 1.0, vol: 0.35, type: 'bandpass', f: 300, f2: 3500, when: 2.6 });
}

/** A trick in the air: a quick whoosh. */
export const trickSound = () => noise({ dur: 0.9, vol: 0.35, type: 'bandpass', f: 600, f2: 3000 });
/** Fireworks: pops and crackle. */
export function fireworkSound() {
  for (let k = 0; k < 3; k++) {
    noise({ dur: 0.25, vol: 0.4, type: 'highpass', f: 1200, when: 0.25 + k * 0.38 });
    noise({ dur: 0.8, vol: 0.1, type: 'highpass', f: 4000, when: 0.35 + k * 0.38, beat: 0.05 });
  }
}

/** Half a second of gunfire: a fast rattle, or the Warthog's deep BRRRT. */
export function gunSound(brrrt: boolean) {
  if (brrrt) { noise({ dur: 0.5, vol: 0.5, f: 380, beat: 0.016 }); tone(62, 0.5, 'sawtooth', 0, 0.2, 55); return; }
  noise({ dur: 0.5, vol: 0.4, type: 'bandpass', f: 900, beat: 0.055 });
}
/** A missile or rocket leaving the rail: a hiss that roars away. */
export function missileSound() {
  noise({ dur: 0.25, vol: 0.3, f: 200 }); // the clunk off the rail
  noise({ dur: 1.6, vol: 0.4, type: 'bandpass', f: 2600, f2: 500, when: 0.15 });
}
/** A bomb falling away: a long whistle down. */
export const bombSound = () => { noise({ dur: 0.2, vol: 0.25, f: 200 }); tone(1500, 2.2, 'sine', 0.2, 0.06, 500); };
/** An explosion, a little way off. */
export function boomSound(when = 0) {
  noise({ dur: 1.4, vol: 0.55, f: 160, when });
  tone(55, 1.1, 'sine', when, 0.35, 30);
}
/** The landing gear going up or down: a whirr and a clunk. */
export const gearSound = () => { tone(220, 0.8, 'sawtooth', 0, 0.03, 320); noise({ dur: 0.15, vol: 0.3, f: 300, when: 0.8 }); };
/** Wheels touching the runway: two squeaks. */
export const touchdownSound = () => [0, 0.18].forEach(w => noise({ dur: 0.3, vol: 0.3, type: 'bandpass', f: 2400, f2: 1200, when: w }));
/** Coming in to land: the engines throttle back to a falling hum. */
export function approachSound(prop: boolean) {
  if (prop) { tone(70, 5, 'sawtooth', 0, 0.12, 45); noise({ dur: 5, vol: 0.18, f: 380, beat: 0.05 }); return; }
  tone(900, 5, 'sawtooth', 0, 0.025, 380);
  noise({ dur: 5.5, vol: 0.25, type: 'bandpass', f: 1400, f2: 500 });
}
