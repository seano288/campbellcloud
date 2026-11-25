// Teaching a miss: never a red X. The lesson plays on the question itself and is said, and a second miss (or 🔎) gets the fuller one:
// the rule in one sentence, then two more examples, before the question comes back.
//
// - Nouns: the word's picture appears. "Dog. It names something. So it is a noun." A wrong word tapped is said with its own job too.
// - Verbs: the dragon does it. "Fly. It is something you do. So it is a verb."
// - Adjectives: the dragon changes as the word is said: it grows, turns green, gets muddy.
// - More Than One: one becomes two on screen, and the word changes with them, its changed letters lit.
// - Yesterday: a calendar page flips back a day, and the doing word changes as it lands.
// - Squeeze: the two words slide together, the letters that drop out fall away, and the apostrophe lands in the gap.
// - Big Letters: the name glows and its first letter grows. "Sam is a name. Names start with a big letter."
import { signal, type Signal } from '@preact/signals';
import { sChime } from '../../audio/sfx';
import { createVoiceScope, type Item } from '../voice';
import type { Asking } from '../mix';
import { pairLine, pastLine, wordPhrase, type Phrase } from '../phrases';
import { lex } from '../words/lexicon';
import { TERMS } from '../words/terms';
import { CHANGING, LOOKS, PASTS, PLURALS, SQUEEZES, squeezeOf, squeezed, whole, type Frame } from '../words/frames';
import { WORD_PICS } from '../words/allowed';
import type { Role } from '../words/sentences';
import type { Question } from './problems';

/** What the lesson shows on the question. */
export type Show =
  | { kind: 'pic'; word: string; pic: string | null; line?: string }
  | { kind: 'dragon'; word: string; act: string | null; look: string | null }
  | { kind: 'plural'; one: string; many: string; pic: string; step: 0 | 1 }
  | { kind: 'calendar'; now: string; then: string; step: 0 | 1; time: 'yesterday' | 'tomorrow' }
  | { kind: 'squeeze'; from: string; word: string; gone: string; step: 0 | 1 | 2 }
  | { kind: 'capital'; word: string; step: 0 | 1 }
  | { kind: 'rule'; line: string };

export interface Lesson {
  readonly show: Signal<Show | null>;
  /** The right answer, lit (a choice, `w<i>` in a sentence, `g<i>` a gap). */
  readonly hint: Signal<string | null>;
  /** A wrong one he tapped, said with its own job. */
  readonly said: Signal<string | null>;
}
const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(signal: AbortSignal): Lesson {
  let l = lessons.get(signal);
  if (!l) { l = { show: signal_(null), hint: signal_(null), said: signal_(null) }; lessons.set(signal, l); }
  return l;
}
function signal_<T>(v: T) { return signal<T>(v); }

const DRAGON_ACTS: Readonly<Record<string, string>> = {
  fly: 'fly', flies: 'fly', flew: 'fly', roar: 'roar', glide: 'glide', flap: 'flap', loop: 'loop', dive: 'dive', spin: 'spin', hop: 'hop', jump: 'hop',
  swim: 'glide', dig: 'dive', eat: 'roar', sleep: 'sleep', sit: 'sleep', hide: 'sleep', grow: 'grow', run: 'hop', ride: 'fly', hug: 'flap', see: 'look', look: 'look',
};
const LOOK_WORDS: Readonly<Record<string, string>> = Object.fromEntries(LOOKS.map(l => [l.value, l.value]));

/** What a word's job line is, said after the word: "It names something." */
const jobLine = (w: string, role?: Role): Phrase | null => {
  const r = role ?? (lex(w)?.jobs.length === 1 ? ({ noun: 'n', verb: 'v', adj: 'a' } as const)[lex(w)!.jobs[0]!] : undefined);
  if (r === 'n' || r === 'N' || r === 'D' || r === 'M' || r === 'P') return 'It names something.';
  if (r === 'v') return 'It is something you do.';
  if (r === 'a') return 'It tells what something is like.';
  return null;
};
const picOf = (w: string) => lex(w)?.pic ?? WORD_PICS[w.toLowerCase()] ?? null;
const CAT_LINE = { person: 'It is a person.', animal: 'It is an animal.', place: 'It is a place.', thing: 'It is a thing.' } as const;

async function step(l: Lesson, show: Show | null, voice: ReturnType<typeof createVoiceScope>, ...items: Item[]) {
  if (!voice.active) return;
  l.show.value = show;
  await voice.say(...items);
}

/** The examples for a fuller lesson: two more of the same kind. */
const EXAMPLES = { noun: ['king', 'dog'], verb: ['fly', 'roar'], adj: ['big', 'green'] } as const;

export async function explain(p: Asking, answer: string, teach: boolean, signal: AbortSignal, opening = true) {
  const voice = createVoiceScope(signal), l = lessonFor(signal), q = p.q;
  if (opening) await voice.say('Not quite!');
  l.said.value = answer;
  try {
    await lessonOf(q, answer, l, voice);
    if (teach && voice.active) await fuller(q, l, voice);
    if (voice.active) { sChime(); await voice.say('Try again!'); }
  } finally {
    if (!signal.aborted) { l.show.value = null; l.said.value = null; }
  }
}
/** 🔎: the fuller lesson, on demand (it counts as help). */
export const help = (p: Asking, signal: AbortSignal) => explain(p, '', true, signal, false);

const answerWord = (q: Question): string => {
  const st = q.stage;
  if (st.type === 'tap') return st.shown[st.need[0]!]!.text;
  return q.answer;
};
const tapped = (q: Question, answer: string): { text: string; role?: Role } | null => {
  if (q.stage.type === 'tap' && /^w\d+$/.test(answer)) { const w = q.stage.shown[Number(answer.slice(1))]; return w ? { text: w.text, role: w.role } : null; }
  if (q.choices?.includes(answer)) return { text: answer };
  return null;
};

async function lessonOf(q: Question, answer: string, l: Lesson, voice: ReturnType<typeof createVoiceScope>) {
  const st = q.stage, said = (w: string) => wordPhrase(w);
  switch (q.kind) {
    case 'noun': case 'verb': case 'adj': {
      if (st.type === 'sort') {
        const cat = q.answer as keyof typeof CAT_LINE;
        l.hint.value = q.answer;
        await step(l, { kind: 'pic', word: st.word, pic: picOf(st.word) }, voice, said(st.word), CAT_LINE[cat]);
        return;
      }
      if (st.type === 'gap') { await frameLesson(q, st.f, l, voice); return; }
      if (st.type === 'looks') {
        l.hint.value = q.answer;
        await step(l, { kind: 'rule', line: q.answer }, voice, 'This one tells about it.', q.answer);
        return;
      }
      const wrong = tapped(q, answer);
      if (wrong) {
        const line = jobLine(wrong.text, wrong.role);
        if (line && line !== jobLine(answerWord(q), q.kind === 'noun' ? 'n' : q.kind === 'verb' ? 'v' : 'a')) await step(l, showFor(line === 'It names something.' ? 'noun' : line === 'It is something you do.' ? 'verb' : 'adj', wrong.text), voice, said(wrong.text), line);
      }
      const right = answerWord(q);
      l.hint.value = q.answer;
      await step(l, showFor(q.kind, right), voice, said(right), jobLine(right, q.kind === 'noun' ? 'n' : q.kind === 'verb' ? 'v' : 'a')!, TERMS[q.kind].so);
      return;
    }
    case 'plural': {
      if (st.type === 'plural') {
        const pl = PLURALS.find(x => x.one === st.one)!;
        l.hint.value = q.answer;
        await step(l, { kind: 'plural', one: pl.one, many: pl.many, pic: pl.pic, step: 0 }, voice, said(pl.one));
        await step(l, { kind: 'plural', one: pl.one, many: pl.many, pic: pl.pic, step: 1 }, voice, pairLine(pl.one, pl.many));
        return;
      }
      if (st.type === 'gap') await frameLesson(q, st.f, l, voice);
      return;
    }
    case 'past': if (st.type === 'gap') await frameLesson(q, st.f, l, voice); return;
    case 'squeeze': {
      const s = st.type === 'squeeze3' ? SQUEEZES.find(x => x.word.toLowerCase() === q.answer.toLowerCase())!
        : st.type === 'apostrophe' ? squeezeOf(st.word) : SQUEEZES.find(x => x.word === q.answer || x.from === q.answer)!;
      l.hint.value = q.answer;
      if (st.type === 'squeeze3') await step(l, null, voice, squeezed({ text: st.text, at: st.at, word: q.answer, wrong: [] }));
      await step(l, { kind: 'squeeze', from: s.from, word: s.word, gone: s.gone, step: 0 }, voice, s.from);
      await step(l, { kind: 'squeeze', from: s.from, word: s.word, gone: s.gone, step: 1 }, voice);
      await voice.wait(500);
      await step(l, { kind: 'squeeze', from: s.from, word: s.word, gone: s.gone, step: 2 }, voice, said(s.word),
        s.word === "won't" ? "Will not squeezes into won't." : 'The apostrophe goes where the letters came out.');
      return;
    }
    case 'capital': {
      if (st.type !== 'tap') return;
      const wrong = tapped(q, answer);
      if (wrong && /^[A-Z]/.test(wrong.text)) await step(l, null, voice, said(wrong.text), 'It already has a big letter.');
      for (const i of st.need) {
        const w = st.s.words[i]!, kind = w.role === 'N' ? 'name' : w.role === 'D' ? 'day' : w.role === 'M' ? 'month' : 'place';
        l.hint.value = `w${i}`;
        await step(l, { kind: 'capital', word: w.text, step: 0 }, voice, w.text, `is a ${kind}.`);
        await step(l, { kind: 'capital', word: w.text, step: 1 }, voice, kind === 'name' ? 'Names start with a big letter.' : kind === 'day' ? 'Days start with a big letter.' : kind === 'month' ? 'Months start with a big letter.' : 'Places start with a big letter.');
      }
    }
  }
}

function showFor(kind: 'noun' | 'verb' | 'adj', w: string): Show {
  const x = w.toLowerCase();
  if (kind === 'verb' || (lex(x)?.jobs.includes('verb') && !lex(x)?.jobs.includes('noun'))) return { kind: 'dragon', word: w, act: DRAGON_ACTS[x] ?? 'hop', look: null };
  if (kind === 'adj' || lex(x)?.jobs[0] === 'adj') return { kind: 'dragon', word: w, act: null, look: LOOK_WORDS[x] ?? x };
  return { kind: 'pic', word: w, pic: picOf(x) };
}

/** A gap's lesson: the sentence said whole with the right word lit, and why it fits. */
async function frameLesson(q: Question, f: Frame, l: Lesson, voice: ReturnType<typeof createVoiceScope>) {
  l.hint.value = q.answer;
  const s = whole(f);
  if (q.kind === 'verb') { await step(l, { kind: 'dragon', word: f.right, act: 'fly', look: null }, voice, s, 'One dragon flies. Two dragons fly.'); return; }
  if (q.kind === 'plural') {
    const pl = PLURALS.find(x => [x.one, x.many].includes(f.right))!;
    await step(l, null, voice, s);
    await step(l, { kind: 'plural', one: pl.one, many: pl.many, pic: pl.pic, step: 0 }, voice);
    await step(l, { kind: 'plural', one: pl.one, many: pl.many, pic: pl.pic, step: 1 }, voice, pairLine(pl.one, pl.many), ...(pl.same ? ['Some words stay the same.'] : []));
    return;
  }
  // Yesterday
  const time = f.before.startsWith('Tomorrow') ? 'tomorrow' : 'yesterday';
  const base = f.wrong.find(w => !w.endsWith('s') && !w.startsWith('will') && w !== f.right) ?? f.wrong[0]!;
  await step(l, { kind: 'calendar', now: base, then: f.right, step: 0, time }, voice, s);
  await step(l, { kind: 'calendar', now: base, then: f.right, step: 1, time }, voice, time === 'tomorrow' ? 'Tomorrow means it will happen.' : 'Yesterday means it has happened.');
  const pair = PASTS.find(([, then]) => then === f.right);
  if (pair) await voice.say(pastLine(pair[0], pair[1]));
}

async function fuller(q: Question, l: Lesson, voice: ReturnType<typeof createVoiceScope>) {
  const ex = (words: readonly string[], kind: 'noun' | 'verb' | 'adj') => words.reduce<Promise<void>>((p, w) => p.then(() => step(l, showFor(kind, w), voice, wordPhrase(w))), Promise.resolve());
  switch (q.kind) {
    case 'noun': case 'verb': case 'adj':
      await step(l, { kind: 'rule', line: TERMS[q.kind].means }, voice, TERMS[q.kind].means);
      if (q.kind === 'verb' && q.level === 3) await step(l, { kind: 'rule', line: 'When one does it, the word ends in s.' }, voice, 'When one does it, the word ends in s.');
      await ex(EXAMPLES[q.kind], q.kind);
      return;
    case 'plural': {
      await step(l, { kind: 'rule', line: 'Some words change when there is more than one.' }, voice, 'Some words change when there is more than one.');
      for (const pl of CHANGING.filter(x => x.many !== q.answer && x.one !== q.answer).slice(0, 2)) {
        await step(l, { kind: 'plural', one: pl.one, many: pl.many, pic: pl.pic, step: 0 }, voice);
        await step(l, { kind: 'plural', one: pl.one, many: pl.many, pic: pl.pic, step: 1 }, voice, pairLine(pl.one, pl.many));
      }
      return;
    }
    case 'past':
      if (q.level === 1) { await step(l, { kind: 'rule', line: 'For yesterday, most words get e d at the end.' }, voice, 'For yesterday, most words get e d at the end.'); return; }
      await step(l, { kind: 'rule', line: 'Some words change for yesterday.' }, voice, 'Some words change for yesterday.');
      for (const [now, then] of PASTS.filter(([, t]) => t !== q.answer).slice(0, 2)) await step(l, { kind: 'calendar', now, then, step: 1, time: 'yesterday' }, voice, pastLine(now, then));
      return;
    case 'squeeze':
      await step(l, { kind: 'rule', line: 'Two words can squeeze into one.' }, voice, 'Two words can squeeze into one.');
      for (const s of SQUEEZES.filter(x => x.word !== q.answer && x.from !== q.answer && x.level === 1).slice(0, 2)) {
        await step(l, { kind: 'squeeze', from: s.from, word: s.word, gone: s.gone, step: 0 }, voice, s.from);
        await step(l, { kind: 'squeeze', from: s.from, word: s.word, gone: s.gone, step: 2 }, voice, wordPhrase(s.word));
      }
      return;
    case 'capital':
      await step(l, { kind: 'rule', line: 'Names start with a big letter.' }, voice, 'Names start with a big letter.');
      await step(l, { kind: 'capital', word: 'Sam', step: 1 }, voice, 'Sam', 'is a name.');
      await step(l, { kind: 'capital', word: 'Monday', step: 1 }, voice, 'Monday', 'is a day.');
  }
}
