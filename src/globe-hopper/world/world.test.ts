// The world tables are checked for what the brief asks: seven continents and five oceans (the Southern Ocean among them), one fixed colour
// for each continent, the flat map with north at the top and the Pacific split at its edges, Greenland never a continent, Antarctica the
// band along the bottom of the map, every safe area well inside its continent or ocean and clear of the arguable borders, famous places
// plainly in one continent (nothing in Turkey, Russia or the Sinai), and every "did you know" line listed with its source in the spec.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ARGUED, continentAt, landAt, mapScale, MAP_BOTTOM, MAP_TOP, oceanAt, REGIONS, WORLD } from '../map/geo';
import { APART_COLOURS, CONTINENTS, CONTINENT_IDS, NEIGHBOURS } from './continents';
import { BETWEEN, OCEANS } from './oceans';
import { COLD, HOT, LANDFORMS, MILD } from './land';
import { FAMOUS, PHOTO_PLACES, PLACES } from './places';

const ring = (s: { lon: number; lat: number; r: number }) => {
  const out: { lon: number; lat: number }[] = [];
  for (let a = 0; a < 360; a += 20) for (const f of [0, .35, .7, 1]) out.push({ lon: s.lon + (Math.cos((a * Math.PI) / 180) * s.r * f) / Math.max(.2, Math.cos((s.lat * Math.PI) / 180)), lat: s.lat + Math.sin((a * Math.PI) / 180) * s.r * f });
  return out;
};

describe('the continents and oceans', () => {
  it('are the seven continents and five oceans American schools teach, the Southern Ocean among them', () => {
    expect(CONTINENTS.map(c => c.name)).toEqual(['Africa', 'Europe', 'Asia', 'North America', 'South America', 'Australia', 'Antarctica']);
    expect(OCEANS.map(o => o.name)).toEqual(['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Southern Ocean']);
  });
  it('each continent has its own colour, and land apart (Greenland, the Pacific islands) never wears one', () => {
    const colours = CONTINENTS.map(c => c.colour);
    expect(new Set(colours).size).toBe(7);
    for (const c of Object.values(APART_COLOURS)) expect(colours).not.toContain(c);
  });
  it('every continent and ocean has a safe area well inside it, clear of every arguable border', () => {
    for (const c of CONTINENTS) for (const p of ring(c.safe)) expect(continentAt(p.lon, p.lat), `${c.id} ${p.lon.toFixed(1)},${p.lat.toFixed(1)}`).toBe(c.id);
    for (const o of OCEANS) for (const p of ring(o.safe)) expect(oceanAt(p.lon, p.lat), `${o.id} ${p.lon.toFixed(1)},${p.lat.toFixed(1)}`).toBe(o.id);
    for (const c of CONTINENTS) for (const a of ARGUED) expect(c.safe.lon + c.safe.r < a.box[0] || c.safe.lon - c.safe.r > a.box[2] || c.safe.lat + c.safe.r < a.box[1] || c.safe.lat - c.safe.r > a.box[3], `${c.id} ${a.why}`).toBe(true);
  });
  it('safe areas never overlap, so two right answers can never be argued', () => {
    const spots = [...CONTINENTS.map(c => c.safe), ...OCEANS.map(o => o.safe)];
    for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) {
      const a = spots[i]!, b = spots[j]!;
      expect(Math.hypot((a.lon - b.lon) * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180), a.lat - b.lat)).toBeGreaterThan(a.r + b.r);
    }
  });
  it('Greenland is drawn as land but is never a continent', () => {
    expect(landAt(-42, 72)).toBe('greenland');
    expect(continentAt(-42, 72)).toBeNull();
    expect(CONTINENT_IDS).not.toContain('greenland' as never);
  });
  it('the neighbour and between questions have one plain answer and plainly wrong choices', () => {
    for (const n of NEIGHBOURS) { expect(n.wrong).not.toContain(n.answer); expect(n.wrong).not.toContain(n.from); expect(n.wrong.length).toBeGreaterThanOrEqual(2); }
    for (const b of BETWEEN) { expect(b.wrong).not.toContain(b.answer); expect(b.wrong.length).toBeGreaterThanOrEqual(2); }
    // the Arctic is also between North America and Europe, and Asia and North America: never a wrong choice there
    expect(BETWEEN.find(b => b.a === 'namerica' && b.b === 'europe')!.wrong).not.toContain('arctic');
    expect(BETWEEN.find(b => b.a === 'asia' && b.b === 'namerica')!.wrong).not.toContain('arctic');
  });
  // "Which continent is south of Europe?" with Antarctica among the choices has two right answers: Antarctica is south of Europe too. A
  // wrong choice must have less than half its land that way, past the edge of the continent asked about; the answer most of it.
  it('each neighbour question has one answer that lies that way, and no wrong choice that does (measured on the outlines)', () => {
    const land: Record<string, { lon: number; lat: number; w: number }[]> = {};
    for (let lat = -89.5; lat < 90; lat += 1.5) for (let lon = -179.5; lon < 180; lon += 1.5) {
      const g = landAt(lon, lat);
      if (g && (CONTINENT_IDS as readonly string[]).includes(g)) (land[g] ??= []).push({ lon, lat, w: Math.cos((lat * Math.PI) / 180) });
    }
    const edge = (c: string) => { const p = land[c]!; return { s: Math.min(...p.map(x => x.lat)), n: Math.max(...p.map(x => x.lat)), e: Math.max(...p.map(x => x.lon)) }; };
    const shareThatWay = (w: string, from: string, way: string) => {
      const e = edge(from), p = land[w]!, all = p.reduce((t, q) => t + q.w, 0);
      const that = (q: { lon: number; lat: number }) => way === 'south' ? q.lat < e.s : way === 'north' ? q.lat > e.n
        : way === 'east' ? (((q.lon - e.e) % 360) + 360) % 360 < 150 && q.lat > e.s - 10 && q.lat < e.n + 10 : false;
      return p.filter(that).reduce((t, q) => t + q.w, 0) / all;
    };
    for (const n of NEIGHBOURS) {
      expect(n.wrong.length, `${n.way} of ${n.from}`).toBeGreaterThanOrEqual(2);
      expect(shareThatWay(n.answer, n.from, n.way), `${n.answer} is ${n.way} of ${n.from}`).toBeGreaterThan(.6);
      for (const w of n.wrong) expect(shareThatWay(w, n.from, n.way), `${w} as a wrong choice for ${n.way} of ${n.from}`).toBeLessThan(.5);
      // Antarctica lies south of every other continent, so it is never a wrong choice for "south of"
      if (n.way === 'south') expect(n.wrong).not.toContain('antarctica');
    }
    // and the lessons go the same way: "Start at Europe. Go south. This is Africa."
    for (const c of CONTINENTS) { const n = NEIGHBOURS.find(x => x.from === c.from.start && x.way === c.from.go); if (n) expect(n.answer).toBe(c.id); }
  });
});

describe('the flat map', () => {
  it('has north at the top and the Pacific split at its left and right edges', () => {
    const m = mapScale(720, 360, WORLD);
    expect(m.y(60)).toBeLessThan(m.y(-60));
    expect(m.x(-180)).toBeCloseTo(0, 5);
    expect(m.x(180)).toBeCloseTo(720, 5);
    expect(oceanAt(-175, 0)).toBe('pacific');
    expect(oceanAt(175, 0)).toBe('pacific');
  });
  it('draws Antarctica as the band along the bottom', () => {
    const anta = REGIONS.find(r => r.id === 'antarctica')!;
    const top = Math.max(...anta.rings.flatMap(r => Array.from({ length: r.length / 2 }, (_, i) => r[i * 2 + 1]!)));
    expect(top).toBeLessThan(-60);
    expect(MAP_BOTTOM).toBeLessThan(-80);
    expect(MAP_TOP).toBeGreaterThan(80);
    // it spans the whole width
    for (let lon = -170; lon <= 170; lon += 20) expect(landAt(lon, -84)).toBe('antarctica');
  });
});

describe('places', () => {
  const inBox = (p: { lon: number; lat: number }, x0: number, y0: number, x1: number, y1: number) => p.lon >= x0 && p.lon <= x1 && p.lat >= y0 && p.lat <= y1;
  it('Famous Places uses nothing in Turkey, Russia or the Sinai, and nothing on an arguable border', () => {
    for (const f of FAMOUS) {
      expect(inBox(f, 26, 35.8, 45, 42.2), `${f.id} in Turkey`).toBe(false);
      expect(inBox(f, 27, 41, 180, 82) && f.lon > 27 && f.lat > 50, `${f.id} in Russia`).toBe(false);
      expect(inBox(f, 32.3, 27.7, 35, 31.4), `${f.id} in the Sinai`).toBe(false);
      for (const a of ARGUED.filter(x => !x.why.includes('Suez'))) expect(inBox(f, a.box[0], a.box[1], a.box[2], a.box[3]), `${f.id}: ${a.why}`).toBe(false);
    }
  });
  it('uses animals only where the link is plain', () => {
    const animals = FAMOUS.filter(f => f.kind === 'animal').map(f => f.id);
    expect(animals).toContain('kangaroos');
    expect(animals).toContain('penguins');
    expect(FAMOUS.find(f => f.id === 'penguins')!.name).toBe('emperor penguins'); // other penguins live in Africa, South America and Australia too
    for (const bad of ['lions', 'polarbears', 'camels', 'sloths', 'toucans', 'moose', 'bison']) expect(animals).not.toContain(bad);
  });
  it('has about 150 or more places to photograph, every one with its own name and a plain place on the Earth', () => {
    expect(PLACES.length).toBeGreaterThanOrEqual(150);
    expect(new Set(PLACES.map(p => p.id)).size).toBe(PLACES.length);
    expect(new Set(PLACES.map(p => p.name)).size).toBe(PLACES.length);
    for (const p of PLACES) { expect(Math.abs(p.lat)).toBeLessThanOrEqual(90); expect(Math.abs(p.lon)).toBeLessThanOrEqual(180); }
    expect(PHOTO_PLACES.length + FAMOUS.length).toBe(PLACES.length);
  });
  it('the hot places are near the equator and the cold ones far toward a pole', () => {
    for (const h of HOT) expect(Math.abs(h.lat)).toBeLessThanOrEqual(5);
    for (const c of COLD) expect(Math.abs(c.lat)).toBeGreaterThanOrEqual(65);
    for (const m of MILD) { expect(Math.abs(m.lat)).toBeGreaterThanOrEqual(30); expect(Math.abs(m.lat)).toBeLessThanOrEqual(40); }
  });
});

describe('the spec', () => {
  const spec = readFileSync(resolve(import.meta.dirname, '../../../.scratch/globe-hopper/spec.md'), 'utf8');
  it('lists every "did you know" line and every lesson sentence, word for word', () => {
    const lines = [...CONTINENTS.map(c => c.line), ...OCEANS.map(o => o.line), ...FAMOUS.map(f => f.line), ...LANDFORMS.map(l => l.means)];
    for (const l of lines) expect(spec.includes(l), l).toBe(true);
  });
});
