// Bell UH-1H Iroquois "Huey". Fuselage 12.65 m, two-blade 14.63 m main rotor, height 4.39 m, skids 2.9 m apart, a slim tail
// boom with a small stabiliser and a two-blade tail rotor on the left of the fin, big sliding cabin doors.
// Research: .scratch/chop-chop/research/helis/uh1-huey.md
import type { HeliSpec } from '../three/spec';
import { finPanel, oval, wingPanel } from './parts';

export const uh1: HeliSpec = {
  id: 'uh1', length: 12.65, rotorDiameter: 14.63, height: 4.39,
  bodies: [
    { sections: [ // the rounded bubble nose, the deep cabin, then the slim tail boom
      oval(0, 0.18, 0.4, 0.4, 1.3, 1.5), oval(0.5, 0.65, 0.8, 0.65, 1.55, 2.4, 2.4), oval(1.3, 0.85, 1.0, 0.85, 1.65, 2.6, 2.6), oval(2.5, 0.92, 1.0, 0.85, 1.7, 3, 3),
      oval(5.6, 0.92, 0.95, 0.8, 1.7, 3, 3.2), oval(7.0, 0.7, 0.75, 0.55, 1.8, 2.4), oval(8.4, 0.38, 0.4, 0.34, 2.15), oval(10.2, 0.2, 0.26, 0.22, 2.4),
      oval(12.2, 0.14, 0.2, 0.2, 2.65), oval(12.65, 0.1, 0.15, 0.15, 2.72),
    ] },
    { sections: [
      oval(0.45, 0.58, 0.35, 0.3, 1.95, 2.4), oval(0.9, 0.78, 0.45, 0.4, 2.1, 2.5), oval(1.5, 0.87, 0.42, 0.4, 2.15, 2.6), oval(2.2, 0.93, 0.4, 0.4, 2.2, 3),
    ], finish: 'glass' },
    { sections: [ // the engine and gearbox hump on the roof
      oval(2.4, 0.2, 0.1, 0.1, 2.7), oval(3.1, 0.6, 0.35, 0.1, 2.85, 2.4), oval(5.0, 0.55, 0.3, 0.1, 2.85, 2.4), oval(6.2, 0.15, 0.1, 0.1, 2.7),
    ] },
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([3.5, 1.35, 0.8], 0.7, [3.6, 1.3, 1.6], 0.5, 0.1, 0.08, 2) }, // the stubby weapons pylons
    { kind: 'tail', stations: wingPanel([10.4, 2.5, 0.12], 0.7, [10.5, 2.5, 0.95], 0.5, 0.08, 0.06, 2) }, // the small stabiliser
    { kind: 'fin', mirror: false, stations: finPanel([10.8, 2.65, 0], 1.7, [11.9, 3.7, 0], 0.8, 0.1) }, // the tail fin
  ],
  rotors: [
    { kind: 'main', at: [3.6, 3.95, 0], r: 7.315, blades: 2, chord: 0.53, axis: 'y', dir: 1, mast: 0.9 },
    { kind: 'tail', at: [12.0, 3.0, -0.25], r: 1.3, blades: 2, chord: 0.25, axis: 'z', dir: 1 },
  ],
  skids: { x0: 1.1, x1: 5.5, z: 1.45, r: 0.06, struts: [{ x: 2.2, y: 0.95, z: 0.75 }, { x: 4.6, y: 0.95, z: 0.75 }] },
  hardpoints: [{ at: [4.0, 1.25, 1.2], kind: 'inner' }, { at: [4.0, 1.2, 1.55], kind: 'outer' }],
  cockpit: [1.0, 2.05, 0.4],
  seats: [[1.0, 2.05, 0.4], [1.0, 2.05, -0.4]],
  gun: [3.8, 1.9, 0.95], // the door gun
  livery: {
    factory: { base: '#4b5320', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.1, color: '#1a1a1a' }] }, // Vietnam-era olive drab
    camo: { base: '#4b5320', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#2f3a1c', '#6b5a3c'], scale: 1.1, seed: 11 }] },
    squadron: { base: '#4b5320', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'band', x0: 0.3, x1: 0.42, color: '#f2f2f2' }, { kind: 'stripe', y: 0.1, h: 0.34, color: '#c8102e', x0: 0.33, x1: 0.39 }] }, // medevac "Dust Off" with its red cross
    airshow: { base: '#f2f2ee', finish: 'gloss', insignia: 'none', marks: [{ kind: 'rays', colors: ['#e8452c', '#f2b81c'], n: 9 }, { kind: 'nose', x1: 0.06, color: '#e8452c' }, { kind: 'fins', color: '#e8452c', from: 0.3 }] },
  },
};
