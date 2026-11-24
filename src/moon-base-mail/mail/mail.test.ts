// The brief's "Rules the tests must enforce", one test each, over every passage and question.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DIAGRAMS, isDiagram } from './diagrams';
import { PASSAGES, passagesOf } from './index';
import { PICS, picOf } from './pictures';
import { KINDS, MOST_WORDS, SENTENCES, type Passage, type Question } from './types';
import { baseWordsIn, isAllowed, isName, stems, wordsOf } from './words';

const written = (q: Question): string[] => (q.form === 'words' || q.form === 'label' ? [q.right, ...q.wrong] : q.form === 'yn' ? [q.says!, q.right, ...q.wrong] : []);
/** Little words that name nothing: a choice that shares only these with the letter doesn't name anything in it. */
const STOP = new Set(['a', 'an', 'the', 'it', 'is', 'was', 'to', 'in', 'on', 'at', 'of', 'and', 'with', 'by', 'for', 'her', 'his', 'he', 'she', 'they', 'them', 'their', 'we', 'i', 'my', 'from', 'up', 'out', 'did', 'not', 'no', 'be', 'so', 'can', 'will', 'there', 'are', 'had', 'has', 'have', 'got', 'get', 'go', 'went', 'all', 'too', 'some', 'little', 'big', 'new', 'one', 'when', 'then', 'into', 'over', 'down', 'this']);
const lemma = (w: string) => { const l = w.toLowerCase(); return [l, ...stems(l)]; };
const lemmasOf = (text: string) => new Set(wordsOf(text).flatMap(lemma));
/** What he reads: the letter, and who it is from (it is signed). */
const passageText = (p: Passage) => [...p.lines, p.from === 'Base' ? '' : p.from].join(' ');
/** Does this choice name something in the letter? */
function names(p: Passage, q: Question, choice: string): boolean {
  const in_ = lemmasOf(passageText(p));
  const phrases = q.form === 'pic' ? picOf(choice).match : [choice];
  return phrases.some(ph => {
    const content = wordsOf(ph).map(w => w.toLowerCase()).filter(w => !STOP.has(w));
    return content.length > 0 && content.every(w => lemma(w).some(l => in_.has(l)));
  });
}
const literal = (p: Passage, phrase: string) => new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(p.lines.join(' '));
/** Runs a check on every question and lists every one that fails, not only the first. */
function each(f: (p: Passage, q: Question, fail: (why: string) => void) => void) {
  const bad: string[] = [];
  for (const p of PASSAGES) for (const q of p.qs) f(p, q, why => bad.push(`${p.id} "${q.ask}": ${why}`));
  expect(bad.join('\n')).toBe('');
}

describe('the passages', () => {
  it('about 150, about 30 of each kind, across the three Levels', () => {
    expect(PASSAGES.length).toBeGreaterThanOrEqual(145);
    for (const k of KINDS) {
      const n = PASSAGES.filter(p => p.kind === k).length;
      expect(n, k).toBeGreaterThanOrEqual(26);
      for (const l of [1, 2, 3] as const) expect(passagesOf(k, l).length, `${k}${l}`).toBeGreaterThanOrEqual(8);
    }
  });
  it('ids are unique', () => expect(new Set(PASSAGES.map(p => p.id)).size).toBe(PASSAGES.length));
  it('there are enough at the start to keep twenty letters between repeats', () => {
    // Read the Mail and What Came Next are open from the start, at Level 1
    expect(passagesOf('ask', 1).length + passagesOf('order', 1).length).toBeGreaterThanOrEqual(21);
  });
  it('every passage has two or three questions', () => { for (const p of PASSAGES) expect(p.qs.length, p.id).toBeGreaterThanOrEqual(2); expect(Math.max(...PASSAGES.map(p => p.qs.length))).toBeLessThanOrEqual(3); });
});

describe('every word can be read', () => {
  it('every word of every passage, written choice, statement and label is in an allowed list', () => {
    const bad: string[] = [];
    for (const p of PASSAGES) for (const t of [...p.lines, ...p.qs.flatMap(written)]) for (const w of wordsOf(t)) if (!isAllowed(w)) bad.push(`${p.id}: ${w}`);
    expect(bad).toEqual([]);
  });
  it('the base words are few', () => {
    const used = new Set(PASSAGES.flatMap(p => [...p.lines, ...p.qs.flatMap(written)].flatMap(t => baseWordsIn(t).map(b => b.word))));
    expect(used.size).toBeLessThanOrEqual(40);
  });
  it('lowercase, except I, names and the first word of a sentence', () => {
    const bad: string[] = [];
    for (const p of PASSAGES) {
      for (const line of [...p.lines, ...p.qs.filter(q => q.form === 'yn').map(q => q.says!)]) {
        // a sentence starts the line, and again after . ! ? or an opening quote
        const words = line.match(/(^|[.!?]\s+|"|“)?[A-Za-z'-]+/g) ?? [];
        words.forEach((m, i) => {
          const w = m.replace(/^[^A-Za-z]+/, '');
          const starts = i === 0 || /^[.!?"“]/.test(m.trim()) || /["“]$/.test(m.slice(0, m.length - w.length));
          if (/^[A-Z]/.test(w) && !starts && w !== 'I' && !isName(w)) bad.push(`${p.id}: ${w} in "${line}"`);
          if (/^[a-z]/.test(w) && i === 0) bad.push(`${p.id}: no capital on "${line}"`);
        });
      }
      for (const q of p.qs) for (const c of q.form === 'words' || q.form === 'label' ? [q.right, ...q.wrong] : []) {
        for (const w of wordsOf(c)) if (/^[A-Z]/.test(w) && w !== 'I' && !isName(w)) bad.push(`${p.id}: choice "${c}"`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('Levels', () => {
  it('a passage keeps inside its Level\'s sentence count, and no sentence is longer than twelve words', () => {
    for (const p of PASSAGES) {
      const [lo, hi] = SENTENCES[p.kind][p.level];
      expect(p.lines.length, p.id).toBeGreaterThanOrEqual(lo);
      expect(p.lines.length, p.id).toBeLessThanOrEqual(hi);
      for (const l of p.lines) expect(wordsOf(l).length, `${p.id}: ${l}`).toBeLessThanOrEqual(MOST_WORDS);
      for (const l of p.lines) expect(/[.!?]["”]?$/.test(l), `${p.id}: ${l}`).toBe(true);
    }
  });
  it('each kind asks what its Level asks', () => {
    for (const p of PASSAGES) {
      const forms = new Set(p.qs.map(q => q.form));
      if (p.kind === 'ask') expect([...forms], p.id).toEqual([p.level === 1 ? 'pic' : 'words']);
      if (p.kind === 'order') expect(p.qs[0]!.form).toBe('order');
      if (p.kind === 'order' && p.level === 1) expect(p.pics?.length, p.id).toBe(p.lines.length);
      if (p.kind === 'order' && p.level > 1) expect(p.pics, p.id).toBeUndefined();
      if (p.kind === 'order' && p.level === 3) expect(p.lines.map(l => l.split(/[ ,]/)[0])).toEqual(['First', 'Next', 'Then', 'Last']);
      if (p.kind === 'order' && p.level === 2) for (const l of p.lines) expect(/^(First|Next|Then|Last)\b/.test(l), p.id).toBe(false);
      if (p.kind === 'main') {
        expect(p.topic, p.id).toBeTruthy();
        expect(p.qs[0]!.form, p.id).toBe(p.level === 1 ? 'pic' : p.level === 2 ? 'words' : 'line');
        if (p.level === 3) { expect(p.odd, p.id).toBeDefined(); expect(p.qs[0]!.right).toBe(String(p.odd)); }
      }
      if (p.kind === 'infer') {
        expect(p.qs[0]!.clues?.length, p.id).toBeGreaterThan(0);
        if (p.level === 1) expect(p.qs[0]!.form, p.id).toBe('pic');
        if (p.level === 2) expect(p.qs[0]!.ask, p.id).toMatch(/^How does .* feel\?$/);
        if (p.level === 3) expect(p.qs[0]!.ask, p.id).toMatch(/next\?$/);
      }
      if (p.kind === 'fact') expect([...forms], p.id).toEqual([p.level === 1 ? 'words' : p.level === 2 ? 'label' : 'yn']);
    }
  });
});

function ok(v: unknown, op: string, [want]: unknown[], msg: string, fail: (why: string) => void) {
  const good = op === 'toBe' ? v === want : op === 'toBeGreaterThanOrEqual' ? (v as number) >= (want as number) : op === 'toBeGreaterThan' ? (v as number) > (want as number)
    : op === 'toBeLessThan' ? (v as number) < (want as number) : op === 'toContain' ? (v as unknown[]).includes(want) : op === 'toEqual' ? JSON.stringify(v) === JSON.stringify(want)
    : op === 'toBeTruthy' ? !!v : v !== undefined;
  if (!good) fail(`${msg} (${op} ${JSON.stringify(want) ?? ''}, got ${JSON.stringify(v)})`);
}

describe('exactly one right answer, and it can\'t be had without reading', () => {
  it('the right answer is one of the choices once, and the choices differ', () => each((p, q, fail) => {
    if (q.form === 'order') return;
    const all = [q.right, ...q.wrong];
    ok(new Set(all).size, 'toBe', [all.length], `${p.id} ${q.ask}`, fail);
    ok(q.wrong.length, 'toBeGreaterThanOrEqual', [q.form === 'yn' ? 2 : 1], `${p.id} ${q.ask}`, fail);
    if (q.form === 'pic') { for (const k of all) ok(PICS[k], 'toBeDefined', [], `${p.id}: picture ${k}`, fail); ok(new Set(all.map(k => picOf(k).show)).size, 'toBe', [all.length], p.id, fail); }
    if (q.form === 'line') for (const k of all) ok(Number(k), 'toBeLessThan', [p.lines.length], p.id, fail);
    if (q.form === 'label') { ok(isDiagram(p.diagram), 'toBe', [true], p.id, fail); for (const k of all) ok(DIAGRAMS[p.diagram as keyof typeof DIAGRAMS] as readonly string[], 'toContain', [k], p.id, fail); }
    if (q.form === 'yn') expect(all.sort()).toEqual(['no', 'not in the report', 'yes']);
  }));
  it('every question records the sentence that holds its answer (a "not in the report" has none), and Clue Finder its clue words', () => each((p, q, fail) => {
    if (q.form === 'yn' && q.right === 'not in the report') { expect(q.at).toEqual([]); return; }
    ok(q.at.length, 'toBeGreaterThan', [0], `${p.id} ${q.ask}`, fail);
    for (const i of q.at) ok(i, 'toBeLessThan', [p.lines.length], p.id, fail);
    for (const c of q.clues ?? []) ok(literal(p, c), 'toBe', [true], `${p.id}: clue "${c}"`, fail);
    if (q.clues) ok(q.think, 'toBeTruthy', [], p.id, fail);
    // a question about the words (not the order, a title, a sentence, a label or the report) says why when a miss is taught
    if (p.kind !== 'order' && (q.form === 'pic' || q.form === 'words') && !q.clues && q.at.length < p.lines.length) ok(q.so, 'toBeTruthy', [], `${p.id} ${q.ask}`, fail);
  }));
  it('the right answer is never the only choice that names something in the letter', () => each((p, q, fail) => {
    if ((q.form !== 'pic' && q.form !== 'words') || q.clues) return;
    if (!names(p, q, q.right)) return;
    ok(q.wrong.some(w => names(p, q, w)), 'toBe', [true], `only "${q.right}" names the letter`, fail);
  }));
  it('the right answer is never the longest by a clear margin', () => each((p, q, fail) => {
    if (q.form !== 'words') return;
    const longest = Math.max(...q.wrong.map(w => w.length));
    ok(q.right.length <= longest + 4 || q.right.length <= longest * 1.3, 'toBe', [true], `${p.id} ${q.ask}: "${q.right}"`, fail);
  }));
  it('wrong answers in Read the Mail are things from the letter', () => each((p, q, fail) => {
    if (p.kind !== 'ask') return;
    for (const w of q.wrong) ok(names(p, q, w), 'toBe', [true], `"${w}" is not in the letter`, fail);
  }));
  it('a wrong answer in Read the Mail is never in the answer\'s sentence when the answer itself is not (it would read as a second answer)', () => each((p, q, fail) => {
    if (p.kind !== 'ask') return;
    const inAnswer = { ...p, lines: q.at.map(i => p.lines[i]!), from: 'Base' as const };
    for (const w of q.wrong) ok(names(inAnswer, q, w) && !names(inAnswer, q, q.right), 'toBe', [false], `"${w}" is in the answer's sentence and the answer is not`, fail);
  }));
  it('in Clue Finder the answer is not written in the letter, and nor are the wrong guesses', () => each((p, q, fail) => {
    if (!q.clues || q.form === 'line') return;
    for (const c of [q.right, ...q.wrong]) {
      const phrases = q.form === 'pic' ? picOf(c).match : [c];
      for (const ph of phrases) ok(literal(p, ph), 'toBe', [false], `"${ph}" is in the letter`, fail);
    }
  }));
  it('a Fact File statement that the report says (yes) or says the opposite of (no) is about the sentence it points at', () => each((p, q, fail) => {
    if (q.form !== 'yn' || q.right === 'not in the report') return;
    const said = lemmasOf(q.at.map(i => p.lines[i]).join(' ')), content = [...lemmasOf(q.says!)].filter(w => !STOP.has(w));
    ok(content.filter(w => said.has(w)).length, 'toBeGreaterThanOrEqual', [1], `"${q.says}" shares little with its sentence`, fail);
  }));
});

describe('the Fact File is true, and sourced', () => {
  const spec = readFileSync(new URL('../../../.scratch/moon-base-mail/spec.md', import.meta.url), 'utf8');
  it('every Fact File report is listed in the spec with its source', () => {
    for (const p of PASSAGES.filter(x => x.kind === 'fact')) expect(spec.includes(`\`${p.id}\``), `${p.id} is not in the spec's fact list`).toBe(true);
  });
});
