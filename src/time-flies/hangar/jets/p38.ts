// Lockheed P-38L Lightning. Length 11.53 m, span 15.85 m, height 3.91 m, wing area 30.4 m². A central gondola for the
// pilot and guns, its nose well ahead of the propellers, and two booms carrying the Allison engines (with their deep
// chin intakes), the turbochargers on top behind the wing, the radiator housings on the boom sides and the oval twin
// fins, joined by one tailplane that runs out past the booms to rounded tips. Counter-rotating 3.51 m three-blade
// propellers. It sits 5½° nose up on its tricycle gear. Stations from Lockheed's dimensioned three-view (thrust line
// y = 0, x from the gondola nose). Research: .scratch/airplane-clock/research/jets/p38-lightning.md
import type { BodyPart, JetSpec } from '../three/spec';
import { bubble, joined, oval, roundedPanel, wingPanel } from './parts';

const BOOM = 2.44;

// the four .50 calibre guns and the 20 mm cannon poking out of the nose
const barrel = (y: number, z: number, r: number, from: number): BodyPart => ({
  z, finish: 'dark', segs: 8, sections: [oval(from, r, r, r, y), oval(0.55, r, r, r, y)],
});

export const p38: JetSpec = {
  id: 'p38', length: 11.53, span: 15.85, height: 3.91,
  bodies: [
    { sections: [ // the gondola: a long bullet from the gun nose to a point between the booms
      oval(0, 0.1, 0.08, 0.1, -0.08), oval(0.15, 0.18, 0.13, 0.17, -0.08), oval(0.45, 0.27, 0.19, 0.26, -0.07), oval(1.0, 0.37, 0.26, 0.42, -0.05), oval(1.9, 0.42, 0.37, 0.6, 0),
      oval(2.8, 0.45, 0.46, 0.68, 0, 2.4, 2), oval(3.8, 0.43, 0.48, 0.64, 0, 2.4, 2), oval(4.7, 0.33, 0.42, 0.5, 0), oval(5.3, 0.18, 0.28, 0.3, 0.04),
      oval(5.7, 0.04, 0.08, 0.08, 0.08),
    ] },
    { sections: bubble(2.75, 4.6, 0.42, 0.36, 0.58, 0.4), finish: 'glass' },
    barrel(0.02, 0.08, 0.03, -0.25), barrel(0.02, -0.08, 0.03, -0.25), barrel(-0.1, 0.1, 0.03, -0.12), barrel(-0.1, -0.1, 0.03, -0.12), barrel(-0.2, 0, 0.045, -0.05),
    { z: BOOM, mirror: true, sections: [ // each boom: Allison engine cowling, wing root, then the tail boom rising to the fins
      oval(1.57, 0.3, 0.3, 0.33, 0), oval(2.0, 0.43, 0.44, 0.58, 0, 2.2, 2.4), oval(3.0, 0.5, 0.55, 0.72, 0, 2.2, 2.4), oval(4.2, 0.52, 0.6, 0.7, 0),
      oval(5.2, 0.45, 0.58, 0.55, 0), oval(6.2, 0.3, 0.32, 0.32, 0.05), oval(7.6, 0.25, 0.29, 0.29, 0.12), oval(9.0, 0.2, 0.24, 0.24, 0.25),
      oval(10.6, 0.14, 0.17, 0.17, 0.35), oval(11.53, 0.04, 0.06, 0.06, 0.38),
    ] },
    { z: BOOM, mirror: true, sections: [ // the chin intake under each spinner (intercooler and oil coolers)
      oval(1.72, 0.28, 0.1, 0.13, -0.47, 2.6, 2.6), oval(2.2, 0.32, 0.14, 0.14, -0.5, 2.6, 2.6), oval(3.2, 0.12, 0.05, 0.05, -0.62),
    ], openFront: true, segs: 24 },
    { z: BOOM, mirror: true, finish: 'metal', segs: 20, sections: [ // the turbo-supercharger on top of the boom behind the wing
      oval(5.0, 0.08, 0.02, 0.05, 0.56), oval(5.25, 0.22, 0.09, 0.05, 0.56), oval(5.55, 0.24, 0.1, 0.05, 0.54), oval(5.85, 0.06, 0.03, 0.05, 0.5),
    ] },
    { z: BOOM + 0.3, mirror: true, sections: [oval(6.6, 0.1, 0.16, 0.18, 0.1), oval(7.2, 0.18, 0.24, 0.25, 0.12), oval(8.0, 0.04, 0.12, 0.12, 0.15)], openFront: true, segs: 20 }, // radiator housings
    { z: BOOM - 0.3, mirror: true, sections: [oval(6.6, 0.1, 0.16, 0.18, 0.1), oval(7.2, 0.18, 0.24, 0.25, 0.12), oval(8.0, 0.04, 0.12, 0.12, 0.15)], openFront: true, segs: 20 },
  ],
  surfaces: [
    { kind: 'wing', stations: joined( // flat centre section between the booms, then outer panels with 5°40' dihedral and big round tips
      wingPanel([2.9, 0.15, 0.4], 2.8, [3.09, 0.15, 2.92], 2.23, 0.16, 0.15, 2),
      roundedPanel([3.09, 0.15, 2.92], 2.23, [3.41, 0.59, 7.33], 1.65, 0.15, 0.12, 0.6),
    ) },
    { kind: 'tail', stations: roundedPanel([10.1, 0.4, 0], 1.14, [10.1, 0.4, 2.9], 1.14, 0.08, 0.08, 0.42, 3) },
    { kind: 'fin', stations: [ // oval fins, above and below each boom, bottom to top
      { le: [10.78, -0.5, BOOM], chord: 0.5, t: 0.09 }, { le: [10.6, -0.28, BOOM], chord: 0.85, t: 0.09 }, { le: [10.55, 0.35, BOOM], chord: 0.98, t: 0.09 },
      { le: [10.6, 1.0, BOOM], chord: 0.9, t: 0.09 }, { le: [10.74, 1.38, BOOM], chord: 0.68, t: 0.08 }, { le: [10.95, 1.56, BOOM], chord: 0.32, t: 0.08 },
    ] },
  ],
  nozzles: [],
  props: [{ at: [1.57, 0, BOOM], r: 1.75, blades: 3, spinner: 0.6, mirror: true, chord: 0.3 }],
  stacks: [[5.9, 0.6, BOOM + 0.05]], // turbo exhaust
  gear: { nose: { x: 1.4, y: -0.6, len: 1.26, r: 0.34 }, main: { x: 4.4, y: -0.6, z: BOOM, len: 0.88, r: 0.44 } },
  hardpoints: [{ at: [4.0, -0.06, 1.4], kind: 'inner' }, { at: [3.8, 0.1, 3.6], kind: 'outer' }, { at: [3.85, 0.2, 4.6], kind: 'outer' }],
  cockpit: [3.5, 0.68, 0],
  flame: 'stacks',
  loads: { 1: { inner: 'hvar', outer: 'hvar' }, 3: { inner: 'tank', outer: 'hvar' } },
  livery: {
    factory: { base: '#5a5e3b', under: '#8e908b', finish: 'matte', insignia: 'star', marks: [{ kind: 'nose', x1: 0.04, color: '#1d1d1d' }] },
    camo: { base: '#bcc2c8', finish: 'metal', insignia: 'star', marks: [ // natural metal with D-Day invasion stripes
      { kind: 'band', x0: 0.42, x1: 0.45, color: '#141414' }, { kind: 'band', x0: 0.45, x1: 0.48, color: '#f2f2f2' }, { kind: 'band', x0: 0.48, x1: 0.51, color: '#141414' },
      { kind: 'band', x0: 0.51, x1: 0.54, color: '#f2f2f2' }, { kind: 'band', x0: 0.54, x1: 0.57, color: '#141414' }, { kind: 'antiglare', x0: 0.05, x1: 0.24, color: '#3d4129' },
    ] },
    squadron: { base: '#bcc2c8', finish: 'metal', insignia: 'star', marks: [{ kind: 'nose', x1: 0.075, color: '#c41e2a' }, { kind: 'fins', color: '#1d3f8f', from: 0.55 }, { kind: 'wingtips', color: '#1d3f8f', from: 0.9 }] },
    airshow: { base: '#c9ced3', finish: 'metal', insignia: 'star', marks: [ // "Glacier Girl"-style polished metal
      { kind: 'antiglare', x0: 0.03, x1: 0.24, color: '#1f2226' }, { kind: 'nose', x1: 0.07, color: '#f2c230' }, { kind: 'stripe', y: 0.05, h: 0.12, color: '#1d3f8f', x0: 0.1, x1: 0.9 },
    ] },
  },
};
