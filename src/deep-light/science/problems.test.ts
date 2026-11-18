// The brief's rules for the questions, each checked on thousands of generated questions:
// - exactly one choice is right, in every kind and Level, and every question matches its Level;
// - the mirror puzzles are decided by the same ray code that draws the beam, on a grid, the mirrors turning in fixed steps;
// - the moon is never offered in "makes its own light" at Levels 1 and 2, right or wrong;
// - Shadows never shows a thing whose shadow could belong to another thing on screen;
// - "lets some light through" comes only from the hand-checked table of clear cases.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { bounce, hitsGem, shadowOf, trace, TURNS, type Dir, type Lab } from './optics';
import { everyAnswer, isAnswer, LAB, makeQuestion, mirrorsLight, shadowFrom, spotLights, STAGE, type Kind, type Level, type Question } from './problems';
import { LIGHT_THINGS, MATERIALS, MOON, SHADOW_THINGS, SOUNDS } from './things';

const KINDS: Kind[] = ['see', 'through', 'shadow', 'mirror', 'sound', 'signal'];
const LEVELS: Level[] = [1, 2, 3];
const FORMS: Record<Kind, Record<Level, string[]>> = {
  see: { 1: ['cave'], 2: ['own'], 3: ['why', 'sunmoon', 'own'] },
  through: { 1: ['pick'], 2: ['sort'], 3: ['wall'] },
  shadow: { 1: ['match'], 2: ['where'], 3: ['lamp'] },
  mirror: { 1: ['which'], 2: ['turn'], 3: ['two', 'spot'] },
  sound: { 1: ['loud'], 2: ['shake'], 3: ['why'] },
  signal: { 1: ['hello'], 2: ['copy'], 3: ['key'] },
};

/** Is this answer right, judged from the picture's own rules rather than the stored answer? */
function rightByRules(q: Question, a: string): boolean {
  if (q.kind === 'see' && q.form === 'own') { const picked = a ? a.split('+') : []; return q.items.every(i => picked.includes(i) === (i !== MOON.id && LIGHT_THINGS.find(t => t.id === i)!.own)); }
  if (q.kind === 'see' && q.form === 'cave') return a === 'lit';
  if (q.kind === 'see' && q.form === 'sunmoon') return a === 'sun';
  if (q.kind === 'through' && q.form === 'pick') return MATERIALS.find(m => m.id === a)!.pass === q.ask;
  if (q.kind === 'through' && q.form === 'sort') return a.split(',').every(p => { const [it, bin] = p.split(':'); return MATERIALS.find(m => m.id === it)!.pass === bin; });
  if (q.kind === 'through' && q.form === 'wall') { const p = MATERIALS.find(m => m.id === q.item)!.pass; return a === (p === 'all' ? 'bright' : p === 'some' ? 'dim' : 'shadow'); }
  if (q.kind === 'shadow' && q.form === 'match') return a === q.thing;
  if (q.kind === 'shadow' && q.form === 'where') return a === shadowOf(STAGE.lamps[q.lamp], STAGE.thing).side;
  if (q.kind === 'shadow' && q.form === 'lamp') return shadowFrom(a as 'left').side === q.shown;
  if (q.kind === 'mirror' && (q.form === 'turn' || q.form === 'two')) return mirrorsLight(q, a);
  if (q.kind === 'mirror' && q.form === 'spot') return spotLights(q, a);
  if (q.kind === 'mirror') return a === 'mirror';
  if (q.kind === 'signal' && q.form === 'copy') return a === q.pattern;
  if (q.kind === 'signal' && q.form === 'key') return Number(a) === q.n;
  return a === q.answer; // the sentence tables: one right sentence each, by construction (things.ts)
}

describe('every question', () => {
  for (const kind of KINDS) for (const level of LEVELS) {
    it(`${kind} at Level ${level}: one answer is right, it is the marked one, and the form matches the Level`, () => {
      const rng = seeded(kind.length * 31 + level);
      for (let i = 0; i < 400; i++) {
        const q = makeQuestion(kind, level, ([0, 1, 2] as const)[i % 3]!, rng);
        expect(FORMS[kind][level]).toContain(q.form);
        const all = everyAnswer(q);
        expect(all.every(a => isAnswer(q, a))).toBe(true);
        const right = all.filter(a => rightByRules(q, a));
        expect(right, JSON.stringify(q)).toEqual([q.answer]);
        expect(new Set(all).size).toBe(all.length);
      }
    });
  }
  it('choices are never repeated, and there are two or three of them', () => {
    const rng = seeded(7);
    for (const kind of KINDS) for (const level of LEVELS) for (let i = 0; i < 100; i++) {
      const q = makeQuestion(kind, level, 1, rng);
      if ('choices' in q) { expect(new Set(q.choices).size).toBe(q.choices.length); expect(q.choices.length).toBeGreaterThanOrEqual(2); expect(q.choices.length).toBeLessThanOrEqual(3); }
    }
  });
});

describe('the moon', () => {
  it('is never offered in "makes its own light" at Levels 1 and 2, and never counts as making its own light', () => {
    const rng = seeded(11);
    for (const level of [1, 2] as const) for (let i = 0; i < 2000; i++) {
      const q = makeQuestion('see', level, 2, rng);
      expect([...('items' in q ? q.items : []), ...('choices' in q ? q.choices : [])]).not.toContain('moon');
    }
    let met = 0;
    for (let i = 0; i < 2000; i++) {
      const q = makeQuestion('see', 3, 2, rng);
      if (q.form === 'own' && q.items.includes('moon')) { met++; expect(q.answer.split('+')).not.toContain('moon'); }
      if (q.form === 'sunmoon') expect(q.answer).toBe('sun');
    }
    expect(met).toBeGreaterThan(100);
    expect(MOON.own).toBe(false);
    expect(LIGHT_THINGS.some(t => (t.id as string) === 'moon')).toBe(false);
  });
});

describe('lets some light through', () => {
  it('is only ever the hand-checked clear cases', () => {
    expect(MATERIALS.filter(m => m.pass === 'some').map(m => m.id).sort()).toEqual(['frosted', 'tissue', 'wax']);
  });
  it('Level 1 never asks about a "some" material, so "which lets the light through" has one plain answer', () => {
    const rng = seeded(3);
    for (let i = 0; i < 500; i++) { const q = makeQuestion('through', 1, 0, rng); if (q.form === 'pick') expect(q.choices.every(c => MATERIALS.find(m => m.id === c)!.pass !== 'some')).toBe(true); }
  });
});

describe('Shadows', () => {
  it('never shows two things whose shadows could look alike', () => {
    const rng = seeded(5);
    for (let i = 0; i < 3000; i++) {
      const q = makeQuestion('shadow', 1, 0, rng);
      if (q.form !== 'match') continue;
      const shapes = q.choices.map(c => SHADOW_THINGS.find(t => t.id === c)!.shape);
      expect(new Set(shapes).size).toBe(shapes.length);
    }
  });
  it('the shadow falls away from the lamp, and each of the three lamps casts a different shadow', () => {
    expect(shadowFrom('left').side).toBe('right');
    expect(shadowFrom('right').side).toBe('left');
    expect(shadowFrom('top').side).toBe('under');
    // the shadow starts at the thing and reaches further than the thing is wide when the lamp is low
    const s = shadowFrom('left');
    expect(s.from).toBeCloseTo(STAGE.thing.x + STAGE.thing.w / 2 - STAGE.thing.w, 5);
    expect(s.to).toBeGreaterThan(STAGE.thing.x + STAGE.thing.w / 2);
  });
});

describe('the ray code', () => {
  it('bounces as a mirror does: the angle in is the angle out, and edge-on stops it', () => {
    // a beam going east: / sends it north, \ south, | back west, — edge-on
    expect(bounce(0, 3)).toBe(6);
    expect(bounce(0, 1)).toBe(2);
    expect(bounce(0, 2)).toBe(4);
    expect(bounce(0, 0)).toBe(null);
    // bouncing twice off the same mirror brings the beam back the way it came, reversed
    for (let d = 0; d < 8; d++) for (const t of TURNS) {
      const out = bounce(d as Dir, t);
      if (out !== null) expect(bounce(((out + 4) % 8) as Dir, t)).toBe((d + 4) % 8);
    }
  });
  it('traces a straight beam, a bounce onto the gem, and a beam stopped by a rock', () => {
    const lab: Lab = { w: 6, h: 4, lamp: { x: 0, y: 2, dir: 0 }, gem: { x: 3, y: 0 }, mirrors: [{ x: 3, y: 2, turn: 3 }], rocks: [] };
    const b = trace(lab);
    expect(b.end).toBe('gem');
    expect(b.points).toEqual([{ x: 0, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 0 }]); // the lamp, the mirror it bounces off, the gem
    expect(trace({ ...lab, rocks: [{ x: 2, y: 2 }] }).end).toBe('rock');
    expect(hitsGem({ ...lab, mirrors: [{ x: 3, y: 2, turn: 1 }] })).toBe(false);
  });
  it('every mirror puzzle fits the lab, starts with the mirrors on the grid and turned in whole steps', () => {
    const rng = seeded(9);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion('mirror', (2 + (i % 2)) as Level, 0, rng);
      if (q.kind !== 'mirror' || q.form === 'which') continue;
      const cells = [q.lab.lamp, q.lab.gem, ...q.lab.mirrors, ...(q.form === 'spot' ? q.spots : [])];
      for (const c of cells) { expect(Number.isInteger(c.x) && Number.isInteger(c.y)).toBe(true); expect(c.x >= 0 && c.x < LAB.w && c.y >= 0 && c.y < LAB.h).toBe(true); }
      for (const m of q.lab.mirrors) expect(TURNS).toContain(m.turn);
      if (q.form === 'turn' || q.form === 'two') expect(hitsGem(q.lab)).toBe(false); // it starts out missing: there is something to do
    }
  });
});

describe('sound questions never depend on the volume', () => {
  it('a loud/quiet pair is always one loud and one quiet, so their rings (big for loud, small for quiet) answer it with the sound off', () => {
    const rng = seeded(13);
    for (let i = 0; i < 500; i++) {
      const q = makeQuestion('sound', 1, 0, rng);
      if (q.kind !== 'sound' || q.form !== 'loud') continue;
      const [a, b] = q.choices.map(c => SOUNDS.find(s => s.id === c)!.loud);
      expect(a).not.toBe(b);
      const loudest = q.choices[a! > b! ? 0 : 1], quietest = q.choices[a! > b! ? 1 : 0];
      expect(q.answer).toBe(q.ask === 'loud' ? loudest : quietest);
    }
  });
  it('"tap the one that is shaking" has exactly one shaking thing, drawn shaking, and it is the answer', () => {
    const rng = seeded(17);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion('sound', 2, 0, rng);
      if (q.kind !== 'sound' || q.form !== 'shake') continue;
      expect(new Set(q.choices).size).toBe(3);
      expect(q.choices.filter(c => c === q.answer).length).toBe(1);
    }
  });
});
