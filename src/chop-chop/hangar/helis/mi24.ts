// Mil Mi-24V / Mi-35 Hind-E. Fuselage 17.5 m, five-blade main rotor 17.3 m, rotor head 3.9 m (6.5 m to the top of the
// tail rotor), a three-blade 3.91 m tail rotor on the LEFT, 6.54 m stub wings with 12 degrees of anhedral, a stepped
// tandem double-bubble cockpit, a troop cabin and tricycle gear. Research: .scratch/chop-chop/research/helis/mi24-hind.md
import type { HeliSpec } from '../three/spec';
import { bubble, circle, finPanel, oval, wingPanel } from './parts';

export const mi24: HeliSpec = {
  id: 'mi24', length: 17.5, rotorDiameter: 17.3, height: 3.9,
  bodies: [
    { sections: [ // the low nose, the chunky troop cabin and the tail boom rising to the fin
      oval(0, 0.2, 0.28, 0.32, 1.5, 1.6), oval(0.7, 0.52, 0.55, 0.55, 1.6, 2), oval(1.8, 0.75, 0.8, 0.7, 1.8, 2.4), oval(3.2, 0.88, 1.05, 0.9, 2.1, 2.8, 3),
      oval(5.0, 0.9, 1.15, 0.98, 2.2, 3, 3.2), oval(9.0, 0.9, 1.15, 0.98, 2.2, 3, 3.2), oval(11.0, 0.68, 0.8, 0.62, 2.4, 2.6, 2.6), oval(13.0, 0.46, 0.5, 0.42, 2.65),
      oval(15.5, 0.34, 0.38, 0.3, 2.92), oval(17.5, 0.14, 0.2, 0.14, 3.2),
    ] },
    { sections: bubble(0.3, 2.4, 2.0, 0.62, 0.85, 0.5), finish: 'glass' }, // the gunner's low nose bubble
    { sections: bubble(1.8, 4.2, 2.8, 0.7, 1.0, 0.5), finish: 'glass' }, // the pilot's higher bubble behind and above it
    { z: 0.5, mirror: true, sections: [circle(4.2, 0.1, 3.3), circle(4.8, 0.4, 3.35), circle(8.0, 0.42, 3.4), circle(9.4, 0.3, 3.38), circle(10.2, 0.14, 3.34)] }, // the two engines side by side
    { sections: [oval(4.6, 0.3, 0.1, 0.1, 3.3), oval(5.6, 0.55, 0.5, 0.1, 3.4, 2.4), oval(7.2, 0.55, 0.5, 0.1, 3.4, 2.4), oval(8.4, 0.25, 0.1, 0.1, 3.3)] }, // the gearbox and rotor head fairing
    { z: 3.3, mirror: true, finish: 'dark', sections: [circle(6.2, 0.08, 1.52), circle(6.6, 0.14, 1.5), circle(8.2, 0.14, 1.5), circle(8.6, 0.06, 1.5)] }, // wingtip missile rails
  ],
  surfaces: [
    { kind: 'wing', stations: wingPanel([5.9, 2.0, 0.85], 1.9, [6.6, 1.5, 3.27], 1.0, 0.16, 0.1, 2) }, // big drooping stub wings (anhedral)
    { kind: 'tail', stations: wingPanel([15.6, 3.1, 0.2], 0.9, [16.1, 3.1, 1.3], 0.6, 0.1, 0.08, 2) }, // the tailplane
    { kind: 'fin', mirror: false, stations: finPanel([14.6, 3.05, 0], 2.0, [16.6, 4.65, 0], 0.9, 0.18) }, // the swept fin
  ],
  rotors: [
    { kind: 'main', at: [6.4, 4.05, 0], r: 8.65, blades: 5, chord: 0.55, axis: 'y', dir: 1, tilt: [0, 0.04], mast: 0.7 },
    { kind: 'tail', at: [16.5, 4.3, -0.38], r: 1.955, blades: 3, chord: 0.3, axis: 'z', dir: -1 }, // on the left
  ],
  gear: { nose: { x: 2.2, y: 1.2, len: 0.78, r: 0.34, twin: true }, main: { x: 7.4, y: 1.9, z: 1.5, len: 1.3, r: 0.6 } },
  hardpoints: [
    { at: [6.5, 1.78, 1.5], kind: 'inner', mirror: true }, { at: [6.7, 1.6, 2.35], kind: 'outer', mirror: true },
    { at: [7.2, 1.45, 3.3], kind: 'tip', mirror: true }, { at: [6.6, 1.5, 0], kind: 'belly' },
    { at: [5.6, 1.9, 1.15], kind: 'inner', mirror: true }, { at: [6.65, 1.5, 2.9], kind: 'outer', mirror: true },
  ],
  cockpit: [2.9, 3.2, 0],
  seats: [[1.0, 2.25, 0], [2.9, 3.2, 0]], // gunner low in the nose, pilot above and behind
  gun: [0.5, 1.15, 0], // the chin gun under the gunner's bubble
  livery: {
    factory: { base: '#5a5f3c', under: '#8a9a9f', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#3e4a2f', '#6b4f2a'], scale: 1.2, seed: 24 }] }, // Soviet Krokodil
    camo: { base: '#c2b280', under: '#b8aa80', finish: 'matte', insignia: 'none', marks: [{ kind: 'camo', colors: ['#7a6a4a', '#4a3f2f'], scale: 1.0, seed: 77 }] }, // Afghan desert
    squadron: { base: '#4a5d3a', finish: 'matte', insignia: 'lowvis', marks: [{ kind: 'splinter', colors: ['#6b5a3e', '#33402a'], seed: 9 }, { kind: 'fins', color: '#a8181c', from: 0.7 }] }, // Polish / Czech splinter green
    airshow: { base: '#26292e', finish: 'gloss', insignia: 'none', marks: [ // black "Satan's Chariot" with a red stripe and a shark mouth colour nose
      { kind: 'stripe', y: 0.1, h: 0.25, color: '#c8202f', x0: 0.1, x1: 0.8 }, { kind: 'nose', x1: 0.06, color: '#c8202f' }, { kind: 'fins', color: '#c8202f', from: 0.5 },
    ] },
  },
};
