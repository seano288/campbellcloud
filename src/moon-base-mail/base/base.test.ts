// The Moon Base: modules come by Landing and need a free plot; the base grows with land; nothing is ever lost; parts change the lander;
// the garden grows a stage a Round; every fifth Landing brings a special crate.
import { describe, expect, it } from 'vitest';
import { bought, buyable, crewOf, earnLanding, finishGo, freePlots, freshBase, gridSize, harvestOf, missingNeed, move, nextWant, place, planGo, proposePurchase, readBase, roomFor, specOf, stageOf, type BaseState } from './base';
import { LANDER_SPECS } from './catalog';

const buyAll = (b: BaseState, ids: string[]) => ids.reduce((s, id) => bought(s, { kind: 'item', id }), b);
const fly = (b: BaseState) => { const plan = planGo(b); return finishGo({ ...b, landings: Math.max(1, b.landings) }, plan, { soft: 5, close: 3 }); };

describe('modules and plots', () => {
  it('a module he buys comes on the next Landing, and he puts it on a free plot', () => {
    let b = buyAll(freshBase(), ['module:living1']);
    expect(b.pending).toEqual(['module:living1']);
    expect(planGo(b).carrying).toBe('module:living1');
    b = fly(b);
    expect(b.toPlace).toBe('module:living1');
    b = place(b, '0,0');
    expect(b.placed['0,0']).toBe('module:living1');
    expect(crewOf(b).map(c => c.name)).toEqual(['Max']);
  });
  it('the Landing brings the newest module waiting; with none waiting it brings a supply crate', () => {
    let b = buyAll(freshBase(), ['module:mailroom', 'module:cathouse']);
    expect(planGo(b).carrying).toBe('module:cathouse');
    b = fly(b);
    expect(b.pending).toEqual(['module:mailroom']);
    const c = fly(freshBase());
    expect(c.supplies).toBe(1);
  });
  it('a module that was never put down goes down by itself at the next Landing, so nothing waits for ever', () => {
    let b = fly(buyAll(freshBase(), ['module:mailroom', 'module:cathouse']));
    b = fly(b);
    expect(Object.values(b.placed)).toContain('module:cathouse');
    expect(b.toPlace).toBe('module:mailroom');
  });
  it('a module needs a free plot; a Land Patch adds a column, then a row, without end', () => {
    expect(gridSize(0)).toEqual({ cols: 3, rows: 3 });
    expect(gridSize(1)).toEqual({ cols: 4, rows: 3 });
    expect(gridSize(2)).toEqual({ cols: 4, rows: 4 });
    let b = freshBase();
    b = { ...b, placed: Object.fromEntries(freePlots(b).map(k => [k, 'module:mailroom'])) as Record<string, string> };
    b = { ...b, placed: { ...b.placed, '1,1': 'home' } };
    expect(roomFor(b)).toBe(0);
    expect(missingNeed(b, { kind: 'item', id: 'module:cathouse' })).toBe('land');
    expect(nextWant({ ...b, owned: b.owned })).not.toBeNull();
    const more = bought(b, { kind: 'more', id: 'land' });
    expect(roomFor(more)).toBe(3);
  });
  it('moves a module, or swaps two; the home dome stays', () => {
    let b = place(fly(buyAll(freshBase(), ['module:mailroom'])), '0,0');
    b = move(b, '0,0', '2,2');
    expect(b.placed['2,2']).toBe('module:mailroom');
    expect(move(b, '1,1', '0,0').placed['1,1']).toBe('home');
  });
  it('cannot buy what it needs first, what he owns, or what he cannot afford', () => {
    const b = freshBase();
    expect(proposePurchase(b, { kind: 'item', id: 'module:battery' }, 999).kind).toBe('rejected');
    expect(proposePurchase(b, { kind: 'item', id: 'lander:little' }, 999).kind).toBe('rejected');
    expect(proposePurchase(b, { kind: 'item', id: 'module:living1' }, 1).kind).toBe('rejected');
    expect(proposePurchase(b, { kind: 'item', id: 'module:living1' }, 14).kind).toBe('ready');
    expect(buyable(b, { kind: 'more', id: 'module' })).toBe(false); // made modules come after twelve named ones
  });
});

describe('landers, parts, garden, crates', () => {
  it('parts change how the lander flies', () => {
    const b = buyAll({ ...freshBase(), owned: [...freshBase().owned, 'module:workshop'] }, ['part:engine1', 'part:jets1', 'part:legs1']);
    const s = specOf(b), base = LANDER_SPECS.little;
    expect(s.thrust).toBeGreaterThan(base.thrust);
    expect(s.slide).toBeGreaterThan(base.slide);
    expect(s.bounce).toBeLessThan(base.bounce);
  });
  it('the garden grows a stage each Round, then gives a harvest every Round after', () => {
    let b = buyAll({ ...freshBase(), owned: [...freshBase().owned, 'module:greenhouse'] }, ['plant:pepper']);
    expect(stageOf(b, b.planted['plant:pepper']!)).toBe(0);
    for (let i = 0; i < 6; i++) b = earnLanding(b);
    expect(stageOf(b, b.planted['plant:pepper']!)).toBe(4);
    expect(harvestOf(b)).toBe(2);
  });
  it('every fifth Landing brings a special crate he keeps', () => {
    let b = freshBase();
    for (let i = 0; i < 5; i++) b = fly(b);
    expect(b.owned).toContain('special:goldmoon');
  });
  it('a save that reads oddly keeps everything he owns', () => {
    const b = readBase({ owned: ['module:mailroom'], placed: {}, pending: [] });
    expect(b.pending).toEqual(['module:mailroom']);
  });
});
