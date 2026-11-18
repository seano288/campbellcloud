import { seeded } from '../../../src/game/rng';
import { makeQuestion, type Kind, type Level } from '../../../src/deep-light/science/problems';
import { trace } from '../../../src/deep-light/science/optics';
const rng = seeded(42);
const KINDS: Kind[] = ['see', 'through', 'shadow', 'mirror', 'sound', 'signal'];
function draw(lab: any, turns?: number[]) {
  const l = turns ? { ...lab, mirrors: lab.mirrors.map((m: any, i: number) => ({ ...m, turn: turns[i] })) } : lab;
  const b = trace(l);
  const g: string[][] = Array.from({ length: l.h }, () => Array(l.w).fill('.'));
  for (const p of b.points) if (Number.isInteger(p.x) && Number.isInteger(p.y)) g[p.y]![p.x] = '*';
  g[l.lamp.y][l.lamp.x] = 'L>v<^'[[0, 2, 4, 6].indexOf(l.lamp.dir) + 1] ?? 'L';
  g[l.gem.y][l.gem.x] = 'G';
  for (const m of l.mirrors) g[m.y][m.x] = '-\\|/'[m.turn];
  return g.map(r => r.join('')).join('\n') + `  end=${b.end}`;
}
for (const k of KINDS) for (const L of [1, 2, 3] as Level[]) {
  const counts = new Map<string, number>();
  const qs = Array.from({ length: 300 }, (_, i) => makeQuestion(k, L, (i % 3) as 0, rng));
  for (const q of qs) { const key = JSON.stringify({ ...q, lab: undefined, spots: undefined }); counts.set(key, (counts.get(key) ?? 0) + 1); }
  console.log(`\n=== ${k} L${L}: ${counts.size} distinct of 300`);
  for (const q of qs.slice(0, k === 'mirror' && L > 1 ? 3 : 8)) {
    console.log(JSON.stringify({ ...q, lab: undefined, spots: (q as any).spots }));
    if ('lab' in q) { console.log(draw(q.lab)); if (q.form !== 'spot') console.log('answer:\n' + draw(q.lab, q.answer.split(',').map(Number))); }
  }
}
