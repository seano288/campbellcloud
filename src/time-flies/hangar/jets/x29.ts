// Grumman X-29. Length 14.66 m (without the nose probe), span 8.29 m, height 4.36 m. A test plane with its wings swept
// forward about 30° (leading edge) from a gloved root, close-coupled canards on top of the intakes just ahead of them, an
// F-5 nose and canopy, flat strakes with flaps along the aft fuselage, a small fin well aft and one F404 with an
// afterburner. Research: .scratch/airplane-clock/research/jets/x29.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const x29: JetSpec = {
  id: 'x29', length: 14.66, span: 8.29, height: 4.36,
  bodies: [
    { sections: [ // the F-5 nose, then a deep fuselage that stays tall to the big round tailpipe
      oval(0, 0.02, 0.02, 0.02, -0.35), oval(1.0, 0.26, 0.24, 0.24, -0.3), oval(2.4, 0.42, 0.42, 0.4, -0.12), oval(3.4, 0.5, 0.55, 0.45, -0.12, 2.1, 2.3),
      oval(5.0, 0.6, 0.75, 0.62, -0.05, 2.4, 2.6), oval(7.2, 0.66, 0.72, 0.75, 0, 2.6, 2.8), oval(9.5, 0.66, 0.72, 0.72, 0, 2.6, 2.8), oval(11.5, 0.62, 0.7, 0.66, 0.02, 2.4, 2.6),
      oval(13.5, 0.6, 0.62, 0.6, 0.01, 2.2, 2.3), oval(14.4, 0.58, 0.58, 0.58, 0),
    ] },
    { sections: bubble(3.1, 5.9, 0.36, 0.38, 0.46, 0.35), finish: 'glass' },
    { segs: 8, finish: 'metal', sections: [oval(-0.8, 0.012, 0.012, 0.012, -0.35), oval(-0.6, 0.03, 0.03, 0.03, -0.35), oval(0.3, 0.05, 0.05, 0.05, -0.34)] }, // the test nose probe
    { z: 0.68, mirror: true, sections: [ // the intakes beside the cockpit, the canards on top of them
      oval(5.0, 0.24, 0.38, 0.38, -0.17, 3.5, 3.5), oval(5.8, 0.27, 0.4, 0.4, -0.17, 3, 3), oval(8.5, 0.24, 0.38, 0.4, -0.2, 3, 3), oval(10.5, 0.08, 0.24, 0.28, -0.2),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'tail', stations: wingPanel([5.4, 0.12, 0.85], 2.3, [6.4, 0.12, 2.1], 1.0, 0.05, 0.04, 2) }, // the canards
    { kind: 'wing', stations: [ // a gloved root, then the forward-swept panel
      { le: [8.25, -0.2, 0.6], chord: 3.72, t: 0.05 }, { le: [8.7, -0.2, 1.61], chord: 2.28, t: 0.05 },
      ...wingPanel([8.7, -0.2, 1.61], 2.28, [7.3, -0.2, 4.14], 1.21, 0.05, 0.035, 3).slice(1),
    ] },
    { kind: 'strake', stations: [{ le: [11.2, -0.2, 0.55], chord: 2.8, t: 0.03 }, { le: [11.44, -0.2, 1.14], chord: 2.56, t: 0.03 }] }, // strakes, their flaps at the back
    { kind: 'fin', mirror: false, stations: wingPanel([12.0, 0.62, 0], 2.2, [13.9, 2.63, 0], 0.76, 0.05, 0.04, 3) },
  ],
  nozzles: [{ at: [14.66, 0.0, 0], r: 0.5, len: 0.9 }],
  gear: { nose: { x: 3.2, y: -0.52, len: 0.85, r: 0.27 }, main: { x: 8.8, y: -0.35, z: 1.0, len: 0.96, r: 0.33 } },
  hardpoints: [{ at: [7.9, -0.2, 4.14], kind: 'tip' }, { at: [8.9, -0.26, 2.6], kind: 'inner' }, { at: [9.0, -0.78, 0], kind: 'belly', mirror: false }],
  cockpit: [3.9, 0.42, 0],
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
