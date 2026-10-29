import { expect, it } from 'vitest';
import { AMMO, BOLT, countOf, CURRENCIES, earnedLine, needLine } from './kind';

it('builds each game\'s lines from its own currency, singular for one', () => {
  expect(earnedLine(AMMO, 1)).toBe('You earned 1 Ammo!');
  expect(earnedLine(AMMO, 4)).toBe('You earned 4 Ammo!');
  expect(needLine(BOLT, 1)).toBe('You need 1 more Bolt.');
  expect(needLine(BOLT, 2)).toBe('You need 2 more Bolts.');
  expect(countOf(AMMO, 0)).toBe('0 Ammo');
});

it('gives every currency its own id', () => {
  expect(new Set(CURRENCIES.map(c => c.id)).size).toBe(CURRENCIES.length);
});
