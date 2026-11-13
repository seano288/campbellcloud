// McDonnell Douglas F-4E Phantom II. Length 19.2 m (with the nose probe), span 11.7 m, height 5.0 m. A big, deep body:
// a drooping radome over the E's gun fairing, a long two-seat canopy flowing into a straight spine, box intakes beside
// the cockpit behind tall splitter plates, a 48° wing with a dogtooth and its outer panels tipped up 12°, J79 nozzles
// under a long tail cone, and stabilators drooped 23°. Stations measured from the F-4E three-view on Wikimedia Commons.
// Research: .scratch/airplane-clock/research/jets/f4-phantom.md
import type { JetSpec } from '../three/spec';
import { circle, joined, oval, wingPanel } from './parts';

export const f4: JetSpec = {
  id: 'f4', length: 19.2, span: 11.7, height: 5.0,
  bodies: [
    { sections: [
      oval(0, 0.03, 0.03, 0.03, -0.71), oval(0.5, 0.25, 0.25, 0.25, -0.67), oval(1.2, 0.4, 0.42, 0.42, -0.58), oval(2.0, 0.5, 0.56, 0.56, -0.5, 2.2, 2.2),
      oval(3.0, 0.55, 0.67, 0.67, -0.42, 2.3, 2.4), oval(4.3, 0.62, 0.78, 0.78, -0.34, 2.4, 2.6), oval(5.8, 0.68, 0.85, 0.85, -0.3, 2.5, 2.7),
      oval(7.3, 0.9, 0.99, 0.99, -0.19, 2.6, 2.8), oval(8.5, 1.08, 1.18, 1.18, -0.02, 2.7, 2.9), oval(11.0, 1.11, 1.17, 1.17, -0.01, 2.8, 3),
      oval(13.4, 1.05, 1.1, 1.1, 0.06, 2.7, 2.9), oval(14.4, 0.98, 1.0, 1.0, 0.11, 2.5, 2.6), oval(15.0, 0.6, 0.65, 0.65, 0.45, 2.2, 2.4),
      oval(16.5, 0.34, 0.36, 0.36, 0.66), oval(18.6, 0.06, 0.12, 0.12, 0.72),
    ] },
    { sections: [ // the long tandem canopy over both crew, flowing into the spine
      oval(3.05, 0.3, 0.02, 0.12, 0.26), oval(3.45, 0.5, 0.18, 0.12, 0.3), oval(3.8, 0.55, 0.36, 0.12, 0.32), oval(4.2, 0.57, 0.51, 0.12, 0.34),
      oval(4.9, 0.58, 0.71, 0.12, 0.37), oval(5.6, 0.58, 0.79, 0.12, 0.4), oval(6.4, 0.57, 0.77, 0.12, 0.44), oval(7.1, 0.52, 0.7, 0.12, 0.5),
      oval(7.7, 0.45, 0.55, 0.12, 0.6), oval(8.2, 0.3, 0.3, 0.12, 0.8),
    ], finish: 'glass', frames: [0.12, 0.47, 0.62] },
    { z: 1.08, mirror: true, sections: [ // the box intakes beside the cockpit, running back into the body
      oval(5.85, 0.3, 0.66, 0.62, 0.05, 4, 4), oval(7.0, 0.31, 0.7, 0.66, 0.02, 3.5, 3.5), oval(8.8, 0.08, 0.62, 0.62, 0, 3, 3), oval(10.5, 0.03, 0.3, 0.3, 0),
    ], openFront: true },
    { sections: [ // the F-4E's gun fairing under the radome
      oval(0.9, 0.05, 0.05, 0.05, -0.95), oval(1.6, 0.22, 0.2, 0.2, -1.08), oval(3.5, 0.26, 0.22, 0.2, -1.1), oval(4.6, 0.18, 0.2, 0.1, -1.04),
    ], segs: 20 },
    { sections: [oval(12.6, 0.04, 0.01, 0.05, 1.12), oval(13.5, 0.07, 0.1, 0.05, 1.12), oval(14.3, 0.07, 0.42, 0.05, 1.12), oval(14.9, 0.05, 0.6, 0.05, 1.1)], segs: 16 }, // the fin's dorsal fillet
    { sections: [circle(-0.6, 0.02, -0.71), circle(0.1, 0.035, -0.71)], segs: 8, finish: 'metal' }, // the nose probe
  ],
  surfaces: [
    { kind: 'wing', stations: joined( // 48° leading edge with the dogtooth where the outer panel starts, tipped up 12°
      wingPanel([7.06, -0.55, 1.15], 5.79, [10.36, -0.55, 4.1], 2.95, 0.064, 0.05, 2),
      wingPanel([10.2, -0.55, 4.11], 3.11, [12.32, -0.18, 5.85], 1.33, 0.05, 0.035, 2),
    ) },
    { kind: 'tail', stations: wingPanel([15.9, 0.55, 0.25], 2.25, [17.7, -0.3, 2.45], 0.6, 0.06, 0.04, 2) }, // drooped 23°
    { kind: 'fin', mirror: false, stations: wingPanel([13.9, 0.92, 0], 3.85, [16.9, 2.88, 0], 1.35, 0.05, 0.04, 3) },
    { kind: 'other', stations: [{ le: [5.0, -0.55, 0.79], chord: 1.3, t: 0.025 }, { le: [4.7, 0.7, 0.79], chord: 1.6, t: 0.025 }] }, // splitter plates
  ],
  nozzles: [{ at: [14.65, -0.45, 0.52], r: 0.44, len: 0.9, mirror: true }],
  gear: { nose: { x: 4.6, y: -1.12, len: 0.75, r: 0.28, twin: true }, main: { x: 11.3, y: -0.69, z: 2.72, len: 1.0, r: 0.38 } },
  hardpoints: [
    { at: [11.6, -0.66, 3.95], kind: 'outer' }, { at: [10.6, -0.7, 2.25], kind: 'inner' }, { at: [10.4, -1.2, 0], kind: 'belly', mirror: false },
    { at: [8.4, -1.2, 0.75], kind: 'belly' },
  ],
  cockpit: [5.1, 0.72, 0],
  seats: [[5.1, 0.72, 0], [6.7, 0.78, 0]],
  flame: 'round',
  loads: { 1: { outer: 'aim9', inner: 'aim9', belly: 'aim120' }, 3: { outer: 'aim9', inner: 'tank', belly: 'aim120' } },
  livery: {
    factory: { base: '#b9a47b', under: '#d4d2c8', finish: 'matte', insignia: 'star', marks: [{ kind: 'camo', colors: ['#5c6b43', '#3f4b32'], scale: 1.0, seed: 44 }] }, // Vietnam SEA camo
    camo: { base: '#4a5640', under: '#7a7f7c', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#2d3729', '#6b6f69'], scale: 1.1, seed: 9, under: true }] }, // European One
    squadron: { base: '#a8aba8', under: '#f0f0ec', finish: 'gloss', insignia: 'star', marks: [{ kind: 'fins', color: '#141414' }, { kind: 'nose', x1: 0.08, color: '#141414' }, { kind: 'stripe', y: 0.2, h: 0.14, color: '#f2c230', x0: 0.12, x1: 0.6 }] },
    airshow: { base: '#1b2b6b', finish: 'gloss', insignia: 'none', marks: [ // Blue Angels
      { kind: 'leading', color: '#f2c230', w: 0.12 }, { kind: 'spine', w: 0.35, color: '#f2c230', x0: 0.05, x1: 0.95 }, { kind: 'stripe', y: -0.1, h: 0.15, color: '#f2c230', x0: 0.06, x1: 0.82 },
      { kind: 'fins', color: '#f2c230', from: 0.88 },
    ] },
  },
};
