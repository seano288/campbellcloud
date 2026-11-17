// Dino Dig's tables beside the shared word list: the pictures, the silly words and the pairs the voice says alike. The silly words are
// re-checked against every dictionary on the machine (macOS's word list and names, and the US and UK Hunspell dictionaries calibre
// ships), against the ways each sound can be spelled (so "fone" would be caught as "phone"), and against a list of modern words, slang
// and short names the dictionaries lack.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PATTERN_IDS, PICTURES, WORDS, type PatternId } from './list';
import { HEARD_ALIKE } from './pairs';
import { CONTAINERS, LOOK_ALIKE, NOT_CLEAR, READ_PICTURES, SUBJECTS, SURFACES } from './pictures';
import { SILLY } from './silly';

const read = (path: string, split = (l: string) => l) => (existsSync(path) ? readFileSync(path, 'utf8').split('\n').map(l => split(l).trim().toLowerCase()).filter(Boolean) : []);
const WEB2 = new Set(read('/usr/share/dict/words'));
const NAMES = new Set(read('/usr/share/dict/propernames'));
const HUN = new Set(['en-US', 'en-GB'].flatMap(l => read(`/Applications/calibre.app/Contents/Resources/resources/dictionaries/${l}/${l}.dic`, x => x.split('/')[0]!)));
/** Real words, slang, abbreviations and short names a child could know that the dictionaries lack. */
const MODERN = [
  'lol', 'omg', 'zap', 'zit', 'vid', 'pic', 'fab', 'rad', 'dab', 'emo', 'bot', 'app', 'tab', 'pod', 'vet', 'gym', 'mom', 'dad', 'bro', 'sis', 'yum', 'yup',
  'nah', 'meh', 'duh', 'zip', 'vax', 'vape', 'blog', 'vlog', 'meme', 'gif', 'nerd', 'geek', 'dork', 'snot', 'barf', 'blah', 'fave', 'glam', 'jock', 'pal',
  'prom', 'thug', 'tux', 'wiz', 'yuk', 'pog', 'larp', 'womp', 'yomp', 'vom', 'vin', 'jeb', 'jem', 'kip', 'pim', 'zeb', 'zak', 'dex', 'jax', 'yeet', 'sus',
];
const RUDE = ['fuk', 'fuc', 'shit', 'sht', 'dik', 'dic', 'cok', 'kok', 'ass', 'tit', 'cum', 'fag', 'sex', 'poo', 'pee', 'pis', 'butt', 'bum', 'crap', 'damn',
  'hell', 'turd', 'slut', 'fart', 'barf', 'puke', 'nig', 'jiz', 'wank', 'twat', 'nad', 'fick', 'shid', 'fap', 'jap', 'wop', 'gyp', 'yid', 'kike', 'cuck',
  'spic', 'spik', 'coon', 'homo', 'dyke', 'dong', 'wang', 'shag', 'spunk', 'poon', 'knob', 'boob', 'gash', 'skank', 'vag', 'tard', 'nazi', 'kkk'];
const common = (w: string) => HUN.has(w) || NAMES.has(w) || MODERN.includes(w) || (WORDS as readonly string[]).includes(w);
const real = (w: string) => WEB2.has(w) || common(w);
const formOf = (a: string) => common(a) || (a.endsWith('ed') && (common(a.slice(0, -2)) || common(a.slice(0, -1)))) || (a.endsWith('s') && common(a.slice(0, -1))) || (/[aeiouyw]d$/.test(a) && common(a.slice(0, -1)));

/** Other ways to spell the sounds of a silly word: one of these that is a common word means it would be read as that word. */
const ALTS: [RegExp, string[]][] = [
  [/ck/, ['k', 'c']], [/^c/, ['k']], [/k/, ['c', 'ck']], [/ee/, ['ea', 'e', 'ie', 'ey']], [/ai/, ['ay', 'a', 'ei', 'ey', 'eigh']], [/oa/, ['o', 'ow', 'oe']],
  [/ir|ur/, ['er', 'ir', 'ur', 'ear', 'or']], [/ar/, ['arr', 'are']], [/or/, ['ore', 'oar', 'our', 'oor', 'aw']], [/f/, ['ph', 'ff', 'gh']], [/z/, ['s', 'zz']],
  [/j/, ['g', 'dg', 'ge']], [/o(?=[^aeiou]*$)/, ['aw', 'au', 'a']], [/u(?=[^aeiou]*$)/, ['o', 'ou', 'oo']], [/e(?=[^aeiou]+$)/, ['ea', 'ai']], [/i(?=[^aeiou]+$)/, ['y', 'ui']],
  [/a(?=[^aeiou]+$)/, ['ai', 'au']], [/x$/, ['cks', 'ks']], [/ch/, ['tch']], [/^n/, ['kn', 'gn']], [/^r/, ['wr']], [/m$/, ['mb']], [/w/, ['wh']], [/([bdgmnpt])$/, ['$1$1']],
  [/a([^aeiou])e$/, ['ai$1', 'ay$1', 'ei$1', 'a$1$1']], [/i([^aeiou])e$/, ['igh$1', 'y$1e', 'ie$1', 'uy$1']], [/o([^aeiou])e$/, ['oa$1', 'ow$1', 'oe$1', 'o$1']],
  [/u([^aeiou])e$/, ['oo$1', 'ew$1', 'ou$1', 'ui$1', 'ue$1']],
];
function alikes(w: string): string[] {
  const out = new Set([w]);
  for (let round = 0; round < 2; round++) for (const s of [...out]) for (const [re, alts] of ALTS) for (const a of alts) if (re.test(s)) out.add(s.replace(re, a));
  return [...out];
}

const C = '[bdfhjlmnprstvwyz]|c(?=[aou])|g(?=[aou])';
const GRAMMAR: Record<PatternId, RegExp> = {
  cvc: new RegExp(`^(?:${C})[aeiou][bdgmnpt]$`),
  digraph: new RegExp(`^(?:(?:sh|ch|th)[aeiou][bdgmnpt]|(?:${C})[aeiou](?:sh|ck|th|ng))$`),
  blend: new RegExp(`^(?:(?:bl|cl|fl|gl|pl|sl|br|cr|dr|fr|gr|tr|st|sp|sn|sw)[aeiou][bdgmnpt]|(?:${C})[aeiou](?:nd|mp|st|nt|ft))$`),
  'magic-e': new RegExp(`^(?:${C}|sl|bl|st|fr|gr|tr)[aiou][bdkmnpt]e$`),
  team: new RegExp(`^(?:${C}|bl|sl|st|tr|gr|fr)(?:ee|ai|oa)[bdgkmnpt]$`),
  r: new RegExp(`^(?:${C})(?:ar|or|ir|ur)[bdgkmnpt]$`),
};

describe('the pictures', () => {
  it('are on the list, one picture each, and leave out the unclear ones', () => {
    const pics = Object.values(READ_PICTURES);
    expect(new Set(pics).size).toBe(pics.length);
    for (const w of Object.keys(READ_PICTURES)) expect(WORDS as readonly string[]).toContain(w);
    for (const w of NOT_CLEAR) expect(READ_PICTURES).not.toHaveProperty(w);
    expect(Object.keys(READ_PICTURES).length).toBeGreaterThanOrEqual(75);
  });
  it('leave Word Wreckers\' own table as it was', () => {
    expect(Object.keys(PICTURES)).toHaveLength(81);
    expect(WORDS).toHaveLength(201);
  });
  it('group the look-alikes and the scene words only from pictured words', () => {
    for (const w of [...LOOK_ALIKE.flat(), ...SUBJECTS, ...SURFACES, ...CONTAINERS]) expect(READ_PICTURES, w).toHaveProperty(w);
  });
});

describe('the silly words', () => {
  it('sound out under their Pattern, and there are plenty of each', () => {
    for (const p of PATTERN_IDS) {
      expect(SILLY[p].length, p).toBeGreaterThanOrEqual(30);
      for (const s of SILLY[p]) expect(s, `${p}: ${s}`).toMatch(GRAMMAR[p]);
    }
  });
  it('are not real words, names or anything rude, and not said like a common word spelled another way', () => {
    const all = PATTERN_IDS.flatMap(p => SILLY[p]);
    expect(new Set(all).size).toBe(all.length);
    const bad = all.filter(s => real(s) || RUDE.some(r => s.includes(r)) || (HUN.size > 0 && alikes(s).some(formOf)));
    expect(bad.map(s => `${s} (${alikes(s).filter(formOf).join(' ')})`)).toEqual([]);
  });
  it('were checked against the dictionaries where they are installed', () => {
    if (!WEB2.size) return;
    expect(WEB2.has('cat') && NAMES.has('kate')).toBe(true);
  });
});

describe('the pairs the voice says alike', () => {
  it('are words on the list', () => {
    for (const [a, b] of HEARD_ALIKE) { expect(WORDS as readonly string[]).toContain(a); expect(WORDS as readonly string[]).toContain(b); }
  });
});
