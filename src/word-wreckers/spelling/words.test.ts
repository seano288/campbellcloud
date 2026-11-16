// The shared word list (src/dino-dig/words/list.ts) and the wrong spellings made from it. Spelling has more than one defensible answer
// more often than you'd expect, so the list and these checks matter more than the generator.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HOMOPHONES, infoOf, NOT_REGULAR, PATTERN_IDS, PICTURES, sameSound, WORD_INFO, WORDS, wordsIn } from '../../dino-dig/words/list';
import { PHRASES, slowly } from '../phrases';
import { inPhrase, PHRASES as PICK_PHRASES } from './problems';
import { REAL_WORDS } from './real';
import { added, allWrongSpellings, boxesOf, confused, dropped, isRude, onsetRime, patternsIn, pickWrongs, respelled, spell } from './words';

const DICT = '/usr/share/dict/words';
const dictionary = existsSync(DICT) ? new Set(readFileSync(DICT, 'utf8').split('\n').map(w => w.trim().toLowerCase())) : null;

describe('the word list', () => {
  it('has about 150 to 200 words, each Pattern well stocked, no word twice', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(150);
    expect(WORDS.length).toBeLessThanOrEqual(205);
    expect(new Set(WORDS).size).toBe(WORDS.length);
    for (const p of PATTERN_IDS) expect(wordsIn(p).length, p).toBeGreaterThanOrEqual(25);
  });
  it('spells every word from its sound boxes, lowercase letters only', () => {
    for (const i of WORD_INFO) {
      expect(spell(i.sounds)).toBe(i.word);
      expect(i.word).toMatch(/^[a-z]+$/);
      // the boxes cover every letter exactly once
      expect(boxesOf(i.sounds).flatMap(b => b.letters).sort((a, b) => a - b)).toEqual([...i.word].map((_, k) => k));
    }
  });
  it('tags each word with the latest Pattern it uses, so it is only asked once all its Patterns are met', () => {
    for (const i of WORD_INFO) {
      const uses = patternsIn(i.sounds), latest = PATTERN_IDS.filter(p => uses.includes(p)).at(-1);
      expect(latest, i.word).toBe(i.pattern);
    }
  });
  it('leaves out words that sound like another word spelled differently, and words said two ways', () => {
    for (const w of WORDS) { expect(HOMOPHONES, w).not.toContain(w); expect(NOT_REGULAR, w).not.toContain(w); }
    // the ones the brief and the reviews named
    for (const w of ['sea', 'see', 'tail', 'tale', 'sun', 'son', 'road', 'rode', 'rain', 'week', 'meat', 'bell', 'hair', 'deer', 'turn']) expect(WORDS as readonly string[]).not.toContain(w);
  });
  it('gives a picture only where the emoji is plainly that word, and never the same picture twice', () => {
    const pics = Object.values(PICTURES);
    expect(new Set(pics).size).toBe(pics.length);
    for (const w of Object.keys(PICTURES)) expect(WORDS as readonly string[]).toContain(w);
    for (const w of ['hen', 'bag', 'pot', 'mop']) expect(PICTURES, w).not.toHaveProperty(w); // a hen is just as likely "chicken"
  });
  it('records every word alone, and slowly, with Aria', () => {
    for (const w of WORDS) { expect(PHRASES as readonly string[]).toContain(w); expect(PHRASES as readonly string[]).toContain(slowly(w)); }
  });
  it('splits words into an onset and a rime for Chunks Level 1', () => {
    expect(onsetRime(infoOf('ship'))).toEqual(['sh', 'ip']);
    expect(onsetRime(infoOf('train'))).toEqual(['tr', 'ain']);
    expect(onsetRime(infoOf('cake'))).toEqual(['c', 'ake']);
    expect(onsetRime(infoOf('arm'))).toBeNull();
  });
});

describe('wrong spellings', () => {
  it('are never a real word, a word on the list, or anything rude', () => {
    for (const w of WORDS) for (const t of allWrongSpellings(w)) {
      expect(REAL_WORDS.has(t), `${w}: ${t}`).toBe(false);
      expect(WORDS as readonly string[], `${w}: ${t}`).not.toContain(t);
      expect(isRude(t), `${w}: ${t}`).toBe(false);
      expect(t).not.toBe(w);
    }
  });
  it.runIf(dictionary)('are not in the system dictionary either', () => {
    for (const w of WORDS) for (const t of allWrongSpellings(w)) expect(dictionary!.has(t), `${w}: ${t}`).toBe(false);
  });
  it('that sound right only swap a sound for another spelling of that sound (kat, rane, byke)', () => {
    const EXTRA: Record<string, string[]> = { i_e: ['y_e'], u_e: ['oo', 'ew'], ch: ['tch'], x: ['ks', 'cks'], ee: ['e_e'], ea: ['e_e'] };
    for (const w of WORDS) for (const m of respelled(w)) {
      expect([...sameSound(m.right), ...(EXTRA[m.right] ?? [])], `${w}: ${m.text}`).toContain(m.wrong);
      expect(m.sameSound).toBe(true);
    }
    expect(respelled('cake').map(m => m.text)).toEqual(expect.arrayContaining(['caik', 'cayk']));
    expect(respelled('cake').map(m => m.text)).not.toContain('cace'); // c before e says s
  });
  it('drop or add exactly one letter for Fix It, Level 3', () => {
    for (const w of WORDS) {
      for (const m of dropped(w)) { expect(m.text.length).toBe(w.length - 1); expect(m.text.slice(0, m.at) + m.letter + m.text.slice(m.at)).toBe(w); }
      for (const m of added(w)) { expect(m.text.length).toBe(w.length + 1); expect(m.text.slice(0, m.at) + m.text.slice(m.at + 1)).toBe(w); }
    }
    expect(dropped('bike').map(m => m.text)).toContain('bik');
  });
  it('mix up look-alike or sound-alike letters, never giving a real word (dig for big)', () => {
    for (const m of confused('big')) expect(['dig']).not.toContain(m.text);
    expect(confused('jump').map(m => m.text)).toContain('jumb');
  });
  it('give Which Looks Right two wrong spellings for most words with a vowel team, magic e or r', () => {
    for (const p of ['magic-e', 'team', 'r'] as const) expect(wordsIn(p).filter(w => pickWrongs(w).length >= 2).length, p).toBeGreaterThan(wordsIn(p).length / 2);
  });
  it('have a short phrase with the word in it exactly once', () => {
    for (const [w, phrase] of Object.entries(PICK_PHRASES)) {
      expect(WORDS as readonly string[]).toContain(w);
      expect(phrase.split(/\s+/).filter(x => x === w)).toHaveLength(1);
      expect(inPhrase(phrase, w, 'XX')).not.toContain(w);
      expect(PHRASES as readonly string[]).toContain(phrase);
    }
  });
});
