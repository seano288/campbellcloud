import { describe, expect, it } from 'vitest';
import { CYCLE, offsets, pose } from './traffic';
import { TUNING } from '../mission/sim';

describe('Watch the deck', () => {
  it('keeps every aircraft on the deck or in the sky, never below the deck unless going down a lift', () => {
    for (let n = 1; n <= 6; n++) for (let t = 0; t < CYCLE * 2; t += .05) for (const o of offsets(n)) {
      const p = pose(t + o, 600, 260, 2);
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      if (p.seen && Math.abs(p.x - 260) > 1) expect(p.y).toBeGreaterThanOrEqual(TUNING.deckAlt);
    }
  });
  it('never has two aircraft on the catapult run at once with up to six', () => {
    for (const n of [2, 4, 6]) for (let t = 0; t < CYCLE; t += .05) {
      const launching = offsets(n).filter(o => { const p = (((t + o) % CYCLE) + CYCLE) % CYCLE; return p >= 4 && p < 5.2; });
      expect(launching.length).toBeLessThanOrEqual(1);
    }
  });
});
