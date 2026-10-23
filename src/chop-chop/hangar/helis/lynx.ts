// Westland Lynx AH.7. Fuselage 12.06 m, four-blade 12.8 m main rotor on a rigid head, height 3.66 m, skids, two engines
// humped on the roof, a tall swept fin with a four-blade 2.36 m tail rotor on its left, and a small tailplane.
// Research: .scratch/chop-chop/research/helis/lynx.md
import type { HeliSpec } from '../three/spec';
import { circle, finPanel, oval, wingPanel } from './parts';

export const lynx: HeliSpec = {
  id: 'lynx', length: 12.06, rotorDiameter: 12.8, height: 3.66,
  bodies: [
    { sections: [ // pointed nose, the compact cabin, then the tail boom
      oval(0, 0.15, 0.3, 0.3, 1.1, 1.5), oval(0.7, 0.6, 0.65, 0.55, 1.4, 2.2, 2.2), oval(1.6, 0.76, 0.85, 0.72, 1.55, 2.5, 2.5), oval(3.0, 0.8, 0.95, 0.88, 1.62, 2.8, 2.8),
      oval(5.8, 0.8, 0.9, 0.85, 1.65, 3, 3), oval(7.3, 0.55, 0.65, 0.5, 1.9), oval(8.8, 0.32, 0.4, 0.3, 2.2), oval(10.5, 0.2, 0.25, 0.2, 2.4), oval(11.9, 0.12, 0.2, 0.15, 2.6),
      oval(12.06, 0.08, 0.14, 0.1, 2.65),
    ] },
    { sections: [
      oval(0.45, 0.33, 0.3, 0.25, 1.7, 2.2), oval(1.0, 0.6, 0.5, 0.4, 1.9, 2.4), oval(1.6, 0.775, 0.45, 0.4, 2.05, 2.5), oval(2.8, 0.81, 0.4, 0.4, 2.15, 2.8),
    ], finish: 'glass' },
    { z: 0.38, mirror: true, sections: [circle(3.2, 0.12, 2.5), circle(3.7, 0.36, 2.55), circle(6.2, 0.36, 2.55), circle(7.0, 0.2, 2.5)] }, // the two engines
    { sections: [oval(3.8, 0.15, 0.1, 0.1, 2.75), oval(4.5, 0.4, 0.35, 0.1, 2.85, 2.4), oval(5.3, 0.15, 0.1, 0.1, 2.8)] }, // the gearbox fairing under the rotor head
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([3.6, 1.2, 0.8], 0.8, [3.7, 1.15, 1.6], 0.6, 0.1, 0.08, 2) }, // weapon pylons
    { kind: 'tail', stations: wingPanel([10.0, 2.4, 0.12], 0.7, [10.1, 2.4, 0.95], 0.5, 0.08, 0.06, 2) }, // the small tailplane
    { kind: 'fin', mirror: false, stations: finPanel([9.8, 2.35, 0], 1.9, [11.4, 3.75, 0], 0.7, 0.1) }, // the big swept fin
  ],
  rotors: [
    { kind: 'main', at: [4.5, 3.4, 0], r: 6.4, blades: 4, chord: 0.4, axis: 'y', dir: 1, mast: 0.55 },
    { kind: 'tail', at: [11.4, 3.15, -0.25], r: 1.18, blades: 4, chord: 0.2, axis: 'z', dir: 1 },
  ],
  skids: { x0: 1.3, x1: 5.1, z: 1.0, r: 0.055, struts: [{ x: 2.2, y: 0.8, z: 0.7 }, { x: 4.3, y: 0.8, z: 0.7 }] },
  hardpoints: [{ at: [3.9, 1.1, 1.2], kind: 'inner' }, { at: [3.9, 1.05, 1.55], kind: 'outer' }],
  cockpit: [1.7, 2.15, 0.4],
  seats: [[1.7, 2.15, 0.4], [1.7, 2.15, -0.4]],
  gun: [3.4, 1.9, 0.85], // the door gun
  livery: {
    factory: { base: '#4b5320', under: '#a7a9ac', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.1, color: '#1a1a1a' }] }, // Army Air Corps green
    camo: { base: '#4b5320', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#1a1a1a', '#6b5a3c'], scale: 1.0, seed: 77 }] },
    squadron: { base: '#6e7b80', under: '#6e7b80', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'stripe', y: 0.1, h: 0.1, color: '#f2f2f0', x0: 0.1, x1: 0.8 }] }, // Royal Navy grey
    airshow: { base: '#7a8288', finish: 'gloss', insignia: 'none', marks: [{ kind: 'nose', x1: 0.08, color: '#141414' }, { kind: 'spine', w: 0.5, color: '#141414', x0: 0.1, x1: 1 }, { kind: 'stripe', y: 0.05, h: 0.12, color: '#f2f2f0', x0: 0.1, x1: 0.8 }, { kind: 'fins', color: '#141414', from: 0.2 }] }, // Black Cats
  },
};
