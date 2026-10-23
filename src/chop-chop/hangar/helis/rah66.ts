// Boeing-Sikorsky RAH-66 Comanche. Fuselage 14.28 m, 2.04 m wide, main rotor 12.19 m (five blades), 3.37 m tall, a faceted
// stealth body (flat shading, diamond-ish sections), a fenestron fan in the tail instead of an open tail rotor, retractable
// wheels, a gun that tucks under the nose, and small stub wings for extra weapons (the main ones ride in belly bays).
// Research: .scratch/chop-chop/research/helis/rah66-comanche.md
import type { HeliSpec } from '../three/spec';
import { bubble, circle, finPanel, oval, wingPanel } from './parts';

export const rah66: HeliSpec = {
  id: 'rah66', length: 14.28, rotorDiameter: 12.19, height: 3.37,
  bodies: [
    { sections: [ // pointed wedge nose, broad flat-sided body and a slim boom, all angled planes
      oval(0, 0.1, 0.1, 0.1, 1.4, 1.15, 1.15), oval(1.2, 0.45, 0.35, 0.35, 1.4, 1.15, 1.15), oval(2.8, 0.7, 0.55, 0.5, 1.55, 1.15, 1.15), oval(4.5, 0.9, 0.75, 0.55, 1.7, 1.15, 1.15),
      oval(6.5, 1.0, 0.75, 0.6, 1.75, 1.15, 1.15), oval(8.5, 0.85, 0.6, 0.55, 1.9, 1.15, 1.15), oval(10.5, 0.5, 0.45, 0.4, 2.1, 1.15, 1.15), oval(12.5, 0.22, 0.25, 0.22, 2.3, 1.6, 1.6),
      oval(13.4, 0.18, 0.2, 0.18, 2.4, 1.6, 1.6),
    ], flat: true },
    { sections: bubble(1.5, 3.2, 1.95, 0.3, 0.3, 0.45), finish: 'glass', flat: true }, // the front cockpit's angled canopy
    { sections: bubble(3.3, 5.1, 2.35, 0.36, 0.4, 0.4), finish: 'glass', flat: true }, // the raised rear cockpit
    { sections: [oval(5.6, 0.2, 0.1, 0.1, 2.45, 1.6), oval(6.4, 0.55, 0.2, 0.1, 2.5, 1.6), oval(8.6, 0.55, 0.2, 0.1, 2.35, 1.6), oval(10.0, 0.25, 0.1, 0.1, 2.3, 1.6)], flat: true }, // the engine deck
    { sections: [oval(6.3, 0.15, 0.2, 0.2, 2.75, 1.6), oval(6.9, 0.35, 0.28, 0.2, 2.78, 1.6), oval(7.7, 0.3, 0.26, 0.2, 2.78, 1.6), oval(8.2, 0.12, 0.2, 0.2, 2.75, 1.6)], flat: true }, // the rotor head fairing
    { sections: [oval(1.2, 0.1, 0.1, 0.1, 1.0), oval(1.7, 0.2, 0.15, 0.15, 0.97), oval(2.6, 0.2, 0.15, 0.15, 1.02), oval(2.9, 0.1, 0.08, 0.08, 1.08)] }, // the gun's turret fairing
    { sections: [circle(0.9, 0.035, 0.9), circle(1.8, 0.04, 0.9)] }, // the short cannon
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([5.2, 1.8, 0.9], 1.0, [5.6, 1.82, 2.3], 0.65, 0.08, 0.06, 2) }, // optional stub wings
    { kind: 'tail', stations: wingPanel([11.7, 2.3, 0.15], 0.8, [11.9, 2.3, 1.3], 0.6, 0.07, 0.06, 2) }, // the tailplane
    { kind: 'fin', mirror: false, stations: finPanel([11.3, 2.35, 0], 1.7, [12.3, 3.3, 0], 0.9, 0.12) }, // the fin, with the fan in its trailing end
  ],
  rotors: [
    { kind: 'main', at: [7.0, 3.0, 0], r: 6.095, blades: 5, chord: 0.4, axis: 'y', dir: 1, mast: 0.3 },
    { kind: 'tail', at: [13.3, 2.85, 0], r: 0.55, blades: 8, chord: 0.12, axis: 'z', dir: 1, duct: 0.08 },
  ],
  gear: { main: { x: 6.0, y: 0.85, z: 0.9, len: 0.65, r: 0.25 }, tail: { x: 11.0, y: 1.85, len: 1.5, r: 0.15 } },
  hardpoints: [
    { at: [5.5, 1.78, 2.3], kind: 'tip', mirror: true }, { at: [5.4, 1.72, 1.8], kind: 'outer', mirror: true },
    { at: [5.3, 1.72, 1.3], kind: 'inner', mirror: true }, { at: [5.5, 1.0, 0], kind: 'belly' },
  ],
  cockpit: [4.2, 2.65, 0],
  seats: [[2.3, 2.25, 0], [4.2, 2.65, 0]],
  gun: [0.9, 0.9, 0], // the cannon's muzzle
  livery: {
    factory: { base: '#5e6046', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.1, color: '#2c3033' }] }, // olive drab
    camo: { base: '#7a8058', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'splinter', colors: ['#5a5f3f', '#4a4f52'], seed: 94 }] }, // prototype light olive, angular
    squadron: { base: '#4a4f52', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'stripe', y: 0.1, h: 0.1, color: '#2c3033', x0: 0.05, x1: 0.6 }] }, // dark stealth grey
    airshow: { base: '#7a8058', finish: 'gloss', insignia: 'star', marks: [{ kind: 'stripe', y: 0.05, h: 0.14, color: '#d4a62a', x0: 0.05, x1: 0.95 }, { kind: 'fins', color: '#d4a62a', from: 0.4 }, { kind: 'nose', x1: 0.07, color: '#d4a62a' }] }, // prototype olive with a gold "Prototype" trim
  },
};
