// Every generated question has exactly one right answer, matches its Level, and its taps can't be argued: thousands of each kind and Level.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { arc, continentAt, landAt, oceanAt } from '../map/geo';
import { CONTINENTS, type ContinentId } from '../world/continents';
import { OCEANS } from '../world/oceans';
import { landform, LOOK_ALIKE } from '../world/land';
import { FAMOUS } from '../world/places';
import { isRightAnswer, judgeTap, KINDS, makeQuestion, PIN_APART, PIN_R, possibleAnswers, type Level, type Question } from './problems';

const N = 1500;
const all: Question[] = [];
for (const kind of KINDS) for (const level of [1, 2, 3] as Level[]) {
  const r = seeded(kind.length * 1000 + level);
  for (let i = 0; i < N; i++) all.push(makeQuestion(kind, level, r));
}
const spot = (id: string) => CONTINENTS.find(c => c.id === id)?.safe ?? OCEANS.find(o => o.id === id)?.safe;

describe('every question', () => {
  it('has exactly one right answer among the answers it can be given, and is at its Level', () => {
    for (const q of all) {
      const answers = possibleAnswers(q);
      expect(new Set(answers).size, q.text).toBe(answers.length);
      expect(answers.filter(a => isRightAnswer(q, a)).length, q.text).toBe(1);
      expect(isRightAnswer(q, 'nothing-like-it')).toBeNull();
      expect([1, 2, 3]).toContain(q.level);
      expect(q.ask.length).toBeGreaterThan(0);
    }
  });
  it('judges a tap on each continent or ocean target as that one, everywhere inside its safe area', () => {
    for (const q of all.slice(0, 20000)) {
      const st = q.stage;
      if (st.type !== 'earth' || !st.tap || (st.tap.by !== 'continent' && st.tap.by !== 'ocean')) continue;
      for (const id of st.tap.among) {
        const s = spot(id)!;
        for (let a = 0; a < 360; a += 45) for (const f of [0, .6, 1]) {
          const at = { lon: s.lon + (Math.cos((a * Math.PI) / 180) * s.r * f) / Math.max(.2, Math.cos((s.lat * Math.PI) / 180)), lat: s.lat + Math.sin((a * Math.PI) / 180) * s.r * f };
          expect(judgeTap(st, at), `${q.text} ${id} ${at.lon},${at.lat}`).toBe(id);
        }
      }
    }
  }, 120_000);
  it('puts pins far enough apart that a finger can only hit one, and each pin answers as itself', () => {
    for (const q of all) {
      const st = q.stage;
      const pins = st.type === 'scene' ? st.pins : st.type === 'earth' ? st.pins ?? [] : [];
      for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) expect(arc(pins[i]!.at, pins[j]!.at), q.text).toBeGreaterThanOrEqual(PIN_APART);
      if (st.type === 'earth' && st.tap) continue;
      for (const p of pins) expect(judgeTap(st, p.at)).toBe(p.id);
      expect(PIN_R * 2).toBeLessThan(PIN_APART);
    }
  });
  it('never lets Greenland be a continent, and never counts a tap on it', () => {
    for (const q of all) expect([...possibleAnswers(q), q.answer]).not.toContain('greenland');
    expect(continentAt(-42, 72)).toBeNull();
    expect(landAt(-42, 72)).toBe('greenland');
  });
});

describe('Land and Water', () => {
  it('asks for the land or the water, the poles or the equator, or north or south of a place well away from the equator', () => {
    for (const q of all.filter(x => x.kind === 'globe')) {
      if (q.level === 2) { const st = q.stage as Extract<Question['stage'], { type: 'earth' }>; expect(st.surface).toMatchObject({ s: 'globe', lat: 0 }); }
      if (q.level === 3) { const st = q.stage as Extract<Question['stage'], { type: 'earth' }>; const lat = st.pins![0]!.at.lat; expect(Math.abs(lat)).toBeGreaterThanOrEqual(20); expect(q.answer).toBe(lat > 0 ? 'north' : 'south'); }
    }
    const st = { type: 'earth', surface: { s: 'globe', lon: 0, lat: 0 }, tap: { by: 'poles' } } as const;
    expect(judgeTap(st, { lon: 10, lat: 80 })).toBe('npole');
    expect(judgeTap(st, { lon: 10, lat: -80 })).toBe('spole');
    expect(judgeTap(st, { lon: 10, lat: 3 })).toBe('equator');
    expect(judgeTap(st, { lon: 10, lat: 35 })).toBeNull();
  });
  it('counts a tap as land or water only away from the coast', () => {
    const st = { type: 'earth', surface: { s: 'globe', lon: 0, lat: 0 }, tap: { by: 'surface' } } as const;
    expect(judgeTap(st, { lon: 20, lat: 5 })).toBe('land');
    expect(judgeTap(st, { lon: -140, lat: 0 })).toBe('water');
    expect(judgeTap(st, { lon: -9.3, lat: 38.7 })).toBeNull(); // Lisbon, on the coast
  });
});

describe('Continents and Oceans', () => {
  it('lights three continents at Level 1, all seven at Level 2, and Level 3 asks about a shape or a plain neighbour', () => {
    for (const q of all.filter(x => x.kind === 'continent')) {
      const st = q.stage;
      if (q.level === 1 && st.type === 'earth') expect(st.lit!.length).toBe(3);
      if (q.level === 2 && st.type === 'earth' && st.tap?.by === 'continent') expect(st.tap.among.length).toBe(7);
      if (q.level === 3) expect(q.choices!.length).toBe(3);
    }
  });
  it('asks only for the Pacific and the Atlantic at Level 1 and all five at Level 2, and puts each safe area well inside its ocean', () => {
    for (const q of all.filter(x => x.kind === 'ocean' && x.level === 1)) expect(['pacific', 'atlantic']).toContain(q.answer);
    expect(new Set(all.filter(x => x.kind === 'ocean' && x.level === 2).map(q => q.answer)).size).toBe(5);
    for (const o of OCEANS) expect(oceanAt(o.safe.lon, o.safe.lat)).toBe(o.id);
  });
  it('never judges a tap on the line between Europe and Asia, at Suez or across Panama', () => {
    for (const [lon, lat] of [[60, 55], [58, 50], [40, 40], [32.5, 30], [-79, 8.5]]) expect(continentAt(lon!, lat!), `${lon},${lat}`).toBeNull();
  });
});

describe('Shape of the Land', () => {
  it('never puts look-alikes side by side, never uses a valley at Level 2, and never offers an arguable choice at Level 3', () => {
    for (const q of all.filter(x => x.kind === 'land')) {
      const cards = (q.stage as Extract<Question['stage'], { type: 'cards' }>).cards;
      expect(cards.length).toBe(3);
      for (const [a, b] of LOOK_ALIKE) expect(cards.includes(a) && cards.includes(b), q.text).toBe(false);
      if (q.level === 2) expect(cards).not.toContain('valley');
      if (q.level === 3) {
        const target = landform(q.answer as never);
        for (const c of cards) if (c !== q.answer) { expect(target.clash, q.text).not.toContain(c); expect(landform(c).clash).not.toContain(q.answer); }
      }
    }
  });
});

describe('Hot and Cold', () => {
  it('always has a plainly colder place: the cold one is much further from the equator', () => {
    for (const q of all.filter(x => x.kind === 'climate')) {
      const st = q.stage as { pins: readonly { id: string; at: { lat: number } }[] };
      const lat = (id: string) => Math.abs(st.pins.find(p => p.id === id)!.at.lat);
      if (q.level < 3) expect(lat('cold') - lat('hot')).toBeGreaterThanOrEqual(55);
      else expect(lat('cool') - lat('warm')).toBeGreaterThanOrEqual(25);
    }
  });
});

describe('Famous Places', () => {
  it('asks only about places drawn on their own continent', () => {
    for (const f of FAMOUS) {
      const home = (f.where as { c: ContinentId }).c;
      let found = false;
      for (let d = 0; d <= 2.5 && !found; d += .5) for (let a = 0; a < 360 && !found; a += 30) if (landAt(f.lon + Math.cos(a) * d, f.lat + Math.sin(a) * d) === home) found = true;
      expect(found, f.id).toBe(true);
    }
  });
  it('lights two continents at Level 1, all seven at Level 2, and puts three pins on three continents at Level 3', () => {
    for (const q of all.filter(x => x.kind === 'place')) {
      const st = q.stage as Extract<Question['stage'], { type: 'earth' }>;
      if (q.level === 1) expect(st.lit!.length).toBe(2);
      if (q.level === 2) expect(st.lit!.length).toBe(7);
      if (q.level === 3) {
        expect(st.pins!.length).toBe(3);
        const homes = st.pins!.map(p => (FAMOUS.find(f => f.id === p.id)!.where as { c: string }).c);
        expect(new Set(homes).size).toBe(3);
      }
    }
  });
});
