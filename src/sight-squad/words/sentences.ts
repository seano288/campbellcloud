// Short sentences made only of sight words and a few picture words (dog, cat, tank...). Sentence Hunt and Fill the Gap use
// one only once he has met every sight word in it; meeting a new word reads him the shortest one that has it. The word in
// *stars* is the one Fill the Gap leaves out (and it's said "blank" in that recording). Each sentence is recorded whole.
import { isNoun, isWord, WORDS, type AnyWord, type Word } from './list';

const TEXTS = [
  '*I* see a dog.', 'I see *a* cat.', 'I *see* the sun.', 'I *go* up.', 'Go *up*!', 'I see the dog.', 'I see a big dog.',
  'I see *the* bus.', 'I *can* run.', 'Dad can *run*.', 'I see *my* hat.', '*Look* up!', 'Look at *my* cat.', 'I can see you.',
  'I can go up.', 'Run, dog, run!', 'My dog can run.', 'Look at the tank.', 'The bus can go.', 'I see the cat jump.',
  'The dog *is* big.', '*We* can go.', 'I can *jump*.', 'Go *down*!', 'The cat *and* the dog.', 'We can jump up.',
  '*It* is a bus.', 'I see *you*.', 'Look at *me*!', 'We can *play*.', '*Come* and see!', 'Come and play!', 'You and me.',
  'It is my ball.', 'Can you see me?', 'I go *to* the bus.', 'The cat is *in* the box.', 'I see a *big* tank.',
  'I see a *little* bug.', 'The cat *said* yes.', 'Jump in the box!', 'The tank is big.', 'Look at the little duck.',
  '*Here* is my hat.', 'It is *not* a cat.', '*Stop* the bus!', 'Can you *help* me?', '*Yes*, I can.', 'Stop and look.',
  '*He* can run.', 'I *like* the sun.', 'We *are* big.', 'The hat is *on* the cat.', 'We can *all* play.', 'He said no.',
  'The frog can jump.', 'I like to play.', 'We like the sun.',
  'It *was* a dog.', 'Look *at* the sun.', '*They* can jump.', 'I *have* a ball.', 'It is a *good* dog.', 'They are big.',
  '*What* is it?', 'I *do* like it.', '*This* is my cup.', '*Get* the ball!', '*No*, it is not.', 'Get in the car!',
  'Do you like cake?', 'What a big hat!',
  '*She* can play.', 'It is *so* big.', 'It is little *but* good.', 'Go *into* the box.', 'Play *with* me!', 'She said yes.',
  'I see *one* duck.', 'I have *two* cats.', 'We see *three* frogs.', 'I have a *red* car.', 'I see a *blue* fish.',
  'Is it a red bus?',
  'This is *for* you.', '*Who* is it?', 'I *did* it!', 'We can *eat* cake.', 'Can I *ride* the bus?',
  'I can *make* a cake.', 'Can you *find* my hat?', '*Where* is my dog?', 'The cat ran *away*.', 'It is a *funny* duck.',
  'They are funny.',
  'I like the *yellow* sun.', 'I see a *green* frog.', 'It is a *black* cat.', 'I have a *white* hat.', 'The dog is *brown*.',
  'I like *her* hat.', 'Help *him* up!', 'We play, *then* we eat.', 'The cat is *out*.', 'I *will* help you.',
  '*There* is my dog.', 'He *went* up.', 'Come here *now*!', 'The dog *ran* away.', 'It is *by* the bed.',
  'It is one *of* my cats.', 'I ran *from* the dog.', 'This is *our* tank.', 'Look at *them* go!', 'She *has* a fish.',
  'This is *his* car.', 'I *want* a cake.', '*When* can we go?', '*How* did you do it?', 'Is this *your* hat?',
  'I want *some* cake.', 'I *saw* a big tank.', 'I have a *new* ball.', 'The cat is *under* the bed.', 'Help me, *please*!',
  'She *had* a hat.', 'I *could* see it.', 'We can *walk* to the bus.', 'The bug can *fly*.', 'We play *after* we eat.',
  'Dad *said* stop.', 'The boat is big.','My dog ran to Dad.', 'The sky is blue.',
] as const;

export type SentenceText = Strip<(typeof TEXTS)[number]>;
type Strip<S extends string> = S extends `${infer A}*${infer B}*${infer C}` ? `${A}${B}${C}` : S;

export interface Token {
  /** As shown, with its capital and punctuation: "Yes,". */
  readonly shown: string;
  /** The word itself, as it's listed: "yes" (or "I", or a picture word like "Mom"). */
  readonly word: AnyWord;
}
export interface Sentence {
  readonly text: SentenceText;
  readonly tokens: readonly Token[];
  /** The sight words in it (each once). */
  readonly words: readonly Word[];
  /** The word Fill the Gap leaves out, if it has one. */
  readonly gap: Word | null;
}

/** "yes" from "Yes,": the word as listed (I and the picture words keep their capitals). */
export function wordOf(shown: string): AnyWord {
  const bare = shown.replace(/[^A-Za-z]/g, '');
  if (isWord(bare) || isNoun(bare)) return bare;
  const lower = bare.toLowerCase();
  if (isWord(lower) || isNoun(lower)) return lower;
  throw new Error(`"${shown}" is not a sight word or a picture word`);
}

function parse(raw: string): Sentence {
  const gapMatch = /\*([^*]+)\*/.exec(raw);
  const text = raw.replace(/\*/g, '') as SentenceText;
  const tokens = text.split(' ').map(shown => ({ shown, word: wordOf(shown) }));
  const words = [...new Set(tokens.map(t => t.word).filter(isWord))];
  const gap = gapMatch ? wordOf(gapMatch[1]!) : null;
  if (gap !== null && !isWord(gap)) throw new Error(`The gap in "${raw}" is not a sight word`);
  return { text, tokens, words, gap };
}

export const SENTENCES: readonly Sentence[] = TEXTS.map(parse);

/** "I see blank cat.": the sentence with its gap word said as "blank", for Fill the Gap. */
export type GapText = `${string}blank${string}`;
export function gapText(s: Sentence): GapText {
  const i = s.tokens.findIndex(t => t.word === s.gap);
  return s.tokens.map((t, k) => (k === i ? t.shown.replace(/[A-Za-z]+/, 'blank') : t.shown)).join(' ') as GapText;
}
export const GAP_TEXTS = SENTENCES.filter(s => s.gap).map(gapText);

/** Sentences he can read now: every sight word in it is one he knows. */
export const readable = (known: readonly Word[]) => SENTENCES.filter(s => s.words.every(w => known.includes(w)));

/** The sentence that meets a new word: the shortest that has it, with as many words he knows as can be. */
export function meetSentence(word: Word, known: readonly Word[]): Sentence | null {
  const withIt = SENTENCES.filter(s => s.words.includes(word));
  const unknown = (s: Sentence) => s.words.filter(w => w !== word && !known.includes(w)).length;
  return [...withIt].sort((a, b) => unknown(a) - unknown(b) || a.tokens.length - b.tokens.length)[0] ?? null;
}

/** Every sight word has a sentence of its own to meet it with. */
export const WORDS_WITHOUT_SENTENCES = WORDS.filter(w => !SENTENCES.some(s => s.words.includes(w)));
