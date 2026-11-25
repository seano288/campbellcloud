// The sentences: about dragons, eggs, the roost, a king and his friends. Plain data, no game code. Each is recorded whole, and every word
// in it is one he can read (words.test.ts). Each word's job in the sentence is recorded: most come from the lexicon or the little-word
// table below, and a word with two jobs is marked where it stands ("The dragon can fly:v."), so its job here is plain.
//
// What each sentence can be asked for is worked out from its jobs, so a sentence can't be put in the wrong place:
// - Tap the noun (Nouns, Level 2): exactly one noun (a name counts: Sam is a noun). I, it and we are not nouns.
// - Tap the verb (Verbs, Level 2): exactly one doing word, and no helper (is, are, can, will), so "can fly" never asks which one.
// - Tap the adjective (Adjectives, Level 2): exactly one describing word, and no a, the, my, two or this: some classes count those as
//   describing words too (TEKS 2.11D(iv) counts the articles), so a sentence with one would have two fair answers.
// - Big Letters: a name, a day, a month or a place that is not the first word (the first word is always right already: Sentence
//   Express owns the capital at the start). Level 1: one name; Level 2: one day or month; Level 3: two of them, one a place.

import { DAYS, MONTHS, NAMES, PAST_WORDS, PLACES } from './allowed';
import { lex } from './lexicon';

/** A word's job in a sentence. n noun, N a name, D a day, M a month, P a place (the last four are nouns too), v doing word, h helper,
 *  a describing word, d a/the/my/two (a determiner), r I/it/we (a pronoun), p on/in/to, c and/but, x the rest (not, so, then). */
export type Role = 'n' | 'N' | 'D' | 'M' | 'P' | 'v' | 'h' | 'a' | 'd' | 'r' | 'p' | 'c' | 'x';
export const PROPER: readonly Role[] = ['N', 'D', 'M', 'P'];
export const isNoun = (r: Role) => r === 'n' || PROPER.includes(r);

const LITTLE: Readonly<Record<string, Role>> = {
  a: 'd', the: 'd', my: 'd', your: 'd', his: 'd', our: 'd', this: 'd', some: 'd', all: 'd', one: 'd', two: 'd', three: 'd', five: 'd', nine: 'd', ten: 'd',
  i: 'r', me: 'r', he: 'r', she: 'r', it: 'r', we: 'r', they: 'r', him: 'r', them: 'r', you: 'r',
  is: 'h', are: 'h', was: 'h', am: 'h', can: 'h', will: 'h', could: 'h', did: 'h', do: 'h',
  on: 'p', in: 'p', up: 'p', down: 'p', to: 'p', into: 'p', by: 'p', with: 'p', from: 'p', under: 'p', at: 'p', of: 'p', for: 'p', after: 'p',
  and: 'c', but: 'c',
  not: 'x', now: 'x', then: 'x', here: 'x', there: 'x', so: 'x', yes: 'x', no: 'x', please: 'x', away: 'x', home: 'x', yesterday: 'x', tomorrow: 'x', when: 'x', what: 'x', where: 'x', who: 'x',
  // doing words that are never names of things, in the forms the sentences use
  ran: 'v', saw: 'v', went: 'v', said: 'v', had: 'v', has: 'v', flew: 'v', flies: 'v', likes: 'v', sees: 'v', eats: 'v', named: 'v', met: 'v',
  // names of things the lexicon keeps out of the choices
  teeth: 'n', bubble: 'n', cakes: 'n', tails: 'n', wings: 'n', eggs: 'n', dragons: 'n', beds: 'n', rocks: 'n', nests: 'n',
};

/** The bare word a form comes from: dragons → dragon, hugs → hug, hugged → hug, digs → dig. */
export function baseOf(w: string): string[] {
  const out = [w];
  const add = (x: string) => { if (x.length > 1) out.push(x); };
  if (w.endsWith('ies')) add(`${w.slice(0, -3)}y`);
  if (w.endsWith('es')) add(w.slice(0, -2));
  if (w.endsWith('s')) add(w.slice(0, -1));
  if (w.endsWith('ed')) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (w.at(-3) === w.at(-4)) add(w.slice(0, -3)); }
  if (w.endsWith('ing')) { add(w.slice(0, -3)); add(`${w.slice(0, -3)}e`); if (w.at(-4) === w.at(-5)) add(w.slice(0, -4)); }
  return out;
}

/** The jobs a word could have, unmarked. More than one means it must be marked where it stands. */
export function rolesOf(word: string): Role[] {
  if ((NAMES as readonly string[]).includes(word)) return ['N'];
  if ((DAYS as readonly string[]).includes(word)) return ['D'];
  if ((MONTHS as readonly string[]).includes(word)) return ['M'];
  if ((PLACES as readonly string[]).includes(word)) return ['P'];
  const w = word.toLowerCase();
  if (LITTLE[w]) return [LITTLE[w]];
  if ((PAST_WORDS as readonly string[]).includes(w)) return ['v'];
  for (const b of baseOf(w)) {
    const l = lex(b);
    if (!l) continue;
    const roles = l.jobs.map(j => (j === 'noun' ? 'n' : j === 'verb' ? 'v' : 'a') as Role);
    // a plural -s on a describing word or an -ed on a naming word isn't a form of it
    const inflected = b !== w;
    return inflected ? roles.filter(r => r !== 'a') : roles;
  }
  return [];
}

export interface Word { readonly text: string; readonly role: Role }
export interface Sentence { readonly text: string; readonly words: readonly Word[]; readonly end: '.' | '!' | '?' }

/** "The dragon can fly:v." → its words, each with its job. A word that can't be read here is given role x and fails the tests. */
export function parse(spec: string): Sentence {
  const end = (/[.!?]$/.exec(spec)?.[0] ?? '.') as Sentence['end'];
  const body = spec.replace(/[.!?]$/, '');
  const words = body.split(' ').map((tok): Word => {
    const [text, mark] = tok.split(':') as [string, string | undefined];
    const role = (mark as Role | undefined) ?? (rolesOf(text).length === 1 ? rolesOf(text)[0]! : 'x');
    return { text, role };
  });
  return { text: `${words.map(w => w.text).join(' ')}${end}`, words, end };
}

const S = (spec: string) => spec;

/** Thirty written first and read against the rules before the rest (the brief's second risk); then the rest. */
export const SPECS = [
  // ---------- one noun ----------
  S('The dragon can fly:v.'), S('It is a big egg.'), S('We see the roost:n.'), S('Look:v at my wing!'), S('I like the green:a egg.'),
  S('The egg is so big!'), S('Can you see the flame:n?'), S('We fly:v to the roost:n.'), S('She can ride:v the dragon.'), S('He hid in the cave:n.'),
  S('Look:v at the funny dragon!'), S('They like the cake.'), S('I want:v a dragon.'), S('The dragon is happy.'), S('We can play:v on the hill.'),
  S('Is it a dragon?'), S('It sat on my bed.'), S('Come and see the eggs!'), S('He can roar:v at the sky:n.'), S('You can ride:v my dragon.'),
  S('The king is happy.'), S('I can see a star:n.'), S('She went up the hill.'), S('We sat in the jungle.'), S('It is a big storm:n!'),
  S('They swam in the pond.'), S('He made a kite.'), S('My dragon is so funny.'), S('We can glide:v down to the lake.'), S('It ate the cake.'),
  // ---------- one doing word, no helper ----------
  S('The dragon sat on the hill.'), S('Sam hugs:v the dragon.'), S('The dragon digs in the mud:n.'), S('The egg sits in the nest:n.'), S('We ride:v the big dragon.'),
  S('The dragon spins:v in the sky:n.'), S('My dragon sleeps:v in the cave:n.'), S('The king rides:v a dragon.'), S('The dragon blows:v a big bubble.'), S('The dragon flew to the roost:n.'),
  S('I ate a big muffin.'), S('The girl found the egg.'), S('We swam in the lake.'), S('Dragons roar:v at the storm:n.'), S('The baby grabs the wing.'),
  S('My dragon eats cake.'), S('We dig:v in the mud:n.'), S('The dragon dives:v into the lake.'), S('Pip sat on the egg.'), S('The kitten hid in the basket.'),
  S('Max rode the dragon.'), S('The dragon loops:v up to the sky:n.'), S('They glide:v down the hill.'), S('The eggs hatched:v in the nest:n.'), S('Two dragons flap:v up the hill.'),
  S('The dragon grew so big!'), S('I see a red:a dragon.'), S('We sat by the flame:n.'), S('The dragon came to my farm:n.'), S('Ben told the king.'),
  // ---------- one describing word, no a, the, my or two ----------
  S('Dragons have sharp teeth.'), S('Pip has green:a wings.'), S('Sam likes funny dragons.'), S('Eggs sit in soft nests.'), S('I see tiny eggs.'),
  S('Dragons like big cakes.'), S('We ride:v big dragons.'), S('Kim has red:a eggs.'), S('Dragons are silly.'), S('It is muddy.'),
  S('Max sees happy dragons.'), S('Dragons have long wings.'), S('Ben is careful.'), S('I like jolly dragons.'), S('Pip is so smart.'),
  S('We have fantastic dragons!'), S('Kim makes yellow:a cakes.'), S('Dragons hop:v on thick rocks.'), S('It is sunny.'), S('Tom is unhappy.'),
  S('Dragons like soft beds.'), S('You are helpful.'), S('Sam rides:v purple:a dragons.'), S('They are clever.'), S('Eggs are little.'),
  S('We see black:a eggs.'),
  // ---------- a name to fix ----------
  S('I hug:v Sam.'), S('My dragon is named Pip.'), S('The king and Ben ride:v the dragon.'), S('We play:v with Dot.'), S('The dragon sat by Max.'),
  S('This egg is for Kim.'), S('Come and see Tom!'), S('The dragon likes Jill.'), S('Can you see Pip?'), S('I ride:v with Sam.'),
  S('The dragon came to see Ben.'), S('Here is Dot!'), S('We went with Kim.'), S('The king told Max.'), S('Then Pip flew away.'), S('It is Jill!'),
  // ---------- a day or a month to fix ----------
  S('We fly:v on Monday.'), S('We swim:v in July.'), S('The egg came on Friday.'), S('It is Sunday.'), S('Dragons sleep:v in January.'),
  S('I ride:v on Saturday.'), S('The eggs hatch:v in May.'), S('We sleep:v in December.'), S('We visit:v the roost:n on Tuesday.'), S('My dragon grew in June.'),
  S('It snows:v in February.'), S('We play:v on Wednesday.'), S('The king came on Thursday.'), S('We plant:v in April.'), S('It is sunny in August.'),
  S('The dragon flew home in October.'), S('We have cake in March.'), S('Pip sleeps:v in November.'), S('Eggs hatch:v in September.'),
  // ---------- two to fix, one of them a place ----------
  S('Sam and Tom fly:v to Spain.'), S('We fly:v to Rome on Friday.'), S('Max went to Texas in June.'), S('Pip flew to Paris with Ben.'), S('We swim:v in Japan in July.'),
  S('Kim and Dot went to London.'), S('On Monday we fly:v to Peru.'), S('The king went to China with Jill.'), S('In May we visit:v Spain.'), S('My dragon and Tom went to Rome.'),
  S('Ben rode to Texas on Sunday.'), S('We went to Paris in April.'), S('Sam can fly:v to Japan with Pip.'), S('Jill and Max went to Peru.'), S('In June Dot went to China.'),
] as const;

export type SentenceText = string;
export const SENTENCES: readonly Sentence[] = SPECS.map(parse);

// ---------- what each sentence can be asked for ----------

const count = (s: Sentence, f: (r: Role) => boolean) => s.words.filter(w => f(w.role)).length;
export const forNoun = (s: Sentence) => count(s, isNoun) === 1;
export const forVerb = (s: Sentence) => count(s, r => r === 'v') === 1 && count(s, r => r === 'h') === 0;
export const forAdj = (s: Sentence) => count(s, r => r === 'a') === 1 && count(s, r => r === 'd') === 0;
/** The words a Big Letters question lowercases: every name, day, month and place but the first word. */
export const toFix = (s: Sentence) => s.words.map((w, i) => (i > 0 && PROPER.includes(w.role) ? i : -1)).filter(i => i >= 0);
export const forCapital = (s: Sentence, level: 1 | 2 | 3): boolean => {
  const fix = toFix(s), roles = fix.map(i => s.words[i]!.role);
  if (level === 1) return fix.length === 1 && roles[0] === 'N';
  if (level === 2) return fix.length === 1 && (roles[0] === 'D' || roles[0] === 'M');
  return fix.length === 2 && roles.includes('P');
};
