// Blue Thunder (1983 film): an Aérospatiale SA 341G Gazelle dressed up with a bulky armoured angular nose, a chin cannon
// and cheek lights. Gazelle: fuselage 9.53 m, 3-blade 10.5 m main rotor turning clockwise, height 3.15 m, a 13-blade
// 0.695 m fenestron in the fin, skids. Research: .scratch/chop-chop/research/helis/blue-thunder.md
import type { HeliSpec } from '../three/spec';
import { circle, finPanel, oval, wingPanel } from './parts';

export const blue: HeliSpec = {
  id: 'blue', length: 9.53, rotorDiameter: 10.5, height: 3.15,
  bodies: [
    { sections: [ // blocky armoured nose and cabin (squared-off sections), tapering to the tail cone
      oval(0, 0.3, 0.2, 0.2, 0.98, 3, 3), oval(0.45, 0.68, 0.44, 0.4, 1.08, 4.5, 4.5), oval(1.3, 0.8, 0.6, 0.5, 1.24, 4.5, 4.5), oval(2.6, 0.82, 0.62, 0.5, 1.3, 4, 4),
      oval(4.4, 0.74, 0.58, 0.5, 1.34, 3.4, 3.4), oval(5.6, 0.5, 0.46, 0.4, 1.5, 2.6), oval(7.2, 0.28, 0.32, 0.26, 1.72), oval(8.4, 0.16, 0.26, 0.14, 1.92), oval(9.1, 0.12, 0.2, 0.1, 2.05),
    ] },
    { sections: [ // the angular canopy, flat-sided
      oval(0.55, 0.36, 0.16, 0.05, 1.42, 4, 4), oval(1.2, 0.7, 0.4, 0.05, 1.6, 4, 4), oval(2.4, 0.74, 0.42, 0.05, 1.75, 4, 4), oval(3.3, 0.6, 0.3, 0.05, 1.86, 4, 4),
    ], finish: 'glass' },
    { sections: [ // engine deck
      oval(3.0, 0.1, 0.05, 0.1, 2.0), oval(3.7, 0.5, 0.34, 0.1, 2.02, 3), oval(5.6, 0.45, 0.28, 0.1, 2.02, 3), oval(6.6, 0.18, 0.1, 0.1, 1.95),
    ] },
    { sections: [circle(3.2, 0.12, 2.35), circle(3.6, 0.28, 2.38), circle(4.1, 0.26, 2.38), circle(4.4, 0.1, 2.35)] }, // rotor head fairing
    { sections: [oval(0.4, 0.2, 0.15, 0.15, 0.62, 2.5), oval(0.9, 0.32, 0.22, 0.2, 0.6, 3), oval(1.5, 0.26, 0.18, 0.16, 0.6, 3)], finish: 'dark' }, // chin turret
    { sections: [circle(1.4, 0.09, 0.5), circle(2.3, 0.09, 0.5), circle(2.32, 0.02, 0.5)], z: 0.1, mirror: true, finish: 'dark' }, // cannon barrels (twin cluster)
    { sections: [circle(1.4, 0.09, 0.46), circle(2.3, 0.09, 0.46)], finish: 'dark' },
    { z: 0.75, mirror: true, sections: [circle(1.0, 0.1, 0.95), circle(1.25, 0.2, 0.95), circle(1.7, 0.2, 0.95), circle(1.75, 0.04, 0.95)] }, // cheek spotlights
    { z: 1.35, mirror: true, sections: [circle(2.4, 0.08, 1.05), circle(2.7, 0.2, 1.05), circle(4.1, 0.2, 1.05), circle(4.5, 0.08, 1.05)] }, // side pods
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([2.6, 1.1, 0.7], 1.0, [2.8, 1.05, 1.35], 0.8, 0.1, 0.1, 1) }, // short pylons for the pods
    { kind: 'tail', stations: wingPanel([7.8, 1.95, 0.15], 0.7, [8.2, 2.0, 1.1], 0.5, 0.08, 0.08, 2) },
    { kind: 'fin', mirror: false, stations: finPanel([7.9, 1.85, 0], 1.7, [8.9, 3.0, 0], 0.9, 0.05) }, // the fin with the fenestron in it
  ],
  rotors: [
    { kind: 'main', at: [3.8, 2.95, 0], r: 5.25, blades: 3, chord: 0.34, axis: 'y', dir: -1, tilt: [-0.04, 0], mast: 0.55 },
    { kind: 'tail', at: [8.95, 2.4, 0.07], r: 0.4, blades: 8, chord: 0.12, axis: 'z', dir: 1, duct: 0.14 },
  ],
  skids: { x0: 0.8, x1: 4.4, z: 1.05, r: 0.05, struts: [{ x: 1.5, y: 0.8, z: 0.7 }, { x: 3.6, y: 0.85, z: 0.7 }] },
  hardpoints: [
    { at: [3.2, 0.95, 1.4], kind: 'outer', mirror: true }, { at: [3.0, 1.0, 0.9], kind: 'inner', mirror: true }, { at: [2.0, 0.55, 0], kind: 'belly' },
  ],
  cockpit: [1.6, 1.6, 0.4],
  seats: [[1.6, 1.6, 0.4], [1.6, 1.6, -0.4]],
  gun: [2.35, 0.55, 0], // the chin cannon's muzzle
  livery: {
    factory: { base: '#18191c', finish: 'satin', insignia: 'none', marks: [{ kind: 'fins', color: '#5b6068', from: 0.3 }] }, // film black, tail a shade lighter so the fan shows
    camo: { base: '#2e3a2c', finish: 'matte', insignia: 'none', marks: [{ kind: 'splinter', colors: ['#171d16', '#4a5545'], seed: 9 }] },
    squadron: { base: '#111215', finish: 'satin', insignia: 'none', marks: [{ kind: 'stripe', y: 1.0, h: 0.2, color: '#f2f2f2', x0: 0.1, x1: 0.8 }, { kind: 'fins', color: '#b22222', from: 0.2 }] }, // red tail stripe
    airshow: { base: '#0e1a33', under: '#141414', finish: 'gloss', insignia: 'none', marks: [{ kind: 'rays', colors: ['#f2c230', '#e4572e'], n: 7 }, { kind: 'nose', x1: 0.06, color: '#f2c230' }] }, // dark blue over black
  },
};
