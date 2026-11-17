// Teaching a miss, never with a red X. The voice never says a lone sound or a silly word: the right word's sound boxes light one at a
// time while it's said slowly, then it's said at its usual speed. A miss on a word one sound away from the right one shows the two
// stacked with the box that differs lit, and says both ("ship. shop."). A sentence is read to him a piece at a time, each piece lit,
// and the word his picture got wrong is lit and said. The right choice then glows, and he taps it.
//
// A second miss (or the first when he's been missing a lot, or 🔎, which counts as help) walks the Pattern's introduction again with
// this word: what the Pattern is ("Two letters can make one sound."), the word in its boxes with that Pattern's sounds marked, and the
// slow sweep.
//
// A lesson is a few signals the question's view reads, kept per question (by its lifetime signal).
import { signal, type Signal } from '@preact/signals';
import { sChime, sPop } from '../../audio/sfx';
import { DIGRAPHS, infoOf, isVowelSound, R_VOWELS, TEAMS, type PatternId, type Word } from '../words/list';
import { diffBox } from '../words/pairs';
import type { Asking } from '../mix';
import { PATTERN_LINES, slowly, type Phrase } from '../phrases';
import { createVoiceScope, type VoiceScope } from '../voice';
import { nearMiss, sceneKey, sentenceOf, wordsApart, type Question, type Scene, type SentenceQ } from './problems';

/** What the lesson panel shows: a word in its sound boxes, another under it (one sound apart), or the Pattern's introduction. */
export interface Panel { top: Word; bottom?: Word; diff?: number; pattern?: PatternId }

export interface Lesson {
  readonly panel: Signal<Panel | null>;
  /** Which box is lit in the panel's top word, and in the bottom one. */
  readonly lit: Signal<number | null>;
  readonly litBottom: Signal<number | null>;
  /** The choice that glows: the answer, after a lesson (a word, a tile, a scene's key). */
  readonly glow: Signal<string | null>;
  /** Sound Swap: the box that is the one to change, shown. */
  readonly mark: Signal<number | null>;
  /** Read and Find: which words of the sentence are lit. */
  readonly words: Signal<readonly number[]>;
  /** Only one thing animates at a time: starting a new one stops the last. */
  readonly task: { start(): VoiceScope; cancel(): void; isCurrent(v: VoiceScope): boolean };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null;
    const cancel = () => current?.cancel();
    lesson = {
      panel: signal(null), lit: signal(null), litBottom: signal(null), glow: signal(null), mark: signal(null), words: signal([]),
      task: { cancel, start() { cancel(); return (current = createVoiceScope(lifetime)); }, isCurrent: v => v === current },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const beat = (v: VoiceScope, ms: number) => v.wait(reduced() ? ms / 3 : ms);
export const BOX_MS = 420;

/** The boxes light one at a time while the word is said slowly; then it's said at its usual speed. */
export async function sweep(v: VoiceScope, lit: Signal<number | null>, word: Word) {
  const boxes = infoOf(word).sounds.length, said = v.say(slowly(word));
  for (let i = 0; i < boxes && v.active; i++) { lit.value = i; await beat(v, BOX_MS); }
  await said;
  lit.value = null;
  if (v.active) await v.say(word);
}

/** The sounds a Pattern is about, in a word: every box for short vowels, then sh, a blend's sounds, a_e, ee, ar. */
export function patternSounds(pattern: PatternId, sounds: readonly string[]): boolean[] {
  const cons = (x: string | undefined) => x !== undefined && !isVowelSound(x);
  return sounds.map((s, i) => {
    switch (pattern) {
      case 'cvc': return true;
      case 'digraph': return (DIGRAPHS as readonly string[]).includes(s);
      case 'blend': return cons(s) && s.length === 1 && (cons(sounds[i - 1]) || cons(sounds[i + 1]));
      case 'magic-e': return s.endsWith('_e');
      case 'team': return (TEAMS as readonly string[]).includes(s);
      case 'r': return (R_VOWELS as readonly string[]).includes(s);
    }
  });
}

/** Two words one sound apart, stacked, the box that differs lit on each while it's said. */
async function compare(v: VoiceScope, l: Lesson, top: Word, bottom: Word) {
  const d = diffBox(top, bottom);
  l.panel.value = { top, bottom, diff: d };
  l.lit.value = d; await v.say(top);
  l.lit.value = null; l.litBottom.value = d; await v.say(bottom);
  l.litBottom.value = null;
  await beat(v, 300);
}

// ---------- Read and Find's sentences, read a piece at a time ----------

/** A sentence in the pieces it's said in, each with the words it lights: "A fox" "in a" "box". */
export function chunksOf(s: Scene): { say: Phrase; words: number[] }[] {
  const at = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i);
  if (s.see) return s.size ? [{ say: `I see a ${s.size}` as Phrase, words: at(0, 4) }, { say: s.a, words: [4] }] : [{ say: 'I see a', words: at(0, 3) }, { say: s.a, words: [3] }];
  if (!s.rel) return [{ say: s.size === 'little' ? 'A little' : 'A big', words: at(0, 2) }, { say: s.a, words: [2] }];
  return [{ say: `A ${s.a}` as Phrase, words: at(0, 2) }, { say: `${s.rel} a` as Phrase, words: at(2, 2) }, { say: s.b!, words: [4] }];
}
/** The one word two sentences differ by, and what to say for it. */
function differing(right: Scene, other: Scene): { at: number; say: Phrase } | null {
  if (wordsApart(right, other) !== 1) return null;
  const a = sentenceOf(right).replace(/\.$/, '').split(' '), b = sentenceOf(other).replace(/\.$/, '').split(' ');
  const at = a.findIndex((t, i) => t !== b[i]);
  return at < 0 ? null : { at, say: a[at]!.toLowerCase() as Phrase };
}
async function readSentence(v: VoiceScope, l: Lesson, s: Scene) {
  for (const c of chunksOf(s)) { if (!v.active) return; l.words.value = c.words; await v.say(c.say); }
  l.words.value = [];
}

/** What's said when he gets it right: the word, or the sentence. */
export function rightSpeech(q: Question): Phrase[] {
  return q.kind === 'sentence' ? chunksOf(q.scene).map(c => c.say) : [q.word];
}

// ---------- the lessons ----------

/** The Pattern's introduction again, with this word. */
async function patternLesson(v: VoiceScope, l: Lesson, w: Word) {
  const p = infoOf(w).pattern;
  l.panel.value = { top: w, pattern: p };
  await v.say(PATTERN_LINES[p]);
  if (v.active) await sweep(v, l.lit, w);
  await beat(v, 300);
}

async function teach(p: Asking, answer: string, full: boolean, l: Lesson, v: VoiceScope) {
  const q = p.q, w = q.word;
  if (full) await patternLesson(v, l, w);
  if (!v.active) return;

  if (q.kind === 'sentence') {
    const picked = q.choices.find(c => sceneKey(c) === answer), d = picked ? differing(q.scene, picked) : null;
    if (!full) l.panel.value = null;
    await readSentence(v, l, q.scene);
    if (d && v.active) { l.words.value = [d.at]; sPop(); await v.say(d.say); await beat(v, 400); l.words.value = []; }
    if (v.active) { l.glow.value = sceneKey(q.scene); sChime(); }
    return;
  }

  if (q.kind === 'swap') {
    const wrongBox = !answer.includes('=') && Number(answer) !== q.box;
    if (wrongBox || !answer) await compare(v, l, q.from, q.word);
    else { l.panel.value = { top: q.word }; await v.say('Listen.'); await sweep(v, l.lit, q.word); }
    if (!v.active) return;
    if (wrongBox || !answer) { l.mark.value = q.box; sPop(); await v.say('This is the sound to change.'); }
    else { l.glow.value = q.answer; sChime(); }
    return;
  }

  const near = nearMiss(q, answer);
  if (near) await compare(v, l, w, near);
  else if (!full) { l.panel.value = { top: w }; await v.say('Listen.'); await sweep(v, l.lit, w); }
  if (!v.active) return;
  if (q.kind === 'real') { await v.say('This one is a real word.'); }
  l.glow.value = w; sChime();
}

/** The lesson after a miss. `full`: the fuller one. */
export function explain(p: Asking, answer: string, full: boolean, signal: AbortSignal): Promise<void> {
  const l = lessonFor(signal), v = l.task.start();
  l.glow.value = null; l.mark.value = null;
  return teach(p, answer, full, l, v).finally(() => { if (!l.task.isCurrent(v)) return; l.lit.value = null; l.litBottom.value = null; l.words.value = []; });
}

/** 🔎: the fuller lesson, on demand. It counts as help. */
export function help(p: Asking, signal: AbortSignal): Promise<void> {
  const l = lessonFor(signal);
  l.glow.value = null;
  return teach(p, '', true, l, l.task.start());
}

export type { SentenceQ };
