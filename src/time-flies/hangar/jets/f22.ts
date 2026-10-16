// Lockheed Martin F-22 Raptor. Length 18.92 m, span 13.56 m, height 5.08 m. Chined stealth nose, diamond-shaped wing
// (42° leading edge, trailing edge swept forward 17°), caliper intakes, twin tails canted out 28°, flat thrust-vectoring
// nozzles. Research: .scratch/airplane-clock/research/jets/f22-raptor.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const f22: JetSpec = {
  id: 'f22', length: 18.92, span: 13.56, height: 5.08,
  bodies: [
    { sections: [ // chines along the nose (n < 2 makes the sharp edge)
      oval(0, 0.02, 0.01, 0.01, 0), oval(1.2, 0.42, 0.25, 0.22, 0, 1.5, 1.5), oval(2.8, 0.66, 0.42, 0.35, 0.02, 1.6, 1.6), oval(4.6, 0.82, 0.56, 0.42, 0.04, 1.8, 1.7),
      oval(7.0, 1.2, 0.58, 0.42, 0.02, 2.4, 2.4), oval(10.0, 1.5, 0.52, 0.42, 0, 2.8, 3.2), oval(14.0, 1.45, 0.45, 0.4, 0, 2.8, 3.2), oval(17.6, 1.15, 0.36, 0.32, 0, 2.6, 3),
      oval(18.5, 1.05, 0.3, 0.28, 0, 3, 3),
    ] },
    { sections: bubble(2.9, 6.6, 0.48, 0.5, 0.62, 0.4), finish: 'glass' },
    { z: 1.25, mirror: true, sections: [ // the caliper intakes
      oval(6.3, 0.48, 0.5, 0.5, -0.2, 1.7, 1.7), oval(7.2, 0.52, 0.52, 0.52, -0.2, 1.8, 1.8), oval(10.0, 0.5, 0.48, 0.45, -0.15, 2.2, 2.2), oval(12.5, 0.3, 0.4, 0.38, -0.1),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([8.4, 0.0, 1.45], 7.5, [13.25, -0.05, 6.78], 1.3, 0.05, 0.03, 4) },
    { kind: 'tail', stations: wingPanel([16.3, -0.05, 1.3], 3.0, [17.9, -0.05, 4.05], 1.4, 0.045, 0.035, 2) },
    { kind: 'fin', stations: wingPanel([13.5, 0.45, 1.3], 3.9, [16.1, 2.9, 2.6], 1.5, 0.045, 0.035, 3) },
  ],
  nozzles: [{ at: [18.85, 0, 0.66], r: 0.5, len: 1.2, mirror: true, flat: { w: 0.55, h: 0.3 } }],
  gear: { nose: { x: 4.8, y: -0.45, len: 1.35, r: 0.28 }, main: { x: 11.4, y: -0.38, z: 1.65, len: 1.3, r: 0.4 } },
  hardpoints: [{ at: [12.4, -0.12, 4.6], kind: 'outer' }, { at: [11.3, -0.1, 3.0], kind: 'inner' }, { at: [10.6, -0.55, 0.6], kind: 'belly' }],
  cockpit: [4.5, 1.0, 0],
  flame: 'flat',
  livery: {
    factory: { base: '#848a8f', under: '#8e9499', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'splinter', colors: ['#6a7075'], seed: 22 }] },
    camo: { base: '#d9dde0', under: '#e6e9eb', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'splinter', colors: ['#8d959b', '#5b6369'], seed: 7 }] }, // arctic aggressor
    squadron: { base: '#848a8f', under: '#8e9499', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'fins', color: '#141414', from: 0.6 }, { kind: 'checker', x0: 0.82, x1: 0.9, colors: ['#f2c230', '#141414'], n: 3 }] },
    airshow: { base: '#5f666b', under: '#5f666b', finish: 'gloss', insignia: 'star', marks: [ // heritage: red, yellow and blue
      { kind: 'fins', color: '#c8202f', from: 0.55 }, { kind: 'stripe', y: 0.25, h: 0.14, color: '#f2c230', x0: 0.05, x1: 0.95 }, { kind: 'leading', color: '#1d3f8f', w: 0.08 },
    ] },
  },
};
