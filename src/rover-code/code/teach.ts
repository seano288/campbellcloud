// Teaching a miss on the puzzle itself, never with a red X. A program he runs always drives first, so he sees where it went: the
// rover stops at the rock or the edge, or short of the flag, and the step that did it lights up while the voice says why. On the
// second miss (or the first, when he's been missing a lot) the lesson shows a way across, step by step, and leaves it there for him
// to copy. A pattern's repeating part is banded and said aloud; a loop's squares are counted.
//
// A lesson is a few signals the question's view reads, kept per question (by its lifetime signal), so the view and the lesson that
// explains a miss draw the same grid.
import { signal, type Signal } from '@preact/signals';
import { sCount, sThud } from '../../audio/sfx';
import { decodeBlocks, decodeProgram, encodeBlocks, expand, runProgram, runsOf, type Cell, type Dir, type Grid, type Run } from './grid';
import type { BugProblem, LoopProblem, PatternProblem, Token } from './problems';
import { DIR_SAID, tokenSaid, type Phrase } from '../phrases';
import type { Asking } from '../mix';
import { createVoiceScope, type VoiceScope } from '../voice';

export interface RunShow {
  readonly cells: readonly Cell[];
  /** How many steps it has driven so far. */
  readonly at: number;
  /** Where it hit a rock or would have left the map, once it has. */
  readonly crash: Cell | null;
}

export interface Lesson {
  readonly run: Signal<RunShow | null>;
  /** The step of the program shown that is lit (a loop's block, for a loop). */
  readonly lit: Signal<number | null>;
  /** A way across, drawn on the grid, with a number in each square counted so far. */
  readonly trail: Signal<readonly Cell[] | null>;
  readonly counted: Signal<number>;
  /** Patterns: the repeating part banded, one item lit, and what goes in the gap. */
  readonly bands: Signal<boolean>;
  readonly litItem: Signal<number | null>;
  readonly filled: Signal<Token | null>;
  /** The answer button to look at: an arrow, a count or a program. */
  readonly hint: Signal<string | null>;
  readonly caption: Signal<string | null>;
  /** Only one thing animates at a time: starting a new run stops the last. */
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null;
    const cancel = () => current?.cancel();
    lesson = {
      run: signal(null), lit: signal(null), trail: signal(null), counted: signal(0), bands: signal(false), litItem: signal(null), filled: signal(null),
      hint: signal(null), caption: signal(null),
      task: { cancel, start() { cancel(); return (current = createVoiceScope(lifetime)); } },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}

/** The pace of the rover on screen. */
export const STEP_MS = 420;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

/**
 * Drives a program on the grid. `light(i)` says which step of the program on screen to light while step i runs (for a loop, its
 * block). `say(i)`: a word for each step as it goes (a loop counts its steps). It stops at a rock or the edge with a thud, and leaves the rover there.
 */
export async function drive(grid: Grid, program: readonly Dir[], lesson: Lesson, voice: VoiceScope, { light = (i: number) => i, say }: { light?: (i: number) => number | null; say?: (i: number) => Phrase | null } = {}): Promise<Run> {
  const run = runProgram(grid, program), pace = reduced() ? STEP_MS * .6 : STEP_MS;
  lesson.run.value = { cells: run.cells, at: 0, crash: null };
  await voice.wait(200);
  for (let i = 0; i < program.length && voice.active; i++) {
    lesson.lit.value = light(i);
    const end = run.end;
    if ((end.kind === 'bump' || end.kind === 'off') && end.step === i) {
      lesson.run.value = { cells: run.cells, at: i, crash: end.at };
      sThud();
      await voice.wait(pace);
      return run;
    }
    lesson.run.value = { cells: run.cells, at: i + 1, crash: null };
    sCount(Math.min(i, 10));
    const word = say?.(i);
    if (word) await voice.say(word);
    await voice.wait(word ? pace / 3 : pace);
  }
  return run;
}

/** What went wrong, said: the reason a run didn't end on the flag. */
export function whyLine(run: Run): Phrase {
  switch (run.end.kind) {
    case 'bump': return 'Bump! A rock is in the way.';
    case 'off': return 'Oops! That goes off the map.';
    case 'past': return 'It drove past the flag.';
    default: return 'It stopped before the flag.';
  }
}
/** Which step to light for a run that went wrong: the step that hit or left, or the one that drove past. None for a short run. */
export const wrongStep = (run: Run) => (run.end.kind === 'bump' || run.end.kind === 'off' || run.end.kind === 'past' ? run.end.step : null);

export function clear(lesson: Lesson) {
  lesson.run.value = null; lesson.lit.value = null; lesson.caption.value = null; lesson.litItem.value = null;
}

/** The way across, drawn square by square while each direction is said. It stays on the grid until he answers. */
async function showWay(grid: Grid, path: readonly Dir[], lesson: Lesson, voice: VoiceScope, numbers = false) {
  const cells = runProgram(grid, path).cells;
  lesson.trail.value = cells;
  lesson.counted.value = 0;
  await voice.say(numbers ? 'Count the squares.' : 'Here is a way to the flag.');
  for (let i = 0; i < path.length && voice.active; i++) {
    lesson.counted.value = i + 1;
    sCount(Math.min(i, 10));
    await voice.say(numbers ? `${i + 1}` as Phrase : DIR_SAID[path[i]!]);
  }
}

/** A run ends where it went wrong: the rover stays there while the reason is said, then goes back to the start. */
async function sayWhy(run: Run, lesson: Lesson, voice: VoiceScope, light: (i: number) => number | null = i => i) {
  const step = wrongStep(run), end = run.end;
  lesson.run.value = { cells: run.cells, at: end.kind === 'bump' || end.kind === 'off' ? end.step : run.cells.length - 1, crash: end.kind === 'bump' || end.kind === 'off' ? end.at : null };
  lesson.lit.value = step === null ? null : light(step);
  lesson.caption.value = null;
  await voice.say(whyLine(run));
  await voice.wait(500);
}

// ---------- each kind ----------

async function teachDrive(p: Asking & { q: { kind: 'drive' } }, answer: string, teach: boolean, lesson: Lesson, voice: VoiceScope) {
  const program = decodeProgram(answer) ?? [];
  await sayWhy(runProgram(p.q.grid, program), lesson, voice);
  clear(lesson);
  if (teach && voice.active) await showWay(p.q.grid, p.q.path, lesson, voice);
  else if (voice.active) await voice.say('Try again!');
}

async function teachBug(q: BugProblem, answer: string, teach: boolean, lesson: Lesson, voice: VoiceScope) {
  const tapped = /^step:(\d+)$/.exec(answer), fixed = /^fix:(\d+):([URDL])$/.exec(answer);
  if (tapped) { // he tapped a step that is fine: light it, then show where the program really goes wrong
    lesson.lit.value = Number(tapped[1]);
    await voice.say('That step is fine.');
    if (teach && voice.active) {
      await voice.say('Watch it go.');
      await drive(q.grid, q.program.slice(0, q.bug + 1), lesson, voice);
      lesson.lit.value = q.bug;
      await voice.say('This step went the wrong way.');
      lesson.hint.value = `step:${q.bug}`;
    }
  } else if (fixed) { // he picked an arrow that doesn't fix it: show where that goes
    const i = Number(fixed[1]), program = q.program.map((s, j) => (j === i ? fixed[2] as Dir : s));
    await voice.say('That way goes here.');
    const run = await drive(q.grid, program, lesson, voice);
    await sayWhy(run, lesson, voice);
    if (teach && voice.active) { clear(lesson); lesson.hint.value = q.path[i]!; await showWay(q.grid, q.path, lesson, voice); }
  }
  clear(lesson);
  if (!teach && voice.active) await voice.say('Try again!');
}

async function teachPattern(q: PatternProblem, teach: boolean, lesson: Lesson, voice: VoiceScope) {
  lesson.bands.value = true;
  await voice.say('Look at the part that repeats.');
  const firstUnit = q.items.slice(0, q.unit);
  if (firstUnit.every(t => t !== null && t.length === 1) && q.unit === 4 && new Set(firstUnit).size === 4) await voice.say('The arrow turns like a clock hand.');
  await voice.say('It goes');
  for (let i = 0; i < q.unit && voice.active; i++) {
    lesson.litItem.value = i;
    await voice.say(tokenSaid(firstUnit[i]!));
  }
  lesson.litItem.value = null;
  if (!voice.active) return;
  await voice.say('again and again.');
  if (teach && voice.active) {
    lesson.filled.value = q.answer;
    lesson.hint.value = q.answer;
    await voice.say(q.form === 'next' ? 'So next comes' : 'So the missing one is', tokenSaid(q.answer));
  }
}

async function teachLoop(q: LoopProblem, answer: string, teach: boolean, lesson: Lesson, voice: VoiceScope) {
  const blocks = decodeBlocks(answer) ?? [];
  const blockOf = (i: number) => { let n = 0; for (let b = 0; b < blocks.length; b++) { n += blocks[b]!.steps.length * blocks[b]!.times; if (i < n) return b; } return null; };
  await sayWhy(runProgram(q.grid, expand(blocks)), lesson, voice, q.form === 'pick' ? () => null : blockOf);
  clear(lesson);
  if (!voice.active) return;
  if (!teach) { await voice.say('Try again!'); return; }
  await loopWay(q, lesson, voice);
}

/** The right loop: for "which program", that one lit and driven; otherwise each straight run's squares counted, so the count he needs is the number he just heard. */
async function loopWay(q: LoopProblem, lesson: Lesson, voice: VoiceScope) {
  if (q.form === 'pick') {
    const right = q.options.findIndex(o => encodeBlocks(o) === encodeBlocks(q.blocks));
    lesson.hint.value = String(right);
    await voice.say('This one gets to the flag.');
    await drive(q.grid, q.path, lesson, voice);
    return;
  }
  const runs = runsOf(q.path);
  lesson.trail.value = runProgram(q.grid, q.path).cells;
  await voice.say('Count the squares.');
  let done = 0;
  for (let r = 0; r < runs.length && voice.active; r++) {
    lesson.lit.value = r;
    for (let k = 1; k <= runs[r]!.times && voice.active; k++) {
      lesson.counted.value = done + k;
      sCount(k);
      await voice.say(`${k}` as Phrase);
    }
    done += runs[r]!.times;
    if (voice.active) await voice.say('So it goes', `${runs[r]!.times}` as Phrase, 'times.');
  }
  lesson.lit.value = null;
  lesson.hint.value = String(runs.at(-1)!.times);
}

/** The lesson after a miss: what the round engine runs before he can try again. */
export async function explain(p: Asking, answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), voice = lesson.task.start();
  lesson.caption.value = null;
  if (teach) await voice.say("Let's look together.");
  const q = p.q;
  if (q.kind === 'drive') await teachDrive({ ...p, q }, answer, teach, lesson, voice);
  else if (q.kind === 'bug') await teachBug(q, answer, teach, lesson, voice);
  else if (q.kind === 'pattern') await teachPattern(q, teach, lesson, voice);
  else await teachLoop(q, answer, teach, lesson, voice);
}

/** 🔎: the lesson without a miss, which counts as help. */
export async function help(p: Asking, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), voice = lesson.task.start(), q = p.q;
  clear(lesson);
  if (q.kind === 'pattern') return teachPattern(q, true, lesson, voice);
  if (q.kind === 'bug') {
    await voice.say('Watch it go.');
    await drive(q.grid, q.program.slice(0, q.bug + 1), lesson, voice);
    lesson.lit.value = q.bug;
    lesson.hint.value = `step:${q.bug}`;
    await voice.say('This step went the wrong way.');
    if (q.choose && voice.active) { lesson.run.value = null; await showWay(q.grid, q.path, lesson, voice); }
    return;
  }
  if (q.kind === 'loop') return loopWay(q, lesson, voice);
  return showWay(q.grid, q.path, lesson, voice);
}
