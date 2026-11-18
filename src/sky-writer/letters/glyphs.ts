// Backwards and upside-down letters, for Which Way. A letter can be shown as it is (id), mirrored left to right (m, "backwards"),
// flipped top to bottom (f) or turned right round (r). Some letters look the same some of those ways (A mirrored is A; c flipped is c;
// s turned round is s; in ball-and-stick, a flipped top to bottom is a, and t is t every way), so two of those choices would look alike:
// which turns look the same is worked out from the letter's own strokes, and choices are only the turns that look different from the
// letter and from each other.
//
// b, d, p and q are each other turned: a mirrored b is a d. So for those four the choices are the real letters, and a word with one of
// them mirrored must not spell another real word (bag with its b mirrored reads dag).

import { letter } from './strokes';

export type Turn = 'id' | 'm' | 'f' | 'r';
export interface Glyph { readonly ch: string; readonly turn: Turn }
export const glyphKey = (g: Glyph) => `${g.ch}:${g.turn}`;

/** How far a turned letter's strokes are from its own (the larger of the two ways' furthest nearest points), in line units. */
function apart(ch: string, t: Turn): number {
  const P = letter(ch).strokes.flatMap(s => s.pts), xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const T = P.map(([x, y]) => [t === 'm' || t === 'r' ? 2 * cx - x : x, t === 'f' || t === 'r' ? 2 * cy - y : y] as const);
  const far = (a: readonly (readonly [number, number])[], b: readonly (readonly [number, number])[]) => Math.max(...a.map(p => Math.min(...b.map(q => Math.hypot(p[0] - q[0], p[1] - q[1])))));
  return Math.max(far(P, T), far(T, P));
}
/** Turned less than this far apart, a letter looks the same (a, flipped top to bottom, is still a; t is t every way). */
export const SAME_WITHIN = 0.12;
/** Nearly the same, and counted so: n, m and u mirrored (only where the stem meets the hump changes), K flipped. */
const NEARLY: Partial<Record<Turn, string>> = { m: 'nmu', f: 'K' };
const memo = new Map<string, Turn[]>();
/** The turns that leave this letter looking the same, worked out from its strokes. */
export function sameUnder(ch: string): Turn[] {
  let out = memo.get(ch);
  if (!out) {
    out = ['id', ...(['m', 'f', 'r'] as const).filter(t => apart(ch, t) < SAME_WITHIN || NEARLY[t]?.includes(ch))];
    // turns compose: looking the same two ways means looking the same the third way too
    if (out.length === 3) out = ['id', 'm', 'f', 'r'];
    memo.set(ch, out);
  }
  return out;
}

/** Composing turns: m then f is r, and so on. */
const PRODUCT: Record<Turn, Record<Turn, Turn>> = {
  id: { id: 'id', m: 'm', f: 'f', r: 'r' }, m: { id: 'm', m: 'id', f: 'r', r: 'f' },
  f: { id: 'f', m: 'r', f: 'id', r: 'm' }, r: { id: 'r', m: 'f', f: 'm', r: 'id' },
};

/** The turns of a letter that look different from it and from each other, the letter itself first. */
export function distinctTurns(ch: string): Turn[] {
  const same = sameUnder(ch), seen = new Set<string>(), out: Turn[] = [];
  for (const t of ['id', 'm', 'f', 'r'] as const) {
    // two turns look alike when they differ by a turn the letter looks the same under
    const look = same.map(s => PRODUCT[t][s]).sort().join(',');
    if (seen.has(look)) continue;
    seen.add(look);
    out.push(t);
  }
  return out;
}

export const BDPQ = ['b', 'd', 'p', 'q'] as const;
export const isBdpq = (ch: string): ch is (typeof BDPQ)[number] => (BDPQ as readonly string[]).includes(ch);
/** What b, d, p or q looks like turned: the real letter. */
export const turnedBdpq = (ch: (typeof BDPQ)[number], t: Turn): (typeof BDPQ)[number] => {
  const table = { b: { id: 'b', m: 'd', f: 'p', r: 'q' }, d: { id: 'd', m: 'b', f: 'q', r: 'p' }, p: { id: 'p', m: 'q', f: 'b', r: 'd' }, q: { id: 'q', m: 'p', f: 'd', r: 'b' } } as const;
  return table[ch][t];
};

/** Can he be asked to find this letter from its mirror image? */
export const mirrorDiffers = (ch: string) => !sameUnder(ch).includes('m');

/** Words where mirroring the letter at that place spells another real word (checked against a dictionary in writing/problems.test.ts). */
export const FLIP_MAKES_A_WORD: readonly string[] = ['bag:0', 'web:2', 'dig:0', 'big:0', 'dog:0', 'bug:0', 'cub:2', 'bed:0', 'pin:0', 'bud:0', 'bud:2', 'dud:0', 'dub:0'];
