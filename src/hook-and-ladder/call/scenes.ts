// The thirty-two Calls, getting taller and stranger, then the endless Mystery Call (made up from its Level) and every Call again as a
// Star Call, hotter each time (heated()). Plain data in world units: the ground is y = 0, a floor is 1 high, his truck parks
// at the left with its nozzle at about x = 4.6, and the scene stands to its right. A fire or a rescue "on floor n" sits in that
// floor's window, centred at y = n - 0.5. The first four can be finished with the starter parts; the rest need a stronger Pump or
// a longer Ladder for some of it, and what he can't reach yet the helpers finish while he's told which part would reach it.

export type Look = 'bin' | 'house' | 'barn' | 'car' | 'forest' | 'shop' | 'school' | 'treehouse' | 'ship' | 'flats' | 'castle' | 'airport' | 'lighthouse' | 'hotel' | 'tower' | 'rocket'
  | 'campfire' | 'hayfield' | 'pizza' | 'toystore' | 'library' | 'zoo' | 'station' | 'windmill' | 'cabin' | 'hospital' | 'museum' | 'circus' | 'stadium' | 'wildfire' | 'giant' | 'volcano';
export type FireKind = 'window' | 'bush' | 'ground';
export type Who = 'person' | 'cat' | 'dog' | 'kid' | 'king' | 'sailor' | 'pilot' | 'keeper' | 'astronaut' | 'grandma'
  | 'chef' | 'teddy' | 'monkey' | 'penguin' | 'chick' | 'doctor' | 'baby' | 'clown' | 'bear' | 'parrot' | 'bunny';

/** A fire that `flare`s comes back once after it's put out (a Star Call's third star and the Mystery Call). */
export interface FireDef { readonly x: number; readonly y: number; readonly kind: FireKind; readonly flare?: true }
export interface RescueDef { readonly x: number; readonly floor: number; readonly who: Who }
/** Things drawn in the scene that aren't a block of windows: a tree a cat is stuck in, a car, a plane. */
export interface Prop {
  readonly kind: 'tree' | 'bin' | 'car' | 'plane' | 'rocket' | 'bush' | 'water' | 'lamp' | 'tent' | 'hay' | 'tractor' | 'train' | 'blades' | 'rock' | 'bigtop' | 'pole' | 'volcano' | 'palm' | 'campfire';
  readonly x: number;
  readonly h?: number;
  /** How wide (the big top, the rock, the train). */
  readonly w?: number;
}
/** A block of windows: its left edge, width, floors and columns. */
export interface Block { readonly x: number; readonly w: number; readonly floors: number; readonly cols: number; readonly base?: number }

export interface SceneDef {
  readonly id: string;
  readonly name: string;
  readonly look: Look;
  readonly blocks: readonly Block[];
  readonly fires: readonly FireDef[];
  readonly rescues: readonly RescueDef[];
  readonly props: readonly Prop[];
  /** His badge for answering it, and its building in the Town. */
  readonly badge: string;
  /** How far right the scene reaches, for the camera. */
  readonly right: number;
  /** How tall it is, in floors, for the camera. */
  readonly top: number;
  readonly night?: true;
  /** An emoji sign on top of the first block (the Pizza Shop's pizza). */
  readonly sign?: string;
  /** Star Calls: how hot this one is (0 is the Call as it first was, 1 to 3 add fires). */
  readonly heat?: number;
}

const colX = (b: Block, c: number) => b.x + (c + 0.5) * (b.w / b.cols);
const win = (b: Block, floor: number, col: number): FireDef => ({ x: colX(b, col), y: (b.base ?? 0) + floor - 0.5, kind: 'window' });
const res = (b: Block, floor: number, col: number, who: Who): RescueDef => ({ x: colX(b, col), floor: (b.base ?? 0) + floor, who });

const topOf = (blocks: readonly Block[], fires: readonly FireDef[], rescues: readonly RescueDef[]) =>
  Math.max(3, ...blocks.map(b => (b.base ?? 0) + b.floors + 1), ...fires.map(f => f.y + 1.5), ...rescues.map(r => r.floor + 1));
function scene<const I extends string, const N extends string>(id: I, name: N, look: Look, badge: string, blocks: Block[], fires: FireDef[], rescues: RescueDef[], props: Prop[], more: { right?: number; top?: number; night?: true; sign?: string } = {}): SceneDef & { readonly id: I; readonly name: N } {
  const right = more.right ?? Math.max(...blocks.map(b => b.x + b.w), ...fires.map(f => f.x + 1)) + 1;
  const top = more.top ?? topOf(blocks, fires, rescues);
  return { id, name, look, badge, blocks, fires, rescues, props, right, top, ...(more.night ? { night: true as const } : {}), ...(more.sign ? { sign: more.sign } : {}) };
}

const HOUSE: Block = { x: 8, w: 4, floors: 2, cols: 2 };
const BARN: Block = { x: 8, w: 5, floors: 2, cols: 2 };
const SHOP: Block = { x: 8, w: 5.4, floors: 2, cols: 3 };
const SCHOOL: Block = { x: 8, w: 6, floors: 3, cols: 3 };
const TREEHOUSE: Block = { x: 9.5, w: 2.6, floors: 2, cols: 1, base: 2 };
const SHIP: Block = { x: 9, w: 3, floors: 2, cols: 2, base: 1 };
const FLATS: Block = { x: 8, w: 5.4, floors: 5, cols: 3 };
const CASTLE: Block = { x: 8.5, w: 3.6, floors: 5, cols: 2 };
const TOWER: Block = { x: 12, w: 1.8, floors: 4, cols: 1 };
const LIGHTHOUSE: Block = { x: 9.2, w: 2, floors: 6, cols: 1 };
const HOTEL: Block = { x: 8, w: 5.4, floors: 7, cols: 3 };
const SKY: Block = { x: 8, w: 5.4, floors: 8, cols: 3 };
const GANTRY: Block = { x: 8.6, w: 1.8, floors: 8, cols: 1 };
const PIZZA: Block = { x: 8, w: 5.4, floors: 2, cols: 3 };
const TOYS: Block = { x: 8, w: 4.8, floors: 3, cols: 3 };
const LIBRARY: Block = { x: 8, w: 6, floors: 3, cols: 4 };
const ZOO: Block = { x: 8, w: 4.4, floors: 2, cols: 2 };
const STATION: Block = { x: 8, w: 4, floors: 2, cols: 2 };
const WINDMILL: Block = { x: 9.6, w: 2, floors: 4, cols: 1 };
const CABIN: Block = { x: 9, w: 3.2, floors: 2, cols: 2, base: 1.5 };
const HOSPITAL: Block = { x: 8, w: 5.4, floors: 6, cols: 3 };
const MUSEUM: Block = { x: 8, w: 6.4, floors: 4, cols: 4 };
const STADIUM: Block = { x: 8, w: 7, floors: 5, cols: 5 };
const GIANT: Block = { x: 8.4, w: 4.2, floors: 10, cols: 2 };
const HUT_A: Block = { x: 8, w: 2.4, floors: 2, cols: 1 };
const HUT_B: Block = { x: 10.9, w: 2.4, floors: 2, cols: 1 };

export const SCENES = [
  scene('bin', 'the Trash Bin', 'bin', '🗑️', [], [{ x: 9.2, y: 0.75, kind: 'ground' }], [], [{ kind: 'bin', x: 9.2 }, { kind: 'lamp', x: 11.5 }], { right: 12.5, top: 4 }),
  scene('house', 'the Little House', 'house', '🏠', [HOUSE], [win(HOUSE, 1, 0), win(HOUSE, 2, 1)], [res(HOUSE, 2, 0, 'cat')], [{ kind: 'bush', x: 13 }]),
  scene('barn', 'the Barn', 'barn', '🐄', [BARN], [win(BARN, 1, 1), win(BARN, 2, 0)], [res(BARN, 2, 1, 'cat')], []),
  scene('car', 'the Car', 'car', '🚗', [], [{ x: 9.2, y: 0.7, kind: 'ground' }, { x: 12.6, y: 1.9, kind: 'bush' }], [{ x: 11.1, floor: 2, who: 'cat' }], [{ kind: 'car', x: 9.2 }, { kind: 'tree', x: 11.1, h: 2.2 }, { kind: 'tree', x: 12.6, h: 2.2 }], { right: 14, top: 4 }),
  scene('forest', 'the Forest Edge', 'forest', '🌲', [], [{ x: 8.6, y: 0.5, kind: 'bush' }, { x: 10.4, y: 1.5, kind: 'bush' }, { x: 12.4, y: 2.4, kind: 'bush' }, { x: 13.6, y: 0.6, kind: 'bush' }], [{ x: 11.4, floor: 3, who: 'cat' }],
    [{ kind: 'bush', x: 8.6 }, { kind: 'tree', x: 10.4, h: 2 }, { kind: 'tree', x: 11.4, h: 3.2 }, { kind: 'tree', x: 12.4, h: 2.9 }, { kind: 'bush', x: 13.6 }], { right: 15, top: 5 }),
  scene('shop', 'the Bakery', 'shop', '🥐', [SHOP], [win(SHOP, 1, 0), win(SHOP, 1, 2), win(SHOP, 2, 1)], [res(SHOP, 2, 0, 'person')], []),
  scene('school', 'the School', 'school', '🏫', [SCHOOL], [win(SCHOOL, 1, 1), win(SCHOOL, 2, 0), win(SCHOOL, 3, 2)], [res(SCHOOL, 3, 0, 'kid'), res(SCHOOL, 2, 2, 'person')], []),
  scene('treehouse', 'the Tree House', 'treehouse', '🌳', [TREEHOUSE], [win(TREEHOUSE, 2, 0), { x: 12.8, y: 0.5, kind: 'bush' }], [res(TREEHOUSE, 1, 0, 'kid')], [{ kind: 'tree', x: 10.8, h: 4.6 }, { kind: 'bush', x: 12.8 }]),
  scene('ship', 'the Ship at the Dock', 'ship', '🚢', [SHIP], [{ x: 8.5, y: 1.4, kind: 'ground' }, win(SHIP, 1, 1), win(SHIP, 2, 0)], [res(SHIP, 2, 1, 'sailor')], [{ kind: 'water', x: 7.6 }], { right: 14.5 }),
  scene('flats', 'the Tall Building', 'flats', '🏢', [FLATS], [win(FLATS, 2, 1), win(FLATS, 3, 0), win(FLATS, 4, 2), win(FLATS, 5, 1)], [res(FLATS, 4, 0, 'grandma'), res(FLATS, 5, 2, 'cat')], []),
  scene('castle', 'the Castle', 'castle', '🏰', [CASTLE], [win(CASTLE, 1, 1), win(CASTLE, 3, 0), win(CASTLE, 5, 1)], [res(CASTLE, 5, 0, 'king'), res(CASTLE, 4, 1, 'cat')], []),
  scene('airport', 'the Airport', 'airport', '✈️', [TOWER], [{ x: 8.8, y: 0.9, kind: 'ground' }, { x: 10.4, y: 1.3, kind: 'ground' }, win(TOWER, 4, 0)], [res(TOWER, 3, 0, 'pilot')], [{ kind: 'plane', x: 9.6 }], { right: 15 }),
  scene('lighthouse', 'the Lighthouse', 'lighthouse', '💡', [LIGHTHOUSE], [win(LIGHTHOUSE, 3, 0), win(LIGHTHOUSE, 6, 0)], [res(LIGHTHOUSE, 5, 0, 'keeper')], [{ kind: 'water', x: 12 }], { right: 14, night: true }),
  scene('hotel', 'the Hotel', 'hotel', '🏨', [HOTEL], [win(HOTEL, 2, 0), win(HOTEL, 4, 1), win(HOTEL, 5, 2), win(HOTEL, 6, 0), win(HOTEL, 7, 1)], [res(HOTEL, 3, 1, 'person'), res(HOTEL, 6, 2, 'dog'), res(HOTEL, 7, 0, 'grandma')], []),
  scene('tower', 'the Skyscraper', 'tower', '🏙️', [SKY], [win(SKY, 3, 1), win(SKY, 5, 0), win(SKY, 6, 2), win(SKY, 7, 0), win(SKY, 8, 1)], [res(SKY, 4, 0, 'person'), res(SKY, 6, 1, 'cat'), res(SKY, 8, 2, 'kid')], [], { night: true }),
  scene('rocket', 'the Rocket Pad', 'rocket', '🚀', [GANTRY], [{ x: 11.6, y: 0.6, kind: 'ground' }, win(GANTRY, 4, 0), win(GANTRY, 7, 0)], [res(GANTRY, 5, 0, 'cat'), res(GANTRY, 8, 0, 'astronaut')], [{ kind: 'rocket', x: 11.6 }], { right: 14.5, top: 10 }),
  scene('campfire', 'the Campfire', 'campfire', '🏕️', [], [{ x: 11.6, y: 0.5, kind: 'ground' }, { x: 9.7, y: 0.9, kind: 'ground' }, { x: 14.2, y: 2.3, kind: 'bush' }], [{ x: 8.3, floor: 2, who: 'bunny' }],
    [{ kind: 'tree', x: 8.3, h: 2.4 }, { kind: 'tent', x: 9.7 }, { kind: 'campfire', x: 11.6 }, { kind: 'tree', x: 14.2, h: 3 }], { right: 15.5, top: 4.2 }),
  scene('hayfield', 'the Hay Field', 'hayfield', '🌾', [], [{ x: 9, y: 0.7, kind: 'ground' }, { x: 11.3, y: 1.7, kind: 'ground' }, { x: 11.3, y: 0.6, kind: 'ground' }], [{ x: 14, floor: 2, who: 'chick' }],
    [{ kind: 'hay', x: 9 }, { kind: 'hay', x: 11.3, h: 2 }, { kind: 'tractor', x: 14 }], { right: 15.6, top: 4 }),
  scene('pizza', 'the Pizza Shop', 'pizza', '🍕', [PIZZA], [win(PIZZA, 1, 0), win(PIZZA, 2, 1), win(PIZZA, 2, 2), win(PIZZA, 1, 2)], [res(PIZZA, 2, 0, 'chef')], [], { sign: '🍕' }),
  scene('toystore', 'the Toy Store', 'toystore', '🧸', [TOYS], [win(TOYS, 1, 2), win(TOYS, 2, 0), win(TOYS, 3, 1)], [res(TOYS, 3, 2, 'teddy'), res(TOYS, 2, 2, 'kid')], [{ kind: 'bush', x: 14 }], { sign: '🧸' }),
  scene('library', 'the Library', 'library', '📚', [LIBRARY], [win(LIBRARY, 1, 0), win(LIBRARY, 2, 3), win(LIBRARY, 3, 1), win(LIBRARY, 2, 1)], [res(LIBRARY, 3, 0, 'grandma'), res(LIBRARY, 3, 3, 'person')], [], { sign: '📚' }),
  scene('zoo', 'the Zoo', 'zoo', '🦁', [ZOO], [win(ZOO, 1, 1), win(ZOO, 2, 0), { x: 15.2, y: 2.1, kind: 'bush' }], [res(ZOO, 2, 1, 'penguin'), { x: 13.3, floor: 3, who: 'monkey' }],
    [{ kind: 'tree', x: 13.3, h: 3.4 }, { kind: 'tree', x: 15.2, h: 2.8 }], { right: 16.5, sign: '🦁' }),
  scene('station', 'the Train Station', 'station', '🚂', [STATION], [win(STATION, 1, 0), win(STATION, 2, 1), { x: 14.1, y: 0.9, kind: 'ground' }, { x: 16.1, y: 0.9, kind: 'ground' }], [res(STATION, 2, 0, 'person')],
    [{ kind: 'train', x: 12.6, w: 4.6 }], { right: 17.4 }),
  scene('windmill', 'the Windmill', 'windmill', '🌻', [WINDMILL], [win(WINDMILL, 2, 0), win(WINDMILL, 4, 0), { x: 13.4, y: 0.5, kind: 'bush' }], [res(WINDMILL, 3, 0, 'cat')], [{ kind: 'blades', x: 10.6, h: 4.7 }, { kind: 'bush', x: 13.4 }], { right: 14.8, top: 6.6 }),
  scene('cabin', 'the Mountain Cabin', 'cabin', '🛖', [CABIN], [win(CABIN, 1, 0), win(CABIN, 2, 1), { x: 13.8, y: 2.2, kind: 'bush' }, { x: 7.9, y: 0.5, kind: 'bush' }], [res(CABIN, 2, 0, 'dog')],
    [{ kind: 'rock', x: 8.6, w: 4.0, h: 1.5 }, { kind: 'bush', x: 7.9 }, { kind: 'tree', x: 13.8, h: 2.9 }], { right: 15.2 }),
  scene('hospital', 'the Hospital', 'hospital', '🏥', [HOSPITAL], [win(HOSPITAL, 2, 1), win(HOSPITAL, 3, 0), win(HOSPITAL, 4, 2), win(HOSPITAL, 5, 1), win(HOSPITAL, 6, 0)],
    [res(HOSPITAL, 3, 2, 'doctor'), res(HOSPITAL, 5, 0, 'baby'), res(HOSPITAL, 6, 2, 'grandma')], []),
  scene('museum', 'the Dinosaur Museum', 'museum', '🦖', [MUSEUM], [win(MUSEUM, 1, 0), win(MUSEUM, 2, 2), win(MUSEUM, 3, 3), win(MUSEUM, 4, 1), win(MUSEUM, 4, 2)],
    [res(MUSEUM, 3, 1, 'kid'), res(MUSEUM, 4, 3, 'person')], [], { sign: '🦖' }),
  scene('circus', 'the Circus', 'circus', '🎪', [], [{ x: 9.4, y: 1.1, kind: 'ground' }, { x: 11.3, y: 3.2, kind: 'ground' }, { x: 12.8, y: 1.8, kind: 'ground' }, { x: 10.6, y: 2.2, kind: 'ground' }], [{ x: 15, floor: 4, who: 'clown' }],
    [{ kind: 'bigtop', x: 11.2, w: 5.6, h: 4.4 }, { kind: 'pole', x: 15, h: 3.1 }], { right: 16.4, top: 6 }),
  scene('stadium', 'the Stadium', 'stadium', '🏟️', [STADIUM], [win(STADIUM, 1, 0), win(STADIUM, 2, 3), win(STADIUM, 3, 1), win(STADIUM, 4, 4), win(STADIUM, 5, 2), win(STADIUM, 5, 0)],
    [res(STADIUM, 4, 1, 'person'), res(STADIUM, 5, 4, 'kid'), res(STADIUM, 3, 3, 'dog')], [{ kind: 'lamp', x: 15.6 }], { night: true, sign: '⚽' }),
  scene('wildfire', 'the Big Forest Fire', 'wildfire', '🔥', [],
    [{ x: 8, y: 1.5, kind: 'bush' }, { x: 9.6, y: 2.25, kind: 'bush' }, { x: 11.2, y: 3, kind: 'bush' }, { x: 12.8, y: 3.75, kind: 'bush' }, { x: 16, y: 2.25, kind: 'bush' }, { x: 10.4, y: 0.5, kind: 'ground' }, { x: 13.6, y: 0.5, kind: 'ground' }],
    [{ x: 14.4, floor: 3, who: 'bear' }, { x: 12.8, floor: 2, who: 'parrot' }],
    [{ kind: 'tree', x: 8, h: 2 }, { kind: 'tree', x: 9.6, h: 3 }, { kind: 'tree', x: 11.2, h: 4 }, { kind: 'tree', x: 12.8, h: 5 }, { kind: 'tree', x: 14.4, h: 4.4 }, { kind: 'tree', x: 16, h: 3 }], { right: 17.4 }),
  scene('giant', 'the Giant Tower', 'giant', '🗼', [GIANT], [win(GIANT, 3, 0), win(GIANT, 5, 1), win(GIANT, 6, 0), win(GIANT, 8, 1), win(GIANT, 9, 0), win(GIANT, 10, 1)],
    [res(GIANT, 4, 1, 'cat'), res(GIANT, 7, 0, 'person'), res(GIANT, 10, 0, 'grandma')], [], { night: true }),
  scene('volcano', 'the Volcano Island', 'volcano', '🌋', [HUT_A, HUT_B], [win(HUT_A, 1, 0), win(HUT_B, 2, 0), { x: 14.6, y: 1.3, kind: 'bush' }, { x: 16.3, y: 2.6, kind: 'bush' }, { x: 13.9, y: 2.5, kind: 'bush' }],
    [res(HUT_A, 2, 0, 'parrot'), res(HUT_B, 1, 0, 'sailor')], [{ kind: 'volcano', x: 16.4, h: 6 }, { kind: 'water', x: 7.2 }, { kind: 'palm', x: 13.9, h: 3.2 }, { kind: 'palm', x: 16.3, h: 3.4 }, { kind: 'bush', x: 14.6 }], { right: 17.6, top: 7.2, night: true }),
] as const satisfies readonly SceneDef[];
export type SceneId = (typeof SCENES)[number]['id'];
export const sceneOf = (id: string): SceneDef => SCENES.find(s => s.id === id) ?? SCENES[0];
export const isSceneId = (x: unknown): x is string => typeof x === 'string' && SCENES.some(s => s.id === x);

// ---------- Star Calls and the Mystery Call: scenes made up from a seed ----------

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}
const hash = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length) % xs.length]!;
export const MAX_HEAT = 3;
const HELPLESS: readonly Who[] = ['cat', 'dog', 'kid', 'person', 'grandma', 'bunny', 'teddy', 'baby', 'parrot', 'monkey'];

/** Every window in a scene's blocks that has nothing in it yet (and isn't the front door). */
function freeWindows(blocks: readonly Block[], fires: readonly FireDef[], rescues: readonly RescueDef[]) {
  const used = (x: number, y: number) => fires.some(f => Math.abs(f.x - x) < 0.3 && Math.abs(f.y - y) < 0.3) || rescues.some(r => Math.abs(r.x - x) < 0.3 && Math.abs(r.floor - 0.5 - y) < 0.3);
  const out: { b: Block; floor: number; col: number }[] = [];
  for (const b of blocks) for (let floor = 1; floor <= b.floors; floor++) for (let col = 0; col < b.cols; col++) {
    if (floor === 1 && !b.base && b.cols > 1 && col === Math.floor(b.cols / 2)) continue; // the door
    const f = win(b, floor, col);
    if (!used(f.x, f.y)) out.push({ b, floor, col });
  }
  return out;
}
function shuffle<T>(r: () => number, xs: T[]) { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [xs[i], xs[j]] = [xs[j]!, xs[i]!]; } return xs; }

/** A Call as a Star Call: the same place, hotter. Each heat adds two fires; the second adds someone to save; the third is at night
 *  and two of its fires come back once after they're put out. The same scene and heat always come out the same. */
export function heated(base: SceneDef, heat: number): SceneDef {
  if (heat <= 0) return base;
  const r = rng(hash(base.id) * 7 + heat), fires: FireDef[] = [...base.fires], rescues: RescueDef[] = [...base.rescues];
  const add = heat * 2;
  if (base.blocks.length) {
    const free = shuffle(r, freeWindows(base.blocks, fires, rescues));
    for (const w of free.splice(0, add)) fires.push(win(w.b, w.floor, w.col));
    if (heat >= 2 && free.length) { const w = free.shift()!; rescues.push(res(w.b, w.floor, w.col, pick(r, HELPLESS))); }
  }
  // fires in the trees and bushes and on the roofs, then on the ground, for what the windows couldn't take
  const spots: FireDef[] = base.props.flatMap(p => p.kind === 'tree' ? [{ x: p.x, y: (p.h ?? 2.4) * 0.75, kind: 'bush' as const }] : p.kind === 'bush' ? [{ x: p.x, y: 0.5, kind: 'bush' as const }] : p.kind === 'palm' ? [{ x: p.x, y: (p.h ?? 3) - 0.6, kind: 'bush' as const }] : [])
    // and on the roofs
    .concat(base.blocks.flatMap(b => Array.from({ length: b.cols }, (_, c) => ({ x: colX(b, c), y: (b.base ?? 0) + b.floors + 0.55, kind: 'bush' as const }))))
    .filter(s => !fires.some(f => Math.hypot(f.x - s.x, f.y - s.y) < 0.8) && !rescues.some(q => Math.hypot(q.x - s.x, q.floor - 0.5 - s.y) < 0.8));
  let need = add - (fires.length - base.fires.length);
  for (const sp of shuffle(r, spots)) { if (need <= 0) break; fires.push(sp); need--; }
  // a small place spreads along the street to make room
  const far = Math.min(19, Math.max(base.right + 2.5, 14)) - 0.8;
  for (let tries = 0; need > 0 && tries < 80; tries++) {
    const x = 8 + r() * (far - 8);
    if (fires.some(f => f.y < 1.2 && Math.abs(f.x - x) < 0.8) || base.blocks.some(b => x > b.x - 0.3 && x < b.x + b.w + 0.3)) continue;
    fires.push({ x, y: 0.5, kind: 'ground' }); need--;
  }
  const out = heat >= MAX_HEAT ? fires.map((f, i) => (i % 3 === 1 ? { ...f, flare: true as const } : f)) : fires;
  const top = Math.max(base.top, topOf(base.blocks, out, rescues)), right = Math.max(base.right, ...out.map(f => f.x + 1));
  return { ...base, fires: out, rescues, top, right, heat, ...(heat >= MAX_HEAT ? { night: true as const } : {}) };
}

export const MYSTERY_ID = 'mystery';
export const MYSTERY_NAME = 'the Mystery Call' as const;
const MYSTERY_LOOKS: readonly Look[] = ['house', 'shop', 'pizza', 'toystore', 'school', 'library', 'museum', 'flats', 'hospital', 'hotel', 'castle', 'tower'];

/** The Mystery Call at a Level: a street made up from the Level, taller, wider and with more fires the higher it goes, at night every
 *  third Level, and with fires that come back from Level 4. The same Level always comes out the same. */
export function mysteryCall(level: number): SceneDef {
  const L = Math.max(1, Math.floor(level)), r = rng(L * 9973 + 17);
  const maxF = Math.min(10, 2 + Math.floor(L * 0.6));
  const count = L < 3 ? 1 : L < 9 ? (r() < 0.6 ? 2 : 1) : r() < 0.5 ? 3 : 2;
  const looks = MYSTERY_LOOKS.slice(0, Math.min(MYSTERY_LOOKS.length, 3 + L));
  const look = pick(r, looks);
  const blocks: Block[] = [];
  let x = 7.8;
  for (let i = 0; i < count; i++) {
    const cols = count === 3 ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3), w = cols * 1.5 + 0.6;
    if (x + w > 18.4) break;
    const floors = Math.max(1, Math.min(maxF, maxF - Math.floor(r() * 3)));
    blocks.push({ x, w, floors, cols });
    x += w + 0.7 + r() * 0.6;
  }
  const fires: FireDef[] = [], rescues: RescueDef[] = [];
  const free = shuffle(r, freeWindows(blocks, [], []));
  const nFires = Math.min(3 + Math.floor(L / 2), 14, Math.max(2, Math.floor(free.length * 0.6)));
  const nRescues = Math.min(1 + Math.floor(L / 3), 5, Math.max(0, free.length - nFires));
  for (const w of free.splice(0, nFires)) fires.push(win(w.b, w.floor, w.col));
  for (const w of free.splice(0, nRescues)) rescues.push(res(w.b, w.floor, w.col, pick(r, HELPLESS)));
  const props: Prop[] = [];
  const end = blocks.length ? blocks[blocks.length - 1]!.x + blocks[blocks.length - 1]!.w : 10;
  if (end < 17 && r() < 0.7) { const tx = end + 1.2, h = 2 + r() * 1.6; props.push({ kind: 'tree', x: tx, h }); fires.push({ x: tx, y: h * 0.75, kind: 'bush' }); }
  const flares = L >= 4 ? Math.min(4, Math.floor(L / 4)) : 0;
  const out = fires.map((f, i) => (i < flares ? { ...f, flare: true as const } : f));
  const right = Math.max(13, ...blocks.map(b => b.x + b.w + 1), ...out.map(f => f.x + 1.4));
  return { id: MYSTERY_ID, name: MYSTERY_NAME, look, badge: '❓', blocks, fires: out, rescues, props, right, top: topOf(blocks, out, rescues), ...(L % 3 === 0 ? { night: true as const } : {}) };
}
