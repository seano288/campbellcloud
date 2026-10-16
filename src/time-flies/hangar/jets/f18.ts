// Boeing F/A-18E Super Hornet. Length 18.31 m, span 13.62 m, height 4.88 m. Big leading-edge extensions (LEX) from the
// wing root up beside the cockpit, caret intakes under them, twin tails canted out 20° ahead of the stabilators.
// Research: .scratch/airplane-clock/research/jets/f18-super-hornet.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const f18: JetSpec = {
  id: 'f18', length: 18.31, span: 13.62, height: 4.88,
  bodies: [
    { sections: [
      oval(0, 0.02, 0.02, 0.02, 0), oval(1.2, 0.36, 0.36, 0.38, 0), oval(2.8, 0.52, 0.5, 0.52, 0.02), oval(4.6, 0.62, 0.58, 0.58, 0.04, 2.2, 2.3),
      oval(7.0, 0.72, 0.58, 0.55, 0.04, 2.5, 2.8), oval(10.0, 0.95, 0.56, 0.5, 0.03, 3, 3.5), oval(13.5, 0.98, 0.52, 0.48, 0.02, 3, 3.5),
      oval(16.0, 0.85, 0.46, 0.46, 0, 2.8, 3), oval(17.4, 0.62, 0.38, 0.38, 0, 2.2, 2.4),
    ] },
    { sections: bubble(3.4, 6.6, 0.48, 0.44, 0.58, 0.42), finish: 'glass' },
    { z: 0.95, mirror: true, sections: [ // the caret intakes under the LEX
      oval(7.1, 0.38, 0.38, 0.45, -0.38, 5, 4), oval(8.0, 0.42, 0.4, 0.46, -0.36, 4.5, 3.5), oval(11.0, 0.45, 0.4, 0.42, -0.3, 3.5, 3),
      oval(14.5, 0.4, 0.38, 0.38, -0.2, 2.8, 2.8),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'strake', stations: [ // the LEX, sweeping forward beside the cockpit
      { le: [4.6, 0.12, 0.55], chord: 8.6, t: 0.03 }, { le: [7.0, 0.08, 1.15], chord: 5.6, t: 0.035 }, { le: [9.3, 0.06, 1.75], chord: 3.6, t: 0.04 },
    ] },
    { kind: 'wing', stations: wingPanel([9.3, 0.04, 1.65], 4.6, [12.05, 0.0, 6.45], 1.75, 0.05, 0.04, 4) },
    { kind: 'tail', stations: wingPanel([15.5, 0.0, 0.95], 2.65, [16.9, -0.05, 3.4], 1.2, 0.05, 0.04, 2) },
    { kind: 'fin', stations: wingPanel([12.2, 0.5, 1.05], 3.4, [14.6, 2.95, 1.95], 1.45, 0.05, 0.04, 3) },
  ],
  nozzles: [{ at: [18.2, 0, 0.55], r: 0.48, len: 1.0, mirror: true }],
  gear: { nose: { x: 4.4, y: -0.55, len: 1.25, r: 0.28, twin: true }, main: { x: 11.0, y: -0.45, z: 1.65, len: 1.18, r: 0.42 } },
  hardpoints: [
    { at: [12.9, 0.0, 6.6], kind: 'tip' }, { at: [12.0, -0.12, 5.1], kind: 'outer' }, { at: [11.2, -0.1, 3.4], kind: 'inner' },
    { at: [11.0, -0.65, 0], kind: 'belly', mirror: false }, { at: [9.0, -0.75, 0.95], kind: 'belly' },
  ],
  cockpit: [4.9, 0.95, 0],
  flame: 'round',
  livery: {
    factory: { base: '#8e979e', under: '#b0b7bc', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'nose', x1: 0.07, color: '#7f878d' }] }, // Navy tactical greys
    camo: { base: '#9cb0c0', under: '#c7d2db', finish: 'matte', insignia: 'none', marks: [{ kind: 'splinter', colors: ['#56708a', '#d9e2ea', '#2f4258'], seed: 18 }] }, // aggressor splinter
    squadron: { base: '#8e979e', under: '#b0b7bc', finish: 'satin', insignia: 'star', marks: [ // CAG colour bird
      { kind: 'fins', color: '#141414' }, { kind: 'stripe', y: 0.18, h: 0.14, color: '#f2c230', x0: 0.05, x1: 0.42 }, { kind: 'nose', x1: 0.05, color: '#141414' },
    ] },
    airshow: { base: '#1b2b6b', under: '#1b2b6b', finish: 'gloss', insignia: 'none', marks: [ // Blue Angels
      { kind: 'leading', color: '#f2c230', w: 0.13, under: true }, { kind: 'spine', w: 0.4, color: '#f2c230', x0: 0.05, x1: 0.95 },
      { kind: 'stripe', y: -0.12, h: 0.16, color: '#f2c230', x0: 0.04, x1: 0.85 }, { kind: 'fins', color: '#f2c230', from: 0.88 },
    ] },
  },
};
