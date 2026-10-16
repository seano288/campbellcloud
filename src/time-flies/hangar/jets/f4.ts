// McDonnell Douglas F-4E Phantom II. Length 19.2 m, span 11.7 m, height 5.0 m, 45° leading-edge sweep, outer wing
// panels tipped up 12° and the stabilators drooped 23°. Two crew in tandem; intakes beside the cockpit.
// Research: .scratch/airplane-clock/research/jets/f4-phantom.md
import type { JetSpec } from '../three/spec';
import { joined, oval, wingPanel } from './parts';

export const f4: JetSpec = {
  id: 'f4', length: 19.2, span: 11.7, height: 5.0,
  bodies: [
    { sections: [
      oval(0, 0.02, 0.02, 0.02, -0.05), oval(1.0, 0.36, 0.35, 0.38, -0.02), oval(2.6, 0.55, 0.55, 0.56, 0), oval(4.2, 0.66, 0.62, 0.62, 0.02, 2.2, 2.4),
      oval(7.0, 0.72, 0.62, 0.6, 0.02, 2.4, 2.6), oval(10.5, 0.82, 0.6, 0.58, 0, 2.6, 2.8), oval(13.5, 0.8, 0.58, 0.55, 0, 2.6, 2.8),
      oval(15.5, 0.55, 0.55, 0.35, 0.18), oval(17.6, 0.3, 0.42, 0.18, 0.32), oval(19.2, 0.05, 0.12, 0.05, 0.4),
    ] },
    { sections: [ // the long tandem canopy over both crew
      oval(3.4, 0.08, 0.02, 0.06, 0.55), oval(4.0, 0.42, 0.4, 0.1, 0.55), oval(5.0, 0.48, 0.48, 0.1, 0.55), oval(6.4, 0.48, 0.5, 0.1, 0.55),
      oval(7.4, 0.42, 0.4, 0.1, 0.55), oval(8.4, 0.2, 0.1, 0.1, 0.55),
    ], finish: 'glass' },
    { z: 0.92, mirror: true, sections: [ // the intakes beside the cockpit, running back to the engines
      oval(5.0, 0.36, 0.55, 0.55, -0.12, 4, 4), oval(6.0, 0.42, 0.56, 0.58, -0.12, 3.5, 3.5), oval(9.0, 0.48, 0.55, 0.55, -0.1, 3, 3),
      oval(13.0, 0.48, 0.5, 0.5, -0.12, 2.6, 2.6), oval(16.2, 0.46, 0.46, 0.46, -0.15, 2.2, 2.2),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'wing', stations: joined(
      wingPanel([8.4, -0.3, 1.1], 5.4, [11.2, -0.3, 3.65], 3.0, 0.064, 0.05, 2),
      wingPanel([11.2, -0.3, 3.65], 3.0, [13.1, 0.22, 5.85], 1.55, 0.05, 0.03, 2),
    ) },
    { kind: 'tail', stations: wingPanel([16.6, 0.42, 0.45], 2.3, [18.1, -0.5, 2.75], 1.05, 0.06, 0.04, 2) },
    { kind: 'fin', mirror: false, stations: wingPanel([13.9, 0.55, 0], 4.5, [17.1, 3.15, 0], 1.6, 0.05, 0.04, 3) },
  ],
  nozzles: [{ at: [16.75, -0.18, 0.62], r: 0.46, len: 0.8, mirror: true }],
  gear: { nose: { x: 3.0, y: -0.58, len: 1.25, r: 0.3, twin: true }, main: { x: 11.0, y: -0.35, z: 2.65, len: 1.45, r: 0.38 } },
  hardpoints: [
    { at: [12.0, -0.35, 4.1], kind: 'outer' }, { at: [10.8, -0.32, 2.6], kind: 'inner' }, { at: [10.6, -0.62, 0], kind: 'belly', mirror: false },
    { at: [8.0, -0.6, 0.55], kind: 'belly' },
  ],
  cockpit: [4.8, 0.9, 0],
  seats: [[4.8, 0.9, 0], [6.6, 0.95, 0]],
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
