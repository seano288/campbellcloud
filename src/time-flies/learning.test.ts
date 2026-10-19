import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { seeded } from '../game/rng';
import { DAYS, FACTS, makeQuiz, MONTHS } from './calendar/calendar';
import { digital } from './clock/time';
import { acknowledgeIntro, freshLearning, MODE_IDS, pendingIntro, readLearning, recordSolved, type LearningState, type ModeId } from './learning';
import { mixedSession, pickNext, type Problem } from './mix';

const clean: SolvedProblem = { index: 1, outcome: 'clean', misses: 0, helped: false, replay: false };
const push = (mode: ModeId) => ({ mode, push: true });
const at = (s: LearningState, levels: Partial<Record<ModeId, 1 | 2 | 3>>): LearningState =>
  ({ modes: Object.fromEntries(MODE_IDS.map(m => [m, { ...s.modes[m], opened: true, level: levels[m] ?? 1 }])) as LearningState['modes'] });
const noExplain = async () => {};
const explainers = { find: noExplain, read: noExplain, set: noExplain, quiz: noExplain };

describe('kinds of question', () => {
  it('opens Find the Clock, Days of the Week and Time Facts at first', () => {
    const s = freshLearning();
    expect(MODE_IDS.filter(m => s.modes[m].opened)).toEqual(['find', 'days', 'units']);
  });
  it('raises a Level after 16 clean answers asked at his Level, and opens the next kind at Level 2', () => {
    let s = freshLearning();
    const changes = [];
    for (let i = 0; i < 15; i++) s = recordSolved(s, push('find'), clean).state;
    expect(s.modes.find.level).toBe(1); // 8 of 10 is not enough here
    const r = recordSolved(s, push('find'), clean); s = r.state; changes.push(...r.changes);
    expect(s.modes.find.level).toBe(2);
    expect(s.modes.read.opened).toBe(true);
    expect(s.modes.read.fresh).toBe(true);
    expect(changes).toEqual([{ kind: 'levelUp', mode: 'find', level: 2 }, { kind: 'open', mode: 'read' }]);
    for (let i = 0; i < 16; i++) s = recordSolved(s, push('find'), clean).state;
    expect(s.modes.find.level).toBe(3);
    expect(s.modes.set.opened).toBe(false); // Set the Clock waits on Read the Clock
  });
  it('opens Months of the Year when Days of the Week reaches Level 2', () => {
    let s = freshLearning();
    for (let i = 0; i < 16; i++) s = recordSolved(s, push('days'), clean).state;
    expect(s.modes.months.opened).toBe(true);
    expect(s.modes.days.introPending).toBe(false); // only the clock has a card for its new Level
  });
  it('counts only questions asked at his Level toward Mastery', () => {
    let s = at(freshLearning(), { find: 2 });
    for (let i = 0; i < 30; i++) s = recordSolved(s, { mode: 'find', push: false }, clean).state;
    expect(s.modes.find).toMatchObject({ level: 2, window: [] });
  });
  it('needs 16 of the last 20, so a few misses only slow him down', () => {
    let s = freshLearning();
    const missed: SolvedProblem = { ...clean, outcome: 'missed' };
    for (let i = 0; i < 4; i++) s = recordSolved(s, push('find'), missed).state;
    for (let i = 0; i < 15; i++) s = recordSolved(s, push('find'), clean).state;
    expect(s.modes.find.level).toBe(1);
    s = recordSolved(s, push('find'), clean).state;
    expect(s.modes.find.level).toBe(2);
  });
  it('introduces the clock’s new times once, at the highest Level pending', () => {
    let s = freshLearning();
    expect(pendingIntro(s)).toBe(1);
    for (let i = 0; i < 16; i++) s = recordSolved(s, push('find'), clean).state;
    expect(pendingIntro(s)).toBe(2);
    expect(pendingIntro(acknowledgeIntro(s))).toBe(1);
  });
  it('reads a damaged or older save, keeping what is valid and adding the new kinds', () => {
    expect(readLearning(null)).toEqual(freshLearning());
    const s = readLearning({ modes: { read: { level: 3, opened: true, window: ['clean', 'nonsense'] } }, lastMode: 'read' });
    expect(s.modes.read).toMatchObject({ level: 3, opened: true, window: ['clean'] });
    expect(s.modes.days).toMatchObject({ level: 1, opened: true });
  });
});

describe('the mix', () => {
  it('only asks kinds he has opened, never the same kind twice in a row', () => {
    const rng = seeded(1), s = freshLearning();
    let last: ModeId | undefined;
    for (let i = 0; i < 200; i++) {
      const next = pickNext(s, rng, last && { mode: last, missed: false });
      expect(['find', 'days', 'units']).toContain(next.mode);
      expect(next.mode).not.toBe(last);
      last = next.mode;
    }
  });
  it('mostly pushes at his Level, with some easier ones mixed in', () => {
    const rng = seeded(2), s = at(freshLearning(), { find: 3, read: 3, set: 3, days: 3, months: 3, units: 3 });
    const picks = Array.from({ length: 600 }, () => pickNext(s, rng));
    const easy = picks.filter(p => !p.push);
    expect(easy.length / picks.length).toBeGreaterThan(0.25);
    expect(easy.length / picks.length).toBeLessThan(0.42);
    expect(easy.every(p => p.level < 3)).toBe(true);
    expect(picks.filter(p => p.push).every(p => p.level === 3)).toBe(true);
  });
  it('follows a miss with an easier question', () => {
    const rng = seeded(3), s = at(freshLearning(), { find: 2, read: 2, set: 2, days: 2, months: 2, units: 2 });
    for (let i = 0; i < 50; i++) expect(pickNext(s, rng, { mode: 'find', missed: true })).toMatchObject({ push: false, level: 1 });
  });
  it('at Level 1 everything counts', () => {
    const rng = seeded(4);
    for (let i = 0; i < 50; i++) expect(pickNext(freshLearning(), rng)).toMatchObject({ push: true, level: 1 });
  });
  it('checks answers of every kind', () => {
    const s = at(freshLearning(), { find: 2, read: 2, set: 2, days: 2, months: 2, units: 2 });
    const session = mixedSession(() => s, explainers), rng = seeded(5);
    const seen = new Set<ModeId>();
    for (let i = 0; i < 80; i++) {
      const p: Problem = session.makeProblem(rng);
      seen.add(p.mode);
      const right = 'quiz' in p ? p.quiz.answer : digital('set' in p ? p.set.target : p.choice.target);
      const wrong = 'quiz' in p ? p.quiz.choices.find(c => c !== right)! : 'set' in p ? digital(p.set.start) : digital(p.choice.choices.find(c => digital(c) !== right)!);
      expect(session.check(p, right).kind).toBe('correct');
      expect(session.check(p, wrong).kind).toBe('incorrect');
      expect(session.check(p, '').kind).toBe('not-an-answer');
      session.note('clean');
    }
    expect([...seen].sort()).toEqual([...MODE_IDS].sort());
  });
});

describe('calendar questions', () => {
  it('asks tomorrow, then yesterday, then two days on, round the week', () => {
    const rng = seeded(6);
    for (let i = 0; i < 40; i++) {
      const p = makeQuiz('days', 1, rng), today = DAYS.find(d => p.ask.includes(d))!;
      expect(p.answer).toBe(DAYS[(DAYS.indexOf(today) + 1) % 7]);
      const q = makeQuiz('days', 2, rng), t2 = DAYS.find(d => q.ask.includes(d))!;
      expect(q.answer).toBe(DAYS[(DAYS.indexOf(t2) + 6) % 7]);
      const r = makeQuiz('days', 3, rng), t3 = DAYS.find(d => r.ask.includes(d))!;
      expect(r.answer).toBe(DAYS[(DAYS.indexOf(t3) + 2) % 7]);
    }
  });
  it('asks the month after, the month before, then the month by its place in the year', () => {
    const rng = seeded(7);
    for (let i = 0; i < 40; i++) {
      const p = makeQuiz('months', 1, rng), m = MONTHS.find(x => p.ask.includes(x))!;
      expect(p.answer).toBe(MONTHS[(MONTHS.indexOf(m) + 1) % 12]);
      const q = makeQuiz('months', 2, rng), m2 = MONTHS.find(x => q.ask.includes(x))!;
      expect(q.answer).toBe(MONTHS[(MONTHS.indexOf(m2) + 11) % 12]);
      expect(makeQuiz('months', 3, rng).ask).toMatch(/^What is the \w+ month of the year\?$/);
    }
    expect(makeQuiz('months', 3, () => 0.2).answer).toBe('March'); // int(0, 11) of 0.2 is 2: the third month
  });
  it('gives three different answers, the right one among them, and never asks the same thing twice running', () => {
    const rng = seeded(8);
    for (const kind of ['days', 'months', 'units'] as const) for (const level of [1, 2, 3] as const) {
      let last;
      for (let i = 0; i < 30; i++) {
        const p = makeQuiz(kind, level, rng, last);
        expect(new Set(p.choices).size).toBe(3);
        expect(p.choices).toContain(p.answer);
        expect(p.ask).not.toBe(last);
        last = p.ask;
      }
    }
  });
  it('has Time Facts at every Level, and they are right', () => {
    for (const level of [1, 2, 3]) expect(FACTS.filter(f => f.level === level).length).toBeGreaterThanOrEqual(5);
    const fact = (ask: string) => FACTS.find(f => f.ask === ask)!.answer;
    expect(fact('How many seconds are in a minute?')).toBe(60);
    expect(fact('How many minutes are in an hour?')).toBe(60);
    expect(fact('How many hours are in a day?')).toBe(24);
    expect(fact('How many days are in a week?')).toBe(7);
    expect(fact('How many months are in a year?')).toBe(12);
    for (const f of FACTS) expect(f.tell).toContain(String(f.answer));
  });
});
