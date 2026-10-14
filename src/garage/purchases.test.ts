import { expect, it } from 'vitest';
import { proposeLegendary, proposePurchase, requestLegendary } from './purchases';
import { chooseBody, fitColour, fitMod, freshGarage, selectGoal, setDoorNumber } from './state';

it('proposes Mod ownership, immediate fit and selected Goal clearing for 15 Bolts', () => {
  const state = freshGarage();
  state.body = 'pickup';
  state.goal = 'tires:2';
  const before = structuredClone(state);
  const proposal = proposePurchase(state, 'tires:2', 16);
  expect(proposal).toMatchObject({
    kind: 'ready', cost: 15,
    state: { body: 'pickup', unlocked: ['tires:2'], fitted: { pickup: { tires: 2 } }, goal: null },
  });
  expect(state).toEqual(before);
});

it('keeps free owned-item actions separate from purchases and preserves each Body fit', () => {
  const state = freshGarage();
  state.unlocked = ['paint:2', 'tires:2'];
  state.colours = ['teal'];
  state.fitted.pickup.doorNumber = 42;
  const before = structuredClone(state);
  const coloured = fitColour(fitMod(state, 'paint', 2), 'teal');
  expect(coloured.fitted.pickup).toMatchObject({ colour: 'teal', paint: 2, doorNumber: 42 });
  const switched = chooseBody(coloured, 'bigfoot');
  expect(switched.body).toBe('bigfoot');
  expect(switched.fitted.pickup).toEqual(coloured.fitted.pickup);
  expect(setDoorNumber(switched, 0).fitted.bigfoot.doorNumber).toBe(0);
  expect(fitMod(state, 'tires', 0).unlocked).toEqual(['paint:2', 'tires:2']);
  expect(fitColour(state, 'red').colours).toEqual(['teal']);
  expect(selectGoal(state, 'horn:3').goal).toBe('horn:3');
  expect(() => fitMod(state, 'horn', 3)).toThrow();
  expect(() => fitColour(state, 'pink')).toThrow();
  expect(() => chooseBody(state, 'jeep')).toThrow();
  expect(() => selectGoal(state, 'tires:2')).toThrow();
  expect(() => setDoorNumber(state, 100)).toThrow();
  expect(state).toEqual(before);
});

it('buys and switches a Body, or applies a Colour with Plain fallback, while keeping other fits', () => {
  const state = freshGarage();
  state.body = 'pickup';
  state.fitted.pickup = { ...state.fitted.pickup, paint: 3, doorNumber: 42 };
  state.fitted.schoolbus = { ...state.fitted.schoolbus, doorNumber: 17 };
  expect(proposePurchase({ ...state, goal: 'body:schoolbus' }, 'body:schoolbus', 35)).toMatchObject({
    kind: 'ready', cost: 30, state: { body: 'schoolbus', ownedBodies: ['pickup', 'bigfoot', 'dragster', 'schoolbus'], goal: null, fitted: state.fitted },
  });
  expect(proposePurchase({ ...state, goal: 'colour:teal' }, 'colour:teal', 5)).toMatchObject({
    kind: 'ready', cost: 3, state: { body: 'pickup', colours: ['teal'], goal: null, fitted: { pickup: { colour: 'teal', paint: 0, doorNumber: 42 }, schoolbus: { doorNumber: 17 } } },
  });
  expect(state.fitted.pickup).toMatchObject({ colour: 'red', paint: 3, doorNumber: 42 });
});

it('requests and proposes a Legendary using explicit pricing context and exact checked practice money', () => {
  const state = freshGarage();
  state.unlocked = ['tires:3'];
  const before = structuredClone(state);
  expect(requestLegendary(state, 'tires:4', 2)).toEqual({ kind: 'ready', item: 'tires:4', cents: 110 });
  expect(proposeLegendary(state, 'tires:4', 2, 110)).toMatchObject({
    kind: 'ready', state: { unlocked: ['tires:3', 'tires:4'], fitted: { pickup: { tires: 4 } } },
  });
  expect(state).toEqual(before);
});

it('rechecks Legendary ownership, prerequisite, captured price and valid payment without partial state', () => {
  const state = freshGarage();
  state.unlocked = ['horn:3'];
  const before = structuredClone(state);
  expect(requestLegendary(freshGarage(), 'horn:4', 1)).toEqual({ kind: 'rejected', reason: 'waiting' });
  expect(proposeLegendary(freshGarage(), 'horn:4', 1, 95)).toEqual({ kind: 'rejected', reason: 'waiting' });
  expect(proposeLegendary({ ...state, unlocked: ['horn:3', 'horn:4'] }, 'horn:4', 1, 95))
    .toEqual({ kind: 'rejected', reason: 'already-owned' });
  for (const paid of [0, 94, 96, 290, 880, -1, 95.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(proposeLegendary(state, 'horn:4', 1, paid)).toEqual({ kind: 'rejected', reason: 'invalid-payment' });
  }
  expect(proposeLegendary(state, 'horn:4', 1, 95).kind).toBe('ready');
  expect(proposeLegendary(state, 'horn:4', 3, 880).kind).toBe('ready');
  expect(requestLegendary(state, 'horn:4', undefined as never)).toEqual({ kind: 'rejected', reason: 'invalid-context' });
  expect(requestLegendary(state, 'horn:4', 4 as never)).toEqual({ kind: 'rejected', reason: 'invalid-context' });
  expect(state).toEqual(before);
});

it('rejects unknown purchase requests rather than proposing an invalid catalogue cost', () => {
  const state = freshGarage();
  for (const item of ['tires:0', 'tires:5', 'missing:1', 'body:pickup', 'colour:red', null, undefined]) {
    expect(proposePurchase(state, item as never, 30)).toEqual({ kind: 'rejected', reason: 'invalid-item' });
  }
  expect(requestLegendary(state, 'tires:2' as never, 1)).toEqual({ kind: 'rejected', reason: 'invalid-item' });
  expect(proposeLegendary(state, 'missing:4' as never, 1, 35)).toEqual({ kind: 'rejected', reason: 'invalid-item' });
});

it('rejects stale affordability, invalid balances, owned items and Legendary Bolt requests without replacement state', () => {
  const state = freshGarage(), before = structuredClone(state);
  expect(proposePurchase(state, 'tires:2', 16).kind).toBe('ready');
  expect(proposePurchase(state, 'tires:2', 14)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
  expect(proposePurchase({ ...state, unlocked: ['tires:2'] }, 'tires:2', 16)).toEqual({ kind: 'rejected', reason: 'already-owned' });
  expect(proposePurchase(state, 'tires:4', 999)).toEqual({ kind: 'rejected', reason: 'cash-required' });
  for (const balance of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(proposePurchase(state, 'tires:2', balance)).toEqual({ kind: 'rejected', reason: 'invalid-balance' });
  }
  expect(state).toEqual(before);
});
