// The sixteen Calls, getting taller and stranger. Plain data in world units: the ground is y = 0, a floor is 1 high, his truck parks
// at the left with its nozzle at about x = 4.6, and the scene stands to its right. A fire or a rescue "on floor n" sits in that
// floor's window, centred at y = n - 0.5. The first four can be finished with the starter parts; the rest need a stronger Pump or
// a longer Ladder for some of it, and what he can't reach yet the helpers finish while he's told which part would reach it.

export type Look = 'bin' | 'house' | 'barn' | 'car' | 'forest' | 'shop' | 'school' | 'treehouse' | 'ship' | 'flats' | 'castle' | 'airport' | 'lighthouse' | 'hotel' | 'tower' | 'rocket';
export type FireKind = 'window' | 'bush' | 'ground';
export type Who = 'person' | 'cat' | 'dog' | 'kid' | 'king' | 'sailor' | 'pilot' | 'keeper' | 'astronaut' | 'grandma';

export interface FireDef { readonly x: number; readonly y: number; readonly kind: FireKind }
export interface RescueDef { readonly x: number; readonly floor: number; readonly who: Who }
/** Things drawn in the scene that aren't a block of windows: a tree a cat is stuck in, a car, a plane. */
export interface Prop { readonly kind: 'tree' | 'bin' | 'car' | 'plane' | 'rocket' | 'bush' | 'water' | 'lamp'; readonly x: number; readonly h?: number }
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
}

const colX = (b: Block, c: number) => b.x + (c + 0.5) * (b.w / b.cols);
const win = (b: Block, floor: number, col: number): FireDef => ({ x: colX(b, col), y: (b.base ?? 0) + floor - 0.5, kind: 'window' });
const res = (b: Block, floor: number, col: number, who: Who): RescueDef => ({ x: colX(b, col), floor: (b.base ?? 0) + floor, who });

function scene<const I extends string, const N extends string>(id: I, name: N, look: Look, badge: string, blocks: Block[], fires: FireDef[], rescues: RescueDef[], props: Prop[], more: { right?: number; top?: number; night?: true } = {}): SceneDef & { readonly id: I; readonly name: N } {
  const right = more.right ?? Math.max(...blocks.map(b => b.x + b.w), ...fires.map(f => f.x + 1)) + 1;
  const top = more.top ?? Math.max(3, ...blocks.map(b => (b.base ?? 0) + b.floors + 1), ...fires.map(f => f.y + 1.5), ...rescues.map(r => r.floor + 1));
  return { id, name, look, badge, blocks, fires, rescues, props, right, top, ...(more.night ? { night: true as const } : {}) };
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
] as const satisfies readonly SceneDef[];
export type SceneId = (typeof SCENES)[number]['id'];
export const sceneOf = (id: string): SceneDef => SCENES.find(s => s.id === id) ?? SCENES[0];
export const isSceneId = (x: unknown): x is string => typeof x === 'string' && SCENES.some(s => s.id === x);
