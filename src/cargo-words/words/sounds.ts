// What a syllable is made of, read from its letters: its type (the six syllable types of structured-literacy programmes) and the sounds
// it uses. Plain data and rules, no game code. words.test.ts checks every syllable on the table with these.
//
// He has met these in Dino Dig (src/dino-dig/words/list.ts, all six of its Patterns): the short vowels, the digraphs sh ch th wh ck ng
// and doubled ll ss ff, blends, the magic e (a_e i_e o_e u_e), the vowel teams ee ea ai ay oa and ow (as in snow), and the bossy r
// (ar or er ir ur). Three syllable types are new here, and each is met in a short spoken Meeting before the first word that needs it:
// the open syllable (ti-ger: a vowel at the end says its name), the consonant-le syllable (tur-tle) and the y at the end of a long word
// that says ee (hap-py).

export const SYL_TYPES = ['closed', 'vce', 'team', 'r', 'open', 'le', 'y'] as const;
export type SylType = (typeof SYL_TYPES)[number];
/** Met in Dino Dig. */
export const MET_IN_DINO_DIG: readonly SylType[] = ['closed', 'vce', 'team', 'r'];
/** New in Cargo Words: each has a Meeting the first time a question needs it. */
export const NEW_HERE = ['open', 'le', 'y'] as const satisfies readonly SylType[];
export type NewType = (typeof NEW_HERE)[number];

export const TEAMS = ['ee', 'ea', 'ai', 'ay', 'oa', 'ow'] as const;
export const R_VOWELS = ['ar', 'or', 'er', 'ir', 'ur'] as const;
export const DIGRAPHS = ['sh', 'ch', 'th', 'wh', 'ck', 'ng', 'll', 'ss', 'ff'] as const;
const VOWEL = /[aeiou]/;
/** Syllables where a g before e is hard, as he'd say it: ti-ger, tar-get. */
export const HARD_G: readonly string[] = ['ger', 'get'];
/** Consonant letters he has met (x as in box, y only at the start, as in yarn). No q. */
const CONSONANTS = 'bcdfghjklmnprstvwxyz';

/** The type of a syllable, or null when it uses a sound he hasn't met (oo, ou, oi, aw, igh, a soft c ...). `last`: the word's last syllable. */
export function typeOf(syl: string, last: boolean): SylType | null {
  if ([...syl].some(ch => !'abcdefghijklmnoprstuvwxyz'.includes(ch))) return null;
  // a soft c never (ce, ci, cy), and a g before e or i only where it is hard (ti-ger, tar-get)
  if (/c[eiy]/.test(syl)) return null;
  // all and alk (ball, talk) and the long vowels of old, ind, ild and olt are not met
  if (/al[lk]|old$|ind$|ild$|olt$/.test(syl)) return null;
  if (/g[eiy]/.test(syl) && !HARD_G.includes(syl)) return null;
  // ay is a team at the end of a syllable (play)
  if (/ay$/.test(syl) && (syl.match(/[aeiou]/g) ?? []).length === 1) return checkConsonants(syl.slice(0, -2), 'team');
  // consonant-le: at the end of a word, or before the last syllable (bum-ble-bee)
  if (/^[bcdfgkpstz]le$/.test(syl)) return 'le';
  if (last && /^[^aeiouy]+y$/.test(syl) && syl.length >= 2) return 'y';
  const vowels = syl.match(/[aeiou]+/g) ?? [];
  // y anywhere else is a consonant at the start of the syllable only
  if (/.y/.test(syl)) return null;
  if (/^[aeiou][^aeiou]e$|[^aeiou][aeiou][^aeiou]e$/.test(syl) && vowels.length === 2 && !/[aeiou]{2}/.test(syl)) return checkConsonants(syl.replace(/([aeiou])([^aeiou])e$/, '$1$2'), 'vce');
  if (vowels.length !== 1) return null;
  const v = vowels[0]!;
  const at = syl.indexOf(v), after = syl[at + v.length];
  if (v.length === 2) return (TEAMS as readonly string[]).includes(v) ? checkConsonants(syl, 'team') : null;
  if (after === 'r') return (R_VOWELS as readonly string[]).includes(v + 'r') ? checkConsonants(syl, 'r') : null;
  if (after === undefined) return checkConsonants(syl, 'open');
  // ow says o only at the end (snow, bow-l is not on the table)
  if (v === 'o' && after === 'w') return syl.endsWith('ow') ? checkConsonants(syl, 'team') : null;
  return checkConsonants(syl, 'closed');
}

function checkConsonants(syl: string, type: SylType): SylType | null {
  const cons = syl.replace(/[aeiou]/g, '');
  if ([...cons].some(ch => !CONSONANTS.includes(ch))) return null;
  // no "w" after a vowel except in ow
  if (/[aeiu]w/.test(syl)) return null;
  return type;
}

/** Every syllable's type, or null for one that uses a sound he hasn't met. */
export const typesOf = (syls: readonly string[]) => syls.map((s, i) => typeOf(s, i === syls.length - 1));

/** The vowel sound of a bossy-r syllable: ar, or, or the er sound (er, ir, ur all say it). */
export function rSoundOf(syl: string): 'ar' | 'or' | 'er' | null {
  const m = /([aeiou])r/.exec(syl);
  if (!m || typeOf(syl, false) !== 'r') return null;
  return m[1] === 'a' ? 'ar' : m[1] === 'o' ? 'or' : 'er';
}
export const rSpellingOf = (syl: string) => /([aeiou]r)/.exec(syl)?.[1] as (typeof R_VOWELS)[number] | undefined;

/** True for the letters "a e i o u". */
export const isVowel = (ch: string) => VOWEL.test(ch);
