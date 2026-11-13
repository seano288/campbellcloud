// Bell Boeing MV-22B Osprey. Fuselage 17.47 m, wing span 13.97 m, two 11.6 m three-blade proprotors in nacelles that
// tilt from straight up (helicopter, parked) to straight ahead (aeroplane, for Take Off). Boxy fuselage with side sponsons,
// a high straight wing, an H-tail and a rear ramp. Research: .scratch/airplane-clock/research/jets/v22-osprey.md
import type { JetSpec } from '../three/spec';
import { oval, wingPanel } from './parts';

const TIP = 7.0, NY = 1.65;

export const v22: JetSpec = {
  id: 'v22', length: 17.47, span: 13.97, height: 6.73,
  bodies: [
    { sections: [ // the boxy cabin, nose to the upswept tail over the ramp
      oval(0, 0.1, 0.12, 0.2, -0.15), oval(0.8, 0.66, 0.6, 0.65, -0.05, 2.4, 2.6), oval(2.2, 1.02, 0.9, 0.92, 0, 3.2, 3.6), oval(4.0, 1.12, 1.02, 1.0, 0, 4.5, 5),
      oval(11.5, 1.12, 1.04, 1.0, 0, 4.5, 5), oval(13.8, 0.95, 0.95, 0.62, 0.3, 4, 3), oval(16.2, 0.5, 0.55, 0.28, 0.75, 3, 2.5), oval(17.47, 0.12, 0.18, 0.1, 0.95),
    ] },
    { sections: [ // the cockpit glazing: a big windscreen over the nose, then side windows under a painted roof
      oval(0.6, 0.48, 0.26, 0.3, 0.15, 2.3), oval(1.0, 0.78, 0.52, 0.3, 0.15, 2.5), oval(1.6, 0.93, 0.66, 0.3, 0.15, 2.9), oval(2.3, 1.06, 0.7, 0.3, 0.15, 3.3),
      oval(2.9, 1.09, 0.62, 0.3, 0.15, 3.6), oval(3.2, 0.9, 0.3, 0.3, 0.15),
    ], finish: 'glass' },
    { sections: [ // the sponsons along the lower sides (main gear and fuel), faired into the cabin sides, flat underneath
      oval(4.6, 1.1, 0.2, 0.5, -0.42, 2.2, 5), oval(6.0, 1.8, 0.5, 0.55, -0.42, 2.2, 5), oval(10.5, 1.85, 0.5, 0.55, -0.42, 2.2, 5),
      oval(12.0, 1.25, 0.32, 0.42, -0.4, 2.2, 4), oval(12.6, 1.0, 0.2, 0.3, -0.36),
    ], segs: 32 },
    { z: 0.55, finish: 'metal', segs: 10, sections: [ // the refuelling probe on the right of the nose
      oval(-1.15, 0.03, 0.03, 0.03, 0.16), oval(-1.05, 0.06, 0.06, 0.06, 0.16), oval(0.9, 0.07, 0.07, 0.07, 0.13), oval(2.6, 0.12, 0.1, 0.12, 0.05), oval(3.4, 0.05, 0.04, 0.05, 0),
    ] },
    { sections: [oval(5.0, 0.7, 0.02, 0.1, 1.0), oval(6.2, 1.0, 0.38, 0.1, 1.0), oval(8.6, 1.0, 0.38, 0.1, 1.0), oval(9.8, 0.7, 0.05, 0.1, 1.0)] }, // wing fairing
    { z: TIP, mirror: true, part: 'nacelle', sections: [ // the engine nacelles at the wingtips
      oval(4.6, 0.82, 0.84, 0.84, NY), oval(5.3, 0.76, 0.8, 0.82, NY), oval(6.5, 0.69, 0.74, 0.78, NY), oval(7.7, 0.64, 0.69, 0.73, NY),
      oval(8.5, 0.52, 0.56, 0.6, NY), oval(8.9, 0.36, 0.38, 0.4, NY),
    ], segs: 32 },
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([6.0, 1.35, 0], 2.55, [5.35, 1.38, TIP - 0.6], 2.45, 0.23, 0.21, 3) }, // 6° forward sweep
    { kind: 'tail', stations: wingPanel([15.6, 1.25, 0], 1.6, [15.75, 1.25, 2.8], 1.5, 0.1, 0.09, 2) },
    { kind: 'fin', stations: wingPanel([15.25, 0.35, 2.8], 2.05, [15.8, 3.3, 2.8], 1.5, 0.09, 0.08, 3) },
  ],
  pivots: [{ part: 'nacelle', at: [6.9, NY, TIP], axis: [0, 0, 1] }],
  nozzles: [{ at: [8.95, NY, TIP], r: 0.3, len: 0.4, mirror: true, part: 'nacelle' }],
  props: [{ at: [4.55, NY, TIP], r: 5.8, blades: 3, spinner: 0.9, mirror: true, part: 'nacelle', chord: 0.85 }],
  gear: { nose: { x: 2.2, y: -0.92, len: 0.7, r: 0.35, twin: true }, main: { x: 8.6, y: -0.95, z: 1.5, len: 0.66, r: 0.4, twin: true } },
  hardpoints: [{ at: [6.8, -0.86, 1.65], kind: 'inner' }, { at: [10.0, -1.0, 0], kind: 'belly', mirror: false }],
  cockpit: [1.9, 0.55, 0],
  seats: [[1.9, 0.55, 0.45], [1.9, 0.55, -0.45]],
  flame: 'round',
  loads: { 1: { inner: 'pod' }, 2: { inner: 'mk82', belly: 'tank' }, 3: { inner: 'pod', belly: 'tank' } },
  livery: {
    factory: { base: '#6c7479', under: '#80878c', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#545b60'], scale: 1.5, seed: 22 }] },
    camo: { base: '#4b5838', under: '#3c4632', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#2a3024', '#6b5a3c'], scale: 1.1, seed: 42, under: true }] }, // woodland
    squadron: { base: '#2f4a2f', under: '#2f4a2f', finish: 'gloss', insignia: 'star', marks: [{ kind: 'spine', w: 2.6, color: '#f2f2ee', x0: 0.0, x1: 0.85 }, { kind: 'stripe', y: 0.95, h: 0.12, color: '#c8a030', x0: 0.05, x1: 0.85 }] }, // presidential green and white
    airshow: { base: '#f2f2ee', under: '#f2f2ee', finish: 'gloss', insignia: 'star', marks: [ // rescue orange
      { kind: 'band', x0: 0.3, x1: 0.42, color: '#f26b1d' }, { kind: 'nose', x1: 0.06, color: '#f26b1d' }, { kind: 'fins', color: '#f26b1d', from: 0.5 }, { kind: 'wingtips', color: '#f26b1d', from: 0.7 },
    ] },
  },
};
