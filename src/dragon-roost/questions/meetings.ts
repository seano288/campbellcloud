// What each Meeting says and shows, step by step: the meaning of the kind's word ("A noun names a person, an animal, a place or a
// thing."), then examples with their pictures, the dragon doing the dragon words, the plural growing, the squeeze. Plain data for the view
// (views.tsx) and the voice test.
import type { Meet } from '../mix';
import { meetLines, MEET_LINES, pairLine, pastLine, wordPhrase } from '../phrases';
import { PLURALS, SQUEEZES } from '../words/frames';
import { TERMS } from '../words/terms';
import type { Show } from './teach';

export interface Beat { readonly say: readonly string[]; readonly show: Show | null }
const pic = (word: string, p: string | null): Show => ({ kind: 'pic', word, pic: p });
/** What each Meeting says and shows, step by step. */
export function meeting(m: Meet['meeting']): Beat[] {
  const head = (lines: readonly string[]) => ({ say: lines, show: null });
  switch (m) {
    case 'noun': return [
      head(meetLines('noun')), { say: ['king'], show: pic('king', '🤴') }, { say: ['dog'], show: pic('dog', '🐕') }, { say: ['hill'], show: pic('hill', '⛰️') },
      { say: ['cake'], show: pic('cake', '🎂') }, { say: [MEET_LINES.dragonWords], show: null },
      ...(['dragon', 'egg', 'wing', 'roost', 'flame'] as const).map(w => ({ say: [w], show: pic(w, ({ dragon: '🐉', egg: '🥚', wing: '🪽', roost: '🏔️', flame: '🔥' })[w]) })),
    ];
    case 'verb': return [head(meetLines('verb')), { say: [MEET_LINES.dragonVerbs], show: null },
      ...(['fly', 'roar', 'glide', 'flap', 'loop', 'dive'] as const).map(w => ({ say: [w], show: { kind: 'dragon', word: w, act: w, look: null } as Show }))];
    case 'adj': return [head(meetLines('adj')), { say: [MEET_LINES.dragonLooks], show: null },
      ...(['big', 'little', 'green', 'happy', 'muddy'] as const).map(w => ({ say: [w], show: { kind: 'dragon', word: w, act: null, look: w } as Show }))];
    case 'plural': return [head(meetLines('plural')),
      ...PLURALS.filter(p => ['mouse', 'foot', 'child', 'sheep'].includes(p.one)).flatMap(p => [
        { say: [], show: { kind: 'plural', one: p.one, many: p.many, pic: p.pic, step: 0 } as Show },
        { say: [...(p.same ? ['Some words stay the same.'] : []), pairLine(p.one, p.many)], show: { kind: 'plural', one: p.one, many: p.many, pic: p.pic, step: 1 } as Show },
      ])];
    case 'past': return [head(meetLines('past')), { say: ['Yesterday means it has happened.'], show: { kind: 'calendar', now: 'jump', then: 'jumped', step: 1, time: 'yesterday' } },
      ...(['run', 'fly', 'eat'] as const).map(now => { const then = ({ run: 'ran', fly: 'flew', eat: 'ate' })[now]; return { say: [pastLine(now, then)], show: { kind: 'calendar', now, then, step: 1, time: 'yesterday' } as Show }; })];
    case 'squeeze': {
      const s = SQUEEZES[0]!;
      return [head(meetLines('squeeze')), { say: [s.from], show: { kind: 'squeeze', from: s.from, word: s.word, gone: s.gone, step: 0 } },
        { say: [], show: { kind: 'squeeze', from: s.from, word: s.word, gone: s.gone, step: 1 } },
        { say: [wordPhrase(s.word), 'The apostrophe goes where the letters came out.'], show: { kind: 'squeeze', from: s.from, word: s.word, gone: s.gone, step: 2 } }];
    }
    case 'capital': return [head(meetLines('capital')),
      ...(['Sam', 'Monday', 'May', 'Spain'] as const).map(w => ({ say: [w, `is a ${({ Sam: 'name', Monday: 'day', May: 'month', Spain: 'place' })[w]}.`], show: { kind: 'capital', word: w, step: 1 } as Show })),
      { say: ['Names start with a big letter.'], show: null }];
  }
}
export const MEET_TITLES = { noun: TERMS.noun.kind, verb: TERMS.verb.kind, adj: TERMS.adj.kind, plural: 'More Than One', past: 'Yesterday', squeeze: 'Squeeze', capital: 'Big Letters' } as const;

