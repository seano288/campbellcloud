// The pictures the brief makes rules about, checked on what the views actually draw (their component trees, expanded without a DOM):
// tally marks are bundles of four up and the fifth across; Podium always draws the finish line and the arrow the cars drive, the front
// car nearest the finish, and never a number on a car; each Podium colour has its own roof symbol; the number line never prints two
// numbers over each other; and the "how many more" lesson pairs off two bars side by side, so no pairing line crosses the third.
import { describe, expect, it } from 'vitest';
import type { VNode } from 'preact';
import { seeded } from '../game/rng';
import { lessonFor } from './tally/teach';
import { CAR_COLOURS, COLOUR_ART, makeChart, makeOrder, makePlace, type PlaceProblem } from './tally/problems';
import { Chart, NumberLine, Road, TallyMarks } from './views';

type Node = VNode<Record<string, unknown>> | string | number | null | undefined | boolean | Node[];
/** Expands a component tree into plain elements: function components (none of these use hooks) are called with their props. */
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
const classOf = (v: VNode<Record<string, unknown>>) => String(v.props.class ?? '');
const text = (n: Node): string => Array.isArray(n) ? n.map(text).join('') : n && typeof n === 'object' ? text(n.props.children as Node) : typeof n === 'string' || typeof n === 'number' ? String(n) : '';

describe('tally marks on the pit board', () => {
  it('are bundles of five, four up and the fifth across, then the loose marks', () => {
    for (let n = 1; n <= 30; n++) {
      const lines = [...walk(expand(TallyMarks({ n }) as Node))].filter(v => v.type === 'line');
      const across = lines.filter(v => classOf(v).includes('across')), up = lines.filter(v => !classOf(v).includes('across'));
      expect(across, `n=${n}`).toHaveLength(Math.floor(n / 5));
      expect(up, `n=${n}`).toHaveLength(Math.floor(n / 5) * 4 + (n % 5));
      // each across mark crosses its own four: it starts left of the first and ends right of the fourth
      for (const [g, a] of across.entries()) {
        const four = up.slice(g * 4, g * 4 + 4).map(v => Number(v.props.x1));
        expect(Number(a.props.x1)).toBeLessThan(Math.min(...four));
        expect(Number(a.props.x2)).toBeGreaterThan(Math.max(...four));
      }
    }
  });
});

describe('Podium pictures', () => {
  const lesson = () => lessonFor(new AbortController().signal);
  const roads = function* () {
    for (const level of [1, 2, 3] as const) for (const stretch of [0, 1, 2] as const) for (let s = 1; s <= 60; s++) {
      const q = makePlace(level, stretch, seeded(s * 7 + level * 3 + stretch));
      yield { q, tree: expand(Road({ q, lesson: lesson(), wrong: [], done: null }) as Node) };
    }
  };
  it('always draw the finish line and the arrow the cars drive', () => {
    for (const { tree } of roads()) {
      const all = [...walk(tree)];
      expect(all.some(v => classOf(v) === 'finish')).toBe(true);
      expect(all.some(v => classOf(v) === 'way')).toBe(true);
    }
  });
  it('stand in single file, the front car right next to the finish, and no car carries a number', () => {
    for (const { q, tree } of roads()) {
      const lane = [...walk(tree)].find(v => classOf(v) === 'lane')!;
      const kids = (lane.props.children as Node[]).flat(3).filter(k => k && typeof k === 'object') as VNode<Record<string, unknown>>[];
      // left to right: the back car first, then each car ahead of it, then the finish
      expect(classOf(kids.at(-1)!)).toBe('finish');
      const cars = kids.slice(0, -1);
      expect(cars).toHaveLength(q.cars.length);
      const colours = cars.map(c => [...walk(c)].map(v => String(v.props.fill ?? '')).find(f => Object.values(COLOUR_ART).some(a => a.fill === f)));
      expect(colours).toEqual([...q.cars].reverse().map(c => COLOUR_ART[c as PlaceProblem['cars'][number]].fill));
      for (const c of cars) expect(text(c), 'a number on a car').not.toMatch(/\d/);
    }
  });
  it('tell every colour apart by its own roof symbol too', () => {
    const symbols = CAR_COLOURS.map(c => COLOUR_ART[c].symbol), fills = CAR_COLOURS.map(c => COLOUR_ART[c].fill);
    expect(new Set(symbols).size).toBe(CAR_COLOURS.length);
    expect(new Set(fills).size).toBe(CAR_COLOURS.length);
  });
});

describe('the number line', () => {
  it('never prints two numbers on top of each other', () => {
    const check = (nums: number[], marks: number[] = []) => {
      const labels = [...walk(expand(NumberLine({ nums, focus: null, marks }) as Node))]
        .filter(v => v.type === 'text' && !classOf(v).includes('nl-label')).map(v => ({ x: Number(v.props.x), y: Number(v.props.y) }));
      expect(labels).toHaveLength(nums.length + marks.length);
      for (const [i, a] of labels.entries()) for (const b of labels.slice(i + 1)) expect(Math.abs(a.x - b.x) >= 30 || Math.abs(a.y - b.y) >= 34, JSON.stringify({ nums, marks })).toBe(true);
    };
    check([64, 56, 89], [65, 81]);
    check([31, 32, 33]);
    for (let s = 1; s <= 300; s++) for (const level of [1, 2, 3] as const) for (const stretch of [0, 1, 2] as const) {
      const q = makeOrder(level, stretch, seeded(s * 13 + level + stretch * 5));
      check([...q.nums], q.form === 'between' ? [q.lo, q.hi] : []);
    }
  });
});

describe('the Race Chart lesson for "how many more"', () => {
  it('pairs off two bars that stand side by side, so no line crosses the third bar', () => {
    let apart = 0;
    for (let s = 1; s <= 400; s++) for (const stretch of [0, 1, 2] as const) {
      const q = makeChart(3, stretch, seeded(s * 17 + stretch));
      if (q.form !== 'more') continue;
      for (const show of ['pairs', 'left']) {
        const lesson = lessonFor(new AbortController().signal);
        lesson.show.value = show;
        const all = [...walk(expand(Chart({ q, lesson, wrong: [], done: null }) as Node))];
        // where each bar stands once the lesson has moved them: its drawn x plus the column's slide
        const cols = all.filter(v => classOf(v).startsWith('col ')).map(col => {
          const slide = Number(/translateX\((-?[\d.]+)px\)/.exec(String((col.props.style as { transform: string }).transform))![1]);
          const rect = [...walk(col.props.children as Node)].find(v => v.type === 'rect');
          return rect ? [Number(rect.props.x) + slide, Number(rect.props.x) + slide + Number(rect.props.width)] as const : null;
        });
        const pairs = all.filter(v => classOf(v) === 'pair');
        expect(pairs.length, JSON.stringify(q)).toBe(Math.min(...q.rows.filter(r => r.car === q.car || r.car === q.other).map(r => r.wins)));
        const [lo, hi] = [Math.min(Number(pairs[0]!.props.x1), Number(pairs[0]!.props.x2)), Math.max(Number(pairs[0]!.props.x1), Number(pairs[0]!.props.x2))];
        for (const c of cols) if (c) expect(c[1] <= lo + .5 || c[0] >= hi - .5, JSON.stringify({ q, show, c, lo, hi })).toBe(true);
        if (Math.abs(q.rows.findIndex(r => r.car === q.car) - q.rows.findIndex(r => r.car === q.other)) === 2) apart++;
      }
    }
    expect(apart).toBeGreaterThan(0); // the case that used to cross was met
  });
});
