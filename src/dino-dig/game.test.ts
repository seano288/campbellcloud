// The saved game, the shop, and the economy: what a Round and a Dig pay, what there is to earn, and how fast the Museum fills.
import { describe, expect, it } from 'vitest';
import { boltsFor } from '../round/rules';
import { createStore, type BackingStore } from '../save/storage';
import { dinoSave, earnings, SAVE_KEY, SAVE_VERSION, settleDig } from './game';
import { BONE_IDS, DINO_IDS, DINOS, FOSSILS, SITES, dino } from './museum/dinos';
import {
  bestTool, bonesOf, complete, DIG_GEMS, finishDig, freshMuseum, goalOf, isOwned, lookOf, nextDig, openSites, proposePurchase, readMuseum, readyToWake, toggle, wake, wear,
  type MuseumState,
} from './museum/state';
import { ALL_KEYS, ALL_NAMES, FOR_SALE, item, keyOf, STARTERS, TABLES, TABS, TOOLS, TOTAL_PRICE, type Item } from './shop/shop';
import { PHRASES } from './phrases';

const memory = (): BackingStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, read: k => data.get(k) ?? null, write: (k, v) => { data.set(k, v); } };
};

describe('the save', () => {
  it('round-trips, under its own key, and reads an unknown version or junk as a blank save', () => {
    const fresh = dinoSave.fresh();
    expect(dinoSave.decode(JSON.parse(JSON.stringify(dinoSave.encode(fresh))))).toEqual(fresh);
    expect(SAVE_KEY).toBe('dino-dig-save');
    expect(dinoSave.decode({ version: SAVE_VERSION + 1, balance: 50 })).toEqual(fresh);
    expect(dinoSave.decode('junk')).toEqual(fresh);
  });
  it('keeps a well-played save whole', () => {
    let m: MuseumState = { ...freshMuseum(), owned: [...STARTERS, 'tool:trowel', 'color:red', 'hat:crown', 'gear:turbo'], bones: { compy: 4, raptor: 2 }, alive: ['compy'], pet: 'compy', looks: { compy: { color: 'red', hat: 'crown' } }, digs: 2, done: 5, finds: ['egg'], off: ['turbo'] };
    m = readMuseum(JSON.parse(JSON.stringify(m)));
    const back = dinoSave.decode(JSON.parse(JSON.stringify(dinoSave.encode({ ...dinoSave.fresh(), currency: { balance: 33 }, museum: m }))));
    expect(back.museum).toEqual(m);
    expect(back.currency.balance).toBe(33);
  });
  it('never trusts a save: no more bones than a dinosaur has, nothing alive that isn\'t whole, nothing worn that isn\'t owned', () => {
    const m = readMuseum({ owned: ['nope', 'color:red'], bones: { compy: 99, rex: -3, nope: 2 }, alive: ['compy', 'rex', 'nope'], looks: { compy: { color: 'gold', hat: 'crown', marking: 'spots' } }, pet: 'rex', digs: -1, land: 'candy' });
    expect(m.bones).toEqual({ compy: 4 });
    expect(m.alive).toEqual(['compy']);
    expect(lookOf(m, 'compy')).toMatchObject({ color: 'natural', hat: 'none', marking: 'none' });
    expect(m.pet).toBe('compy');
    expect(m.digs).toBe(0);
    expect(m.land).toBe('forest');
    expect(m.owned).toEqual([...STARTERS, 'color:red']);
  });
  it('is written to storage through the shared store', async () => {
    const backing = memory(), store = createStore({ key: SAVE_KEY, adapter: dinoSave, backing });
    await store.load();
    const c = store.commit(s => ({ ...s, currency: { balance: 7 } }));
    if (c.kind === 'accepted') await c.saved;
    expect(JSON.parse(backing.data.get(SAVE_KEY)!)).toMatchObject({ version: SAVE_VERSION, balance: 7 });
  });
});

describe('the shop', () => {
  it('has about 150 things to earn, many that change how the Dig or the run plays, and no price over 100', () => {
    for (const k of ALL_KEYS) { expect(item(k).price).toBeLessThanOrEqual(100); expect(item(k).price).toBeGreaterThanOrEqual(0); }
    const bought = FOR_SALE.length, earned = DINOS.length + FOSSILS.length + SITES.length - 1;
    expect(bought).toBeGreaterThanOrEqual(100);
    expect(bought + earned).toBeGreaterThanOrEqual(145);
    // the kinds that change play: tools, gadgets, gear and lands
    expect(TABLES.tool.length + TABLES.gadget.length + TABLES.gear.length + TABLES.land.length).toBeGreaterThanOrEqual(30);
    expect(TOTAL_PRICE).toBeGreaterThan(2500);
  });
  it('has the tools at about 10, 30, 60 and 100, each opening a deeper site', () => {
    expect(TOOLS.map(t => t.price)).toEqual([0, 10, 30, 45, 60, 100]);
    expect(TOOLS.map(t => t.tier)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(SITES.map(s => s.tier)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('names every thing in a recorded phrase, once', () => {
    for (const n of ALL_NAMES) expect(PHRASES as readonly string[]).toContain(n);
    for (const t of TABS) { const ids = (TABLES[t] as readonly Item[]).map(i => i.id); expect(new Set(ids).size).toBe(ids.length); }
  });
  it('sells a thing once, for its price, and only when he has the Gems', () => {
    const m = freshMuseum();
    expect(proposePurchase(m, 'tool:trowel', 9)).toMatchObject({ kind: 'rejected', reason: 'short' });
    const p = proposePurchase(m, 'tool:trowel', 10);
    expect(p).toMatchObject({ kind: 'ready', cost: 10 });
    if (p.kind !== 'ready') return;
    expect(proposePurchase(p.state, 'tool:trowel', 99)).toMatchObject({ kind: 'rejected', reason: 'owned' });
    expect(openSites(p.state)).toEqual(['creek', 'gully']);
    expect(bestTool(p.state).id).toBe('trowel');
  });
  it('puts a look on the dinosaur he is dressing, and switches gadgets and gear on and off', () => {
    let m: MuseumState = { ...freshMuseum(), bones: { compy: 4 }, alive: ['compy'], pet: 'compy' };
    const p = proposePurchase(m, 'hat:crown', 50);
    if (p.kind !== 'ready') throw new Error('not sold');
    m = p.state;
    expect(lookOf(m, 'compy').hat).toBe('crown');
    m = wear(m, 'hat:none')!;
    expect(lookOf(m, 'compy').hat).toBe('none');
    expect(wear(m, 'hat:tophat')).toBeNull();
    expect(toggle(m, 'magnet')).toBeNull();
    m = { ...m, owned: [...m.owned, 'gadget:magnet'] };
    expect(toggle(m, 'magnet')!.off).toEqual(['magnet']);
  });
  it('makes the next tool the Goal, then the cheapest thing left', () => {
    expect(goalOf(freshMuseum())).toBe('tool:trowel');
    const all = { ...freshMuseum(), owned: [...STARTERS, ...TOOLS.map(t => keyOf('tool', t.id))] };
    expect(item(goalOf(all)!).price).toBe(Math.min(...FOR_SALE.filter(k => !all.owned.includes(k)).map(k => item(k).price)));
    expect(goalOf({ ...all, goal: 'land:candy' })).toBe('land:candy');
  });
});

describe('the dinosaurs', () => {
  it('are twelve, small to huge, four to six bones each, the skull found last', () => {
    expect(DINOS).toHaveLength(12);
    for (const d of DINOS) {
      expect(d.bones.length).toBeGreaterThanOrEqual(4);
      expect(d.bones.length).toBeLessThanOrEqual(6);
      expect(d.bones.at(-1)).toBe('skull');
      expect(new Set(d.bones).size).toBe(d.bones.length);
      for (const b of d.bones) expect(BONE_IDS).toContain(b);
    }
    expect(DINOS[0].size).toBeLessThan(DINOS.at(-1)!.size);
    expect(dino('compy').name).toBe('Compsognathus');
  });
});

describe('the economy', () => {
  it('pays a Gem for each first-try answer and one for finishing, and two for a Dig', () => {
    expect(earnings({ results: [{ outcome: 'clean' }, { outcome: 'clean' }, { outcome: 'missed' }, { outcome: 'helped' }, { outcome: 'clean' }] } as never)).toBe(boltsFor(['clean', 'clean', 'missed', 'helped', 'clean']));
    expect(boltsFor(['clean', 'clean', 'clean', 'clean', 'clean'])).toBe(6);
    expect(DIG_GEMS).toBe(2);
  });
  it('starts with one free Dig, and a Dig finds one or two bones', () => {
    const m = freshMuseum();
    expect(m.digs).toBe(1);
    expect(nextDig(m).bones).toHaveLength(2);
    expect(nextDig({ ...m, done: 1, bones: { compy: 2 } }).bones).toHaveLength(1);
  });
  it('finishes the first dinosaur within about three Rounds (the free Dig and three more)', () => {
    let m = freshMuseum(), digs = 0;
    while (!complete(m, 'compy')) { m = finishDig({ ...m, digs: 1 }, nextDig(m))!; digs++; }
    expect(digs).toBeLessThanOrEqual(4);
    expect(readyToWake(m)).toEqual(['compy']);
    expect(wake(m, 'compy')!.alive).toEqual(['compy']);
    expect(wake(m, 'raptor')).toBeNull();
  });
  it('fills the whole Museum and finds every fossil, buying each tool when it can, and never strands him', () => {
    let m = freshMuseum(), digs = 0, gems = 0;
    while (DINO_IDS.some(d => !complete(m, d)) && digs < 500) {
      const dig = nextDig(m);
      m = finishDig({ ...m, digs: 1 }, dig)!;
      digs++; gems += 6 + DIG_GEMS;
      const tool = TOOLS.find(t => !isOwned(m, keyOf('tool', t.id)));
      if (tool && gems >= tool.price) { const p = proposePurchase(m, keyOf('tool', tool.id), gems); if (p.kind === 'ready') { m = p.state; gems -= p.cost; } }
    }
    expect(DINO_IDS.every(d => complete(m, d))).toBe(true);
    expect(digs).toBeLessThan(60);
    while (m.finds.length < FOSSILS.length && digs < 500) { m = finishDig({ ...m, digs: 1 }, nextDig(m))!; digs++; }
    expect(m.finds).toHaveLength(FOSSILS.length);
    // with everything found, a Dig is still a Dig
    expect(nextDig(m)).toMatchObject({ dino: null, bones: [], deeper: false });
  });
  it('says when a better tool opens more, rather than giving nothing', () => {
    const m: MuseumState = { ...freshMuseum(), bones: { compy: 4, raptor: 5 } };
    expect(nextDig(m)).toMatchObject({ site: 'creek', dino: null, deeper: true });
  });
  it('digs at the site he picked while it still has bones', () => {
    const m: MuseumState = { ...freshMuseum(), owned: [...STARTERS, 'tool:trowel'], site: 'gully' };
    expect(nextDig(m).site).toBe('gully');
    expect(nextDig({ ...m, site: 'cliffs' }).site).toBe('creek');
  });
  it('uses a Dig and pays its Gems only when it is finished', async () => {
    const backing = memory(), store = createStore({ key: SAVE_KEY, adapter: dinoSave, backing });
    await store.load();
    const dig = nextDig(store.state.peek().museum);
    expect(settleDig(store, dig)).toBe(true);
    expect(store.state.peek().currency.balance).toBe(DIG_GEMS);
    expect(store.state.peek().museum.digs).toBe(0);
    expect(bonesOf(store.state.peek().museum, 'compy')).toBe(2);
    expect(settleDig(store, dig)).toBe(false);
  });
});
