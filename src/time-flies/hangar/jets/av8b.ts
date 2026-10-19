// McDonnell Douglas AV-8B Harrier II. Length 14.12 m, span 9.25 m, height 3.55 m. A jump jet: one Pegasus engine blows
// out of four swivelling nozzles on the fuselage sides (shown pointing aft, as in forward flight), fed by big round
// intakes; a shoulder wing drooping down 12° to small outrigger wheels, a drooped tailplane and bicycle gear under the
// fuselage. Research: .scratch/airplane-clock/research/jets/av8b-harrier.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, wingPanel } from './parts';

export const av8b: JetSpec = {
  id: 'av8b', length: 14.12, span: 9.25, height: 3.55,
  bodies: [
    { sections: [ // stubby nose, a fat middle round the engine, then a long thin tail cone
      oval(0, 0.02, 0.02, 0.02, -0.1), oval(0.8, 0.3, 0.3, 0.3, -0.08), oval(2.0, 0.5, 0.5, 0.5, -0.02), oval(3.6, 0.62, 0.62, 0.62, 0.02, 2.2, 2.4),
      oval(5.6, 0.9, 0.66, 0.72, 0.04, 2.6, 2.8), oval(7.6, 0.98, 0.64, 0.72, 0.04, 2.8, 3), oval(9.6, 0.78, 0.6, 0.62, 0.06, 2.6, 2.6),
      oval(11.6, 0.42, 0.45, 0.4, 0.12), oval(13.4, 0.2, 0.25, 0.2, 0.2), oval(14.12, 0.06, 0.08, 0.06, 0.22),
    ] },
    { sections: bubble(2.3, 5.2, 0.62, 0.44, 0.62, 0.4), finish: 'glass' }, // the raised bubble canopy
    { sections: [oval(5.0, 0.36, 0.1, 0.1, 0.62), oval(5.8, 0.42, 0.22, 0.1, 0.64), oval(9.6, 0.36, 0.18, 0.1, 0.6), oval(11.0, 0.18, 0.04, 0.1, 0.5)] }, // the spine
    { z: 0.88, mirror: true, sections: [ // the big round intakes
      oval(4.2, 0.36, 0.5, 0.5, -0.05, 2.2, 2.2), oval(4.9, 0.44, 0.56, 0.56, -0.05, 2.4, 2.4), oval(6.4, 0.4, 0.52, 0.56, -0.05, 2.6, 2.6), oval(7.8, 0.1, 0.3, 0.4, -0.05),
    ], openFront: true },
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([6.1, 0.66, 0.6], 3.9, [8.4, -0.2, 4.62], 1.2, 0.08, 0.06, 3) }, // drooping 12°
    { kind: 'tail', stations: wingPanel([12.0, 0.3, 0.3], 1.6, [13.0, -0.15, 2.1], 0.7, 0.05, 0.04, 2) },
    { kind: 'fin', mirror: false, stations: wingPanel([10.8, 0.55, 0], 2.6, [12.9, 1.85, 0], 1.0, 0.06, 0.05, 3) },
  ],
  nozzles: [ // the four swivelling nozzles: cool air at the front, hot exhaust at the back
    { at: [6.1, -0.42, 1.08], r: 0.3, len: 0.6, mirror: true },
    { at: [8.4, -0.42, 1.02], r: 0.34, len: 0.6, mirror: true },
  ],
  gear: { // bicycle gear: one leg in front, one behind and an outrigger under each wing
    nose: { x: 4.2, y: -0.75, len: 0.65, r: 0.3 }, tail: { x: 8.9, y: -0.75, len: 0.63, r: 0.32 },
    main: { x: 8.2, y: 0.05, z: 3.55, len: 1.57, r: 0.18 },
  },
  hardpoints: [
    { at: [8.3, 0.0, 3.3], kind: 'outer' }, { at: [7.6, 0.3, 2.1], kind: 'inner' }, { at: [7.2, -0.8, 0.45], kind: 'belly' },
  ],
  cockpit: [3.7, 1.08, 0],
  flame: 'round',
  loads: { 1: { outer: 'aim9', inner: 'maverick', belly: 'pod' }, 2: { outer: 'mk82', inner: 'gbu', belly: 'pod' }, 3: { outer: 'aim9', inner: 'tank', belly: 'pod' } },
  livery: {
    factory: { base: '#6f777d', under: '#8b9399', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#596066'], scale: 1.4, seed: 8 }] }, // Marine tactical greys
    camo: { base: '#4a5640', under: '#9aa3a8', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#2d3729', '#5c6359'], scale: 1.1, seed: 51 }] }, // early green and grey
    squadron: { base: '#6f777d', under: '#8b9399', finish: 'satin', insignia: 'star', marks: [{ kind: 'fins', color: '#141414' }, { kind: 'stripe', y: 0.2, h: 0.12, color: '#c8202f', x0: 0.1, x1: 0.4 }] },
    airshow: { base: '#f2f2ee', under: '#c8202f', finish: 'gloss', insignia: 'none', marks: [
      { kind: 'nose', x1: 0.07, color: '#c8202f' }, { kind: 'stripe', y: 0.05, h: 0.14, color: '#c8202f', x0: 0.08, x1: 0.85 }, { kind: 'fins', color: '#1d3a8a', from: 0.5 },
      { kind: 'wingtips', color: '#c8202f', from: 0.7 },
    ] },
  },
};
