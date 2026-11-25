// What the three kinds of word are called, and every line that says it. The default is what most first-grade classrooms say: noun,
// verb and adjective, each met first with its meaning in a Meeting. If his class says something else ("naming word", "doing word",
// "describing word"), change the words here and re-record (tools/make_voice.py records only the lines that changed): no other file
// says them. Level 1 asks by meaning ("Which word names something?") and needs no change.

export const TERMS = {
  noun: {
    kind: 'Nouns', means: 'A noun names a person, an animal, a place or a thing.', tap: 'Tap the noun.', so: 'So it is a noun.',
    playMore: 'Play more Nouns to open this!', opened: 'You opened Nouns!', star: 'You are a Nouns star!', meet: 'Here is a new kind of word: a noun!',
  },
  verb: {
    kind: 'Verbs', means: 'A verb is a word for something you do.', tap: 'Tap the verb.', so: 'So it is a verb.',
    playMore: 'Play more Verbs to open this!', opened: 'You opened Verbs!', star: 'You are a Verbs star!', meet: 'Here is a new kind of word: a verb!',
  },
  adj: {
    kind: 'Adjectives', means: 'An adjective tells what something is like.', tap: 'Tap the adjective.', so: 'So it is an adjective.',
    playMore: 'Play more Adjectives to open this!', opened: 'You opened Adjectives!', star: 'You are an Adjectives star!', meet: 'Here is a new kind of word: an adjective!',
  },
} as const;
export type TermKind = keyof typeof TERMS;
type Lines<T> = T extends Record<string, infer V> ? V : never;
export type TermPhrase = Lines<(typeof TERMS)[TermKind]>;
export const TERM_PHRASES: readonly TermPhrase[] = (Object.values(TERMS) as (typeof TERMS)[TermKind][]).flatMap(t => Object.values(t)) as TermPhrase[];
