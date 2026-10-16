// An Aircraft seen from above, nose up, drawn as SVG from the same spec the 3D model is built from: fuselage and pods
// from their sections, wings and tails from their planforms, the canopy in glass blue and propellers as discs.
import type { JetId } from './catalog';
import { JETS } from './jets';
import { sectionAt } from './three/geometry';
import type { JetSpec } from './three/spec';

type Pt = [number, number];

/** Outlines in top view: [x across (z), y along (aircraft x)], in metres. */
export function topView(spec: JetSpec) {
  const shapes: { pts: Pt[]; kind: 'body' | 'glass' | 'disc' }[] = [];
  for (const b of spec.bodies) {
    if (b.part === 'nacelle' && spec.id !== 'v22') continue;
    const at = sectionAt(b.sections), xs = b.sections.map(s => s.x), x0 = Math.min(...xs), x1 = Math.max(...xs);
    for (const z of b.mirror && b.z ? [b.z, -b.z] : [b.z ?? 0]) {
      const right: Pt[] = [], left: Pt[] = [];
      for (let i = 0; i <= 24; i++) { const x = x0 + ((x1 - x0) * i) / 24, w = at(x).w; right.push([z + w, x]); left.unshift([z - w, x]); }
      shapes.push({ pts: [...right, ...left], kind: b.finish === 'glass' ? 'glass' : 'body' });
    }
  }
  for (const s of spec.surfaces) {
    if (s.kind === 'fin' && Math.abs(s.stations[0]!.le[2] - s.stations[s.stations.length - 1]!.le[2]) < 0.5) continue; // upright fins barely show from above
    for (const m of s.mirror === false ? [1] : [1, -1]) {
      shapes.push({ kind: 'body', pts: [...s.stations.map(st => [m * st.le[2], st.le[0]] as Pt), ...[...s.stations].reverse().map(st => [m * st.le[2], st.le[0] + st.chord] as Pt)] });
    }
  }
  for (const p of spec.props ?? []) for (const z of p.mirror && p.at[2] ? [p.at[2], -p.at[2]] : [p.at[2]]) {
    const n = 28, pts: Pt[] = [];
    if (spec.id === 'v22') for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([z + Math.cos(a) * p.r, p.at[0] + 2.3 + Math.sin(a) * p.r]); }
    else pts.push([z - p.r, p.at[0] - 0.05], [z + p.r, p.at[0] - 0.05], [z + p.r, p.at[0] + 0.12], [z - p.r, p.at[0] + 0.12]);
    shapes.push({ pts, kind: 'disc' });
  }
  return shapes;
}

const cache = new Map<JetId, { d: string; glass: string; disc: string; box: [number, number, number, number] }>();
function paths(jet: JetId) {
  let c = cache.get(jet);
  if (!c) {
    const shapes = topView(JETS[jet]), all = shapes.flatMap(s => s.pts);
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const path = (kind: string) => shapes.filter(s => s.kind === kind).map(s => `M${s.pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`).join('');
    c = { d: path('body'), glass: path('glass'), disc: path('disc'), box: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)] };
    cache.set(jet, c);
  }
  return c;
}

export function JetArt({ jet, color = '#c9d1d9', class: cls = '' }: { jet: JetId; color?: string; class?: string }) {
  const { d, glass, disc, box } = paths(jet), pad = 0.6;
  return (
    <svg class={`jet-art ${cls}`} viewBox={`${box[0] - pad} ${box[1] - pad} ${box[2] + pad * 2} ${box[3] + pad * 2}`} aria-hidden="true">
      {disc && <path d={disc} fill="#00000033" />}
      <path d={d} fill={color} stroke="#0008" stroke-width={0.08} stroke-linejoin="round" />
      {glass && <path d={glass} fill="#7cc8ff" stroke="#0006" stroke-width={0.06} />}
    </svg>
  );
}
