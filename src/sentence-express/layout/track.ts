// His Layout: a table-top grid of squares. A square of track is just which of its four sides it joins (north, east, south, west),
// so straights, corners, points and crossings are worked out from what he draws, never picked. He lays track by dragging a finger
// across squares; when he lifts it, a loose end is closed up by itself (the shortest way to other track through empty squares), so
// the train always has somewhere to go. If there's no way round, the end gets a turnaround loop and the train comes back.
//
// Points: a square that joins three sides has a straight way through and a branch; tapping it switches which way the train goes.
// Stations sit on straight track; scenery on an empty square (a tunnel, a bridge or a level crossing on a straight).

import { SCENERY } from '../shed/catalogue';

export const N = 1, E = 2, S = 4, W = 8;
export type Dir = 1 | 2 | 4 | 8;
export const DIRS: readonly Dir[] = [N, E, S, W];
export const opposite = (d: Dir): Dir => (((d << 2) | (d >> 2)) & 15) as Dir;
export const DX: Record<Dir, number> = { 1: 0, 2: 1, 4: 0, 8: -1 };
export const DY: Record<Dir, number> = { 1: -1, 2: 0, 4: 1, 8: 0 };
export const bits = (m: number) => DIRS.filter(d => m & d);
export const count = (m: number) => bits(m).length;

export interface Placed<T extends string = string> { readonly id: T; readonly cell: number }
export interface Layout {
  readonly w: number;
  readonly h: number;
  /** For each square, the sides it joins (0: no track). */
  readonly cells: readonly number[];
  /** For each square with points, which way they're set (0 or 1). */
  readonly points: readonly number[];
  readonly stations: readonly Placed[];
  readonly scenery: readonly Placed[];
}

export const cellAt = (l: Pick<Layout, 'w' | 'h'>, x: number, y: number) => (x >= 0 && y >= 0 && x < l.w && y < l.h ? y * l.w + x : -1);
export const xyOf = (l: Pick<Layout, 'w'>, c: number) => ({ x: c % l.w, y: Math.floor(c / l.w) });
export function step(l: Pick<Layout, 'w' | 'h'>, c: number, d: Dir) {
  const { x, y } = xyOf(l, c);
  return cellAt(l, x + DX[d], y + DY[d]);
}
/** Which way from a to the square next to it, or null. */
export function dirTo(l: Pick<Layout, 'w' | 'h'>, a: number, b: number): Dir | null {
  for (const d of DIRS) if (step(l, a, d) === b) return d;
  return null;
}
export const isStraight = (m: number) => m === (N | S) || m === (E | W);
export const isCurve = (m: number) => count(m) === 2 && !isStraight(m);
export const hasPoints = (m: number) => count(m) === 3;
export const isCrossing = (m: number) => m === 15;
export const isEnd = (m: number) => count(m) === 1;
export const trackSquares = (l: Pick<Layout, 'cells'>) => l.cells.filter(m => m).length;

/** The way through a points square (the two opposite sides) and its branch. */
export function pointsParts(m: number): { through: [Dir, Dir]; branch: Dir } {
  const through: [Dir, Dir] = (m & N) && (m & S) ? [N, S] : [E, W];
  return { through, branch: bits(m).find(d => !through.includes(d))! };
}

/**
 * Where a train coming in by side `from` goes out. Straight on along a straight or round a corner; across a crossing; at points,
 * set 0 it keeps to the way through (or, coming off the branch, turns to the first end) and set 1 it takes the branch (or the
 * other end). At a loose end it goes round the turnaround and back out the way it came.
 */
export function exitOf(m: number, from: Dir, set: number): Dir {
  const ds = bits(m);
  if (ds.length === 1) return from;
  if (ds.length === 2) return ds.find(d => d !== from)!;
  if (ds.length === 4) return opposite(from);
  const { through, branch } = pointsParts(m);
  if (from === branch) return set ? through[1] : through[0];
  return set ? branch : opposite(from);
}

/** The ways a train coming in by `from` could go out, whatever the points. */
export const exitsOf = (m: number, from: Dir): Dir[] => [...new Set([exitOf(m, from, 0), exitOf(m, from, 1)])];

function join(cells: number[], l: Pick<Layout, 'w' | 'h'>, a: number, b: number) {
  const d = dirTo(l, a, b);
  if (d === null) return;
  cells[a] = cells[a]! | d;
  cells[b] = cells[b]! | opposite(d);
}

/** Squares between two squares he dragged across, so a quick finger that skips a square or cuts a corner still lays a joined line. */
export function fillIn(l: Pick<Layout, 'w' | 'h'>, a: number, b: number): number[] {
  const p = xyOf(l as Layout, a), q = xyOf(l as Layout, b), out: number[] = [];
  let x = p.x, y = p.y;
  while (x !== q.x || y !== q.y) {
    if (Math.abs(q.x - x) >= Math.abs(q.y - y)) x += Math.sign(q.x - x); else y += Math.sign(q.y - y);
    out.push(cellAt(l, x, y));
  }
  return out;
}

export interface Laid { layout: Layout; used: number; short: boolean }

/**
 * Lays a stroke (squares in the order he dragged across them). New squares use track from his supply; when it runs out the stroke
 * stops. Then loose ends are closed up, using supply too.
 */
export function lay(l: Layout, stroke: readonly number[], supply: number): Laid {
  const cells = [...l.cells];
  let used = 0, short = false;
  const path: number[] = [];
  for (const c of stroke) {
    if (c < 0 || path.at(-1) === c) continue;
    if (path.length && dirTo(l, path.at(-1)!, c) === null) continue;
    if (!cells[c] && !path.includes(c)) { if (used >= supply) { short = true; break; } used++; }
    // a square already in this stroke isn't joined to itself again
    if (path.length && path.at(-1) !== c) join(cells, l, path.at(-1)!, c);
    path.push(c);
  }
  // a single tap lays nothing
  if (path.length < 2) return { layout: l, used: 0, short: false };
  const closed = closeEnds({ ...l, cells }, supply - used);
  return { layout: tidy(closed.layout), used: used + closed.used, short: short || closed.short };
}

/** Closes every loose end it can: the shortest way through empty squares to other track. `avoid`: squares not to lay on. */
export function closeEnds(l: Layout, supply: number, avoid: ReadonlySet<number> = new Set()): Laid {
  const cells = [...l.cells], tried = new Set<number>();
  let used = 0, short = false;
  for (let guard = 0; guard < 64; guard++) {
    const end = cells.findIndex((m, c) => isEnd(m) && !tried.has(c));
    if (end < 0) break;
    tried.add(end);
    const path = routeFrom({ ...l, cells }, end, avoid);
    if (!path) continue;
    const fresh = path.slice(1, -1).length;
    if (used + fresh > supply) { short = true; continue; }
    for (let i = 1; i < path.length; i++) join(cells, l, path[i - 1]!, path[i]!);
    used += fresh;
  }
  return { layout: { ...l, cells }, used, short };
}

/** The shortest way from a loose end, through empty squares, to a square of track it isn't already joined to. */
function routeFrom(l: Layout, end: number, avoid: ReadonlySet<number>): number[] | null {
  const joinedTo = bits(l.cells[end]!).map(d => step(l, end, d));
  const prev = new Map<number, number>([[end, -1]]), queue = [end];
  while (queue.length) {
    const c = queue.shift()!;
    for (const d of DIRS) {
      if (c === end && l.cells[end]! & d) continue;
      const n = step(l, c, d);
      if (n < 0 || prev.has(n) || avoid.has(n)) continue;
      if (l.cells[n]) {
        // track: a place to join, if it's not where this end already goes and it has a side free
        if (joinedTo.includes(n) && c === end) continue;
        if (count(l.cells[n]!) >= 4 || l.cells[n]! & opposite(d)) continue;
        const path = [n, c];
        for (let p = prev.get(c)!; p !== -1 && p !== undefined; p = prev.get(p)!) path.push(p);
        if (path.at(-1) !== end) path.push(end);
        return path.reverse();
      }
      if (hasThing(l, n)) continue;
      prev.set(n, c);
      queue.push(n);
    }
  }
  return null;
}
const hasThing = (l: Layout, c: number) => l.scenery.some(s => s.cell === c && !TRACK_SCENERY.has(s.id));

/** Scenery that sits on track: the tunnel, the bridge, the level crossing, and the working pieces that go on track. */
export const TRACK_SCENERY: ReadonlySet<string> = new Set(SCENERY.filter(s => 'on' in s).map(s => s.id));

/** After track changes: points keep their setting only where there still are points; a station or a track piece off a straight goes. */
export function tidy(l: Layout): Layout {
  const points = l.cells.map((m, c) => (hasPoints(m) ? l.points[c] ?? 0 : 0));
  const stations = l.stations.filter(s => isStraight(l.cells[s.cell]!));
  const scenery = l.scenery.filter(s => (TRACK_SCENERY.has(s.id) ? isStraight(l.cells[s.cell]!) && !stations.some(t => t.cell === s.cell) : !l.cells[s.cell]));
  return { ...l, points, stations, scenery };
}

/** Takes track off these squares, then closes the ends it leaves the long way round (never back over what he took off). */
export function erase(l: Layout, squares: readonly number[], supply: number): Laid {
  const cells = [...l.cells], gone = new Set(squares.filter(c => cells[c]));
  if (!gone.size) return { layout: l, used: 0, short: false };
  for (const c of gone) {
    for (const d of bits(cells[c]!)) { const n = step(l, c, d); if (n >= 0) cells[n] = cells[n]! & ~opposite(d); }
    cells[c] = 0;
  }
  const freed = gone.size;
  const closed = closeEnds({ ...l, cells }, supply + freed, gone);
  return { layout: tidy(closed.layout), used: closed.used - freed, short: closed.short };
}

/** Flips the points on a square. */
export function switchPoints(l: Layout, c: number): Layout {
  if (!hasPoints(l.cells[c]!)) return l;
  const points = [...l.points];
  points[c] = points[c] ? 0 : 1;
  return { ...l, points };
}

// ---------- the starter loop, and growing the table ----------

/** A loop round the table, an oval of track, with Toy Town on the top and the Farm on the bottom. */
export function starterLayout(w: number, h: number): Layout {
  const cells = Array<number>(w * h).fill(0), l = { w, h };
  const x0 = 1, y0 = 1, x1 = w - 2, y1 = h - 2;
  const ring: number[] = [];
  for (let x = x0; x <= x1; x++) ring.push(cellAt(l, x, y0));
  for (let y = y0 + 1; y <= y1; y++) ring.push(cellAt(l, x1, y));
  for (let x = x1 - 1; x >= x0; x--) ring.push(cellAt(l, x, y1));
  for (let y = y1 - 1; y > y0; y--) ring.push(cellAt(l, x0, y));
  ring.forEach((c, i) => join(cells, l, c, ring[(i + 1) % ring.length]!));
  const mid = Math.floor((x0 + x1) / 2);
  return {
    w, h, cells, points: cells.map(() => 0),
    stations: [{ id: 'town', cell: cellAt(l, mid, y0) }, { id: 'farm', cell: cellAt(l, mid + 1, y1) }],
    scenery: [],
  };
}

/** A bigger table: everything moves to the middle of it. */
export function grow(l: Layout, w: number, h: number): Layout {
  if (w <= l.w && h <= l.h) return l;
  const ox = Math.floor((w - l.w) / 2), oy = Math.floor((h - l.h) / 2), n = { w, h };
  const move = (c: number) => { const { x, y } = xyOf(l, c); return cellAt(n, x + ox, y + oy); };
  const cells = Array<number>(w * h).fill(0), points = Array<number>(w * h).fill(0);
  l.cells.forEach((m, c) => { cells[move(c)] = m; points[move(c)] = l.points[c] ?? 0; });
  return { w, h, cells, points, stations: l.stations.map(s => ({ ...s, cell: move(s.cell) })), scenery: l.scenery.map(s => ({ ...s, cell: move(s.cell) })) };
}

// ---------- where the train can get to ----------

/** A train's place between squares: in square `cell`, having come in by side `from`. */
export interface At { cell: number; from: Dir }
const atKey = (a: At) => a.cell * 16 + a.from;

/**
 * Every square a train starting at `start` (coming in by `from`) can reach, if the points are set the right way, and for each the
 * way to get there: the points to set, in order. The train can never be stuck, so this is just the squares joined to it.
 */
export function routes(l: Layout, start: At): Map<number, { cell: number; set: number }[]> {
  const seen = new Map<number, { at: At; prev: number; via: { cell: number; set: number } | null }>([[atKey(start), { at: start, prev: -1, via: null }]]);
  const out = new Map<number, { cell: number; set: number }[]>(), queue = [start];
  const pathTo = (k: number) => {
    const sets: { cell: number; set: number }[] = [];
    for (let e = seen.get(k); e && e.prev !== -1; e = seen.get(e.prev)) if (e.via) sets.unshift(e.via);
    return sets;
  };
  while (queue.length) {
    const at = queue.shift()!, m = l.cells[at.cell]!;
    if (!out.has(at.cell)) out.set(at.cell, pathTo(atKey(at)));
    for (const set of [0, 1]) {
      const exit = exitOf(m, at.from, set), next = step(l, at.cell, exit);
      if (next < 0 || !(l.cells[next]! & opposite(exit))) continue;
      const to: At = { cell: next, from: opposite(exit) }, k = atKey(to);
      if (seen.has(k)) continue;
      seen.set(k, { at: to, prev: atKey(at), via: hasPoints(m) && exitsOf(m, at.from).length > 1 ? { cell: at.cell, set } : null });
      queue.push(to);
    }
  }
  return out;
}

/** The squares of track joined to this one. */
export function joined(l: Layout, from: number): Set<number> {
  const seen = new Set<number>([from]), queue = [from];
  while (queue.length) {
    const c = queue.shift()!;
    for (const d of bits(l.cells[c]!)) { const n = step(l, c, d); if (n >= 0 && l.cells[n] && !seen.has(n)) { seen.add(n); queue.push(n); } }
  }
  return seen;
}

/** Puts a station on a free straight square, as far as it can from the others (joined to Toy Town if it can be). */
export function placeStation(l: Layout, id: string): Layout {
  if (l.stations.some(s => s.id === id)) return l;
  const home = l.stations.find(s => s.id === 'town')?.cell;
  const near = home !== undefined ? joined(l, home) : null;
  const taken = new Set([...l.stations.map(s => s.cell), ...l.scenery.map(s => s.cell)]);
  const free = l.cells.map((_, c) => c).filter(c => isStraight(l.cells[c]!) && !taken.has(c) && (!near || near.has(c)));
  if (!free.length) return l;
  const dist = (c: number) => Math.min(...l.stations.map(s => { const a = xyOf(l, c), b = xyOf(l, s.cell); return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }), 99);
  const best = free.sort((a, b) => dist(b) - dist(a))[0]!;
  return { ...l, stations: [...l.stations, { id, cell: best }] };
}

/** Every (square, side it came in by) a train starting here can reach, the points set any way. */
export function reachable(l: Layout, start: At): Set<number> {
  const seen = new Set<number>([atKey(start)]), queue = [start];
  while (queue.length) {
    const at = queue.shift()!, m = l.cells[at.cell]!;
    for (const exit of exitsOf(m, at.from)) {
      const next = step(l, at.cell, exit);
      if (next < 0 || !(l.cells[next]! & opposite(exit))) continue;
      const to: At = { cell: next, from: opposite(exit) };
      if (!seen.has(atKey(to))) { seen.add(atKey(to)); queue.push(to); }
    }
  }
  return seen;
}

/**
 * Which way the train should leave Toy Town so that it can reach the pickup, and from there (whichever way it came in) get back
 * to Toy Town. Null if there's no such way (the stations aren't joined, or the track only goes one way round).
 */
export function deliverable(l: Layout, town: number, pickup: number): Dir | null {
  if (!isStraight(l.cells[town]!) || !isStraight(l.cells[pickup]!) || town === pickup) return null;
  const leave = (cell: number, out: Dir) => { const n = step(l, cell, out); return n < 0 || !(l.cells[n]! & opposite(out)) ? new Set<number>() : reachable(l, { cell: n, from: opposite(out) }); };
  for (const to of bits(l.cells[town]!)) {
    const there = leave(town, to), arrivals = bits(l.cells[pickup]!).filter(f => there.has(pickup * 16 + f));
    if (!arrivals.length) continue;
    if (arrivals.every(f => { const back = leave(pickup, opposite(f)); return bits(l.cells[town]!).some(f2 => back.has(town * 16 + f2)); })) return to;
  }
  return null;
}
