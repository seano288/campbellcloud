// Teaching a miss, never with a red X. The word's sound boxes light one at a time while it's said slowly, then it's said again, and
// the right tile drops into its box. The wrong tile he tapped just wobbles back to the rack. A second miss (or the first, when he's been
// missing a lot, or 🔎) builds the whole word for him box by box, says it, and clears it so he can build it himself.
//
// A lesson is a few signals the question's view reads, kept per question (by its lifetime signal). Build It's and Chunks' tiles in the
// boxes live here too, so a lesson can drop one in or clear them.
import { signal, type Signal } from '@preact/signals';
import { sChime, sClink, sPop } from '../../audio/sfx';
import { infoOf } from '../../dino-dig/words/list';
import type { Asking } from '../mix';
import { slowly, type Phrase } from '../phrases';
import { createVoiceScope, type VoiceScope } from '../voice';
import { inPhrase, type Question } from './problems';

export interface Lesson {
  /** Which box is lit: in the question's own boxes, or (with `right` on) in the right word's boxes shown under it. */
  readonly lit: Signal<number | null>;
  /** The right word, shown in its sound boxes under a wrong spelling (Fix It, Which Looks Right). */
  readonly right: Signal<boolean>;
  /** A tile or card that glows: the answer, after a lesson. */
  readonly glow: Signal<string | null>;
  /** Build It and Chunks: what's in the boxes so far (letters or chunks), and which rack tiles have gone. */
  readonly placed: Signal<string[]>;
  readonly used: Signal<number[]>;
  /** Missing Sound: the tile the lesson shows in the empty box. */
  readonly peek: Signal<string | null>;
  /** Fix It: the mistake, shown ("Here is the mistake."): a box or letter index, or a gap ("+2"). */
  readonly mark: Signal<string | null>;
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
      lit: signal(null), right: signal(false), glow: signal(null), placed: signal([]), used: signal([]), peek: signal(null), mark: signal(null),
      task: { cancel, start() { cancel(); return (current = createVoiceScope(lifetime)); } },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const beat = (v: VoiceScope, ms: number) => v.wait(reduced() ? ms / 3 : ms);
export const BOX_MS = 420;

/** The boxes light one at a time while the word is said slowly; then it's said at its usual speed. */
export async function sweep(v: VoiceScope, l: Lesson, word: Question['word'], boxes: number) {
  const said = v.say(slowly(word));
  for (let i = 0; i < boxes && v.active; i++) { l.lit.value = i; await beat(v, BOX_MS); }
  await said;
  l.lit.value = null;
  if (v.active) await v.say(word);
}

/** The rack tile (not used yet) that holds this piece. */
const tileFor = (tiles: readonly string[], used: readonly number[], piece: string) => tiles.findIndex((t, i) => t === piece && !used.includes(i));

/** Puts the right pieces in the boxes one at a time (box lit, a clink each), from where he got to. `upTo`: how many pieces in all. */
async function build(v: VoiceScope, l: Lesson, pieces: readonly string[], tiles: readonly string[], upTo: number, boxOf: (piece: number) => number) {
  for (let k = l.placed.peek().length; k < upTo && v.active; k++) {
    const at = tileFor(tiles, l.used.peek(), pieces[k]!);
    if (at < 0) break;
    l.lit.value = boxOf(k);
    l.placed.value = [...l.placed.peek(), pieces[k]!];
    l.used.value = [...l.used.peek(), at];
    sClink();
    await beat(v, 360);
  }
  l.lit.value = null;
}

/** Which sound box a letter of the word is in. */
export function boxOfLetter(word: Question['word'], letter: number): number {
  const { sounds } = infoOf(word);
  let at = 0;
  for (const [i, s] of sounds.entries()) {
    const n = s.endsWith('_e') ? s.length - 2 : s.length;
    if (letter < at + n) return i;
    at += n;
  }
  return sounds.findIndex(s => s.endsWith('_e')); // the final magic e belongs to its vowel's box
}

async function teach(p: Asking, answer: string, full: boolean, l: Lesson, v: VoiceScope) {
  const q = p.q, w = q.word, boxes = infoOf(w).sounds.length;

  if (q.kind === 'build' || q.kind === 'chunk') {
    const pieces = q.kind === 'build' ? [...w] : q.parts, frame = q.kind === 'build' ? boxes : q.parts.length;
    const boxOf = (k: number) => (q.kind === 'build' ? boxOfLetter(w, k) : k);
    if (!full) {
      await v.say('Listen.');
      await sweep(v, l, w, frame);
      if (!v.active) return;
      // the right tile drops into the next box; if that's the last one he puts it in himself
      const next = l.placed.peek().length;
      if (next < pieces.length - 1) { await build(v, l, pieces, q.tiles, next + 1, boxOf); sPop(); }
      else { l.glow.value = pieces[next]!; sChime(); }
      if (v.active) await v.say('Try again!');
      return;
    }
    await v.say('Watch me build it.');
    l.placed.value = []; l.used.value = [];
    await build(v, l, pieces, q.tiles, pieces.length, boxOf);
    if (!v.active) return;
    await sweep(v, l, w, frame);
    await beat(v, 500);
    if (!v.active) return;
    l.placed.value = []; l.used.value = [];
    await v.say('Now you build it!');
    return;
  }

  if (q.kind === 'gap') {
    await v.say('Listen.');
    await sweep(v, l, w, boxes);
    if (!v.active) return;
    l.peek.value = q.answer; sPop();
    if (full) await v.say('Each sound gets a box.');
    await beat(v, 900);
    l.peek.value = null;
    l.glow.value = q.answer; sChime();
    return;
  }

  if (q.kind === 'pick') {
    l.right.value = true;
    if (q.phrase) await v.say(q.phrase as Phrase);
    await sweep(v, l, w, boxes);
    if (!v.active) return;
    if (full) await v.say('These letters make one sound.');
    l.glow.value = q.phrase ? inPhrase(q.phrase, w, w) : w; sChime();
    return;
  }

  // Fix It: the right word in its boxes under the wrong one, then the mistake shown
  const m = q.mistake, tapped = answer.split('=')[0]!, found = answer.includes('=') || (m.kind === 'swap' ? tapped === `${m.box}` : false);
  l.right.value = true;
  await sweep(v, l, w, boxes);
  if (!v.active) return;
  if (!found || full) {
    l.mark.value = m.kind === 'swap' ? `${m.box}` : m.kind === 'drop' ? `+${m.at}` : `${m.at}`;
    sPop();
    await v.say(m.kind === 'swap' ? 'Here is the mistake.' : m.kind === 'drop' ? 'A letter is missing here.' : 'This one is extra.');
  }
  if (found && m.kind !== 'add') { l.glow.value = m.kind === 'swap' ? m.right : m.letter; sChime(); await v.say('Now pick the right one!'); }
}

/** The lesson after a miss. `teach`: the fuller one. */
export function explain(p: Asking, answer: string, full: boolean, signal: AbortSignal): Promise<void> {
  const l = lessonFor(signal), v = l.task.start();
  l.glow.value = null;
  return teach(p, answer, full, l, v).finally(() => { if (!full) l.lit.value = null; l.right.value = l.right.peek() && v.active; });
}

/** 🔎: the fuller lesson, on demand. It counts as help. */
export function help(p: Asking, signal: AbortSignal): Promise<void> {
  const l = lessonFor(signal);
  return teach(p, '', true, l, l.task.start());
}
