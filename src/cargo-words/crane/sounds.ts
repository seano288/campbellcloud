// The Crane's sounds, made in code with Web Audio like the family's other effects (src/audio/sfx.ts): the trolley's hum, the grab's
// clunk as it locks, the thud of a container set down, and the ship's horn (one for each horn he can buy).
import { noise, sChime, tone } from '../../audio/sfx';

export const lockSound = () => { tone(180, 0.12, 'square', 0, 0.12); noise({ dur: 0.12, vol: 0.25, f: 1500 }); };
export const setDown = () => { tone(90, 0.3, 'sine', 0, 0.3, 50); noise({ dur: 0.18, vol: 0.25, f: 400 }); };
export const wordChime = () => sChime();
export const bump = () => tone(240, 0.15, 'triangle', 0, 0.08, 200);

/** Each horn by its part id: toot, ship whistle, big horn, air horn, tune horn. */
export function hornSound(id: string) {
  switch (id) {
    case 'part:whistle': tone(880, 0.9, 'sine', 0, 0.12, 860); break;
    case 'part:bighorn': tone(98, 1.4, 'sawtooth', 0, 0.16); tone(123, 1.4, 'sawtooth', 0, 0.1); break;
    case 'part:airhorn': tone(392, 0.5, 'square', 0, 0.12); tone(392, 0.5, 'square', 0.6, 0.12); break;
    case 'part:tunehorn': [262, 330, 392, 523].forEach((f, i) => tone(f, 0.3, 'triangle', i * 0.28, 0.14)); break;
    default: tone(220, 0.5, 'sawtooth', 0, 0.12); tone(220, 0.5, 'sawtooth', 0.65, 0.12);
  }
}
