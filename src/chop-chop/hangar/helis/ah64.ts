// Boeing AH-64E Apache Guardian. Fuselage 14.7 m, main rotor 14.63 m (four blades), 4.7 m to the top of the Longbow radar
// dome on the mast, a four-blade 2.7 m tail rotor with its blade pairs at 55 degrees (the X look) on the left of the fin,
// tandem stepped canopies, big engine pods on either side of the mast, sponsons for the wheels, a tailwheel, a low
// tailplane and four stub-wing stations. Research: .scratch/chop-chop/research/helis/ah64-apache.md
import type { HeliSpec } from '../three/spec';
import { bubble, circle, finPanel, oval, wingPanel } from './parts';

export const ah64: HeliSpec = {
  id: 'ah64', length: 14.7, rotorDiameter: 14.63, height: 4.7,
  bodies: [
    { sections: [ // nose, the tandem cockpit, the deck between the engines and the slim tail boom
      oval(0, 0.15, 0.15, 0.15, 1.35), oval(0.8, 0.5, 0.45, 0.45, 1.35, 2.4, 2.4), oval(2.0, 0.6, 0.6, 0.55, 1.45, 2.6, 2.6), oval(3.3, 0.7, 0.75, 0.6, 1.7, 2.8, 2.8),
      oval(5.0, 0.75, 0.9, 0.7, 2.0, 3, 3), oval(6.5, 0.65, 0.8, 0.7, 2.1, 3, 3), oval(8.5, 0.6, 0.6, 0.6, 2.2), oval(10.5, 0.38, 0.4, 0.38, 2.2),
      oval(12.5, 0.22, 0.25, 0.22, 2.3), oval(14.7, 0.13, 0.15, 0.13, 2.4),
    ] },
    { sections: bubble(1.0, 2.9, 1.9, 0.4, 0.4, 0.4), finish: 'glass' }, // the gunner's canopy, low in front
    { sections: bubble(3.2, 5.3, 2.45, 0.44, 0.5, 0.4), finish: 'glass' }, // the pilot's canopy, stepped up behind
    { sections: [oval(0, 0.1, 0.1, 0.1, 1.55), oval(0.35, 0.3, 0.28, 0.25, 1.55), oval(0.95, 0.32, 0.28, 0.26, 1.55)] }, // the sensor turret on the nose
    { z: 0.82, mirror: true, sections: [circle(4.6, 0.14, 2.75), circle(5.4, 0.46, 2.8), circle(9.4, 0.46, 2.8), circle(10.9, 0.2, 2.75)] }, // the big engine pods
    { z: 0.7, mirror: true, sections: [oval(3.2, 0.1, 0.15, 0.15, 1.0), oval(4.2, 0.3, 0.3, 0.28, 1.0), oval(6.4, 0.3, 0.3, 0.28, 1.0), oval(7.2, 0.1, 0.15, 0.15, 1.0)] }, // the wheel sponsons
    { sections: [circle(5.7, 0.2, 3.2), circle(6.2, 0.4, 3.3), circle(6.9, 0.38, 3.35), circle(7.3, 0.16, 3.4)] }, // the rotor head fairing
    { sections: [circle(6.1, 0.12, 3.95), circle(6.3, 0.38, 4.0), circle(6.7, 0.4, 4.05), circle(6.95, 0.2, 4.08)] }, // the Longbow radar dome above the hub
    { sections: [oval(1.4, 0.1, 0.12, 0.12, 0.88), oval(1.9, 0.25, 0.2, 0.2, 0.84), oval(2.8, 0.25, 0.2, 0.2, 0.9), oval(3.1, 0.12, 0.1, 0.1, 0.95)] }, // the chin turret
    { sections: [circle(0.5, 0.04, 0.78), circle(2.1, 0.05, 0.78)] }, // the 30 mm chain gun
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([4.9, 1.75, 0.7], 1.25, [5.3, 1.8, 2.6], 0.95, 0.1, 0.08, 2) }, // the stub wings
    { kind: 'tail', stations: wingPanel([13.6, 2.15, 0.15], 0.8, [13.8, 2.15, 1.6], 0.7, 0.08, 0.07, 2) }, // the low tailplane
    { kind: 'fin', mirror: false, stations: finPanel([12.5, 2.3, 0], 2.0, [13.9, 3.9, 0], 1.0, 0.14) }, // the tall fin
  ],
  rotors: [
    { kind: 'main', at: [6.5, 3.9, 0], r: 7.315, blades: 4, chord: 0.53, axis: 'y', dir: 1, mast: 0.6 },
    { kind: 'tail', at: [14.0, 3.1, -0.3], r: 1.35, blades: 4, chord: 0.2, axis: 'z', dir: -1, scissor: 55 },
  ],
  gear: { main: { x: 5.2, y: 0.95, z: 1.1, len: 0.65, r: 0.3 }, tail: { x: 11.8, y: 2.0, len: 1.7, r: 0.17 } },
  hardpoints: [
    { at: [5.3, 1.72, 2.55], kind: 'tip', mirror: true }, { at: [5.2, 1.65, 2.0], kind: 'outer', mirror: true },
    { at: [5.1, 1.65, 1.3], kind: 'inner', mirror: true }, { at: [3.4, 0.85, 0], kind: 'belly' },
  ],
  cockpit: [4.2, 2.8, 0],
  seats: [[2.0, 2.2, 0], [4.2, 2.8, 0]],
  gun: [0.5, 0.78, 0], // the chain gun's muzzle
  livery: {
    factory: { base: '#3d4430', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'antiglare', x0: 0.02, x1: 0.08, color: '#222418' }] }, // US Army olive drab
    camo: { base: '#b9a77a', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#8a7550', '#6b5a3c'], scale: 1.2, seed: 64 }] }, // desert tan
    squadron: { base: '#6b7556', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'camo', colors: ['#4d5640', '#3a3f33'], scale: 1.0, seed: 8 }] }, // British Army AH1 grey-green
    airshow: { base: '#e8e8e8', finish: 'gloss', insignia: 'star', marks: [{ kind: 'stripe', y: -0.1, h: 0.2, color: '#1d3f8f', x0: 0.05, x1: 0.95 }, { kind: 'nose', x1: 0.06, color: '#1d3f8f' }, { kind: 'fins', color: '#d4a62a', from: 0.5 }] }, // Boeing demonstrator white with blue and gold
  },
};
