// The brief's rules for the questions, on every kind × Level × each stage of the Families × every letter it can ask × 3 seeds:
// a question only uses letters from Families he has met; Where to Start, Which Way and Tall Small Tail have exactly one right choice;
// Which Way Level 3 never flips a letter into another real word; every writing question can be written by a scripted finger.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { MODE_IDS } from '../learning';
import { feed, startProgress, TUNING } from '../letters/check';
import { BDPQ, distinctTurns, FLIP_MAKES_A_WORD, glyphKey, isBdpq, mirrorDiffers, sameUnder, turnedBdpq } from '../letters/glyphs';
import { FAMILY_IDS, firstWay, letter, metLetters, startOf, type FamilyId, type Pt } from '../letters/strokes';
import { askLine } from './ask';
import { PHRASES, nameOf } from '../phrases';
import { boxesOf, canAsk, check, DINO_SHORT_WORDS, flipSpots, isWriting, makeQuestion, poolFor, strokeAt, tappable, WORDS, wrongDots, type Level, type Question } from './problems';

const LEVELS: readonly Level[] = [1, 2, 3];
const STAGES = FAMILY_IDS.map((_, i) => FAMILY_IDS.slice(0, i + 1) as FamilyId[]);
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Every question the game can make, for every kind, Level and stage. */
function* everyQuestion() {
  for (const families of STAGES) for (const mode of MODE_IDS) for (const level of LEVELS) {
    for (const ch of [...new Set(poolFor(mode, level, families))]) for (let seed = 1; seed <= 3; seed++) {
      yield { families, mode, level, q: makeQuestion(mode, level, ch, families, seeded(seed * 7919 + ch.charCodeAt(0))) };
    }
  }
}
const ALL = [...everyQuestion()];
const lettersIn = (q: Question): string[] => {
  switch (q.kind) {
    case 'trace': return [q.ch];
    case 'write': return [...q.text];
    case 'word': return [...q.word];
    case 'start': return [q.ch];
    // a backwards b is a d to look at: it counts as one
    case 'flip': return q.word ? [...q.word, ...(isBdpq(q.word[q.at!]!) ? [turnedBdpq(q.word[q.at!]! as 'b', 'm')] : [])] : q.glyphs!.map(g => (isBdpq(g.ch) ? turnedBdpq(g.ch, g.turn) : g.ch));
    case 'size': return q.rows ? q.rows.flatMap(r => r.map(p => p.ch)) : [q.ch];
  }
};

describe('the questions', { timeout: 30000 }, () => {
  it('are many: every kind at every Level once every Family is met', () => {
    expect(ALL.length).toBeGreaterThan(3000);
    for (const mode of MODE_IDS) for (const level of LEVELS) expect(canAsk(mode, level, FAMILY_IDS as unknown as FamilyId[]), `${mode} L${level}`).toBe(true);
  });
  it('only use letters from Families he has met', () => {
    for (const { families, mode, level, q } of ALL) {
      const met = metLetters(families);
      for (const c of lettersIn(q)) expect(met, `${mode} L${level} ${JSON.stringify(q)} with ${families.join(',')}`).toContain(c);
    }
  });
  it('write from Dino Dig\'s short-vowel words, three letters each', () => {
    expect([...WORDS].sort()).toEqual(DINO_SHORT_WORDS().sort());
    for (const w of WORDS) expect(w).toHaveLength(3);
  });
});

describe('exactly one right choice', { timeout: 30000 }, () => {
  it('for every tap question: one choice is right and the rest are not', () => {
    for (const { mode, level, q } of ALL) {
      if (isWriting(q)) continue;
      const right = q.choices.filter(c => check(q, c) === true);
      expect(right, `${mode} L${level} ${JSON.stringify(q)}`).toEqual([q.answer]);
      expect(new Set(q.choices).size).toBe(q.choices.length);
    }
  });
  it('Where to Start: the right dot is where the letter starts, and no other dot is near any stroke\'s start', () => {
    for (const { q } of ALL) {
      if (q.kind !== 'start') continue;
      const L = letter(q.ch);
      if (q.step === 'dot') {
        expect(q.dots).toHaveLength(3);
        expect(q.dots![Number(q.answer)]).toEqual(startOf(L.strokes[0]!));
        q.dots!.forEach((d, i) => { if (String(i) !== q.answer) for (const s of L.strokes) expect(dist(d, startOf(s))).toBeGreaterThanOrEqual(0.6); });
        for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(dist(q.dots![i]!, q.dots![j]!)).toBeGreaterThanOrEqual(0.55);
      }
      if (q.step === 'way') {
        expect(q.arrows).toHaveLength(3);
        const way = firstWay(L.strokes[0]!), right = q.arrows![Number(q.answer)]!;
        expect(dist(right, way)).toBeLessThan(1e-9);
        q.arrows!.forEach((a, i) => { if (String(i) !== q.answer) expect(a[0] * way[0] + a[1] * way[1]).toBeLessThan(0.01); }); // a quarter turn or more away
      }
      if (q.step === 'second') {
        expect(tappable(L)).toBe(true);
        // a tap on a part of the second line that's well away from the others means the second line
        const own = L.strokes[1]!.pts.find(p => L.strokes.every((o, j) => j === 1 || o.pts.every(r => dist(p, r) >= 0.25)))!;
        expect(strokeAt(L, own)).toBe(1);
      }
    }
  });
  it('Which Way: the choices all look different, and only one is the letter the right way round', () => {
    for (const { q } of ALL) {
      if (q.kind !== 'flip' || q.step === 'word') continue;
      const keys = q.glyphs!.map(glyphKey);
      expect(keys).toContain(q.answer);
      if (isBdpq(q.ch)) { expect(q.glyphs!.every(g => g.turn === 'id')).toBe(true); expect(new Set(q.glyphs!.map(g => g.ch)).size).toBe(q.glyphs!.length); continue; }
      // no two choices look alike: each is its own turn of a letter that looks different every one of those ways
      expect(q.glyphs!.every(g => g.ch === q.ch)).toBe(true);
      const turns = q.glyphs!.map(g => g.turn), distinct = distinctTurns(q.ch);
      for (const t of turns) expect(distinct).toContain(t);
      expect(q.step === 'two' ? turns.length === 2 : turns.length >= 3).toBe(true);
      for (const t of turns) if (t !== 'id') expect(sameUnder(q.ch)).not.toContain(t);
    }
    // what looks the same which way is worked out from the strokes: these are the ones a child would argue about
    expect(sameUnder('a')).toEqual(['id', 'f']); // a upside down is still a (ball and stick)
    expect(sameUnder('t')).toEqual(['id', 'm', 'f', 'r']); // t, with its cross in the middle, every way
    expect(sameUnder('s')).toEqual(['id', 'r']);
    expect(sameUnder('e')).toEqual(['id']); // a backwards e is a real reversal, so it can be asked
    expect(sameUnder('b')).toEqual(['id']);
    expect(mirrorDiffers('t')).toBe(false);
    // b, d, p and q from four are the four of them
    expect(BDPQ.map(c => turnedBdpq('b', (['id', 'm', 'f', 'r'] as const)[BDPQ.indexOf(c)]!))).toEqual(['b', 'd', 'p', 'q']);
  });
  it('Which Way Level 3: one letter backwards, never one that looks the same backwards, never one that spells another real word', () => {
    const dict = existsSync('/usr/share/dict/words') ? new Set(readFileSync('/usr/share/dict/words', 'utf8').split('\n').map(w => w.trim()).filter(w => w === w.toLowerCase())) : null;
    const swap: Record<string, string> = { b: 'd', d: 'b', p: 'q', q: 'p' };
    for (const w of WORDS) for (const [i, c] of [...w].entries()) {
      if (!swap[c]) continue;
      const other = w.slice(0, i) + swap[c] + w.slice(i + 1);
      if (dict?.has(other)) expect(FLIP_MAKES_A_WORD, `${w} → ${other}`).toContain(`${w}:${i}`);
      if (FLIP_MAKES_A_WORD.includes(`${w}:${i}`)) expect(flipSpots(w)).not.toContain(i);
    }
    expect(flipSpots('bag')).not.toContain(0); // bag with its b backwards reads dag
    expect(flipSpots('dog')).not.toContain(0); // bog
    for (const { q } of ALL) {
      if (q.kind !== 'flip' || q.step !== 'word') continue;
      expect(mirrorDiffers(q.word![q.at!]!)).toBe(true);
      expect(FLIP_MAKES_A_WORD).not.toContain(`${q.word}:${q.at}`);
    }
  });
  it('Tall, Small, Tail: a letter has one size; one writing sits right; one letter floats or sinks', () => {
    for (const { q } of ALL) {
      if (q.kind !== 'size') continue;
      if (q.step === 'sort') { expect(q.ch).not.toBe('t'); expect(q.answer).toBe(letter(q.ch).size); }
      if (q.step === 'line') {
        expect(q.rows!.filter(r => r.every(p => p.dy === 0))).toHaveLength(1);
        for (const r of q.rows!) expect(r.filter(p => p.dy !== 0).length).toBeLessThanOrEqual(1);
        expect(new Set(q.rows!.map(r => JSON.stringify(r))).size).toBe(3);
      }
      if (q.step === 'odd') { expect(q.rows![0]!.filter(p => p.dy !== 0)).toHaveLength(1); expect(q.rows![0]![Number(q.answer)]!.dy).not.toBe(0); }
    }
  });
});

describe('what a question says', { timeout: 30000 }, () => {
  it('says everything needed to answer it: the letter it asks about, or the word', () => {
    for (const { q } of ALL) {
      const line = askLine(q);
      for (const p of line) expect(PHRASES, JSON.stringify(q)).toContain(p);
      if (q.kind === 'word') expect(line).toContain(q.word);
      // Which Way's words: a backwards d is drawn as a b ("bed" shows as "beb"), so only the word says which letter is wrong
      else if (q.kind === 'flip' && q.step === 'word') expect(line).toContain(q.word);
      else if (q.kind === 'write') expect(line.join(' ')).toContain(q.text.length > 1 ? q.text : nameOf(q.text));
      else if (q.kind !== 'size' || q.step === 'sort') expect(line).toContain(nameOf(q.ch));
    }
  });
});

describe('the Levels', { timeout: 30000 }, () => {
  it('match the brief: Trace It any letter; Write It lowercase until Level 3; Write a Word shown, then flashed, then only said', () => {
    for (const { families, mode, level, q } of ALL) {
      if (q.kind === 'write') {
        expect(q.flash).toBe(level === 1);
        if (level < 3 && metLetters(families).some(c => letter(c).kind === 'lower')) for (const c of q.text) expect(letter(c).kind).toBe('lower');
      }
      if (q.kind === 'word') expect(q.show).toBe(({ 1: 'shown', 2: 'flash', 3: 'said' } as const)[level]);
      if (q.kind === 'start') expect(q.step).toBe(({ 1: 'dot', 2: 'way', 3: 'second' } as const)[level]);
      if (q.kind === 'flip') expect(q.step).toBe(({ 1: 'two', 2: 'four', 3: 'word' } as const)[level]);
      if (q.kind === 'size') expect(q.step).toBe(({ 1: 'sort', 2: 'line', 3: 'odd' } as const)[level]);
      void mode;
    }
    // Write It Level 3 asks capitals, numbers and numbers 10 to 20 too
    const l3 = ALL.filter(x => x.q.kind === 'write' && x.level === 3 && x.families.length === FAMILY_IDS.length).map(x => (x.q as { text: string }).text);
    expect(l3.some(t => /^[A-Z]$/.test(t))).toBe(true);
    expect(l3.some(t => /^[0-9]$/.test(t))).toBe(true);
    expect(l3.some(t => t.length === 2)).toBe(true);
  });
  it('every writing question can be written by a scripted finger at its Level\'s lane', () => {
    for (const { level, q } of ALL) {
      if (!isWriting(q)) continue;
      const t = q.kind === 'trace' ? TUNING[level] : TUNING.write;
      for (const ch of boxesOf(q)) {
        const L = letter(ch);
        let prog = startProgress(t);
        for (const s of L.strokes) prog = feed(L, t, prog, s.pts.map(([x, y]) => [x + (t.free ? 0.7 : 0), y] as Pt)).progress;
        expect(prog.done, `${q.kind} L${level} ${ch}`).toBe(L.strokes.length);
      }
    }
  });
  it('sits a kind out when it has nothing to ask yet (Write a Word before he has met enough letters)', () => {
    expect(canAsk('word', 1, ['lines'])).toBe(false);
    expect(canAsk('flip', 3, ['lines'])).toBe(false);
    expect(canAsk('trace', 1, ['lines'])).toBe(true);
    for (const f of STAGES) for (const l of [1, 2, 3] as const) expect(canAsk('trace', l, f)).toBe(true);
  });
  it('lets every letter be told where it starts: three dots for most, the way it goes first for all', () => {
    const missing = [...new Set(STAGES.at(-1)!.flatMap(f => metLetters([f])))].filter(c => wrongDots(letter(c)).length < 2);
    expect(missing.length).toBeLessThan(6); // a few tiny letters (the dot of i is its own stroke) only get Levels 2 and 3
  });
});
