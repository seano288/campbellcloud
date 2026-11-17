// The roars a living dinosaur can have, made in code with the shared Web Audio helpers (no sound files). Bigger dinosaurs roar lower.
import { noise, tone } from '../audio/sfx';
import type { RoarId } from './shop/shop';

/** `size`: the dinosaur's size (museum/dinos.ts), which lowers the pitch. */
export function playRoar(id: RoarId, size = 200) {
  const k = Math.max(.55, Math.min(1.5, 220 / size));
  switch (id) {
    case 'roar': noise({ dur: .9, vol: .5, type: 'bandpass', f: 500 * k, f2: 180 * k }); tone(110 * k, .9, 'sawtooth', 0, .18, 60 * k); tone(165 * k, .7, 'square', .05, .06, 90 * k); break;
    case 'squeak': tone(1400, .12, 'sine', 0, .15, 2200); tone(1600, .12, 'sine', .14, .15, 2600); break;
    case 'chirp': for (let i = 0; i < 3; i++) tone(2200, .07, 'sine', i * .1, .14, 3200); break;
    case 'honk': tone(220 * k, .5, 'sawtooth', 0, .14); tone(277 * k, .5, 'sawtooth', 0, .1); break;
    case 'growl': noise({ dur: 1, vol: .35, type: 'lowpass', f: 300, beat: .04 }); tone(70, 1, 'sawtooth', 0, .14, 55); break;
    case 'trumpet': [392, 494, 587, 784].forEach((f, i) => tone(f, .18, 'square', i * .12, .09)); break;
    case 'thunder': noise({ dur: 1.4, vol: .7, type: 'lowpass', f: 400, f2: 80 }); tone(50, 1.2, 'sine', 0, .4, 30); break;
    case 'robot': for (let i = 0; i < 5; i++) tone(i % 2 ? 330 : 440, .08, 'square', i * .09, .1); break;
    case 'dragon': noise({ dur: 1, vol: .45, type: 'highpass', f: 1200, f2: 300 }); tone(140 * k, 1, 'sawtooth', 0, .16, 70); break;
    case 'siren': tone(600, .5, 'triangle', 0, .14, 1200); tone(1200, .5, 'triangle', .5, .14, 600); break;
    case 'laser': for (let i = 0; i < 3; i++) tone(1800, .15, 'sawtooth', i * .16, .08, 200); break;
    case 'mega': noise({ dur: 1.4, vol: .8, type: 'bandpass', f: 700, f2: 120 }); tone(90 * k, 1.4, 'sawtooth', 0, .25, 40); tone(60 * k, 1.4, 'square', 0, .1, 35); break;
  }
}
