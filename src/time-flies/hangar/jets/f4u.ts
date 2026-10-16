// Vought F4U-1D Corsair. Length 10.2 m, span 12.5 m, height 4.5 m, 4.06 m three-blade propeller on the R-2800. The
// inverted gull wing bends down to the main gear, then up to the tips; the cockpit sits far back behind a long nose.
// Research: .scratch/airplane-clock/research/jets/f4u-corsair.md
import type { JetSpec } from '../three/spec';
import { bubble, joined, oval, roundedPanel, wingPanel } from './parts';

export const f4u: JetSpec = {
  id: 'f4u', length: 10.2, span: 12.5, height: 4.5,
  bodies: [
    { sections: [ // the big round cowling (open at the front, with the engine dark inside), then the fuselage
      oval(0.55, 0.64, 0.64, 0.66, 0), oval(0.75, 0.7, 0.7, 0.72, 0), oval(1.7, 0.72, 0.72, 0.74, 0), oval(2.8, 0.66, 0.68, 0.74, 0),
      oval(4.2, 0.58, 0.6, 0.72, 0.02), oval(5.6, 0.48, 0.5, 0.66, 0.05), oval(7.2, 0.34, 0.4, 0.52, 0.1), oval(8.8, 0.18, 0.28, 0.34, 0.16),
      oval(9.9, 0.06, 0.12, 0.12, 0.2), oval(10.2, 0.02, 0.04, 0.04, 0.22),
    ], openFront: true },
    { sections: bubble(4.2, 6.1, 0.5, 0.36, 0.5, 0.42), finish: 'glass' },
    { sections: [oval(6.0, 0.05, 0.01, 0.05, 0.5), oval(8.2, 0.06, 0.48, 0.05, 0.35)] }, // dorsal fillet
  ],
  surfaces: [
    { kind: 'wing', stations: joined( // the gull: down and out to the bend, then up to the tip
      wingPanel([2.4, -0.45, 0.55], 2.75, [2.55, -1.05, 2.45], 2.55, 0.17, 0.15, 2),
      roundedPanel([2.55, -1.05, 2.45], 2.55, [3.15, -0.45, 5.9], 1.5, 0.15, 0.09, 0.36, 3),
    ) },
    { kind: 'tail', stations: roundedPanel([8.45, 0.18, 0.15], 1.45, [8.95, 0.18, 2.2], 0.85, 0.09, 0.08, 0.32) },
    { kind: 'fin', mirror: false, stations: roundedPanel([7.95, 0.35, 0], 1.95, [8.9, 1.62, 0], 1.0, 0.09, 0.08, 0.32) },
  ],
  nozzles: [],
  props: [{ at: [0.52, 0, 0], r: 2.03, blades: 3, spinner: 0.4, chord: 0.36 }],
  stacks: [[1.85, -0.25, 0.68], [1.95, -0.45, 0.62]],
  gear: { main: { x: 2.95, y: -1.05, z: 2.4, len: 0.85, r: 0.42 }, tail: { x: 9.2, y: -0.12, len: 0.38, r: 0.12 } },
  hardpoints: [{ at: [3.0, -1.0, 1.4], kind: 'inner' }, { at: [3.4, -0.75, 3.9], kind: 'outer' }, { at: [3.4, -0.6, 4.6], kind: 'outer' }, { at: [3.5, -0.8, 0], kind: 'belly', mirror: false }],
  cockpit: [5.0, 0.68, 0],
  flame: 'stacks',
  livery: {
    factory: { base: '#1b2a4c', finish: 'gloss', insignia: 'star' }, // glossy sea blue
    camo: { base: '#3a4a6c', under: '#e4e4dd', finish: 'satin', insignia: 'star', marks: [{ kind: 'camo', colors: ['#2b3653', '#566f8c'], scale: 0.7, seed: 4 }] },
    squadron: { base: '#1b2a4c', finish: 'gloss', insignia: 'star', marks: [ // the Black Sheep
      { kind: 'nose', x1: 0.06, color: '#f4f4f4' }, { kind: 'fins', color: '#f4f4f4', from: 0.78 }, { kind: 'band', x0: 0.62, x1: 0.65, color: '#f4f4f4' },
    ] },
    airshow: { base: '#c8202f', under: '#f4f4f4', finish: 'gloss', insignia: 'none', marks: [ // an air racer
      { kind: 'stripe', y: 0.15, h: 0.16, color: '#f4f4f4' }, { kind: 'nose', x1: 0.08, color: '#f4f4f4' }, { kind: 'wingtips', color: '#f4f4f4', from: 0.85 }, { kind: 'fins', color: '#f4f4f4', from: 0.7 },
    ] },
  },
};
