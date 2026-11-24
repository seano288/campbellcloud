// The Crane, the reward he works with his hands, as a model with no drawing in it, so the tests can play it. From the side: the quay on the
// left with a row of containers on it (stacked two high when there are many), the water, and the ship at the quay on the right. A boom
// runs over both. He drags the trolley along the boom (it follows his finger, at the trolley's speed) and taps to lower the grab.
//
// It cannot be failed and has no clock:
// - The grab lowers straight down to whatever is under it. Over a container on the quay with an empty grab, it slides to line up and locks
//   on by itself, then lifts. Carrying, over the ship, it slides to the nearest stack and sets the container down square ("a container set
//   down crooked straightens itself"), then lifts. Over the water or a full stack it stops short, lifts again and nothing happens;
//   carrying over the quay, it keeps hold (nothing goes back, so every lift is a step on).
// - The carried container swings a little when the trolley speeds up or slows down. The swing is only a picture: it is never enough to
//   reach the next stack, so a swinging container never hits anything.
// - The twin grab lifts a stack of two from the quay; over the ship it sets down as many as fit and keeps the rest.
// - When the ship is full its horn sounds and it sails.
//
// Every container carries a syllable. When a row on the ship reads a whole word from left to right, the word is said.
export const STEP = 1 / 60;
/** One column (a container and the gap beside it), a container's height, and the heights of things above the water. */
export const COL = 8, BOX_W = 7.2, BOX_H = 4.6, QUAY_Y = 6, DECK_Y = 3.2, BOOM_Y = 40, REST_Y = 30, SINK_MOST = 2.2;
/** How close the trolley must be to a stack for the grab to line up with it by itself (in columns). */
export const LOCK_RANGE = 0.75;

export interface CraneSpec {
  /** Trolley speed (units a second) and cable speed (lowering and lifting). */
  trolley: number;
  cable: number;
  /** Lifts a stack of two from the quay. */
  twin: boolean;
}
export const BASE_SPEC: CraneSpec = { trolley: 26, cable: 24, twin: false };

export interface ShipShape {
  /** Stacks along the deck, and how many high each one goes. */
  cols: number;
  tiers: number;
}

export interface Box {
  readonly id: number;
  /** The syllable written on it. */
  readonly syl: string;
  /** Which word (index into the go's words) and which syllable of it. */
  readonly word: number;
  readonly part: number;
  where: 'quay' | 'ship' | 'grab';
  col: number;
  tier: number;
}

export type CraneEvent =
  | { t: 'lock'; ids: number[] } | { t: 'place'; ids: number[]; col: number; tier: number }
  | { t: 'empty' } | { t: 'water' } | { t: 'stackFull' } | { t: 'keep' } | { t: 'word'; word: number }
  | { t: 'full' } | { t: 'sailed' } | { t: 'idle' } | { t: 'best'; stack: number };

export type GrabMode = 'rest' | 'lowering' | 'lifting';

export interface Crane {
  readonly spec: CraneSpec;
  readonly ship: ShipShape;
  /** The words loaded this go, each as its syllables. */
  readonly words: readonly (readonly string[])[];
  readonly boxes: Box[];
  /** Quay columns, how many high the quay stacks go, and where things are along the boom. */
  readonly quayCols: number;
  readonly quayTiers: number;
  readonly quayX0: number;
  readonly shipX0: number;
  readonly width: number;
  t: number;
  /** The trolley along the boom, its speed, and where it's heading. */
  x: number;
  vx: number;
  target: number;
  /** The grab's height (its bottom) and what it's doing. */
  y: number;
  mode: GrabMode;
  /** Where it's lowering to, and the column it lined up with. */
  floor: number;
  over: Spot | null;
  /** The swing of whatever hangs from the grab, in radians, and how fast it's swinging. */
  swing: number;
  spin: number;
  /** A tap that came while the trolley was still on its way: lower once it gets there. */
  lowerAt: number | null;
  loaded: number;
  /** How low the ship sits, 0 to SINK_MOST. */
  sink: number;
  phase: 'loading' | 'full' | 'sailing' | 'done';
  /** The ship's offset as it sails away. */
  sail: number;
  /** When he first touched it and when the last container went on (for his quickest loading). */
  firstInput: number | null;
  doneAt: number | null;
  /** The tallest stack he has built this go. */
  tallest: number;
  idleFor: number;
  /** Words already said (word index and the row they were read in). */
  readonly said: Set<string>;
  events: CraneEvent[];
}

export type Spot = { side: 'quay' | 'ship'; col: number } | { side: 'water' };

export interface Input {
  /** Where his finger wants the trolley (world x), or null. */
  to: number | null;
  /** A tap: lower here (world x), or lower where it is (true). */
  lower: number | true | null;
}
export const NO_INPUT: Input = { to: null, lower: null };

// ---------- setting up a go ----------

/** The containers for a go: every syllable of every word, in order, along the quay. */
export function createCrane(spec: CraneSpec, ship: ShipShape, words: readonly (readonly string[])[]): Crane {
  const syls = words.flatMap((w, wi) => w.map((syl, part) => ({ syl, word: wi, part })));
  const n = syls.length;
  // a row along the quay, two high when there are more than six
  const quayTiers = n > 6 ? 2 : 1, quayCols = Math.max(2, Math.ceil(n / quayTiers));
  const quayX0 = 4, quayW = quayCols * COL, gap = 9, shipX0 = quayX0 + quayW + gap + 4;
  const width = shipX0 + ship.cols * COL + 22;
  // fill the quay column by column, bottom first, so the first syllables are nearest the front and on top they read in order too
  const boxes: Box[] = syls.map((s, i) => ({ id: i, ...s, where: 'quay', col: quayTiers === 2 ? Math.floor(i / 2) : i, tier: quayTiers === 2 ? 1 - (i % 2) : 0 }));
  // a column with only one container keeps it on the ground
  for (const b of boxes) if (b.tier === 1 && !boxes.some(o => o !== b && o.col === b.col)) b.tier = 0;
  // when the bottom one is the later syllable the upper one is lifted first, so reading top to bottom is the word's order
  const x0 = quayX0 + COL / 2;
  return {
    spec, ship, words, boxes, quayCols, quayTiers, quayX0, shipX0, width,
    t: 0, x: x0, vx: 0, target: x0, y: REST_Y, mode: 'rest', floor: REST_Y, over: null, swing: 0, spin: 0, lowerAt: null,
    loaded: 0, sink: 0, phase: 'loading', sail: 0, firstInput: null, doneAt: null, tallest: 0, idleFor: 0, said: new Set(), events: [],
  };
}

export const capacity = (s: ShipShape) => s.cols * s.tiers;
export const quayColX = (c: Crane, col: number) => c.quayX0 + col * COL + COL / 2;
export const shipColX = (c: Crane, col: number) => c.shipX0 + col * COL + COL / 2;
export const deckY = (c: Crane) => DECK_Y - c.sink;
/** The trolley's reach: from over the first quay column to over the last ship column. */
export const minX = (c: Crane) => quayColX(c, 0) - COL * 0.6;
export const maxX = (c: Crane) => shipColX(c, c.ship.cols - 1) + COL * 0.6;

const onQuay = (c: Crane, col: number) => c.boxes.filter(b => b.where === 'quay' && b.col === col).sort((a, b) => a.tier - b.tier);
const onShip = (c: Crane, col: number) => c.boxes.filter(b => b.where === 'ship' && b.col === col).sort((a, b) => a.tier - b.tier);
export const held = (c: Crane) => c.boxes.filter(b => b.where === 'grab').sort((a, b) => b.tier - a.tier);

/** What's under a point on the boom: a quay column, a ship column, or the water. */
export function spotAt(c: Crane, x: number): Spot {
  const q = Math.round((x - quayColX(c, 0)) / COL), s = Math.round((x - shipColX(c, 0)) / COL);
  if (q >= 0 && q < c.quayCols && Math.abs(x - quayColX(c, q)) <= COL * LOCK_RANGE) return { side: 'quay', col: q };
  if (s >= 0 && s < c.ship.cols && Math.abs(x - shipColX(c, s)) <= COL * LOCK_RANGE) return { side: 'ship', col: s };
  return { side: 'water' };
}
const spotX = (c: Crane, s: Spot) => (s.side === 'quay' ? quayColX(c, s.col) : s.side === 'ship' ? shipColX(c, s.col) : null);

/** The height the grab's bottom stops at over a spot: the top of the stack there (or of what it carries, resting on it). */
function floorOf(c: Crane, s: Spot): number {
  const carry = held(c).length * BOX_H;
  if (s.side === 'quay') return QUAY_Y + onQuay(c, s.col).length * BOX_H + carry;
  if (s.side === 'ship') return deckY(c) + onShip(c, s.col).length * BOX_H + carry;
  return 1.5 + carry;
}

// ---------- a step ----------

export function stepCrane(c: Crane, input: Input, dt = STEP) {
  c.t += dt;
  if (c.phase === 'sailing' || c.phase === 'full') {
    if (c.phase === 'full' && c.mode === 'rest') { c.phase = 'sailing'; }
    if (c.phase === 'sailing') {
      c.sail += dt * Math.min(18, 2 + c.sail * 1.2);
      if (c.sail > 80) { c.phase = 'done'; c.events.push({ t: 'sailed' }); }
    }
  }
  const touched = input.to !== null || input.lower !== null;
  if (touched) { c.firstInput ??= c.t; c.idleFor = 0; } else if (c.phase === 'loading') {
    c.idleFor += dt;
    if (c.idleFor >= 15) { c.idleFor = 0; c.events.push({ t: 'idle' }); }
  }
  if (c.phase === 'loading') {
    if (input.to !== null && c.mode === 'rest') { c.target = clamp(input.to, minX(c), maxX(c)); c.lowerAt = null; }
    if (input.lower !== null && c.mode === 'rest') {
      // ⬇ while the trolley is still sliding: lower where it's heading
      if (input.lower === true) c.lowerAt = c.target;
      else { c.target = clamp(input.lower, minX(c), maxX(c)); c.lowerAt = c.target; }
    }
  }
  moveTrolley(c, dt);
  moveGrab(c, dt);
  swingOn(c, dt);
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function moveTrolley(c: Crane, dt: number) {
  const before = c.vx;
  if (c.mode !== 'rest') { c.vx = 0; c.spin -= (before / Math.max(4, BOOM_Y - c.y)) * 0.6; return; }
  const d = c.target - c.x, top = c.spec.trolley;
  // ease in and out: speed rises toward the target and falls as it gets close
  const want = clamp(d * 3, -top, top), acc = top * 3;
  c.vx += clamp(want - c.vx, -acc * dt, acc * dt);
  if (Math.abs(d) < 0.05 && Math.abs(c.vx) < 0.5) { c.x = c.target; c.vx = 0; } else c.x += c.vx * dt;
  // what hangs from the cable leans back as the trolley speeds up
  c.spin -= ((c.vx - before) / dt) * dt * 0.012;
  // lower once it gets there (or, should it ever stop short, where it stopped: a tap is never lost)
  if (c.lowerAt !== null && ((Math.abs(c.x - c.lowerAt) < 0.3 && Math.abs(c.vx) < 1.5) || (c.vx === 0 && c.x === c.target))) { c.lowerAt = null; startLowering(c); }
}

function startLowering(c: Crane) {
  const spot = spotAt(c, c.x), x = spotX(c, spot);
  // line up with the stack: the automatic lock
  if (x !== null) { c.x = x; c.target = x; }
  c.vx = 0;
  c.over = spot;
  c.floor = floorOf(c, spot);
  c.mode = 'lowering';
}

function moveGrab(c: Crane, dt: number) {
  if (c.mode === 'lowering') {
    c.y = Math.max(c.floor, c.y - c.spec.cable * dt);
    if (c.y <= c.floor + 1e-6) arrive(c);
  } else if (c.mode === 'lifting') {
    c.y = Math.min(REST_Y, c.y + c.spec.cable * dt);
    if (c.y >= REST_Y) { c.mode = 'rest'; if (c.phase === 'loading' && c.loaded === capacity(c.ship)) full(c); }
  }
}

function arrive(c: Crane) {
  const spot = c.over!, carrying = held(c);
  c.mode = 'lifting';
  if (spot.side === 'water') { c.events.push({ t: 'water' }); return; }
  if (!carrying.length) {
    if (spot.side === 'ship') { c.events.push({ t: 'empty' }); return; }
    const stack = onQuay(c, spot.col);
    if (!stack.length) { c.events.push({ t: 'empty' }); return; }
    // the top one, or the top two with the twin grab
    const take = stack.slice(c.spec.twin ? -2 : -1);
    take.forEach((b, i) => { b.where = 'grab'; b.tier = i; });
    c.swing = 0; c.spin = 0;
    c.events.push({ t: 'lock', ids: take.map(b => b.id) });
    return;
  }
  // carrying over the quay: it keeps hold, so nothing goes back and every lift is a step on
  if (spot.side === 'quay') { c.events.push({ t: 'keep' }); return; }
  // over the ship: set down as many as fit, bottom one first
  const lowest = [...carrying].sort((a, b) => a.tier - b.tier);
  const stack = onShip(c, spot.col);
  const room = c.ship.tiers - stack.length;
  if (room <= 0) { c.events.push({ t: 'stackFull' }); return; }
  const put = lowest.slice(0, room);
  put.forEach((b, i) => { b.where = 'ship'; b.col = spot.col; b.tier = stack.length + i; });
  held(c).forEach((b, i) => { b.tier = i; });
  c.swing = 0; c.spin = 0;
  c.loaded = c.boxes.filter(b => b.where === 'ship').length;
  c.sink = SINK_MOST * c.loaded / capacity(c.ship);
  const high = onShip(c, spot.col).length;
  if (high > c.tallest) c.tallest = high;
  c.events.push({ t: 'place', ids: put.map(b => b.id), col: spot.col, tier: stack.length });
  readWords(c);
}

function full(c: Crane) {
  c.phase = 'full';
  c.doneAt = c.t;
  c.events.push({ t: 'full' });
}

/** A row on the ship that reads a whole word, left to right, is said (once for each place it's built). */
function readWords(c: Crane) {
  for (let tier = 0; tier < c.ship.tiers; tier++) {
    const row = Array.from({ length: c.ship.cols }, (_, col) => c.boxes.find(b => b.where === 'ship' && b.col === col && b.tier === tier) ?? null);
    for (let col = 0; col < row.length; col++) {
      for (const [wi, w] of c.words.entries()) {
        if (w.length < 2 || col + w.length > row.length) continue;
        if (!w.every((s, k) => row[col + k]?.syl === s)) continue;
        const key = `${wi}:${tier}:${col}`;
        if (c.said.has(key)) continue;
        c.said.add(key);
        c.events.push({ t: 'word', word: wi });
      }
    }
  }
}

/** The swing: a damped pendulum, pushed by the trolley, and small enough that it never reaches the next stack. */
export const MOST_SWING = 0.22;
function swingOn(c: Crane, dt: number) {
  const len = Math.max(4, BOOM_Y - c.y);
  c.spin += (-9.8 / len) * Math.sin(c.swing) * dt * 6;
  c.spin *= Math.pow(c.mode === 'rest' ? 0.35 : 0.02, dt);
  c.swing = clamp(c.swing + c.spin * dt, -MOST_SWING, MOST_SWING);
  if (Math.abs(c.swing) >= MOST_SWING) c.spin *= -0.4;
}

export function takeEvents(c: Crane): CraneEvent[] {
  const e = c.events;
  c.events = [];
  return e;
}

/** How long the loading took, from his first touch to the last container on. */
export const loadingTime = (c: Crane) => (c.doneAt !== null && c.firstInput !== null ? c.doneAt - c.firstInput : null);

// ---------- scripted children, for the tests ----------

export type Child = (c: Crane, rng: () => number) => Input;

/** Waits, then goes to the next container on the quay, lowers, carries it to the next free stack on the ship (left to right, bottom up),
 *  lowers. Reads words in order, as a careful child would. */
export const carefulChild: Child = c => {
  if (c.mode !== 'rest' || c.lowerAt !== null || c.phase !== 'loading') return NO_INPUT;
  const carrying = held(c);
  if (!carrying.length) {
    const next = c.boxes.filter(b => b.where === 'quay').sort((a, b) => a.id - b.id)[0];
    if (!next) return NO_INPUT;
    return { to: null, lower: quayColX(c, next.col) };
  }
  // the first stack with room, filling each row before the next so rows read as words
  for (let tier = 0; tier < c.ship.tiers; tier++) for (let col = 0; col < c.ship.cols; col++) {
    if (onShip(c, col).length === tier) return { to: null, lower: shipColX(c, col) };
  }
  return NO_INPUT;
};

/** Taps anywhere along the boom every second or two, and sometimes drags about instead. */
export const clumsyChild: Child = (c, rng) => {
  if (c.mode !== 'rest' || c.lowerAt !== null || rng() > 0.03) return NO_INPUT;
  const x = minX(c) + rng() * (maxX(c) - minX(c)), k = rng();
  return k < 0.3 ? { to: x, lower: null } : k < 0.4 ? { to: null, lower: true } : { to: null, lower: x };
};

/** Plays a whole go with a scripted child; stops at `most` seconds. */
export function playWith(c: Crane, child: Child, rng: () => number, most = 600): Crane {
  while (c.phase !== 'done' && c.t < most) stepCrane(c, child(c, rng));
  return c;
}
