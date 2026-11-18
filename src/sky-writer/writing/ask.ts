// What each question says when it's asked (and again on 🔊). Everything he needs to answer is in it: the letter for the letter kinds,
// the word for Which Way's words (a backwards d in "bed" is drawn as a b, so "beb" can only be answered by knowing the word is "bed").
import { sayLetter, type Phrase } from '../phrases';
import type { Question } from './problems';

export function askLine(q: Question): Phrase[] {
  switch (q.kind) {
    case 'trace': return ['Trace', ...sayLetter(q.ch)];
    case 'write': return ['Write', ...(q.text.length > 1 ? [q.text as Phrase] : sayLetter(q.text))];
    case 'word': return ['Write the word', q.word as Phrase];
    case 'start': return [...sayLetter(q.ch), q.step === 'dot' ? 'Where does it start? Tap the dot!' : q.step === 'way' ? 'Which way does it go first?' : 'Which line comes second? Tap it!'];
    case 'flip': return q.step === 'word' ? [q.word as Phrase, 'One letter is backwards. Tap it!'] : ['Tap', ...sayLetter(q.ch)];
    case 'size': return q.step === 'sort' ? [...sayLetter(q.ch), 'Is it tall, small, or a tail letter?'] : q.step === 'line' ? ['Which one sits on the line the right way?'] : ['One letter floats or sinks. Tap it!'];
  }
}
