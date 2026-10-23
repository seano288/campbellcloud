// Sikorsky UH-60M Black Hawk. Fuselage 15.27 m, main rotor 16.36 m (four blades), height 5.13 m to the rotor head, a
// four-blade 3.35 m tail rotor on the right of the pylon canted 20°, a big stabilator, two main wheels and a tail wheel,
// and ESSS stub wings with two pylons each. Research: .scratch/chop-chop/research/helis/uh60-black-hawk.md
import type { HeliSpec } from '../three/spec';
import { circle, finPanel, oval, wingPanel } from './parts';

export const uh60: HeliSpec = {
  id: 'uh60', length: 15.27, rotorDiameter: 16.36, height: 5.13,
  bodies: [
    { sections: [ // nose, cockpit and the long boxy cabin, tapering up into the tail boom and the pylon
      oval(0, 0.22, 0.25, 0.25, 1.4), oval(0.6, 0.72, 0.55, 0.5, 1.5, 2.4, 2.4), oval(1.7, 1.06, 0.9, 0.72, 1.72, 3, 3.2), oval(3.0, 1.18, 1.1, 0.86, 1.85, 3.4, 4.5),
      oval(7.6, 1.18, 1.1, 0.86, 1.85, 3.4, 4.5), oval(9.4, 0.95, 0.98, 0.55, 2.02, 3, 3), oval(10.9, 0.52, 0.5, 0.32, 2.4), oval(13.2, 0.36, 0.36, 0.28, 2.6),
      oval(14.7, 0.28, 0.45, 0.24, 2.78), oval(15.27, 0.12, 0.25, 0.12, 2.95),
    ] },
    { sections: [ // the windscreen and cockpit windows
      oval(0.35, 0.45, 0.25, 0.05, 1.95), oval(1.1, 0.95, 0.62, 0.05, 2.1, 2.6), oval(2.2, 1.12, 0.72, 0.05, 2.15, 3), oval(2.9, 1.0, 0.45, 0.05, 2.35, 3),
    ], finish: 'glass' },
    { sections: [ // the engine and gearbox housing on the roof
      oval(3.0, 0.3, 0.05, 0.1, 2.95), oval(3.9, 0.82, 0.5, 0.1, 2.92, 3), oval(9.0, 0.8, 0.5, 0.1, 2.92, 3), oval(10.4, 0.25, 0.1, 0.1, 2.85),
    ] },
    { z: 0.62, mirror: true, sections: [circle(6.4, 0.12, 3.25), circle(6.8, 0.36, 3.28), circle(9.4, 0.36, 3.28), circle(9.9, 0.22, 3.3)] }, // the two engines
    { sections: [circle(5.6, 0.25, 3.45), circle(6.0, 0.55, 3.45), circle(7.2, 0.5, 3.5), circle(7.8, 0.2, 3.5)] }, // the rotor head fairing
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([4.2, 2.95, 1.1], 0.6, [4.35, 2.78, 2.75], 0.48, 0.14, 0.12, 2) }, // ESSS stub wings
    { kind: 'tail', stations: wingPanel([14.15, 2.55, 0.2], 0.78, [14.3, 2.55, 2.15], 0.62, 0.12, 0.1, 2) }, // the stabilator
    { kind: 'fin', mirror: false, stations: finPanel([13.9, 2.95, 0], 1.45, [14.85, 4.45, 0], 0.85, 0.16) }, // the tail pylon
  ],
  rotors: [
    { kind: 'main', at: [6.6, 4.62, 0], r: 8.18, blades: 4, chord: 0.53, axis: 'y', dir: 1, tilt: [-0.05, 0], mast: 0.95 },
    { kind: 'tail', at: [14.95, 3.95, 0.34], r: 1.675, blades: 4, chord: 0.24, axis: 'z', dir: 1, tilt: [0, 0.35] },
  ],
  gear: { main: { x: 3.4, y: 1.02, z: 1.35, len: 0.62, r: 0.4 }, tail: { x: 13.6, y: 2.35, len: 2.15, r: 0.2 } },
  hardpoints: [{ at: [4.4, 2.82, 1.85], kind: 'inner' }, { at: [4.5, 2.76, 2.55], kind: 'outer' }],
  cockpit: [1.75, 2.45, 0.55],
  seats: [[1.75, 2.45, 0.55], [1.75, 2.45, -0.55]],
  gun: [3.25, 2.3, 1.3], // the door gunner's window
  livery: {
    factory: { base: '#3d4430', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.1 }] }, // Army olive drab
    camo: { base: '#4b5838', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#2a3024', '#6b5a3c'], scale: 1.1, seed: 60 }] }, // woodland
    squadron: { base: '#5d6366', under: '#55595c', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'stripe', y: 0.5, h: 0.12, color: '#1b1d21', x0: 0.05, x1: 0.62 }] }, // Air Force Pave Hawk grey
    airshow: { base: '#f2f2ee', finish: 'gloss', insignia: 'star', marks: [ // Coast Guard white and orange
      { kind: 'nose', x1: 0.08, color: '#f26b1d' }, { kind: 'band', x0: 0.42, x1: 0.5, color: '#f26b1d' }, { kind: 'stripe', y: -0.2, h: 0.18, color: '#1d3f8f', x0: 0.3, x1: 0.4 }, { kind: 'fins', color: '#f26b1d', from: 0.4 },
    ] },
  },
};
