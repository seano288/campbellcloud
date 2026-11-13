// F-16 Fighting Falcon (Block 50/52). Length 15.06 m, span 9.96 m, height 5.09 m, 40° leading-edge sweep.
// Research: .scratch/airplane-clock/research/jets/f16-viper.md. x = 0 is the pitot tip (the radome starts 0.85 m back);
// y = 0 is the datum 1.98 m above the ground. Stations traced from the public-domain Commons three-view.
import { panel } from '../three/geometry';
import type { JetSpec } from '../three/spec';

export const f16: JetSpec = {
  id: 'f16', length: 15.06, span: 9.96, height: 5.09,
  bodies: [
    { sections: [ // the fuselage: a short ogive radome, a broad flat-topped cockpit, then deep and flat-sided over the intake duct
      { x: 0.85, w: 0.03, top: 0.03, bot: 0.03, y: -0.33 }, { x: 1.4, w: 0.24, top: 0.24, bot: 0.25, y: -0.27 }, { x: 2.2, w: 0.4, top: 0.38, bot: 0.4, y: -0.15 },
      { x: 3.3, w: 0.53, top: 0.5, bot: 0.5, y: -0.05, n: 2.2, nb: 2.4 }, { x: 4.4, w: 0.6, top: 0.53, bot: 0.47, y: -0.03, n: 2.6, nb: 2.6 },
      { x: 4.95, w: 0.64, top: 0.54, bot: 0.46, y: -0.04, n: 2.6, nb: 2.8 },
      { x: 5.7, w: 0.69, top: 0.55, bot: 0.97, y: -0.05, n: 2.6, nb: 3.6 }, { x: 7.0, w: 0.74, top: 0.57, bot: 1.0, y: -0.06, n: 2.4, nb: 3.6 },
      { x: 9.0, w: 0.76, top: 0.58, bot: 0.98, y: -0.07, n: 2.2, nb: 3.6 }, { x: 11.0, w: 0.74, top: 0.57, bot: 0.88, y: -0.07, n: 2.2, nb: 3.4 },
      { x: 12.6, w: 0.66, top: 0.55, bot: 0.72, y: -0.06, n: 2.2, nb: 3 }, { x: 14.0, w: 0.56, top: 0.5, bot: 0.55, y: -0.08, n: 2.1, nb: 2.4 },
      { x: 14.5, w: 0.52, top: 0.48, bot: 0.5, y: -0.1 },
    ] },
    { sections: [ // the strakes and wing-body blend: a wide, sharp-edged "tent" from beside the canopy back to the tailplanes
      { x: 3.5, w: 0.5, top: 0.05, bot: 0.05, y: -0.02, n: 0.9, nb: 1.6 }, { x: 4.2, w: 0.64, top: 0.26, bot: 0.1, y: -0.08, n: 0.9, nb: 1.6 },
      { x: 5.15, w: 0.8, top: 0.33, bot: 0.12, y: -0.1, n: 0.9, nb: 1.6 }, { x: 6.05, w: 0.97, top: 0.38, bot: 0.14, y: -0.12, n: 0.9, nb: 1.6 },
      { x: 6.7, w: 1.15, top: 0.42, bot: 0.15, y: -0.13, n: 0.9, nb: 1.6 }, { x: 7.4, w: 1.31, top: 0.44, bot: 0.15, y: -0.14, n: 0.9, nb: 1.6 },
      { x: 7.75, w: 1.38, top: 0.44, bot: 0.15, y: -0.14, n: 0.9, nb: 1.6 }, { x: 11.3, w: 1.38, top: 0.4, bot: 0.15, y: -0.14, n: 0.9, nb: 1.6 },
      { x: 12.0, w: 1.05, top: 0.36, bot: 0.14, y: -0.14, n: 0.9, nb: 1.6 }, { x: 14.6, w: 1.0, top: 0.3, bot: 0.12, y: -0.14, n: 0.9, nb: 1.6 },
      { x: 14.95, w: 0.85, top: 0.08, bot: 0.05, y: -0.14, n: 0.9, nb: 1.6 },
    ] },
    { sections: [ // the chin intake's wide "smile", open at the front, fairing back into the belly
      { x: 4.95, w: 0.7, top: 0.31, bot: 0.32, y: -0.74, n: 3.2, nb: 2.6 }, { x: 5.6, w: 0.72, top: 0.38, bot: 0.33, y: -0.71, n: 3, nb: 2.8 },
      { x: 6.6, w: 0.68, top: 0.36, bot: 0.3, y: -0.72, n: 3, nb: 3 }, { x: 7.6, w: 0.6, top: 0.3, bot: 0.25, y: -0.75, n: 3, nb: 3 },
    ], openFront: true },
    { sections: [ // the dorsal spine, rising out of the canopy and running back to the fin
      { x: 6.0, w: 0.3, top: 0.02, bot: 0.1, y: 0.45 }, { x: 6.8, w: 0.33, top: 0.2, bot: 0.12, y: 0.5 }, { x: 8.5, w: 0.33, top: 0.12, bot: 0.12, y: 0.5 },
      { x: 10.5, w: 0.3, top: 0.07, bot: 0.12, y: 0.5 }, { x: 12.5, w: 0.2, top: 0.03, bot: 0.1, y: 0.47 },
    ] },
    { sections: [ // the drag-chute fairing at the foot of the fin
      { x: 13.7, w: 0.05, top: 0.03, bot: 0.05, y: 0.52 }, { x: 14.2, w: 0.2, top: 0.15, bot: 0.1, y: 0.52, n: 2.6 }, { x: 15.0, w: 0.2, top: 0.15, bot: 0.1, y: 0.52, n: 2.6 },
    ], segs: 16 },
    { sections: [ // the nose pitot boom
      { x: 0, w: 0.012, top: 0.012, bot: 0.012, y: -0.33 }, { x: 0.12, w: 0.022, top: 0.022, bot: 0.022, y: -0.33 }, { x: 0.9, w: 0.04, top: 0.04, bot: 0.04, y: -0.33 },
    ], finish: 'metal', segs: 8 },
    { sections: [ // the tall one-piece bubble canopy, no bow in front of the pilot
      { x: 3.3, w: 0.1, top: 0.02, bot: 0.08, y: 0.45 }, { x: 3.8, w: 0.31, top: 0.22, bot: 0.1, y: 0.45 }, { x: 4.4, w: 0.42, top: 0.44, bot: 0.1, y: 0.45 },
      { x: 5.0, w: 0.44, top: 0.5, bot: 0.1, y: 0.45 }, { x: 5.8, w: 0.39, top: 0.41, bot: 0.1, y: 0.45 }, { x: 6.4, w: 0.28, top: 0.25, bot: 0.1, y: 0.45 },
      { x: 6.9, w: 0.1, top: 0.04, bot: 0.08, y: 0.45 },
    ], finish: 'glass' },
  ],
  surfaces: [
    { kind: 'wing', stations: panel({ le: [7.31, -0.14, 1.0], chord: 4.14, t: 0.04 }, { le: [10.4, -0.14, 4.72], chord: 1.05, t: 0.03 }, 3) },
    { kind: 'tail', stations: panel({ le: [12.45, -0.14, 0.95], chord: 2.45, t: 0.045 }, { le: [14.0, -0.42, 2.79], chord: 0.85, t: 0.035 }, 2) },
    { kind: 'fin', mirror: false, stations: panel({ le: [11.3, 0.48, 0], chord: 3.3, t: 0.05 }, { le: [14.27, 3.1, 0], chord: 0.85, t: 0.04 }, 3) },
    { kind: 'other', stations: panel({ le: [11.0, -0.8, 0.42], chord: 1.45, t: 0.05 }, { le: [11.5, -1.3, 0.62], chord: 0.95, t: 0.04 }, 1) }, // ventral fins, canted out
  ],
  nozzles: [{ at: [14.95, -0.1, 0], r: 0.44, len: 1.0 }],
  gear: { nose: { x: 5.93, y: -0.95, len: 0.8, r: 0.23 }, main: { x: 9.72, y: -0.35, z: 1.18, len: 1.3, r: 0.33 } },
  hardpoints: [
    { at: [10.9, -0.14, 4.92], kind: 'tip' }, { at: [10.1, -0.2, 3.55], kind: 'outer' }, { at: [9.4, -0.2, 2.2], kind: 'inner' },
    { at: [8.6, -1.08, 0], kind: 'belly', mirror: false },
  ],
  cockpit: [5.0, 0.52, 0],
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
