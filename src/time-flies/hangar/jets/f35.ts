// Lockheed Martin F-35A Lightning II. Length 15.7 m, span 10.7 m, height 4.38 m, wing area 42.7 m². A wide stealth body
// with chines, bump (DSI) intakes, a big one-piece canopy, twin canted tails and one large round nozzle.
// Research: .scratch/airplane-clock/research/jets/f35-lightning2.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const f35: JetSpec = {
  id: 'f35', length: 15.7, span: 10.7, height: 4.38,
  bodies: [
    { sections: [
      oval(0, 0.02, 0.01, 0.01, 0), oval(1.1, 0.4, 0.28, 0.25, 0, 1.6, 1.6), oval(2.6, 0.65, 0.48, 0.42, 0.02, 1.7, 1.7), oval(4.2, 0.82, 0.6, 0.5, 0.04, 1.9, 1.9),
      oval(6.5, 1.35, 0.62, 0.52, 0.02, 2.6, 2.8), oval(9.5, 1.45, 0.6, 0.55, 0, 2.8, 3), oval(12.5, 1.2, 0.55, 0.55, 0, 2.6, 2.8), oval(14.6, 0.85, 0.55, 0.55, 0, 2.2, 2.2),
      oval(15.0, 0.7, 0.62, 0.62, 0),
    ] },
    { sections: bubble(2.4, 5.8, 0.52, 0.5, 0.62, 0.42), finish: 'glass' },
    { z: 1.02, mirror: true, sections: [ // the DSI intakes with their bump
      oval(5.2, 0.38, 0.42, 0.42, -0.05, 1.8, 2.2), oval(6.0, 0.45, 0.46, 0.46, -0.05, 2, 2.4), oval(8.5, 0.42, 0.42, 0.42, 0, 2.4, 2.6),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([7.0, 0.05, 1.4], 6.0, [10.1, 0.0, 5.35], 1.65, 0.05, 0.035, 4) },
    { kind: 'tail', stations: wingPanel([13.3, 0.0, 1.0], 2.6, [14.6, 0.0, 3.3], 1.15, 0.045, 0.035, 2) },
    { kind: 'fin', stations: wingPanel([11.3, 0.5, 1.0], 3.05, [13.25, 2.42, 1.7], 1.25, 0.045, 0.035, 3) },
  ],
  nozzles: [{ at: [15.7, -0.05, 0], r: 0.58, len: 1.0 }],
  gear: { nose: { x: 4.0, y: -0.48, len: 1.15, r: 0.28 }, main: { x: 9.6, y: -0.45, z: 1.5, len: 1.07, r: 0.4 } },
  hardpoints: [{ at: [10.0, -0.12, 4.6], kind: 'tip' }, { at: [9.3, -0.1, 3.4], kind: 'outer' }, { at: [8.6, -0.1, 2.3], kind: 'inner' }, { at: [8.0, -0.6, 0.6], kind: 'belly' }],
  cockpit: [3.9, 0.95, 0],
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
