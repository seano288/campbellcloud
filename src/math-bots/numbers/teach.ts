// Teaching. A first miss shows what his answer means, without giving the right one ("7 and 5 make 12."); once help steps in
// (the second miss, or the first when he's been struggling, or 🔎) it's taught in full, on the picture, by the strategy the
// kind is for: never a plain "the answer is 5". A Meeting is the same thing the first time a question needs a picture.
//
// Each is a script of steps, so what's said and shown can be tested without a screen. A step changes the Stage and says
// its line; the Stage stays up until the next one, so he can answer while looking at it.
import { sCount } from '../../audio/sfx';
import type { MeetingId } from '../learning';
import type { Phrase } from '../phrases';
import { createVoiceTask, type VoiceScope } from '../voice';
import { signal, type Signal } from '@preact/signals';
import { chartWords, line, onesWord, sentenceOf, tensWord, textOf, type AnyQuestion, type Part, speech as chain } from './say';
import { valueOf, type Bar, type ChartProblem, type JumpProblem, type Laying, type MeasureProblem, type ShapeProblem, type Side } from './problems';
import { shapeSaid } from '../phrases';
import { DRAWINGS, FILLS, SIDES_OF, type Drawing, type FillId, type ShapeName, type Tile } from './shapes';

/** What a step shows. Every picture a question can use, in one description, so a lesson can be any of them. */
export type Stage =
  | { readonly view: 'frames'; readonly a: number; readonly b?: number; readonly hideFrom?: number }
  | { readonly view: 'path'; readonly cells: readonly (number | null)[]; readonly at?: number | null; readonly start?: number }
  | { readonly view: 'bond'; readonly whole: number; readonly left: number; readonly right: number }
  | { readonly view: 'mat'; readonly rods: number; readonly cubes: number; readonly leaving?: number }
  | { readonly view: 'compare'; readonly a: number; readonly b: number }
  | { readonly view: 'scale'; readonly left: number; readonly right: number; readonly leftText?: string; readonly rightText?: string }
  | { readonly view: 'rows'; readonly top: number; readonly bottom: number; readonly leaving?: number; readonly paired?: boolean }
  | { readonly view: 'groups'; readonly groups: number; readonly step: number; readonly lit?: number }
  | { readonly view: 'equation'; readonly text: string }
  | { readonly view: 'chart'; readonly to: number; readonly at?: number; readonly from?: number; readonly lit?: readonly number[]; readonly upTo?: number }
  | { readonly view: 'bars'; readonly bars: readonly Bar[]; readonly rope?: number; readonly lit?: string }
  /** Wrenches on a bar. `shown`: only the first few are down yet. `size`: how long each wrench is. `lit`: the ones counted so far. */
  | { readonly view: 'units'; readonly len: number; readonly laying: Laying; readonly shown?: number; readonly size?: number; readonly lit?: number }
  | { readonly view: 'shape'; readonly tile: Tile; readonly lit?: number }
  | { readonly view: 'fill'; readonly fill: FillId; readonly placed: number };

export interface Step { readonly stage?: Stage | null; readonly say: readonly Part[]; readonly caption?: boolean; readonly hold?: number; readonly tick?: number }
const s = (stage: Stage | null | undefined, ...say: Part[]): Step => ({ stage, say, caption: true });
const say = (...parts: Part[]): Step => ({ say: parts, caption: true });

// ---------- pictures ----------
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const frames = (a: number, b = 0): Stage => ({ view: 'frames', a, b });
const path = (from: number, to: number, at: number | null = null, start?: number): Stage => ({ view: 'path', cells: range(from, to), at, ...(start !== undefined && { start }) });
const pathAround = (start: number, end: number) => [Math.max(0, start - 1), end + 1] as const;
const scale = (l: number, r: number, leftText?: string, rightText?: string): Stage => ({ view: 'scale', left: l, right: r, ...(leftText !== undefined && { leftText }), ...(rightText !== undefined && { rightText }) });
const mat = (n: number): Stage => ({ view: 'mat', rods: Math.floor(n / 10), cubes: n % 10 });

/** Counting on from `start`, one hop at a time, each number said. */
function hops(start: number, count: number, spoken = true): Step[] {
  const [from, to] = pathAround(start, start + count);
  return range(1, count).map(i => ({ stage: path(from, to, start + i, start), say: spoken ? [start + i] : [i], tick: i }));
}

/** "6 and 2 make 8.": what an answer means, as an addition. */
const makes = (a: number, b: number): Step => s(frames(Math.min(a, 20), Math.min(b, 20 - Math.min(a, 20))), a, 'and', b, 'make', a + b, '.');
const sideOf = (x: Side): number => valueOf(x);
const sideLine = (n: number) => s(undefined, 'This side has', n, '.');

// ---------- a first miss ----------

/** What he tapped means, shown on the picture. Ends with Try again, and never says the right answer. */
export function missSteps(q: AnyQuestion, answer: string): Step[] {
  const m = Number(answer), steps = ((): Step[] => {
    switch (q.kind) {
      case 'ten':
        if (q.form === 'look') return [{ stage: frames(q.n), say: ['Look again.'], hold: 1400, caption: true }, { stage: null, say: [] }];
        return q.form === 'partners' ? [makes(q.n, m)] : [makes(q.part, m)];
      case 'on':
        if (q.form === 'countUp') { const [from, to] = pathAround(q.from, Math.max(q.to, q.from + m)); return [s(path(from, to, q.from + m, q.from), q.from, 'and', m, 'make', q.from + m, '.')]; }
        return [sum(q.form === 'box' ? q.a : Math.max(q.a, q.b), m)];
      case 'facts': return [q.eq.op === 'add' ? sum(q.eq.a, m) : makes(q.eq.b, m)];
      case 'over':
        if (answer.startsWith('step:')) return [say('Count the bottom frame.')];
        return [q.form === 'through' ? makes(q.b, m) : sum(q.a, m)];
      case 'part':
        switch (q.form) {
          case 'bond': return [s({ view: 'bond', whole: q.here + m, left: q.here, right: m }, q.here, 'and', m, 'make', q.here + m, '.')];
          case 'addTo': return [makes(q.a, m)];
          case 'takeFrom': return [s(undefined, q.c, 'take away', m, 'is', Math.max(0, q.c - m), '.')];
          case 'firstAdd': return [makes(m, q.b)];
          case 'flipTake': return [s(undefined, m, 'take away', q.b, 'is', Math.max(0, m - q.b), '.')];
        }
        break;
      case 'scale': {
        if (q.form === 'same') { const l = sideOf(q.eq.left), r = sideOf(q.eq.right); return [s(scale(l, r), 'This side has', l, '.'), sideLine(r)]; }
        if (q.form === 'cards') { const c = q.cards[m]!, l = sideOf(c.left), r = sideOf(c.right); return [s(scale(l, r), 'This side has', l, '.'), sideLine(r)]; }
        const total = q.a + q.b;
        return [s(scale(total, m + q.c), 'This side has', total, '.'), sideLine(m + q.c)];
      }
      case 'story': return [say('Listen again.'), ...q.lines.map(l => ({ say: sentenceOf(l).speech, caption: false }))];
      case 'board': return [say('Count the squares.')];
      case 'tens':
        if (q.form === 'compare') return [say('The wide side faces the bigger number.')];
        if (q.form === 'howManyTens') return m > 12 ? [say('Too big!')] : [s(mat(Math.min(m * 10, 99)), m, m === 1 ? 'ten is' : 'tens is', m * 10, '.')];
        return m > 119 ? [say('Too big!')] : [s(mat(Math.min(m, 99)), Math.floor(m / 10), tensWord(Math.floor(m / 10)), m % 10, onesWord(m % 10))];
      case 'skip': return [say('Every jump is', q.step, '.')];
      case 'chart':
        if (q.form === 'tap') return [s(undefined, 'That is', m, '.')];
        return [q.form === 'next' ? say('Count along the row.') : say(CHART_RULE[q.op])];
      case 'jump': return [s(mat(Math.min(m, 99)), Math.floor(m / 10), tensWord(Math.floor(m / 10)), m % 10, onesWord(m % 10))];
      case 'measure':
        switch (q.form) {
          case 'order': return [say('Look at both ends of each bar.')];
          case 'rope': return [say('Look at the rope on each bar.')];
          case 'lay': return [say(m < q.len ? 'It does not reach the end.' : 'It goes past the end.')];
          case 'count': return [say('Count each wrench.')];
          case 'right': { const row = q.rows.find(r => r.id === answer); return [say(row?.laying === 'gaps' ? 'That one has gaps.' : row?.laying === 'overlap' ? 'That one has overlaps.' : 'That one starts too late.')]; }
          case 'fewer': return [say(q.want === 'fewer' ? 'Big ones cover more, so it takes fewer of them.' : 'Small ones cover less, so it takes more of them.')];
        }
        break;
      case 'shape': {
        if (q.form === 'sides') return [say('Count the sides.')];
        if (q.form === 'fill') return [say('That piece does not fit.')];
        const tile = q.tiles[Number(answer.slice(5))];
        if (!tile) return [say('Count the sides.')];
        if (q.form === 'notA' && Number(answer.slice(5)) !== Number(q.answer.slice(5))) return [say(`That one is a ${q.name}.`)];
        return [say(...tileReason(tile, q.form === 'rule' ? undefined : q.name))];
      }
    }
  })();
  return [...steps, { say: ['Try again!'] }];
}
const CHART_RULE = { '+10': 'Ten more goes down one row.', '-10': 'Ten less goes up one row.', '+1': 'One more goes along one square.', '-1': 'One less goes back one square.' } as const;
/** What's wrong with a tile, in his terms, for the shape he's after. Colour is never named. */
function tileReason({ id }: Tile, target?: ShapeName): Part[] {
  const d: Drawing = DRAWINGS[id];
  if (d.flaw === 'gap') return ['That one has a gap.'];
  if (d.flaw === 'curve') return ['That one has a curved side.'];
  if (d.flaw === 'stretched') return ['That one is stretched.'];
  if (d.off && target && SIDES_OF[target] === d.sides) return [d.off === 'lengths' ? 'Its sides are not all the same long.' : 'Its corners lean.'];
  return d.sides === 0 ? ['That one has no sides.'] : ['That one has', d.sides, 'sides.'];
}
/** His sum read as an addition from a number he can see. */
const sum = (seen: number, m: number): Step => (m >= seen ? makes(seen, m - seen) : say(m, 'is less than', seen, '.'));

// ---------- teaching in full ----------

const STORY_EQUATIONS: Record<string, (n: { a: number; b: number; c: number; d: number }) => string> = {
  addResult: n => `${n.a} + ${n.b} = ?`, takeResult: n => `${n.c} − ${n.b} = ?`, putTotal: n => `${n.a} + ${n.b} = ?`,
  addChange: n => `${n.a} + ? = ${n.c}`, takeChange: n => `${n.c} − ? = ${n.a}`, putPart: n => `${n.a} + ? = ${n.c}`,
  match: n => `${n.a} + ? = ${n.c}`, diffMore: n => `${n.a} + ? = ${n.c}`, diffFewer: n => `${n.a} + ? = ${n.c}`,
  bigMore: n => `${n.a} + ${n.b} = ?`, smallFewer: n => `${n.c} − ${n.b} = ?`, addStart: n => `? + ${n.b} = ${n.c}`,
  takeStart: n => `? − ${n.b} = ${n.a}`, bigFewer: n => `${n.a} + ${n.b} = ?`, smallMore: n => `${n.c} − ${n.b} = ?`,
  three: n => `${n.a} + ${n.b} + ${n.d} = ?`,
};

/** The whole lesson: the first line, then the strategy on the picture. */
export function teachSteps(q: AnyQuestion, equalSaid: boolean): Step[] {
  const first: Step = { say: ['Not quite!', "Let's look together."], caption: false };
  return [first, ...teachBody(q, equalSaid)];
}

function teachBody(q: AnyQuestion, equalSaid: boolean): Step[] {
  switch (q.kind) {
    case 'ten':
      if (q.form === 'look') return q.n > 5 ? [s(frames(5, q.n - 5), 'Five and', q.n - 5, '.'), s(undefined, q.n, '.')] : range(1, q.n).map(i => ({ stage: frames(i), say: [i], tick: i }));
      if (q.form === 'partners') {
        const a = 10 - q.n;
        return [...range(1, a).map(i => ({ stage: frames(q.n, i), say: [i] as Part[], tick: i })), s(undefined, q.n, 'and', a, 'make ten.')];
      }
      return [s({ view: 'frames', a: q.part, b: q.whole - q.part }, q.part, 'and', q.whole - q.part, 'make', q.whole, '.'), s({ view: 'bond', whole: q.whole, left: q.part, right: q.whole - q.part }, ...[q.whole, 'is the same as', q.part, 'plus', q.whole - q.part] as Part[], '.')];
    case 'on': {
      if (q.form === 'countUp') {
        const d = q.to - q.from;
        return [...hops(q.from, d, false), s(undefined, d, d === 1 ? 'hop.' : 'hops.'), s(undefined, q.from, 'and', d, 'make', q.to, '.')];
      }
      const big = Math.max(q.a, q.b), small = Math.min(q.a, q.b), start = q.form === 'box' ? q.a : big, more = q.form === 'box' ? q.b : small, [from, to] = pathAround(start, start + more);
      return [s(path(from, to, start, start), 'We are already on', start, '.'), ...hops(start, more), s(undefined, start, 'and', more, 'make', start + more, '.')];
    }
    case 'facts': {
      const { a, b, c, op } = q.eq, big = Math.max(a, b), small = Math.min(a, b);
      if (op === 'sub') return [s(frames(b, a), b, 'and', a, 'make', c, '.'), s(undefined, 'So', c, 'take away', b, 'is', a, '.')];
      if (a === b) return [s(frames(a, b), a, 'and', a, '.'), s(undefined, 'Double', a, 'is', c, '.')];
      if (big - small === 1) return [s(frames(small, small), small, 'and', small, 'make', 2 * small, '.'), s(frames(small, big), 'One more is', c, '.')];
      return [s(frames(a, b), a, 'and', b, 'make', c, '.')];
    }
    case 'over': {
      if (q.form === 'through') {
        const up = 10 - q.b;
        return [s(path(q.b, q.c, 10, q.b), q.b, 'and', up, 'make ten.'), s(undefined, 'Ten and', q.c - 10, 'make', q.c, '.'), s(undefined, 'So', q.c, 'take away', q.b, 'is', q.c - q.b, '.')];
      }
      const moved = 10 - q.a, left = q.b - moved;
      return [s(frames(q.a, q.b), q.a, 'and', moved, 'make ten.'), s({ view: 'bond', whole: q.b, left: moved, right: left }, q.b, 'is', moved, 'and', left, '.'), s(frames(10, left), 'Ten and', left, '.'), s(undefined, q.a + q.b, '.')];
    }
    case 'part': {
      if (q.form === 'flipTake') { const t = q.a + q.b; return [s({ view: 'bond', whole: t, left: q.a, right: q.b }, q.a, 'and', q.b, 'make', t, '.'), s(undefined, 'So', t, 'take away', q.b, 'is', q.a, '.')]; }
      const [k, w] = q.form === 'bond' ? [q.here, q.whole] : q.form === 'addTo' || q.form === 'takeFrom' ? [q.a, q.c] : [q.b, q.c];
      const d = w - k;
      return [s({ view: 'bond', whole: w, left: k, right: d }, k, 'and', d, 'make', w, '.'), s(undefined, 'So the missing part is', d, '.')];
    }
    case 'scale': {
      const equal: Step[] = equalSaid ? [] : [say('The equal sign does not mean the answer is next.'), say('It means both sides are the same.')];
      if (q.form === 'same') { const l = sideOf(q.eq.left), r = sideOf(q.eq.right); return [s(scale(l, r), 'This side has', l, '.'), sideLine(r), say(l === r ? 'The same.' : 'Not the same.')]; }
      if (q.form === 'cards') { const c = q.cards[Number(q.answer)]!, n = sideOf(c.left); return [s(scale(n, n), 'This side has', n, '.'), sideLine(n), say('The same.')]; }
      const total = q.a + q.b, x = total - q.c;
      return [s(scale(total, total), 'This side has', total, '.'), s(undefined, q.c, 'and', x, 'make', total, '.'), ...equal];
    }
    case 'story': {
      const { a, b, c, d } = q.nums, eq: Step = s({ view: 'equation', text: STORY_EQUATIONS[q.id]!(q.nums) }, 'Look at the numbers.');
      switch (q.id) {
        case 'addResult': case 'putTotal': case 'bigMore': return [s({ view: 'rows', top: a, bottom: b }, a, 'and', b, 'make', c, '.'), eq];
        case 'takeResult': case 'smallFewer': return [s({ view: 'rows', top: c, bottom: 0, leaving: b }, c, 'take away', b, 'is', a, '.'), eq];
        case 'three': return [s({ view: 'rows', top: a + b, bottom: d }, a, 'and', b, 'make', a + b, '.'), s(undefined, a + b, 'and', d, 'make', a + b + d, '.'), eq];
        case 'addChange': case 'putPart': return [s({ view: 'rows', top: a, bottom: b }, a, 'and', b, 'make', c, '.'), eq];
        case 'takeChange': return [s({ view: 'rows', top: c, bottom: 0, leaving: b }, c, 'take away', b, 'is', a, '.'), eq];
        case 'match': case 'diffMore': case 'diffFewer': return [s({ view: 'rows', top: c, bottom: a, paired: true }, 'These', b, 'have no partner.'), eq];
        case 'addStart': return [s({ view: 'rows', top: c, bottom: 0, leaving: b }, 'Go backwards.'), s(undefined, c, 'take away', b, 'is', a, '.'), eq];
        case 'takeStart': return [s({ view: 'rows', top: a, bottom: b }, 'Go backwards.'), s(undefined, a, 'and', b, 'make', c, '.'), eq];
        case 'bigFewer': return [s({ view: 'rows', top: c, bottom: a, paired: true }, 'Torque has more.'), s(undefined, a, 'and', b, 'make', c, '.'), eq];
        case 'smallMore': return [s({ view: 'rows', top: c, bottom: a, paired: true }, 'Anvil has fewer.'), s(undefined, c, 'take away', b, 'is', a, '.'), eq];
      }
      break;
    }
    case 'board': {
      if (q.form === 'each') return [say('Count the squares.'), s(undefined, `The ${q.row} row has`, q.rows[q.row], '.')];
      if (q.form === 'more') { const x = q.rows[q.row], y = q.rows[q.other]; return [s({ view: 'rows', top: x, bottom: y, paired: true }, 'These', x - y, 'have no partner.')]; }
      const [x, y, z] = [q.rows.drum, q.rows.hammer, q.rows.flipper];
      return [s(undefined, x, 'and', y, 'make', x + y, '.'), s(undefined, x + y, 'and', z, 'make', x + y + z, '.')];
    }
    case 'tens': {
      if (q.form === 'compare') {
        const ta = Math.floor(q.a / 10), tb = Math.floor(q.b / 10), oa = q.a % 10, ob = q.b % 10, stage: Stage = { view: 'compare', a: q.a, b: q.b };
        if (ta !== tb) return [s(stage, 'Tens first.'), s(undefined, ta, ta < tb ? 'tens is less than' : 'tens is more than', tb, 'tens.'), say('The wide side faces the bigger number.')];
        if (oa !== ob) return [s(stage, 'The tens are the same.'), s(undefined, oa, oa < ob ? 'is less than' : 'is more than', ob, '.')];
        return [s(stage, 'The tens are the same.'), say('The ones are the same.')];
      }
      if (q.form === 'howManyTens') return [s(mat(q.n), q.n, 'is', q.n / 10, 'tens.')];
      const n = q.form === 'read' ? q.rods * 10 + q.cubes : q.n, rods = q.form === 'read' ? q.rods : Math.floor(n / 10), cubes = q.form === 'read' ? q.cubes : n % 10;
      if (cubes >= 10) return [s({ view: 'mat', rods, cubes }, 'Ten ones make one ten.'), s(mat(n), Math.floor(n / 10), 'tens and', n % 10, 'ones.')];
      if (n < 20) return [s(mat(n), 'One ten.', cubes, 'ones.'), s(undefined, 'Ten and', cubes, 'is', n, '.'), s(undefined, 'The 1 is the ten.')];
      return [s(mat(n), rods, 'tens is', rods * 10, '.'), s(undefined, rods * 10, 'and', cubes, 'make', n, '.')];
    }
    case 'skip': {
      const n = Number(q.answer), step = q.step;
      if (q.form === 'groups') return [...range(1, Math.min(q.groups, 6)).map(i => ({ stage: { view: 'groups', groups: q.groups, step, lit: i } as Stage, say: [i * step] as Part[], tick: i })), ...(q.groups > 6 ? [s({ view: 'groups', groups: q.groups, step, lit: q.groups }, n, '.')] : []), say('Every jump is', step, '.')];
      const start = Math.max(0, n - step * 3), cells = range(0, Math.floor((n - start) / step)).map(i => start + i * step);
      return [...cells.map((v, i) => ({ stage: { view: 'path', cells, at: v } as Stage, say: [v] as Part[], tick: i })), say('Every jump is', step, '.')];
    }
    case 'chart': return teachChart(q);
    case 'jump': return teachJump(q);
    case 'measure': return teachMeasure(q);
    case 'shape': return teachShape(q);
  }
}

const rowOf = (n: number) => { const first = Math.floor((n - 1) / 10) * 10 + 1; return range(first, first + 9); };
const columnOf = (n: number, to: number) => range(0, Math.floor((to - 1) / 10)).map(r => r * 10 + ((n - 1) % 10) + 1).filter(c => c <= to);
function teachChart(q: ChartProblem): Step[] {
  const { to } = q, n = Number(q.answer);
  if (q.form === 'tap') {
    const tens = Math.floor(n / 10), ones = n % 10;
    return [
      s({ view: 'chart', to, lit: rowOf(n) }, ...(n > 100 ? ['One hundred and', n - 100] as Part[] : [tens, tensWord(tens), ones, onesWord(ones)])),
      s({ view: 'chart', to, at: n }, 'Here is', n, '.'),
    ];
  }
  if (q.form === 'next') {
    const last = q.shown.at(-1)!;
    return [s({ view: 'chart', to, at: n, upTo: n }, 'After', last, 'comes', n, '.'), ...(n % 10 === 0 ? [say('A new ten.')] : [])];
  }
  const far = q.op === '+10' || q.op === '-10', more = q.op === '+10';
  return [
    s({ view: 'chart', to, from: q.n }, CHART_RULE[q.op]),
    ...(far ? [s({ view: 'chart', to, from: q.n, lit: columnOf(q.n, to) }, 'Same ones.', more ? 'One more ten.' : 'One less ten.')] : []),
    s({ view: 'chart', to, from: q.n, at: n }, chartWords(q.op), q.n, 'is', n, '.'),
  ];
}

function teachJump(q: JumpProblem): Step[] {
  const { a, b } = q, ta = Math.floor(a / 10), oa = a % 10, tb = Math.floor(b / 10), ob = b % 10, n = Number(q.answer), tn = Math.floor(n / 10), on = n % 10;
  const tens: Part = tn === 1 ? 'ten.' : 'tens.', pair: Stage = { view: 'compare', a, b };
  if (q.op === 'sub') return [s({ view: 'mat', rods: ta, cubes: 0, leaving: tb }, ta, 'tens take away', tb, tb === 1 ? 'ten is' : 'tens is', tn, tens), s(mat(n), tn, tn === 1 ? 'ten is' : 'tens is', n, '.')];
  const sum = s(mat(n), tn, tensWord(tn), on, onesWord(on)), end = s(undefined, a, 'and', b, 'make', n, '.');
  if (q.form === 'decades') return [s(pair, 'Tens go with tens.'), s(mat(n), ta, tensWord(ta), tb, tb === 1 ? 'ten are' : 'tens are', tn, tens), end];
  if (q.form === 'cross') return [s(pair, 'Tens go with tens.'), say('Ones go with ones.'), s({ view: 'mat', rods: ta + tb, cubes: oa + ob }, 'Ten ones make one ten.'), sum, end];
  return [s(pair, 'Tens go with tens.'), say('Ones go with ones.'), sum, end];
}

const lineUp = (bars: readonly Bar[]) => bars.map(b => ({ ...b, start: 0 }));
function teachMeasure(q: MeasureProblem): Step[] {
  const countThem = (len: number): Step[] => [
    s({ view: 'units', len, laying: 'right' }, 'No gaps. No overlaps. Now count.'),
    ...range(1, len).map(i => ({ stage: { view: 'units', len, laying: 'right', lit: i } as Stage, say: [i] as Part[], tick: i })),
    s(undefined, len, 'wrenches long.'),
  ];
  switch (q.form) {
    case 'order': return [s({ view: 'bars', bars: lineUp(q.bars) }, 'Line them up.'), s({ view: 'bars', bars: lineUp(q.bars), lit: q.answer }, `This one is the ${q.want}.`)];
    case 'rope': {
      const bottomLonger = q.answer === 'b', stage: Stage = { view: 'bars', bars: q.bars, rope: q.rope };
      return [s(stage, 'The rope is as long as the top bar.'), say('Put the rope on the bottom bar.'), say(bottomLonger ? 'The bottom bar is longer than the rope.' : 'The bottom bar is shorter than the rope.'), s({ ...stage, lit: q.answer }, bottomLonger ? 'So the bottom bar is longer.' : 'So the top bar is longer.')];
    }
    case 'lay': case 'count': return countThem(q.len);
    case 'right': return [...q.rows.flatMap(r => (r.laying === 'right' ? [] : [s({ view: 'units', len: q.len, laying: r.laying }, r.laying === 'gaps' ? 'That one has gaps.' : r.laying === 'overlap' ? 'That one has overlaps.' : 'That one starts too late.')])), s({ view: 'units', len: q.len, laying: 'right' }, 'No gaps. No overlaps. Now count.'), say('This one is right.')];
    case 'fewer': return [s({ view: 'units', len: q.len, laying: 'right', size: 2 }, q.len / 2, 'big wrenches.'), s({ view: 'units', len: q.len, laying: 'right' }, q.len, 'small wrenches.'), say('Bigger wrenches, fewer of them.')];
  }
}

/** Counting a tile's sides as they light up, and what that makes it. */
function sideCount(tile: Tile): Step[] {
  const d: Drawing = DRAWINGS[tile.id], stage = (lit: number): Stage => ({ view: 'shape', tile, lit });
  if (d.is === 'circle') return [s(stage(0), 'No sides. No corners.'), say('All round.'), say(shapeSaid('circle'))];
  const named: Step[] = !d.is ? [] : [...(d.is === 'square' ? [say('All the same long.')] : d.is === 'rectangle' ? [say('Two long, two short.')] : []), say(shapeSaid(d.is))];
  return [...range(1, d.sides).map(i => ({ stage: stage(i), say: [i] as Part[], tick: i })), s(undefined, d.sides, 'sides.'), say('All joined.'), ...named];
}
function teachShape(q: ShapeProblem): Step[] {
  switch (q.form) {
    case 'every': return sideCount(q.tiles[q.targets[0]!]!);
    case 'rule': return sideCount(q.tiles[Number(q.answer.slice(5))]!);
    case 'sides': return sideCount(q.tile);
    case 'notA': { const foil = q.tiles[Number(q.answer.slice(5))]!; return [s({ view: 'shape', tile: foil }, ...tileReason(foil, q.name)), say(`It is not a ${q.name}.`)]; }
    case 'fill': {
      const f = FILLS[q.fill];
      return [...f.parts.map((_, i) => ({ stage: { view: 'fill', fill: q.fill, placed: i + 1 } as Stage, say: [i + 1] as Part[], tick: i + 1 })), say(f.says)];
    }
  }
}

// ---------- Meetings ----------

export interface Meeting { readonly steps: readonly Step[]; readonly tap: Phrase; readonly taps: number; readonly end: Stage }
const FIVE = frames(5), TEN_FRAME = frames(10);
const TRIANGLE: Tile = { id: 'triEven', turn: 0, size: 1, hue: 1 }, WRENCHES = (shown: number): Stage => ({ view: 'units', len: 4, laying: 'right', shown }), CHART_STAGE: Stage = { view: 'chart', to: 50 };
const WALK = path(0, 10, 0), BOND: Stage = { view: 'bond', whole: 7, left: 3, right: 4 };
export const MEETING_SCRIPTS: Record<MeetingId, Meeting> = {
  frame: { steps: [s(frames(1), 'This is a ten frame.'), s(FIVE, 'Five on top.'), s(TEN_FRAME, 'Five below.'), s(TEN_FRAME, 'Ten.')], tap: 'Tap the ten frame!', taps: 1, end: TEN_FRAME },
  path: { steps: [s(WALK, 'This is a number path.'), say('Each hop goes one square.')], tap: 'Tap to hop three times!', taps: 3, end: WALK },
  bond: { steps: [s(BOND, 'This is a number bond.'), say('The whole splits into two parts.'), say('The two parts make the whole.')], tap: 'Tap the bond!', taps: 1, end: BOND },
  rod: { steps: [s({ view: 'mat', rods: 0, cubes: 10 }, 'Ten ones.'), s({ view: 'mat', rods: 1, cubes: 0 }, 'Ten ones make one ten.')], tap: 'Tap the ten!', taps: 1, end: { view: 'mat', rods: 1, cubes: 0 } },
  same: { steps: [s(scale(5, 5, '5', '2 + 3'), 'This side has', 5, '.'), s(undefined, 'This side has', 5, '.'), s({ view: 'equation', text: '5 = 2 + 3' }, 'This sign means the same as.')], tap: 'Tap the sign!', taps: 1, end: { view: 'equation', text: '5 = 2 + 3' } },
  signs: { steps: [s({ view: 'equation', text: '3 < 5' }, 'The wide side faces the bigger number.')], tap: 'Tap the sign!', taps: 1, end: { view: 'equation', text: '3 < 5' } },
  chart: { steps: [s(CHART_STAGE, 'This is a number chart.'), s({ ...CHART_STAGE, lit: range(21, 30) } as Stage, 'Each row has ten numbers.'), s({ ...CHART_STAGE, lit: [24, 34] } as Stage, 'One row down is ten more.')], tap: 'Tap the chart!', taps: 1, end: CHART_STAGE },
  unit: { steps: [s(WRENCHES(1), 'This is a wrench.'), s(WRENCHES(4), 'Lay it end to end.'), say('No gaps. No overlaps. Now count.')], tap: 'Tap the wrenches!', taps: 1, end: WRENCHES(4) },
  sides: { steps: [s({ view: 'shape', tile: TRIANGLE }, 'This shape has sides.'), ...range(1, 3).map(i => ({ stage: { view: 'shape', tile: TRIANGLE, lit: i } as Stage, say: [i] as Part[], tick: i })), say('All joined.')], tap: 'Tap the shape!', taps: 1, end: { view: 'shape', tile: TRIANGLE, lit: 3 } },
  fill: { steps: [s({ view: 'fill', fill: 'squareTwo', placed: 0 }, 'Shapes fit together.'), s({ view: 'fill', fill: 'squareTwo', placed: 1 }, 'Two triangles make a square.'), { stage: { view: 'fill', fill: 'squareTwo', placed: 2 }, say: [], hold: 900 }], tap: 'Tap the square!', taps: 1, end: { view: 'fill', fill: 'squareTwo', placed: 2 } },
};

/** Which pictures this question needs him to have met, in order. */
export function meetingsFor(q: AnyQuestion): MeetingId[] {
  switch (q.kind) {
    case 'ten': return q.form === 'hiding' ? ['frame', 'bond'] : ['frame'];
    case 'on': case 'skip': return ['path'];
    case 'part': return ['bond'];
    case 'scale': return ['same'];
    case 'tens': return q.form === 'compare' ? ['rod', 'signs'] : ['rod'];
    case 'over': return ['frame'];
    case 'chart': return ['chart'];
    case 'jump': return ['rod'];
    case 'measure': return q.form === 'order' || q.form === 'rope' ? [] : ['unit'];
    case 'shape': return q.form === 'fill' ? ['sides', 'fill'] : ['sides'];
    default: return [];
  }
}

// ---------- running a script ----------

/** What the question's view shows while a lesson runs. One per problem, keyed by its lifetime. */
export interface Lesson {
  stage: Signal<Stage | null>;
  caption: Signal<string | null>;
  run: ReturnType<typeof createVoiceTask>;
}
const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let l = lessons.get(lifetime);
  if (!l) { l = { stage: signal(null), caption: signal(null), run: createVoiceTask(lifetime) }; lessons.set(lifetime, l); }
  return l;
}

export async function playSteps(steps: readonly Step[], lesson: Lesson, voice: VoiceScope) {
  for (const step of steps) {
    if (!voice.active) return;
    if (step.stage !== undefined) lesson.stage.value = step.stage;
    if (step.caption) lesson.caption.value = textOf(step.say);
    if (step.tick !== undefined) sCount(step.tick);
    if (step.say.length) await voice.say(...chain(step.say));
    if (step.hold) await voice.wait(step.hold);
  }
}
export { line };
