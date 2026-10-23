// Sikorsky Raider X (S-102): X2 technology. Two rigid 12 m coaxial rotors turning opposite ways on one mast, a pusher
// propeller at the very tail, side-by-side two-seat cockpit, no tail rotor. Length ~13 m (est.: 20% bigger than the 11 m
// S-97). Research: .scratch/chop-chop/research/helis/raider-x.md
import type { HeliSpec } from '../three/spec';
import { circle, finPanel, oval, wingPanel } from './parts';

export const raider: HeliSpec = {
  id: 'raider', length: 12.8, rotorDiameter: 12, height: 4.3,
  bodies: [
    { sections: [ // sharp nose, wide side-by-side cockpit and weapons bay, tapering to a slim tail
      oval(0, 0.1, 0.1, 0.1, 1.15, 2), oval(0.9, 0.56, 0.42, 0.4, 1.35, 2.4, 2.4), oval(2.0, 0.88, 0.68, 0.6, 1.5, 2.8, 2.8), oval(4.0, 0.95, 0.75, 0.62, 1.58, 3, 3),
      oval(6.5, 0.85, 0.68, 0.58, 1.62, 3, 3), oval(8.0, 0.55, 0.5, 0.42, 1.75), oval(10.0, 0.32, 0.3, 0.28, 1.95), oval(11.8, 0.2, 0.22, 0.2, 2.2), oval(12.4, 0.12, 0.14, 0.12, 2.3),
    ] },
    { sections: [ // the wide canopy
      oval(0.7, 0.34, 0.2, 0.05, 1.5, 2.2), oval(1.4, 0.72, 0.42, 0.05, 1.78, 2.4), oval(2.4, 0.84, 0.46, 0.05, 1.98, 2.6), oval(3.2, 0.7, 0.3, 0.05, 2.1, 3),
    ], finish: 'glass' },
    { sections: [ // engine and gearbox hump
      oval(3.2, 0.1, 0.05, 0.1, 2.25), oval(4.0, 0.6, 0.45, 0.1, 2.3, 2.6), oval(6.8, 0.55, 0.38, 0.1, 2.28, 2.6), oval(8.6, 0.18, 0.1, 0.1, 2.15),
    ] },
    { sections: [circle(3.8, 0.12, 2.7), circle(4.2, 0.28, 2.75), circle(4.6, 0.28, 2.75), circle(5.0, 0.12, 2.75)] }, // rotor head fairing
    { sections: [oval(0.7, 0.1, 0.1, 0.1, 0.95), oval(1.0, 0.18, 0.14, 0.12, 0.95), oval(1.5, 0.1, 0.08, 0.08, 0.95)], finish: 'dark' }, // chin sensor
    { z: 0.95, mirror: true, sections: [circle(3.2, 0.1, 1.2), circle(3.8, 0.3, 1.2), circle(6.2, 0.3, 1.2), circle(6.8, 0.1, 1.2)] }, // weapon bays
    { sections: [circle(12.3, 0.1, 2.35), circle(12.7, 0.17, 2.35), circle(13.1, 0.1, 2.35)] }, // propeller hub
  ],
  surfaces: [
    { kind: 'tail', stations: wingPanel([10.4, 2.05, 0.15], 0.95, [10.8, 2.1, 1.5], 0.6, 0.08, 0.07, 2) }, // tailplane
    { kind: 'fin', stations: finPanel([10.6, 2.1, 1.5], 1.0, [11.1, 3.15, 1.5], 0.6, 0.08) }, // end fins
    { kind: 'fin', mirror: false, stations: finPanel([10.6, 2.0, 0], 1.0, [11.2, 2.75, 0], 0.6, 0.1) }, // centre fin
  ],
  rotors: [
    { kind: 'main', at: [4.4, 3.95, 0], r: 6, blades: 4, chord: 0.42, axis: 'y', dir: -1, mast: 0.5 }, // upper rotor
    { kind: 'main', at: [4.4, 3.3, 0], r: 6, blades: 4, chord: 0.42, axis: 'y', dir: 1, mast: 0.6 }, // lower rotor, the opposite way
    { kind: 'pusher', at: [12.7, 2.35, 0], r: 1.05, blades: 6, chord: 0.2, axis: 'x', dir: 1 },
  ],
  gear: { nose: { x: 1.8, y: 1.0, len: 0.72, r: 0.28 }, main: { x: 5.4, y: 1.3, z: 1.0, len: 1.0, r: 0.3 } },
  hardpoints: [
    { at: [4.6, 1.0, 1.25], kind: 'inner', mirror: true }, { at: [5.4, 1.05, 1.25], kind: 'outer', mirror: true }, { at: [4.5, 0.85, 0], kind: 'belly' },
  ],
  cockpit: [1.85, 2.0, 0.42],
  seats: [[1.85, 2.0, 0.42], [1.85, 2.0, -0.42]],
  gun: [1.5, 0.95, 0], // the chin gun
  livery: {
    factory: { base: '#5e6670', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.12 }] },
    camo: { base: '#4b5a3a', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#2d3623', '#b9a27a'], scale: 1.1, seed: 31 }] },
    squadron: { base: '#b9a27a', under: '#a28d68', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'stripe', y: 1.5, h: 0.12, color: '#3a3a35', x0: 0.1, x1: 0.8 }] },
    airshow: { base: '#f2f2f2', finish: 'gloss', insignia: 'none', marks: [{ kind: 'nose', x1: 0.08, color: '#c0392b' }, { kind: 'stripe', y: 1.45, h: 0.16, color: '#c0392b', x0: 0.1, x1: 0.85 }, { kind: 'fins', color: '#c0392b', from: 0.3 }] },
  },
};
