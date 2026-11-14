// The questions, made to fit the map: each map is generated around its question, so exactly one thing (or square, or map) answers
// it. A question never names a kind of thing that is on the map twice ("the palm tree" means there is one palm tree), compass and
// position questions never depend on a diagonal (the answer is in the same row or column, and it's the only thing anywhere on that
// side), and Follow the Clues always ends on a square that is on the map and holds nothing.
//
// Five kinds, three Levels each (the table in .scratch/treasure-fleet/spec.md). Stretch grows a question inside its Level: more
// things on the map, longer clues.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import {
  CARDINALS, cells, cellId, inside, isRiver, LAND_SYMS, letterOf, onSide, RHYMING, same, SIDES, STEP, thingAt,
  type Cardinal, type Cell, type IsleMap, type KeySym, type Rel, type Sym, type Thing,
} from './map';

export type Level = 1 | 2 | 3;
export type Kind = 'where' | 'key' | 'grid' | 'clue' | 'above';
/** The compass rose: not shown, shown with the asked direction lit, or shown plain. */
export type RoseShow = 'none' | 'lit' | 'plain';

export interface WhereSide { kind: 'where'; form: 'side'; map: IsleMap; ref: Thing; rel: Rel; answer: Thing; rose: RoseShow }
export interface WhereBetween { kind: 'where'; form: 'between'; map: IsleMap; a: Thing; b: Thing; answer: Thing; rose: RoseShow }
export interface WhereFurthest { kind: 'where'; form: 'furthest'; map: IsleMap; dir: Cardinal; answer: Thing; rose: RoseShow }
export type WhereProblem = WhereSide | WhereBetween | WhereFurthest;

/** The kinds a counting question asks about: the ones that look alike enough to count. */
export const COUNT_SYMS = ['palm', 'hut', 'rock', 'hill'] as const satisfies readonly Sym[];
export type CountSym = (typeof COUNT_SYMS)[number];
export interface KeySymbol { kind: 'key'; form: 'symbol'; map: IsleMap; key: KeySym[]; ask: KeySym; rose: RoseShow }
export interface KeyFind { kind: 'key'; form: 'find'; map: IsleMap; key: KeySym[]; ask: Sym; answer: Thing; rose: RoseShow }
export interface KeyCount { kind: 'key'; form: 'count'; map: IsleMap; key: KeySym[]; ask: CountSym; count: number; choices: number[]; rose: RoseShow }
export interface KeyRiver { kind: 'key'; form: 'river'; map: IsleMap; key: KeySym[]; dir: 'east' | 'west'; answer: Thing; rose: RoseShow }
export type KeyProblem = KeySymbol | KeyFind | KeyCount | KeyRiver;

export interface GridTap { kind: 'grid'; form: 'tap'; map: IsleMap; target: Cell; rose: RoseShow }
export interface GridWhich { kind: 'grid'; form: 'which'; map: IsleMap; thing: Thing; choices: Cell[]; answer: number; rose: RoseShow }
export type GridProblem = GridTap | GridWhich;

export type Clue = { readonly dir: Cardinal; readonly n: number } | { readonly dir: Cardinal; readonly to: Thing };
export interface ClueProblem { kind: 'clue'; map: IsleMap; start: Cell; clues: Clue[]; end: Cell; rose: RoseShow }

/** From Above: a little scene from the side (only its left-to-right order shows), and maps of it from above to pick from. */
export interface AboveProblem { kind: 'above'; scene: Thing[]; options: IsleMap[]; answer: number; rose: RoseShow }

export type Question = WhereProblem | KeyProblem | GridProblem | ClueProblem | AboveProblem;

/** How an answer is written: a square tapped, a key entry, a number, or one of the choices. */
export const at = (c: Cell) => `at:${c.x},${c.y}`;
export const keyAnswer = (s: KeySym) => `key:${s}`;
export const numAnswer = (n: number) => `n:${n}`;
export const pickAnswer = (i: number) => `pick:${i}`;
export function readAt(answer: string): Cell | null {
  const m = /^at:(\d+),(\d+)$/.exec(answer);
  return m ? { x: Number(m[1]), y: Number(m[2]) } : null;
}

// ---------- making maps ----------

const TRIES = 400;
const free = (m: { w: number; h: number; river: number | null }, taken: readonly Cell[], ok: (c: Cell) => boolean = () => true) =>
  cells(m.w, m.h).filter(c => !isRiver(m, c) && !taken.some(t => same(t, c)) && ok(c));

/** Puts each symbol on its own free square that `ok` allows; null if there's no room. */
function scatter(rng: Rng, m: { w: number; h: number; river: number | null }, taken: readonly Thing[], syms: readonly Sym[], ok?: (c: Cell) => boolean): Thing[] | null {
  const out = [...taken];
  for (const sym of syms) {
    const room = free(m, out, ok);
    if (!room.length) return null;
    out.push({ ...pick(rng, room), sym });
  }
  return out.slice(taken.length);
}

const make = <T,>(f: () => T | null): T => {
  for (let i = 0; i < TRIES; i++) { const q = f(); if (q) return q; }
  throw new Error('Could not make a question');
};

// ---------- Where Is It ----------

const WHERE_W = 5, WHERE_H = 4;
/** How many things on the map: more as Stretch grows. */
const crowd = (stretch: Stretch, base: number) => base + stretch;

/** "What is left of the palm tree?": the answer in line with the palm tree, and nothing else anywhere on that side. */
export function makeSide(rel: Rel, rose: RoseShow, stretch: Stretch, rng: Rng): WhereSide {
  return make(() => {
    const [dx, dy] = STEP[rel], w = WHERE_W, h = WHERE_H;
    const ref = { x: int(rng, 0, w - 1), y: int(rng, 0, h - 1) };
    const room = dx < 0 ? ref.x : dx > 0 ? w - 1 - ref.x : dy < 0 ? ref.y : h - 1 - ref.y;
    if (room < 1) return null;
    const d = int(rng, 1, Math.min(room, 3)), spot = { x: ref.x + dx * d, y: ref.y + dy * d };
    const [refSym, ansSym, ...rest] = shuffle(rng, LAND_SYMS);
    const map0 = { w, h, river: null };
    const fixed: Thing[] = [{ ...ref, sym: refSym! }, { ...spot, sym: ansSym! }];
    // most maps have a thing on the other side in the same line, the one a left/right mix-up taps
    const mirror = { x: ref.x - dx * int(rng, 1, 2), y: ref.y - dy * int(rng, 1, 2) };
    const others: Thing[] = [];
    if (inside(map0, mirror) && rng() < .75) others.push({ ...mirror, sym: rest.shift()! });
    const more = scatter(rng, map0, [...fixed, ...others], rest.slice(0, crowd(stretch, 3) - 2 - others.length), c => !onSide(ref, rel, c));
    if (!more) return null;
    return { kind: 'where', form: 'side', map: { ...map0, things: [...fixed, ...others, ...more] }, ref: fixed[0]!, rel, answer: fixed[1]!, rose };
  });
}

/** "What is between the hut and the cave?": in line between them, and nothing else anywhere between them. */
export function makeBetween(stretch: Stretch, rng: Rng): WhereBetween {
  return make(() => {
    const w = WHERE_W, h = WHERE_H, across = rng() < .6;
    const len = across ? w : h, gap = int(rng, 2, Math.min(4, len - 1)), lo = int(rng, 0, len - 1 - gap), mid = lo + int(rng, 1, gap - 1);
    const line = across ? int(rng, 0, h - 1) : int(rng, 0, w - 1);
    const c = (k: number) => (across ? { x: k, y: line } : { x: line, y: k });
    const [s1, s2, s3, ...rest] = shuffle(rng, LAND_SYMS);
    const a: Thing = { ...c(lo), sym: s1! }, b: Thing = { ...c(lo + gap), sym: s2! }, answer: Thing = { ...c(mid), sym: s3! };
    const map0 = { w, h, river: null };
    const between = (q: Cell) => { const k = across ? q.x : q.y; return k > lo && k < lo + gap; };
    const more = scatter(rng, map0, [a, b, answer], rest.slice(0, crowd(stretch, 2)), q => !between(q));
    if (!more) return null;
    return { kind: 'where', form: 'between', map: { ...map0, things: [a, b, answer, ...more] }, a, b, answer, rose: 'plain' };
  });
}

/** "What is furthest north?": one thing is nearer that edge than everything else, by at least a square. */
export function makeFurthest(dir: Cardinal, stretch: Stretch, rng: Rng): WhereFurthest {
  return make(() => {
    const w = WHERE_W, h = WHERE_H, [dx, dy] = STEP[dir], map0 = { w, h, river: null };
    const depth = (c: Cell) => (dx ? c.x * dx : c.y * dy); // bigger is further that way
    const syms = shuffle(rng, LAND_SYMS).slice(0, crowd(stretch, 3));
    const answer: Thing = { ...pick(rng, cells(w, h)), sym: syms[0]! };
    const more = scatter(rng, map0, [answer], syms.slice(1), c => depth(c) < depth(answer));
    if (!more) return null;
    return { kind: 'where', form: 'furthest', map: { ...map0, things: [answer, ...more] }, dir, answer, rose: 'plain' };
  });
}

export function makeWhere(level: Level, stretch: Stretch, rng: Rng): WhereProblem {
  if (level === 1) return makeSide(pick(rng, SIDES), 'none', stretch, rng);
  if (level === 2) return makeSide(pick(rng, CARDINALS), 'lit', stretch, rng);
  const r = rng();
  if (r < .4) return makeSide(pick(rng, CARDINALS), 'plain', stretch, rng);
  if (r < .7) return makeBetween(stretch, rng);
  return makeFurthest(pick(rng, CARDINALS), stretch, rng);
}

// ---------- Map Key ----------

const KEY_W = 6, KEY_H = 4;
/** The key lists every kind on the map, in one fixed order, so the same symbol is always in the same place. */
const KEY_ORDER: readonly KeySym[] = ['palm', 'hut', 'cave', 'hill', 'rock', 'dock', 'river', 'bridge'];
export const keyOf = (m: IsleMap): KeySym[] => KEY_ORDER.filter(s => (s === 'river' ? m.river !== null : m.things.some(t => t.sym === s)));

/** A river down a middle column with a bridge or two across it. */
function withRiver(rng: Rng, w: number, h: number, bridges: number): { w: number; h: number; river: number; things: Thing[] } {
  const river = int(rng, 1, w - 2);
  const ys = shuffle(rng, Array.from({ length: h }, (_, y) => y)).slice(0, bridges);
  return { w, h, river, things: ys.map(y => ({ x: river, y, sym: 'bridge' as const })) };
}

/** Level 1: "Tap the symbol that means bridge", in the key. */
export function makeKeySymbol(stretch: Stretch, rng: Rng): KeySymbol {
  return make(() => {
    const river = rng() < .5, base = river ? withRiver(rng, KEY_W, KEY_H, 1) : { w: KEY_W, h: KEY_H, river: null, things: [] as Thing[] };
    const kinds = shuffle(rng, LAND_SYMS).slice(0, crowd(stretch, river ? 2 : 3));
    const extra = shuffle(rng, kinds).slice(0, 1 + stretch); // some kinds twice, as on a real map
    const more = scatter(rng, base, base.things, [...kinds, ...extra]);
    if (!more) return null;
    const map: IsleMap = { ...base, things: [...base.things, ...more] };
    return { kind: 'key', form: 'symbol', map, key: keyOf(map), ask: pick(rng, keyOf(map)), rose: 'none' };
  });
}

/** Level 2: "Tap the bridge on the map": the one thing of that kind. */
export function makeKeyFind(stretch: Stretch, rng: Rng): KeyFind {
  return make(() => {
    const river = rng() < .5, base = river ? withRiver(rng, KEY_W, KEY_H, 1) : { w: KEY_W, h: KEY_H, river: null, things: [] as Thing[] };
    const kinds = shuffle(rng, LAND_SYMS).slice(0, crowd(stretch, 3));
    const pool: Sym[] = [...kinds, ...(river ? ['bridge' as const] : [])];
    const ask = pick(rng, pool), twice = kinds.filter(k => k !== ask).slice(0, 1 + Math.min(stretch, 1));
    const more = scatter(rng, base, base.things, [...kinds, ...twice]);
    if (!more) return null;
    const map: IsleMap = { ...base, things: [...base.things, ...more] };
    const answer = map.things.find(t => t.sym === ask)!;
    return { kind: 'key', form: 'find', map, key: keyOf(map), ask, answer, rose: 'none' };
  });
}

/** Level 3: "How many huts are there?", three numbers to pick from. */
export function makeKeyCount(stretch: Stretch, rng: Rng): KeyCount {
  return make(() => {
    const ask = pick(rng, COUNT_SYMS), count = int(rng, 2, 3 + stretch);
    const others = shuffle(rng, LAND_SYMS.filter(s => s !== ask)).slice(0, 2 + (stretch > 0 ? 1 : 0));
    const base = { w: KEY_W, h: KEY_H, river: null };
    const more = scatter(rng, base, [], [...Array.from({ length: count }, () => ask), ...others, ...(rng() < .5 ? [others[0]!] : [])]);
    if (!more) return null;
    const map: IsleMap = { ...base, things: more };
    return { kind: 'key', form: 'count', map, key: keyOf(map), ask, count, choices: [count - 1, count, count + 1], rose: 'none' };
  });
}

/** Level 3: "What is east of the river?": one thing on that side of it, everything else on the other. */
export function makeKeyRiver(stretch: Stretch, rng: Rng): KeyRiver {
  return make(() => {
    const base = withRiver(rng, KEY_W, KEY_H, int(rng, 1, 2)), dir = pick(rng, ['east', 'west'] as const), sign = dir === 'east' ? 1 : -1;
    const [ans, ...rest] = shuffle(rng, LAND_SYMS);
    const spot = free(base, base.things, c => (c.x - base.river) * sign > 0);
    if (!spot.length) return null;
    const answer: Thing = { ...pick(rng, spot), sym: ans! };
    const more = scatter(rng, base, [...base.things, answer], rest.slice(0, crowd(stretch, 2)), c => (c.x - base.river) * sign < 0);
    if (!more) return null;
    const map: IsleMap = { ...base, things: [...base.things, answer, ...more] };
    return { kind: 'key', form: 'river', map, key: keyOf(map), dir, answer, rose: 'plain' };
  });
}

export function makeKey(level: Level, stretch: Stretch, rng: Rng): KeyProblem {
  if (level === 1) return makeKeySymbol(stretch, rng);
  if (level === 2) return makeKeyFind(stretch, rng);
  return rng() < .5 ? makeKeyCount(stretch, rng) : makeKeyRiver(stretch, rng);
}

// ---------- Grid Square ----------

/** "Tap B2": 3 by 3 at Level 1, 5 by 5 at Level 2. A few things stand on the map, as on any map. */
export function makeGridTap(size: 3 | 5, stretch: Stretch, rng: Rng): GridTap {
  return make(() => {
    const base = { w: size, h: size, river: null };
    const things = scatter(rng, base, [], shuffle(rng, LAND_SYMS).slice(0, size === 3 ? 2 : 3 + stretch));
    if (!things) return null;
    return { kind: 'grid', form: 'tap', map: { ...base, things }, target: pick(rng, cells(size, size)), rose: 'none' };
  });
}

/**
 * "Which square is the cave in?" with three squares to pick from. Two different rhyming letters (B, C, D, E) are never rivals: the
 * other choices share the right letter, or use A.
 */
export function makeGridWhich(stretch: Stretch, rng: Rng): GridWhich {
  return make(() => {
    const size = 5, base = { w: size, h: size, river: null };
    const syms = shuffle(rng, LAND_SYMS).slice(0, 3 + stretch);
    const things = scatter(rng, base, [], syms);
    if (!things) return null;
    const thing = things[0]!, letter = letterOf(thing.x);
    // the columns a rival may use: its own, and one other that doesn't rhyme with it
    const otherCol = RHYMING.includes(letter) ? 0 : pick(rng, [1, 2, 3, 4]);
    const pool = cells(size, size).filter(c => !same(c, thing) && (c.x === thing.x || c.x === otherCol));
    const sameCol = pool.filter(c => c.x === thing.x), otherColCells = pool.filter(c => c.x !== thing.x);
    // one rival in the same column (the number tells them apart), one in the other column with the same number when it can
    const r1 = pick(rng, sameCol), r2 = otherColCells.find(c => c.y === thing.y && rng() < .7) ?? pick(rng, otherColCells.filter(c => !same(c, r1)));
    if (!r1 || !r2) return null;
    const choices = shuffle(rng, [thing, r1, r2].map(c => ({ x: c.x, y: c.y })));
    return { kind: 'grid', form: 'which', map: { ...base, things }, thing, choices, answer: choices.findIndex(c => same(c, thing)), rose: 'none' };
  });
}

export function makeGrid(level: Level, stretch: Stretch, rng: Rng): GridProblem {
  if (level === 1) return makeGridTap(3, stretch, rng);
  if (level === 2) return makeGridTap(5, stretch, rng);
  return makeGridWhich(stretch, rng);
}

// ---------- Follow the Clues ----------

const CLUE_W = 6, CLUE_H = 5;
/** Where a clue takes him from `from`: the squares walked, last one where it stops. Null if it leaves the map. */
export function walk(m: IsleMap, from: Cell, clue: Clue): Cell[] | null {
  const [dx, dy] = STEP[clue.dir], out: Cell[] = [];
  let c = from;
  if ('n' in clue) {
    for (let i = 0; i < clue.n; i++) { c = { x: c.x + dx, y: c.y + dy }; if (!inside(m, c)) return null; out.push(c); }
    return out;
  }
  // a landmark: on until he reaches it; it must be the first thing that way
  for (;;) {
    c = { x: c.x + dx, y: c.y + dy };
    if (!inside(m, c)) return null;
    out.push(c);
    const t = thingAt(m, c);
    if (t) return same(t, clue.to) ? out : null;
  }
}
/** Every clue in turn from the start: the squares of each leg. Null if any clue can't be followed. */
export function legsOf(q: Pick<ClueProblem, 'map' | 'start' | 'clues'>): Cell[][] | null {
  let c = q.start;
  const legs: Cell[][] = [];
  for (const clue of q.clues) { const leg = walk(q.map, c, clue); if (!leg) return null; legs.push(leg); c = leg.at(-1)!; }
  return legs;
}

/** One clue at Level 1, two at Level 2, three at Level 3 with one of them a landmark ("Go east to the hut"), never the last. */
export function makeClue(level: Level, stretch: Stretch, rng: Rng): ClueProblem {
  return make(() => {
    const w = CLUE_W, h = CLUE_H, n = level, landmarkAt = level === 3 ? int(rng, 0, 1) : -1, most = level === 1 ? 2 + stretch : 2 + Math.min(stretch, 1);
    const start = { x: int(rng, 0, w - 1), y: int(rng, 0, h - 1) };
    const syms = shuffle(rng, LAND_SYMS);
    let c = start, lastAxis: 'x' | 'y' | null = null;
    const steps: { dir: Cardinal; n: number }[] = [], path: Cell[] = [start];
    for (let i = 0; i < n; i++) {
      // each clue turns: a clue that went back the way it came would only confuse
      const dirs = CARDINALS.filter(d => (STEP[d][0] ? 'x' : 'y') !== lastAxis);
      const dir = pick(rng, dirs), [dx, dy] = STEP[dir], k = int(rng, i === landmarkAt ? 2 : 1, i === landmarkAt ? 3 : most);
      for (let j = 0; j < k; j++) { c = { x: c.x + dx, y: c.y + dy }; if (!inside({ w, h }, c) || path.some(p => same(p, c))) return null; path.push(c); }
      steps.push({ dir, n: k });
      lastAxis = STEP[dir][0] ? 'x' : 'y';
    }
    const end = c, things: Thing[] = [];
    const clues: Clue[] = steps.map((s, i) => {
      if (i !== landmarkAt) return s;
      const leg = path.slice(1 + steps.slice(0, i).reduce((a, b) => a + b.n, 0)), stop = leg[s.n - 1]!;
      const to: Thing = { ...stop, sym: syms.shift()! };
      things.push(to);
      return { dir: s.dir, to };
    });
    // the rest stand off the path, and never where a landmark leg would meet them first
    const more = scatter(rng, { w, h, river: null }, [...things, ...path.map(p => ({ ...p, sym: 'rock' as const }))], syms.slice(0, 2 + stretch));
    if (!more) return null;
    const q: ClueProblem = { kind: 'clue', map: { w, h, river: null, things: [...things, ...more] }, start, clues, end, rose: 'plain' };
    const legs = legsOf(q);
    if (!legs || !same(legs.at(-1)!.at(-1)!, end) || thingAt(q.map, end) || same(end, start)) return null;
    return q;
  });
}

// ---------- From Above ----------

const ABOVE_W = 5, ABOVE_H = 3;
/** What can be drawn from the side as well as from above. */
export const SCENE_SYMS = ['palm', 'hut', 'cave', 'hill', 'rock'] as const satisfies readonly Sym[];
/** What the side view shows: the things from left to right. */
export const orderOf = (things: readonly Thing[]) => [...things].sort((a, b) => a.x - b.x).map(t => t.sym).join(' ');

function layout(rng: Rng, things: readonly { x: number; sym: Sym }[], flat: boolean): IsleMap {
  return { w: ABOVE_W, h: ABOVE_H, river: null, things: things.map(t => ({ x: t.x, sym: t.sym, y: flat ? 1 : int(rng, 0, ABOVE_H - 1) })) };
}

/**
 * Level 1: two maps, very different (other things, in another order). Level 2: three maps, the others in another order or with one
 * thing changed. Level 3: three maps where only one thing has moved.
 */
export function makeAbove(level: Level, stretch: Stretch, rng: Rng): AboveProblem {
  return make(() => {
    const n = level === 3 && stretch === 2 ? 4 : 3;
    const syms = shuffle(rng, SCENE_SYMS).slice(0, n), cols = shuffle(rng, [0, 1, 2, 3, 4]).slice(0, n).sort((a, b) => a - b);
    const scene: Thing[] = syms.map((sym, i) => ({ x: cols[i]!, y: 1, sym }));
    const right = layout(rng, scene, level === 1);
    const wrong: IsleMap[] = [];
    if (level === 1) {
      const others = shuffle(rng, SCENE_SYMS.filter(s => !syms.includes(s)));
      const mixed = shuffle(rng, [...others, ...syms.slice(0, 1)]).slice(0, n);
      wrong.push(layout(rng, mixed.map((sym, i) => ({ x: [...cols].reverse()[i]!, sym })), true));
    } else if (level === 2) {
      const reordered = shuffle(rng, syms);
      wrong.push(layout(rng, reordered.map((sym, i) => ({ x: cols[i]!, sym })), false));
      const swapIn = pick(rng, SCENE_SYMS.filter(s => !syms.includes(s))), k = int(rng, 0, n - 1);
      wrong.push(layout(rng, scene.map((t, i) => ({ x: t.x, sym: i === k ? swapIn : t.sym })), false));
    } else {
      for (let tries = 0; wrong.length < 2 && tries < 30; tries++) {
        const k = int(rng, 0, n - 1), to = pick(rng, [0, 1, 2, 3, 4].filter(x => !scene.some(t => t.x === x)));
        const moved = scene.map((t, i) => ({ x: i === k ? to : t.x, sym: t.sym }));
        const key = orderOf(moved as Thing[]);
        if (key !== orderOf(scene) && !wrong.some(m => orderOf(m.things) === key)) wrong.push(layout(rng, moved, false));
      }
      if (wrong.length < 2) return null;
    }
    if (wrong.some(m => orderOf(m.things) === orderOf(scene))) return null;
    const options = shuffle(rng, [right, ...wrong]);
    return { kind: 'above', scene, options, answer: options.indexOf(right), rose: 'none' };
  });
}

// ---------- any kind ----------

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  switch (kind) {
    case 'where': return makeWhere(level, stretch, rng);
    case 'key': return makeKey(level, stretch, rng);
    case 'grid': return makeGrid(level, stretch, rng);
    case 'clue': return makeClue(level, stretch, rng);
    case 'above': return makeAbove(level, stretch, rng);
  }
}

/** Does this question use the compass (so he meets it first)? */
export const usesCompass = (q: Question) => q.rose !== 'none' || q.kind === 'clue';

/** The one right answer, written the way the screen sends it. */
export function rightAnswer(q: Question): string {
  switch (q.kind) {
    case 'where': return at(q.answer);
    case 'key': return q.form === 'symbol' ? keyAnswer(q.ask) : q.form === 'count' ? numAnswer(q.count) : at(q.answer);
    case 'grid': return q.form === 'tap' ? at(q.target) : pickAnswer(q.answer);
    case 'clue': return at(q.end);
    case 'above': return pickAnswer(q.answer);
  }
}

/** Is it an answer at all? A tap on empty sea in Where Is It isn't; any square is, in Grid Square and Follow the Clues. */
export function isAnswer(q: Question, answer: string): boolean {
  const c = readAt(answer);
  if (c) {
    if (!inside(q.kind === 'above' ? { w: 0, h: 0 } : q.map, c)) return false;
    if (q.kind === 'grid' && q.form === 'tap') return true;
    if (q.kind === 'clue') return true;
    return (q.kind === 'where' || (q.kind === 'key' && (q.form === 'find' || q.form === 'river'))) && !!thingAt(q.map, c);
  }
  if (answer.startsWith('key:')) return q.kind === 'key' && q.form === 'symbol' && q.key.includes(answer.slice(4) as KeySym);
  if (answer.startsWith('n:')) return q.kind === 'key' && q.form === 'count' && q.choices.includes(Number(answer.slice(2)));
  const p = /^pick:(\d+)$/.exec(answer);
  if (p) return (q.kind === 'above' && Number(p[1]) < q.options.length) || (q.kind === 'grid' && q.form === 'which' && Number(p[1]) < q.choices.length);
  return false;
}

export { cellId };
