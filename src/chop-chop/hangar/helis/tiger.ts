// Eurocopter Tiger (UHT). Fuselage 13.85 m, main rotor 13.0 m (four blades), 3.84 m to the rotor head with the Osiris
// mast-mounted sight above it, a slim angular tandem body, two engine housings, stub wings (two stations a side) and a
// tail with a fin and a tailplane whose tips carry upright endplates. Wheels: two mains and a tailwheel. A chin cannon.
// Research: .scratch/chop-chop/research/helis/tiger.md
import type { HeliSpec } from '../three/spec';
import { bubble, circle, finPanel, oval, wingPanel } from './parts';

export const tiger: HeliSpec = {
  id: 'tiger', length: 13.85, rotorDiameter: 13.0, height: 3.84,
  bodies: [
    { sections: [ // pointed nose, tandem cockpit, engine bay and the single slim tail boom
      oval(0, 0.12, 0.12, 0.12, 1.5, 2.4), oval(0.9, 0.38, 0.4, 0.38, 1.5, 2.6), oval(2.0, 0.5, 0.62, 0.5, 1.65, 2.8, 2.8), oval(3.4, 0.55, 0.8, 0.55, 1.85, 3, 3),
      oval(5.0, 0.6, 0.75, 0.6, 2.0, 3.2, 3.2), oval(6.5, 0.55, 0.6, 0.6, 2.05, 3, 3), oval(8.5, 0.4, 0.45, 0.4, 2.1), oval(10.0, 0.25, 0.28, 0.25, 2.2),
      oval(12.4, 0.18, 0.2, 0.18, 2.3), oval(13.85, 0.1, 0.12, 0.1, 2.4),
    ], flat: true },
    { sections: bubble(1.0, 2.7, 1.8, 0.34, 0.38, 0.4), finish: 'glass' }, // the gunner's canopy, low in front
    { sections: bubble(2.8, 4.7, 2.4, 0.38, 0.5, 0.4), finish: 'glass' }, // the pilot's canopy, raised behind
    { z: 0.5, mirror: true, sections: [circle(4.4, 0.12, 2.6), circle(5.0, 0.36, 2.65), circle(8.4, 0.36, 2.65), circle(9.6, 0.15, 2.6)] }, // the two engine housings
    { sections: [circle(4.4, 0.18, 3.1), circle(4.9, 0.38, 3.25), circle(5.6, 0.36, 3.3), circle(6.0, 0.16, 3.3)] }, // the rotor head fairing
    { sections: [circle(4.75, 0.08, 3.85), circle(5.0, 0.3, 4.2), circle(5.3, 0.22, 4.25)] }, // the mast-mounted sight
    { sections: [oval(1.3, 0.1, 0.12, 0.12, 0.88), oval(1.8, 0.24, 0.2, 0.2, 0.85), oval(2.6, 0.24, 0.2, 0.2, 0.9), oval(2.9, 0.12, 0.1, 0.1, 0.95)] }, // the chin turret
    { sections: [circle(0.5, 0.04, 0.8), circle(1.9, 0.05, 0.8)] }, // the 30 mm cannon
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([4.5, 1.7, 0.6], 1.1, [4.8, 1.75, 2.26], 0.8, 0.1, 0.08, 2) }, // the stub wings
    { kind: 'tail', stations: wingPanel([12.3, 2.35, 0.15], 0.85, [12.5, 2.35, 1.1], 0.7, 0.08, 0.07, 2) }, // the tailplane
    { kind: 'fin', mirror: true, stations: finPanel([12.45, 1.75, 1.1], 0.8, [12.85, 3.0, 1.1], 0.5, 0.08) }, // the endplates on its tips
    { kind: 'fin', mirror: false, stations: finPanel([11.7, 2.4, 0], 2.1, [12.9, 3.8, 0], 1.0, 0.14) }, // the tall fin
  ],
  rotors: [
    { kind: 'main', at: [5.0, 3.7, 0], r: 6.5, blades: 4, chord: 0.5, axis: 'y', dir: 1, mast: 0.45 },
    { kind: 'tail', at: [13.0, 3.1, 0.27], r: 1.2, blades: 4, chord: 0.18, axis: 'z', dir: 1 },
  ],
  gear: { main: { x: 4.6, y: 0.9, z: 0.95, len: 0.7, r: 0.28 }, tail: { x: 11.0, y: 2.0, len: 1.75, r: 0.16 } },
  hardpoints: [
    { at: [4.8, 1.72, 2.26], kind: 'tip', mirror: true }, { at: [4.7, 1.62, 1.7], kind: 'outer', mirror: true },
    { at: [4.6, 1.62, 1.0], kind: 'inner', mirror: true }, { at: [3.2, 0.75, 0], kind: 'belly' },
  ],
  cockpit: [3.8, 2.8, 0],
  seats: [[1.9, 2.2, 0], [3.8, 2.8, 0]],
  gun: [0.5, 0.8, 0], // the chin cannon's muzzle
  livery: {
    factory: { base: '#6b6b3a', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#c2a878', '#5a4632'], scale: 1.1, seed: 12 }] }, // French ALAT sand, olive and brown
    camo: { base: '#4a5a3a', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#b39b6e', '#1e1e1e'], scale: 1.0, seed: 33 }] }, // German green-tan
    squadron: { base: '#5f6b3f', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#354430', '#b9a77a'], scale: 1.0, seed: 5 }] }, // Spanish Army green
    airshow: { base: '#c2a878', finish: 'satin', insignia: 'none', marks: [{ kind: 'camo', colors: ['#e5731f', '#1e1e1e'], scale: 0.7, seed: 99 }, { kind: 'nose', x1: 0.08, color: '#e5731f' }] }, // Tiger Meet orange and black
  },
};
