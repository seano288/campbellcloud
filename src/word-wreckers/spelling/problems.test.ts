// Every kind × Level × Stretch, over many seeds and every word it can ask: exactly one right answer, made the way its Level says.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { infoOf, isVowelSound, sameSound, WORDS, type Word } from '../../dino-dig/words/list';
import { canAsk, check, gapBox, KINDS, lookalikeSpares, makeQuestion, rightAnswer, type Kind, type Level, type Question } from './problems';
import { REAL_WORDS } from './real';
import { isRude, LOOKALIKE, spell } from './words';

const LEVELS: Level[] = [1, 2, 3], STRETCHES = [0, 1, 2] as const;

/** Every question we check: each kind and Level and Stretch, for each word it can ask, a few seeds. */
function* all(seeds = 3): Generator<{ kind: Kind; level: Level; q: Question; tag: string }> {
  for (const kind of KINDS) for (const level of LEVELS) for (const stretch of STRETCHES) {
    for (const [i, w] of WORDS.entries()) {
      if (!canAsk(kind, level, w)) continue;
      for (let s = 0; s < seeds; s++) {
        const q = makeQuestion(kind, level, stretch, w, seeded(i * 101 + s * 7 + stretch * 3 + level));
        yield { kind, level, q, tag: `${kind} L${level} S${stretch} ${w} #${s}` };
      }
    }
  }
}

/** Sequences of tiles (each used once) that spell exactly the word. */
function spellings(tiles: readonly string[], word: string, max: number): string[][] {
  const out: string[][] = [];
  const go = (seq: string[], used: Set<number>) => {
    const text = spell(seq);
    if (seq.length && text === word) out.push(seq);
    if (seq.length >= max || !word.startsWith(text.replace(/e$/, '')) && seq.length) return;
    tiles.forEach((t, i) => { if (!used.has(i)) go([...seq, t], new Set([...used, i])); });
  };
  go([], new Set());
  return [...new Set(out.map(s => s.join('|')))].map(s => s.split('|'));
}

describe('every question', () => {
  it('has its right answer accepted, and is about a word on the list', () => {
    let n = 0;
    for (const { q, tag } of all()) {
      n++;
      expect(WORDS as readonly string[], tag).toContain(q.word);
      expect(check(q, rightAnswer(q)), tag).toBe(true);
    }
    expect(n).toBeGreaterThan(5000);
  });

  it('Build It: L1 exactly its letters, L2 one or two spares that are not look-alikes, L3 spares that look or sound alike', () => {
    for (const { level, q, tag } of all()) {
      if (q.kind !== 'build') continue;
      const spare = [...q.tiles];
      for (const ch of q.word) spare.splice(spare.indexOf(ch), 1);
      expect(spare.length + q.word.length, tag).toBe(q.tiles.length);
      if (level === 1) expect(spare, tag).toEqual([]);
      if (level === 2) { expect(spare.length, tag).toBeGreaterThanOrEqual(1); expect(spare.length).toBeLessThanOrEqual(2); for (const s of spare) expect(lookalikeSpares(q.word), tag).not.toContain(s); }
      if (level === 3) { expect(spare.length, tag).toBeGreaterThanOrEqual(2); expect(spare.some(s => lookalikeSpares(q.word).includes(s)), tag).toBe(true); }
      for (const s of spare) expect(q.word, tag).not.toContain(s);
      expect(q.tiles.join(''), tag).not.toBe(q.word); // never handed over in order
      // only the word itself is right; a wrong next letter is a miss
      expect(check(q, q.word.slice(0, 1)), tag).toBe(q.word.length === 1 || 'more');
    }
  });

  it('Missing Sound: L1 the first sound, L2 the last, L3 the vowel; no wrong tile says the same sound', () => {
    for (const { level, q, tag } of all()) {
      if (q.kind !== 'gap') continue;
      const { sounds } = infoOf(q.word);
      expect(q.box, tag).toBe(gapBox(level, q.word));
      if (level === 1) expect(q.box).toBe(0);
      if (level === 2) expect(q.box).toBe(sounds.length - 1);
      if (level === 3) expect(isVowelSound(sounds[q.box]!), tag).toBe(true);
      expect(new Set(q.choices).size, tag).toBe(q.choices.length);
      expect(q.choices.length, tag).toBeGreaterThanOrEqual(3);
      const right = q.choices.filter(c => check(q, c) === true);
      expect(right, tag).toEqual([q.answer]);
      for (const c of q.choices) if (c !== q.answer) expect(sameSound(q.answer), tag).not.toContain(c);
    }
  });

  it('Chunks: L1 two chunks, L2 each sound a chunk and a spare, L3 spares that say the same sound; only one way to build it', () => {
    for (const { level, q, tag } of all(2)) {
      if (q.kind !== 'chunk') continue;
      expect(spell(q.parts), tag).toBe(q.word);
      if (level === 1) { expect(q.parts, tag).toHaveLength(2); expect(q.tiles).toHaveLength(2); }
      else {
        expect(q.parts, tag).toEqual(infoOf(q.word).sounds);
        expect(q.parts.length, tag).toBeGreaterThanOrEqual(3);
        const spares = q.tiles.slice().filter((t, i) => q.tiles.indexOf(t) === i && !q.parts.includes(t));
        expect(spares.length, tag).toBeGreaterThanOrEqual(1);
        if (level === 3) for (const s of spares) expect(q.parts.some(p => sameSound(p).includes(s)), tag).toBe(true);
      }
      expect(q.parts.some(p => p.length > 1), tag).toBe(true);
      expect(spellings(q.tiles, q.word, q.parts.length + 1), tag).toEqual([q.parts]);
      // any spare built in place of its chunk spells something that isn't a real word (no homophone hiding in the tiles)
      q.tiles.forEach(t => q.parts.forEach((p, i) => { if (t !== p && sameSound(p).includes(t)) expect(REAL_WORDS.has(spell(q.parts.map((x, j) => (j === i ? t : x)))), tag).toBe(false); }));
    }
  });

  it('Fix It: shows a wrong spelling of the word; L1 marks the mistake, L2 does not, L3 is a missing or extra letter; one fix', () => {
    for (const { level, q, tag } of all(2)) {
      if (q.kind !== 'fix') continue;
      const m = q.mistake;
      expect(m.text, tag).not.toBe(q.word);
      expect(REAL_WORDS.has(m.text) || isRude(m.text), tag).toBe(false);
      expect(q.marked, tag).toBe(level === 1);
      if (level === 3) { expect(['drop', 'add'], tag).toContain(m.kind); expect(m.text.length, tag).toBeLessThanOrEqual(6); } else expect(m.kind, tag).toBe('swap');
      if (m.kind === 'swap') {
        expect(spell(q.shown), tag).toBe(m.text);
        // tapping any other box is a miss; only one tile fixes the right box
        q.shown.forEach((_, i) => expect(check(q, `${i}`), tag).toBe(i === m.box ? 'more' : false));
        expect(q.choices.filter(c => check(q, `${m.box}=${c}`) === true), tag).toEqual([m.right]);
        expect(q.choices, tag).not.toContain(m.wrong);
      } else {
        expect(q.shown.join(''), tag).toBe(m.text);
        if (m.kind === 'add') expect(check(q, `-${m.at}`), tag).toBe(true);
        else {
          expect(check(q, `+${m.at}`), tag).toBe('more');
          expect(q.choices.filter(c => check(q, `+${m.at}=${c}`) === true), tag).toEqual([m.letter]);
          // and no other letter offered says the same sound there (k for the missing c of cub)
          for (const c of q.choices) if (c !== m.letter) expect(sameSound(m.letter), `${tag}: ${c}`).not.toContain(c);
        }
      }
    }
  });

  it('Which Looks Right: L1 two, L2 three, L3 three in a phrase; the wrong ones are not real words', () => {
    for (const { level, q, tag } of all()) {
      if (q.kind !== 'pick') continue;
      expect(q.choices.length, tag).toBe(level === 1 ? 2 : 3);
      expect(q.phrase !== null, tag).toBe(level === 3);
      expect(q.choices.filter(c => check(q, c) === true), tag).toEqual([q.word]);
      for (const c of q.choices) if (c !== q.word) { expect(REAL_WORDS.has(c), tag).toBe(false); expect(isRude(c)).toBe(false); expect(WORDS as readonly string[]).not.toContain(c); }
      expect(new Set(q.choices).size).toBe(q.choices.length);
    }
  });

  it('can ask every kind at every Level about plenty of words', () => {
    for (const kind of KINDS) for (const level of LEVELS) expect(WORDS.filter(w => canAsk(kind, level, w as Word)).length, `${kind} L${level}`).toBeGreaterThan(20);
  });
});

describe('the tiles', () => {
  it('are never turned or flipped, so b, d, p and q always look like themselves', () => {
    const css = readFileSync(new URL('../word-wreckers.css', import.meta.url), 'utf8');
    const tileRules = css.split('}').filter(r => /\.(ltile|cell|sbox|spelling|gapbtn|rack|frame)\b/.test(r));
    for (const r of tileRules) { expect(r).not.toMatch(/rotate|scaleX\(-|scale\(-|matrix|skew/); }
    const slide = css.match(/@keyframes slide\{[^}]*(\}[^}]*)*?\}\}/)?.[0] ?? '';
    expect(slide).toMatch(/translateX/);
    expect(slide).not.toMatch(/rotate|scale/);
    for (const k of ['b', 'd', 'p']) expect(LOOKALIKE[k]).toBeDefined(); // and they are offered as look-alikes at Build It L3
  });
});
