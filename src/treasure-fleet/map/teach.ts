// Teaching a miss on the map itself, never with a red X: the compass rose grows and the direction lights and is said, an arrow sweeps
// from the thing named, a map key row pulses with every matching symbol, a grid column lights and its letter is said and then the
// row and its number, the clues are walked again as a dotted line. The second miss (or the first, when he's been missing a lot) goes on
// to show the answer itself, and leaves it there. 🔎 runs that fuller lesson on demand and counts as help.
//
// A lesson is a few signals the question's view reads, kept per question (by its lifetime signal), so the view and the lesson that
// explains a miss draw on the same map.
import { signal, type Signal } from '@preact/signals';
import { sChime, sCount } from '../../audio/sfx';
import { aName, DIR_LINE, letterSaid, shortName, theName, toThe, type Phrase } from '../phrases';
import type { Asking } from '../mix';
import { createVoiceScope, type VoiceScope } from '../voice';
import { CARDINAL_OF, cellId, letterOf, numberOf, thingAt, type Cardinal, type Cell, type KeySym, type Rel } from './map';
import { legsOf, readAt, type AboveProblem, type Clue, type ClueProblem, type GridProblem, type KeyProblem, type WhereProblem } from './problems';

export interface Lesson {
  /** The rose: grown big, with one point lit. Null leaves it as the question shows it. */
  readonly rose: Signal<{ big: boolean; lit: Cardinal | null } | null>;
  /** An arrow from a thing, one way, to the edge or to a square. */
  readonly ray: Signal<{ from: Cell; rel: Rel; to: Cell | null } | null>;
  /** "Between": the band joining two things. */
  readonly span: Signal<{ a: Cell; b: Cell } | null>;
  /** Squares whose thing (or the square itself) glows: the answer shown. */
  readonly glow: Signal<string[]>;
  /** Things pulsing together with their key row. */
  readonly pulse: Signal<string[]>;
  readonly keyLit: Signal<KeySym | null>;
  readonly riverLit: Signal<boolean>;
  /** Grid Square: the lit column and row. */
  readonly col: Signal<number | null>;
  readonly row: Signal<number | null>;
  /** Follow the Clues: the dotted line so far, from the star. */
  readonly path: Signal<Cell[] | null>;
  /** Map Key: things counted so far, in order. */
  readonly counted: Signal<string[]>;
  /** From Above: the thing in the scene that's lit, by its place left to right. */
  readonly sceneLit: Signal<number | null>;
  /** The answer button to look at. */
  readonly hint: Signal<string | null>;
  /** Only one thing animates at a time: starting a new one stops the last. */
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null;
    const cancel = () => current?.cancel();
    lesson = {
      rose: signal(null), ray: signal(null), span: signal(null), glow: signal([]), pulse: signal([]), keyLit: signal(null), riverLit: signal(false),
      col: signal(null), row: signal(null), path: signal(null), counted: signal([]), sceneLit: signal(null), hint: signal(null),
      task: { cancel, start() { cancel(); return (current = createVoiceScope(lifetime)); } },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}

export function clear(l: Lesson) {
  l.rose.value = null; l.ray.value = null; l.span.value = null; l.glow.value = []; l.pulse.value = []; l.keyLit.value = null; l.riverLit.value = false;
  l.col.value = null; l.row.value = null; l.path.value = null; l.counted.value = []; l.sceneLit.value = null;
}

const n = (x: number) => `${x}` as Phrase;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

// ---------- Where Is It ----------

/** The direction asked, lit and said: on the rose when the question has one, on the map for left, right, above and below. */
async function showDirection(rel: Rel, rose: boolean, l: Lesson, v: VoiceScope) {
  const d = CARDINAL_OF[rel];
  if (rose) l.rose.value = { big: true, lit: d };
  await v.say(DIR_LINE[rose ? d : rel]);
}

async function teachWhere(q: WhereProblem, teach: boolean, l: Lesson, v: VoiceScope) {
  const rose = q.rose !== 'none';
  if (q.form === 'side') {
    await showDirection(q.rel, rose, l, v);
    l.ray.value = { from: q.ref, rel: q.rel, to: null };
    await v.wait(reduced() ? 300 : 1100);
    if (teach && v.active) { l.ray.value = { from: q.ref, rel: q.rel, to: q.answer }; l.glow.value = [cellId(q.answer)]; sChime(); await v.say('It is', theName(q.answer.sym)); }
  } else if (q.form === 'between') {
    l.span.value = { a: q.a, b: q.b };
    await v.say('Look between them.');
    if (teach && v.active) { l.glow.value = [cellId(q.answer)]; sChime(); await v.say('It is', theName(q.answer.sym)); }
  } else {
    await showDirection(q.dir, true, l, v);
    await v.say('Look for the one nearest the edge.');
    if (teach && v.active) { l.glow.value = [cellId(q.answer)]; sChime(); await v.say('It is', theName(q.answer.sym)); }
  }
}

// ---------- Map Key ----------

const allOf = (q: KeyProblem, s: KeySym) => q.map.things.filter(t => t.sym === s).map(cellId);
/** The key row and every matching symbol on the map pulse together while it's said. */
async function pulseKind(q: KeyProblem, s: KeySym, line: 'This one means' | 'That one means', l: Lesson, v: VoiceScope) {
  l.keyLit.value = s;
  l.pulse.value = allOf(q, s);
  l.riverLit.value = s === 'river';
  await v.say(line, aName(s));
}

async function teachKey(q: KeyProblem, answer: string, teach: boolean, l: Lesson, v: VoiceScope) {
  const tappedKey = answer.startsWith('key:') ? answer.slice(4) as KeySym : null, tappedCell = readAt(answer), tapped = tappedCell ? thingAt(q.map, tappedCell) : null;
  if (q.form === 'symbol' || q.form === 'find') {
    const wrongKind = tappedKey ?? tapped?.sym ?? null;
    if (wrongKind) await pulseKind(q, wrongKind, 'That one means', l, v);
    if (!v.active) return;
    clear(l);
    await v.say('Look at the map key.');
    if (teach && v.active) {
      await pulseKind(q, q.ask, 'This one means', l, v);
      if (q.form === 'find') { l.glow.value = [cellId(q.answer)]; await v.say('Here it is!'); } else l.hint.value = `key:${q.ask}`;
    }
  } else if (q.form === 'count') {
    l.keyLit.value = q.ask;
    l.pulse.value = allOf(q, q.ask);
    if (!teach) { await v.say('Count them!'); return; }
    await v.say("Let's count them.");
    const ids = allOf(q, q.ask).sort((a, b) => { const [ax, ay] = a.split(',').map(Number), [bx, by] = b.split(',').map(Number); return ay! - by! || ax! - bx!; });
    for (let i = 0; i < ids.length && v.active; i++) { l.counted.value = ids.slice(0, i + 1); sCount(i); await v.say(n(i + 1)); }
    if (v.active) { l.hint.value = `n:${q.count}`; await v.say('So there are', n(q.count)); }
  } else {
    l.riverLit.value = true;
    l.keyLit.value = 'river';
    await showDirection(q.dir, true, l, v);
    await v.say('Look across the river.');
    if (teach && v.active) { l.glow.value = [cellId(q.answer)]; sChime(); await v.say('It is', theName(q.answer.sym)); }
  }
}

// ---------- Grid Square ----------

async function teachGrid(q: GridProblem, teach: boolean, l: Lesson, v: VoiceScope) {
  const target = q.form === 'tap' ? q.target : q.thing, letter = letterOf(target.x), number = numberOf(q.map.h, target.y);
  if (q.form === 'which') l.glow.value = [cellId(q.thing)];
  await v.say(q.form === 'tap' ? 'Letters go along the bottom.' : 'Look down to the letter.');
  l.col.value = target.x;
  await v.say(letterSaid(letter));
  if (!v.active) return;
  await v.say(q.form === 'tap' ? 'Numbers go up the side.' : 'Look across to the number.');
  l.row.value = target.y;
  await v.say(n(number));
  if (!v.active) return;
  if (teach) {
    if (q.form === 'tap') { l.glow.value = [cellId(q.target)]; sChime(); await v.say('Here they meet.'); }
    else { l.hint.value = `pick:${q.answer}`; await v.say('So it is', letterSaid(letter), n(number)); }
  } else {
    await v.wait(600);
    l.col.value = null; l.row.value = null; l.glow.value = [];
  }
}

// ---------- Follow the Clues ----------

/** A clue as it's said: "Go", "north", "2", "squares." or "Then go", "east", "to the hut." */
export function clueLine(c: Clue, first: boolean): Phrase[] {
  const go: Phrase = first ? 'Go' : 'Then go';
  if ('to' in c) return [go, c.dir, toThe(c.to.sym)];
  return [go, c.dir, n(c.n), c.n === 1 ? 'square.' : 'squares.'];
}
export const cluesSaid = (q: Pick<ClueProblem, 'clues'>): Phrase[] => q.clues.flatMap((c, i) => clueLine(c, i === 0));

async function walkClues(q: ClueProblem, l: Lesson, v: VoiceScope) {
  const legs = legsOf(q) ?? [];
  let path: Cell[] = [q.start];
  l.path.value = path;
  for (let i = 0; i < legs.length && v.active; i++) {
    const said = v.say(...clueLine(q.clues[i]!, i === 0));
    l.rose.value = { big: false, lit: q.clues[i]!.dir };
    for (const c of legs[i]!) { if (!v.active) return; path = [...path, c]; l.path.value = path; sCount(path.length - 2); await v.wait(reduced() ? 120 : 380); }
    await said;
  }
  l.rose.value = null;
}

async function teachClue(q: ClueProblem, teach: boolean, l: Lesson, v: VoiceScope) {
  await v.say("Let's follow the clues.");
  await walkClues(q, l, v);
  if (!v.active) return;
  if (teach) { l.glow.value = [cellId(q.end)]; sChime(); await v.say('The treasure is here!'); }
  else { await v.wait(500); l.path.value = null; }
}

// ---------- From Above ----------

async function teachAbove(q: AboveProblem, teach: boolean, l: Lesson, v: VoiceScope) {
  await v.say('Look at each thing.');
  const order = [...q.scene].sort((a, b) => a.x - b.x);
  for (let i = 0; i < order.length && v.active; i++) { l.sceneLit.value = i; await v.say(shortName(order[i]!.sym)); }
  l.sceneLit.value = null;
  if (!v.active) return;
  if (teach) { l.hint.value = `pick:${q.answer}`; sChime(); await v.say('This map shows it from above.'); }
  else await v.say('Look at the order.');
}

// ---------- the lesson after a miss, and 🔎 ----------

/** What the round engine runs after a miss, before he can try again. */
export async function explain(p: Asking, answer: string, teach: boolean, lifetime: AbortSignal) {
  const l = lessonFor(lifetime), v = l.task.start();
  clear(l);
  l.hint.value = null;
  await v.say(teach ? "Let's look together." : 'Not quite!');
  if (!v.active) return;
  const q = p.q;
  if (q.kind === 'where') await teachWhere(q, teach, l, v);
  else if (q.kind === 'key') await teachKey(q, answer, teach, l, v);
  else if (q.kind === 'grid') await teachGrid(q, teach, l, v);
  else if (q.kind === 'clue') await teachClue(q, teach, l, v);
  else await teachAbove(q, teach, l, v);
  if (!teach && v.active) await v.say('Try again!');
}

/** 🔎: the fuller lesson without a miss, which counts as help. */
export async function help(p: Asking, lifetime: AbortSignal) {
  const l = lessonFor(lifetime), v = l.task.start(), q = p.q;
  clear(l);
  if (q.kind === 'where') return teachWhere(q, true, l, v);
  if (q.kind === 'key') return teachKey(q, '', true, l, v);
  if (q.kind === 'grid') return teachGrid(q, true, l, v);
  if (q.kind === 'clue') return teachClue(q, true, l, v);
  return teachAbove(q, true, l, v);
}
