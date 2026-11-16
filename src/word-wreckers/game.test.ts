import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { createPractice, SAVE_KEY, SAVE_VERSION, settleJob, wreckersSave, type WreckersGame } from './game';
import { freshLearning } from './learning';
import { NUMBERS_TO, PHRASES } from './phrases';
import {
  BUILDINGS, DECOS, DRIVERS, FEATURES, HORNS, item, ITEMS, LOTS_PER_STREET, MACHINES, OLD_LINES, PAINTS, PAVERS, ROAD_SLOTS, STREETS, TRAFFIC, TREASURES,
  UPGRADES, ALL_KEYS, type ItemKey,
} from './yard/shop';
import {
  buildTier, finishJob, freeLots, freeRoadSlots, freshYard, goalOf, JOB_BOLTS, lotsOf, maxPower, nextJob, powerOf, proposePurchase, readYard, roadSlotsOf, TOWN_TOTAL,
  type YardState,
} from './yard/yard';

const store = (state: WreckersGame = wreckersSave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: WreckersGame) => WreckersGame | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});
const owning = (keys: readonly ItemKey[], s: YardState = freshYard()): YardState => ({ ...s, owned: [...new Set([...s.owned, ...keys])] });

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('word-wreckers-save'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const yard: YardState = {
      ...owning(['machine:dozer', 'paint:red', 'up:crane:bigball', 'driver:puppy', 'street:park', 'horn:duck', 'traffic:taxi', 'machine:roller']), machine: 'dozer', paints: { dozer: 'red' },
      driver: 'puppy', goal: 'machine:digger', jobs: 2, done: 3, town: [{ b: 'house', gold: false }, { b: 'barn', gold: true }], horn: 'duck', roads: ['carwash', 'loop'], treasures: ['coin', 'crown'],
    };
    const s: WreckersGame = { learning: { ...freshLearning(), patterns: ['cvc'], strength: { cvc: 2 }, sinceMeet: 4 }, currency: { balance: 17 }, yard };
    expect(wreckersSave.decode(JSON.parse(JSON.stringify(wreckersSave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know, with one free Job', () => {
    const d = wreckersSave.decode({ version: 99, balance: 5, yard: { jobs: 9 } });
    expect(d.currency.balance).toBe(0);
    expect(d.yard).toEqual(freshYard());
    expect(freshYard().jobs).toBe(1);
  });
  it('keeps everything in a save from before the bigger rewards: every item, building, Bolt and Job', () => {
    // a save written by the first Word Wreckers (version 1, before horns, road features, treasures and the new rows), with something
    // of every kind he could own then: every machine, upgrade, paint, driver, street and decoration of that build
    const OLD_KEYS = [
      ...['crane', 'skid', 'dozer', 'digger', 'dump', 'tower', 'robot', 'monster', 'mega', 'giant'].map(m => `machine:${m}`),
      ...[['crane', 'bigball'], ['crane', 'boom'], ['crane', 'steelball'], ['crane', 'spiky'], ['skid', 'bucket'], ['skid', 'wheels'], ['dozer', 'wide'], ['dozer', 'tracks'], ['dozer', 'ripper'],
        ['digger', 'bucket'], ['digger', 'arm'], ['digger', 'claw'], ['dump', 'horn'], ['dump', 'bed'], ['dump', 'wheels'], ['tower', 'lights'], ['tower', 'hook'], ['tower', 'mast'],
        ['robot', 'eyes'], ['robot', 'claw'], ['monster', 'rocket'], ['monster', 'teeth'], ['mega', 'chain'], ['mega', 'lightning'], ['giant', 'turbo'], ['giant', 'diamond']].map(([m, u]) => `up:${m}:${u}`),
      ...['yellow', 'orange', 'red', 'blue', 'green', 'lime', 'purple', 'white', 'black', 'brown', 'pink', 'teal', 'silver', 'hazard', 'zebra', 'tiger', 'dots', 'checks', 'camo', 'gold', 'flames', 'stars', 'bolts', 'rainbow'].map(p => `paint:${p}`),
      ...['worker', 'puppy', 'kitty', 'bear', 'monkey', 'penguin', 'lion', 'panda', 'frog', 'alien', 'robot', 'dino', 'unicorn'].map(d => `driver:${d}`),
      ...['main', 'park', 'river', 'hill', 'harbor', 'rocket'].map(st => `street:${st}`),
      ...['trees', 'flowers', 'benches', 'flags', 'mailbox', 'lamps', 'balloons', 'lights', 'kites', 'bus', 'hotdog', 'fountain', 'icecream', 'hoop', 'sailboat', 'playground', 'schoolbus',
        'ambulance', 'firetruck', 'police', 'band', 'tent', 'carousel', 'helicopter', 'train', 'ferris', 'coaster', 'ufo', 'rainbow', 'fireworks'].map(d => `deco:${d}`),
    ];
    expect(OLD_KEYS).toHaveLength(109);
    const OLD_TOWN = ['house', 'lemonade', 'treehouse', 'barn', 'icecream', 'cabin', 'petshop', 'bakery', 'fire', 'police', 'school', 'library', 'toyshop', 'pizza', 'post', 'diner', 'candy',
      'bikeshop', 'hospital', 'museum', 'trainstation', 'watertower', 'lighthouse', 'castle', 'aquarium', 'clocktower', 'movies', 'bridge', 'skyscraper', 'stadium', 'rocketpad', 'airport',
      'tvtower', 'factory', 'hotel', 'space'].map((b, i) => ({ b, gold: i % 3 === 0 }));
    const old = { version: 1, balance: 87, learning: { ...freshLearning(), patterns: ['cvc', 'digraph'], sinceMeet: 2 }, yard: { owned: OLD_KEYS, machine: 'mega', paints: { mega: 'flames', crane: 'rainbow' }, driver: 'unicorn', goal: null, jobs: 4, done: 41, town: OLD_TOWN } };
    const d = wreckersSave.decode(JSON.parse(JSON.stringify(old)));
    expect(d.currency.balance).toBe(87);
    expect(d.yard.jobs).toBe(4);
    expect(d.yard.done).toBe(41);
    expect(new Set(d.yard.owned)).toEqual(new Set([...OLD_KEYS, 'horn:honk'])); // and the free horn
    expect(d.yard.town).toEqual(OLD_TOWN);
    expect(d.yard).toMatchObject({ machine: 'mega', paints: { mega: 'flames', crane: 'rainbow' }, driver: 'unicorn', horn: 'honk', roads: [], treasures: [] });
    expect(d.learning.patterns).toEqual(['cvc', 'digraph']);
    // and saving it again keeps it all
    expect(wreckersSave.decode(JSON.parse(JSON.stringify(wreckersSave.encode(d))))).toEqual(d);
    // every old key is still a thing in the shop, at the price it was
    const OLD_PRICES: Partial<Record<string, number>> = { 'machine:giant': 100, 'up:giant:diamond': 85, 'paint:rainbow': 24, 'driver:unicorn': 95, 'street:rocket': 90, 'deco:fireworks': 100 };
    for (const [k, p] of Object.entries(OLD_PRICES)) expect(item(k as ItemKey).price).toBe(p);
  });
  it('never fits what he does not own, and never has more buildings than lots or features than places on his roads', () => {
    const r = readYard({ owned: [], horn: 'dino', roads: ['carwash', 'loop', 'ramp', 'tunnel', 'mud', 'nope'], treasures: ['coin', 'coin', 'nope'] });
    expect(r.horn).toBe('honk');
    expect(r.roads).toEqual(['carwash', 'loop', 'ramp']);
    expect(r.treasures).toEqual(['coin']);
  });
  it('never fits what he does not own, and never has more buildings than lots', () => {
    const y = readYard({ owned: [], machine: 'giant', paints: { crane: 'gold' }, driver: 'unicorn', town: Array.from({ length: 9 }, (_, i) => ({ b: BUILDINGS[i]!.id })) });
    expect(y.machine).toBe('crane');
    expect(y.paints).toEqual({});
    expect(y.driver).toBe('worker');
    expect(y.town).toHaveLength(LOTS_PER_STREET);
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Job', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    if (started.kind !== 'accepted') throw new Error('no Round');
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 2 ? 'missed' : 'clean', misses: i === 2 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'build', push: true, pattern: 'cvc' });
      results.push(fact);
    }
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.yard.jobs).toBe(freshYard().jobs + 1);
  });
});

describe('what Bolts buy', () => {
  it('keeps every price at or under 100, the most the voice says, and says every name and number', () => {
    for (const k of ALL_KEYS) expect(item(k).price, k).toBeLessThanOrEqual(NUMBERS_TO);
    for (const k of ALL_KEYS) expect(PHRASES as readonly string[]).toContain(item(k).name);
    for (const b of BUILDINGS) expect(PHRASES as readonly string[]).toContain(b.name);
    for (let n = 0; n <= NUMBERS_TO; n++) expect(PHRASES as readonly string[]).toContain(`${n}`);
  });
  it('is a long ladder, two to three times the first one: 258 things for 8,315 Bolts, 72 buildings, 12 road features and 30 treasures', () => {
    // he bought everything in Rover Code within a day; the first Word Wreckers had 109 things (3,359 Bolts) and 36 buildings
    expect(MACHINES).toHaveLength(19);
    expect(UPGRADES).toHaveLength(66);
    for (const m of MACHINES) expect(UPGRADES.filter(u => u.machine === m.id).length, m.id).toBeGreaterThanOrEqual(3);
    expect(PAINTS).toHaveLength(48);
    expect(DRIVERS).toHaveLength(30);
    expect(STREETS).toHaveLength(12);
    expect(DECOS).toHaveLength(54);
    expect(TRAFFIC).toHaveLength(17);
    expect(HORNS).toHaveLength(12);
    expect(ITEMS).toHaveLength(258);
    expect(BUILDINGS).toHaveLength(72);
    expect(FEATURES).toHaveLength(12);
    expect(TREASURES).toHaveLength(30);
    expect(TOWN_TOTAL).toBe(BUILDINGS.length);
    expect(STREETS.length * ROAD_SLOTS).toBeGreaterThanOrEqual(FEATURES.length);
    expect(ITEMS.reduce((s, i) => s + i.price, 0)).toBe(8315);
    for (const tier of [1, 2, 3, 4] as const) expect(BUILDINGS.filter(b => b.tier === tier).length).toBeGreaterThanOrEqual(16);
    expect(new Set(ITEMS.map(i => i.key)).size).toBe(ITEMS.length);
    expect(new Set(BUILDINGS.map(b => b.id)).size).toBe(BUILDINGS.length);
  });
  it('says every new name and line', () => {
    const said = PHRASES as readonly string[];
    for (const f of FEATURES) { expect(said).toContain(f.name); expect(said).toContain(f.line); }
    for (const t of TREASURES) expect(said).toContain(t.name);
    for (const line of Object.values(OLD_LINES).flat()) expect(said).toContain(line);
  });
  it('buys a horn and honks with it, and traffic', () => {
    const b = proposePurchase(freshYard(), 'horn:duck', 20);
    if (b.kind !== 'ready') throw new Error(b.reason);
    expect(b.state.horn).toBe('duck');
    expect(proposePurchase(freshYard(), 'traffic:taxi', 20).kind).toBe('ready');
  });
  it('buys a machine and drives it, an upgrade only once the machine is his, and says no without enough Bolts or twice', () => {
    const b = proposePurchase(freshYard(), 'machine:dozer', 20);
    if (b.kind !== 'ready') throw new Error(b.reason);
    expect(b.cost).toBe(15);
    expect(b.state.machine).toBe('dozer');
    expect(proposePurchase(freshYard(), 'up:dozer:wide', 99)).toEqual({ kind: 'rejected', reason: 'needs-machine' });
    expect(proposePurchase(freshYard(), 'machine:dozer', 14)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(proposePurchase(b.state, 'machine:dozer', 99)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    const p = proposePurchase(b.state, 'paint:red', 9);
    if (p.kind !== 'ready') throw new Error(p.reason);
    expect(p.state.paints.dozer).toBe('red');
  });
  it('raises a machine\'s power with its power upgrades, up to steel', () => {
    expect(powerOf(freshYard(), 'crane')).toBe(1);
    expect(powerOf(owning(['up:crane:bigball', 'up:crane:steelball', 'up:crane:spiky']), 'crane')).toBe(4);
    expect(maxPower(owning(['machine:dozer']))).toBe(2);
    expect(buildTier(owning(['machine:giant']))).toBe(3); // the tallest need the Tower Crane
    expect(buildTier(owning(['machine:giant', 'machine:tower']))).toBe(4);
  });
  it('saves first for what opens a stronger Job, and for the next street when his Town is full', () => {
    const tier1Done = { ...freshYard(), town: BUILDINGS.filter(b => b.tier === 1).slice(0, 6).map(b => ({ b: b.id, gold: false })) };
    expect(goalOf(tier1Done)).toBe('street:park');
    expect(goalOf(owning(['street:park'], tier1Done))).toBe('up:crane:bigball');
  });
});

describe('Jobs and the Town', () => {
  it('only ever offers a Job his machines can do, and buildings he can put up', () => {
    let s = freshYard();
    const order: ItemKey[] = ['machine:dozer', 'up:crane:bigball', 'street:park', 'machine:giant', 'street:river', 'machine:tower', 'street:hill', 'street:farm', 'street:harbor',
      'street:fair', 'street:rocket', 'street:beach', 'street:airport', 'street:snow', 'street:dino'];
    for (let step = 0; step < 150; step++) {
      if (step % 8 === 4 && order.length) s = owning([order.shift()!], s);
      const job = nextJob(s);
      expect(job.tier).toBeLessThanOrEqual(maxPower(s));
      expect(job.choices.length).toBeGreaterThanOrEqual(1);
      expect(job.choices.length).toBeLessThanOrEqual(3);
      for (const c of job.choices) {
        if (c.kind === 'new') { expect(BUILDINGS.find(b => b.id === c.b)!.tier).toBeLessThanOrEqual(buildTier(s)); expect(s.town.some(l => l.b === c.b)).toBe(false); expect(freeLots(s)).toBeGreaterThan(0); }
        if (c.kind === 'gold') { expect(freeLots(s)).toBe(0); expect(s.town.find(l => l.b === c.b)?.gold).toBe(false); }
      }
      const done = finishJob({ ...s, jobs: 1 }, job.choices[0]!);
      expect(done).not.toBeNull();
      s = { ...done!, jobs: 0 };
      expect(s.town.length).toBeLessThanOrEqual(lotsOf(s));
    }
    expect(s.town).toHaveLength(TOWN_TOTAL);
    expect(new Set(s.town.map(l => l.b)).size).toBe(TOWN_TOTAL);
  });
  it('makes one of his buildings gold when there is no empty lot, so a Job always adds something', () => {
    const full = { ...freshYard(), town: BUILDINGS.slice(0, 6).map(b => ({ b: b.id, gold: false })) };
    const job = nextJob(full);
    expect(job.choices.every(c => c.kind === 'gold')).toBe(true);
    expect(finishJob(full, job.choices[0]!)!.town.filter(l => l.gold)).toHaveLength(1);
  });
  it('is used, and pays its Bolts, only when the building is up', () => {
    const s = store();
    expect(settleJob(s, { kind: 'new', b: 'house' })).toBe(true);
    expect(s.state.yard.jobs).toBe(0);
    expect(s.state.yard.town).toEqual([{ b: 'house', gold: false }]);
    expect(s.state.currency.balance).toBe(JOB_BOLTS);
    expect(settleJob(s, { kind: 'new', b: 'barn' })).toBe(false); // no Job left: nothing happens
  });
  it('paves a road with a Road Job: a feature goes on the next place on his roads, or nothing when they are full', () => {
    const s = { ...owning(['machine:roller']), jobs: 5 };
    expect(PAVERS).toEqual(['roller', 'mixer']);
    expect(roadSlotsOf(s)).toBe(ROAD_SLOTS);
    let y: YardState = s;
    for (let i = 0; i < ROAD_SLOTS; i++) {
      const job = nextJob(y);
      expect(job.features.length).toBeGreaterThan(0);
      expect(job.features.some(f => y.roads.includes(f))).toBe(false);
      y = finishJob(y, { kind: 'road', f: job.features[0]! })!;
    }
    expect(y.roads).toHaveLength(ROAD_SLOTS);
    expect(freeRoadSlots(y)).toBe(0);
    expect(nextJob(y).features).toEqual([]);
    const fun = finishJob(y, { kind: 'road', f: null })!;
    expect(fun.roads).toEqual(y.roads);
    expect(fun.done).toBe(y.done + 1);
    expect(fun.town).toEqual(y.town);
    // another street gives three more places
    expect(nextJob(owning(['street:farm'], y)).features.length).toBeGreaterThan(0);
  });
  it('hides a treasure under every other old building, each one once, and keeps it only when the Job is done', () => {
    let s: YardState = { ...freshYard(), jobs: 100 };
    const found: string[] = [];
    for (let i = 0; i < 70; i++) {
      const job = nextJob(s);
      expect(job.treasure !== null).toBe(i % 2 === 1 && found.length < TREASURES.length);
      if (job.treasure) { expect(found).not.toContain(job.treasure); found.push(job.treasure); }
      s = finishJob(s, job.choices[0]!, job.treasure)!;
    }
    expect(s.treasures).toHaveLength(TREASURES.length);
    // leaving halfway keeps nothing: the same treasure is still to find
    const t = { ...freshYard(), done: 1 };
    expect(nextJob(t).treasure).toBe(TREASURES[0]!.id);
  });
  it('pays for a Road Job like any Job, and keeps the treasure found on the way', () => {
    const st = store({ ...wreckersSave.fresh(), yard: { ...owning(['machine:roller']), jobs: 2 } });
    expect(settleJob(st, { kind: 'road', f: 'ramp' })).toBe(true);
    expect(st.state.yard.roads).toEqual(['ramp']);
    expect(st.state.currency.balance).toBe(JOB_BOLTS);
    expect(settleJob(st, { kind: 'new', b: 'house' }, 'gem')).toBe(true);
    expect(st.state.yard.treasures).toEqual(['gem']);
  });
  it('starts with a wooden shed for the free crane, and tier 1 buildings to put up', () => {
    const job = nextJob(freshYard());
    expect(job.tier).toBe(1);
    expect(job.choices.map(c => BUILDINGS.find(b => b.id === c.b)!.tier)).toEqual([1, 1, 1]);
  });
});
