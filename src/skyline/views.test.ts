// The pictures the brief makes rules about, checked on what the views actually draw (their trees, expanded without a DOM): every
// building front is a full rectangle of windows, its rows the lines that go across.
import { describe, expect, it } from 'vitest';
import type { VNode } from 'preact';
import { Building } from './views';

type Node = VNode<Record<string, unknown>> | string | number | null | undefined | boolean | Node[];
function expand(n: Node): Node {
  if (Array.isArray(n)) return n.map(expand);
  if (!n || typeof n !== 'object') return n;
  if (typeof n.type === 'function') return expand((n.type as (p: unknown) => Node)(n.props));
  return { ...n, props: { ...n.props, children: expand(n.props.children as Node) } } as Node;
}
function* walk(n: Node): Generator<VNode<Record<string, unknown>>> {
  if (Array.isArray(n)) { for (const c of n) yield* walk(c); return; }
  if (!n || typeof n !== 'object') return;
  yield n;
  yield* walk(n.props.children as Node);
}

describe('a building front', () => {
  it('is a full rectangle of windows: rows across, the same number in every row', () => {
    for (let rows = 1; rows <= 10; rows++) for (let cols = 1; cols <= 10; cols++) {
      if (rows * cols > 50) continue;
      const wins = [...walk(expand(Building({ g: { rows, cols } }) as Node))].filter(v => v.type === 'rect' && String(v.props.class).includes('win'));
      expect(wins).toHaveLength(rows * cols);
      const ys = [...new Set(wins.map(w => Number(w.props.y)))].sort((a, b) => a - b), xs = [...new Set(wins.map(w => Number(w.props.x)))];
      expect(ys).toHaveLength(rows); // one line of windows per row, going across
      expect(xs).toHaveLength(cols);
      for (const y of ys) expect(wins.filter(w => Number(w.props.y) === y)).toHaveLength(cols);
    }
  });
});
