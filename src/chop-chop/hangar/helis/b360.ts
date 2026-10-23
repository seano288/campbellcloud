// Bell 360 Invictus: tandem two-seat cockpit, four-blade 12.19 m rotor on a shrouded hub, mid-mounted stub wings under the
// hub (about half the lift at cruise), an open (not ducted) tail rotor in its later design, wheels. Dimensions other than
// the rotor are estimates (~12 m long). Research: .scratch/chop-chop/research/helis/bell360-invictus.md
import type { HeliSpec } from '../three/spec';
import { circle, finPanel, oval, wingPanel } from './parts';

export const b360: HeliSpec = {
  id: 'b360', length: 12.2, rotorDiameter: 12.19, height: 4.2,
  bodies: [
    { sections: [ // slim tandem fuselage: sharp nose, narrow cockpit, engine bay, then the boom
      oval(0, 0.1, 0.1, 0.1, 1.2, 2), oval(1.0, 0.5, 0.45, 0.4, 1.35, 2.2, 2.2), oval(2.5, 0.66, 0.65, 0.55, 1.5, 2.6, 2.6), oval(4.2, 0.74, 0.7, 0.6, 1.55, 3, 3),
      oval(6.0, 0.78, 0.72, 0.6, 1.6, 3, 3), oval(8.0, 0.62, 0.55, 0.45, 1.7, 2.6), oval(9.8, 0.36, 0.34, 0.3, 1.85), oval(11.4, 0.2, 0.25, 0.2, 2.1), oval(12.2, 0.1, 0.15, 0.1, 2.2),
    ] },
    { sections: [oval(0.9, 0.34, 0.22, 0.05, 1.65), oval(1.6, 0.55, 0.42, 0.05, 1.9), oval(2.5, 0.58, 0.44, 0.05, 2.0), oval(3.2, 0.4, 0.2, 0.05, 2.05)], finish: 'glass' }, // the pilot's canopy
    { sections: [oval(3.0, 0.4, 0.2, 0.05, 2.1), oval(3.7, 0.56, 0.5, 0.05, 2.2), oval(4.5, 0.54, 0.42, 0.05, 2.2), oval(5.3, 0.3, 0.15, 0.05, 2.2)], finish: 'glass' }, // the gunner's canopy, set higher behind
    { sections: [ // engine deck and the supplemental power unit's hump
      oval(5.2, 0.1, 0.05, 0.1, 2.3), oval(6.0, 0.56, 0.42, 0.1, 2.34, 2.6), oval(8.2, 0.5, 0.36, 0.1, 2.34, 2.6), oval(9.4, 0.18, 0.1, 0.1, 2.25),
    ] },
    { sections: [circle(5.3, 0.2, 2.9), circle(5.7, 0.4, 2.95), circle(6.3, 0.4, 2.95), circle(6.7, 0.2, 2.92)] }, // the shrouded rotor hub
    { sections: [oval(0.8, 0.1, 0.1, 0.1, 1.0), oval(1.1, 0.2, 0.15, 0.13, 1.0), oval(1.6, 0.12, 0.08, 0.08, 1.0)], finish: 'dark' }, // chin turret
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([5.0, 1.65, 0.6], 1.2, [5.4, 1.7, 2.8], 0.75, 0.12, 0.09, 2) }, // the stub wings
    { kind: 'tail', stations: wingPanel([10.6, 2.05, 0.15], 0.9, [11.1, 2.15, 1.9], 0.6, 0.09, 0.08, 2) }, // active horizontal stabiliser
    { kind: 'fin', mirror: false, stations: finPanel([10.4, 2.0, 0], 2.0, [11.7, 3.55, 0], 0.95, 0.12) }, // the tail fin
  ],
  rotors: [
    { kind: 'main', at: [5.9, 3.9, 0], r: 6.095, blades: 4, chord: 0.5, axis: 'y', dir: 1, tilt: [-0.03, 0], mast: 0.95 },
    { kind: 'tail', at: [12.0, 3.0, -0.2], r: 1.2, blades: 4, chord: 0.22, axis: 'z', dir: -1 },
  ],
  gear: { nose: { x: 1.8, y: 1.2, len: 0.9, r: 0.3 }, main: { x: 5.7, y: 1.6, z: 1.0, len: 1.3, r: 0.3 }, tail: { x: 10.5, y: 1.7, len: 1.5, r: 0.2 } },
  hardpoints: [
    { at: [5.7, 1.6, 2.85], kind: 'tip', mirror: true }, { at: [5.6, 1.6, 2.2], kind: 'outer', mirror: true }, { at: [5.5, 1.6, 1.5], kind: 'inner', mirror: true }, { at: [4.4, 0.9, 0], kind: 'belly' },
  ],
  cockpit: [1.8, 2.0, 0],
  seats: [[1.8, 2.0, 0], [3.7, 2.25, 0]],
  gun: [1.7, 1.0, 0], // the chin cannon
  livery: {
    factory: { base: '#6b7178', finish: 'matte', insignia: 'none', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.1 }, { kind: 'wingtips', color: '#5a6068', from: 0.6 }] },
    camo: { base: '#5b5e3b', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#3e4129', '#7a7a52'], scale: 1.1, seed: 44 }] },
    squadron: { base: '#1f4e8c', finish: 'satin', insignia: 'none', marks: [{ kind: 'stripe', y: 1.55, h: 0.14, color: '#e8ecef', x0: 0.1, x1: 0.85 }, { kind: 'fins', color: '#e8ecef', from: 0.4 }] },
    airshow: { base: '#e8ecef', finish: 'gloss', insignia: 'none', marks: [{ kind: 'band', x0: 0.8, x1: 0.88, color: '#c23b22' }, { kind: 'fins', color: '#c23b22', from: 0.3 }, { kind: 'nose', x1: 0.07, color: '#c23b22' }, { kind: 'wingtips', color: '#c23b22', from: 0.7 }] },
  },
};
