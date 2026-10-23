// A Helicopter as data: the parts the shared builder (heli.ts) turns into meshes. The same coordinates and primitives as
// Time Flies' aircraft (src/time-flies/hangar/three/spec.ts): metres from published dimensions (each spec file names its
// research note), x from the nose (0) aft, y up, z to the right, y = 0 on the ground. Parts on the right side with
// `mirror` get a copy on the left. What's new is rotors, skids and a chin gun.
import type { V3 } from '../../../time-flies/hangar/three/geometry';
import type { Scheme } from '../../../time-flies/hangar/three/livery';
import type { BodyPart, Gear, Hardpoint, SurfacePart } from '../../../time-flies/hangar/three/spec';
import type { Loadout } from '../../../time-flies/hangar/three/stores';
import type { HeliId } from '../catalog';

export type { BodyPart, Gear, Hardpoint, SurfacePart, V3 };

export interface Rotor {
  /** The middle of the hub. */
  at: V3;
  /** Radius (half the published diameter). */
  r: number;
  blades: number;
  /** Blade chord (m). */
  chord: number;
  /** Main rotors turn about the up axis, tail rotors about the sideways axis, pusher propellers about the fore-aft axis. */
  axis: 'y' | 'z' | 'x';
  /** Which way it turns: 1 anticlockwise seen from above (main), from the right (tail) or from behind (pusher); -1 clockwise. */
  dir: 1 | -1;
  /** Shaft tilt in radians: [forward, sideways]. The Black Hawk's tail rotor is canted 20° (sideways about x). */
  tilt?: readonly [number, number];
  /** The main rotor carries the Rotor Mod's tips; tail rotors and pushers turn faster and stay plain. */
  kind: 'main' | 'tail' | 'pusher';
  /** Ducted (a fenestron or fantail): a ring this thick round the fan. */
  duct?: number;
  /** Mast height below the hub (main rotors, default 0.5 m). */
  mast?: number;
  /** The Apache's tail rotor: two pairs of blades at an X instead of evenly spaced (degrees between the pairs). */
  scissor?: number;
}

/** Landing skids: two tubes along x at ±z on the ground, with cross tubes up to the fuselage. */
export interface Skids {
  x0: number;
  x1: number;
  /** Half the track. */
  z: number;
  /** Tube radius. */
  r: number;
  /** The cross tubes: where along x, and the height and half-width where they meet the fuselage. */
  struts: { x: number; y: number; z: number }[];
}

export interface Livery {
  factory: Scheme;
  camo: Scheme;
  squadron: Scheme;
  airshow: Scheme;
}

export interface HeliSpec {
  id: HeliId;
  /** Published fuselage length, main rotor diameter and height, for the record and the tests. */
  length: number;
  rotorDiameter: number;
  height: number;
  bodies: BodyPart[];
  surfaces: SurfacePart[];
  rotors: Rotor[];
  skids?: Skids;
  gear?: Gear;
  hardpoints: Hardpoint[];
  /** The main fuselage's index in `bodies` (default 0): nose art is painted on it. */
  fuselage?: number;
  /** Where the pilot sits (canopy hotspot): the middle of the pilot's head and shoulders. */
  cockpit: V3;
  /** Every crew seat, when there's more than one. */
  seats?: V3[];
  /** The gun's muzzle (a chin turret, a nose gun or a door gun), where Lift Off's tracers start. */
  gun: V3;
  livery: Livery;
  /** What hangs on the hardpoints for each Weapons Rung, where it differs from the usual. */
  loads?: Loadout;
}
