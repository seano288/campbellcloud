import { expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { createPlace } from './place';

const solved = (index: number, outcome: SolvedProblem['outcome'] = 'clean'): SolvedProblem =>
  ({ index, outcome, misses: outcome === 'missed' ? 1 : 0, helped: outcome === 'helped', replay: false });

function backing(initial: string | null = null) {
  let saved = initial;
  return { read: () => saved, write: (_key: string, text: string) => { saved = text; }, get saved() { return saved; } };
}
const settle = () => new Promise(resolve => setTimeout(resolve));
const make = (b: ReturnType<typeof backing>) => createPlace('place-test', ['home', 'garage', 'round'], ['learn', 'count'], b);

it('remembers the screen and the Round in progress across a reload', async () => {
  const b = backing();
  const place = make(b);
  await place.load();
  place.screen('start'); // not remembered
  await settle();
  expect(b.saved).toBeNull();
  place.screen('round');
  place.round({ mode: 'count', results: [solved(1), solved(2, 'missed')] });
  await settle();
  const reloaded = make(b);
  await reloaded.load();
  expect(reloaded.get()).toEqual({ screen: 'round', round: { mode: 'count', results: [solved(1), solved(2, 'missed')] } });
  reloaded.round(null);
  await settle();
  const again = make(b);
  await again.load();
  expect(again.get()).toEqual({ screen: 'round', round: null });
});

it('never keeps a finished Round', async () => {
  const b = backing();
  const place = make(b);
  await place.load();
  place.round({ mode: 'learn', results: [1, 2, 3, 4, 5].map(i => solved(i)) });
  expect(place.get().round).toBeNull();
});

it('reads a damaged or unknown place as nowhere, keeping what is valid', async () => {
  for (const [text, expected] of [
    ['not json', { screen: null, round: null }],
    [JSON.stringify({ screen: 'garage', round: { mode: 'fly', results: [] } }), { screen: 'garage', round: null }],
    [JSON.stringify({ screen: 'body', round: { mode: 'learn', results: [solved(2)] } }), { screen: null, round: null }],
    [JSON.stringify({ screen: 'home', round: { mode: 'learn', results: [{ ...solved(1), outcome: 'great' }] } }), { screen: 'home', round: null }],
    [JSON.stringify({ round: { mode: 'learn', results: [1, 2, 3, 4, 5].map(i => solved(i)) } }), { screen: null, round: null }],
  ] as const) {
    const place = make(backing(text));
    await place.load();
    expect(place.get()).toEqual(expected);
  }
});
