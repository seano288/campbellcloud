// The Workshop's parts: four Slots on TORQUE, each with a free default, three Mods bought with Bolts at 5, 15 and 30, and a Legendary
// kept in the Balance Lock, as in the sibling games. Every Mod really shows on the robot in the fight, through its materials or a real
// part, and is looks only: TORQUE wins whatever it wears. No three.js in this file: Look is plain data, read by the flat picture in the
// Workshop and by the 3D build in fight/.
export const SLOT_IDS = ['paint', 'drum', 'armour', 'wheels'] as const;
export type SlotId = (typeof SLOT_IDS)[number];
/** 0 is the Slot's free default; 1 to 3 are bought with Bolts; 4 is Legendary, from the Balance Lock. */
export type Rung = 0 | 1 | 2 | 3 | 4;
export type BuyRung = Exclude<Rung, 0>;
export const RUNGS = [0, 1, 2, 3, 4] as const;
export const BOLT_RUNGS = [1, 2, 3] as const;
export const LEGENDARY = 4, TOP = 3;
export const SLOTS = {
  paint: { name: 'Paint', icon: '🎨', mods: ['Factory Blue', 'Racing Green', 'Sunny Yellow', 'Galaxy Purple', 'Rainbow Paint'] },
  drum: { name: 'Drum', icon: '🥁', mods: ['Steel Drum', 'Gold Drum', 'Ice Drum', 'Lava Drum', 'Lightning Drum'] },
  armour: { name: 'Armour', icon: '🛡️', mods: ['Plain Plates', 'Racing Stripes', 'Flame Plates', 'Spike Armour', 'Dragon Armour'] },
  wheels: { name: 'Wheels', icon: '🛞', mods: ['Orange Hubs', 'Yellow Hubs', 'Gold Hubs', 'Glow Wheels', 'Comet Wheels'] },
} as const;
export type SlotName = (typeof SLOTS)[SlotId]['name'];
export type ModName = (typeof SLOTS)[SlotId]['mods'][number];
export type TopName = (typeof SLOTS)[SlotId]['mods'][typeof TOP];
export const ALL_MOD_NAMES = SLOT_IDS.flatMap(s => [...SLOTS[s].mods]) as ModName[];

export type ModId = `${SlotId}:${BuyRung}`;
export const modId = <R extends BuyRung>(slot: SlotId, rung: R) => `${slot}:${rung}` as `${SlotId}:${R}`;
export const parseMod = (id: ModId) => { const [slot, rung] = id.split(':'); return { slot: slot as SlotId, rung: Number(rung) as BuyRung }; };
/** Everything Bolts can buy. */
export const BOLT_MODS: readonly ModId[] = SLOT_IDS.flatMap(s => BOLT_RUNGS.map(r => modId(s, r)));
export type LegendaryId = `${SlotId}:${typeof LEGENDARY}`;
export const LEGENDARIES: readonly LegendaryId[] = SLOT_IDS.map(s => modId(s, LEGENDARY));
export const ALL_MODS: readonly ModId[] = [...BOLT_MODS, ...LEGENDARIES];
export const isLegendary = (m: ModId): m is LegendaryId => parseMod(m).rung === LEGENDARY;
export const modName = (slot: SlotId, rung: Rung): ModName => SLOTS[slot].mods[rung];

/** What he has fitted: one Rung in each Slot. */
export type Gear = Record<SlotId, Rung>;
export const defaultGear = (): Gear => ({ paint: 0, drum: 0, armour: 0, wheels: 0 });

// ---------- how Gear looks ----------
/** rgb in 0..1, the colours the drum smears to at full speed. */
type Rgb = readonly [number, number, number];
export interface DrumLook { hex: string; steel: number; mill: number; core: Rgb; tooth: Rgb; glow: number | null; /** Glowing bands round the drum. */ bands?: boolean }
export interface Look {
  /** `rainbow`: `number` is what shows where one colour has to. */
  paint: { hex: string; number: number; rainbow?: boolean };
  drum: DrumLook;
  armour: Rung;
  /** `rim`: a glowing ring on the tyre. */
  hub: { hex: string; number: number; kind: 'paint' | 'metal' | 'glow'; rim?: boolean };
}
const hexOf = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const PAINTS = [0x0a3fb8, 0x0d7a3a, 0xe8ae00, 0x6a1fd0, 0xe0267f] as const;
const DRUMS: readonly DrumLook[] = [
  { hex: '#6d7278', steel: 0xb8b8b6, mill: 0x2c2b2a, core: [.04, .04, .04], tooth: [.062, .06, .057], glow: null },
  { hex: '#e0a820', steel: 0xffb52e, mill: 0x8a6418, core: [.42, .27, .05], tooth: [.8, .54, .12], glow: null },
  { hex: '#8fdcff', steel: 0x9fe2ff, mill: 0x3f7f9f, core: [.2, .42, .58], tooth: [.62, .86, 1], glow: null },
  { hex: '#ff5a1f', steel: 0x56301f, mill: 0x1d0f0a, core: [.05, .025, .02], tooth: [.3, .08, .02], glow: 0xff5a14 },
  { hex: '#b44cff', steel: 0x3a2a66, mill: 0x120a24, core: [.05, .03, .1], tooth: [.45, .2, .95], glow: 0xb44cff, bands: true },
];
const HUBS = [
  { number: 0xff6508, kind: 'paint' }, { number: 0xf5c400, kind: 'paint' }, { number: 0xd4a017, kind: 'metal' }, { number: 0x18e0ff, kind: 'glow' }, { number: 0xff8a1e, kind: 'glow', rim: true },
] as const;

export const lookOf = (gear: Gear): Look => ({
  paint: { hex: hexOf(PAINTS[gear.paint]), number: PAINTS[gear.paint], ...(gear.paint === LEGENDARY && { rainbow: true }) },
  drum: DRUMS[gear.drum]!,
  armour: gear.armour,
  hub: { ...HUBS[gear.wheels], hex: hexOf(HUBS[gear.wheels].number) },
});
