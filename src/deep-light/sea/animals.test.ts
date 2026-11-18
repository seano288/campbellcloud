// The Logbook's animals: about sixty real ones, each with a name said aloud, one true fact with the page it was checked against, a
// zone, and a drawing. Names are unique (each is its own clip) and facts are short enough to say in one breath.
import { describe, expect, it } from 'vitest';
import { ANIMALS } from './animals';
import { ZONES } from './zones';

describe('the animals', () => {
  it('are about sixty, each named once, in a zone, with a fact and a source', () => {
    expect(ANIMALS.length).toBeGreaterThanOrEqual(58);
    expect(new Set(ANIMALS.map(a => a.id)).size).toBe(ANIMALS.length);
    expect(new Set(ANIMALS.map(a => a.name)).size).toBe(ANIMALS.length);
    for (const a of ANIMALS) {
      expect(ZONES.map(z => z.id)).toContain(a.zone);
      expect(a.fact, a.id).toMatch(/^[A-Z].*[.!]$/);
      expect(a.fact.split(' ').length, a.id).toBeLessThanOrEqual(18);
      expect(a.source, a.id).toMatch(/^https:\/\/(oceana\.org|www\.mbari\.org|en\.wikipedia\.org|www\.fisheries\.noaa\.gov|www\.montereybayaquarium\.org)\//);
    }
  });
  it('the anglerfish, lanternfish, vampire squid, dumbo octopus, giant squid, gulper eel and a comb jelly are all there (the brief names them)', () => {
    for (const id of ['anglerfish', 'lanternfish', 'vampiresquid', 'dumbo', 'giantsquid', 'gulper', 'combjelly']) expect(ANIMALS.some(a => a.id === id), id).toBe(true);
  });
  it('the dark zones have animals that make their own light, which show in the dark', () => {
    for (const z of ['twilight', 'midnight', 'cave'] as const) expect(ANIMALS.filter(a => a.zone === z && 'glow' in a).length, z).toBeGreaterThanOrEqual(2);
  });
});
