// North American P-51D Mustang. Length 9.83 m, span 11.28 m, wing root chord 2.58 m and tip 1.18 m, 3.40 m four-blade
// propeller. A taildragger: it sits about 13° nose up. Stations measured off the Commons P-51D three-view (thrust line
// y = 0): a slim pointed Merlin nose, a deep belly whose radiator scoop hangs under the wing with its mouth just clear of
// it, a level spine behind the bubble canopy, and a tall narrow tail cone. Research: .scratch/airplane-clock/research/jets/p51-mustang.md
import type { BodyPart, JetSpec } from '../three/spec';
import { bubble, joined, oval, roundedPanel, wingPanel } from './parts';

// the six fishtail exhaust stacks each side of the Merlin
const STACKS = [1.2, 1.36, 1.52, 1.68, 1.84, 2.0].map(x => [x, 0.1, 0.36 + (x - 1.2) * 0.05] as const);
const stack = (x: number, z: number): BodyPart => ({
  z, mirror: true, finish: 'dark', segs: 10,
  sections: [oval(x - 0.05, 0.035, 0.035, 0.035, 0.1), oval(x + 0.02, 0.05, 0.045, 0.045, 0.1), oval(x + 0.07, 0.05, 0.04, 0.04, 0.1)],
});

export const p51: JetSpec = {
  id: 'p51', length: 9.83, span: 11.28, height: 4.08,
  bodies: [
    { sections: [ // cowling round the Merlin, the cockpit, and the deep, narrow rear fuselage
      oval(0.62, 0.29, 0.29, 0.31, 0, 2.2, 2.2), oval(0.95, 0.35, 0.34, 0.42, 0, 2.2, 2.2), oval(2.0, 0.41, 0.44, 0.66, 0, 2.2, 2.2), oval(2.9, 0.44, 0.5, 0.76, 0, 2.4, 2.2),
      oval(3.9, 0.45, 0.53, 0.8, 0, 2.6, 2.2), oval(5.0, 0.44, 0.55, 0.92, 0, 2.6, 2.4), oval(5.7, 0.41, 0.55, 1.04, 0, 2.4, 2.6), oval(6.3, 0.36, 0.55, 0.98, 0, 2.2, 2.6),
      oval(6.75, 0.31, 0.55, 0.76, 0, 2.2, 2.2), oval(7.6, 0.24, 0.55, 0.56, 0), oval(8.6, 0.16, 0.39, 0.39, 0.16), oval(9.4, 0.09, 0.2, 0.2, 0.33), oval(9.83, 0.03, 0.07, 0.07, 0.42),
    ] },
    { sections: [ // the belly radiator scoop: its mouth hangs just below the wing, then the deep belly takes over
      oval(3.95, 0.28, 0.14, 0.14, -1.0, 2.6, 3), oval(4.5, 0.31, 0.2, 0.16, -0.98, 2.4, 3), oval(5.3, 0.31, 0.3, 0.14, -0.95, 2.2, 3),
      oval(5.9, 0.2, 0.2, 0.08, -0.94, 2.2, 3),
    ], openFront: true, segs: 28 },
    { sections: [ // carburettor air scoop just behind the spinner
      oval(0.8, 0.13, 0.07, 0.07, -0.42, 2, 3), oval(1.3, 0.15, 0.09, 0.1, -0.46, 2, 3), oval(2.4, 0.06, 0.03, 0.03, -0.66),
    ], openFront: true, segs: 20 },
    { sections: bubble(3.3, 5.8, 0.4, 0.36, 0.47, 0.55), finish: 'glass' },
    { sections: [ // dorsal fin fillet, from behind the canopy up into the fin
      oval(6.4, 0.04, 0.0, 0.05, 0.52), oval(7.6, 0.06, 0.1, 0.05, 0.52), oval(8.35, 0.07, 0.24, 0.05, 0.52), oval(8.8, 0.07, 0.3, 0.05, 0.52),
    ], segs: 16 },
    ...STACKS.map(([x, , z]) => stack(x, z)),
  ],
  surfaces: [
    { kind: 'wing', stations: joined( // low wing flush with the belly, with the root extension ahead of the gear bays
      wingPanel([2.5, -0.62, 0.45], 2.6, [2.78, -0.54, 1.4], 2.18, 0.15, 0.145, 1),
      roundedPanel([2.78, -0.54, 1.4], 2.18, [3.18, -0.2, 5.3], 1.2, 0.145, 0.1, 0.32),
    ) },
    { kind: 'tail', stations: roundedPanel([8.0, 0.22, 0.15], 1.2, [8.25, 0.24, 1.85], 0.86, 0.09, 0.08, 0.18) },
    { kind: 'fin', mirror: false, stations: roundedPanel([8.27, 0.5, 0], 1.55, [8.83, 1.55, 0], 0.72, 0.09, 0.08, 0.12) },
  ],
  nozzles: [],
  props: [{ at: [0.62, 0, 0], r: 1.7, blades: 4, spinner: 0.62, chord: 0.3 }],
  stacks: STACKS.map(([x, y, z]) => [x + 0.07, y, z + 0.04] as const),
  gear: { main: { x: 2.8, y: -0.6, z: 1.79, len: 1.0, r: 0.37 }, tail: { x: 7.9, y: -0.5, len: 0.2, r: 0.1 } },
  hardpoints: [{ at: [3.3, -0.57, 2.5], kind: 'inner' }, { at: [3.45, -0.48, 3.4], kind: 'outer' }],
  cockpit: [4.5, 0.6, 0],
  flame: 'stacks',
  livery: {
    factory: { base: '#b9bfc5', finish: 'metal', insignia: 'star', marks: [{ kind: 'antiglare', x0: 0.08, x1: 0.34, color: '#4b4f2f' }, { kind: 'nose', x1: 0.09, color: '#c8202f' }] },
    camo: { base: '#5c6141', under: '#8f928c', finish: 'matte', insignia: 'star', marks: [{ kind: 'camo', colors: ['#3f4630', '#76694a'], scale: 0.8, seed: 51 }] },
    squadron: { base: '#bcc2c7', finish: 'metal', insignia: 'star', marks: [ // the Tuskegee Airmen's "Red Tails"
      { kind: 'fins', color: '#c41e2a' }, { kind: 'nose', x1: 0.13, color: '#c41e2a' }, { kind: 'band', x0: 0.13, x1: 0.15, color: '#f2c230' },
      { kind: 'wingtips', color: '#f2c230', from: 0.82 }, { kind: 'antiglare', x0: 0.15, x1: 0.34, color: '#3d4129' },
    ] },
    airshow: { base: '#c3c8cd', finish: 'metal', insignia: 'star', marks: [ // checkerboard nose and invasion stripes
      { kind: 'checker', x0: 0.07, x1: 0.2, colors: ['#ffd400', '#141414'], n: 6 }, { kind: 'fins', color: '#1d3f8f', from: 0.15 },
      { kind: 'band', x0: 0.72, x1: 0.745, color: '#141414' }, { kind: 'band', x0: 0.745, x1: 0.77, color: '#f4f4f4' }, { kind: 'band', x0: 0.77, x1: 0.795, color: '#141414' },
      { kind: 'band', x0: 0.795, x1: 0.82, color: '#f4f4f4' }, { kind: 'band', x0: 0.82, x1: 0.845, color: '#141414' },
    ] },
  },
};
