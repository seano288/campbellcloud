// What is said when a question appears: the lines the views say (views.tsx), here as plain data so the tests can check them. Read It
// never says its word before he answers; Split It at Level 3 always says the word slowly, a syllable at a time with a pause between.
import type { Phrase } from '../phrases';
import { syl } from '../phrases';
import type { Question } from './problems';

export type Asked = { kind: 'lines'; lines: Phrase[] } | { kind: 'slow'; before: Phrase[]; syls: Phrase[]; after: Phrase[] };
const word = (w: string) => w as Phrase;

export function askedFor(q: Question): Asked {
  const lines = (...xs: Phrase[]): Asked => ({ kind: 'lines', lines: xs });
  switch (q.kind) {
    case 'count': return q.show === 'read' ? lines('Read the word. How many beats?') : lines('Listen.', word(q.word), 'How many beats? Tap that many containers.');
    case 'build': return lines('Load the ship!', word(q.word), 'Tap the containers in order.');
    case 'split': return q.slow ? { kind: 'slow', before: ['Listen to the beats.'], syls: q.syls.map(s => syl(s)), after: ['Where does it split? Tap between the letters.'] } : lines('Where does it split? Tap between the letters.');
    case 'read': return lines('Read the word. Tap its picture.');
    case 'r':
      if (q.form === 'gap') return lines('Listen.', word(q.word), 'Which bossy r goes in the gap?');
      if (q.form === 'read') return lines('Read the word. Tap its picture.');
      return lines('Load the ship!', word(q.word), 'Tap the containers in order.');
    case 'addon': {
      const a = q.add, front = a.add === 'un' || a.add === 're';
      if (q.form === 'pic') return lines(front ? syl(a.add) : word(a.base), front ? word(a.base) : syl(a.add), 'Which picture shows', word(a.word));
      if (q.form === 'means') return lines('Which word means', a.means as Phrase);
      if (q.form === 'hide') return lines('Which word is hiding in', word(a.word));
      return lines('Read it. Then tap the one it tells you.');
    }
  }
}
/** Every clip a question's asking says (the tests check each one is recorded). */
export const askedClips = (a: Asked): Phrase[] => (a.kind === 'lines' ? a.lines : [...a.before, ...a.syls, ...a.after]);
