// Kamov Ka-52 Alligator. Fuselage 13.5 m, TWO stacked contra-rotating three-blade 14.5 m rotors (no tail rotor), rotor head
// 4.95 m, a wide side-by-side two-seat cockpit, 7.34 m stub wings with three pylons each, a tailplane with endplate fins,
// and fixed tricycle wheels. Research: .scratch/chop-chop/research/helis/ka52-alligator.md
import type { HeliSpec } from '../three/spec';
import { bubble, circle, finPanel, oval, wingPanel } from './parts';

export const ka52: HeliSpec = {
  id: 'ka52', length: 13.5, rotorDiameter: 14.5, height: 4.95,
  bodies: [
    { sections: [ // broad flat nose, wide cockpit and cabin, a slim boom
      oval(0, 0.22, 0.28, 0.3, 1.45, 1.8), oval(0.7, 0.58, 0.58, 0.55, 1.6, 2.2), oval(1.9, 0.9, 0.82, 0.7, 1.85, 2.5, 2.8), oval(3.4, 1.0, 0.9, 0.78, 2.0, 2.8, 3),
      oval(5.8, 0.96, 0.9, 0.8, 2.05, 2.8, 3), oval(7.8, 0.8, 0.72, 0.66, 2.15, 2.6, 2.8), oval(9.6, 0.5, 0.46, 0.4, 2.4), oval(11.8, 0.32, 0.32, 0.28, 2.62), oval(13.5, 0.12, 0.18, 0.12, 2.75),
    ] },
    { sections: bubble(0.8, 3.7, 2.6, 0.85, 0.7, 0.45), finish: 'glass' }, // the big side-by-side canopy
    { z: 0, sections: [circle(0.15, 0.12, 1.72), circle(0.55, 0.3, 1.75), circle(1.0, 0.3, 1.75), circle(1.4, 0.1, 1.74)], finish: 'dark' }, // the sensor ball under the nose
    { z: 0.62, mirror: true, sections: [circle(3.6, 0.12, 3.1), circle(4.2, 0.42, 3.14), circle(7.4, 0.44, 3.18), circle(9.0, 0.3, 3.15), circle(9.6, 0.14, 3.1)] }, // the two engines
    { sections: [oval(4.0, 0.3, 0.12, 0.1, 3.3), oval(4.8, 0.5, 0.45, 0.1, 3.4, 2.4), oval(6.2, 0.5, 0.45, 0.1, 3.4, 2.4), oval(7.0, 0.25, 0.1, 0.1, 3.3)] }, // the gearbox fairing under the rotors
    { z: 1.4, mirror: true, finish: 'dark', sections: [circle(4.9, 0.06, 1.55), circle(5.3, 0.12, 1.52), circle(6.4, 0.12, 1.52), circle(6.8, 0.06, 1.55)] }, // the gun pods
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([5.0, 2.1, 0.8], 1.6, [5.6, 2.05, 3.67], 0.95, 0.14, 0.1, 2) }, // the stub wings
    { kind: 'tail', stations: wingPanel([11.9, 2.62, 0.15], 1.1, [12.3, 2.62, 2.1], 0.8, 0.1, 0.08, 2) }, // the tailplane
    { kind: 'fin', mirror: false, stations: finPanel([11.4, 2.65, 0], 2.2, [12.9, 4.5, 0], 0.95, 0.16) }, // the central fin
    { kind: 'fin', mirror: true, stations: finPanel([11.9, 2.5, 2.1], 1.2, [12.7, 3.7, 2.1], 0.7, 0.12) }, // the endplate fins
  ],
  rotors: [
    { kind: 'main', at: [5.4, 4.8, 0], r: 7.25, blades: 3, chord: 0.45, axis: 'y', dir: 1, mast: 0.8 }, // the upper rotor
    { kind: 'main', at: [5.4, 4.1, 0], r: 7.25, blades: 3, chord: 0.45, axis: 'y', dir: -1, mast: 0.7 }, // the lower rotor, turning the other way
  ],
  gear: { nose: { x: 1.9, y: 1.25, len: 0.95, r: 0.3 }, main: { x: 6.6, y: 1.5, z: 1.45, len: 1.0, r: 0.5 } },
  hardpoints: [
    { at: [5.6, 1.88, 1.45], kind: 'inner', mirror: true }, { at: [5.8, 1.86, 2.5], kind: 'outer', mirror: true },
    { at: [6.0, 1.85, 3.67], kind: 'tip', mirror: true }, { at: [3.0, 1.1, 0], kind: 'belly' },
    { at: [5.3, 1.9, 1.0], kind: 'inner', mirror: true },
  ],
  cockpit: [2.0, 2.55, 0.48],
  seats: [[2.0, 2.55, 0.48], [2.0, 2.55, -0.48]], // side by side
  gun: [1.6, 1.25, 0.8], // the 30 mm cannon on the side of the nose
  livery: {
    factory: { base: '#5a6340', under: '#8a9396', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#3b4328', '#6b4f2a'], scale: 1.1, seed: 52 }] }, // Russian Army green-brown
    camo: { base: '#c8b68a', under: '#c8b68a', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#a08a5a', '#7a6a4a'], scale: 1.2, seed: 8 }] }, // desert tan, export
    squadron: { base: '#3a3f44', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'splinter', colors: ['#2a2e32', '#4d545a'], seed: 31 }] }, // night grey
    airshow: { base: '#1b1b1d', finish: 'gloss', insignia: 'none', marks: [ // the black Black Shark display look
      { kind: 'nose', x1: 0.07, color: '#f2f2ee' }, { kind: 'stripe', y: 0.15, h: 0.2, color: '#d6232b', x0: 0.1, x1: 0.85 }, { kind: 'fins', color: '#d6232b', from: 0.4 }, { kind: 'wingtips', color: '#f2f2ee', from: 0.7 },
    ] },
  },
};
