// Vought F4U-1D Corsair. Length 10.2 m, span 12.5 m, height 4.5 m, 4.06 m three-blade propeller on the R-2800. The
// inverted gull wing bends down about 16° to the main gear, then up about 10° to the tips; its leading edge is straight
// across and the taper is all in the trailing edge. The cockpit sits far back behind a long nose, with a razorback spine
// behind it running up into a tall fin. It sits about 15° nose up. Stations measured off the BuAer F2G-2 three-view
// (same wing, tail and fuselage lines; thrust line y = 0). Research: .scratch/airplane-clock/research/jets/f4u-corsair.md
import type { JetSpec } from '../three/spec';
import { bubble, joined, oval, roundedPanel, wingPanel } from './parts';

export const f4u: JetSpec = {
  id: 'f4u', length: 10.2, span: 12.5, height: 4.5,
  bodies: [
    { sections: [ // the big round cowling (open at the front, with the engine dark inside), then the long fuselage
      oval(0.55, 0.62, 0.6, 0.62, 0), oval(0.75, 0.67, 0.65, 0.67, 0), oval(1.7, 0.68, 0.69, 0.7, 0), oval(2.5, 0.62, 0.72, 0.7, 0),
      oval(3.5, 0.56, 0.76, 0.72, 0, 2.3, 2), oval(4.5, 0.52, 0.72, 0.72, 0, 2.3, 2), oval(5.6, 0.45, 0.62, 0.67, 0), oval(6.8, 0.34, 0.55, 0.52, 0.02),
      oval(7.8, 0.25, 0.5, 0.4, 0.08), oval(8.8, 0.17, 0.38, 0.3, 0.2), oval(9.8, 0.08, 0.18, 0.16, 0.32), oval(10.2, 0.02, 0.04, 0.04, 0.32),
    ], openFront: true },
    { sections: bubble(4.0, 6.0, 0.7, 0.36, 0.42, 0.4), finish: 'glass' },
    { sections: [ // the razorback spine behind the canopy, running down into the fin
      oval(5.45, 0.2, 0.26, 0.2, 0.7, 1.6), oval(6.0, 0.18, 0.26, 0.2, 0.68, 1.6), oval(6.9, 0.12, 0.18, 0.2, 0.58, 1.6), oval(7.8, 0.06, 0.12, 0.2, 0.5, 1.6), oval(8.4, 0.04, 0.06, 0.1, 0.48),
    ], segs: 24 },
    { z: 1.2, mirror: true, finish: 'dark', segs: 12, sections: [oval(2.29, 0.3, 0.035, 0.035, -0.53, 4, 4), oval(2.38, 0.3, 0.035, 0.035, -0.53, 4, 4)] }, // oil cooler intakes in the inner leading edge
  ],
  surfaces: [
    { kind: 'wing', stations: joined( // the gull: down and out to the bend, then up to the round tip
      wingPanel([2.32, -0.28, 0.35], 2.57, [2.32, -0.8, 2.1], 2.55, 0.18, 0.16, 2),
      roundedPanel([2.32, -0.8, 2.1], 2.55, [2.4, -0.14, 5.6], 1.65, 0.16, 0.1, 0.62, 3),
    ) },
    { kind: 'tail', stations: roundedPanel([8.66, 0.38, 0.15], 1.32, [8.95, 0.38, 2.1], 0.9, 0.09, 0.08, 0.4) },
    { kind: 'fin', mirror: false, stations: joined( // tall fin with a curved leading edge and a round top
      wingPanel([7.2, 0.5, 0], 2.45, [8.0, 0.95, 0], 1.65, 0.09, 0.09, 1),
      roundedPanel([8.0, 0.95, 0], 1.65, [8.36, 1.72, 0], 1.12, 0.09, 0.08, 0.26, 2),
    ) },
  ],
  nozzles: [],
  props: [{ at: [0.52, 0, 0], r: 2.03, blades: 3, spinner: 0.4, chord: 0.36 }],
  stacks: [[1.95, -0.25, 0.68], [2.05, -0.45, 0.62]],
  gear: { main: { x: 2.5, y: -0.98, z: 1.84, len: 1.22, r: 0.41 }, tail: { x: 8.62, y: -0.1, len: 0.71, r: 0.16 } },
  hardpoints: [{ at: [3.2, -0.74, 1.15], kind: 'inner' }, { at: [3.0, -0.58, 3.9], kind: 'outer' }, { at: [3.0, -0.43, 4.6], kind: 'outer' }, { at: [3.5, -0.74, 0], kind: 'belly', mirror: false }],
  cockpit: [4.8, 0.72, 0],
  flame: 'stacks',
  livery: {
    factory: { base: '#1b2a4c', finish: 'gloss', insignia: 'star' }, // glossy sea blue
    camo: { base: '#3a4a6c', under: '#e4e4dd', finish: 'satin', insignia: 'star', marks: [{ kind: 'camo', colors: ['#2b3653', '#566f8c'], scale: 0.7, seed: 4 }] },
    squadron: { base: '#1b2a4c', finish: 'gloss', insignia: 'star', marks: [ // the Black Sheep
      { kind: 'nose', x1: 0.06, color: '#f4f4f4' }, { kind: 'fins', color: '#f4f4f4', from: 0.78 }, { kind: 'band', x0: 0.62, x1: 0.65, color: '#f4f4f4' },
    ] },
    airshow: { base: '#c8202f', under: '#f4f4f4', finish: 'gloss', insignia: 'none', marks: [ // an air racer
      { kind: 'stripe', y: 0.15, h: 0.16, color: '#f4f4f4' }, { kind: 'nose', x1: 0.08, color: '#f4f4f4' }, { kind: 'wingtips', color: '#f4f4f4', from: 0.85 }, { kind: 'fins', color: '#f4f4f4', from: 0.7 },
    ] },
  },
};
