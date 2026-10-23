// A Helicopter seen from above, nose up, drawn as SVG from the same spec the 3D model is built from: fuselage and pods
// from their sections, stub wings and tailplanes from their planforms, the canopy in glass blue, and each main rotor as
// a soft disc with its blades.
import type { HeliId } from './catalog';
import { HELIS } from './helis';
import { sectionAt } from '../../time-flies/hangar/three/geometry';
import type { HeliSpec } from './three/spec';

type Pt = [number, number];

/** Outlines in top view: [x across (z), y along (helicopter x)], in metres. */
export function topView(spec: HeliSpec) {
  const shapes: { pts: Pt[]; kind: 'body' | 'glass' | 'disc' | 'blade' }[] = [];
  for (const b of spec.bodies) {
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
  for (const r of spec.rotors.filter(r => r.kind === 'main')) {
    const n = 40, pts: Pt[] = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([r.at[2] + Math.cos(a) * r.r, r.at[0] + Math.sin(a) * r.r]); }
    shapes.push({ pts, kind: 'disc' });
    for (let k = 0; k < r.blades; k++) {
      const a = Math.PI / 4 + (k * Math.PI * 2) / r.blades, c = Math.cos(a), s = Math.sin(a), w = r.chord / 2;
      shapes.push({ kind: 'blade', pts: [[r.at[2] - s * w, r.at[0] + c * w], [r.at[2] + c * r.r - s * w, r.at[0] + s * r.r + c * w], [r.at[2] + c * r.r + s * w, r.at[0] + s * r.r - c * w], [r.at[2] + s * w, r.at[0] - c * w]] });
    }
  }
  return shapes;
}

const cache = new Map<HeliId, Record<'d' | 'glass' | 'disc' | 'blade', string> & { box: [number, number, number, number] }>();
function paths(heli: HeliId) {
  let c = cache.get(heli);
  if (!c) {
    const shapes = topView(HELIS[heli]), all = shapes.flatMap(s => s.pts);
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const path = (kind: string) => shapes.filter(s => s.kind === kind).map(s => `M${s.pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`).join('');
    c = { d: path('body'), glass: path('glass'), disc: path('disc'), blade: path('blade'), box: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)] };
    cache.set(heli, c);
  }
  return c;
}

export function HeliArt({ heli, color = '#c9d1d9', class: cls = '' }: { heli: HeliId; color?: string; class?: string }) {
  const { d, glass, disc, blade, box } = paths(heli), pad = 0.4;
  return (
    <svg class={`heli-art ${cls}`} viewBox={`${box[0] - pad} ${box[1] - pad} ${box[2] + pad * 2} ${box[3] + pad * 2}`} aria-hidden="true">
      <path d={disc} fill="#00000022" />
      <path d={d} fill={color} stroke="#0008" stroke-width={0.1} stroke-linejoin="round" />
      {glass && <path d={glass} fill="#7cc8ff" stroke="#0006" stroke-width={0.08} />}
      <path d={blade} fill="#1b1d21cc" />
    </svg>
  );
}
