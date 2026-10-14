import { expect, it } from 'vitest';
import { ALL_MODS, BODY_IDS, BOUGHT_COLOURS, isLegendary } from './catalog';
import { becameAffordable, goalOf, hasAffordable, nextLegendary } from './economy';
import { freshGarage } from './state';

it('distinguishes current affordability from a new threshold using one captured Garage state', () => {
  const state = freshGarage(), before = structuredClone(state);
  expect(goalOf(state)).toBe('tires:1');
  expect(hasAffordable(state, 3)).toBe(true);
  expect(hasAffordable(state, 2)).toBe(false);
  expect(becameAffordable(state, 0, 3)).toBe(true);
  expect(becameAffordable(state, 5, 6)).toBe(false);
  expect(becameAffordable(state, 14, 15)).toBe(true);
  expect(becameAffordable(state, 15, 14)).toBe(false);
  expect(becameAffordable(state, 3, 3)).toBe(false);
  expect(state).toEqual(before);
});

it('keeps selected Goals, catalogue tie-breaking, Colour-only fallback and Legendary hints separate', () => {
  const state = freshGarage();
  expect(goalOf({ ...state, goal: 'colour:teal' })).toBe('colour:teal');
  expect(goalOf({ ...state, goal: 'colour:teal', colours: ['teal'] })).toBe('tires:1');
  expect(goalOf({ ...state, goal: 'horn:4' })).toBe('tires:1');
  const modsOwned = { ...state, unlocked: ALL_MODS.filter(m => !isLegendary(m)) };
  expect(goalOf(modsOwned)).toBe('body:firetruck');
  const boltItemsOwned = { ...modsOwned, ownedBodies: [...BODY_IDS], colours: [...BOUGHT_COLOURS] };
  expect(goalOf({ ...boltItemsOwned, colours: ['orange'] })).toBe('colour:yellow');
  expect(goalOf(boltItemsOwned)).toBeNull();
  expect(hasAffordable(boltItemsOwned, 999)).toBe(false);
  expect(becameAffordable(boltItemsOwned, 0, 999)).toBe(false);
  expect(nextLegendary(boltItemsOwned, 2)).toBe('tires');
  expect(nextLegendary({ ...boltItemsOwned, unlocked: [...ALL_MODS] }, 2)).toBeNull();
});

it('does not announce affordability from an invalid before or after balance', () => {
  const state = freshGarage();
  for (const invalid of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(hasAffordable(state, invalid)).toBe(false);
    expect(becameAffordable(state, invalid, 30)).toBe(false);
    expect(becameAffordable(state, 0, invalid)).toBe(false);
  }
});
