// Fairchild Republic A-10 Thunderbolt II "Warthog". Length 16.26 m, span 17.53 m, height 4.47 m. Built round the GAU-8
// gun (its muzzle pokes out under the nose), with a straight low wing, landing-gear pods, two TF34 engines in pods high on
// the rear fuselage and an H-tail. Research: .scratch/airplane-clock/research/jets/a10-warthog.md
import type { JetSpec } from '../three/spec';
import { bubble, circle, joined, oval, wingPanel } from './parts';

export const a10: JetSpec = {
  id: 'a10', length: 16.26, span: 17.53, height: 4.47,
  bodies: [
    { sections: [
      oval(0.2, 0.2, 0.18, 0.24, -0.15), oval(0.7, 0.55, 0.55, 0.6, -0.05), oval(1.8, 0.78, 0.8, 0.78, 0, 2.4, 2.6), oval(3.6, 0.82, 0.82, 0.8, 0, 2.6, 2.8),
      oval(6.5, 0.78, 0.78, 0.75, 0, 2.6, 2.8), oval(9.5, 0.62, 0.7, 0.62, 0.05, 2.4, 2.6), oval(12.5, 0.42, 0.52, 0.44, 0.15), oval(15.3, 0.24, 0.3, 0.28, 0.3),
      oval(16.26, 0.06, 0.08, 0.08, 0.35),
    ] },
    { sections: bubble(1.5, 4.2, 0.62, 0.55, 0.62, 0.38), finish: 'glass' },
    { sections: [circle(-0.45, 0.1, -0.38), circle(0.6, 0.1, -0.38)], finish: 'black', openFront: true }, // the gun muzzle
    { z: 1.3, mirror: true, sections: [ // the engine pods, open intakes at the front
      circle(9.6, 0.6, 1.3), circle(10.1, 0.66, 1.3), circle(11.8, 0.64, 1.3), circle(12.6, 0.48, 1.3),
    ], openFront: true },
    { z: 2.15, mirror: true, sections: [ // landing-gear pods under the wing
      oval(4.4, 0.08, 0.06, 0.12, -0.75), oval(4.9, 0.3, 0.2, 0.32, -0.8), oval(6.7, 0.32, 0.2, 0.3, -0.8), oval(7.9, 0.08, 0.08, 0.08, -0.7),
    ] },
  ],
  surfaces: [
    { kind: 'wing', stations: joined(
      wingPanel([5.2, -0.6, 0.6], 3.05, [5.25, -0.6, 3.0], 3.0, 0.16, 0.16, 2),
      wingPanel([5.25, -0.6, 3.0], 3.0, [5.6, 0.05, 8.3], 1.85, 0.16, 0.13, 3),
      wingPanel([5.6, 0.05, 8.3], 1.85, [5.65, -0.12, 8.76], 1.8, 0.12, 0.1, 1), // drooped tips
    ) },
    { kind: 'tail', stations: wingPanel([13.85, 0.55, 0.15], 1.75, [13.95, 0.55, 2.75], 1.6, 0.09, 0.08, 2) },
    { kind: 'fin', stations: wingPanel([13.55, -0.55, 2.75], 1.95, [13.95, 2.45, 2.75], 1.55, 0.08, 0.07, 3) },
    { kind: 'other', mirror: true, stations: wingPanel([10.0, 0.62, 0.55], 1.6, [10.2, 0.75, 1.0], 1.4, 0.1, 0.1, 1) }, // engine pylons
  ],
  nozzles: [{ at: [12.9, 1.3, 1.3], r: 0.42, len: 0.4, mirror: true }],
  gear: { nose: { x: 1.8, y: -0.75, z: 0.3, len: 0.85, r: 0.35 }, main: { x: 5.6, y: -1.2, z: 2.15, len: 0.4, r: 0.38 } },
  hardpoints: [
    { at: [6.0, -0.65, 3.6], kind: 'inner' }, { at: [6.1, -0.45, 5.0], kind: 'outer' }, { at: [6.2, -0.3, 6.3], kind: 'outer' },
    { at: [6.3, -0.15, 7.5], kind: 'tip' }, { at: [6.5, -0.85, 0], kind: 'belly', mirror: false },
  ],
  cockpit: [2.8, 0.85, 0],
  flame: 'round',
  loads: { 1: { inner: 'pod', outer: 'maverick', tip: 'aim9' }, 2: { inner: 'gbu', outer: 'mk82', tip: 'aim9', belly: 'mk82' }, 3: { inner: 'maverick', outer: 'pod', tip: 'aim9', belly: 'tank' } },
  livery: {
    factory: { base: '#7c878f', under: '#8b959c', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#5f6971'], scale: 1.4, seed: 10 }] }, // Compass Ghost greys
    camo: { base: '#45523a', under: '#3e4b38', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#2e3a2b', '#5b6352'], scale: 1.0, seed: 22, under: true }] }, // European "lizard"
    squadron: { base: '#bca27a', under: '#c9c3b0', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#8d6c47'], scale: 1.2, seed: 8 }, { kind: 'fins', color: '#1b1b1b', from: 0.7 }] },
    airshow: { base: '#7c878f', under: '#8b959c', finish: 'satin', insignia: 'lowvis', marks: [ // the A-10 Demo Team's yellow and black tails
      { kind: 'fins', color: '#f2c230', from: 0.25 }, { kind: 'checker', x0: 0.86, x1: 0.94, colors: ['#f2c230', '#141414'], n: 4 }, { kind: 'nose', x1: 0.04, color: '#141414' },
    ] },
  },
};
