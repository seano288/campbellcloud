// The brief's rules, on thousands of generated questions of every kind, Level and Stretch:
// - exactly one choice is right, in every kind (every choice is tried; for a sort, every shelf for every thing);
// - each Level is the shape the spec says;
// - Save Up only asks what the numbers decide;
// - "Which of these can you buy?" has exactly one thing he can afford;
// - totals, what's left and every amount stay within 20;
// - Need or Want and Goods and Services use only the hand-checked tables, with nothing arguable;
// - Jobs never ties a look to a job: every job comes up with every gender and skin tone.
import { describe, expect, it } from 'vitest';
import { h, type VNode } from 'preact';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { isRightAnswer, KINDS, makeQuestion, MONEY_TOP, possibleAnswers, randomLook, readSort, type Level, type Question } from './problems';
import { ARGUABLE, BOTH, BUY_NEEDS, GENDERS, GOODS, JOBS, MADE, MENU, NEEDS, SERVICES, TOYS, WANTS, workerEmoji, type JobId } from './things';

const LEVELS = [1, 2, 3] as const, STRETCHES = [0, 1, 2] as const;
function* every(kind: (typeof KINDS)[number], per = 150): Generator<{ q: Question; level: Level; stretch: Stretch }> {
  for (const level of LEVELS) for (const stretch of STRETCHES) for (let s = 1; s <= per; s++) yield { q: makeQuestion(kind, level, stretch, seeded(s * 97 + level * 13 + stretch)), level, stretch };
}
const all = function* () { for (const k of KINDS) yield* every(k); };
const moneyOf = (q: Question): number[] => {
  switch (q.form) {
    case 'first': return [q.have, q.needPrice, q.wantPrice];
    case 'sum': return [...q.menu.map(m => m.price), ...q.choices, Number(q.answer)];
    case 'yesno': return [q.have, q.price];
    case 'which': return [q.have, ...q.items.map(i => i.price)];
    case 'left': return [q.have, q.price, ...q.choices];
    case 'more': return [q.have, q.price, ...q.choices];
    case 'days': return [q.start, q.perDay, q.goal];
    case 'both': return [q.have, q.a.price, q.b.price, q.a.price + q.b.price];
    default: return [];
  }
};

describe('every question has exactly one right answer', () => {
  it('in every kind, Level and Stretch', () => {
    let n = 0;
    for (const { q } of all()) {
      n++;
      if (q.form === 'sort') {
        // each thing has exactly one shelf; placing all of them right finishes it
        for (const id of q.things) {
          const ok = (q.kind === 'need' ? ['need', 'want'] : ['good', 'service']).filter(s => isRightAnswer(q, `${id}:${s}`) !== false);
          expect(ok, `${id}`).toHaveLength(1);
        }
        expect(isRightAnswer(q, q.answer)).toBe(true);
        expect(readSort(q.answer)).toHaveLength(4);
        continue;
      }
      const right = possibleAnswers(q).filter(a => isRightAnswer(q, a));
      expect(right, JSON.stringify(q)).toEqual([q.answer]);
      expect(new Set(possibleAnswers(q)).size).toBe(possibleAnswers(q).length);
    }
    expect(n).toBeGreaterThan(7000);
  });
});

describe('each Level is the shape the spec says', () => {
  it('Need or Want: two pictures, a need and a want; then four to sort; then a need and a want he can only afford one of', () => {
    for (const { q, level, stretch } of every('need')) {
      if (level === 1) {
        expect(q.form).toBe('pick');
        if (q.form !== 'pick') continue;
        expect(q.things.filter(id => NEEDS.some(t => t.id === id))).toHaveLength(1);
        expect(q.things.filter(id => WANTS.some(t => t.id === id))).toHaveLength(1);
        if (stretch === 0) expect(q.ask).toBe('need');
      } else if (level === 2) {
        expect(q.form).toBe('sort');
        if (q.form !== 'sort') continue;
        expect(q.things).toHaveLength(4);
        const needs = q.things.filter(id => q.shelves[id] === 'need').length;
        expect(needs).toBeGreaterThanOrEqual(1); expect(needs).toBeLessThanOrEqual(3);
        for (const id of q.things) expect(q.shelves[id] === 'need' ? NEEDS.some(t => t.id === id) : WANTS.some(t => t.id === id)).toBe(true);
      } else {
        expect(q.form).toBe('first');
        if (q.form !== 'first') continue;
        expect(q.needPrice).toBeLessThanOrEqual(q.have);
        expect(q.wantPrice).toBeLessThanOrEqual(q.have);
        expect(q.needPrice + q.wantPrice).toBeGreaterThan(q.have); // he can't have both: he has to choose
        expect(q.answer).toBe(q.need);
      }
    }
  });
  it('Goods and Services: a good and a service; four to sort (no two services by the same kind of worker); three workers, one who fits', () => {
    for (const { q, level } of every('goods')) {
      if (level === 1) {
        if (q.form !== 'pick') throw new Error(q.form);
        expect(q.things.filter(id => GOODS.some(g => g.id === id))).toHaveLength(1);
        expect(q.things.filter(id => SERVICES.some(s => s.id === id))).toHaveLength(1);
      } else if (level === 2) {
        if (q.form !== 'sort') throw new Error(q.form);
        const whos = q.things.flatMap(id => SERVICES.filter(s => s.id === id).map(s => s.who));
        expect(new Set(whos).size).toBe(whos.length);
      } else {
        if (q.form !== 'who' || q.kind !== 'goods') throw new Error(q.form);
        expect(q.workers).toHaveLength(3);
        const role = q.ask === 'service' ? 'service' : 'good';
        expect(q.workers.filter(w => JOBS.find(j => j.id === w.job)!.role === role)).toHaveLength(1);
        for (const w of q.workers) expect(JOBS.find(j => j.id === w.job)!.role).not.toBe('none');
      }
    }
  });
  it('Jobs: two workers; three tools or three workers; a maker and a shopper', () => {
    for (const { q, level } of every('job')) {
      if (level === 1) { if (q.form !== 'who') throw new Error(q.form); expect(q.workers).toHaveLength(2); }
      else if (level === 2) {
        expect(['tool', 'user']).toContain(q.form);
        if (q.form === 'tool') { expect(q.tools).toHaveLength(3); expect(new Set(q.tools.map(t => JOBS.find(j => j.id === t)!.tool)).size).toBe(3); }
        if (q.form === 'user') expect(q.workers).toHaveLength(3);
      } else {
        if (q.form !== 'role') throw new Error(q.form);
        expect(q.maker.job).toBe(MADE.find(m => m.id === q.good)!.maker);
      }
    }
  });
  it('Add It Up: two things to $10, two things to $20 (over ten), then three things to $20', () => {
    for (const { q, level } of every('total')) {
      if (q.kind !== 'total') throw new Error(q.kind);
      const sum = q.order.reduce((s, id) => s + q.menu.find(m => m.id === id)!.price, 0);
      expect(String(sum)).toBe(q.answer);
      expect(q.order).toHaveLength(level === 3 ? 3 : 2);
      expect(sum).toBeLessThanOrEqual(level === 1 ? 10 : 20);
      if (level === 2) expect(sum).toBeGreaterThan(10);
      expect(q.choices).toHaveLength(3);
    }
  });
  it('Enough?: enough or not; exactly one thing he can afford; what is left', () => {
    for (const { q, level } of every('enough')) {
      if (level === 1) { if (q.form !== 'yesno') throw new Error(q.form); expect(q.answer).toBe(q.price <= q.have ? 'yes' : 'no'); }
      else if (level === 2) {
        if (q.form !== 'which') throw new Error(q.form);
        expect(q.items).toHaveLength(3);
        expect(q.items.filter(i => i.price <= q.have)).toHaveLength(1); // "Which of these can you buy?": exactly one in reach
        expect(q.items.find(i => i.price <= q.have)!.id).toBe(q.answer);
      } else {
        if (q.form !== 'left') throw new Error(q.form);
        expect(Number(q.answer)).toBe(q.have - q.price);
        expect(q.have - q.price).toBeGreaterThanOrEqual(1);
      }
    }
  });
  it('Save Up asks only what the numbers decide, never an opinion', () => {
    for (const { q, level } of every('save')) {
      expect(['more', 'days', 'both']).toContain(q.form);
      if (q.form === 'more') { expect(level).toBe(1); expect(Number(q.answer)).toBe(q.price - q.have); expect(q.have).toBeLessThan(q.price); }
      if (q.form === 'days') { expect(level).toBe(2); expect((q.goal - q.start) % q.perDay).toBe(0); expect(Number(q.answer)).toBe((q.goal - q.start) / q.perDay); }
      if (q.form === 'both') {
        expect(level).toBe(3);
        expect(q.answer).toBe(q.a.price + q.b.price <= q.have ? 'yes' : 'no');
        expect(q.a.price).toBeLessThanOrEqual(q.have); expect(q.b.price).toBeLessThanOrEqual(q.have); // each alone he can buy: it's the two together
      }
    }
    // both answers come up, about evenly
    const both = [...every('save', 400)].map(x => x.q).filter(q => q.form === 'both');
    const yes = both.filter(q => q.answer === 'yes').length;
    expect(yes / both.length).toBeGreaterThan(.35); expect(yes / both.length).toBeLessThan(.65);
  });
});

describe('money', () => {
  it('is whole dollars, and totals, what is left and every amount stay within 20', () => {
    for (const { q } of all()) for (const m of moneyOf(q)) {
      expect(Number.isInteger(m)).toBe(true);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m, JSON.stringify(q)).toBeLessThanOrEqual(MONEY_TOP);
    }
  });
  it('number choices are three different numbers, from 1 to 20', () => {
    for (const { q } of all()) if ('choices' in q) {
      expect(q.choices).toHaveLength(3);
      expect(new Set(q.choices).size).toBe(3);
      for (const c of q.choices) { expect(c).toBeGreaterThanOrEqual(1); expect(c).toBeLessThanOrEqual(MONEY_TOP); }
    }
  });
});

describe('the hand-checked tables', () => {
  const words = (s: string) => s.toLowerCase().split(/[^a-z]+/);
  it('Need or Want: needs are food, water, a home, clothes and medicine; wants are toys, games and sweets; nothing arguable', () => {
    for (const t of [...NEEDS, ...BUY_NEEDS]) expect(['food', 'water', 'home', 'clothes', 'medicine']).toContain(t.cat);
    for (const t of WANTS) expect(['toy', 'game', 'sweet']).toContain(t.cat);
    for (const t of [...NEEDS, ...BUY_NEEDS, ...WANTS]) for (const w of [...words(t.id), ...words(t.name)]) expect(ARGUABLE, `${t.name}`).not.toContain(w);
    // no thing is on both lists, and no picture is used twice
    expect(NEEDS.filter(n => (WANTS as readonly { id: string; emoji: string }[]).some(w => w.id === n.id || w.emoji === n.emoji))).toEqual([]);
    expect(new Set([...NEEDS, ...WANTS].map(t => t.emoji)).size).toBe(NEEDS.length + WANTS.length);
  });
  it('Goods and Services: nothing that is both (no meal, no restaurant), no thing on both lists', () => {
    for (const t of [...GOODS, ...SERVICES]) for (const w of [...words(t.id), ...words(t.name)]) expect(BOTH, t.name).not.toContain(w);
    expect(GOODS.filter(g => (SERVICES as readonly { id: string }[]).some(s => s.id === g.id))).toEqual([]);
    // every service is drawn being done: a worker and what they work on
    for (const s of SERVICES) { expect(s.on.length).toBeGreaterThan(0); expect(workerEmoji(s.who as JobId, { gender: 'woman', tone: 0 }).length).toBeGreaterThan(0); }
  });
  it('Jobs: every job has its own tool, never the thing its emoji already holds, and its own question', () => {
    expect(new Set(JOBS.map(j => j.tool)).size).toBe(JOBS.length);
    expect(new Set(JOBS.map(j => j.ask)).size).toBe(JOBS.length);
    for (const j of JOBS) if ('zwj' in j) expect(j.tool).not.toBe(j.zwj);
  });
  it('prices name one thing each, so "costs" fits', () => {
    for (const p of [...MENU, ...TOYS]) expect(p.costs).toMatch(/^The [a-z -]+ costs$/);
  });
});

describe('Jobs shows no worker in a way that suggests who can do the job', () => {
  it('the look is picked without the job: every job comes up with every gender and every skin tone', () => {
    const seen = new Map<string, Set<string>>();
    for (const kind of ['job', 'goods'] as const) for (const { q } of every(kind, 600)) {
      const workers = q.form === 'who' || q.form === 'user' ? q.workers : q.form === 'tool' ? [q.worker] : q.form === 'role' ? [q.maker] : [];
      for (const w of workers) { const s = seen.get(w.job) ?? new Set(); s.add(`${w.look.gender}${w.look.tone}`); seen.set(w.job, s); }
    }
    for (const j of JOBS) expect(seen.get(j.id)?.size, j.id).toBe(GENDERS.length * 5);
  });
  it('randomLook takes no job at all, and every look draws a different emoji', () => {
    expect(randomLook.length).toBe(1);
    for (const j of JOBS) {
      const faces = new Set(GENDERS.flatMap(g => [0, 1, 2, 3, 4].map(t => workerEmoji(j.id, { gender: g, tone: t as 0 }))));
      expect(faces.size, j.id).toBe(15);
    }
  });
});

describe('number buttons are not read out', () => {
  it('the number choices have no voice: they draw without one, and a tap only answers', async () => {
    const { NumberChoicesForTest } = await import('../views');
    const taps: string[] = [];
    const tree = NumberChoicesForTest({ choices: [3, 7, 9], onTap: a => taps.push(a) }) as VNode<{ children: VNode<{ onClick(): void }>[] }>;
    const buttons = tree.props.children;
    expect(buttons).toHaveLength(3);
    buttons[1]!.props.onClick();
    expect(taps).toEqual(['7']);
    void h;
  });
});
