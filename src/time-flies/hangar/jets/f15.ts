// McDonnell Douglas F-15C Eagle. Length 19.43 m, span 13.05 m, height 5.63 m, wing area 56.5 m². Big box intakes beside
// a high bubble canopy, a broad flat back, a cropped-delta wing and two upright tails. Research: .scratch/airplane-clock/research/jets/f15-eagle.md
// Stations traced from the public-domain Commons three-view (y = 0 datum 2.07 m above the ground).
import type { JetSpec } from '../three/spec';
import { bubble, joined, oval, wingPanel } from './parts';

export const f15: JetSpec = {
  id: 'f15', length: 19.43, span: 13.05, height: 5.63,
  bodies: [
    { sections: [ // the nose, then a narrow raised cockpit and spine sitting between the intake boxes
      oval(0, 0.02, 0.02, 0.02, -0.21), oval(1.0, 0.32, 0.3, 0.3, -0.15), oval(2.5, 0.64, 0.53, 0.53, -0.04, 2.2, 2.2),
      oval(4.0, 0.72, 0.76, 0.62, 0.04, 2.4, 2.8), oval(5.6, 0.74, 0.82, 0.66, 0.04, 2.6, 3.2), oval(7.5, 0.72, 0.95, 0.7, 0.1, 2.6, 3.6),
      oval(10.0, 0.7, 0.9, 0.75, 0.1, 2.6, 4), oval(13.0, 0.75, 0.72, 0.75, 0.08, 2.8, 4), oval(15.2, 0.9, 0.55, 0.68, 0.04, 3.5, 3.5),
      oval(16.8, 0.6, 0.4, 0.4, 0, 3, 3), oval(17.6, 0.3, 0.15, 0.2, 0, 2.5, 2.5),
    ] },
    { sections: bubble(3.3, 7.4, 0.62, 0.5, 0.95, 0.42), finish: 'glass' }, // the tall bubble canopy
    { z: 1.15, mirror: true, sections: [ // the big square intakes, their flat tops forming the broad back, ducts running aft to the booms
      oval(5.66, 0.44, 0.66, 0.66, 0.12, 7, 7), oval(6.4, 0.5, 0.68, 0.68, 0.12, 6, 6), oval(7.75, 0.6, 0.68, 0.66, 0.12, 5, 5),
      oval(9.4, 0.7, 0.66, 0.62, 0.12, 5, 5), oval(14.0, 0.72, 0.55, 0.6, 0.1, 4.5, 4.5), oval(15.5, 0.6, 0.45, 0.5, 0.08, 4, 4),
      oval(17.0, 0.35, 0.3, 0.35, 0.05, 3, 3),
    ], openFront: true },
    { z: 0.72, mirror: true, sections: [oval(14.5, 0.5, 0.5, 0.5, -0.06), oval(16.5, 0.6, 0.56, 0.56, -0.08), oval(17.9, 0.58, 0.55, 0.55, -0.1)] }, // engine bays
    { z: 1.6, mirror: true, segs: 16, sections: [oval(14.5, 0.3, 0.3, 0.3, 0.2, 3, 3), oval(18.6, 0.22, 0.22, 0.25, 0.2, 3, 3), oval(19.0, 0.05, 0.05, 0.05, 0.2)] }, // tail booms
  ],
  surfaces: [
    { kind: 'wing', stations: joined( // cropped delta with the raked tip
      wingPanel([9.4, 0.35, 1.85], 5.8, [12.74, 0.3, 5.76], 2.95, 0.06, 0.035, 3), wingPanel([12.74, 0.3, 5.76], 2.95, [13.41, 0.29, 6.52], 0.85, 0.035, 0.03, 1)) },
    { kind: 'tail', stations: wingPanel([16.2, 0.15, 1.75], 2.65, [18.5, 0.1, 4.06], 0.9, 0.05, 0.035, 2) },
    { kind: 'fin', stations: wingPanel([15.6, 0.45, 1.6], 3.3, [18.0, 3.56, 1.62], 0.95, 0.05, 0.035, 3) },
  ],
  nozzles: [{ at: [18.4, -0.1, 0.72], r: 0.55, len: 1.0, mirror: true }],
  gear: { nose: { x: 4.6, y: -0.55, len: 1.2, r: 0.3 }, main: { x: 11.6, y: -0.35, z: 1.4, len: 1.32, r: 0.42 } },
  hardpoints: [
    { at: [12.6, 0.27, 4.4], kind: 'outer' }, { at: [9.0, -0.62, 1.55], kind: 'belly' }, { at: [13.5, -0.55, 1.55], kind: 'belly' }, { at: [11.5, -0.7, 0], kind: 'inner', mirror: false },
  ],
  cockpit: [5.1, 1.1, 0],
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
