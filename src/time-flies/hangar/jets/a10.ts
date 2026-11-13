// Fairchild Republic A-10 Thunderbolt II "Warthog". Length 16.26 m, span 17.53 m, height 4.47 m. Built round the GAU-8
// gun (its muzzle pokes out under the blunt nose), with a tall bubble canopy, a thick straight wing set well aft (flat
// centre section, outer panels tipped up 7° with drooped tips), landing-gear pods hanging under the wing, two big TF34
// engine pods high on the rear fuselage, and an H-tail whose fins reach below the tailplane. Stations measured from the
// A-10 three-view on Wikimedia Commons. Research: .scratch/airplane-clock/research/jets/a10-warthog.md
import type { JetSpec } from '../three/spec';
import { bubble, circle, joined, oval, wingPanel } from './parts';

export const a10: JetSpec = {
  id: 'a10', length: 16.26, span: 17.53, height: 4.47,
  bodies: [
    { sections: [ // a blunt nose, a slab-sided body, then a long taper to the tail cone
      oval(0, 0.05, 0.15, 0.15, -0.45), oval(0.25, 0.42, 0.41, 0.41, -0.41, 2.2, 2.4), oval(0.65, 0.62, 0.51, 0.51, -0.37, 2.4, 2.6),
      oval(1.2, 0.72, 0.64, 0.64, -0.27, 2.6, 2.8), oval(1.6, 0.76, 0.7, 0.7, -0.2, 2.7, 2.9), oval(3.0, 0.78, 0.78, 0.78, -0.12, 2.8, 3),
      oval(5.0, 0.78, 0.93, 0.93, 0.02, 2.8, 3), oval(7.0, 0.76, 0.87, 0.87, -0.01, 2.8, 3), oval(9.3, 0.7, 0.78, 0.78, -0.07, 2.7, 2.9),
      oval(11.5, 0.64, 0.65, 0.65, -0.03, 2.6, 2.8), oval(13.3, 0.6, 0.58, 0.58, -0.07, 2.4, 2.6), oval(14.5, 0.5, 0.48, 0.48, -0.07),
      oval(15.5, 0.4, 0.33, 0.33, -0.07), oval(16.13, 0.08, 0.06, 0.06, -0.06),
    ] },
    { sections: bubble(1.35, 5.0, 0.5, 0.56, 0.87, 0.38), finish: 'glass', frames: [0.26] },
    { sections: [circle(-0.32, 0.15, -0.74), circle(0.2, 0.16, -0.74), circle(0.6, 0.12, -0.7)], finish: 'black', openFront: true, segs: 16 }, // the GAU-8 muzzle
    { z: 1.47, mirror: true, sections: [ // the TF34 engine pods, open intakes at the front
      circle(9.55, 0.6, 0.78), circle(9.75, 0.7, 0.78), circle(11.6, 0.7, 0.78), circle(12.5, 0.64, 0.78), circle(12.85, 0.5, 0.78),
    ], openFront: true },
    { z: 2.46, mirror: true, sections: [ // landing-gear pods under the wing, nosing out ahead of it
      oval(5.67, 0.06, 0.06, 0.06, -0.85), oval(6.0, 0.3, 0.28, 0.3, -0.9), oval(7.0, 0.36, 0.3, 0.32, -0.92), oval(8.5, 0.3, 0.25, 0.28, -0.85), oval(9.6, 0.08, 0.06, 0.06, -0.7),
    ], segs: 24 },
  ],
  surfaces: [
    { kind: 'wing', stations: joined(
      wingPanel([6.72, -0.6, 0.6], 3.13, [6.81, -0.6, 2.9], 3.04, 0.16, 0.16, 2),
      wingPanel([6.81, -0.6, 2.9], 3.04, [7.43, 0.08, 8.4], 2.03, 0.16, 0.13, 3), // tipped up 7°
      wingPanel([7.43, 0.08, 8.4], 2.03, [7.5, -0.08, 8.77], 1.9, 0.12, 0.1, 1), // drooped tips
    ) },
    { kind: 'tail', stations: wingPanel([14.0, -0.12, 0.3], 1.9, [14.0, -0.12, 3.0], 1.9, 0.09, 0.08, 2) },
    { kind: 'fin', stations: wingPanel([13.95, -0.9, 3.0], 1.95, [14.4, 2.18, 3.0], 1.5, 0.08, 0.07, 3) },
    { kind: 'other', mirror: true, stations: wingPanel([10.0, 0.62, 0.4], 1.9, [10.1, 0.35, 1.0], 1.8, 0.12, 0.12, 1) }, // engine pylons
  ],
  nozzles: [{ at: [13.1, 0.78, 1.47], r: 0.4, len: 0.5, mirror: true }],
  gear: { nose: { x: 2.65, y: -0.9, z: 0.3, len: 1.06, r: 0.33 }, main: { x: 6.6, y: -1.0, z: 2.46, len: 0.83, r: 0.46 } },
  hardpoints: [
    { at: [7.6, -0.76, 3.6], kind: 'inner' }, { at: [7.7, -0.56, 5.0], kind: 'outer' }, { at: [7.8, -0.38, 6.3], kind: 'outer' },
    { at: [7.9, -0.2, 7.6], kind: 'tip' }, { at: [7.0, -0.9, 0], kind: 'belly', mirror: false },
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
