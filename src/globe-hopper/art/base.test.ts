// Every building he can buy is drawn: on his base (in its own row, or as part of the pads and the ground) and by itself on its tile.
import { describe, expect, it } from 'vitest';
import { BUILDINGS, REPEATS } from '../base/catalog';
import { DRAWN_BUILDINGS, hasPicture } from './base';

describe('the drawn base', () => {
  it('draws every building in the catalogue on the base', () => {
    for (const b of BUILDINGS) expect(DRAWN_BUILDINGS, b.name).toContain(b.id.slice(2));
  });
  it('has a picture for every building tile and every thing bought again', () => {
    for (const b of BUILDINGS) expect(hasPicture(b.id.slice(2)), b.name).toBe(true);
    for (const r of REPEATS.filter(x => x.id !== 'module')) expect(hasPicture(r.id) || r.id === 'dish', r.name).toBe(true);
  });
});
