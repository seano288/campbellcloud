// MD Helicopters MH-6 / AH-6 Little Bird. Body about 7.4 m, five-blade 8.35 m rotor, height 3.0 m, skids 1.98 m apart, an egg
// of a cabin under a big glass bubble, a thin boom with a small T-tail and a tiny tail rotor on the left, and the outside
// bench planks that carry people or weapons. Research: .scratch/chop-chop/research/helis/mh6-little-bird.md
import type { HeliSpec } from '../three/spec';
import { finPanel, oval, wingPanel } from './parts';

export const mh6: HeliSpec = {
  id: 'mh6', length: 7.4, rotorDiameter: 8.35, height: 3.02,
  bodies: [
    { sections: [ // the egg-shaped cabin, then the thin tail boom
      oval(0, 0.2, 0.4, 0.4, 1.2, 1.5), oval(0.5, 0.58, 0.65, 0.6, 1.4, 2, 2), oval(1.4, 0.7, 0.78, 0.7, 1.45, 2.1, 2.1), oval(2.6, 0.68, 0.75, 0.68, 1.47, 2.2, 2.2),
      oval(3.6, 0.5, 0.6, 0.5, 1.55, 2.2, 2.2), oval(4.5, 0.22, 0.28, 0.22, 1.85), oval(5.8, 0.15, 0.2, 0.18, 2.05), oval(7.0, 0.1, 0.15, 0.15, 2.18), oval(7.4, 0.07, 0.1, 0.1, 2.22),
    ] },
    { sections: [
      oval(0.25, 0.4, 0.3, 0.3, 1.5, 2), oval(0.7, 0.6, 0.5, 0.5, 1.7, 2.2), oval(1.4, 0.71, 0.5, 0.5, 1.75, 2.2), oval(2.2, 0.69, 0.45, 0.5, 1.75, 2.2), oval(2.7, 0.62, 0.3, 0.4, 1.8, 2.2),
    ], finish: 'glass' },
    { sections: [oval(2.0, 0.15, 0.1, 0.1, 2.2), oval(2.8, 0.38, 0.22, 0.1, 2.28, 2.4), oval(4.2, 0.28, 0.16, 0.1, 2.25), oval(4.9, 0.12, 0.08, 0.08, 2.2)] }, // the engine cowling on the roof
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([1.9, 1.15, 0.6], 1.2, [2.0, 1.12, 1.5], 1.0, 0.07, 0.06, 2) }, // the outside bench planks (and weapons pylons)
    { kind: 'fin', mirror: false, stations: finPanel([6.3, 2.1, 0], 0.9, [7.0, 3.0, 0], 0.45, 0.1) }, // the vertical fin
    { kind: 'tail', stations: wingPanel([6.8, 3.0, 0.0], 0.5, [6.9, 3.0, 1.03], 0.38, 0.08, 0.06, 2) }, // the T-tail's stabiliser
  ],
  rotors: [
    { kind: 'main', at: [2.4, 2.85, 0], r: 4.175, blades: 5, chord: 0.22, axis: 'y', dir: 1, mast: 0.55 },
    { kind: 'tail', at: [7.1, 2.25, -0.2], r: 0.7, blades: 2, chord: 0.12, axis: 'z', dir: 1 },
  ],
  skids: { x0: 0.8, x1: 3.9, z: 0.99, r: 0.04, struts: [{ x: 1.4, y: 0.95, z: 0.5 }, { x: 3.2, y: 0.95, z: 0.5 }] },
  hardpoints: [{ at: [2.3, 1.1, 1.15], kind: 'inner' }, { at: [2.3, 1.1, 1.45], kind: 'outer' }],
  cockpit: [1.2, 1.85, 0.3],
  seats: [[1.2, 1.85, 0.3], [1.2, 1.85, -0.3]],
  gun: [1.4, 1.3, 1.5], // the gun pod on the plank
  livery: {
    factory: { base: '#5e6464', under: '#3a3f3f', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'stripe', y: 0.05, h: 0.1, color: '#a38d5e', x0: 0.25, x1: 0.85 }] }, // Night Stalker dark grey
    camo: { base: '#5a5c3a', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#3e3323', '#a38d5e'], scale: 0.9, seed: 6 }] },
    squadron: { base: '#c6b07a', under: '#a38d5e', finish: 'matte', insignia: 'star', marks: [{ kind: 'stripe', y: 0.1, h: 0.14, color: '#3e3323', x0: 0.1, x1: 0.8 }] }, // desert export colours
    airshow: { base: '#f4f4f2', finish: 'gloss', insignia: 'none', marks: [{ kind: 'stripe', y: 0.05, h: 0.22, color: '#1f4e8c', x0: 0.05, x1: 0.8 }, { kind: 'fins', color: '#1e1e1e', from: 0.1 }, { kind: 'nose', x1: 0.06, color: '#1f4e8c' }] }, // Boeing demonstrator
  },
};
