// An Aircraft as data: the parts the shared builder (jet.ts) turns into meshes. All in aircraft coordinates, metres,
// from published dimensions (each spec file names its research note): x from the nose (0) aft, y up, z to the right.
// Parts on the right side with `mirror` get a copy on the left.
import type { JetId } from '../catalog';
import type { Section, Station, V3 } from './geometry';
import type { Scheme } from './livery';
import type { Loadout } from './stores';

export type Finish = 'paint' | 'glass' | 'dark' | 'metal' | 'nozzle' | 'gear' | 'black';

export interface BodyPart {
  sections: Section[];
  z?: number;
  mirror?: boolean;
  finish?: Finish;
  openFront?: boolean;
  openBack?: boolean;
  /** A moving part's name: parts with the same name turn together about their Pivot. */
  part?: string;
  segs?: number;
  /** Faceted shading (the F-117). */
  flat?: boolean;
}

export interface SurfacePart {
  stations: Station[];
  /** Default true: a copy on the left side. */
  mirror?: boolean;
  finish?: Finish;
  part?: string;
  /** Vertical fins carry the tail art and number; wings carry the insignia and hardpoints. */
  kind: 'wing' | 'tail' | 'fin' | 'strake' | 'blade' | 'other';
  flat?: boolean;
  chordPts?: number;
}

export interface Nozzle {
  /** Centre of the exit. */
  at: V3;
  r: number;
  /** Length of the nozzle can forward of the exit. */
  len: number;
  mirror?: boolean;
  /** A flat (2D) nozzle: half-width and half-height instead of a round one. */
  flat?: { w: number; h: number };
  /** Pointing a little down (degrees), as on the F-22. */
  part?: string;
}

export interface Leg { x: number; y: number; z?: number; len: number; r: number; twin?: boolean }
export interface Gear { nose?: Leg; main: Leg; tail?: Leg }

export interface Hardpoint { at: V3; kind: 'tip' | 'outer' | 'inner' | 'belly'; mirror?: boolean }

export interface Prop {
  /** Centre of the hub's back face. */
  at: V3;
  r: number;
  blades: number;
  spinner: number;
  mirror?: boolean;
  part?: string;
  /** Blade chord at the root (default 0.3 m); the V-22's proprotors are much wider. */
  chord?: number;
}

export interface Pivot { part: string; at: V3; axis: V3 }

export interface Livery {
  factory: Scheme;
  camo: Scheme;
  squadron: Scheme;
  airshow: Scheme;
}

export interface JetSpec {
  id: JetId;
  /** Published overall length, span and height, for the record and the tests. */
  length: number;
  span: number;
  height: number;
  bodies: BodyPart[];
  surfaces: SurfacePart[];
  nozzles: Nozzle[];
  props?: Prop[];
  gear: Gear;
  hardpoints: Hardpoint[];
  pivots?: Pivot[];
  /** The main fuselage's index in `bodies` (default 0): nose art is painted on it. */
  fuselage?: number;
  /** Where the pilot sits (canopy hotspot and camera): the middle of the pilot's head and shoulders. */
  cockpit: V3;
  /** Every crew seat, when there's more than one (default: just the cockpit). */
  seats?: V3[];
  /** The engines' flame: round afterburner cones, flat ones, or exhaust stacks on a piston engine. */
  flame: 'round' | 'flat' | 'stacks' | 'none';
  /** Exhaust stacks for piston engines: their positions on the right side (mirrored). */
  stacks?: V3[];
  livery: Livery;
  /** What hangs on the hardpoints for each Weapons Rung, where it differs from the usual (the F-14's Phoenix missiles). */
  loads?: Loadout;
}
