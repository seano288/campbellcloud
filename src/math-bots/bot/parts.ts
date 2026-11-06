// Every part a robot can be built from, as plain data: what it's called, how he gets it, and what it does in a fight. No drawing here
// (draw.ts) and no fight rules (fight/sim.ts). His robot and every rival are built from this same list, so a part always does the same
// thing whoever has it. A part comes one of three ways: `how` is a Bolt price, 'prize' for beating a rival, or 'lock' for the Balance Lock.
export const CATS = ['body', 'wheels', 'add', 'paint', 'face'] as const;
export type Cat = (typeof CATS)[number];
/** The four places a part can bolt on. A Body has some of them, and bigger Bodies have more. */
export const MOUNTS = ['front', 'right', 'back', 'left'] as const;
export type Mount = (typeof MOUNTS)[number];
export const MOUNT_ANGLE: Record<Mount, number> = { front: 0, right: Math.PI / 2, back: Math.PI, left: -Math.PI / 2 };

export type How = number | 'prize' | 'lock';
export type Shape = 'box' | 'wedge' | 'dart' | 'shell' | 'tank' | 'titan' | 'boulder' | 'hull';
export interface BodyPart { id: string; name: string; how: How; power: number; hp: number; weight: number; radius: number; shape: Shape; mounts: readonly Mount[] }
export type WheelArt = 'small' | 'big' | 'grip' | 'tread' | 'race' | 'zip' | 'hover' | 'comet';
export interface WheelPart { id: string; name: string; how: How; power: number; drive: number; turn: number; grip: number; weight: number; art: WheelArt }
/** Weapons fire or touch; gear guards the side it's on or helps all the time. */
export type AddKind = 'saw' | 'spin' | 'lance' | 'hammer' | 'flip' | 'claw' | 'prod' | 'bumper' | 'shield' | 'thorns' | 'boost' | 'magnet' | 'repair';
export interface AddPart { id: string; name: string; how: How; power: number; kind: AddKind; weight: number; dmg: number; reach: number; size: number; tint: string; block?: number; extra?: 'sparks' | 'gold' }
export interface PaintPart { id: string; name: string; how: How; power: 0; hex: string; to?: string; rainbow?: boolean }
export type FaceArt = 'happy' | 'angry' | 'visor' | 'cyclops' | 'shark' | 'cat' | 'cool' | 'crown';
export interface FacePart { id: string; name: string; how: How; power: 0; art: FaceArt }
export type Part = BodyPart | WheelPart | AddPart | PaintPart | FacePart;

const four = ['front', 'right', 'back', 'left'] as const;
export const BODIES = [
  { id: 'box', name: 'Scrap Box', how: 0, power: 2, hp: 100, weight: 10, radius: 44, shape: 'box', mounts: ['front', 'back'] },
  { id: 'wedge', name: 'Wedge', how: 14, power: 4, hp: 110, weight: 9, radius: 44, shape: 'wedge', mounts: ['front', 'left', 'right'] },
  { id: 'dart', name: 'Speed Dart', how: 28, power: 5, hp: 95, weight: 6, radius: 40, shape: 'dart', mounts: ['front', 'back', 'left', 'right'] },
  { id: 'shell', name: 'Turtle Shell', how: 45, power: 8, hp: 160, weight: 13, radius: 48, shape: 'shell', mounts: four },
  { id: 'tank', name: 'Big Tank', how: 90, power: 12, hp: 220, weight: 18, radius: 54, shape: 'tank', mounts: four },
  { id: 'titan', name: 'Titan Frame', how: 170, power: 17, hp: 300, weight: 21, radius: 58, shape: 'titan', mounts: four },
  { id: 'boulder', name: 'Boulder Body', how: 'prize', power: 14, hp: 270, weight: 16, radius: 54, shape: 'boulder', mounts: four },
  { id: 'hull', name: 'King Hull', how: 'prize', power: 22, hp: 380, weight: 20, radius: 60, shape: 'hull', mounts: four },
] as const satisfies readonly BodyPart[];
export const WHEELS = [
  { id: 'small', name: 'Small Wheels', how: 0, power: 1, drive: 100, turn: 6.5, grip: 1, weight: 3, art: 'small' },
  { id: 'big', name: 'Big Wheels', how: 10, power: 2, drive: 120, turn: 6.5, grip: 1.1, weight: 4, art: 'big' },
  { id: 'grip', name: 'Grippy Tyres', how: 24, power: 3, drive: 118, turn: 7, grip: 1.7, weight: 4, art: 'grip' },
  { id: 'tread', name: 'Tank Treads', how: 50, power: 5, drive: 135, turn: 5, grip: 2.4, weight: 6, art: 'tread' },
  { id: 'race', name: 'Race Wheels', how: 75, power: 6, drive: 165, turn: 7.5, grip: 1.2, weight: 3, art: 'race' },
  { id: 'zip', name: 'Zip Wheels', how: 'prize', power: 7, drive: 185, turn: 9, grip: 1, weight: 2, art: 'zip' },
  { id: 'hover', name: 'Hover Pads', how: 130, power: 8, drive: 170, turn: 10, grip: .8, weight: 3, art: 'hover' },
  { id: 'comet', name: 'Comet Wheels', how: 'lock', power: 10, drive: 205, turn: 9, grip: 1.8, weight: 3, art: 'comet' },
] as const satisfies readonly WheelPart[];
export const ADDS = [
  // ---- weapons: touch ----
  { id: 'bumper', name: 'Rubber Bumper', how: 0, power: 1, kind: 'bumper', weight: 1, dmg: 7, reach: 16, size: 1, tint: '#2a2d33' },
  { id: 'spike', name: 'Steel Spike', how: 8, power: 3, kind: 'lance', weight: 2, dmg: 9, reach: 46, size: 1, tint: '#d9dde2' },
  { id: 'rusty', name: 'Rusty Saw', how: 'prize', power: 4, kind: 'saw', weight: 2, dmg: 3, reach: 30, size: .9, tint: '#c8743a' },
  { id: 'saw', name: 'Buzz Saw', how: 20, power: 5, kind: 'saw', weight: 3, dmg: 4, reach: 34, size: 1, tint: '#dfe5ea' },
  { id: 'blade', name: 'Spin Blade', how: 55, power: 8, kind: 'spin', weight: 4, dmg: 17, reach: 46, size: 1, tint: '#e9edf1' },
  { id: 'whirly', name: 'Whirly Blade', how: 'prize', power: 9, kind: 'spin', weight: 4, dmg: 20, reach: 50, size: 1.1, tint: '#7fe0ff' },
  { id: 'drum', name: 'Drum Spinner', how: 80, power: 10, kind: 'spin', weight: 5, dmg: 22, reach: 34, size: 1, tint: '#ffb52e' },
  { id: 'bigsaw', name: 'Giant Saw', how: 110, power: 11, kind: 'saw', weight: 5, dmg: 8, reach: 48, size: 1.45, tint: '#f6f8fa' },
  { id: 'twin', name: 'Twin Saw', how: 'prize', power: 13, kind: 'saw', weight: 5, dmg: 11, reach: 42, size: 1.2, tint: '#ff7a59', extra: 'sparks' },
  { id: 'mega', name: 'Mega Spinner', how: 200, power: 16, kind: 'spin', weight: 7, dmg: 34, reach: 62, size: 1.35, tint: '#ff5a1f' },
  { id: 'lightning', name: 'Lightning Drum', how: 'lock', power: 18, kind: 'spin', weight: 5, dmg: 36, reach: 38, size: 1.1, tint: '#b44cff', extra: 'sparks' },
  // ---- weapons: the big button ----
  { id: 'hammer', name: 'Hammer', how: 30, power: 6, kind: 'hammer', weight: 4, dmg: 20, reach: 70, size: 1, tint: '#8f98a3' },
  { id: 'anvil', name: 'Anvil Hammer', how: 'prize', power: 8, kind: 'hammer', weight: 5, dmg: 28, reach: 76, size: 1.15, tint: '#59626e' },
  { id: 'gianth', name: 'Giant Hammer', how: 140, power: 13, kind: 'hammer', weight: 7, dmg: 46, reach: 88, size: 1.4, tint: '#ffc21a' },
  { id: 'flipper', name: 'Flipper', how: 38, power: 6, kind: 'flip', weight: 4, dmg: 8, reach: 60, size: 1, tint: '#ff6508' },
  { id: 'launch', name: 'Launch Flipper', how: 'prize', power: 8, kind: 'flip', weight: 4, dmg: 14, reach: 66, size: 1.15, tint: '#ffd23f' },
  { id: 'claw', name: 'Grabber Claw', how: 'prize', power: 9, kind: 'claw', weight: 4, dmg: 10, reach: 62, size: 1, tint: '#27b84a' },
  { id: 'prod', name: 'Shock Prod', how: 'prize', power: 10, kind: 'prod', weight: 3, dmg: 12, reach: 74, size: 1, tint: '#2fd3ff', extra: 'sparks' },
  // ---- gear ----
  { id: 'shield', name: 'Steel Shield', how: 12, power: 3, kind: 'shield', weight: 3, dmg: 0, reach: 14, size: 1, tint: '#aeb7c1', block: .6 },
  { id: 'brick', name: 'Brick Wall', how: 'prize', power: 6, kind: 'shield', weight: 5, dmg: 0, reach: 18, size: 1.15, tint: '#c4553b', block: .8 },
  { id: 'gold', name: 'Gold Shield', how: 100, power: 9, kind: 'shield', weight: 3, dmg: 0, reach: 16, size: 1.1, tint: '#ffc53d', block: .85, extra: 'gold' },
  { id: 'thorn', name: 'Spike Plate', how: 32, power: 5, kind: 'thorns', weight: 3, dmg: 6, reach: 18, size: 1, tint: '#cfd3d6', block: .25 },
  { id: 'prickle', name: 'Prickle Plate', how: 'prize', power: 8, kind: 'thorns', weight: 3, dmg: 10, reach: 22, size: 1.15, tint: '#7ee081', block: .35 },
  { id: 'dragon', name: 'Dragon Armour', how: 'lock', power: 14, kind: 'thorns', weight: 3, dmg: 14, reach: 24, size: 1.2, tint: '#ffc21a', block: .75, extra: 'gold' },
  { id: 'booster', name: 'Booster', how: 42, power: 5, kind: 'boost', weight: 2, dmg: 0, reach: 18, size: 1, tint: '#ff9a1e' },
  { id: 'magnet', name: 'Bolt Magnet', how: 18, power: 2, kind: 'magnet', weight: 1, dmg: 0, reach: 18, size: 1, tint: '#e13a2c' },
  { id: 'repair', name: 'Repair Bot', how: 65, power: 6, kind: 'repair', weight: 2, dmg: 0, reach: 16, size: 1, tint: '#27b84a' },
] as const satisfies readonly AddPart[];
export const PAINTS = [
  { id: 'blue', name: 'Factory Blue', how: 0, power: 0, hex: '#1f6fe0' },
  { id: 'red', name: 'Fire Red', how: 3, power: 0, hex: '#e0322c' },
  { id: 'green', name: 'Racing Green', how: 3, power: 0, hex: '#13a14e' },
  { id: 'yellow', name: 'Sunny Yellow', how: 4, power: 0, hex: '#f5c400' },
  { id: 'orange', name: 'Hot Orange', how: 4, power: 0, hex: '#ff7a1a' },
  { id: 'pink', name: 'Bubble Pink', how: 5, power: 0, hex: '#ff5fb2' },
  { id: 'white', name: 'Ice White', how: 5, power: 0, hex: '#e9f1f7' },
  { id: 'black', name: 'Midnight Black', how: 6, power: 0, hex: '#2a3040' },
  { id: 'purple', name: 'Galaxy Purple', how: 8, power: 0, hex: '#6a1fd0', to: '#ff4fd8' },
  { id: 'flame', name: 'Flame Fade', how: 12, power: 0, hex: '#ffcd1f', to: '#e8260c' },
  { id: 'ocean', name: 'Ocean Fade', how: 12, power: 0, hex: '#26e0d0', to: '#0a3fb8' },
  { id: 'gold', name: 'King Gold', how: 40, power: 0, hex: '#ffe27a', to: '#c98a00' },
  { id: 'rainbow', name: 'Rainbow Paint', how: 'lock', power: 0, hex: '#e0267f', rainbow: true },
] as const satisfies readonly PaintPart[];
export const FACES = [
  { id: 'happy', name: 'Happy Eyes', how: 0, power: 0, art: 'happy' },
  { id: 'angry', name: 'Angry Eyes', how: 3, power: 0, art: 'angry' },
  { id: 'visor', name: 'Robot Visor', how: 5, power: 0, art: 'visor' },
  { id: 'cyclops', name: 'One Big Eye', how: 6, power: 0, art: 'cyclops' },
  { id: 'cool', name: 'Cool Shades', how: 8, power: 0, art: 'cool' },
  { id: 'cat', name: 'Cat Face', how: 8, power: 0, art: 'cat' },
  { id: 'shark', name: 'Shark Teeth', how: 10, power: 0, art: 'shark' },
  { id: 'crown', name: 'Gold Crown', how: 'prize', power: 0, art: 'crown' },
] as const satisfies readonly FacePart[];

const LISTS = { body: BODIES, wheels: WHEELS, add: ADDS, paint: PAINTS, face: FACES } as const;
export const partsIn = (cat: Cat): readonly Part[] => LISTS[cat];
export type BodyId = (typeof BODIES)[number]['id'];
export type WheelId = (typeof WHEELS)[number]['id'];
export type AddId = (typeof ADDS)[number]['id'];
export type PaintId = (typeof PAINTS)[number]['id'];
export type FaceId = (typeof FACES)[number]['id'];
export type PartName = (typeof BODIES | typeof WHEELS | typeof ADDS | typeof PAINTS | typeof FACES)[number]['name'];

/** Paint and Add both have a "gold", so a part's key in a save carries its category: `paint:gold`. */
export type PartKey = `body:${BodyId}` | `wheels:${WheelId}` | `add:${AddId}` | `paint:${PaintId}` | `face:${FaceId}`;
export const keyOf = (cat: Cat, id: string) => `${cat}:${id}` as PartKey;
const INDEX = new Map<string, Part>(CATS.flatMap(c => partsIn(c).map(p => [keyOf(c, p.id), p] as const)));
export const ALL_PARTS = [...INDEX.keys()] as PartKey[];
export const isPartKey = (x: unknown): x is PartKey => typeof x === 'string' && INDEX.has(x);
export const part = (k: PartKey): Part => INDEX.get(k)!;
export const catOf = (k: PartKey) => k.split(':')[0] as Cat;
export const nameOf = (k: PartKey) => part(k).name as PartName;
export const ALL_PART_NAMES = [...new Set(ALL_PARTS.map(nameOf))];
export const body = (id: BodyId) => BODIES.find(b => b.id === id)!;
export const wheels = (id: WheelId) => WHEELS.find(w => w.id === id)!;
export const add = (id: AddId) => ADDS.find(a => a.id === id)!;
export const paint = (id: PaintId) => PAINTS.find(p => p.id === id)!;
export const face = (id: FaceId) => FACES.find(f => f.id === id)!;

/** Where a part bolts on, measured out from the robot's middle. Pointed Bodies carry their front further out. */
export function edge(b: Pick<BodyPart, 'shape' | 'radius'>, m: Mount) {
  if (m === 'front') return b.radius * ({ wedge: 1.12, dart: 1.18, hull: 1.05 }[b.shape as string] ?? .96);
  if (m === 'back') return b.radius * (b.shape === 'dart' ? .78 : .96);
  return b.radius * ({ dart: .62, shell: .92, box: .84, wedge: .8 }[b.shape as string] ?? .86);
}

/** The Legendaries, by the Slot they had before parts were built, which is how the Balance Lock and old saves name them. */
export const LEGENDARIES = { paint: 'paint:rainbow', drum: 'add:lightning', armour: 'add:dragon', wheels: 'wheels:comet' } as const satisfies Record<string, PartKey>;
export type LockSlot = keyof typeof LEGENDARIES;
export const LOCK_SLOTS = Object.keys(LEGENDARIES) as LockSlot[];
/** What he has to own first: the dearest part bought with Bolts of the same sort. */
export const LOCK_NEEDS = { paint: 'paint:ocean', drum: 'add:mega', armour: 'add:gold', wheels: 'wheels:hover' } as const satisfies Record<LockSlot, PartKey>;
export const lockSlotOf = (k: PartKey) => LOCK_SLOTS.find(s => LEGENDARIES[s] === k) ?? null;
