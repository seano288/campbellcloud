import { describe, expect, it } from 'vitest';
import { SAVE_CASES, TODAY, UNSAFE_BALANCE_CASE } from '../../tools/baseline/saves';
import { moneySave } from './save';

describe('money module save adapter', () => {
  it.each([...SAVE_CASES, UNSAFE_BALANCE_CASE])('$id decodes module-owned state and round-trips every supported field', ({ raw, expected }) => {
    const input: unknown = structuredClone(raw);
    const { version: _version, bolts, modes, lastMode, trophies, currentStreak, bestStreak, roundsFinished, daysPlayed, lastDay, ...garage } = expected;
    const state = moneySave.decode(input, TODAY);
    expect(state).toEqual({
      currency: { balance: bolts }, learning: { modes, lastMode }, garage,
      trophies: { earned: trophies, currentStreak, bestStreak, roundsFinished, daysPlayed, lastDay },
    });
    expect(moneySave.encode(state)).toEqual(expected);
    expect(moneySave.decode(moneySave.encode(state), '2026-10-15')).toEqual(state);
    expect(input).toEqual(raw);
  });
});
