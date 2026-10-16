// F-16 Fighting Falcon (Block 50/52). Length 15.06 m, span 9.96 m, height 5.09 m, 40° leading-edge sweep.
// Research: .scratch/airplane-clock/research/jets/f16-viper.md. y = 0 is the fuselage centre line, 1.98 m above the ground.
import { panel } from '../three/geometry';
import type { JetSpec } from '../three/spec';

export const f16: JetSpec = {
  id: 'f16', length: 15.06, span: 9.96, height: 5.09,
  bodies: [
    { sections: [ // the fuselage, blending wider and flatter where the wing and strakes join
      { x: 0, w: 0.01, top: 0.01, bot: 0.01, y: 0.02 }, { x: 0.6, w: 0.2, top: 0.2, bot: 0.2, y: 0.03 }, { x: 1.6, w: 0.37, top: 0.36, bot: 0.37, y: 0.05 },
      { x: 2.6, w: 0.49, top: 0.48, bot: 0.47, y: 0.07 }, { x: 3.8, w: 0.58, top: 0.56, bot: 0.52, y: 0.08, n: 2.2 },
      { x: 5.0, w: 0.64, top: 0.58, bot: 0.5, y: 0.08, n: 2.4, nb: 2.6 }, { x: 6.6, w: 0.74, top: 0.58, bot: 0.48, y: 0.06, n: 2.8, nb: 3.2 },
      { x: 8.6, w: 0.8, top: 0.56, bot: 0.47, y: 0.04, n: 3, nb: 3.4 }, { x: 10.6, w: 0.74, top: 0.55, bot: 0.47, y: 0.03, n: 2.9, nb: 3 },
      { x: 12.6, w: 0.62, top: 0.52, bot: 0.47, y: 0.02, n: 2.5, nb: 2.6 }, { x: 14.2, w: 0.52, top: 0.48, bot: 0.46, n: 2.1 }, { x: 14.6, w: 0.5, top: 0.47, bot: 0.45 },
    ] },
    { sections: [ // the chin intake, its "smile" open at the front
      { x: 4.35, w: 0.47, top: 0.22, bot: 0.3, y: -0.7, n: 5, nb: 2.4 }, { x: 5.4, w: 0.5, top: 0.28, bot: 0.32, y: -0.66, n: 4, nb: 2.5 },
      { x: 7.6, w: 0.5, top: 0.3, bot: 0.27, y: -0.6, n: 4, nb: 2.8 }, { x: 9.8, w: 0.44, top: 0.25, bot: 0.12, y: -0.5, n: 4, nb: 3 },
    ], openFront: true },
    { sections: [ // the dorsal spine behind the canopy, running back into the fin
      { x: 6.0, w: 0.3, top: 0.02, bot: 0.12, y: 0.52 }, { x: 7.0, w: 0.36, top: 0.18, bot: 0.15, y: 0.56 },
      { x: 10.2, w: 0.34, top: 0.2, bot: 0.15, y: 0.57 }, { x: 12.0, w: 0.22, top: 0.06, bot: 0.15, y: 0.52 },
    ] },
    { sections: [ // the one-piece bubble canopy
      { x: 2.55, w: 0.08, top: 0.02, bot: 0.06, y: 0.52 }, { x: 3.2, w: 0.32, top: 0.3, bot: 0.1, y: 0.52 }, { x: 4.3, w: 0.4, top: 0.48, bot: 0.1, y: 0.52 },
      { x: 5.4, w: 0.37, top: 0.42, bot: 0.1, y: 0.52 }, { x: 6.3, w: 0.22, top: 0.12, bot: 0.1, y: 0.52 },
    ], finish: 'glass' },
  ],
  surfaces: [
    { kind: 'strake', stations: [{ le: [4.4, -0.02, 0.5], chord: 6.6, t: 0.03 }, { le: [6.0, -0.04, 0.85], chord: 5.2, t: 0.035 }, { le: [6.9, -0.05, 1.0], chord: 4.55, t: 0.04 }] },
    { kind: 'wing', stations: panel({ le: [6.9, -0.05, 0.98], chord: 4.55, t: 0.04 }, { le: [10.05, -0.05, 4.72], chord: 1.15, t: 0.03 }, 3) },
    { kind: 'tail', stations: panel({ le: [12.7, -0.08, 0.5], chord: 2.4, t: 0.045 }, { le: [14.15, -0.32, 2.79], chord: 0.85, t: 0.035 }, 2) },
    { kind: 'fin', mirror: false, stations: panel({ le: [10.4, 0.45, 0], chord: 4.0, t: 0.05 }, { le: [13.0, 3.12, 0], chord: 1.05, t: 0.04 }, 3) },
    { kind: 'other', stations: panel({ le: [12.0, -0.42, 0.36], chord: 1.4, t: 0.05 }, { le: [12.6, -1.0, 0.6], chord: 0.85, t: 0.04 }, 1) }, // ventral fins
  ],
  nozzles: [{ at: [15.06, 0, 0], r: 0.44, len: 1.0 }],
  gear: { nose: { x: 5.3, y: -0.88, len: 0.87, r: 0.23 }, main: { x: 9.1, y: -0.5, z: 1.15, len: 1.15, r: 0.33 } },
  hardpoints: [
    { at: [10.6, -0.05, 4.92], kind: 'tip' }, { at: [9.7, -0.12, 3.55], kind: 'outer' }, { at: [9.0, -0.1, 2.2], kind: 'inner' },
    { at: [8.4, -0.92, 0], kind: 'belly', mirror: false },
  ],
  cockpit: [4.5, 0.95, 0],
  flame: 'round',
  livery: {
    factory: { base: '#8c949b', under: '#a3abb2', finish: 'satin', insignia: 'lowvis', marks: [
      { kind: 'spine', w: 1.3, color: '#6c747b', x0: 0.18, x1: 0.95 }, { kind: 'nose', x1: 0.12, color: '#7b8389' },
      { kind: 'camo', colors: ['#747c83'], scale: 1.3, seed: 3 },
    ] },
    camo: { base: '#c9ad7c', under: '#9fb3c4', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#8a6a42', '#5d6a43'], scale: 1.1, seed: 16 }] },
    squadron: { base: '#9ab3cc', under: '#c4d2de', finish: 'satin', insignia: 'lowvis', marks: [
      { kind: 'splinter', colors: ['#3d5f86', '#dfe8f0', '#20354f'], seed: 5 }, { kind: 'fins', color: '#20354f', from: 0.7 },
    ] },
    airshow: { base: '#f4f5f7', under: '#1d3a8a', finish: 'gloss', insignia: 'none', marks: [
      { kind: 'nose', x1: 0.07, color: '#c8202f' }, { kind: 'band', x0: 0.07, x1: 0.085, color: '#f4f5f7' }, { kind: 'band', x0: 0.085, x1: 0.1, color: '#1d3a8a' },
      { kind: 'stripe', y: 0.12, h: 0.14, color: '#c8202f', x0: 0.1, x1: 0.72 }, { kind: 'stripe', y: -0.08, h: 0.12, color: '#1d3a8a', x0: 0.12, x1: 0.72 },
      { kind: 'leading', color: '#c8202f', w: 0.16 }, { kind: 'fins', color: '#1d3a8a', from: 0.62 },
    ] },
  },
};
