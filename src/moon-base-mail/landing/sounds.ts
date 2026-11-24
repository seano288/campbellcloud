// The Landing's sounds, made in code with Web Audio like the family's other effects (src/audio/sfx.ts): the engine's rumble while it is
// held, the bump of the legs on the ground, a little hop, and a chime when it settles on the pad.
import { noise, sChime, tone } from '../../audio/sfx';

export const engineBurst = () => noise({ dur: 0.25, vol: 0.12, f: 260 });
export const legsBump = (speed: number) => { tone(90, 0.25, 'sine', 0, Math.min(0.35, 0.1 + speed / 60), 50); noise({ dur: 0.15, vol: 0.2, f: 400 }); };
export const hopSound = () => tone(320, 0.18, 'triangle', 0, 0.08, 520);
export const touchdown = () => sChime();
