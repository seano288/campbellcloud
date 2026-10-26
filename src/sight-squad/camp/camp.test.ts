import { describe, expect, it } from 'vitest';
import { PHRASES } from '../phrases';
import { armySize, boltPrice, chooseFirstColour, freshCamp, goalOf, openVault, proposePurchase, readCamp, type CampState } from './camp';
import { ARMY_MAX, modId, recruit, unitItem, UNIT_IDS, UNITS } from './catalog';

const buy = (state: CampState, item: Parameters<typeof proposePurchase>[1], balance = 999) => {
  const r = proposePurchase(state, item, balance);
  if (r.kind !== 'ready') throw new Error(r.reason);
  return r.state;
};

describe('the Camp', () => {
  it('starts with three Riflemen and no colour picked', () => {
    const c = freshCamp();
    expect(c.army.rifleman).toBe(3);
    expect(armySize(c)).toBe(3);
    expect(c.colour).toBeNull();
    expect(chooseFirstColour(c, 'tan')!.colour).toBe('tan');
    expect(chooseFirstColour(c, 'pink')).toBeNull(); // not a starter colour
  });
  it('recruits one soldier at a time, up to the Squad\'s maximum', () => {
    let c = freshCamp();
    expect(proposePurchase(c, recruit('rifleman'), 1)).toMatchObject({ kind: 'rejected', reason: 'insufficient-funds' });
    c = buy(c, recruit('rifleman'));
    expect(c.army.rifleman).toBe(4);
    c = { ...c, army: { ...c.army, rifleman: UNITS.rifleman.max } };
    expect(proposePurchase(c, recruit('rifleman'), 99)).toMatchObject({ kind: 'rejected', reason: 'full' });
  });
  it('unlocks a Squad with its first soldier, and only then recruits more', () => {
    let c = freshCamp();
    expect(proposePurchase(c, recruit('tank'), 99)).toMatchObject({ kind: 'rejected', reason: 'locked-unit' });
    c = buy(c, unitItem('tank'));
    expect(c.army.tank).toBe(1);
    expect(boltPrice(recruit('tank'))).toBe(UNITS.tank.recruit);
    expect(buy(c, recruit('tank')).army.tank).toBe(2);
  });
  it('aims for the cheapest Squad or Mod, never a Recruit or a Legendary', () => {
    const g = goalOf(freshCamp());
    expect(g === 'helmet:1' || g === 'unit:scout' || g?.endsWith(':1')).toBe(true);
    expect(boltPrice(g!)).toBe(5);
  });
  it('keeps each Legendary in the Password Lock until its top Rung is his', () => {
    let c = freshCamp();
    expect(proposePurchase(c, modId('pack', 4), 999)).toMatchObject({ kind: 'rejected', reason: 'vault' });
    expect(openVault(c, 'pack:4')).toBeNull();
    for (const r of [1, 2, 3] as const) c = buy(c, modId('pack', r));
    c = openVault(c, 'pack:4')!;
    expect(c.gear.pack).toBe(4);
  });
  it('reads a damaged save safely', () => {
    const c = readCamp({ colour: 'pink', army: { rifleman: 999, tank: 2 }, units: ['tank', 'bogus'], gear: { helmet: 3 }, unlocked: ['helmet:1'] });
    expect(c.colour).toBe('green'); // pink was never bought
    expect(c.army.rifleman).toBe(UNITS.rifleman.max);
    expect(c.army.tank).toBe(2);
    expect(c.units).toEqual(['rifleman', 'tank']);
    expect(c.gear.helmet).toBe(0);
    expect(readCamp(null)).toEqual(freshCamp());
  });
  it('has something to say for every army size and every Squad', () => {
    const said = new Set<string>(PHRASES);
    for (let n = 1; n <= ARMY_MAX; n++) expect(said.has(n === 1 ? 'You have 1 soldier!' : `You have ${n} soldiers!`)).toBe(true);
    for (const u of UNIT_IDS) expect(said.has(UNITS[u].name)).toBe(true);
  });
});
