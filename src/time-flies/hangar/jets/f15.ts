// McDonnell Douglas F-15C Eagle. Length 19.43 m, span 13.05 m, height 5.63 m, wing area 56.5 m². Big box intakes beside
// a high bubble canopy, a broad flat back, a cropped-delta wing and two upright tails. Research: .scratch/airplane-clock/research/jets/f15-eagle.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const f15: JetSpec = {
  id: 'f15', length: 19.43, span: 13.05, height: 5.63,
  bodies: [
    { sections: [
      oval(0, 0.02, 0.02, 0.02, 0), oval(1.3, 0.4, 0.4, 0.42, 0), oval(3.0, 0.58, 0.56, 0.55, 0.02), oval(4.8, 0.66, 0.6, 0.55, 0.04, 2.3, 2.5),
      oval(7.5, 0.92, 0.55, 0.42, 0.04, 3.2, 3.5), oval(11.0, 1.15, 0.5, 0.4, 0.02, 4, 4), oval(15.0, 1.12, 0.45, 0.42, 0, 3.6, 3.6),
      oval(17.6, 1.05, 0.4, 0.42, 0, 3.2, 3.2),
    ] },
    { sections: bubble(3.4, 7.0, 0.5, 0.45, 0.65, 0.42), finish: 'glass' },
    { z: 1.12, mirror: true, sections: [ // the box intakes, square-cut at the front
      oval(5.6, 0.5, 0.62, 0.5, -0.15, 7, 7), oval(6.4, 0.55, 0.62, 0.55, -0.15, 6, 6), oval(10.0, 0.55, 0.58, 0.55, -0.12, 4.5, 4.5),
      oval(14.0, 0.5, 0.5, 0.52, -0.1, 3, 3),
    ], openFront: true },
    { z: 0.65, mirror: true, sections: [oval(16.5, 0.6, 0.55, 0.55, 0), oval(18.6, 0.58, 0.55, 0.55, 0)] }, // engine bays
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([8.6, 0.32, 1.55], 6.0, [13.6, 0.12, 6.52], 1.55, 0.06, 0.03, 4) },
    { kind: 'tail', stations: wingPanel([16.2, 0.05, 1.5], 2.9, [18.2, 0.05, 4.3], 1.25, 0.05, 0.035, 2) },
    { kind: 'fin', stations: wingPanel([14.6, 0.5, 1.45], 3.7, [17.0, 3.62, 1.45], 1.55, 0.05, 0.035, 3) },
  ],
  nozzles: [{ at: [19.3, 0, 0.66], r: 0.52, len: 1.0, mirror: true }],
  gear: { nose: { x: 4.1, y: -0.55, len: 1.2, r: 0.3 }, main: { x: 11.6, y: -0.35, z: 1.4, len: 1.32, r: 0.42 } },
  hardpoints: [
    { at: [12.6, 0.15, 4.4], kind: 'outer' }, { at: [9.0, -0.75, 1.55], kind: 'belly' }, { at: [13.5, -0.55, 1.55], kind: 'belly' }, { at: [11.5, -0.55, 0], kind: 'inner', mirror: false },
  ],
  cockpit: [5.0, 1.0, 0],
  flame: 'round',
  loads: { 1: { outer: 'aim9', belly: 'aim120' }, 2: { outer: 'mk82', belly: 'gbu', inner: 'tank' }, 3: { outer: 'aim9', belly: 'aim120', inner: 'tank' } },
  livery: {
    factory: { base: '#7e8891', under: '#8f99a1', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#5f6971'], scale: 1.5, seed: 15 }] }, // Mod Eagle greys
    camo: { base: '#c2a374', under: '#c9c6bb', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#8a6a45', '#a2876a'], scale: 1.1, seed: 31 }] },
    squadron: { base: '#7e8891', under: '#8f99a1', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'fins', color: '#b5161f', from: 0.45 }, { kind: 'nose', x1: 0.05, color: '#b5161f' }] }, // Redhawks
    airshow: { base: '#f4f5f7', under: '#1d3f8f', finish: 'gloss', insignia: 'star', marks: [ // Bicentennial red, white and blue
      { kind: 'fins', color: '#1d3f8f', from: 0.5 }, { kind: 'stripe', y: 0.2, h: 0.18, color: '#c8202f', x0: 0.08, x1: 0.9 }, { kind: 'stripe', y: -0.02, h: 0.12, color: '#1d3f8f', x0: 0.08, x1: 0.9 },
      { kind: 'nose', x1: 0.06, color: '#1d3f8f' },
    ] },
  },
};
