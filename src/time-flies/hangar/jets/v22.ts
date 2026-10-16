// Bell Boeing MV-22B Osprey. Fuselage 17.47 m, wing span 13.97 m, two 11.6 m three-blade proprotors in nacelles that
// tilt from straight up (helicopter, parked) to straight ahead (aeroplane, for Take Off). Boxy fuselage with side sponsons,
// a high straight wing, an H-tail and a rear ramp. Research: .scratch/airplane-clock/research/jets/v22-osprey.md
import type { JetSpec } from '../three/spec';
import { circle, oval, wingPanel } from './parts';

const TIP = 7.0, NY = 1.65;

export const v22: JetSpec = {
  id: 'v22', length: 17.47, span: 13.97, height: 6.73,
  bodies: [
    { sections: [ // the boxy cabin, nose to the upswept tail over the ramp
      oval(0, 0.1, 0.12, 0.2, -0.15), oval(0.8, 0.62, 0.6, 0.65, -0.05, 2.4, 2.6), oval(2.2, 0.92, 0.88, 0.92, 0, 3.2, 3.6), oval(4.0, 1.0, 1.0, 1.0, 0, 4.5, 5),
      oval(11.5, 1.0, 1.02, 1.0, 0, 4.5, 5), oval(13.8, 0.85, 0.95, 0.62, 0.3, 4, 3), oval(16.2, 0.45, 0.55, 0.28, 0.75, 3, 2.5), oval(17.47, 0.12, 0.18, 0.1, 0.95),
    ] },
    { sections: [ // the cockpit glazing
      oval(0.55, 0.3, 0.05, 0.25, 0.1), oval(1.0, 0.62, 0.42, 0.3, 0.12, 2.4, 2), oval(1.9, 0.82, 0.6, 0.3, 0.18, 3, 2), oval(2.7, 0.75, 0.45, 0.3, 0.22, 3, 2), oval(3.0, 0.5, 0.05, 0.3, 0.25),
    ], finish: 'glass' },
    { z: 1.15, mirror: true, sections: [ // sponsons for the landing gear and fuel
      oval(5.0, 0.15, 0.3, 0.35, -0.55), oval(6.0, 0.5, 0.42, 0.45, -0.55, 3, 3), oval(10.5, 0.5, 0.42, 0.45, -0.55, 3, 3), oval(11.8, 0.15, 0.3, 0.3, -0.5),
    ] },
    { sections: [oval(5.0, 0.6, 0.02, 0.1, 1.0), oval(6.2, 0.9, 0.38, 0.1, 1.0), oval(8.6, 0.9, 0.38, 0.1, 1.0), oval(9.8, 0.6, 0.05, 0.1, 1.0)] }, // wing fairing
    { z: TIP, mirror: true, part: 'nacelle', sections: [ // the engine nacelles at the wingtips
      circle(4.6, 0.35, NY), circle(5.3, 0.62, NY), circle(8.2, 0.66, NY), circle(9.6, 0.42, NY),
    ] },
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([6.0, 1.35, 0], 2.55, [5.6, 1.38, TIP - 0.55], 2.45, 0.23, 0.21, 3) },
    { kind: 'tail', stations: wingPanel([15.6, 1.25, 0], 1.6, [15.75, 1.25, 2.8], 1.5, 0.1, 0.09, 2) },
    { kind: 'fin', stations: wingPanel([15.25, 0.35, 2.8], 2.05, [15.8, 3.3, 2.8], 1.5, 0.09, 0.08, 3) },
  ],
  pivots: [{ part: 'nacelle', at: [6.9, NY, TIP], axis: [0, 0, 1] }],
  nozzles: [{ at: [9.65, NY, TIP], r: 0.3, len: 0.4, mirror: true, part: 'nacelle' }],
  props: [{ at: [4.55, NY, TIP], r: 5.8, blades: 3, spinner: 1.0, mirror: true, part: 'nacelle', chord: 0.85 }],
  gear: { nose: { x: 2.2, y: -0.92, len: 0.7, r: 0.35, twin: true }, main: { x: 8.6, y: -0.95, z: 1.35, len: 0.66, r: 0.4, twin: true } },
  hardpoints: [{ at: [8.0, -0.6, 1.75], kind: 'inner' }, { at: [10.0, -1.0, 0], kind: 'belly', mirror: false }],
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
