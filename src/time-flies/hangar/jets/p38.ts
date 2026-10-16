// Lockheed P-38L Lightning. Length 11.53 m, span 15.85 m, height 3.91 m, wing area 30.4 m². A central gondola for the
// pilot and guns, and two booms carrying the Allison engines, turbochargers, radiators and twin tails, joined by one
// tailplane. Counter-rotating 3.48 m three-blade propellers. Research: .scratch/airplane-clock/research/jets/p38-lightning.md
import type { JetSpec } from '../three/spec';
import { bubble, oval, roundedPanel, wingPanel } from './parts';

const BOOM = 2.4;

export const p38: JetSpec = {
  id: 'p38', length: 11.53, span: 15.85, height: 3.91,
  bodies: [
    { sections: [ // the gondola
      oval(0, 0.12, 0.1, 0.12, -0.05), oval(0.4, 0.38, 0.36, 0.4, -0.02), oval(1.4, 0.55, 0.52, 0.6, 0), oval(2.6, 0.6, 0.55, 0.64, 0),
      oval(4.0, 0.56, 0.48, 0.62, 0), oval(5.2, 0.36, 0.3, 0.45, 0.02), oval(5.9, 0.1, 0.08, 0.16, 0.05),
    ] },
    { sections: bubble(2.0, 4.3, 0.38, 0.42, 0.55, 0.45), finish: 'glass' },
    { z: BOOM, mirror: true, sections: [ // each boom: engine nacelle, turbo bump, radiators, tail boom
      oval(0.75, 0.42, 0.46, 0.5, 0.05), oval(1.6, 0.5, 0.55, 0.68, 0.05), oval(3.6, 0.5, 0.55, 0.72, 0.05), oval(5.0, 0.4, 0.48, 0.5, 0.1),
      oval(6.4, 0.3, 0.38, 0.36, 0.15), oval(7.6, 0.36, 0.42, 0.4, 0.18), oval(9.0, 0.24, 0.3, 0.3, 0.22), oval(10.9, 0.16, 0.22, 0.22, 0.26), oval(11.53, 0.05, 0.08, 0.08, 0.28),
    ] },
    { z: BOOM + 0.32, mirror: true, sections: [oval(6.9, 0.16, 0.14, 0.18, 0.18), oval(7.5, 0.18, 0.18, 0.2, 0.18), oval(8.2, 0.04, 0.1, 0.1, 0.18)], openFront: true }, // radiator scoops
    { z: BOOM - 0.32, mirror: true, sections: [oval(6.9, 0.16, 0.14, 0.18, 0.18), oval(7.5, 0.18, 0.18, 0.2, 0.18), oval(8.2, 0.04, 0.1, 0.1, 0.18)], openFront: true },
  ],
  surfaces: [
    { kind: 'wing', stations: [...wingPanel([2.05, -0.15, 0.5], 3.05, [2.15, -0.12, BOOM], 2.95, 0.16, 0.15, 2), ...roundedPanel([2.15, -0.12, BOOM], 2.95, [3.05, 0.05, 7.6], 1.25, 0.15, 0.1, 0.32).slice(1)] },
    { kind: 'tail', stations: wingPanel([9.85, 0.62, 0], 1.25, [9.85, 0.62, BOOM], 1.25, 0.08, 0.08, 2) },
    { kind: 'fin', stations: roundedPanel([9.75, -0.55, BOOM], 1.55, [9.95, 1.55, BOOM], 1.25, 0.09, 0.08, 0.3, 3) },
  ],
  nozzles: [],
  props: [{ at: [0.72, 0.05, BOOM], r: 1.74, blades: 3, spinner: 0.7, mirror: true, chord: 0.3 }],
  stacks: [[4.0, 0.62, BOOM + 0.1], [4.3, 0.62, BOOM - 0.1]],
  gear: { nose: { x: 1.1, y: -0.62, len: 1.05, r: 0.3 }, main: { x: 3.8, y: -0.72, z: BOOM, len: 0.95, r: 0.36 } },
  hardpoints: [{ at: [3.0, -0.25, 1.4], kind: 'inner' }, { at: [3.3, -0.2, 3.6], kind: 'outer' }, { at: [3.5, -0.18, 4.6], kind: 'outer' }],
  cockpit: [3.1, 0.6, 0],
  flame: 'stacks',
  loads: { 1: { inner: 'hvar', outer: 'hvar' }, 3: { inner: 'tank', outer: 'hvar' } },
  livery: {
    factory: { base: '#5a5e3b', under: '#8e908b', finish: 'matte', insignia: 'star', marks: [{ kind: 'nose', x1: 0.04, color: '#1d1d1d' }] },
    camo: { base: '#bcc2c8', finish: 'metal', insignia: 'star', marks: [ // natural metal with D-Day invasion stripes
      { kind: 'band', x0: 0.42, x1: 0.45, color: '#141414' }, { kind: 'band', x0: 0.45, x1: 0.48, color: '#f2f2f2' }, { kind: 'band', x0: 0.48, x1: 0.51, color: '#141414' },
      { kind: 'band', x0: 0.51, x1: 0.54, color: '#f2f2f2' }, { kind: 'band', x0: 0.54, x1: 0.57, color: '#141414' }, { kind: 'antiglare', x0: 0.05, x1: 0.2, color: '#3d4129' },
    ] },
    squadron: { base: '#bcc2c8', finish: 'metal', insignia: 'star', marks: [{ kind: 'nose', x1: 0.075, color: '#c41e2a' }, { kind: 'fins', color: '#1d3f8f', from: 0.55 }, { kind: 'wingtips', color: '#1d3f8f', from: 0.9 }] },
    airshow: { base: '#c9ced3', finish: 'metal', insignia: 'star', marks: [ // "Glacier Girl"-style polished metal
      { kind: 'antiglare', x0: 0.03, x1: 0.2, color: '#1f2226' }, { kind: 'nose', x1: 0.07, color: '#f2c230' }, { kind: 'stripe', y: 0.05, h: 0.12, color: '#1d3f8f', x0: 0.1, x1: 0.9 },
    ] },
  },
};
