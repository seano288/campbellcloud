// Lockheed Martin F-35A Lightning II. Length 15.7 m, span 10.7 m, height 4.38 m, wing area 42.7 m². A deep, wide stealth
// body (2 m from spine to belly) with a chined nose, a big one-piece canopy, DSI intakes with the bump inside each mouth,
// a trapezoid wing, twin tails canted out 25° on a flat beaver tail, the stabilators reaching past one large round nozzle.
// Research: .scratch/airplane-clock/research/jets/f35-lightning2.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const f35: JetSpec = {
  id: 'f35', length: 15.7, span: 10.7, height: 4.38,
  bodies: [
    { sections: [
      oval(0, 0.02, 0.01, 0.01, -0.18), oval(1.1, 0.42, 0.3, 0.3, -0.12, 1.6, 1.6), oval(1.9, 0.6, 0.62, 0.62, -0.15, 1.7, 1.8), oval(3.3, 0.78, 0.7, 0.82, -0.12, 1.9, 2.2),
      oval(4.6, 0.82, 1.12, 0.95, -0.05, 2.2, 2.4), oval(6.4, 1.5, 1.05, 1.0, -0.05, 2.6, 2.8), oval(9.5, 1.72, 0.95, 1.08, 0, 2.8, 2.8), oval(12.0, 1.45, 0.8, 1.0, 0, 2.6, 2.8),
      oval(13.3, 1.3, 0.55, 0.55, -0.05, 3, 3), oval(13.9, 1.22, 0.42, 0.32, -0.08, 3.5, 3.5), // the flat beaver tail under the fins
    ] },
    { sections: bubble(1.85, 4.9, 0.45, 0.55, 0.69, 0.45), finish: 'glass' },
    { z: 1.06, mirror: true, sections: [ // the DSI intakes: the mouth sits beside the bump, with no splitter plate
      oval(4.3, 0.4, 0.55, 0.55, -0.25, 2.6, 2.6), oval(5.2, 0.48, 0.58, 0.58, -0.25, 2.6, 2.6), oval(6.5, 0.5, 0.55, 0.6, -0.28, 2.6, 2.6), oval(8.5, 0.45, 0.45, 0.55, -0.3), oval(10.0, 0.2, 0.3, 0.4, -0.3),
    ], openFront: true },
    { z: 0.7, mirror: true, segs: 16, sections: [oval(3.4, 0.02, 0.02, 0.02, -0.25), oval(4.4, 0.24, 0.36, 0.36, -0.25), oval(5.4, 0.1, 0.2, 0.2, -0.25)] }, // the DSI bumps
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([7.3, 0.03, 1.4], 4.75, [10.0, -0.02, 5.35], 1.45, 0.05, 0.035, 4) },
    { kind: 'tail', stations: wingPanel([12.9, -0.05, 0.9], 2.7, [14.0, -0.05, 3.65], 1.15, 0.045, 0.035, 2) },
    { kind: 'fin', stations: wingPanel([11.6, 0.4, 1.1], 2.6, [13.5, 2.43, 2.0], 1.45, 0.045, 0.035, 3) }, // canted out 25°
  ],
  nozzles: [{ at: [14.3, -0.35, 0], r: 0.58, len: 1.1 }],
  gear: { nose: { x: 4.0, y: -0.95, len: 0.69, r: 0.28 }, main: { x: 9.6, y: -0.8, z: 1.3, len: 0.72, r: 0.4 } },
  hardpoints: [{ at: [10.3, -0.06, 4.6], kind: 'tip' }, { at: [9.9, -0.06, 3.4], kind: 'outer' }, { at: [9.4, -0.08, 2.3], kind: 'inner' }, { at: [8.0, -1.12, 0.6], kind: 'belly' }],
  cockpit: [3.4, 0.74, 0],
  flame: 'round',
  livery: {
    factory: { base: '#5d6369', under: '#61676d', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#53595f'], scale: 1.2, seed: 35 }] },
    camo: { base: '#c8cdd1', under: '#d7dbde', finish: 'matte', insignia: 'none', marks: [{ kind: 'splinter', colors: ['#7f878e', '#3f464c'], seed: 12 }] },
    squadron: { base: '#5d6369', under: '#61676d', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'fins', color: '#1d3f8f', from: 0.3 }, { kind: 'stripe', y: 0.3, h: 0.1, color: '#f2c230', x0: 0.75, x1: 0.95 }] },
    airshow: { base: '#4d5359', under: '#4d5359', finish: 'gloss', insignia: 'star', marks: [ // demo team: gold and black
      { kind: 'fins', color: '#141414', from: 0.25 }, { kind: 'leading', color: '#d7a531', w: 0.12 }, { kind: 'stripe', y: 0.15, h: 0.12, color: '#d7a531', x0: 0.04, x1: 0.9 },
    ] },
  },
};
