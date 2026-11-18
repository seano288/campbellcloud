// Everything Bolts buy at the Airfield, as plain tables. Every price is at most 100 (the voice only has number clips up to 100). No row's
// id or price may change once a save holds it: a save keeps the ids it owns.
//
//   Planes            which plane he flies (each a little faster or turnier than the last), drawn in code (art/plane.ts)
//   Engine            how fast it flies
//   Wings             how tightly it turns
//   Smoke Tank        how long a smoke trail it lays
//   Propeller         how quickly it gets up to speed
//   Smoke Colour      and Smoke Shape: what the smoke looks like (plain, stars, bubbles...)
//   Paint and Pilot   how the plane looks, and who flies it
//   Tricks            Loop and Roll are free; a third trick button flies the one he picks (Heart, Star, Spiral...)
//   Gear              changes how a Show plays (Ring Magnet, Bubble Shield, Turbo Button, Autopilot...); on once bought, unless he
//                     switches it off
//   Wall              things for his Wall, where his postcards hang
// Engine, Wings, Smoke Tank and Propeller each have six Rungs (the first free), and the plane flies with the best Rung he has fitted.

export const TABS = ['plane', 'engine', 'wings', 'tank', 'prop', 'smoke', 'shape', 'paint', 'pilot', 'trick', 'gear', 'wall'] as const;
export type Tab = (typeof TABS)[number];
export const TAB_NAMES = {
  plane: 'Planes', engine: 'Engines', wings: 'Wings', tank: 'Smoke Tanks', prop: 'Propellers', smoke: 'Smoke Colors', shape: 'Smoke Shapes',
  paint: 'Paint', pilot: 'Pilots', trick: 'Tricks', gear: 'Gear', wall: 'Wall',
} as const satisfies Record<Tab, string>;
export const TAB_ICONS: Record<Tab, string> = { plane: '✈️', engine: '⚙️', wings: '🪽', tank: '🛢️', prop: '🌀', smoke: '☁️', shape: '⭐', paint: '🎨', pilot: '🧑‍✈️', trick: '🔄', gear: '🧲', wall: '🖼️' };

export interface Item { id: string; name: string; price: number; pic: string; line?: string }

/** Planes: `speed` and `turn` multiply the Engine's and Wings'. */
export const PLANES = [
  { id: 'biplane', name: 'Biplane', price: 0, pic: '🛩️', speed: 1, turn: 1, line: 'Two wings, one on top of the other!' },
  { id: 'glider', name: 'Glider', price: 8, pic: '🪁', speed: 0.9, turn: 1.25, line: 'Long wings! It turns tight!' },
  { id: 'paper', name: 'Paper Plane', price: 12, pic: '📄', speed: 0.95, turn: 1.2, line: 'A giant paper plane!' },
  { id: 'seaplane', name: 'Seaplane', price: 18, pic: '🌊', speed: 1, turn: 1.05, line: 'It has floats for the sea!' },
  { id: 'racer', name: 'Racer', price: 25, pic: '🏁', speed: 1.15, turn: 1, line: 'A fast racing plane!' },
  { id: 'triplane', name: 'Triplane', price: 32, pic: '🛩️', speed: 1, turn: 1.3, line: 'Three wings! It turns super tight!' },
  { id: 'jet', name: 'Jet', price: 40, pic: '✈️', speed: 1.25, turn: 1, line: 'A jet! Whoosh!' },
  { id: 'twin', name: 'Twin Prop', price: 50, pic: '🛫', speed: 1.15, turn: 1.1, line: 'Two propellers!' },
  { id: 'rocket', name: 'Rocket Plane', price: 60, pic: '🚀', speed: 1.35, turn: 1, line: 'A rocket with wings!' },
  { id: 'saucer', name: 'Flying Saucer', price: 75, pic: '🛸', speed: 1.1, turn: 1.45, line: 'It can turn any way!' },
  { id: 'shuttle', name: 'Space Plane', price: 85, pic: '🛰️', speed: 1.35, turn: 1.15, line: 'It flies to space and back!' },
  { id: 'dragon', name: 'Dragon', price: 100, pic: '🐉', speed: 1.3, turn: 1.35, line: 'A dragon! It flaps its wings!' },
] as const satisfies readonly (Item & { speed: number; turn: number })[];
export type PlaneId = (typeof PLANES)[number]['id'];

/** The four Rung slots: `k` is what the Rung multiplies. */
export const ENGINES = [
  { id: 'e0', name: 'Little Engine', price: 0, pic: '⚙️', k: 1 },
  { id: 'e1', name: 'Buzz Engine', price: 8, pic: '⚙️', k: 1.12 },
  { id: 'e2', name: 'Zoom Engine', price: 20, pic: '⚙️', k: 1.25 },
  { id: 'e3', name: 'Turbo Engine', price: 35, pic: '🔥', k: 1.38 },
  { id: 'e4', name: 'Jet Engine', price: 55, pic: '🔥', k: 1.52 },
  { id: 'e5', name: 'Rocket Engine', price: 80, pic: '🚀', k: 1.7 },
] as const satisfies readonly (Item & { k: number })[];
export const WINGS = [
  { id: 'w0', name: 'Short Wings', price: 0, pic: '🪽', k: 1 },
  { id: 'w1', name: 'Wide Wings', price: 8, pic: '🪽', k: 1.15 },
  { id: 'w2', name: 'Swept Wings', price: 20, pic: '🪽', k: 1.3 },
  { id: 'w3', name: 'Stunt Wings', price: 35, pic: '🪽', k: 1.45 },
  { id: 'w4', name: 'Bird Wings', price: 55, pic: '🪶', k: 1.65 },
  { id: 'w5', name: 'Super Wings', price: 80, pic: '✨', k: 1.9 },
] as const satisfies readonly (Item & { k: number })[];
export const TANKS = [
  { id: 't0', name: 'Little Tank', price: 0, pic: '🛢️', k: 1 },
  { id: 't1', name: 'Bigger Tank', price: 6, pic: '🛢️', k: 1.35 },
  { id: 't2', name: 'Big Tank', price: 15, pic: '🛢️', k: 1.7 },
  { id: 't3', name: 'Huge Tank', price: 30, pic: '🛢️', k: 2.1 },
  { id: 't4', name: 'Giant Tank', price: 50, pic: '🛢️', k: 2.55 },
  { id: 't5', name: 'Mega Tank', price: 75, pic: '🛢️', k: 3 },
] as const satisfies readonly (Item & { k: number })[];
export const PROPS = [
  { id: 'p0', name: 'Two Blades', price: 0, pic: '🌀', k: 1, blades: 2, color: '#3b3b3b' },
  { id: 'p1', name: 'Three Blades', price: 6, pic: '🌀', k: 1.15, blades: 3, color: '#3b3b3b' },
  { id: 'p2', name: 'Four Blades', price: 15, pic: '🌀', k: 1.3, blades: 4, color: '#3b3b3b' },
  { id: 'p3', name: 'Gold Prop', price: 28, pic: '🥇', k: 1.45, blades: 3, color: '#e0b12a' },
  { id: 'p4', name: 'Rainbow Prop', price: 45, pic: '🌈', k: 1.6, blades: 4, color: 'rainbow' },
  { id: 'p5', name: 'Turbo Fan', price: 65, pic: '💨', k: 1.8, blades: 6, color: '#8fd3ff' },
] as const satisfies readonly (Item & { k: number; blades: number; color: string })[];

export const SMOKES = [
  { id: 'white', name: 'White Smoke', price: 0, pic: '⚪', color: '#ffffff' },
  { id: 'red', name: 'Red Smoke', price: 3, pic: '🔴', color: '#ff5a4f' },
  { id: 'blue', name: 'Blue Smoke', price: 3, pic: '🔵', color: '#3f8cff' },
  { id: 'yellow', name: 'Yellow Smoke', price: 3, pic: '🟡', color: '#ffd23f' },
  { id: 'green', name: 'Green Smoke', price: 3, pic: '🟢', color: '#3fd16a' },
  { id: 'orange', name: 'Orange Smoke', price: 4, pic: '🟠', color: '#ff9a2e' },
  { id: 'purple', name: 'Purple Smoke', price: 4, pic: '🟣', color: '#a46bff' },
  { id: 'pink', name: 'Pink Smoke', price: 5, pic: '🌸', color: '#ff8ac4' },
  { id: 'black', name: 'Black Smoke', price: 6, pic: '⚫', color: '#33343a' },
  { id: 'sky', name: 'Sky Blue Smoke', price: 6, pic: '🩵', color: '#9fe0ff' },
  { id: 'silver', name: 'Silver Smoke', price: 12, pic: '🥈', color: '#d6dde6' },
  { id: 'gold', name: 'Gold Smoke', price: 15, pic: '🥇', color: '#f2c53a' },
  { id: 'glow', name: 'Glow Smoke', price: 30, pic: '💡', color: 'glow' },
  { id: 'rainbow', name: 'Rainbow Smoke', price: 40, pic: '🌈', color: 'rainbow' },
] as const satisfies readonly (Item & { color: string })[];
export type SmokeId = (typeof SMOKES)[number]['id'];

/** What the smoke trail is made of: puffs (plain), or shapes dropped along it. */
export const SHAPES = [
  { id: 'plain', name: 'Plain Smoke', price: 0, pic: '☁️', mark: '' },
  { id: 'dots', name: 'Dots', price: 5, pic: '⚫', mark: 'dot' },
  { id: 'stars', name: 'Stars', price: 10, pic: '⭐', mark: '⭐' },
  { id: 'bubbles', name: 'Bubbles', price: 12, pic: '🫧', mark: 'bubble' },
  { id: 'hearts', name: 'Hearts', price: 15, pic: '💖', mark: '💖' },
  { id: 'clouds', name: 'Little Clouds', price: 18, pic: '☁️', mark: '☁️' },
  { id: 'sparkles', name: 'Sparkles', price: 22, pic: '✨', mark: '✨' },
  { id: 'notes', name: 'Music Notes', price: 28, pic: '🎵', mark: '🎵' },
  { id: 'snow', name: 'Snowflakes', price: 32, pic: '❄️', mark: '❄️' },
  { id: 'flowers', name: 'Flowers', price: 38, pic: '🌼', mark: '🌼' },
] as const satisfies readonly (Item & { mark: string })[];
export type ShapeId = (typeof SHAPES)[number]['id'];

/** Paint: a body colour and a trim, or a pattern. Stunt-plane red is free. */
export const PAINTS = [
  { id: 'red', name: 'Stunt Red', price: 0, pic: '🟥', body: '#e63946', trim: '#ffffff', pattern: '' },
  { id: 'blue', name: 'Blue', price: 3, pic: '🟦', body: '#2f6fe0', trim: '#ffd23f', pattern: '' },
  { id: 'yellow', name: 'Yellow', price: 3, pic: '🟨', body: '#ffcc2e', trim: '#e63946', pattern: '' },
  { id: 'green', name: 'Green', price: 3, pic: '🟩', body: '#2fae5a', trim: '#ffffff', pattern: '' },
  { id: 'orange', name: 'Orange', price: 3, pic: '🟧', body: '#ff8a1f', trim: '#1d1d1f', pattern: '' },
  { id: 'purple', name: 'Purple', price: 4, pic: '🟪', body: '#8a4fd8', trim: '#ffd23f', pattern: '' },
  { id: 'pink', name: 'Pink', price: 4, pic: '🌸', body: '#ff7fb8', trim: '#ffffff', pattern: '' },
  { id: 'white', name: 'White', price: 4, pic: '⬜', body: '#f4f6f8', trim: '#e63946', pattern: '' },
  { id: 'black', name: 'Black', price: 5, pic: '⬛', body: '#2b2d33', trim: '#ffd23f', pattern: '' },
  { id: 'sky', name: 'Sky Blue', price: 5, pic: '🩵', body: '#7cc8f6', trim: '#ffffff', pattern: '' },
  { id: 'teal', name: 'Teal', price: 6, pic: '🐬', body: '#1fa6a0', trim: '#ffffff', pattern: '' },
  { id: 'silver', name: 'Silver', price: 10, pic: '🥈', body: '#b9c2cc', trim: '#2f6fe0', pattern: '' },
  { id: 'stripes', name: 'Racing Stripes', price: 12, pic: '🏎️', body: '#ffffff', trim: '#e63946', pattern: 'stripes' },
  { id: 'checks', name: 'Checkers', price: 15, pic: '🏁', body: '#ffffff', trim: '#1d1d1f', pattern: 'checks' },
  { id: 'stars', name: 'Star Paint', price: 18, pic: '⭐', body: '#1b3f8f', trim: '#ffd23f', pattern: 'stars' },
  { id: 'gold', name: 'Gold', price: 20, pic: '🥇', body: '#e0b12a', trim: '#7a4a00', pattern: '' },
  { id: 'flames', name: 'Flames', price: 25, pic: '🔥', body: '#1d1d1f', trim: '#ff8a1f', pattern: 'flames' },
  { id: 'lightning', name: 'Lightning', price: 30, pic: '⚡', body: '#2f6fe0', trim: '#ffd23f', pattern: 'lightning' },
] as const satisfies readonly (Item & { body: string; trim: string; pattern: string })[];
export type PaintId = (typeof PAINTS)[number]['id'];

export const PILOTS = [
  { id: 'kid', name: 'Kid Pilot', price: 0, pic: '🧒' },
  { id: 'cat', name: 'Cat Pilot', price: 5, pic: '🐱' },
  { id: 'dog', name: 'Dog Pilot', price: 5, pic: '🐶' },
  { id: 'fox', name: 'Fox Pilot', price: 8, pic: '🦊' },
  { id: 'bear', name: 'Bear Pilot', price: 8, pic: '🐻' },
  { id: 'frog', name: 'Frog Pilot', price: 10, pic: '🐸' },
  { id: 'penguin', name: 'Penguin Pilot', price: 12, pic: '🐧' },
  { id: 'monkey', name: 'Monkey Pilot', price: 14, pic: '🐵' },
  { id: 'robot', name: 'Robot Pilot', price: 20, pic: '🤖' },
  { id: 'alien', name: 'Alien Pilot', price: 25, pic: '👽' },
  { id: 'dino', name: 'Dino Pilot', price: 30, pic: '🦖' },
  { id: 'unicorn', name: 'Unicorn Pilot', price: 35, pic: '🦄' },
] as const satisfies readonly Item[];
export type PilotId = (typeof PILOTS)[number]['id'];

/** Tricks: Loop and Roll have their own buttons; the one he picks here is the third button. */
export const TRICKS = [
  { id: 'loop', name: 'Loop', price: 0, pic: '🔄', line: 'Round and round!' },
  { id: 'roll', name: 'Roll', price: 0, pic: '🌀', line: 'Spin like a top!' },
  { id: 'zigzag', name: 'Zigzag', price: 10, pic: '⚡', line: 'Zig and zag!' },
  { id: 'heart', name: 'Heart', price: 15, pic: '💖', line: 'It draws a heart!' },
  { id: 'spiral', name: 'Spiral', price: 20, pic: '🌀', line: 'Around and around and around!' },
  { id: 'bigloop', name: 'Big Loop', price: 28, pic: '⭕', line: 'A giant loop!' },
  { id: 'star', name: 'Star', price: 36, pic: '⭐', line: 'It draws a star!' },
  { id: 'eight', name: 'Figure Eight', price: 45, pic: '♾️', line: 'It draws an eight!' },
] as const satisfies readonly Item[];
export type TrickId = (typeof TRICKS)[number]['id'];

export const GEAR = [
  { id: 'sparkle', name: 'Sparkle Wings', price: 15, pic: '✨', line: 'Sparkles fly off your wings!' },
  { id: 'magnet', name: 'Ring Magnet', price: 20, pic: '🧲', line: 'Rings float to your plane!' },
  { id: 'shield', name: 'Bubble Shield', price: 25, pic: '🫧', line: 'Clouds bounce right off!' },
  { id: 'turbo', name: 'Turbo Button', price: 30, pic: '⚡', line: 'Tap it to zoom!' },
  { id: 'banner', name: 'Banner', price: 35, pic: '🎏', line: 'Your plane pulls a banner!' },
  { id: 'confetti', name: 'Confetti Cannon', price: 40, pic: '🎉', line: 'Confetti at every ring!' },
  { id: 'fireworks', name: 'Fireworks', price: 45, pic: '🎆', line: 'Fireworks at every ring!' },
  { id: 'autopilot', name: 'Autopilot', price: 50, pic: '🤖', line: 'Let go and it flies to the ring!' },
] as const satisfies readonly Item[];
export type GearId = (typeof GEAR)[number]['id'];

export const WALL = [
  { id: 'flag', name: 'Flag', price: 3, pic: '🚩' },
  { id: 'sun', name: 'Sun', price: 3, pic: '☀️' },
  { id: 'star', name: 'Star', price: 4, pic: '⭐' },
  { id: 'moon', name: 'Moon', price: 4, pic: '🌙' },
  { id: 'cloud', name: 'Cloud', price: 5, pic: '☁️' },
  { id: 'balloon', name: 'Balloon', price: 5, pic: '🎈' },
  { id: 'kite', name: 'Kite', price: 6, pic: '🪁' },
  { id: 'rainbow', name: 'Rainbow', price: 6, pic: '🌈' },
  { id: 'plant', name: 'Plant', price: 8, pic: '🪴' },
  { id: 'windsock', name: 'Windsock', price: 8, pic: '🎏' },
  { id: 'medal', name: 'Gold Medal', price: 10, pic: '🏅' },
  { id: 'globe', name: 'Globe', price: 12, pic: '🌍' },
  { id: 'map', name: 'Map', price: 12, pic: '🗺️' },
  { id: 'clock', name: 'Clock', price: 14, pic: '🕰️' },
  { id: 'compass', name: 'Compass', price: 15, pic: '🧭' },
  { id: 'trophy', name: 'Trophy', price: 18, pic: '🏆' },
  { id: 'lamp', name: 'Lamp', price: 18, pic: '💡' },
  { id: 'telescope', name: 'Telescope', price: 22, pic: '🔭' },
  { id: 'rocket', name: 'Model Rocket', price: 25, pic: '🚀' },
  { id: 'parachute', name: 'Parachute', price: 28, pic: '🪂' },
  { id: 'satellite', name: 'Satellite', price: 32, pic: '🛰️' },
  { id: 'copter', name: 'Toy Helicopter', price: 36, pic: '🚁' },
  { id: 'crown', name: 'Crown', price: 45, pic: '👑' },
  { id: 'frames', name: 'Gold Frames', price: 50, pic: '🖼️' },
] as const satisfies readonly Item[];
export type WallId = (typeof WALL)[number]['id'];

// ---------- keys ----------

export const TABLES = {
  plane: PLANES, engine: ENGINES, wings: WINGS, tank: TANKS, prop: PROPS, smoke: SMOKES, shape: SHAPES, paint: PAINTS, pilot: PILOTS, trick: TRICKS, gear: GEAR, wall: WALL,
} as const;
export type IdOf<T extends Tab> = (typeof TABLES)[T][number]['id'];
export type ItemKey = { [T in Tab]: `${T}:${IdOf<T>}` }[Tab];
export const keyOf = <T extends Tab>(tab: T, id: IdOf<T>) => `${tab}:${id}` as ItemKey;
export const tabOf = (k: ItemKey) => k.split(':')[0] as Tab;
export const idOf = (k: ItemKey) => k.split(':')[1]!;
export const ALL_KEYS: readonly ItemKey[] = TABS.flatMap(t => (TABLES[t] as readonly Item[]).map(i => `${t}:${i.id}` as ItemKey));
export const isItemKey = (x: unknown): x is ItemKey => (ALL_KEYS as readonly unknown[]).includes(x);
export const item = (k: ItemKey): Item => (TABLES[tabOf(k)] as readonly Item[]).find(i => i.id === idOf(k))!;
/** What he owns from the start. */
export const STARTERS: readonly ItemKey[] = ALL_KEYS.filter(k => item(k).price === 0);
/** Everything that costs Bolts. */
export const FOR_SALE: readonly ItemKey[] = ALL_KEYS.filter(k => item(k).price > 0);
export const TOTAL_PRICE = FOR_SALE.reduce((n, k) => n + item(k).price, 0);
/** Slots that hold one thing at a time (fitted); Gear is switched on and off; the Wall shows everything he owns. */
export const FITTED_TABS = ['plane', 'engine', 'wings', 'tank', 'prop', 'smoke', 'shape', 'paint', 'pilot', 'trick'] as const satisfies readonly Tab[];
export type FittedTab = (typeof FITTED_TABS)[number];
/** Tabs whose things change how a Show plays. */
export const PLAY_TABS: readonly Tab[] = ['plane', 'engine', 'wings', 'tank', 'prop', 'trick', 'gear'];

export type ItemName = (typeof TABLES)[Tab][number]['name'];
export type ItemLine = (typeof PLANES)[number]['line'] | (typeof TRICKS)[number]['line'] | (typeof GEAR)[number]['line'];
export const ALL_NAMES: readonly ItemName[] = ALL_KEYS.map(k => item(k).name as ItemName);
