// The rovers he can drive and the gear he can put on them, added on 2026-11-14 once he had bought every rocket part. The Scout Rover is
// free; the others are bought with Bolts at the Space Base, and each one drives its own way (a trick, said when he taps it): the Dune
// Buggy is fast, the Monster Truck jumps high, the Tank Crawler never slips, the Spider Walker jumps again in the air and the Hover
// Rover floats. Gadgets are the sixteen he wins on planets plus eight more he buys (the Kit). He switches each one on or off, and each
// rover keeps its own set, so the Monster Truck can wear the Spoiler while the Scout wears the Siren. Gadgets are on unless he has
// switched them off, so a gadget he has just won goes on every rover.
import { GADGET_IDS, GADGETS, type GadgetId } from './planets';

export interface RoverDef {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  /** Top speed, times the Scout's. */
  readonly speed: number;
  /** Jump height, times the Scout's. */
  readonly jump: number;
  /** Jumps he gets in mid-air (the Jump Booster gives one more). */
  readonly airJumps: number;
  /** Doesn't slip on ice. */
  readonly grip: boolean;
  /** Floats: no slipping, lava can't bounce it, and it comes down slowly. */
  readonly hover: boolean;
  /** What it does, said when he taps it. */
  readonly trick: Trick | null;
}

export const TRICKS = [
  'It goes extra fast!', 'It jumps extra high!', 'It never slips on ice!', 'It can jump in the air!', 'It floats!',
  'It blows bubbles!', 'It floats down slowly!', 'Fireworks at the flag!', 'An alien rides with you!', 'It is a party!',
] as const;
export type Trick = (typeof TRICKS)[number];

// No price over 100, the most the voice can say.
export const ROVERS = [
  { id: 'scout', name: 'Scout Rover', price: 0, speed: 1, jump: 1, airJumps: 0, grip: false, hover: false, trick: null },
  { id: 'buggy', name: 'Dune Buggy', price: 20, speed: 1.3, jump: 1, airJumps: 0, grip: false, hover: false, trick: 'It goes extra fast!' },
  { id: 'monster', name: 'Monster Truck', price: 40, speed: 1, jump: 1.45, airJumps: 0, grip: false, hover: false, trick: 'It jumps extra high!' },
  { id: 'tank', name: 'Tank Crawler', price: 60, speed: .92, jump: 1, airJumps: 0, grip: true, hover: false, trick: 'It never slips on ice!' },
  { id: 'spider', name: 'Spider Walker', price: 80, speed: 1, jump: 1.1, airJumps: 1, grip: false, hover: false, trick: 'It can jump in the air!' },
  { id: 'hover', name: 'Hover Rover', price: 100, speed: 1.15, jump: 1.1, airJumps: 0, grip: true, hover: true, trick: 'It floats!' },
] as const satisfies readonly RoverDef[];
export type RoverId = (typeof ROVERS)[number]['id'];
export type RoverName = (typeof ROVERS)[number]['name'];
export const ROVER_IDS = ROVERS.map(r => r.id) as RoverId[];
export const roverDef = (id: RoverId): RoverDef => ROVERS.find(r => r.id === id) ?? ROVERS[0];
export const isRoverId = (x: unknown): x is RoverId => ROVERS.some(r => r.id === x);

/** The gadgets he buys rather than wins. */
export const KIT = [
  { id: 'spoiler', name: 'Spoiler', price: 10, trick: null },
  { id: 'flames', name: 'Flame Decals', price: 15, trick: null },
  { id: 'plow', name: 'Snow Plow', price: 25, trick: 'It never slips on ice!' },
  { id: 'bubbles', name: 'Bubble Blower', price: 35, trick: 'It blows bubbles!' },
  { id: 'chute', name: 'Parachute', price: 45, trick: 'It floats down slowly!' },
  { id: 'disco', name: 'Disco Ball', price: 55, trick: 'It is a party!' },
  { id: 'fireworks', name: 'Fireworks', price: 70, trick: 'Fireworks at the flag!' },
  { id: 'alien', name: 'Alien Pal', price: 85, trick: 'An alien rides with you!' },
] as const satisfies readonly { id: string; name: string; price: number; trick: Trick | null }[];
export type KitId = (typeof KIT)[number]['id'];
export type KitName = (typeof KIT)[number]['name'];
export const KIT_IDS = KIT.map(k => k.id) as KitId[];
export const isKitId = (x: unknown): x is KitId => KIT.some(k => k.id === x);

/** Anything a rover can wear: a planet's gadget or one from the Kit. */
export type FeatureId = GadgetId | KitId;
export const FEATURE_IDS: readonly FeatureId[] = [...GADGET_IDS, ...KIT_IDS];
export const isFeatureId = (x: unknown): x is FeatureId => (FEATURE_IDS as readonly unknown[]).includes(x);
export const isKit = (f: FeatureId): f is KitId => (KIT_IDS as readonly string[]).includes(f);
export const featureName = (f: FeatureId) => (isKit(f) ? KIT.find(k => k.id === f)!.name : GADGETS[f]);
export const featureTrick = (f: FeatureId): Trick | null => (isKit(f) ? KIT.find(k => k.id === f)!.trick : null);

/** A rover as it's drawn and driven: which one, and what it's wearing. */
export interface RoverLook { readonly kind: RoverId; readonly kit: readonly FeatureId[] }
export const plainLook = (kind: RoverId = 'scout'): RoverLook => ({ kind, kit: [] });
