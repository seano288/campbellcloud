// What Carrier Deck asks: story problems on a flight deck. Five kinds, three Levels each, with Stretch inside a Level. The hard part is
// not the sum, it is working out which sum the story needs (CCSS 2.OA.A.1, the Common Core table of problem types; TEKS 2.4(C)), and
// reading a bar graph of four squadrons (2.MD.D.10; TEKS 2.10). Level 1 begins where Math Bots' Bot Stories Level 3 ends (start unknown and
// opposite-language compare within 20), and no story needs a sum harder than Jetway's Levels: two-digit numbers within 100, carrying a
// ten at most (Jetway's Boarding and Unload Level 2). Every number is at least 2 (the sentences are plural) and at most 99, so two number
// wheels always answer.
//
// - Deck Log (`one`): a one-step story. Level 1 asks the end (round tens, then any numbers without carrying), Level 2 the change, Level 3
//   the start.
// - Which Sum (`pick`): hear a story, tap the number sentence that fits; nothing is worked out. Level 1 `38 + 25 = ?` or `38 − 25 = ?`;
//   Level 2 a sentence with a gap (`38 + ? = 60`); Level 3 the story holds a number that is not needed.
// - How Many More (`compare`): two ships or two decks. "How many more", "how many fewer", then the tricky one ("The big ship has 12 more
//   sailors than the small ship. The big ship has 30.").
// - Two Steps (`two`): add then add again to 20 (at Stretch 0 the middle question is asked aloud first), add then take away, then
//   numbers to 100 with no hint that there are two steps.
// - Mission Board (`board`): a bar graph of four squadrons. Read one bar (ones), how many more between two bars (twos or fives), how many
//   in all for two or three bars (twos or tens, and only here a bar may end halfway between two lines).
//
// No key words: about half the stories that say "more" are solved by taking away, and about half that say "left" or "fewer" by adding
// (problems.test.ts measures it). The story nouns stay few: jets, helicopters, crates, sailors, boats.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';

export type Level = 1 | 2 | 3;
export const KINDS = ['one', 'pick', 'compare', 'two', 'board'] as const;
export type Kind = (typeof KINDS)[number];
/** Nothing he is asked, shown or offered goes past this, and nothing he is told is below MIN. */
export const TOP = 99, MIN = 2;

const ones = (n: number) => n % 10;
/** Adding these two carries a ten (and so taking one from their sum borrows). */
export const carries = (a: number, b: number) => ones(a) + ones(b) >= 10;

// ---------- the stories ----------

/** A number's place in a story: `#s` start, `#c` change, `#e` end (join and separate); `#p` `#q` parts and `#w` whole; `#big` `#small`
 *  and `#d` the difference (compare); `#a` `#b` `#k` the three numbers of a two-step story; `#x` the number that is not needed. */
export type Slot = '#s' | '#c' | '#e' | '#p' | '#q' | '#w' | '#big' | '#small' | '#d' | '#a' | '#b' | '#k' | '#x';
type Line = readonly string[];
type Shape = 'join' | 'sep' | 'part' | 'cmp';

interface OneTemplate { readonly shape: Shape; readonly ask: Slot; readonly noun: Noun; readonly lines: readonly Line[] }
export type Noun = 'jets' | 'helicopters' | 'crates' | 'sailors' | 'boats';
export const NOUNS: readonly Noun[] = ['jets', 'helicopters', 'crates', 'sailors', 'boats'];

/** One-step stories, each sentence a chain of recorded pieces round its numbers. Deck Log and Which Sum tell these. */
export const ONE_STEP = {
  // the end is asked
  landMore: { shape: 'join', ask: '#e', noun: 'jets', lines: [['#s', 'jets are on the deck.'], ['#c', 'more jets land.'], ['How many jets are on the deck now?']] },
  takeOffLeft: { shape: 'sep', ask: '#e', noun: 'jets', lines: [['#s', 'jets are on the deck.'], ['#c', 'jets take off.'], ['How many jets are left on the deck?']] },
  heliLeft: { shape: 'join', ask: '#e', noun: 'helicopters', lines: [['#s', 'helicopters left the ship in the morning.'], ['#c', 'more left after lunch.'], ['How many helicopters left the ship?']] },
  liftDown: { shape: 'sep', ask: '#e', noun: 'crates', lines: [['#s', 'crates are on the deck.'], ['#c', 'crates go down on the lift.'], ['How many crates are on the deck now?']] },
  sailorsAll: { shape: 'part', ask: '#w', noun: 'sailors', lines: [['#p', 'sailors are on the deck.'], ['#q', 'sailors are in the hangar.'], ['How many sailors are there in all?']] },
  boatsOut: { shape: 'sep', ask: '#e', noun: 'boats', lines: [['#s', 'boats are in the harbor.'], ['#c', 'boats sail out to sea.'], ['How many boats are still in the harbor?']] },
  // the change is asked
  landSome: { shape: 'join', ask: '#c', noun: 'jets', lines: [['#s', 'jets are on the deck.'], ['Some more jets land.'], ['Now there are', '#e', '.'], ['How many jets landed?']] },
  takeOffSome: { shape: 'sep', ask: '#c', noun: 'jets', lines: [['#s', 'jets are on the deck.'], ['Some jets take off.'], ['Now there are', '#e', '.'], ['How many jets took off?']] },
  liftSomeLeft: { shape: 'sep', ask: '#c', noun: 'crates', lines: [['#s', 'crates are on the deck.'], ['Some go down on the lift.'], ['Now', '#e', 'are left.'], ['How many crates went down?']] },
  sailorsBelow: { shape: 'part', ask: '#q', noun: 'sailors', lines: [['#w', 'sailors are on the ship.'], ['#p', 'are on the deck.'], ['The rest are below.'], ['How many sailors are below?']] },
  boatsIn: { shape: 'join', ask: '#c', noun: 'boats', lines: [['#s', 'boats are in the harbor.'], ['Some more boats sail in.'], ['Now there are', '#e', '.'], ['How many boats sailed in?']] },
  sailorsLeft: { shape: 'join', ask: '#e', noun: 'sailors', lines: [['#s', 'sailors left the ship on the boats.'], ['Then', '#c', 'more left.'], ['How many sailors left the ship?']] },
  // the start is asked
  landedFirst: { shape: 'join', ask: '#s', noun: 'jets', lines: [['Some jets were on the deck.'], ['#c', 'more jets landed.'], ['Now there are', '#e', '.'], ['How many jets were on the deck at first?']] },
  tookOffFirst: { shape: 'sep', ask: '#s', noun: 'jets', lines: [['Some jets were on the deck.'], ['#c', 'jets took off.'], ['Now', '#e', 'are left.'], ['How many jets were on the deck at first?']] },
  wentDownFirst: { shape: 'sep', ask: '#s', noun: 'crates', lines: [['Some crates were on the deck.'], ['#c', 'went down on the lift.'], ['Now there are', '#e', '.'], ['How many crates were there at first?']] },
  cameUpFirst: { shape: 'join', ask: '#s', noun: 'sailors', lines: [['Some sailors were on the deck.'], ['#c', 'more came up.'], ['Now there are', '#e', '.'], ['How many sailors were there at first?']] },
  heliAwayFirst: { shape: 'sep', ask: '#s', noun: 'helicopters', lines: [['Some helicopters were on the ship.'], ['#c', 'flew away.'], ['Now', '#e', 'are left.'], ['How many helicopters were there at first?']] },
} as const satisfies Record<string, OneTemplate>;
export type OneId = keyof typeof ONE_STEP;

/** How Many More: two ships or two decks. */
export const COMPARE = {
  bigMore: { shape: 'cmp', ask: '#d', noun: 'sailors', lines: [['The big ship has', '#big', 'sailors.'], ['The small ship has', '#small', 'sailors.'], ['How many more sailors are on the big ship?']] },
  deckMore: { shape: 'cmp', ask: '#d', noun: 'jets', lines: [['Deck one has', '#big', 'jets.'], ['Deck two has', '#small', 'jets.'], ['How many more jets are on deck one?']] },
  heliMore: { shape: 'cmp', ask: '#d', noun: 'helicopters', lines: [['The carrier has', '#big', 'helicopters.'], ['The supply ship has', '#small', 'helicopters.'], ['How many more helicopters does the carrier have?']] },
  smallFewer: { shape: 'cmp', ask: '#d', noun: 'boats', lines: [['The big ship has', '#big', 'boats.'], ['The small ship has', '#small', 'boats.'], ['How many fewer boats are on the small ship?']] },
  deckFewer: { shape: 'cmp', ask: '#d', noun: 'crates', lines: [['Deck two has', '#small', 'crates.'], ['Deck one has', '#big', 'crates.'], ['How many fewer crates are on deck two?']] },
  // the tricky ones: what is said is the other way round from what is asked
  moreFindSmall: { shape: 'cmp', ask: '#small', noun: 'sailors', lines: [['The big ship has', '#d', 'more sailors than the small ship.'], ['The big ship has', '#big', 'sailors.'], ['How many sailors are on the small ship?']] },
  fewerFindBig: { shape: 'cmp', ask: '#big', noun: 'jets', lines: [['The small ship has', '#d', 'fewer jets than the big ship.'], ['The small ship has', '#small', 'jets.'], ['How many jets are on the big ship?']] },
  moreFindBig: { shape: 'cmp', ask: '#big', noun: 'crates', lines: [['The big ship has', '#d', 'more crates than the small ship.'], ['The small ship has', '#small', 'crates.'], ['How many crates are on the big ship?']] },
  fewerFindSmall: { shape: 'cmp', ask: '#small', noun: 'boats', lines: [['The small ship has', '#d', 'fewer boats than the big ship.'], ['The big ship has', '#big', 'boats.'], ['How many boats are on the small ship?']] },
} as const satisfies Record<string, OneTemplate>;
export type CompareId = keyof typeof COMPARE;

/** Two Steps. `chain`: a op1 b gives the middle, then op2 k. `both`: the second ship's number from the first and b, then both together. */
interface TwoTemplate { readonly form: 'chain' | 'both'; readonly ops: readonly ['+' | '-', '+' | '-']; readonly noun: Noun; readonly lines: readonly Line[]; readonly middle: Line }
export const TWO_STEP = {
  landLand: { form: 'chain', ops: ['+', '+'], noun: 'jets', lines: [['#a', 'jets are on the deck.'], ['#b', 'more jets land.'], ['Then', '#k', 'more land.'], ['How many jets are on the deck now?']], middle: ['First, how many jets are on the deck?'] },
  liftUpUp: { form: 'chain', ops: ['+', '+'], noun: 'crates', lines: [['#a', 'crates are on the deck.'], ['The lift brings up', '#b', 'more.'], ['Then it brings up', '#k', 'more.'], ['How many crates are on the deck now?']], middle: ['First, how many crates are on the deck?'] },
  comeUpUp: { form: 'chain', ops: ['+', '+'], noun: 'sailors', lines: [['#a', 'sailors are on the deck.'], ['#b', 'more come up.'], ['Then', '#k', 'more come up.'], ['How many sailors are on the deck now?']], middle: ['First, how many sailors are on the deck?'] },
  landTakeOff: { form: 'chain', ops: ['+', '-'], noun: 'jets', lines: [['#a', 'jets are on the deck.'], ['#b', 'more jets land.'], ['Then', '#k', 'jets take off.'], ['How many jets are on the deck now?']], middle: ['First, how many jets are on the deck?'] },
  downThenUp: { form: 'chain', ops: ['-', '+'], noun: 'crates', lines: [['#a', 'crates are on the deck.'], ['#b', 'crates go down on the lift.'], ['Then', '#k', 'more crates come up.'], ['How many crates are on the deck now?']], middle: ['First, how many crates are on the deck?'] },
  belowThenUp: { form: 'chain', ops: ['-', '+'], noun: 'sailors', lines: [['#a', 'sailors are on the deck.'], ['#b', 'go below.'], ['Then', '#k', 'more come up.'], ['How many sailors are on the deck now?']], middle: ['First, how many sailors are on the deck?'] },
  boatsInOut: { form: 'chain', ops: ['+', '-'], noun: 'boats', lines: [['#a', 'boats are in the harbor.'], ['#b', 'more boats sail in.'], ['Then', '#k', 'boats sail out.'], ['How many boats are left in the harbor?']], middle: ['First, how many boats are in the harbor?'] },
  takeOffTwice: { form: 'chain', ops: ['-', '-'], noun: 'jets', lines: [['#a', 'jets are on the deck.'], ['#b', 'take off.'], ['Then', '#k', 'more take off.'], ['How many jets are left on the deck?']], middle: ['First, how many jets are on the deck?'] },
  heliAwayBack: { form: 'chain', ops: ['+', '-'], noun: 'helicopters', lines: [['#a', 'helicopters left the ship.'], ['Then', '#b', 'more left.'], ['#k', 'came back.'], ['How many helicopters are still away?']], middle: ['First, how many helicopters left the ship?'] },
  bothFewer: { form: 'both', ops: ['-', '+'], noun: 'sailors', lines: [['The big ship has', '#a', 'sailors.'], ['The small ship has', '#b', 'fewer.'], ['How many sailors are on both ships?']], middle: ['First, how many sailors are on the small ship?'] },
  bothMore: { form: 'both', ops: ['+', '+'], noun: 'boats', lines: [['The small ship has', '#a', 'boats.'], ['The big ship has', '#b', 'more.'], ['How many boats are on both ships?']], middle: ['First, how many boats are on the big ship?'] },
} as const satisfies Record<string, TwoTemplate>;
export type TwoId = keyof typeof TWO_STEP;

/** The number that is not needed (Which Sum Level 3): always a different kind of thing, so the story still makes sense. */
export const EXTRA = {
  sailorsWatched: ['#x', 'sailors watched.'],
  helisFlewOver: ['#x', 'helicopters flew over.'],
} as const satisfies Record<string, Line>;
const extraFor = (noun: Noun): keyof typeof EXTRA => (noun === 'sailors' || noun === 'boats' ? 'helisFlewOver' : 'sailorsWatched');

// ---------- what a story says ----------

export type Nums = Partial<Record<Slot, number>>;
/** A sentence, as shown and as said: the recorded pieces with the numbers between them. */
export interface Sentence { readonly text: string; readonly pieces: readonly (string | number)[]; readonly nums: readonly number[]; readonly slots: readonly Slot[] }

export function sentenceOf(line: Line, nums: Nums): Sentence {
  const pieces: (string | number)[] = [], shown: string[] = [], said: number[] = [], slots: Slot[] = [];
  for (const p of line) {
    if (p.startsWith('#')) {
      const n = nums[p as Slot];
      if (n === undefined) throw new Error(`no number for ${p}`);
      pieces.push(n); shown.push(String(n)); said.push(n); slots.push(p as Slot);
    } else if (p === '.' || p === '?') shown.push(p);
    else { pieces.push(p); shown.push(p); }
  }
  return { text: shown.join(' ').replace(/ ([.?,])/g, '$1'), pieces, nums: said, slots };
}
/** Every recorded piece a story can say, for the phrase list. */
export function piecesOf(lines: readonly Line[]): string[] {
  return lines.flat().filter(p => !p.startsWith('#') && p !== '.' && p !== '?');
}

// ---------- number sentences ----------

/** A number sentence, `l op r = res`, with null for the box he would fill. */
export interface Eq { readonly l: number | null; readonly op: '+' | '-'; readonly r: number | null; readonly res: number | null }
const minus = '−';
export const eqText = (e: Eq) => `${e.l ?? '?'} ${e.op === '+' ? '+' : minus} ${e.r ?? '?'} = ${e.res ?? '?'}`;
/** The number that goes in the box, or null when there is none (it would be below zero, or there is no box or two). */
export function solve(e: Eq): number | null {
  const gaps = [e.l, e.r, e.res].filter(x => x === null).length;
  if (gaps !== 1) return null;
  let v: number;
  if (e.res === null) v = e.op === '+' ? e.l! + e.r! : e.l! - e.r!;
  else if (e.l === null) v = e.op === '+' ? e.res - e.r! : e.res + e.r!;
  else v = e.op === '+' ? e.res - e.l : e.l - e.res;
  return Number.isInteger(v) && v >= 0 ? v : null;
}

// ---------- making the numbers ----------

/** x + y = z: how big, and whether the ones may make a new ten. `tens`: x and y are round tens. */
interface Rule { readonly top: number; readonly carry: 'no' | 'any' | 'yes'; readonly tens?: boolean; readonly bottom?: number }
function triple(rng: Rng, rule: Rule): [number, number, number] {
  for (;;) {
    let x: number, y: number;
    if (rule.tens) { x = 10 * int(rng, 1, Math.floor(rule.top / 10) - 1); y = 10 * int(rng, 1, Math.floor(rule.top / 10) - 1); }
    else { x = int(rng, rule.bottom ?? MIN, rule.top - MIN); y = int(rng, rule.bottom ?? MIN, rule.top - MIN); }
    const z = x + y, c = carries(x, y);
    if (z > rule.top || x === y || x < MIN || y < MIN) continue;
    if (rule.carry === 'no' && c) continue;
    if (rule.carry === 'yes' && !c) continue;
    return [x, y, z];
  }
}
/** The numbers of a one-step story from x + y = z: join s + c = e, separate s − c = e, part p + q = w, compare small + d = big. */
function slotsFor(shape: Shape, [x, y, z]: [number, number, number]): Nums {
  if (shape === 'join') return { '#s': x, '#c': y, '#e': z };
  if (shape === 'sep') return { '#s': z, '#c': y, '#e': x };
  if (shape === 'part') return { '#p': x, '#q': y, '#w': z };
  return { '#small': x, '#d': y, '#big': z };
}
/** Which operation finds the asked number: adding when it is the whole (or the start of a separate story), else taking away. */
export function opOf(shape: Shape, ask: Slot): 'add' | 'sub' {
  if (shape === 'join') return ask === '#e' ? 'add' : 'sub';
  if (shape === 'sep') return ask === '#s' ? 'add' : 'sub';
  if (shape === 'part') return ask === '#w' ? 'add' : 'sub';
  return ask === '#big' ? 'add' : 'sub';
}
/** The number sentence in the story's own order, with a box where the asked number goes. */
export function storyEq(shape: Shape, ask: Slot, n: Nums, compareSaid?: readonly Slot[]): Eq {
  const v = (s: Slot) => (s === ask ? null : n[s]!);
  if (shape === 'join') return { l: v('#s'), op: '+', r: v('#c'), res: v('#e') };
  if (shape === 'sep') return { l: v('#s'), op: '-', r: v('#c'), res: v('#e') };
  if (shape === 'part') return { l: v('#p'), op: '+', r: v('#q'), res: v('#w') };
  // compare: "how many more" is big − small; "d more than", and the small one said, is small + d; the big one said, big − d
  if (ask === '#d') return { l: n['#big']!, op: '-', r: n['#small']!, res: null };
  if (ask === '#big') return { l: n['#small']!, op: '+', r: n['#d']!, res: null };
  void compareSaid;
  return { l: n['#big']!, op: '-', r: n['#d']!, res: null };
}

export interface Story {
  readonly id: OneId | CompareId;
  readonly shape: Shape;
  readonly ask: Slot;
  readonly noun: Noun;
  readonly nums: Nums;
  readonly sentences: readonly Sentence[];
  readonly answer: number;
  readonly op: 'add' | 'sub';
  /** In the story's order, with a box for the answer. */
  readonly eq: Eq;
  /** The number that is not needed, and which sentence says it (Which Sum Level 3). */
  readonly extra: { readonly n: number; readonly at: number } | null;
}

function tell(id: OneId | CompareId, rule: Rule, rng: Rng, extra = false): Story {
  const t: OneTemplate = id in ONE_STEP ? ONE_STEP[id as OneId] : COMPARE[id as CompareId];
  for (;;) {
    const nums = slotsFor(t.shape, triple(rng, rule));
    const answer = nums[t.ask]!;
    const said = Object.entries(nums).filter(([k]) => k !== t.ask).map(([, v]) => v!);
    // he can't echo a number in the story and be right
    if (said.includes(answer)) continue;
    const lines: Line[] = [...t.lines];
    let ex: Story['extra'] = null;
    if (extra) {
      let x = int(rng, MIN, 9);
      while (x === answer || said.includes(x)) x = int(rng, MIN, 12);
      nums['#x'] = x;
      // between two sentences, never after the question, and only before one that names the story's own thing: after "5 sailors
      // watched.", "71 more left after lunch." or "Now there are 82." would be about the sailors (pass 2)
      const before = lines.map((_, k) => k).filter(k => k >= 1 && lines[k]!.some(p => !p.startsWith('#') && new RegExp(`\\b${t.noun}\\b`).test(p)));
      const at = pick(rng, before);
      lines.splice(at, 0, EXTRA[extraFor(t.noun)]);
      ex = { n: x, at };
    }
    return {
      id, shape: t.shape, ask: t.ask, noun: t.noun, nums, sentences: lines.map(l => sentenceOf(l, nums)), answer,
      op: opOf(t.shape, t.ask), eq: storyEq(t.shape, t.ask, nums), extra: ex,
    };
  }
}

// ---------- Deck Log ----------

export interface OneProblem { readonly kind: 'one'; readonly story: Story; readonly answer: string }
const RESULT: OneId[] = ['landMore', 'takeOffLeft', 'heliLeft', 'liftDown', 'sailorsAll', 'boatsOut'];
const CHANGE: OneId[] = ['landSome', 'takeOffSome', 'liftSomeLeft', 'sailorsBelow', 'boatsIn'];
const START: OneId[] = ['landedFirst', 'tookOffFirst', 'wentDownFirst', 'cameUpFirst', 'heliAwayFirst'];
/** Which stories a Level tells. A Level keeps some of the one before (adding ones especially), so "take the two numbers away" doesn't
 *  become a rule of its own: Level 2's changes are nearly all found by taking away, as Bot Stories found. */
export function oneIds(level: Level, stretch: Stretch): OneId[] {
  if (level === 1) return RESULT;
  if (level === 2) return [...CHANGE, ...CHANGE, 'landMore', 'heliLeft', 'sailorsAll', 'sailorsLeft', ...(stretch === 2 ? ['takeOffLeft'] as const : [])];
  return [...START, ...START, ...CHANGE, 'heliLeft', 'sailorsLeft'];
}
export function oneRule(level: Level, stretch: Stretch): Rule {
  if (level === 1) return stretch === 0 ? { top: 90, carry: 'no', tens: true } : { top: 99, carry: 'no', bottom: stretch === 1 ? 11 : MIN };
  if (level === 2) return { top: 99, carry: stretch === 0 ? 'no' : 'any' };
  return { top: stretch === 0 ? 60 : 99, carry: stretch === 0 ? 'no' : 'any' };
}
export function makeOne(level: Level, stretch: Stretch, rng: Rng): OneProblem {
  const story = tell(pick(rng, oneIds(level, stretch)), oneRule(level, stretch), rng);
  return { kind: 'one', story, answer: String(story.answer) };
}

// ---------- Which Sum ----------

export interface PickProblem { readonly kind: 'pick'; readonly story: Story; readonly choices: readonly string[]; readonly answer: string; readonly level: Level }
/** The number sentences he chooses from: the one that fits, and the real mistakes: the other operation on the story's numbers, adding the
 *  two numbers he heard (the key-word trap), and (Level 3) the number that is not needed used in place of one that is. Exactly one fits:
 *  any sentence whose box holds the answer is never offered as a wrong one. */
export function pickChoices(story: Story, level: Level, rng: Rng): string[] {
  const right = level === 1 ? resultEq(story) : story.eq;
  const said = story.sentences.flatMap(s => s.nums).filter(n => n !== story.nums['#x']);
  const [a, b] = said.length >= 2 ? [said[0]!, said[1]!] : [said[0]!, said[0]!];
  const hi = Math.max(a, b), lo = Math.min(a, b);
  // every one-step story is answered by the two numbers' sum or their difference: the wrong sentences are the other one's
  const sumForms: Eq[] = [{ l: a, op: '+', r: b, res: null }, { l: null, op: '-', r: lo, res: hi }];
  const diffForms: Eq[] = [{ l: hi, op: '-', r: lo, res: null }, { l: lo, op: '+', r: null, res: hi }];
  const other = shuffle(rng, story.answer === a + b ? diffForms : sumForms);
  const wrong: Eq[] = [];
  if (level === 1) wrong.push(right.op === '+' ? diffForms[0]! : sumForms[0]!);
  else {
    if (level === 3 && story.extra) {
      const x = story.extra.n, swaps = (['l', 'r', 'res'] as const).filter(k => right[k] !== null).map(k => ({ ...right, [k]: x }) as Eq);
      const ok = swaps.filter(e => { const v = solve(e); return v !== null && v !== story.answer; });
      if (ok.length) wrong.push(pick(rng, ok));
    }
    wrong.push(...other);
  }
  const rightText = eqText(right);
  const keep = [...new Map(wrong.filter(e => {
    const v = solve(e);
    return v !== null && v !== story.answer && eqText(e) !== rightText && [e.l, e.r, e.res].every(n => n === null || n <= TOP);
  }).map(e => [eqText(e), e])).values()];
  const n = level === 1 ? 1 : 2;
  return shuffle(rng, [rightText, ...keep.slice(0, n).map(eqText)]);
}
/** Level 1 writes every story as a sum to work out: `38 + 25 = ?` or `38 − 25 = ?`. */
export function resultEq(story: Story): Eq {
  const e = story.eq;
  if (e.res === null) return e;
  const known = [e.l, e.r, e.res].filter((x): x is number => x !== null);
  const [hi, lo] = [Math.max(...known), Math.min(...known)];
  return story.op === 'add' ? { l: known[0]!, op: '+', r: known[1]!, res: null } : { l: hi, op: '-', r: lo, res: null };
}
export function pickIds(level: Level, stretch: Stretch): OneId[] {
  if (level === 1) return RESULT;
  if (level === 2) return stretch === 2 ? [...CHANGE, ...START] : CHANGE;
  return [...RESULT, ...CHANGE, ...(stretch >= 1 ? START : [])];
}
export function makePick(level: Level, stretch: Stretch, rng: Rng): PickProblem {
  for (;;) {
    const story = tell(pick(rng, pickIds(level, stretch)), { top: 99, carry: 'any', ...(level === 1 && stretch === 0 ? { tens: true, top: 90 } : {}) }, rng, level === 3);
    const choices = pickChoices(story, level, rng);
    if (choices.length !== (level === 1 ? 2 : 3)) continue;
    if (story.extra && !choices.some(c => [...c.matchAll(/\d+/g)].some(m => m[0] === String(story.extra!.n)))) continue;
    return { kind: 'pick', story, choices, answer: eqText(level === 1 ? resultEq(story) : story.eq), level };
  }
}

// ---------- How Many More ----------

export interface CompareProblem { readonly kind: 'compare'; readonly story: Story; readonly answer: string; readonly bars: boolean }
export function compareIds(level: Level, stretch: Stretch): CompareId[] {
  if (level === 1) return ['bigMore', 'deckMore', 'heliMore'];
  if (level === 2) return ['smallFewer', 'deckFewer', 'smallFewer', 'deckFewer', ...(stretch >= 1 ? ['bigMore', 'deckMore'] as const : [])];
  return ['moreFindSmall', 'fewerFindBig', 'moreFindBig', 'fewerFindSmall', ...(stretch === 2 ? ['deckFewer', 'heliMore'] as const : [])];
}
export function compareRule(level: Level, stretch: Stretch): Rule {
  if (level === 1) return { top: stretch === 0 ? 30 : stretch === 1 ? 60 : 99, carry: 'no' };
  if (level === 2) return { top: stretch === 0 ? 60 : 99, carry: stretch === 0 ? 'no' : 'any' };
  return { top: 99, carry: stretch === 0 ? 'no' : 'any' };
}
export function makeCompare(level: Level, stretch: Stretch, rng: Rng): CompareProblem {
  const story = tell(pick(rng, compareIds(level, stretch)), compareRule(level, stretch), rng);
  // the two rows are drawn at Level 1 and at Level 2 up to Stretch 1; then he pictures them himself
  return { kind: 'compare', story, answer: String(story.answer), bars: level === 1 || (level === 2 && stretch < 2) };
}

// ---------- Two Steps ----------

export interface TwoStory {
  readonly id: TwoId;
  readonly noun: Noun;
  readonly nums: Nums;
  readonly sentences: readonly Sentence[];
  readonly middleQuestion: Sentence;
  /** The first step's answer, never said in the story, and the last. */
  readonly middle: number;
  readonly answer: number;
  /** The two number sentences, in the story's order. */
  readonly eqs: readonly [Eq, Eq];
}
export interface TwoProblem { readonly kind: 'two'; readonly story: TwoStory; readonly stepped: boolean; readonly answer: string }

export function twoIds(level: Level): TwoId[] {
  if (level === 1) return ['landLand', 'liftUpUp', 'comeUpUp'];
  if (level === 2) return ['landTakeOff', 'downThenUp', 'belowThenUp', 'boatsInOut'];
  return ['landTakeOff', 'downThenUp', 'boatsInOut', 'takeOffTwice', 'heliAwayBack', 'bothFewer', 'bothMore', 'landLand'];
}
const apply = (x: number, op: '+' | '-', y: number) => (op === '+' ? x + y : x - y);
/** Every answer he could get from one step on two of the story's numbers: none of them may be the true answer. */
export const oneStepGuesses = (said: readonly number[]) => said.flatMap((x, i) => said.flatMap((y, j) => (i < j ? [x + y, Math.abs(x - y)] : [])));

export function tellTwo(id: TwoId, level: Level, stretch: Stretch, rng: Rng): TwoStory {
  const t: TwoTemplate = TWO_STEP[id];
  const top = level === 1 ? 20 : level === 2 ? (stretch === 0 ? 50 : 99) : 99;
  const carry = level === 2 && stretch === 0 ? 'no' : 'any';
  const small = level === 1 ? 9 : top - MIN;
  for (;;) {
    const a = int(rng, MIN, top - MIN), b = int(rng, MIN, small), k = int(rng, MIN, small);
    const [op1, op2] = t.ops;
    const m = apply(a, op1, b);
    const r = t.form === 'both' ? m + a : apply(m, op2, k);
    const steps: [number, number][] = t.form === 'both' ? [[a, b], [a, m]] : [[a, b], [m, k]];
    if (m < MIN || m > top || r < MIN || r > top) continue;
    if (carry === 'no' && steps.some(([x, y], i) => ((i === 0 ? op1 : op2) === '+' ? carries(x, y) : ones(x) < ones(y)))) continue;
    const said = t.form === 'both' ? [a, b] : [a, b, k];
    if (new Set(said).size !== said.length || said.includes(m) || said.includes(r) || m === r) continue;
    if (oneStepGuesses(said).includes(r)) continue; // a true two-step story: no single step on two of its numbers gets there
    const nums: Nums = t.form === 'both' ? { '#a': a, '#b': b } : { '#a': a, '#b': b, '#k': k };
    const e1: Eq = { l: a, op: op1, r: b, res: null };
    const e2: Eq = t.form === 'both' ? { l: a, op: '+', r: m, res: null } : { l: m, op: op2, r: k, res: null };
    return { id, noun: t.noun, nums, sentences: t.lines.map(l => sentenceOf(l, nums)), middleQuestion: sentenceOf(t.middle, nums), middle: m, answer: r, eqs: [e1, e2] };
  }
}
export function makeTwo(level: Level, stretch: Stretch, rng: Rng): TwoProblem {
  const story = tellTwo(pick(rng, twoIds(level)), level, stretch, rng);
  // Level 1, Stretch 0: the middle question is asked aloud first, and he answers it, then the last
  const stepped = level === 1 && stretch === 0;
  return { kind: 'two', story, stepped, answer: stepped ? `${story.middle},${story.answer}` : String(story.answer) };
}

// ---------- Mission Board ----------

export const SQUADS = ['Red', 'Blue', 'Green', 'Gold', 'Purple'] as const;
export type Squad = (typeof SQUADS)[number];
export const SQUAD_HEX: Record<Squad, string> = { Red: '#e63946', Blue: '#2f8fe8', Green: '#2fa84f', Gold: '#ffc400', Purple: '#8a4fd8' };
export type Step = 1 | 2 | 5 | 10;
export interface BoardProblem {
  readonly kind: 'board';
  readonly form: 'read' | 'more' | 'total';
  readonly squads: readonly Squad[];
  /** Crates each squadron carried. */
  readonly bars: readonly number[];
  readonly step: Step;
  /** The lines on the scale go up to here. */
  readonly top: number;
  /** Which bars the question is about: one (read), two (more: the first is the bigger), two or three (total). */
  readonly asked: readonly number[];
  readonly answer: string;
}
/** A bar ends on a marked line, except at Level 3 on a scale of twos or tens, where it may end halfway between two. */
export const onLine = (x: number, step: Step) => x % step === 0;

export function boardShape(level: Level, stretch: Stretch, rng: Rng): { form: BoardProblem['form']; step: Step; half: boolean; many: number } {
  if (level === 1) return { form: 'read', step: 1, half: false, many: 1 };
  if (level === 2) return { form: 'more', step: stretch === 0 ? 2 : stretch === 1 ? 5 : pick(rng, [2, 5] as const), half: false, many: 2 };
  return { form: 'total', step: stretch === 0 ? 2 : 10, half: true, many: stretch === 2 ? 3 : 2 };
}
export function makeBoard(level: Level, stretch: Stretch, rng: Rng): BoardProblem {
  const { form, step, half, many } = boardShape(level, stretch, rng);
  const lines = level === 1 ? (stretch === 0 ? 6 : stretch === 1 ? 8 : 10) : 10;
  const top = step * lines;
  for (;;) {
    const squads = shuffle(rng, SQUADS).slice(0, 4);
    const bars = squads.map(() => {
      const k = int(rng, 1, lines - (half ? 1 : 0));
      return half && rng() < .5 ? k * step + step / 2 : k * step;
    }).map(Math.round);
    if (bars.some(b => b < 1 || b > top)) continue;
    if (new Set(bars).size < 4) continue; // four different bars, so "which one" is never a guess between two the same
    const order = shuffle(rng, [0, 1, 2, 3]);
    const asked = order.slice(0, many);
    if (form === 'more' && bars[asked[0]!]! < bars[asked[1]!]!) asked.reverse();
    const values = asked.map(i => bars[i]!);
    const answer = form === 'read' ? values[0]! : form === 'more' ? values[0]! - values[1]! : values.reduce((s, v) => s + v, 0);
    if (answer < 1 || answer > TOP) continue;
    if (form === 'more' && answer < step) continue;
    // at Level 3 at least one asked bar ends halfway, so reading between the lines is what is practised
    if (half && !values.some(v => !onLine(v, step))) continue;
    if (form !== 'read' && values.includes(answer)) continue;
    return { kind: 'board', form, squads, bars, step, top, asked, answer: String(answer) };
  }
}

// ---------- every kind ----------

export type Question = OneProblem | PickProblem | CompareProblem | TwoProblem | BoardProblem;
export type WheelProblem = OneProblem | CompareProblem | TwoProblem | BoardProblem;
export const onWheels = (q: Question): q is WheelProblem => q.kind !== 'pick';

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  switch (kind) {
    case 'one': return makeOne(level, stretch, rng);
    case 'pick': return makePick(level, stretch, rng);
    case 'compare': return makeCompare(level, stretch, rng);
    case 'two': return makeTwo(level, stretch, rng);
    case 'board': return makeBoard(level, stretch, rng);
  }
}

/** Null when it isn't an answer to this question at all. A stepped Two Steps answer is `middle,last`; `middle,` is the first part alone. */
export function isRightAnswer(q: Question, answer: string): boolean | null {
  if (q.kind === 'pick') return q.choices.includes(answer) ? answer === q.answer : null;
  if (q.kind === 'two' && q.stepped) {
    if (!/^\d{1,2},\d{0,2}$/.test(answer)) return null;
    return answer === q.answer;
  }
  return /^\d{1,2}$/.test(answer) ? Number(answer) === Number(q.answer) : null;
}

/** The real mistakes on the wheels, for the first-miss line: the other operation, a number from the story, the first step given as the
 *  answer, a bar read one line off. */
export type Slip = 'otherOp' | 'echo' | 'firstStep' | 'lineOff' | 'other';
export function slipOf(q: WheelProblem, given: number): Slip {
  if (q.kind === 'board') {
    if (q.form === 'read' && Math.abs(given - Number(q.answer)) === q.step) return 'lineOff';
    const asked = q.asked.map(i => q.bars[i]!);
    if (asked.includes(given)) return 'echo';
    if (q.form === 'more' && given === asked[0]! + asked[1]!) return 'otherOp';
    return 'other';
  }
  if (q.kind === 'two') {
    if (given === q.story.middle) return 'firstStep';
    const said = q.story.sentences.flatMap(s => s.nums);
    if (said.includes(given)) return 'echo';
    return 'other';
  }
  const s = q.story, said = s.sentences.flatMap(x => x.nums);
  if (said.includes(given)) return 'echo';
  const [x, y] = said;
  if (x !== undefined && y !== undefined && given === (s.op === 'add' ? Math.abs(x - y) : x + y)) return 'otherOp';
  return 'other';
}
