import { describe, expect, it } from 'vitest';
import { loftBody, loftSurface, mirrored, naca, panel, pchip, signedVolume } from './geometry';

describe('aircraft geometry', () => {
  it('lofts an ellipsoid-like body whose normals point out, with about the right volume', () => {
    const sections = Array.from({ length: 21 }, (_, i) => { const x = i / 10 - 1, r = Math.sqrt(Math.max(1 - x * x, 0)); return { x, w: r, top: r, bot: r }; });
    const { skin } = loftBody(sections, { segs: 64, rings: 80 });
    expect(signedVolume(skin)).toBeGreaterThan(0.95 * (4 / 3) * Math.PI * 0.97);
    expect(signedVolume(skin)).toBeLessThan(1.02 * (4 / 3) * Math.PI);
  });
  it('keeps an open intake mouth as its own face, facing forward', () => {
    const { skin, front } = loftBody([{ x: 0, w: 0.5, top: 0.5, bot: 0.5 }, { x: 2, w: 0.5, top: 0.5, bot: 0.5 }], { openFront: true });
    expect(front).not.toBeNull();
    const n = front!.attributes.normal!;
    expect(n.getX(0)).toBeLessThan(-0.9);
    expect(skin.index!.count).toBeGreaterThan(0);
  });
  it('lofts a wing panel with positive volume, and its mirror too', () => {
    const wing = loftSurface(panel({ le: [0, 0, 0], chord: 3, t: 0.08 }, { le: [2, 0, 5], chord: 1, t: 0.06 }, 4));
    expect(signedVolume(wing)).toBeGreaterThan(0);
    expect(signedVolume(mirrored(wing))).toBeCloseTo(signedVolume(wing), 5);
  });
  it('lofts a vertical fin', () => {
    expect(signedVolume(loftSurface(panel({ le: [0, 0, 0], chord: 3 }, { le: [2, 3, 0.3], chord: 1 })))).toBeGreaterThan(0);
  });
  it('interpolates without overshoot', () => {
    const f = pchip([0, 1, 2, 3], [0, 1, 1, 0]);
    for (let x = 0; x <= 3; x += 0.05) expect(f(x)).toBeLessThanOrEqual(1.0000001);
    expect(naca(0.3, 0.12)).toBeCloseTo(0.06, 2);
  });
});
