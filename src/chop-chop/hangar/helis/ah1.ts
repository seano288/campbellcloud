// Bell AH-1Z Viper. Fuselage ~14.0 m, main rotor 14.6 m (four blades), 4.37 m tall, a four-blade tail rotor on the left of
// the fin, skids, long stub wings (three stations a side, a Sidewinder at the tip) and a three-barrel chin gun. The body is
// very narrow and tall, the "snake" look, with the gunner low in front and the pilot raised behind.
// Research: .scratch/chop-chop/research/helis/ah1z-viper.md
import type { HeliSpec } from '../three/spec';
import { bubble, circle, finPanel, oval, wingPanel } from './parts';

export const ah1: HeliSpec = {
  id: 'ah1', length: 14.0, rotorDiameter: 14.6, height: 4.37,
  bodies: [
    { sections: [ // nose, the tall slim tandem cockpit, the engine bay and the thin tail boom
      oval(0, 0.18, 0.18, 0.18, 1.3, 2.2), oval(0.9, 0.38, 0.42, 0.38, 1.35, 2.3), oval(2.2, 0.5, 0.62, 0.5, 1.5, 2.6, 2.6), oval(3.6, 0.54, 0.8, 0.55, 1.65, 2.8, 2.8),
      oval(5.0, 0.58, 0.82, 0.62, 1.7, 3, 3), oval(6.6, 0.55, 0.66, 0.55, 1.75, 3, 3), oval(8.2, 0.36, 0.4, 0.34, 1.95), oval(9.6, 0.24, 0.25, 0.23, 2.05),
      oval(12.4, 0.19, 0.2, 0.19, 2.2), oval(14.0, 0.12, 0.14, 0.12, 2.3),
    ] },
    { sections: bubble(1.0, 2.8, 1.8, 0.36, 0.4, 0.4), finish: 'glass' }, // the gunner's canopy, low in front
    { sections: bubble(2.9, 4.9, 2.3, 0.38, 0.5, 0.4), finish: 'glass' }, // the pilot's canopy, raised behind
    { z: 0.42, mirror: true, sections: [circle(4.9, 0.1, 2.4), circle(5.5, 0.36, 2.5), circle(7.6, 0.36, 2.5), circle(8.6, 0.16, 2.5)] }, // the two engines
    { sections: [circle(4.6, 0.2, 3.0), circle(5.1, 0.42, 3.15), circle(5.9, 0.4, 3.2), circle(6.4, 0.18, 3.2)] }, // the rotor head fairing
    { sections: [oval(0.5, 0.1, 0.12, 0.12, 0.85), oval(1.0, 0.25, 0.2, 0.2, 0.82), oval(1.9, 0.25, 0.2, 0.2, 0.9), oval(2.2, 0.12, 0.1, 0.1, 0.95)] }, // the chin turret
    { sections: [circle(-0.45, 0.04, 0.82), circle(0.8, 0.06, 0.82)] }, // the cannon barrels
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([4.1, 1.45, 0.4], 1.1, [4.6, 1.5, 2.15], 0.66, 0.1, 0.08, 2) }, // stub wings, long on the Viper
    { kind: 'tail', stations: wingPanel([12.5, 2.2, 0.15], 0.85, [12.7, 2.2, 1.15], 0.6, 0.08, 0.06, 2) }, // the stabiliser
    { kind: 'fin', mirror: false, stations: finPanel([12.2, 2.25, 0], 1.7, [13.4, 3.9, 0], 0.85, 0.14) }, // the tall swept fin
  ],
  rotors: [
    { kind: 'main', at: [5.2, 3.9, 0], r: 7.3, blades: 4, chord: 0.52, axis: 'y', dir: 1, mast: 0.8 },
    { kind: 'tail', at: [13.35, 3.3, -0.26], r: 1.4, blades: 4, chord: 0.2, axis: 'z', dir: -1 },
  ],
  skids: { x0: 2.0, x1: 6.8, z: 1.05, r: 0.05, struts: [{ x: 3.0, y: 1.05, z: 0.5 }, { x: 5.8, y: 1.15, z: 0.52 }] },
  hardpoints: [
    { at: [4.7, 1.42, 2.15], kind: 'tip', mirror: true }, { at: [4.5, 1.37, 1.5], kind: 'outer', mirror: true },
    { at: [4.3, 1.35, 0.8], kind: 'inner', mirror: true }, { at: [3.0, 0.7, 0], kind: 'belly' },
  ],
  cockpit: [3.6, 2.45, 0],
  seats: [[1.9, 1.95, 0], [3.6, 2.45, 0]],
  gun: [-0.45, 0.82, 0], // the three-barrel cannon's muzzle
  livery: {
    factory: { base: '#6b6f6e', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.08, color: '#3f4447' }] }, // USMC low-vis grey
    camo: { base: '#4a5a3a', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#33363a', '#7a7d7a'], scale: 1.0, seed: 71 }] }, // HMLA-269 "sea snake" throwback
    squadron: { base: '#5c5e3b', finish: 'satin', insignia: 'lowvis', marks: [{ kind: 'nose', x1: 0.07, color: '#e8e4d8' }, { kind: 'stripe', y: -0.1, h: 0.1, color: '#a3262b', x0: 0.02, x1: 0.07 }] }, // Vietnam-era Cobra shark nose
    airshow: { base: '#b1231e', finish: 'gloss', insignia: 'star', marks: [{ kind: 'spine', w: 0.5, color: '#f2f2f2' }, { kind: 'nose', x1: 0.07, color: '#f2f2f2' }, { kind: 'wingtips', color: '#f2f2f2', from: 0.6 }] },
  },
};
