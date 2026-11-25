// What Coaster Crew asks: six kinds, three Levels each. Every question is a scene (what is drawn, and how it will move) and two or three
// choices. The answer is never written by hand: `outcome()` works it out from the scene with the one motion model (physics/motion.ts),
// and the generator only keeps a question whose written answer is that outcome. The scene that plays after he answers is drawn by the
// same functions (questions/scenes.ts), so what he sees always agrees with the answer. problems.test.ts makes thousands and checks.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import { coastDistance, headOn, magnetPulls, MAGNET_REACH, offWall, polesPull, pushStarts, sidePush, speedAfterPush, stoppingDistance, angleOf, type Vec } from '../physics/motion';
import { hillOutcome } from './hills';
import { ACTIONS, CARTS, comparable, GROUNDS, groundOf, SHEETS, SMALL_MAGNETIC, THINGS, thingOf, type ActionId, type CartId, type GroundId, type SheetId, type ThingId } from './tables';

export const KINDS = ['push', 'hill', 'heavy', 'rough', 'bump', 'magnet'] as const;
export type Kind = (typeof KINDS)[number];
export type Level = 1 | 2 | 3;

/** Four ways on a table seen from above: east is to the right of the screen, north up. */
export type Dir = 'e' | 'w' | 'n' | 's';
export const DIR_VEC: Record<Dir, Vec> = { e: { x: 1, y: 0 }, w: { x: -1, y: 0 }, n: { x: 0, y: -1 }, s: { x: 0, y: 1 } };

/** The floor the push and load carts roll on (a smooth floor), and how hard its rub holds a cart at rest. */
export const CART_FLOOR = 0.05, START_HOLD = 0.08, EMPTY_CART = 20;

export type Scene =
  /** Push or Pull L1: someone doing something everyday. */
  | { readonly type: 'act'; readonly act: ActionId }
  /** Push or Pull L2: a box on the floor from above, a hand pushing it, or a rope pulling it, the arrow showing which way. */
  | { readonly type: 'way'; readonly by: 'push' | 'pull'; readonly dir: Dir }
  /** Push or Pull L3: the same cart in two lanes, a big push and a small one (impulses, N·s). */
  | { readonly type: 'pushes'; readonly lanes: readonly { readonly cart: CartId; readonly impulse: number }[] }
  /** Hills: each lane a cart let go from the top of a slope `start` metres high, then (maybe) a hill `hill` metres high to get over. */
  | { readonly type: 'hills'; readonly lanes: readonly { readonly cart: CartId; readonly start: number; readonly hill?: number }[] }
  /** Heavy and Light, all on flat ground: carts with different loads (kg) get the same push, or the same push to start, or are pushed
   *  back on while rolling at the same speed. */
  | { readonly type: 'loads'; readonly mode: 'far' | 'start' | 'stop'; readonly lanes: readonly { readonly cart: CartId; readonly mass: number }[] }
  /** Rough and Smooth: the same cart, the same push, on different grounds. */
  | { readonly type: 'grounds'; readonly mode: 'far' | 'first' | 'station' | 'long'; readonly lanes: readonly { readonly ground: GroundId }[] }
  /** Bump, from above on a flat table: a ball meets a still ball, a wall, or a push from the side. */
  | { readonly type: 'bump'; readonly mode: 'ball' | 'wall' | 'side'; readonly v: Vec; readonly wall?: Vec; readonly push?: Vec }
  /** Magnets: which thing it pulls, two magnets' ends, near and far, through a sheet. */
  | { readonly type: 'magnet'; readonly mode: 'which' | 'will'; readonly things: readonly ThingId[] }
  | { readonly type: 'poles'; readonly ends: readonly ['N' | 'S', 'N' | 'S'] }
  | { readonly type: 'near'; readonly clips: readonly { readonly cart: CartId; readonly d: number }[] }
  | { readonly type: 'through'; readonly thing: ThingId; readonly sheet: SheetId };

export type ChoiceKind = 'word' | 'cart' | 'ground' | 'arrow' | 'thing';
export interface Question {
  readonly kind: Kind;
  readonly level: Level;
  /** What is said (clips chained), and what is written. */
  readonly ask: readonly string[];
  readonly text: string;
  readonly scene: Scene;
  readonly choiceKind: ChoiceKind;
  readonly choices: readonly string[];
  readonly answer: string;
}

// ---------- the outcome, from the motion model ----------

/** The angle (degrees, screen: 0 = right, 90 = down) of each arrow choice. */
export const arrowAngle = (id: string) => Number(id.slice(1));
const deg = (v: Vec) => ((Math.round(angleOf(v) * 180 / Math.PI) % 360) + 360) % 360;
const angleGap = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };

/** What happens in the scene, as one of the question's choices. The questions' answers are this; the tests check it. */
export function outcome(q: Pick<Question, 'scene' | 'choices'>): string {
  const sc = q.scene;
  switch (sc.type) {
    case 'act': return ACTIONS.find(a => a.id === sc.act)!.is;
    case 'way': return `a${deg(DIR_VEC[sc.dir])}`; // a push sends it along the arrow; a rope pulls it toward the hand, along the arrow too
    case 'pushes': return best(sc.lanes, l => coastDistance(speedAfterPush(l.impulse, EMPTY_CART), CART_FLOOR)).cart;
    case 'hills': return hillOutcome(sc.lanes, q.choices);
    case 'loads': {
      if (sc.mode === 'far') return best(sc.lanes, l => coastDistance(speedAfterPush(LOAD_PUSH, l.mass), CART_FLOOR)).cart;
      if (sc.mode === 'start') { const still = sc.lanes.filter(l => !pushStarts(START_PUSH, l.mass, START_HOLD)); return still.length === 1 ? still[0]!.cart : 'none'; }
      return best(sc.lanes, l => stoppingDistance(l.mass, STOP_SPEED, STOP_FORCE)).cart;
    }
    case 'grounds': {
      const far = (l: { ground: GroundId }) => coastDistance(GROUND_PUSH, groundOf(l.ground).resistance);
      return sc.mode === 'far' || sc.mode === 'long' ? best(sc.lanes, far).ground : best(sc.lanes, l => -far(l)).ground;
    }
    case 'bump': {
      if (sc.mode === 'ball') { const after = headOn(sc.v).struck, dot = after.x * sc.v.x + after.y * sc.v.y; return dot > 0 ? 'on' : dot < 0 ? 'back' : 'stay'; }
      const v = sc.mode === 'wall' ? offWall(sc.v, sc.wall!) : sidePush(sc.v, sc.push!, 1);
      const a = deg(v);
      return [...q.choices].sort((x, y) => angleGap(arrowAngle(x), a) - angleGap(arrowAngle(y), a))[0]!;
    }
    case 'magnet': {
      if (sc.mode === 'will') return magnetPulls(thingOf(sc.things[0]!).magnetic, MAGNET_REACH / 2) ? 'yes' : 'no';
      const pulled = sc.things.filter(t => magnetPulls(thingOf(t).magnetic, MAGNET_REACH / 2));
      return pulled.length === 1 ? pulled[0]! : 'none';
    }
    case 'poles': return polesPull(sc.ends[0], sc.ends[1]) ? 'together' : 'apart';
    case 'near': { const pulled = sc.clips.filter(c => magnetPulls(true, c.d)); return pulled.length === 1 ? pulled[0]!.cart : 'none'; }
    case 'through': return magnetPulls(thingOf(sc.thing).magnetic, THROUGH_D) ? 'yes' : 'no';
  }
}
const best = <T,>(xs: readonly T[], f: (x: T) => number): T => xs.reduce((a, b) => (f(b) > f(a) ? b : a));

/** The pushes and speeds the scenes use. */
export const LOAD_PUSH = 50, START_PUSH = 70, STOP_SPEED = 2, STOP_FORCE = 40, GROUND_PUSH = 4, THROUGH_D = MAGNET_REACH * 0.55;

// ---------- making questions ----------

const carts = (n: number, r: Rng): CartId[] => shuffle(r, CARTS.map(c => c.id)).slice(0, n);
const q = (x: Omit<Question, 'text'> & { text?: string }): Question => ({ ...x, text: x.text ?? x.ask.filter(s => /[.?!]$/.test(s)).at(-1) ?? x.ask.join(' ') });

/** Hill heights in metres. Any two in one scene differ by at least a quarter (no two within a fifth of each other). */
export const HILL_HEIGHTS = [1.2, 1.6, 2, 2.5, 3.2, 4, 5] as const;
export const HILL_APART = 1.25;
const apart = (hs: readonly number[]) => hs.every((a, i) => hs.every((b, j) => i === j || Math.max(a, b) / Math.min(a, b) >= HILL_APART - 1e-9));

function pushQ(level: Level, r: Rng): Question {
  if (level === 1) {
    const a = pick(r, ACTIONS);
    return q({ kind: 'push', level, ask: [a.said, 'Is it a push or a pull?'], scene: { type: 'act', act: a.id }, choiceKind: 'word', choices: ['push', 'pull'], answer: a.is });
  }
  if (level === 2) {
    const by = pick(r, ['push', 'pull'] as const), dir = pick(r, ['e', 'w', 'n', 's'] as const);
    const scene: Scene = { type: 'way', by, dir };
    return q({ kind: 'push', level, ask: [by === 'push' ? 'The hand pushes the box.' : 'The rope pulls the box.', 'Which way will it go?'], scene, choiceKind: 'arrow', choices: ['a0', 'a90', 'a180', 'a270'], answer: outcome({ scene, choices: [] }) });
  }
  const [a, b] = carts(2, r), big = pick(r, [0, 1]);
  const lanes = [{ cart: a!, impulse: big === 0 ? 60 : 26 }, { cart: b!, impulse: big === 0 ? 26 : 60 }];
  const scene: Scene = { type: 'pushes', lanes };
  return q({ kind: 'push', level, ask: ['A big push and a small push.', 'Which cart will go farther?'], scene, choiceKind: 'cart', choices: lanes.map(l => l.cart), answer: outcome({ scene, choices: [] }) });
}

function hillQ(level: Level, r: Rng): Question {
  for (;;) {
    if (level === 1) {
      const hs = shuffle(r, HILL_HEIGHTS).slice(0, 2);
      if (!apart(hs)) continue;
      const cs = carts(2, r), lanes = hs.map((h, i) => ({ cart: cs[i]!, start: h }));
      const scene: Scene = { type: 'hills', lanes }, choices = cs;
      return q({ kind: 'hill', level, ask: ['Two carts roll down two hills.', 'Which one is faster at the bottom?'], scene, choiceKind: 'cart', choices, answer: outcome({ scene, choices }) });
    }
    if (level === 2) {
      const start = pick(r, HILL_HEIGHTS.slice(2)), over = r() < .5;
      const can = HILL_HEIGHTS.filter(h => (over ? h * HILL_APART <= start + 1e-9 : h >= start * HILL_APART - 1e-9));
      if (!can.length) continue;
      const hill = pick(r, can), scene: Scene = { type: 'hills', lanes: [{ cart: pick(r, CARTS).id, start, hill }] }, choices = ['yes', 'no'];
      return q({ kind: 'hill', level, ask: ['The cart rolls down the hill.', 'Will it get over the next hill?'], scene, choiceKind: 'word', choices, answer: outcome({ scene, choices }) });
    }
    // Level 3: three starting heights and one hill (only the highest start gets over), or one start and three hills (only the lowest is got over)
    if (r() < .5) {
      const starts = shuffle(r, HILL_HEIGHTS).slice(0, 3).sort((a, b) => a - b), hill = pick(r, HILL_HEIGHTS);
      if (!apart([...starts, hill]) || !(hill > starts[1]! && hill < starts[2]!)) continue;
      const cs = carts(3, r), lanes = shuffle(r, starts).map((s, i) => ({ cart: cs[i]!, start: s, hill })), scene: Scene = { type: 'hills', lanes };
      return q({ kind: 'hill', level, ask: ['Three carts start at three heights.', 'Which one will get over the hill?'], scene, choiceKind: 'cart', choices: cs, answer: outcome({ scene, choices: cs }) });
    }
    const start = pick(r, HILL_HEIGHTS), hills = shuffle(r, HILL_HEIGHTS).slice(0, 3).sort((a, b) => a - b);
    if (!apart([start, ...hills]) || !(hills[0]! < start && hills[1]! > start)) continue;
    const cs = carts(3, r), lanes = shuffle(r, hills).map((h, i) => ({ cart: cs[i]!, start, hill: h })), scene: Scene = { type: 'hills', lanes };
    return q({ kind: 'hill', level, ask: ['Three carts start at the same height.', 'Which one will get over its hill?'], scene, choiceKind: 'cart', choices: cs, answer: outcome({ scene, choices: cs }) });
  }
}

/** Loads (kg): an empty cart, one with some sandbags, one full of them. Any two differ at least twofold. */
export const LOADS = [EMPTY_CART, 45, 100] as const;
function heavyQ(level: Level, r: Rng): Question {
  const n = level === 1 ? 2 : r() < .5 ? 2 : 3;
  const masses = n === 2 ? shuffle(r, [LOADS[0], LOADS[2]]) : shuffle(r, LOADS);
  const cs = carts(n, r), lanes = masses.map((m, i) => ({ cart: cs[i]!, mass: m }));
  const mode = level === 1 ? 'far' : level === 2 ? 'start' : 'stop';
  const scene: Scene = { type: 'loads', mode, lanes };
  const ask = mode === 'far' ? ['Both carts get the same push.', 'Which cart will go farther?']
    : mode === 'start' ? ['Which cart needs the bigger push to get going?'] : ['The carts roll at the same speed.', 'Which cart is harder to stop?'];
  return q({ kind: 'heavy', level, ask, scene, choiceKind: 'cart', choices: cs, answer: outcome({ scene, choices: cs }) });
}

function roughQ(level: Level, r: Rng): Question {
  for (;;) {
    const n = level === 1 && r() < .5 ? 3 : r() < .4 ? 3 : 2;
    const gs = shuffle(r, GROUNDS.map(g => g.id)).slice(0, n);
    if (!gs.every((a, i) => gs.every((b, j) => i === j || comparable(a, b)))) continue;
    const mode = level === 1 ? 'far' : level === 2 ? 'first' : pick(r, ['station', 'long'] as const);
    const scene: Scene = { type: 'grounds', mode, lanes: gs.map(g => ({ ground: g })) };
    const ask = mode === 'far' ? ['The cart gets the same push each time.', 'On which ground will it go farthest?']
      : mode === 'first' ? ['The cart gets the same push each time.', 'Which ground will stop it first?']
      : mode === 'station' ? ['The cart must stop at the station.', 'Which ground should we use?'] : ['The cart must coast a long way.', 'Which ground should we use?'];
    return q({ kind: 'rough', level, ask, scene, choiceKind: 'ground', choices: gs, answer: outcome({ scene, choices: gs }) });
  }
}

function bumpQ(level: Level, r: Rng): Question {
  if (level === 1) {
    // the still ball always rolls on (that's the lesson), so the buttons are shuffled: the right one isn't always first
    const v = pick(r, [{ x: 1, y: 0 }, { x: -1, y: 0 }]), scene: Scene = { type: 'bump', mode: 'ball', v }, choices = shuffle(r, ['on', 'stay', 'back']);
    return q({ kind: 'bump', level, ask: ['A rolling ball hits a ball that is still.', 'What will the still ball do?'], scene, choiceKind: 'arrow', choices, answer: outcome({ scene, choices }) });
  }
  if (level === 2) {
    // the wall is on the right; the ball comes straight at it, or slanting down or up
    const slant = pick(r, [0, 1, -1]), v = { x: 1, y: slant }, wall = { x: -1, y: 0 };
    const back = deg({ x: -1, y: -slant }), through = deg(v), mirror = deg(offWall(v, wall));
    const choices = slant === 0 ? shuffle(r, ['a180', 'a0', pick(r, ['a90', 'a270'])]) : shuffle(r, [`a${mirror}`, `a${back}`, `a${through}`]);
    const scene: Scene = { type: 'bump', mode: 'wall', v, wall };
    return q({ kind: 'bump', level, ask: ['A bouncy ball rolls at the wall.', 'Which way will it go after it hits?'], scene, choiceKind: 'arrow', choices, answer: outcome({ scene, choices }) });
  }
  const v = pick(r, [{ x: 2, y: 0 }, { x: -2, y: 0 }]), push = pick(r, [{ x: 0, y: -2 }, { x: 0, y: 2 }]);
  const scene: Scene = { type: 'bump', mode: 'side', v, push };
  const choices = shuffle(r, [`a${deg(v)}`, `a${deg(push)}`, `a${deg(sidePush(v, push, 1))}`]);
  return q({ kind: 'bump', level, ask: ['A rolling ball gets a push from the side.', 'Which way will it go now?'], scene, choiceKind: 'arrow', choices, answer: outcome({ scene, choices }) });
}

const MAGNETIC = THINGS.filter(t => t.magnetic).map(t => t.id), NOT = THINGS.filter(t => !t.magnetic).map(t => t.id);
function magnetQ(level: Level, r: Rng): Question {
  if (level === 1) {
    if (r() < .5) {
      const things = shuffle(r, [pick(r, MAGNETIC), ...shuffle(r, NOT).slice(0, 2)]), scene: Scene = { type: 'magnet', mode: 'which', things };
      return q({ kind: 'magnet', level, ask: ['Which one will the magnet pull?'], scene, choiceKind: 'thing', choices: things, answer: outcome({ scene, choices: things }) });
    }
    const t = pick(r, THINGS).id, scene: Scene = { type: 'magnet', mode: 'will', things: [t] }, choices = ['yes', 'no'];
    return q({ kind: 'magnet', level, ask: [thingOf(t).name, 'Will the magnet pull it?'], text: 'Will the magnet pull it?', scene, choiceKind: 'word', choices, answer: outcome({ scene, choices }) });
  }
  if (level === 2) {
    const ends = [pick(r, ['N', 'S'] as const), pick(r, ['N', 'S'] as const)] as const, scene: Scene = { type: 'poles', ends }, choices = ['together', 'apart'];
    return q({ kind: 'magnet', level, ask: ['Look at the ends of the two magnets.', 'Will they pull together or push apart?'], scene, choiceKind: 'word', choices, answer: outcome({ scene, choices }) });
  }
  if (r() < .5) {
    const cs = carts(2, r), near = pick(r, [0, 1]);
    const clips = cs.map((c, i) => ({ cart: c, d: i === near ? MAGNET_REACH * 0.45 : MAGNET_REACH * 2.4 }));
    const scene: Scene = { type: 'near', clips };
    return q({ kind: 'magnet', level, ask: ['Two paper clips, one near and one far.', 'Which one will the magnet pull?'], scene, choiceKind: 'cart', choices: cs, answer: outcome({ scene, choices: cs }) });
  }
  const sheet = pick(r, SHEETS), thing = r() < .7 ? pick(r, SMALL_MAGNETIC) : pick(r, ['block', 'marble', 'rubber', 'crayon'] as const);
  const scene: Scene = { type: 'through', thing, sheet: sheet.id }, choices = ['yes', 'no'];
  return q({ kind: 'magnet', level, ask: [sheet.said, thingOf(thing).name, 'Will the magnet still pull it?'], text: 'Will the magnet still pull it?', scene, choiceKind: 'word', choices, answer: outcome({ scene, choices }) });
}

export function makeQuestion(kind: Kind, level: Level, r: Rng): Question {
  switch (kind) {
    case 'push': return pushQ(level, r);
    case 'hill': return hillQ(level, r);
    case 'heavy': return heavyQ(level, r);
    case 'rough': return roughQ(level, r);
    case 'bump': return bumpQ(level, r);
    case 'magnet': return magnetQ(level, r);
  }
}

export const isRightAnswer = (x: Question, answer: string) => (x.choices.includes(answer) ? answer === x.answer : null);

/** The words on word buttons, said as each lights. */
export const WORDS = { push: 'Push', pull: 'Pull', yes: 'Yes', no: 'No', together: 'Pull together', apart: 'Push apart' } as const;
export const choiceName = (kind: ChoiceKind, id: string): string | null =>
  kind === 'word' ? WORDS[id as keyof typeof WORDS] : kind === 'ground' ? groundOf(id as GroundId).name : kind === 'thing' ? thingOf(id as ThingId).short : null;
void int;
