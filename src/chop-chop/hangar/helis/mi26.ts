// Mil Mi-26 Halo. Fuselage 33.5 m, ONE enormous eight-blade rotor 32 m across, height 8.1 m, a huge fat cargo fuselage with
// a clamshell rear and upswept tail, a five-blade 7.6 m tail rotor on the right, fixed tricycle gear and no stub wings (the
// toy gets sponson hardpoints). Research: .scratch/chop-chop/research/helis/mi26-halo.md
import type { HeliSpec } from '../three/spec';
import { bubble, circle, finPanel, oval, wingPanel } from './parts';

export const mi26: HeliSpec = {
  id: 'mi26', length: 33.5, rotorDiameter: 32, height: 8.1,
  bodies: [
    { sections: [ // pointed nose, deep cargo hold, then the rear belly sweeping up to a slim tail
      oval(0, 0.35, 0.35, 0.4, 2.6, 1.8), oval(1.4, 1.0, 0.95, 0.9, 2.75, 2.2), oval(3.8, 1.6, 1.4, 1.2, 2.95, 2.6), oval(6.5, 1.8, 1.5, 1.45, 2.95, 3, 3.4),
      oval(21.0, 1.8, 1.5, 1.45, 2.95, 3, 3.4), oval(24.0, 1.6, 1.4, 1.15, 3.3, 3, 3.2), oval(28.0, 1.0, 0.9, 0.8, 4.0, 2.6), oval(31.0, 0.55, 0.55, 0.45, 4.1), oval(33.5, 0.25, 0.3, 0.25, 4.0),
    ] },
    { sections: bubble(1.0, 5.4, 3.5, 1.2, 1.1, 0.45), finish: 'glass' }, // the high flight deck windows
    { z: 0.95, mirror: true, sections: [circle(8.0, 0.2, 4.7), circle(9.0, 0.75, 4.75), circle(16.0, 0.78, 4.75), circle(18.0, 0.5, 4.7), circle(18.8, 0.2, 4.68)] }, // two engines on the roof
    { sections: [oval(10.0, 0.5, 0.15, 0.1, 5.2), oval(11.4, 0.95, 0.6, 0.1, 5.2, 2.4), oval(15.0, 0.95, 0.6, 0.1, 5.2, 2.4), oval(16.2, 0.4, 0.15, 0.1, 5.2)] }, // the rotor head fairing
    { z: 1.95, mirror: true, sections: [oval(9.5, 0.1, 0.1, 0.1, 1.9), oval(10.8, 0.55, 0.55, 0.5, 1.9, 2.4), oval(15.8, 0.55, 0.55, 0.5, 1.9, 2.4), oval(17.0, 0.1, 0.1, 0.1, 1.9)] }, // the main gear sponsons
  ],
  surfaces: [
    { kind: 'tail', stations: wingPanel([29.6, 4.9, 0.25], 2.2, [30.2, 4.9, 3.6], 1.4, 0.2, 0.15, 2) }, // the stabiliser
    { kind: 'fin', mirror: false, stations: finPanel([27.4, 4.25, 0], 5.6, [31.8, 7.7, 0], 2.4, 0.34) }, // the tall fin
  ],
  rotors: [
    { kind: 'main', at: [13.2, 6.2, 0], r: 16, blades: 8, chord: 1.0, axis: 'y', dir: 1, mast: 0.8 },
    { kind: 'tail', at: [32.4, 6.9, 1.0], r: 3.8, blades: 5, chord: 0.5, axis: 'z', dir: 1 }, // on the right
  ],
  gear: { nose: { x: 3.6, y: 1.5, len: 1.1, r: 0.4, twin: true }, main: { x: 13.5, y: 1.9, z: 1.95, len: 1.1, r: 0.8, twin: true } },
  hardpoints: [
    { at: [11.5, 1.35, 2.0], kind: 'inner', mirror: true }, { at: [15.0, 1.35, 2.0], kind: 'outer', mirror: true },
    { at: [8.5, 2.2, 1.85], kind: 'tip', mirror: true }, { at: [13.2, 1.4, 0], kind: 'belly' },
  ],
  cockpit: [3.7, 3.7, 0.55],
  seats: [[3.7, 3.7, 0.55], [3.7, 3.7, -0.55]],
  gun: [6.0, 3.4, 1.8], // a door gun window
  livery: {
    factory: { base: '#f2f2f2', under: '#d8d8d8', finish: 'satin', insignia: 'none', marks: [ // Aeroflot white, red cheatline and blue band
      { kind: 'stripe', y: 0.5, h: 0.7, color: '#c8102e', x0: 0.04, x1: 0.9 }, { kind: 'stripe', y: -0.6, h: 0.5, color: '#1f3a93', x0: 0.04, x1: 0.9 }, { kind: 'fins', color: '#c8102e', from: 0.5 },
    ] },
    camo: { base: '#566044', under: '#8a9396', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#3b4328', '#6b5a3c'], scale: 1.6, seed: 26 }] }, // Russian military
    squadron: { base: '#c62828', under: '#f2f2f2', finish: 'satin', insignia: 'none', marks: [{ kind: 'stripe', y: -0.4, h: 0.3, color: '#f9a825', x0: 0.05, x1: 0.9 }, { kind: 'fins', color: '#f2f2f2', from: 0.6 }] }, // MChS firefighter
    airshow: { base: '#f2f2f2', finish: 'gloss', insignia: 'none', marks: [{ kind: 'nose', x1: 0.06, color: '#ffc107' }, { kind: 'stripe', y: 0.2, h: 0.4, color: '#ffc107', x0: 0.06, x1: 0.9 }, { kind: 'fins', color: '#1a1a1a', from: 0.4 }, { kind: 'band', x0: 0.6, x1: 0.64, color: '#ffc107' }] }, // Halo Heavy gold
  },
};
