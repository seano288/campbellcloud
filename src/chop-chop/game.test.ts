import { describe, expect, it } from 'vitest';
import { ROUND_LENGTH } from '../round/rules';
import { createStore, type BackingStore } from '../save/store';
import { createPractice, chopSave, SAVE_KEY } from './game';

const memory = (): BackingStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, read: k => data.get(k) ?? null, write: (k, v) => { data.set(k, v); } };
};

describe('the Chop Chop save', () => {
  it('round-trips through its own key and version', () => {
    const fresh = chopSave.fresh();
    expect(chopSave.decode(JSON.parse(JSON.stringify(chopSave.encode(fresh))))).toEqual(fresh);
    expect(chopSave.decode({ version: 99, bolts: 50 })).toEqual(fresh);
    expect(SAVE_KEY).not.toBe('mtm2-save');
  });
  it('earns a Bolt per clean answer plus one for finishing, and counts the Round', async () => {
    const backing = memory();
    const store = createStore({ key: SAVE_KEY, adapter: chopSave, backing });
    await store.load();
    const practice = createPractice(store, () => '2026-10-16');
    const started = practice.start();
    expect(started.kind).toBe('accepted');
    if (started.kind !== 'accepted') return;
    const results = Array.from({ length: ROUND_LENGTH }, (_, i) => ({ index: i + 1, outcome: i === 2 ? 'missed' as const : 'clean' as const, misses: i === 2 ? 1 : 0, helped: false, replay: false }));
    for (const r of results) practice.solve(started.roundId, r, { mode: 'fair', push: true });
    const done = practice.terminal({ roundId: started.roundId, status: 'completed', results });
    expect(done).toMatchObject({ kind: 'accepted', earned: 5, beforeBalance: 0, afterBalance: 5 });
    expect(store.state.value.trophies.roundsFinished).toBe(1);
    if (done.kind === 'accepted') await done.saved;
    expect(JSON.parse(backing.data.get(SAVE_KEY)!).bolts).toBe(5);
  });
});
