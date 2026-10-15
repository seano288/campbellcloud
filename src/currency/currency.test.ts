import { expect, it } from 'vitest';
import { debit, earn, type CompletedRound } from './currency';
import { moneyEarnings } from '../app/moneyPractice';

const completed: CompletedRound = {
  roundId: 'non-money-round', status: 'completed',
  results: [1, 2, 3, 4, 5].map(index => ({ index, outcome: 'clean', misses: 0, helped: false, replay: false })),
};

it('proposes earnings from completed facts using the supplied policy without changing the balance', () => {
  const state = Object.freeze({ balance: 10 });
  expect(earn(state, completed, round => round.results.filter(r => r.outcome === 'clean').length + 1))
    .toEqual({ kind: 'accepted', state: { balance: 16 }, amount: 6 });
  expect(state).toEqual({ balance: 10 });
});

it.each([{ clean: 5, amount: 6 }, { clean: 2, amount: 3 }, { clean: 0, amount: 1 }])('preserves the app earnings policy with $clean clean results', ({ clean, amount }) => {
  const round: CompletedRound = {
    ...completed, results: completed.results.map((r, i) => ({ ...r, outcome: i < clean ? 'clean' : i % 2 ? 'helped' : 'missed', replay: i === 0 })),
  };
      expect(earn({ balance: 10 }, round, moneyEarnings)).toEqual({ kind: 'accepted', state: { balance: 10 + amount }, amount });
});

it('leaves state untouched if the supplied earnings policy fails', () => {
  const state = Object.freeze({ balance: 10 });
  expect(() => earn(state, completed, () => { throw new Error('policy failed'); })).toThrow('policy failed');
  expect(state).toEqual({ balance: 10 });
  expect(earn({ balance: -1 }, completed, () => { throw new Error('policy must not run'); }))
    .toEqual({ kind: 'rejected', reason: 'invalid-balance' });
});

it('proposes a debit only for a valid affordable amount, including zero', () => {
  const state = Object.freeze({ balance: 16 });
  expect(debit(state, 15)).toEqual({ kind: 'accepted', state: { balance: 1 }, amount: 15 });
  expect(debit(state, 16)).toEqual({ kind: 'accepted', state: { balance: 0 }, amount: 16 });
  expect(debit({ balance: 0 }, 0)).toEqual({ kind: 'accepted', state: { balance: 0 }, amount: 0 });
  expect(debit(state, 17)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
  for (const invalid of [-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '5', null, undefined, true]) {
    expect(debit(state, invalid as number)).toEqual({ kind: 'rejected', reason: 'invalid-amount' });
    expect(debit({ balance: invalid as number }, 0)).toEqual({ kind: 'rejected', reason: 'invalid-balance' });
  }
  expect(state).toEqual({ balance: 16 });
});

it('rejects invalid balances and policy amounts and overflow without replacement state', () => {
  const invalid = [-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '5', null, undefined, true];
  for (const balance of invalid) {
    expect(earn({ balance: balance as number }, completed, () => 1)).toEqual({ kind: 'rejected', reason: 'invalid-balance' });
  }
  for (const amount of invalid) {
    expect(earn({ balance: 10 }, completed, () => amount as number)).toEqual({ kind: 'rejected', reason: 'invalid-amount' });
  }
  expect(earn({ balance: Number.MAX_SAFE_INTEGER }, completed, () => 1)).toEqual({ kind: 'rejected', reason: 'overflow' });
  expect(earn({ balance: 0 }, completed, () => 0)).toEqual({ kind: 'accepted', state: { balance: 0 }, amount: 0 });
  expect(earn({ balance: Number.MAX_SAFE_INTEGER - 1 }, completed, () => 1))
    .toEqual({ kind: 'accepted', state: { balance: Number.MAX_SAFE_INTEGER }, amount: 1 });
});
