// Lockheed SR-71 Blackbird. Length 32.74 m, span 16.94 m, height 5.64 m. A long body with sharp chines blending into a
// delta wing, two huge J58 nacelles mid-wing with pointed inlet spikes, tails on the nacelles leaning in, two crew in tandem.
// Research: .scratch/airplane-clock/research/jets/sr71.md
import type { JetSpec } from '../three/spec';
import { circle, oval, wingPanel } from './parts';

const NZ = 4.05;

export const sr71: JetSpec = {
  id: 'sr71', length: 32.74, span: 16.94, height: 5.64,
  bodies: [
    { sections: [ // the chines run the length of the nose (n < 2) and blend into the wing
      oval(0, 0.02, 0.01, 0.01, 0), oval(3.0, 0.75, 0.32, 0.26, 0, 1.25, 1.25), oval(6.5, 1.35, 0.55, 0.42, 0.02, 1.3, 1.3), oval(10.0, 1.9, 0.68, 0.5, 0.02, 1.35, 1.35),
      oval(14.0, 2.1, 0.72, 0.52, 0, 1.5, 1.5), oval(22.0, 1.9, 0.66, 0.5, 0, 1.6, 1.6), oval(28.0, 1.15, 0.5, 0.4, 0, 1.6, 1.6), oval(32.74, 0.15, 0.1, 0.1, 0.05),
    ] },
    { sections: [ // the pilot's and the reconnaissance officer's canopies, in tandem
      oval(4.6, 0.08, 0.02, 0.06, 0.45), oval(5.2, 0.38, 0.36, 0.1, 0.45), oval(6.2, 0.42, 0.42, 0.1, 0.5), oval(7.3, 0.42, 0.42, 0.1, 0.52), oval(8.4, 0.38, 0.32, 0.1, 0.55), oval(9.0, 0.2, 0.05, 0.1, 0.56),
    ], finish: 'glass' },
    { z: NZ, mirror: true, sections: [ // the nacelles
      circle(10.3, 0.72, 0.15), circle(11.5, 0.86, 0.15), circle(20.0, 0.9, 0.15), circle(26.5, 0.82, 0.15), circle(27.6, 0.78, 0.15),
    ], openFront: true },
    { z: NZ, mirror: true, finish: 'metal', sections: [circle(7.6, 0.01, 0.15), circle(9.5, 0.38, 0.15), circle(10.9, 0.62, 0.15), circle(11.4, 0.4, 0.15)] }, // inlet spikes
  ],
  surfaces: [
    { kind: 'wing', stations: [
      { le: [12.0, 0.0, 1.8], chord: 17.5, t: 0.035 }, { le: [15.5, 0.05, NZ - 0.6], chord: 12.5, t: 0.035 }, { le: [19.0, 0.1, NZ + 0.8], chord: 8.6, t: 0.035 },
      { le: [24.2, 0.15, 8.47], chord: 3.0, t: 0.03 },
    ] },
    { kind: 'fin', stations: wingPanel([21.6, 0.85, NZ], 5.2, [24.6, 3.65, NZ - 0.8], 2.4, 0.05, 0.04, 3) },
  ],
  nozzles: [{ at: [28.4, 0.15, NZ], r: 0.78, len: 1.0, mirror: true }],
  gear: { nose: { x: 6.0, y: -0.45, len: 1.45, r: 0.38, twin: true }, main: { x: 17.8, y: -0.72, z: NZ, len: 1.18, r: 0.42, twin: true } },
  hardpoints: [{ at: [16.0, -0.55, 1.2], kind: 'belly' }],
  cockpit: [6.4, 0.75, 0],
  seats: [[6.4, 0.75, 0], [8.0, 0.8, 0]],
  flame: 'round',
  livery: {
    factory: { base: '#0e1014', under: '#0e1014', finish: 'matte', insignia: 'none', marks: [{ kind: 'stripe', y: 0.0, h: 0.05, color: '#8a1d24', x0: 0.05, x1: 0.95 }] },
    camo: { base: '#3d4652', under: '#5f6873', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#252b33', '#59626e'], scale: 1.6, seed: 71 }] },
    squadron: { base: '#0e1014', under: '#0e1014', finish: 'matte', insignia: 'none', marks: [{ kind: 'fins', color: '#1d3f8f', from: 0.4 }, { kind: 'nose', x1: 0.04, color: '#f2f2f2' }] }, // NASA tails
    airshow: { base: '#141518', under: '#141518', finish: 'gloss', insignia: 'star', marks: [{ kind: 'rays', colors: ['#141518', '#c8202f'], n: 14 }, { kind: 'fins', color: '#c8202f', from: 0.6 }] },
  },
};
