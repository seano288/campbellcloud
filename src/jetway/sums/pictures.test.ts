// The runway line's number boxes never print over each other, for every Missing Bags and Ten Hops question as its fuller lesson ends
// (both hops drawn): pass 2 found "69 + ? = 70" with the 70 box over the 69, and two hops landing on 86 and 91 on a phone.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { labelRows, lineX } from './pictures';
import { makeQuestion, type Level } from './problems';
import { gapLine, hopLine, type Line } from './teach';

const nextTen = (x: number) => Math.ceil(x / 10) * 10;
function* lines(): Generator<[string, Line]> {
  for (const level of [1, 2, 3] as Level[]) for (const stretch of [0, 1, 2] as const) for (let s = 1; s <= 200; s++) {
    const g = makeQuestion('gap', level, stretch, seeded(s * 13 + level)), h = makeQuestion('hop', level, stretch, seeded(s * 17 + level));
    if (g.kind === 'gap') {
      const ten = nextTen(g.a);
      yield [`${g.a} + ? = ${g.target}`, gapLine(g, [{ from: g.a, to: ten, label: '' }, ...(g.target > ten ? [{ from: ten, to: g.target, label: '' }] : [])], g.target)];
    }
    if (h.kind === 'hop') {
      if (h.form === 'step') yield [`${h.n} ${h.step}`, hopLine(h, [{ from: h.n, to: h.n + h.step, label: '' }])];
      else yield [`${h.a} ${h.op} ${h.b}`, hopLine(h, [{ from: h.a, to: h.first, label: '' }, { from: h.first, to: h.second, label: '' }])];
    }
  }
}

describe('the runway line', () => {
  it('puts every number box where no other covers it', () => {
    let lowered = 0;
    for (const [name, line] of lines()) {
      const rows = labelRows(line), boxes = [...rows];
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const [a, ra] = boxes[i]!, [b, rb] = boxes[j]!;
        if (ra === rb) expect(Math.abs(lineX(line, a) - lineX(line, b)), `${name}: ${a} and ${b}`).toBeGreaterThanOrEqual(60);
      }
      expect(Math.max(...rows.values()), name).toBeLessThanOrEqual(2);
      if (Math.max(...rows.values()) > 0) lowered++;
    }
    expect(lowered).toBeGreaterThan(0); // close numbers do come up, and go on a second row
  });
});
