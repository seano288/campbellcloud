import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import { freshLearning, MEETINGS, MODE_IDS, ANCHORS, type LearningState, type ModeId } from './learning';
import { build, isRight, mixedSession, pickFact, replayOf, reviewKinds, workingSet, type Asking, type Problem } from './mix';
import { crossingFacts, factsFor, makeQuestion, storyOp, type Level } from './numbers/problems';

const noExplain = async () => {};
const past = (s: LearningState): LearningState => ({ ...s, met: [...MEETINGS], tuneUp: Object.fromEntries(ANCHORS.map(a => [a, { asked: 3, clean: 0, misses: 0 }])) as LearningState['tuneUp'] });
const with_ = (s: LearningState, open: readonly ModeId[], level: Level = 1, starred: readonly ModeId[] = []): LearningState => ({
  ...s, modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: open.includes(m), level: open.includes(m) ? level : 1, starred: starred.includes(m) }])) as LearningState['modes'],
});
const asked = (s: LearningState, rng = seeded(1), n = 5) => {
  const session = mixedSession(() => s, noExplain, rng), out: Problem[] = [];
  for (let i = 0; i < n; i++) out.push(session.makeProblem(rng));
  return out;
};
const kinds = (ps: Problem[]) => ps.map(p => p.mode);

describe('the working set', () => {
  it('holds at most five, the furthest behind first, and leaves stars out', () => {
    const s = with_(freshLearning(), MODE_IDS, 1, ['ten']);
    expect(workingSet(s)).toEqual(['on', 'story', 'facts', 'tens', 'part']);
    expect(reviewKinds(s)).toEqual(['ten']);
    const m = { ...s, modes: { ...s.modes, on: { ...s.modes.on, level: 3 as const } } };
    expect(workingSet(m)).not.toContain('on');
    expect(workingSet(m)).toContain('skip');
  });
  it('uses every kind in the set before it repeats one', () => {
    const s = past(with_(freshLearning(), ['ten', 'on', 'story']));
    for (let seed = 1; seed < 40; seed++) {
      const k = kinds(asked(s, seeded(seed), 3));
      expect(new Set(k).size).toBe(3);
    }
  });
  it('asks a starred kind about once a Round, and never the same kind twice running', () => {
    const s = past(with_(freshLearning(), ['ten', 'on', 'story', 'facts', 'tens'], 2, ['ten']));
    let review = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const k = kinds(asked(s, seeded(seed)));
      review += k.filter(x => x === 'ten').length;
      k.forEach((x, i) => { if (i) expect(x).not.toBe(k[i - 1]); });
    }
    expect(review / 300).toBeGreaterThan(0.8);
    expect(review / 300).toBeLessThan(1.3);
  });
  it('still works when everything is starred', () => {
    const s = past(with_(freshLearning(), ['ten'], 3, ['ten']));
    expect(kinds(asked(s))).toEqual(['ten', 'ten', 'ten', 'ten', 'ten']);
  });
});

describe('questions', () => {
  it('count toward Mastery at his Level, and an easier one right after a miss', () => {
    const s = past(with_(freshLearning(), ['ten', 'on', 'story'], 3));
    const rng = seeded(4), session = mixedSession(() => s, noExplain, rng);
    session.makeProblem(rng);
    session.note('missed');
    const p = session.makeProblem(rng) as Asking;
    expect(p.push).toBe(false);
    expect(p.level).toBeLessThan(3);
  });
  it('meets a picture before the first question that needs it, and only once', () => {
    let s = with_(freshLearning(), ['ten']);
    s = { ...past(s), met: [] };
    const k = asked(s, seeded(2), 3);
    expect(k[0]).toMatchObject({ mode: 'meet', meeting: 'frame' });
    expect(k[1]!.mode).toBe('ten');
    expect(k[2]!.mode).toBe('ten');
  });
  it('balances story operations through a Round', () => {
    const s = past(with_(freshLearning(), ['story'], 2));
    const rng = seeded(8);
    for (let round = 0; round < 40; round++) {
      const ops = { add: 0, sub: 0 }, session = mixedSession(() => s, noExplain, rng);
      for (let i = 0; i < 4; i++) { const p = session.makeProblem(rng) as Asking; if (p.q.kind === 'story') ops[storyOp(p.q.id)]++; }
      expect(Math.abs(ops.add - ops.sub)).toBeLessThanOrEqual(2);
    }
  });
  it('asks the Scoreboard from Bot Stories Level 2, and not below', () => {
    const s = past(with_(freshLearning(), ['story'], 2)), rng = seeded(3);
    let boards = 0;
    for (let i = 0; i < 300; i++) if (build(s, { mode: 'story', level: 2, push: true, stretch: 1 }, rng, undefined, { add: 0, sub: 0 }).kind === 'board') boards++;
    expect(boards).toBeGreaterThan(30);
    for (let i = 0; i < 100; i++) expect(build(s, { mode: 'story', level: 1, push: true, stretch: 2 }, rng, undefined, { add: 0, sub: 0 }).kind).toBe('story');
  });
  it('picks weak facts far more often than strong ones', () => {
    const pool = factsFor(2), [weak, strong] = pool, hits = [0, 0], rng = seeded(6);
    const facts = { strength: { [`${weak![0]}+${weak![1]}`]: 0, [`${strong![0]}+${strong![1]}`]: 5 }, since: 0 };
    for (let i = 0; i < 2000; i++) { const p = pickFact(facts, rng, [weak!, strong!]); hits[p === weak ? 0 : 1]!++; }
    expect(hits[0]!).toBeGreaterThan(hits[1]! * 3);
  });
});

describe('a replayed miss', () => {
  it('keeps the shape, changes the numbers and earns no credit', () => {
    const s = past(with_(freshLearning(), MODE_IDS, 2)), rng = seeded(9);
    for (const mode of MODE_IDS) for (let i = 0; i < 40; i++) {
      const q = makeQuestion(mode, 2, rng, { stretch: 1 });
      const p: Asking = { mode, level: 2, push: true, stretch: 1, q };
      const r = replayOf(s, p, rng);
      expect(r.push).toBe(false);
      expect(r.replay).toBe(true);
      expect(JSON.stringify(r.q)).not.toBe(JSON.stringify(q));
      expect(r.q.kind).toBe(q.kind);
      if (q.input === 'strip' || q.input === 'choices') expect(r.q.answer).not.toBe(q.answer);
    }
  });
  it('drops the probe', () => {
    const q = makeQuestion('ten', 2, seeded(1));
    expect(replayOf(freshLearning(), { mode: 'ten', level: 2, push: false, stretch: 0, q, probe: 'ten' }, seeded(2)).probe).toBeUndefined();
  });
});

describe('Tune-Up', () => {
  it('asks one probe from each anchor in a Round, at the placement Level', () => {
    const s = { ...freshLearning(), met: ['frame', 'path', 'bond', 'rod', 'same', 'signs'] } as LearningState;
    const ps = asked(s) as Asking[];
    expect(ps.map(p => p.probe).sort()).toEqual([...ANCHORS].sort());
    expect(ps.find(p => p.mode === 'ten')!.level).toBe(2);
    expect(ps.find(p => p.mode === 'on')!.level).toBe(1);
    expect(ps.every(p => !p.push)).toBe(true);
  });
  it('fills a stopped row with ordinary questions', () => {
    const f = freshLearning();
    const s = { ...f, met: [...MEETINGS], tuneUp: { ...f.tuneUp, tens: { asked: 1, clean: 0, misses: 2 } } } as LearningState;
    const ps = asked(s, seeded(3)) as Asking[];
    expect(ps.filter(p => p.probe)).toHaveLength(4);
    expect(ps.filter(p => !p.probe)).toHaveLength(1);
  });
  it('does not use early help on a probe', () => {
    const f = freshLearning();
    const s = { ...f, met: [...MEETINGS], modes: { ...f.modes, ten: { ...f.modes.ten, window: ['missed', 'missed', 'missed', 'missed', 'missed'] as const } } } as unknown as LearningState;
    const rng = seeded(1), session = mixedSession(() => s, noExplain, rng);
    session.makeProblem(rng);
    expect(session.needsEarlyHelp()).toBe(false);
  });
});

describe('answers', () => {
  const asking = (q: Asking['q']): Asking => ({ mode: 'scale', level: 1, push: true, stretch: 0, q });
  it('walks Over Ten and Fix It through their steps', () => {
    const rng = seeded(4);
    const over = makeQuestion('over', 2, rng);
    if (over.kind !== 'over' || over.form !== 'fill') throw 0;
    expect(isRight(asking(over), `step:${over.left}`)).toBe('more');
    expect(isRight(asking(over), `step:${over.left + 40}`)).toBe(false);
    for (let i = 0; i < 100; i++) {
      const q = makeQuestion('scale', 1, rng);
      expect(isRight(asking(q), 'pick:not')).toBe(q.answer === 'not' ? 'more' : false);
      expect(isRight(asking(q), 'same')).toBe(q.answer === 'same');
      expect(isRight(asking(q), 'not')).toBe(q.answer === 'not');
    }
  });
});

describe('thirteen kinds', () => {
  const LEVELS: Level[] = [1, 2, 3];
  const round = (s: LearningState, rng: ReturnType<typeof seeded>) => {
    const session = mixedSession(() => s, noExplain, rng), out: Problem[] = [];
    for (let i = 0; i < 12; i++) out.push(session.makeProblem(rng));
    return out;
  };
  it('never asks one kind twice running, however many are starred, and every Round finds a question', () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const rng = seeded(seed), open = MODE_IDS.filter(() => rng() < 0.6), starred = open.filter(() => rng() < 0.4);
      const s = past(with_(freshLearning(), open.length ? open : ['ten'], LEVELS[seed % 3]!, starred));
      const k = kinds(round(s, rng)).filter(m => m !== 'meet');
      expect(k.length).toBeGreaterThan(0);
      if (new Set(open).size > 1) k.forEach((x, i) => { if (i) expect(x, `${open} * ${starred}: ${k}`).not.toBe(k[i - 1]); });
    }
  }, 30_000);
  it('a kind just opened waits for its Meeting and then asks, at every Level', () => {
    for (const mode of ['chart', 'jump', 'measure', 'shape'] as const) for (const level of LEVELS) {
      const s = { ...past(with_(freshLearning(), [mode], level)), met: [] };
      const k = round(s, seeded(level * 7));
      expect(k.some(p => p.mode === mode)).toBe(true);
    }
  });
  it('a replay of each later kind gets new numbers and keeps the answer form working', () => {
    const rng = seeded(11), s = past(with_(freshLearning(), MODE_IDS, 2));
    for (const mode of ['chart', 'jump', 'measure', 'shape'] as const) for (const level of LEVELS) for (let i = 0; i < 200; i++) {
      const q = makeQuestion(mode, level, rng, { stretch: 2 }), r = replayOf(s, { mode, level, push: true, stretch: 2, q }, rng);
      expect(JSON.stringify(r.q)).not.toBe(JSON.stringify(q));
      expect(r.q.kind).toBe(mode);
      expect(r.push).toBe(false);
    }
  }, 30_000);
  it('a replayed Fill is a different outline, even with only two to pick from', () => {
    const rng = seeded(13), s = past(with_(freshLearning(), ['shape'], 3));
    for (let i = 0; i < 400; i++) {
      const q = makeQuestion('shape', 3, rng, { stretch: 0 });
      if (q.kind !== 'shape' || q.form !== 'fill') throw 0;
      const r = replayOf(s, { mode: 'shape', level: 3, push: true, stretch: 0, q }, rng);
      expect(r.q.kind === 'shape' && r.q.form === 'fill' && r.q.fill).not.toBe(q.fill);
    }
  });
  it('counts each right tile as more, and a wrong one as a miss', () => {
    const rng = seeded(2);
    let q = makeQuestion('shape', 1, rng);
    while (q.kind !== 'shape' || q.form !== 'every') q = makeQuestion('shape', 1, rng);
    const p: Asking = { mode: 'shape', level: 1, push: true, stretch: 0, q };
    expect(isRight(p, `tile:${q.targets[0]}`)).toBe('more');
    expect(isRight(p, q.traps[0]!.value)).toBe(false);
    expect(isRight(p, 'all')).toBe(true);
  });
  it('lets the facts that cross ten in once Over Ten reaches Level 2', () => {
    let s = past(with_(freshLearning(), ['facts', 'over'], 3));
    s = { ...s, facts: { strength: Object.fromEntries(factsFor(3).map(([a, b]) => [`${Math.max(a, b)}+${Math.min(a, b)}`, 5])), since: 5 } };
    const rng = seeded(1), crossing = new Set(crossingFacts().map(([a, b]) => a + b * 100));
    let seen = 0;
    for (let i = 0; i < 400; i++) { const q = build(s, { mode: 'facts', level: 3, push: true, stretch: 0 }, rng, undefined, { add: 0, sub: 0 }); if (q.kind === 'facts' && (crossing.has(q.eq.a + q.eq.b * 100) || crossing.has(q.eq.b + q.eq.a * 100))) seen++; }
    expect(seen).toBeGreaterThan(0);
  });
});
