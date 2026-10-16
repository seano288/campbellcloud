// North American P-51D Mustang. Length 9.83 m, span 11.28 m, wing root chord 2.58 m and tip 1.18 m, 3.40 m four-blade
// propeller. A taildragger: it sits nose up. Research: .scratch/airplane-clock/research/jets/p51-mustang.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, roundedPanel } from './parts';

export const p51: JetSpec = {
  id: 'p51', length: 9.83, span: 11.28, height: 4.08,
  bodies: [
    { sections: [ // cowling round the Merlin, the cockpit, and the long tapering rear fuselage
      oval(0.62, 0.36, 0.38, 0.4, 0.02), oval(0.85, 0.44, 0.47, 0.5, 0.02), oval(1.8, 0.47, 0.52, 0.56, 0.02), oval(2.9, 0.5, 0.56, 0.62, 0.0),
      oval(3.9, 0.48, 0.55, 0.64, 0.0), oval(5.2, 0.42, 0.42, 0.64, 0.02), oval(6.6, 0.33, 0.36, 0.56, 0.06), oval(8.0, 0.22, 0.3, 0.42, 0.1),
      oval(9.2, 0.11, 0.22, 0.28, 0.14), oval(9.83, 0.03, 0.08, 0.08, 0.16),
    ] },
    { sections: [ // the belly radiator scoop, open at the front
      oval(4.55, 0.33, 0.16, 0.22, -0.72, 2, 3), oval(5.3, 0.36, 0.2, 0.28, -0.74, 2, 3), oval(6.8, 0.32, 0.18, 0.22, -0.68, 2, 3), oval(7.6, 0.18, 0.1, 0.08, -0.55),
    ], openFront: true },
    { sections: [ // carburettor air scoop under the spinner
      oval(1.05, 0.14, 0.08, 0.1, -0.52, 2, 3), oval(1.6, 0.15, 0.08, 0.1, -0.52, 2, 3), oval(2.3, 0.08, 0.04, 0.03, -0.5),
    ], openFront: true },
    { sections: bubble(3.35, 5.6, 0.42, 0.34, 0.52, 0.4), finish: 'glass' },
    { sections: [ // dorsal fin fillet running into the tail
      oval(6.4, 0.06, 0.01, 0.05, 0.35), oval(7.6, 0.06, 0.32, 0.05, 0.35), oval(8.2, 0.05, 0.62, 0.05, 0.35),
    ] },
  ],
  surfaces: [
    { kind: 'wing', stations: roundedPanel([2.55, -0.42, 0.45], 2.58, [3.35, 0.04, 5.35], 1.22, 0.15, 0.1, 0.32) },
    { kind: 'tail', stations: roundedPanel([8.35, 0.12, 0.15], 1.25, [8.85, 0.14, 1.92], 0.72, 0.09, 0.08, 0.18) },
    { kind: 'fin', mirror: false, stations: roundedPanel([7.95, 0.3, 0], 1.75, [8.85, 1.48, 0], 0.85, 0.09, 0.08, 0.2) },
  ],
  nozzles: [],
  props: [{ at: [0.6, 0.02, 0], r: 1.7, blades: 4, spinner: 0.75, chord: 0.3 }],
  stacks: [[1.05, 0.22, 0.45], [1.25, 0.22, 0.45], [1.45, 0.22, 0.46], [1.65, 0.22, 0.46], [1.85, 0.22, 0.47], [2.05, 0.22, 0.47]],
  gear: { main: { x: 2.95, y: -0.5, z: 1.8, len: 1.0, r: 0.35 }, tail: { x: 8.8, y: -0.22, len: 0.32, r: 0.1 } },
  hardpoints: [{ at: [3.2, -0.38, 1.7], kind: 'inner' }, { at: [3.45, -0.25, 3.3], kind: 'outer' }],
  cockpit: [4.3, 0.55, 0],
  flame: 'stacks',
  livery: {
    factory: { base: '#b9bfc5', finish: 'metal', insignia: 'star', marks: [{ kind: 'antiglare', x0: 0.08, x1: 0.36, color: '#4b4f2f' }, { kind: 'nose', x1: 0.09, color: '#c8202f' }] },
    camo: { base: '#5c6141', under: '#8f928c', finish: 'matte', insignia: 'star', marks: [{ kind: 'camo', colors: ['#3f4630', '#76694a'], scale: 0.8, seed: 51 }] },
    squadron: { base: '#bcc2c7', finish: 'metal', insignia: 'star', marks: [ // the Tuskegee Airmen's "Red Tails"
      { kind: 'fins', color: '#c41e2a' }, { kind: 'nose', x1: 0.13, color: '#c41e2a' }, { kind: 'band', x0: 0.13, x1: 0.15, color: '#f2c230' },
      { kind: 'wingtips', color: '#f2c230', from: 0.82 }, { kind: 'antiglare', x0: 0.15, x1: 0.36, color: '#3d4129' },
    ] },
    airshow: { base: '#c3c8cd', finish: 'metal', insignia: 'star', marks: [ // checkerboard nose and invasion stripes
      { kind: 'checker', x0: 0.07, x1: 0.2, colors: ['#ffd400', '#141414'], n: 6 }, { kind: 'fins', color: '#1d3f8f', from: 0.15 },
      { kind: 'band', x0: 0.72, x1: 0.745, color: '#141414' }, { kind: 'band', x0: 0.745, x1: 0.77, color: '#f4f4f4' }, { kind: 'band', x0: 0.77, x1: 0.795, color: '#141414' },
      { kind: 'band', x0: 0.795, x1: 0.82, color: '#f4f4f4' }, { kind: 'band', x0: 0.82, x1: 0.845, color: '#141414' },
    ] },
  },
};
