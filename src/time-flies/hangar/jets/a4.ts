// Douglas A-4F Skyhawk. Length 12.22 m, span 8.38 m, height 4.57 m. A small, deep-bodied jet with a compact delta wing
// low on the fuselage (a straight trailing edge), D-shaped intakes on the cheeks behind the cockpit, a canopy that flows
// into the A-4F's avionics hump, a tall swept fin with its tailplane set on it, and a refuelling probe on the right.
// Stations measured from the A-4E three-view on Wikimedia Commons (the A-4F adds the hump).
// Research: .scratch/airplane-clock/research/jets/a4-skyhawk.md
import type { JetSpec } from '../three/spec';
import { bubble, circle, oval, wingPanel } from './parts';

export const a4: JetSpec = {
  id: 'a4', length: 12.22, span: 8.38, height: 4.57,
  bodies: [
    { sections: [ // a drooping nose with a straight underside, then a deep, round-shouldered body tapering up to the tailpipe
      oval(0, 0.03, 0.03, 0.03, -0.38), oval(0.5, 0.23, 0.27, 0.29, -0.41), oval(1.3, 0.35, 0.43, 0.43, -0.28), oval(2.1, 0.42, 0.56, 0.57, -0.15, 2.2, 2.3),
      oval(2.9, 0.47, 0.58, 0.58, -0.13, 2.3, 2.4), oval(3.7, 0.55, 0.66, 0.65, -0.05, 2.4, 2.5), oval(4.6, 0.62, 0.77, 0.77, 0.06, 2.5, 2.6),
      oval(6.5, 0.64, 0.77, 0.77, 0.06, 2.5, 2.6), oval(8.1, 0.56, 0.7, 0.7, 0.13, 2.4, 2.5), oval(9.1, 0.51, 0.67, 0.67, 0.13, 2.3, 2.4),
      oval(9.9, 0.46, 0.61, 0.61, 0.17), oval(10.7, 0.42, 0.52, 0.52, 0.23), oval(11.3, 0.38, 0.42, 0.42, 0.3), oval(11.8, 0.33, 0.33, 0.33, 0.32),
    ] },
    { sections: bubble(2.15, 4.3, 0.42, 0.4, 0.58, 0.5), finish: 'glass', frames: [0.3] },
    { sections: [ // the A-4F's avionics hump, running back into the fin
      oval(3.95, 0.26, 0.05, 0.3, 0.76, 2.6, 2), oval(4.6, 0.46, 0.24, 0.32, 0.76, 2.6, 2), oval(7.2, 0.44, 0.24, 0.32, 0.78, 2.6, 2), oval(8.6, 0.22, 0.14, 0.2, 0.84),
      oval(9.4, 0.06, 0.04, 0.08, 0.92),
    ] },
    { sections: [ // the dorsal fillet running forward from the fin
      oval(6.9, 0.03, 0.01, 0.05, 0.84), oval(7.8, 0.06, 0.08, 0.05, 0.84), oval(8.6, 0.07, 0.2, 0.05, 0.84), oval(9.3, 0.065, 0.5, 0.05, 0.84), oval(9.9, 0.05, 0.75, 0.05, 0.84),
    ], segs: 16 },
    { z: 0.55, mirror: true, sections: [ // the D-shaped intakes on the cheeks, fading back into the body
      oval(3.85, 0.27, 0.4, 0.38, 0.2, 3, 3), oval(4.4, 0.28, 0.42, 0.42, 0.18, 3, 3), oval(5.2, 0.2, 0.36, 0.38, 0.12, 2.6, 2.6), oval(6.2, 0.05, 0.18, 0.22, 0.05),
    ], openFront: true },
    { z: 0.44, sections: [ // the refuelling probe on the right side
      circle(-0.72, 0.035, -0.31), circle(-0.6, 0.07, -0.31), circle(-0.45, 0.05, -0.31), circle(3.0, 0.05, -0.31), circle(3.75, 0.09, -0.25),
    ], segs: 10, finish: 'metal' },
  ],
  surfaces: [
    // the delta: 43° leading edge, a straight trailing edge, a small cropped tip
    { kind: 'wing', stations: wingPanel([4.35, -0.5, 0.55], 4.2, [7.72, -0.46, 4.12], 0.85, 0.06, 0.045, 3) },
    { kind: 'tail', stations: wingPanel([10.45, 0.95, 0.3], 1.5, [11.55, 0.95, 1.71], 0.38, 0.05, 0.04, 2) }, // set on the fin
    { kind: 'fin', mirror: false, stations: [ // a long dorsal fillet, a swept leading edge and an upright rudder
      { le: [8.6, 0.8, 0], chord: 3.55, t: 0.04 }, { le: [9.3, 1.36, 0], chord: 2.88, t: 0.05 }, { le: [10.1, 1.94, 0], chord: 2.1, t: 0.05 },
      { le: [11.0, 2.72, 0], chord: 1.2, t: 0.05 }, { le: [11.48, 3.05, 0], chord: 0.7, t: 0.045 },
    ] },
    { kind: 'other', stations: [{ le: [3.4, -0.14, 0.6], chord: 0.75, t: 0.04 }, { le: [3.25, 0.56, 0.6], chord: 0.9, t: 0.04 }] }, // intake splitter plates
  ],
  nozzles: [{ at: [11.95, 0.32, 0], r: 0.27, len: 0.5 }],
  gear: { nose: { x: 2.1, y: -0.7, len: 0.66, r: 0.25 }, main: { x: 6.7, y: -0.62, z: 1.19, len: 0.6, r: 0.3 } },
  hardpoints: [
    { at: [7.5, -0.53, 2.75], kind: 'outer' }, { at: [6.7, -0.57, 1.72], kind: 'inner' }, { at: [6.0, -0.74, 0], kind: 'belly', mirror: false },
  ],
  cockpit: [3.2, 0.62, 0],
  flame: 'round',
  loads: { 1: { outer: 'aim9', inner: 'pod' }, 3: { outer: 'mk82', inner: 'tank', belly: 'mk82' } },
  livery: {
    factory: { base: '#a8aca9', under: '#f2f2ee', finish: 'satin', insignia: 'star', marks: [{ kind: 'fins', color: '#1d3f8f', from: 0.7 }, { kind: 'antiglare', x0: 0.1, x1: 0.2 }] }, // Navy gull grey over white
    camo: { base: '#c2a277', under: '#9fb3c4', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#7a5a3b', '#5f6a43'], scale: 1.0, seed: 4 }] }, // desert camo
    squadron: { base: '#4b5838', under: '#7a7f7c', finish: 'matte', insignia: 'star', marks: [{ kind: 'camo', colors: ['#2d3729'], scale: 1.1, seed: 12 }, { kind: 'fins', color: '#c8202f', from: 0.75 }] }, // Marine green
    airshow: { base: '#1b2b6b', under: '#1b2b6b', finish: 'gloss', insignia: 'none', marks: [ // Blue Angels
      { kind: 'leading', color: '#f2c230', w: 0.12, under: true }, { kind: 'spine', w: 0.35, color: '#f2c230', x0: 0.05, x1: 0.95 },
      { kind: 'stripe', y: -0.1, h: 0.15, color: '#f2c230', x0: 0.05, x1: 0.85 }, { kind: 'fins', color: '#f2c230', from: 0.88 },
    ] },
  },
};
