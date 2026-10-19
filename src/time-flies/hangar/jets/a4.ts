// Douglas A-4F Skyhawk. Length 12.22 m, span 8.38 m, height 4.57 m. A small tailless-looking delta: a low delta wing,
// intakes beside the cockpit, the A-4F's avionics hump behind the canopy, a tall fin with the tailplane set on it, and
// tall, stalky landing gear. Research: .scratch/airplane-clock/research/jets/a4-skyhawk.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const a4: JetSpec = {
  id: 'a4', length: 12.22, span: 8.38, height: 4.57,
  bodies: [
    { sections: [
      oval(0, 0.02, 0.02, 0.02, -0.05), oval(0.8, 0.26, 0.26, 0.28, -0.03), oval(2.0, 0.44, 0.44, 0.46, 0), oval(3.6, 0.56, 0.52, 0.55, 0.02, 2.2, 2.4),
      oval(6.0, 0.66, 0.55, 0.58, 0.02, 2.4, 2.6), oval(8.5, 0.6, 0.52, 0.52, 0.04, 2.3, 2.4), oval(10.6, 0.48, 0.46, 0.44, 0.06), oval(12.0, 0.38, 0.38, 0.36, 0.06),
    ] },
    { sections: bubble(2.4, 4.6, 0.46, 0.4, 0.5, 0.4), finish: 'glass' },
    { sections: [ // the avionics hump, running back into the fin
      oval(4.4, 0.18, 0.02, 0.1, 0.5), oval(5.2, 0.34, 0.3, 0.1, 0.5), oval(8.0, 0.32, 0.28, 0.1, 0.5), oval(9.4, 0.14, 0.04, 0.1, 0.48),
    ] },
    { z: 0.72, mirror: true, sections: [ // the intakes beside the cockpit
      oval(3.9, 0.22, 0.42, 0.42, -0.08, 4, 4), oval(4.6, 0.3, 0.44, 0.44, -0.08, 3.5, 3.5), oval(6.6, 0.3, 0.4, 0.42, -0.08, 3, 3), oval(8.2, 0.1, 0.25, 0.3, -0.08),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([4.4, -0.4, 0.55], 5.0, [7.65, -0.32, 4.19], 1.25, 0.06, 0.04, 3) },
    { kind: 'tail', stations: wingPanel([10.6, 0.82, 0.12], 1.6, [11.55, 0.82, 1.72], 0.72, 0.05, 0.04, 2) }, // set on the fin
    { kind: 'fin', mirror: false, stations: wingPanel([8.7, 0.45, 0], 3.3, [11.0, 2.85, 0], 1.15, 0.05, 0.04, 3) },
  ],
  nozzles: [{ at: [12.22, 0.06, 0], r: 0.33, len: 0.6 }],
  gear: { nose: { x: 2.3, y: -0.45, len: 1.0, r: 0.25 }, main: { x: 6.7, y: -0.42, z: 1.25, len: 0.98, r: 0.3 } },
  hardpoints: [
    { at: [7.2, -0.42, 2.95], kind: 'outer' }, { at: [6.4, -0.44, 1.65], kind: 'inner' }, { at: [6.0, -0.62, 0], kind: 'belly', mirror: false },
  ],
  cockpit: [3.4, 0.78, 0],
  flame: 'round',
  loads: { 1: { outer: 'aim9', inner: 'pod' }, 3: { outer: 'mk82', inner: 'tank', belly: 'mk82' } },
  livery: {
    factory: { base: '#a8aca9', under: '#f2f2ee', finish: 'satin', insignia: 'star', marks: [{ kind: 'fins', color: '#1d3f8f', from: 0.7 }, { kind: 'antiglare', x0: 0.1, x1: 0.22 }] }, // Navy gull grey over white
    camo: { base: '#c2a277', under: '#9fb3c4', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#7a5a3b', '#5f6a43'], scale: 1.0, seed: 4 }] }, // desert camo
    squadron: { base: '#4b5838', under: '#7a7f7c', finish: 'matte', insignia: 'star', marks: [{ kind: 'camo', colors: ['#2d3729'], scale: 1.1, seed: 12 }, { kind: 'fins', color: '#c8202f', from: 0.75 }] }, // Marine green
    airshow: { base: '#1b2b6b', under: '#1b2b6b', finish: 'gloss', insignia: 'none', marks: [ // Blue Angels
      { kind: 'leading', color: '#f2c230', w: 0.12, under: true }, { kind: 'spine', w: 0.35, color: '#f2c230', x0: 0.05, x1: 0.95 },
      { kind: 'stripe', y: -0.1, h: 0.15, color: '#f2c230', x0: 0.05, x1: 0.85 }, { kind: 'fins', color: '#f2c230', from: 0.88 },
    ] },
  },
};
