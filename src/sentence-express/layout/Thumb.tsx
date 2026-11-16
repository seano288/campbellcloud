// A little picture of his Layout for the Home tile: the table with its wooden rim, the track as lines, the things he has put on it as
// little green bumps, and the stations as dots.
import { bits, isCurve, xyOf, type Dir, type Layout } from './track';

const MID: Record<Dir, [number, number]> = { 1: [.5, 0], 2: [1, .5], 4: [.5, 1], 8: [0, .5] };

export function LayoutThumb({ layout: l }: { layout: Layout }) {
  const paths: string[] = [];
  l.cells.forEach((m, c) => {
    if (!m) return;
    const { x, y } = xyOf(l, c), ds = bits(m);
    if (isCurve(m)) { const [a, b] = ds as [Dir, Dir]; paths.push(`M${x + MID[a][0]} ${y + MID[a][1]} Q${x + .5} ${y + .5} ${x + MID[b][0]} ${y + MID[b][1]}`); return; }
    for (const d of ds) paths.push(`M${x + .5} ${y + .5} L${x + MID[d][0]} ${y + MID[d][1]}`);
  });
  return (
    <svg class="layout-thumb" viewBox={`-.3 -.3 ${l.w + .6} ${l.h + .6}`} aria-hidden="true">
      <rect x="-.3" y="-.3" width={l.w + .6} height={l.h + .6} rx=".5" fill="#c9a46a" stroke="#1d1d1f" stroke-width=".12" />
      <rect x="0" y="0" width={l.w} height={l.h} rx=".3" fill="#e9cf9c" />
      {l.scenery.map(s => { const { x, y } = xyOf(l, s.cell); return <circle key={`${s.id}${s.cell}`} cx={x + .5} cy={y + .5} r=".3" fill="#3f9a3a" stroke="#1d1d1f" stroke-width=".08" />; })}
      <path d={paths.join(' ')} fill="none" stroke="#1d1d1f" stroke-width=".42" stroke-linecap="round" />
      <path d={paths.join(' ')} fill="none" stroke="#b07a4a" stroke-width=".22" stroke-linecap="round" />
      {l.stations.map(s => { const { x, y } = xyOf(l, s.cell); return <circle key={s.id} cx={x + .5} cy={y + .5} r=".42" fill={s.id === 'town' ? '#ffd23f' : '#e63946'} stroke="#1d1d1f" stroke-width=".1" />; })}
    </svg>
  );
}
