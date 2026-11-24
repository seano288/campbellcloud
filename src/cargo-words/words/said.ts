// How each syllable sounds in its word, written so the voice says it that way alone. Plain data and rules, no game code. tools/make_voice.py
// reads these (through tools/cargo-words/said.ts) to record each "(syllable)" clip: a bare "ti" comes out as the letters T and I, "ger"
// as a growl, "py" as the letters P and Y, so each one is respelled as an English word or a plain sound ("tie", "gur", "pee").
//
// The rules follow the syllable's type (sounds.ts): an open vowel says its name (ti: tie), consonant-le says "ull" (tle: tull), a final y
// says ee (py: pee), er, ir and ur say "ur" (ger: gur), and a closed syllable keeps its short vowel, with its last letter doubled where
// the voice would otherwise read it as letters or another word (el: ell, ic: ick). An unstressed syllable says the softer vowel it has in
// its word (the o in octopus: tuh), from SOFT below. words.test.ts checks that every syllable has one sound across the table: a syllable
// spelt the same but said two ways in two words would need two clips, so one of the words is left out.
import { typeOf } from './sounds';
import { WORDS } from './words';

const NAME: Record<string, string> = { a: 'ay', e: 'ee', i: 'eye', o: 'oh', u: 'you' };
/** An open syllable's sound by its last letters, where the plain rule isn't a word the voice says well. */
const OPEN: Record<string, string> = {
  ti: 'tie', pi: 'pie', si: 'sigh', fi: 'fye', li: 'lie', vi: 'vye', mi: 'my', ro: 'roe', to: 'toe', ho: 'hoe', mo: 'moe', po: 'poe', so: 'so',
  lo: 'low', no: 'no', go: 'go', cro: 'crow', ze: 'zee', pre: 'pree', ba: 'bay', pa: 'pay', ma: 'may', ca: 'kay', ta: 'tay', cra: 'cray',
  mu: 'mew', pu: 'pew', hu: 'hew', ru: 'roo', u: 'you', o: 'oh', e: 'ee', a: 'ay',
};
/** Unstressed syllables, as they sound in these words: [word, syllable index, said]. */
export const SOFT: readonly [string, number, string][] = [
  ['octopus', 2, 'puss'], ['telescope', 1, 'uh'], ['crocodile', 1, 'uh'], ['violin', 1, 'uh'], ['salamander', 1, 'uh'],
  ['helicopter', 1, 'uh'], ['invisible', 2, 'uh'], ['unicorn', 1, 'knee'], ['microscope', 1, 'crow'], ['final', 1, 'nul'],
  ['pupil', 1, 'pull'], ['atlas', 1, 'luss'],
];

/** Syllables that are words the voice already says right alone. */
const KEEP = new Set(['bird', 'sun', 'set', 'in', 'on', 'up', 'at', 'it', 'us', 'an', 'id']);
/** A closed syllable as the voice should read it alone. */
function closed(s: string): string {
  if (s === 'sol') return 'sahl';
  if (/[^aeiou]c$/.test(s) || /^[aeiou]c$/.test(s) || /[aeiou]c$/.test(s)) return `${s}k`;
  if (/[aeiou]l$/.test(s)) return `${s}l`;
  if (/[aeiou]s$/.test(s)) return /vis$/.test(s) ? 'viz' : `${s}s`;
  if (/^[aeiou][^aeiou]$/.test(s) && !['in', 'on', 'up', 'at', 'it', 'us', 'an', 'id'].includes(s)) return s.endsWith('n') || s.endsWith('m') || s.endsWith('d') || s.endsWith('t') ? `${s}${s.at(-1)}` : s;
  if (s === 'com') return 'comm';
  return s;
}

/** Found by recording each syllable and transcribing it back (faster-whisper): what the rules made that the voice read as letters or
 *  another word, and the spelling it says right. */
export const FIXED: Readonly<Record<string, string>> = {
  bas: 'baz', en: 'en', cac: 'kack', et: 'it', tus: 'tus', pus: 'pus', thir: 'thuhr', gle: 'guhl', nal: 'nul', ter: 'tur', er: 'urr',
  sal: 'sal!', jol: 'jahl', vis: 'vizz', tle: 'tul', ny: 'knee', po: 'poe', zle: 'zuhl', plas: 'plaz', dile: 'dial', mer: 'murr', num: 'numm',
};

/** The syllable at `i` in `word`, as the voice should say it alone. */
export function saidAs(word: string, syls: readonly string[], i: number): string {
  const soft = SOFT.find(([w, k]) => w === word && k === i);
  if (soft) return soft[2];
  if (FIXED[syls[i]!]) return FIXED[syls[i]!]!;
  const s = syls[i]!, type = typeOf(s, i === syls.length - 1);
  if (KEEP.has(s) || syls.length === 1) return s;
  switch (type) {
    case 'open': return OPEN[s] ?? `${s.slice(0, -1)}${NAME[s.at(-1)!]}`;
    case 'le': return `${s[0]}ull`;
    case 'y': return `${s.slice(0, -1)}ee`;
    case 'r': {
      if (/[eiu]r/.test(s)) return s.replace(/[eiu]r/, 'ur');
      if (s === 'ar') return 'are';
      return s;
    }
    case 'team': return s === 'bow' ? 'boe' : s === 'ea' ? 'ee' : s === 'nee' ? 'knee' : s;
    case 'vce': return s;
    default: return closed(s);
  }
}

/** Every syllable's sound, keyed by the syllable, and any syllable that would need two (for the test). */
export function syllableSounds(): { said: Record<string, string>; clashes: string[] } {
  const said: Record<string, string> = {}, clashes = new Set<string>();
  for (const w of WORDS) w.syls.forEach((s, i) => {
    const x = saidAs(w.word, w.syls, i);
    if (said[s] !== undefined && said[s] !== x) clashes.add(`${s}: ${said[s]} / ${x} (${w.word})`);
    said[s] ??= x;
  });
  return { said, clashes: [...clashes] };
}
