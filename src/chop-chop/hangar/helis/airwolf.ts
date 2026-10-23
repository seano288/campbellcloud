// Airwolf (TV show): a Bell 222 with the show's add-ons. Real 222: fuselage 12.85 m, two-blade 12.12 m main rotor, height
// 3.56 m, a two-blade tail rotor, two turboshafts, retractable wheels and sponsons. The show added stub-wing gun pods and
// "turbo" intakes and nozzles (fiction, but it is a toy). Research: .scratch/chop-chop/research/helis/airwolf.md
import type { HeliSpec } from '../three/spec';
import { circle, finPanel, oval, wingPanel } from './parts';

export const airwolf: HeliSpec = {
  id: 'airwolf', length: 12.85, rotorDiameter: 12.12, height: 3.56,
  bodies: [
    { sections: [ // long sleek nose, wide cabin, then the boom rising to the tail
      oval(0, 0.1, 0.1, 0.1, 0.95, 2), oval(0.7, 0.5, 0.45, 0.38, 1.15, 2.2, 2.2), oval(1.7, 0.75, 0.68, 0.6, 1.32, 2.6, 2.6), oval(3.0, 0.84, 0.76, 0.66, 1.38, 3, 3),
      oval(5.2, 0.82, 0.74, 0.64, 1.4, 3, 3), oval(6.8, 0.55, 0.52, 0.45, 1.52), oval(8.5, 0.34, 0.32, 0.3, 1.78), oval(11.6, 0.2, 0.22, 0.2, 2.02), oval(12.85, 0.1, 0.15, 0.1, 2.12),
    ] },
    { sections: [ // the windscreen and cockpit windows
      oval(0.75, 0.38, 0.22, 0.05, 1.5, 2.2), oval(1.5, 0.7, 0.42, 0.05, 1.7, 2.4), oval(2.5, 0.8, 0.44, 0.05, 1.86, 2.6), oval(3.1, 0.6, 0.3, 0.05, 1.92, 3),
    ], finish: 'glass' },
    { sections: [ // the engine and gearbox hump behind the rotor mast
      oval(2.9, 0.1, 0.05, 0.1, 2.1), oval(3.7, 0.55, 0.42, 0.1, 2.15, 2.6), oval(6.2, 0.5, 0.36, 0.1, 2.15, 2.6), oval(7.8, 0.18, 0.1, 0.1, 2.1),
    ] },
    { sections: [circle(4.0, 0.15, 2.5), circle(4.4, 0.35, 2.55), circle(5.2, 0.3, 2.55), circle(5.6, 0.12, 2.55)] }, // rotor head fairing
    { sections: [oval(0.2, 0.12, 0.1, 0.1, 1.3), oval(0.8, 0.3, 0.2, 0.1, 1.55), oval(1.5, 0.26, 0.14, 0.08, 1.78), oval(2.0, 0.1, 0.05, 0.05, 1.82)] }, // the show's nose blister
    { z: 0.95, mirror: true, sections: [circle(3.0, 0.1, 1.0), circle(3.5, 0.32, 1.0), circle(6.2, 0.32, 1.0), circle(6.9, 0.2, 1.0), circle(7.4, 0.14, 1.0)] }, // sponson with a turbo intake and nozzle
    { z: 2.35, mirror: true, sections: [circle(3.7, 0.08, 1.2), circle(4.0, 0.2, 1.2), circle(5.6, 0.2, 1.2), circle(6.1, 0.1, 1.2)] }, // stub gun pods at the wingtips
    { z: 2.35, mirror: true, finish: 'dark', sections: [circle(2.3, 0.04, 1.2), circle(3.7, 0.045, 1.2)] }, // the gun barrels
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([3.7, 1.15, 0.6], 1.2, [4.2, 1.2, 2.35], 0.8, 0.12, 0.1, 2) }, // the show's stub wings
    { kind: 'tail', stations: wingPanel([11.1, 2.0, 0.15], 0.9, [11.6, 2.1, 1.6], 0.6, 0.1, 0.09, 2) }, // tailplane
    { kind: 'fin', mirror: false, stations: finPanel([10.7, 1.95, 0], 1.7, [12.0, 3.3, 0], 0.95, 0.12) }, // tail fin
    { kind: 'fin', stations: finPanel([11.2, 2.08, 1.6], 0.7, [11.7, 2.95, 1.6], 0.5, 0.1) }, // tailplane end fins
  ],
  rotors: [
    { kind: 'main', at: [4.7, 3.28, 0], r: 6.06, blades: 2, chord: 0.42, axis: 'y', dir: 1, tilt: [-0.03, 0], mast: 0.78 },
    { kind: 'tail', at: [12.3, 2.75, 0.2], r: 0.95, blades: 2, chord: 0.2, axis: 'z', dir: 1 },
  ],
  gear: { nose: { x: 1.4, y: 0.95, len: 0.62, r: 0.33 }, main: { x: 5.0, y: 1.0, z: 0.95, len: 0.65, r: 0.35 } },
  hardpoints: [
    { at: [4.6, 1.15, 2.4], kind: 'tip', mirror: true }, { at: [4.3, 1.1, 1.6], kind: 'outer', mirror: true }, { at: [4.2, 1.08, 1.0], kind: 'inner', mirror: true }, { at: [4.2, 0.75, 0], kind: 'belly' },
  ],
  cockpit: [1.75, 1.82, 0.4],
  seats: [[1.75, 1.82, 0.4], [1.75, 1.82, -0.4]],
  gun: [2.2, 1.2, 2.35], // the right wing pod's gun
  livery: {
    factory: { base: '#4a4f57', under: '#d9dcdf', finish: 'gloss', insignia: 'none', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.1, color: '#1b1d21' }, { kind: 'stripe', y: 0.95, h: 0.1, color: '#8c9198', x0: 0.1, x1: 0.8 }] }, // dark grey over pearl grey
    camo: { base: '#4b5838', under: '#8b9378', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#2a3024', '#6b5a3c'], scale: 1.1, seed: 22 }] },
    squadron: { base: '#15171b', under: '#2a2d33', finish: 'satin', insignia: 'none', marks: [{ kind: 'stripe', y: 1.0, h: 0.14, color: '#c8252d', x0: 0.1, x1: 0.85 }, { kind: 'fins', color: '#c8252d', from: 0.5 }] },
    airshow: { base: '#f2f2ee', under: '#e4e8ee', finish: 'gloss', insignia: 'none', marks: [{ kind: 'rays', colors: ['#2b5fb0', '#9ec1f0'], n: 7 }, { kind: 'nose', x1: 0.07, color: '#2b5fb0' }, { kind: 'fins', color: '#2b5fb0', from: 0.3 }] },
  },
};
