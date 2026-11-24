// Every passage, with its id and its questions. What Came Next's questions are made here from its lines (they are always the same three:
// the whole order, what happened first, what happened last); every other kind writes its own.
import { ASK } from './ask';
import { FACT } from './fact';
import { INFER } from './infer';
import { MAIN } from './main';
import { ORDER } from './order';
import type { Draft, Kind, Level, Passage, Question } from './types';

export * from './types';

export const ORDER_ASK = { pics: 'Tap the pictures in the order they happened.', lines: 'Tap the sentences in the order they happened.' } as const;
export const FIRST_ASK = 'What happened first?';
export const LAST_ASK = 'What happened last?';
export const ORDER_SEP = '|';

function orderQuestions(p: Draft): Question[] {
  const n = p.lines.length, all = Array.from({ length: n }, (_, i) => i), last = n - 1;
  const at = (i: number) => (p.pics ? p.pics[i]! : String(i));
  const form = p.pics ? 'pic' : 'line';
  return [
    { ask: p.pics ? ORDER_ASK.pics : ORDER_ASK.lines, form: 'order', right: all.join(ORDER_SEP), wrong: [], at: all },
    { ask: FIRST_ASK, form, right: at(0), wrong: all.slice(1).map(at), at: [0] },
    { ask: LAST_ASK, form, right: at(last), wrong: all.slice(0, last).map(at), at: [last] },
  ];
}

function withIds(drafts: readonly Draft[]): Passage[] {
  const seen: Record<string, number> = {};
  return drafts.map(d => {
    const key = `${d.kind}${d.level}`;
    seen[key] = (seen[key] ?? 0) + 1;
    return { ...d, id: `${key}-${String(seen[key]).padStart(2, '0')}`, qs: d.kind === 'order' ? orderQuestions(d) : d.qs };
  });
}

export const PASSAGES: readonly Passage[] = withIds([...ASK, ...ORDER, ...MAIN, ...INFER, ...FACT]);
const BY_ID = new Map(PASSAGES.map(p => [p.id, p]));
export const passageById = (id: string): Passage | undefined => BY_ID.get(id);
export const passagesOf = (kind: Kind, level: Level) => PASSAGES.filter(p => p.kind === kind && p.level === level);
