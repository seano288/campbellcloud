// His horn, made in code with the shared tones and noise (src/audio/sfx.ts), no sound files. Honk Honk is the old honk, so a save from
// before horns sounds the same. Each is short: a child taps 📯 a lot.
import { noise, sHonk, tone } from '../audio/sfx';
import type { HornId } from './yard/shop';

const notes = (fs: readonly number[], step: number, dur: number, type: OscillatorType = 'triangle', vol = .14) => fs.forEach((f, i) => tone(f, dur, type, i * step, vol));

export const HORN_SOUNDS: Record<HornId, () => void> = {
  honk: sHonk,
  beep: () => { tone(880, .12, 'square', 0, .12); tone(880, .12, 'square', .17, .12); },
  clown: () => { tone(520, .16, 'sawtooth', 0, .12, 700); tone(700, .22, 'sawtooth', .2, .12, 460); },
  duck: () => { for (const w of [0, .28]) { tone(420, .2, 'sawtooth', w, .14, 260); noise({ dur: .18, vol: .08, type: 'bandpass', f: 900, when: w }); } },
  train: () => { for (const f of [185, 233, 277, 370]) tone(f, .9, 'sawtooth', 0, .07); },
  siren: () => { tone(620, .45, 'sawtooth', 0, .07, 1250); tone(1250, .45, 'sawtooth', .45, .07, 620); },
  icecream: () => notes([784, 659, 784, 880, 784, 659, 523], .14, .16),
  cow: () => { tone(170, .9, 'sawtooth', 0, .16, 115); tone(340, .9, 'triangle', 0, .05, 230); },
  robot: () => notes([440, 880, 660, 990, 550], .09, .08, 'square', .09),
  trumpet: () => notes([523, 659, 784, 1047], .13, .22, 'sawtooth', .08),
  dino: () => { tone(110, 1.1, 'sawtooth', 0, .28, 50); tone(165, 1, 'square', 0, .08, 70); noise({ dur: 1, f: 500, vol: .3 }); },
  laser: () => { for (const w of [0, .18, .36]) tone(1800, .16, 'square', w, .08, 300); },
};
export const playHorn = (h: HornId) => HORN_SOUNDS[h]();
