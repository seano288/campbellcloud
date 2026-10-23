// Boeing CH-47F Chinook. Fuselage 15.6 m, two counter-rotating three-blade 18.29 m rotors (overlapping discs, the rear one
// on a tall pylon), height 5.69 m, no tail rotor, fuel sponsons down both sides, a rear ramp and four fixed wheels.
// Research: .scratch/chop-chop/research/helis/ch47-chinook.md
import type { HeliSpec } from '../three/spec';
import { circle, finPanel, oval } from './parts';

export const ch47: HeliSpec = {
  id: 'ch47', length: 15.6, rotorDiameter: 18.29, height: 5.69,
  bodies: [
    { sections: [ // rounded nose and cockpit, the long boxy cabin, then the ramp sweeping up at the back
      oval(0, 0.3, 0.3, 0.3, 2.3, 1.6), oval(0.6, 0.85, 0.85, 0.7, 2.45, 2.4, 2.4), oval(1.6, 1.12, 1.0, 0.95, 2.35, 3, 3), oval(3.0, 1.25, 1.1, 1.15, 2.1, 4, 4),
      oval(12.4, 1.25, 1.1, 1.15, 2.1, 4, 4), oval(14.0, 1.1, 0.9, 0.9, 2.3, 3.4, 3.4), oval(15.6, 0.7, 0.6, 0.4, 2.7, 2.6, 2.6),
    ] },
    { sections: [
      oval(0.4, 0.6, 0.35, 0.3, 2.7, 2.4), oval(1.0, 0.98, 0.5, 0.4, 2.85, 2.6), oval(1.6, 1.13, 0.5, 0.4, 2.9, 3), oval(2.6, 1.2, 0.5, 0.4, 2.8, 3.4),
    ], finish: 'glass' },
    { z: 1.32, mirror: true, sections: [ // the fuel sponsons
      oval(2.4, 0.2, 0.2, 0.2, 1.2), oval(3.0, 0.58, 0.5, 0.5, 1.2, 2.4, 2.4), oval(4.0, 0.64, 0.55, 0.5, 1.2, 2.6, 2.6), oval(9.6, 0.64, 0.55, 0.5, 1.2, 2.6, 2.6), oval(10.8, 0.4, 0.4, 0.35, 1.2),
    ] },
    { z: 0.78, mirror: true, sections: [circle(10.8, 0.15, 3.35), circle(11.4, 0.45, 3.4), circle(13.8, 0.45, 3.4), circle(14.5, 0.25, 3.4)] }, // the two engines
    { sections: [ // the forward rotor's housing on the roof
      oval(1.8, 0.2, 0.1, 0.1, 3.3), oval(2.5, 0.6, 0.3, 0.1, 3.35, 2.4), oval(3.4, 0.6, 0.3, 0.1, 3.35, 2.4), oval(4.2, 0.2, 0.1, 0.1, 3.3),
    ] },
    { sections: [ // the tall aft pylon that carries the rear rotor
      oval(11.2, 0.3, 0.3, 0.3, 3.2), oval(12.0, 0.8, 1.2, 1.0, 4.0, 2.6, 2.6), oval(13.2, 0.8, 1.15, 0.9, 4.15, 2.6, 2.6), oval(14.4, 0.4, 0.8, 0.5, 4.3, 2.2),
      oval(14.9, 0.15, 0.4, 0.2, 4.4),
    ] },
  ],
  surfaces: [
    { kind: 'fin', mirror: false, stations: finPanel([12.2, 3.6, 0], 2.4, [13.4, 5.1, 0], 1.4, 0.1) }, // the pylon's fin
  ],
  rotors: [
    { kind: 'main', at: [2.9, 4.05, 0], r: 9.145, blades: 3, chord: 0.62, axis: 'y', dir: 1, mast: 0.75 },
    { kind: 'main', at: [13.3, 5.45, 0], r: 9.145, blades: 3, chord: 0.62, axis: 'y', dir: -1, mast: 0.45 },
  ],
  // the real front wheels sit under the sponsons: the 'nose' and 'tail' legs are used as a twin-wheel pair at x 4.0 (left and right)
  gear: { nose: { x: 4.3, y: 1.1, z: 1.3, len: 0.65, r: 0.45, twin: true }, tail: { x: 4.3, y: 1.1, z: -1.3, len: 0.65, r: 0.45, twin: true }, main: { x: 11.3, y: 0.95, z: 1.3, len: 0.65, r: 0.3 } },
  hardpoints: [{ at: [5.2, 0.85, 1.9], kind: 'inner' }, { at: [8.0, 0.85, 1.9], kind: 'outer' }],
  cockpit: [1.6, 3.0, 0.5],
  seats: [[1.6, 3.0, 0.5], [1.6, 3.0, -0.5]],
  gun: [3.6, 2.4, 1.3], // the door gun
  livery: {
    factory: { base: '#4e5b3b', under: '#3a4330', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.08 }] }, // US Army olive
    camo: { base: '#5c6b47', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#6e5a3f', '#1e1e1e'], scale: 1.2, seed: 47 }] }, // Japan's green, brown and black
    squadron: { base: '#7d8489', under: '#6a7176', finish: 'satin', insignia: 'none', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.08, color: '#22262a' }, { kind: 'spine', w: 0.8, color: '#4c5359', x0: 0.1, x1: 0.95 }] }, // RAF grey
    airshow: { base: '#5a6e82', finish: 'gloss', insignia: 'none', marks: [{ kind: 'stripe', y: 0.2, h: 0.22, color: '#c8a24a', x0: 0.05, x1: 0.98 }, { kind: 'nose', x1: 0.05, color: '#c8a24a' }, { kind: 'fins', color: '#c8a24a', from: 0.7 }] }, // RAF 40th anniversary
  },
};
