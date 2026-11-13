// Lockheed Martin F-22 Raptor. Length 18.92 m, span 13.56 m, height 5.08 m. A deep body with a chined stealth nose, caret
// intakes beside the cockpit, a diamond wing (42° leading edge, trailing edge swept forward 17°, clipped tips), big
// diamond stabilators behind it, twin tails canted out 28° on the edges of the flat aft body, and flat thrust-vectoring
// nozzles with a stinger between them. Research: .scratch/airplane-clock/research/jets/f22-raptor.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const f22: JetSpec = {
  id: 'f22', length: 18.92, span: 13.56, height: 5.08,
  bodies: [
    { sections: [ // the chine runs along the centre line's height (n < 2 makes the sharp edge); a deep belly over the weapons bays
      oval(0, 0.02, 0.01, 0.01, -0.45), oval(1.2, 0.42, 0.38, 0.28, -0.45, 1.5, 1.5), oval(2.6, 0.66, 0.78, 0.5, -0.4, 1.6, 1.6), oval(4.0, 0.85, 0.85, 0.75, -0.35, 1.8, 1.8),
      oval(5.7, 1.1, 1.12, 0.88, -0.27, 2, 2.2), oval(7.5, 1.4, 1.05, 0.95, -0.25, 2.2, 2.6), oval(10.0, 1.55, 0.72, 1.0, -0.2, 2.4, 2.8), oval(13.1, 1.5, 0.7, 0.85, -0.2, 2.6, 2.8),
      oval(15.5, 1.45, 0.55, 0.55, -0.2, 3.5, 3), oval(17.0, 1.35, 0.45, 0.42, -0.2, 4, 3.5), oval(17.6, 1.25, 0.32, 0.3, -0.22, 4, 4),
    ] },
    { sections: bubble(2.5, 6.4, 0.38, 0.5, 0.72, 0.38), finish: 'glass' },
    { z: 1.25, mirror: true, sections: [ // the caret intakes, their mouths beside the cockpit
      oval(5.3, 0.62, 0.55, 0.55, -0.5, 2.8, 2.8), oval(6.5, 0.66, 0.56, 0.56, -0.5, 2.8, 2.8), oval(8.5, 0.72, 0.5, 0.55, -0.52, 2.6, 2.6), oval(10.5, 0.5, 0.4, 0.5, -0.55), oval(12.0, 0.2, 0.25, 0.35, -0.55),
    ], openFront: true },
    { segs: 12, sections: [oval(16.4, 0.3, 0.2, 0.2, -0.25), oval(17.6, 0.18, 0.12, 0.12, -0.25), oval(18.6, 0.04, 0.04, 0.04, -0.25)] }, // the stinger between the nozzles
  ],
  surfaces: [
    { kind: 'wing', stations: [ // diamond wing with the clipped tip
      { le: [7.5, -0.12, 1.3], chord: 8.57, t: 0.04 }, { le: [9.08, -0.14, 3.08], chord: 6.41, t: 0.04 }, { le: [11.93, -0.18, 6.04], chord: 2.55, t: 0.035 },
      { le: [12.63, -0.19, 6.85], chord: 1.16, t: 0.03 },
    ] },
    { kind: 'tail', stations: [{ le: [14.21, -0.32, 1.2], chord: 3.45, t: 0.04 }, { le: [15.65, -0.32, 2.86], chord: 3.25, t: 0.04 }, { le: [17.1, -0.32, 4.5], chord: 1.3, t: 0.035 }] },
    { kind: 'fin', stations: wingPanel([13.1, 0.1, 1.3], 4.1, [14.4, 2.85, 2.78], 1.3, 0.045, 0.035, 3) }, // canted out 28°
  ],
  nozzles: [{ at: [17.62, -0.25, 0.62], r: 0.5, len: 1.0, mirror: true, flat: { w: 0.5, h: 0.26 } }],
  gear: { nose: { x: 5.7, y: -1.15, len: 0.63, r: 0.3 }, main: { x: 11.75, y: -0.75, z: 1.4, len: 0.88, r: 0.45 } },
  hardpoints: [{ at: [12.0, -0.22, 4.6], kind: 'outer' }, { at: [11.0, -0.24, 3.0], kind: 'inner' }, { at: [10.6, -1.25, 0.6], kind: 'belly' }],
  cockpit: [4.2, 0.7, 0],
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
