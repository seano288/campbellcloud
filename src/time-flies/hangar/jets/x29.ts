// Grumman X-29. Length 14.66 m (without the nose probe), span 8.29 m, height 4.36 m. A test plane with its wings swept
// forward more than 30°, canards just ahead of them by the intakes, an F-5 nose and canopy, strake flaps either side of the
// tail and one F404 with an afterburner. Research: .scratch/airplane-clock/research/jets/x29.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const x29: JetSpec = {
  id: 'x29', length: 14.66, span: 8.29, height: 4.36,
  bodies: [
    { sections: [
      oval(0, 0.02, 0.02, 0.02, -0.02), oval(1.0, 0.24, 0.22, 0.22, -0.02), oval(2.4, 0.4, 0.4, 0.4, 0), oval(4.0, 0.5, 0.48, 0.48, 0.02, 2.2, 2.4),
      oval(6.4, 0.66, 0.52, 0.5, 0.04, 2.6, 2.8), oval(9.5, 0.72, 0.52, 0.48, 0.04, 2.8, 3), oval(12.0, 0.66, 0.48, 0.46, 0.03, 2.8, 3),
      oval(13.9, 0.52, 0.46, 0.46, 0.02, 2.3, 2.4), oval(14.4, 0.48, 0.45, 0.45, 0.02),
    ] },
    { sections: bubble(2.6, 4.9, 0.4, 0.36, 0.46, 0.4), finish: 'glass' },
    { sections: [oval(4.6, 0.28, 0.02, 0.1, 0.42), oval(5.6, 0.34, 0.22, 0.1, 0.44), oval(10.6, 0.32, 0.2, 0.1, 0.46), oval(12.0, 0.16, 0.04, 0.1, 0.44)] }, // the spine
    { z: 0.72, mirror: true, sections: [ // the intakes beside the fuselage
      oval(4.6, 0.22, 0.4, 0.4, -0.12, 4, 4), oval(5.3, 0.32, 0.42, 0.42, -0.12, 3.5, 3.5), oval(8.4, 0.32, 0.4, 0.4, -0.12, 3, 3), oval(10.0, 0.1, 0.24, 0.26, -0.12),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'tail', stations: wingPanel([7.3, 0.08, 0.95], 2.1, [8.4, 0.08, 2.1], 0.9, 0.05, 0.04, 2) }, // the canards
    { kind: 'wing', stations: wingPanel([10.1, 0.18, 0.8], 3.3, [8.05, 0.18, 4.15], 1.1, 0.05, 0.035, 4) }, // swept forward
    { kind: 'strake', stations: [{ le: [11.4, -0.15, 0.7], chord: 3.1, t: 0.03 }, { le: [12.6, -0.15, 1.3], chord: 1.9, t: 0.03 }] }, // strake flaps
    { kind: 'fin', mirror: false, stations: wingPanel([10.9, 0.45, 0], 3.2, [13.25, 2.72, 0], 1.1, 0.05, 0.04, 3) },
  ],
  nozzles: [{ at: [14.66, 0.02, 0], r: 0.42, len: 0.9 }],
  gear: { nose: { x: 4.2, y: -0.55, len: 0.86, r: 0.23 }, main: { x: 9.8, y: -0.5, z: 1.0, len: 0.86, r: 0.28 } },
  hardpoints: [{ at: [8.9, 0.12, 4.3], kind: 'tip' }, { at: [9.4, 0.1, 2.6], kind: 'inner' }, { at: [9.0, -0.55, 0], kind: 'belly', mirror: false }],
  cockpit: [3.6, 0.82, 0],
  flame: 'round',
  livery: {
    factory: { base: '#f2f2ee', under: '#2f3a52', finish: 'gloss', insignia: 'none', marks: [ // white over dark blue, a test plane's colours
      { kind: 'stripe', y: 0.02, h: 0.1, color: '#1d3a8a', x0: 0.05, x1: 0.9 }, { kind: 'fins', color: '#1d3a8a', from: 0.75 }, { kind: 'antiglare', x0: 0.1, x1: 0.2 },
    ] },
    camo: { base: '#7f878d', under: '#a3abb0', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'splinter', colors: ['#5f676d', '#9aa2a8'], seed: 29 }] },
    squadron: { base: '#f2f2ee', under: '#f2f2ee', finish: 'satin', insignia: 'none', marks: [ // NASA test colours
      { kind: 'band', x0: 0.42, x1: 0.5, color: '#1d3a8a' }, { kind: 'fins', color: '#c8202f', from: 0.6 }, { kind: 'nose', x1: 0.05, color: '#141414' },
    ] },
    airshow: { base: '#1b1d21', under: '#f2c230', finish: 'gloss', insignia: 'none', marks: [
      { kind: 'leading', color: '#f2c230', w: 0.14 }, { kind: 'stripe', y: 0.0, h: 0.14, color: '#f2c230', x0: 0.05, x1: 0.9 }, { kind: 'fins', color: '#f2c230', from: 0.5 },
    ] },
  },
};
