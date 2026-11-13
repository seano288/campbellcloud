// Lockheed F-117 Nighthawk. Length 20.09 m, span 13.21 m, height 3.78 m. All flat facets: the leading edge runs at 67.5°
// straight from the nose to each wingtip, the body is a tall pyramid on a flat belly with the faceted canopy at its peak,
// the trailing edge is a W (swept forward on the wings, back to a point on the exhaust deck), the V-tail ruddervators
// lean out from the deck, and the engines breathe through grilles beside the cockpit and exhaust through flat slots.
// Research: .scratch/airplane-clock/research/jets/f117-nighthawk.md
import type { JetSpec } from '../three/spec';
import { joined, oval, wingPanel } from './parts';

const LE = Math.tan((22.5 * Math.PI) / 180); // the leading edge: half-width = x · tan(22.5°)
// a faceted section: straight-ish sides up to the ridge (n 1.4), a flat belly (nb 6); centre on the wing plane
const facet = (x: number, w: number, top: number, bot = 0.25) => oval(x, w, top, bot, 0, 1.4, 6);

export const f117: JetSpec = {
  id: 'f117', length: 20.09, span: 13.21, height: 3.78,
  bodies: [
    { flat: true, segs: 12, sections: [ // the pyramid: its edge is the leading edge as far as the wing root, then the deck tapers to the W's centre point
      oval(0, 0.01, 0.01, 0.01, 0), facet(1.5, 1.5 * LE, 0.3), facet(3.2, 3.2 * LE, 0.85), facet(4.6, 1.9, 0.85), facet(5.9, 2.45, 1.0),
      facet(7.0, 2.68, 1.25), facet(8.0, 2.75, 1.38), facet(12.0, 2.75, 1.05), facet(14.7, 2.5, 0.62, 0.22), facet(16.0, 1.25, 0.36, 0.18), oval(17.3, 0.05, 0.08, 0.06, 0.04, 1.4, 6),
    ] },
    { flat: true, segs: 8, sections: [ // the faceted canopy hood: a steep windscreen up to the peak, then down onto the spine
      oval(3.1, 0.05, 0.02, 0.05, 0.82, 1), oval(3.5, 0.6, 0.35, 0.1, 0.72, 1), oval(4.6, 0.86, 1.02, 0.1, 0.7, 1), oval(5.9, 0.9, 0.85, 0.1, 0.85, 1),
      oval(7.0, 0.7, 0.42, 0.1, 1.1, 1), oval(7.6, 0.3, 0.12, 0.1, 1.25, 1),
    ] },
    { flat: true, segs: 8, finish: 'glass', sections: [ // its windows: the windscreen and the front side panes, the hood's frame behind them
      oval(3.08, 0.07, 0.04, 0.05, 0.82, 1), oval(3.5, 0.63, 0.38, 0.1, 0.72, 1), oval(4.6, 0.89, 1.05, 0.1, 0.7, 1), oval(5.3, 0.91, 0.99, 0.1, 0.77, 1),
    ] },
  ],
  surfaces: [
    { kind: 'wing', flat: true, chordPts: 5, stations: joined( // the trailing edge sweeps forward from the clipped tip to the deck
      wingPanel([2.4 / LE, -0.1, 2.4], 7.9, [5.95 / LE, -0.1, 5.95], 3.13, 0.05, 0.03, 2),
      wingPanel([5.95 / LE, -0.1, 5.95], 3.13, [6.6 / LE, -0.1, 6.6], 0.3, 0.03, 0.03, 1),
    ) },
    { kind: 'fin', flat: true, chordPts: 5, stations: wingPanel([14.6, 0.45, 0.35], 3.0, [18.6, 2.6, 1.75], 1.5, 0.05, 0.04, 2) }, // V-tail
    // the intake grilles, flat on the pyramid's sides beside the cockpit
    { kind: 'other', finish: 'black', flat: true, chordPts: 3, stations: [{ le: [5.8, 0.47, 1.95], chord: 0.7, t: 0.05 }, { le: [5.6, 0.75, 1.2], chord: 0.7, t: 0.05 }] },
  ],
  nozzles: [{ at: [16.35, 0.06, 0.92], r: 0.4, len: 0.6, mirror: true, flat: { w: 0.55, h: 0.06 } }], // slots along the deck's trailing edge
  gear: { nose: { x: 4.6, y: -0.22, len: 0.66, r: 0.3 }, main: { x: 11.5, y: -0.24, z: 2.0, len: 0.56, r: 0.38 } },
  hardpoints: [{ at: [10.8, -0.3, 0.85], kind: 'belly' }],
  cockpit: [5.1, 1.12, 0],
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
