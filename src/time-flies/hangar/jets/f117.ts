// Lockheed F-117 Nighthawk. Length 20.09 m, span 13.21 m, height 3.78 m. All flat facets: the leading edge runs at 67.5°
// straight from the nose to each wingtip, the body is a pyramid on a flat belly, the V-tail ruddervators lean out 50°,
// and the engines exhaust through flat slots. Research: .scratch/airplane-clock/research/jets/f117-nighthawk.md
import type { JetSpec } from '../three/spec';
import { oval, wingPanel } from './parts';

const LE = Math.tan((22.5 * Math.PI) / 180); // the leading edge: half-width = x · tan(22.5°)

export const f117: JetSpec = {
  id: 'f117', length: 20.09, span: 13.21, height: 3.78,
  bodies: [
    { flat: true, segs: 12, sections: [ // a faceted pyramid: n = 1 makes straight sides up to the ridge, a flat belly below
      oval(0, 0.01, 0.01, 0.01, 0), oval(2.5, 2.5 * LE, 0.38, 0.14, 0, 1, 6), oval(5.5, 5.5 * LE, 0.78, 0.22, 0, 1, 6), oval(8.0, 2.95, 0.95, 0.25, 0, 1, 6),
      oval(12.0, 2.6, 0.82, 0.25, 0, 1, 6), oval(16.0, 2.0, 0.6, 0.22, 0, 1, 6), oval(19.2, 1.35, 0.3, 0.18, 0, 1, 6), oval(20.09, 1.2, 0.08, 0.08, 0, 1, 6),
    ] },
    { flat: true, segs: 8, sections: [oval(3.2, 0.1, 0.02, 0.05, 0.3, 1, 2), oval(4.4, 0.5, 0.42, 0.05, 0.35, 1, 2), oval(6.4, 0.6, 0.5, 0.05, 0.4, 1, 2), oval(7.4, 0.3, 0.1, 0.05, 0.45, 1, 2)], finish: 'glass' },
    { z: 1.85, mirror: true, flat: true, segs: 8, sections: [oval(8.6, 0.42, 0.22, 0.05, 0.42, 1, 2), oval(10.6, 0.42, 0.22, 0.05, 0.4, 1, 2)], openFront: true }, // intake grilles
  ],
  surfaces: [
    { kind: 'wing', flat: true, chordPts: 5, stations: wingPanel([7.0, -0.05, 7.0 * LE], 9.0, [15.9, -0.05, 6.6], 1.7, 0.06, 0.03, 2) },
    { kind: 'fin', flat: true, chordPts: 5, stations: wingPanel([15.0, 0.55, 0.9], 3.3, [17.9, 2.55, 3.3], 1.6, 0.05, 0.04, 2) }, // V-tail
  ],
  nozzles: [{ at: [20.05, 0.0, 0.62], r: 0.5, len: 0.6, mirror: true, flat: { w: 0.85, h: 0.07 } }],
  gear: { nose: { x: 4.6, y: -0.2, len: 1.3, r: 0.3 }, main: { x: 11.5, y: -0.22, z: 2.0, len: 1.24, r: 0.38 } },
  hardpoints: [{ at: [10.8, -0.3, 0.85], kind: 'belly' }],
  cockpit: [5.2, 0.7, 0],
  flame: 'flat',
  loads: { 1: { belly: 'aim120' }, 2: { belly: 'gbu' }, 3: { belly: 'gbu' } },
  livery: {
    factory: { base: '#1b1c1f', under: '#1b1c1f', finish: 'matte', insignia: 'lowvis' },
    camo: { base: '#c2a277', under: '#c2a277', finish: 'matte', insignia: 'none', marks: [{ kind: 'splinter', colors: ['#5f6a43', '#7a5a3b'], seed: 117 }] }, // "Have Blue" desert splinter
    squadron: { base: '#6d7378', under: '#6d7378', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'splinter', colors: ['#4f555a'], seed: 3 }] }, // grey test scheme
    airshow: { base: '#1b1c1f', under: '#1d3f8f', finish: 'gloss', insignia: 'star', marks: [ // retirement: stars and stripes underneath
      { kind: 'fins', color: '#c8202f', from: 0.55 }, { kind: 'stripe', y: 0.1, h: 0.08, color: '#f2f2f2', x0: 0.1, x1: 0.95 },
    ] },
  },
};
