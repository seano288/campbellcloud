// Sikorsky CH-53E Super Stallion. Fuselage 22.35 m, seven-blade main rotor 24.08 m, three engines, a big boxy cabin with side
// sponsons, a refuelling probe on the nose, a six-metre tail rotor canted 20 degrees on a tall pylon with a gull-wing
// stabiliser on one side, and tricycle gear. Research: .scratch/chop-chop/research/helis/ch53e-super-stallion.md
import type { HeliSpec } from '../three/spec';
import { bubble, circle, finPanel, joined, oval, wingPanel } from './parts';

export const ch53: HeliSpec = {
  id: 'ch53', length: 22.35, rotorDiameter: 24.08, height: 8.46,
  bodies: [
    { sections: [ // pointed nose, the long boxy cabin, the ramp rising into the tail pylon
      oval(0, 0.35, 0.35, 0.45, 1.9, 1.8), oval(1.0, 0.85, 0.85, 0.75, 2.2, 2.2), oval(2.5, 1.2, 1.05, 0.95, 2.45, 2.6), oval(4.0, 1.35, 1.35, 1.2, 2.5, 3, 3.4),
      oval(14.0, 1.35, 1.4, 1.2, 2.5, 3.2, 3.6), oval(16.5, 1.25, 1.25, 1.0, 2.9, 3, 3.2), oval(19.0, 0.9, 0.95, 0.8, 3.5, 2.6), oval(21.0, 0.55, 0.8, 0.6, 4.1), oval(22.35, 0.25, 0.6, 0.4, 4.4),
    ] },
    { sections: bubble(1.0, 4.2, 3.0, 1.0, 0.8, 0.45), finish: 'glass' }, // the cockpit windscreen
    { z: 0.75, mirror: true, sections: [circle(6.0, 0.15, 4.45), circle(7.0, 0.5, 4.5), circle(12.0, 0.5, 4.55), circle(13.2, 0.25, 4.5)] }, // two engines
    { sections: [circle(7.5, 0.15, 4.6), circle(8.5, 0.5, 4.75), circle(12.6, 0.5, 4.8), circle(13.8, 0.2, 4.7)] }, // the third engine on the centre line
    { sections: [oval(8.5, 0.4, 0.15, 0.1, 5.1), oval(9.8, 0.8, 0.55, 0.1, 5.15, 2.4), oval(12.0, 0.8, 0.55, 0.1, 5.15, 2.4), oval(13.2, 0.3, 0.15, 0.1, 5.1)] }, // the rotor head fairing
    { z: 1.5, mirror: true, sections: [oval(4.6, 0.1, 0.1, 0.1, 1.45), oval(5.6, 0.5, 0.5, 0.45, 1.45, 2.4), oval(11.0, 0.5, 0.5, 0.45, 1.45, 2.4), oval(12.4, 0.1, 0.1, 0.1, 1.45)] }, // the side sponsons
    { z: 0.6, finish: 'metal', sections: [circle(-2.0, 0.04, 2.95), circle(-1.7, 0.06, 2.95), circle(-0.2, 0.07, 2.95), circle(0.6, 0.15, 2.9)] }, // the refuelling probe
  ],
  surfaces: [
    { kind: 'tail', mirror: false, stations: joined(wingPanel([20.3, 5.35, 0.2], 1.2, [20.6, 5.35, 1.4], 1.0, 0.1, 0.1, 1), wingPanel([20.6, 5.35, 1.4], 1.0, [21.0, 5.78, 2.5], 0.8, 0.1, 0.08, 1)) }, // the gull-wing stabiliser, right only
    { kind: 'fin', mirror: false, stations: finPanel([18.2, 3.9, 0], 3.6, [21.6, 6.9, 0], 1.3, 0.3) }, // the tall tail pylon
  ],
  rotors: [
    { kind: 'main', at: [10.6, 5.8, 0], r: 12.04, blades: 7, chord: 0.68, axis: 'y', dir: 1, mast: 0.7 },
    { kind: 'tail', at: [21.6, 6.0, -0.45], r: 3.05, blades: 4, chord: 0.4, axis: 'z', dir: 1, tilt: [0, -0.35] }, // on the left, canted 20 degrees
  ],
  gear: { nose: { x: 3.4, y: 1.4, len: 1.05, r: 0.35, twin: true }, main: { x: 8.4, y: 1.45, z: 1.5, len: 0.95, r: 0.5, twin: true } },
  hardpoints: [
    { at: [6.5, 0.95, 1.9], kind: 'inner', mirror: true }, { at: [10.5, 0.95, 1.9], kind: 'outer', mirror: true },
    { at: [5.2, 1.5, 1.9], kind: 'tip', mirror: true }, { at: [10.6, 1.2, 0], kind: 'belly' },
  ],
  cockpit: [2.5, 2.95, 0.5],
  seats: [[2.5, 2.95, 0.5], [2.5, 2.95, -0.5]],
  gun: [5.0, 2.9, 1.4], // the side window machine gun
  livery: {
    factory: { base: '#5f6452', under: '#4a4d47', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.1 }, { kind: 'camo', colors: ['#2e3024', '#8a8f7c'], scale: 1.4, seed: 53 }] }, // USMC tactical grey-green
    camo: { base: '#7d8176', under: '#4a4d47', finish: 'matte', insignia: 'lowvis', marks: [] }, // low-visibility grey
    squadron: { base: '#5f6452', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'fins', color: '#d9b92a', from: 0.3 }, { kind: 'stripe', y: 0.5, h: 0.16, color: '#d9b92a', x0: 0.82, x1: 0.97 }] }, // squadron tail colours
    airshow: { base: '#a7aba6', under: '#8f938e', finish: 'gloss', insignia: 'star', marks: [{ kind: 'stripe', y: 0.6, h: 0.35, color: '#c8202f', x0: 0.6, x1: 1 }, { kind: 'fins', color: '#c8202f', from: 0.5 }, { kind: 'nose', x1: 0.06, color: '#3b3f3d' }] }, // grey demonstrator with red tail
  },
};
