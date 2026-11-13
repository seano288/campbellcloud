// Lockheed SR-71 Blackbird. Length 32.74 m (with the nose probe), span 16.94 m, height 5.64 m. A long round body with
// thin sharp chines along the front half that blend into a delta wing; two huge J58 nacelles out at 4.2 m, starting
// halfway back, with pointed inlet spikes and the outer wing beyond them; fins on top of the nacelles leaning in, two crew
// in tandem. Research: .scratch/airplane-clock/research/jets/sr71.md
import type { JetSpec } from '../three/spec';
import { circle, oval } from './parts';

const NZ = 4.2, NY = 0.1;

export const sr71: JetSpec = {
  id: 'sr71', length: 32.74, span: 16.94, height: 5.64,
  bodies: [
    { segs: 32, sections: [ // the round fuselage
      oval(1.1, 0.03, 0.03, 0.03, -0.42), oval(2.5, 0.3, 0.28, 0.22, -0.3), oval(5.0, 0.55, 0.55, 0.32, -0.1), oval(8.4, 0.72, 0.6, 0.42, 0.1),
      oval(12.0, 0.82, 0.63, 0.55, 0.17), oval(20.0, 0.85, 0.62, 0.6, 0.17), oval(27.0, 0.8, 0.55, 0.52, 0.17), oval(29.7, 0.7, 0.45, 0.45, 0.2),
      oval(31.6, 0.38, 0.22, 0.22, 0.3), oval(32.74, 0.03, 0.03, 0.03, 0.42),
    ] },
    { segs: 24, sections: [ // the chines: a thin sharp-edged shelf along the nose that becomes the wing root
      oval(1.1, 0.02, 0.02, 0.02, -0.42), oval(3.0, 0.78, 0.1, 0.08, -0.32, 1.4, 1.4), oval(5.0, 1.2, 0.12, 0.1, -0.24, 1.4, 1.4), oval(8.4, 1.58, 0.12, 0.1, -0.17, 1.4, 1.4),
      oval(12.0, 1.76, 0.12, 0.1, -0.12, 1.4, 1.4), oval(16.5, 1.84, 0.12, 0.1, -0.08, 1.4, 1.4), oval(20.0, 1.2, 0.1, 0.1, -0.05, 1.4, 1.4), oval(24.0, 0.6, 0.08, 0.08, 0, 1.4, 1.4),
    ] },
    { finish: 'glass', sections: [ // the pilot's and the reconnaissance officer's canopies, in tandem
      oval(4.9, 0.05, 0.02, 0.05, 0.42), oval(5.3, 0.4, 0.3, 0.1, 0.45), oval(6.0, 0.48, 0.42, 0.12, 0.5), oval(7.0, 0.48, 0.42, 0.12, 0.55), oval(8.0, 0.44, 0.35, 0.12, 0.62), oval(8.6, 0.3, 0.1, 0.1, 0.68),
    ] },
    { z: NZ, mirror: true, segs: 32, sections: [ // the nacelles, from the inlet lip to the ejector
      circle(18.4, 0.74, NY), circle(19.4, 0.84, NY), circle(21.0, 0.9, NY), circle(25.0, 0.9, NY), circle(27.5, 0.86, NY), circle(29.0, 0.8, NY), circle(30.0, 0.74, NY),
    ], openFront: true },
    { z: NZ, mirror: true, segs: 20, finish: 'metal', sections: [circle(17.0, 0.01, NY), circle(17.9, 0.28, NY), circle(18.6, 0.48, NY), circle(19.2, 0.5, NY), circle(19.6, 0.3, NY)] }, // inlet spikes
    { segs: 8, finish: 'metal', sections: [circle(0, 0.015, -0.42), circle(0.3, 0.03, -0.42), circle(1.2, 0.05, -0.42)] }, // the nose probe
  ],
  surfaces: [
    { kind: 'wing', stations: [ // the inner wing runs from the chines to the nacelles, the outer wing curves out of the nacelle's outboard chine
      { le: [15.0, 0, 1.0], chord: 16.2, t: 0.03 }, { le: [16.49, 0, 1.84], chord: 14.46, t: 0.03 }, { le: [19.1, 0, 3.3], chord: 10.8, t: 0.03 },
      { le: [19.6, 0, 5.1], chord: 10.6, t: 0.03 }, { le: [21.0, 0.01, 5.6], chord: 9.2, t: 0.03 }, { le: [24.3, 0.03, 6.09], chord: 5.9, t: 0.03 },
      { le: [28.5, 0.06, 8.2], chord: 1.75, t: 0.03 }, { le: [29.4, 0.06, 8.47], chord: 0.6, t: 0.03 },
    ] },
    { kind: 'fin', stations: [{ le: [26.7, 0.9, NZ], chord: 5.0, t: 0.05 }, { le: [27.85, 2.1, NZ - 0.3], chord: 3.7, t: 0.045 }, { le: [29.0, 3.35, NZ - 0.6], chord: 2.4, t: 0.04 }] }, // leaning in
  ],
  nozzles: [{ at: [30.05, NY, NZ], r: 0.7, len: 1.0, mirror: true }],
  gear: { nose: { x: 10.6, y: -0.35, len: 1.57, r: 0.38, twin: true }, main: { x: 23.0, y: -0.22, z: 2.6, len: 1.66, r: 0.42, twin: true } },
  hardpoints: [{ at: [17.0, -0.26, 1.3], kind: 'belly' }],
  cockpit: [5.9, 0.52, 0],
  seats: [[5.9, 0.52, 0], [7.6, 0.56, 0]],
  flame: 'round',
  livery: {
    factory: { base: '#0e1014', under: '#0e1014', finish: 'matte', insignia: 'none', marks: [{ kind: 'stripe', y: 0.0, h: 0.05, color: '#8a1d24', x0: 0.05, x1: 0.95 }] },
    camo: { base: '#3d4652', under: '#5f6873', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#252b33', '#59626e'], scale: 1.6, seed: 71 }] },
    squadron: { base: '#0e1014', under: '#0e1014', finish: 'matte', insignia: 'none', marks: [{ kind: 'fins', color: '#1d3f8f', from: 0.4 }, { kind: 'nose', x1: 0.04, color: '#f2f2f2' }] }, // NASA tails
    airshow: { base: '#141518', under: '#141518', finish: 'gloss', insignia: 'star', marks: [{ kind: 'rays', colors: ['#141518', '#c8202f'], n: 14 }, { kind: 'fins', color: '#c8202f', from: 0.6 }] },
  },
};
