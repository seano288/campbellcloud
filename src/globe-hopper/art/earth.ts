// The Earth drawn in code on a 2D canvas, two ways, with the same colours: the flat map (north at the top, the Pacific split at the left
// and right edges, Antarctica the white band along the bottom) and the globe (seen from straight above a point, the far side hidden). The
// outlines are the small Natural Earth table (world/outlines.gen.ts); each continent keeps one colour everywhere.
//
// The globe is fast enough to turn every frame on an iPad 9: about 6,000 points, each turned by one small matrix, filled once a frame. A
// point on the far side is pulled to the rim, which keeps a shape that crosses the edge whole. Countries are stroked first and filled after,
// so the borders inside a continent vanish and only coasts keep their dark outline.
import { CONTINENTS, APART_COLOURS, type ContinentId } from '../world/continents';
import { OCEANS, type OceanId } from '../world/oceans';
import { LAKE_RINGS, MAP_BOTTOM, MAP_TOP, mapScale, REGIONS, type LandGroup, type LonLat, type MapView } from '../map/geo';

export const WATER = '#2f7fd6', WATER_DEEP = '#1d5fb0', OUTLINE = '#14161b';
const colourOf = (g: LandGroup): string => (g in APART_COLOURS ? APART_COLOURS[g as keyof typeof APART_COLOURS] : CONTINENTS.find(c => c.id === g)!.colour);
const GREY = '#b9c3cc';

// ---------- the ocean shapes a lesson fills with colour ----------

type Ring = readonly (readonly [number, number])[];
const band = (a: number, b: number): Ring => [[-180, a], [180, a], [180, b], [-180, b]];
const OCEAN_FILL: Record<OceanId, { tint: Ring[]; cover?: Ring[] }> = {
  southern: { tint: [band(-90, -60)] },
  arctic: { tint: [band(66, 90)] },
  atlantic: { tint: [[[-67, -60], [20, -60], [20, -34], [10, 2], [-6, 36], [-6, 62], [-25, 66], [-90, 66], [-100, 30], [-98, 18], [-84, 10], [-77, 8], [-72, -10], [-71, -40], [-68, -56]]] },
  indian: { tint: [[[20, -60], [147, -60], [147, -40], [130, -12], [115, -8], [100, 4], [100, 25], [50, 30], [32, 31], [20, -34]]] },
  pacific: { tint: [band(-60, 66)], cover: [] },
};
OCEAN_FILL.pacific.cover = [...OCEAN_FILL.atlantic.tint, ...OCEAN_FILL.indian.tint];
/** Long straight edges are cut into short steps, so they curve on the globe. */
function densify(r: Ring): Float32Array {
  const out: number[] = [];
  for (let i = 0; i < r.length; i++) {
    const [x1, y1] = r[i]!, [x2, y2] = r[(i + 1) % r.length]!, n = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 3));
    for (let k = 0; k < n; k++) out.push(x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n);
  }
  return Float32Array.from(out);
}
const OCEAN_RINGS = Object.fromEntries(Object.entries(OCEAN_FILL).map(([id, f]) => [id, { tint: f.tint.map(densify), cover: (f.cover ?? []).map(densify) }])) as Record<OceanId, { tint: Float32Array[]; cover: Float32Array[] }>;

// ---------- what a drawing shows ----------

export interface Mark { readonly at: LonLat; readonly kind: 'pin' | 'ring' | 'snow' | 'sun' | 'dot' | 'glow' | 'star'; readonly label?: string; readonly colour?: string }
export interface EarthLook {
  /** Continents lit as choices: the rest are greyed. Undefined: all in their colours. */
  readonly lit?: readonly ContinentId[];
  /** A continent glowing (a lesson, a hint). */
  readonly glow?: ContinentId | null;
  /** An ocean filled with its colour. */
  readonly ocean?: OceanId | null;
  /** The equator drawn as a belt round the middle. */
  readonly belt?: boolean;
  /** Poles marked. */
  readonly poles?: boolean;
  readonly marks?: readonly Mark[];
  /** Names written on the continents. */
  readonly names?: boolean;
  readonly night?: boolean;
  /** Line width of the coasts, in pixels. */
  readonly lw?: number;
  /** Seconds, for pulses. */
  readonly t?: number;
}

const fillOf = (g: LandGroup, look: EarthLook) => {
  if (look.lit && !(look.lit as readonly string[]).includes(g)) return GREY;
  return colourOf(g);
};

// ---------- the globe ----------

/** Each ring's points as unit vectors, made once. */
const toVec = (r: Float32Array) => {
  const v = new Float32Array((r.length / 2) * 3);
  for (let i = 0, j = 0; i < r.length; i += 2, j += 3) {
    const lon = (r[i]! * Math.PI) / 180, lat = (r[i + 1]! * Math.PI) / 180, c = Math.cos(lat);
    v[j] = c * Math.sin(lon); v[j + 1] = Math.sin(lat); v[j + 2] = c * Math.cos(lon);
  }
  return v;
};
const VREGIONS = REGIONS.map(g => ({ id: g.id, rings: g.rings.map(toVec) }));
const VLAKES = LAKE_RINGS.map(toVec);
const VOCEANS = Object.fromEntries(Object.entries(OCEAN_RINGS).map(([id, f]) => [id, { tint: f.tint.map(toVec), cover: f.cover.map(toVec) }])) as Record<OceanId, { tint: Float32Array[]; cover: Float32Array[] }>;

export interface GlobeView { readonly lon: number; readonly lat: number }
/** The turn that takes a point on the Earth to where it shows on the globe: x right, y up, z toward him. */
function turner(v: GlobeView) {
  const l = (-v.lon * Math.PI) / 180, p = (v.lat * Math.PI) / 180, cl = Math.cos(l), sl = Math.sin(l), cp = Math.cos(p), sp = Math.sin(p);
  return (x: number, y: number, z: number) => {
    const x1 = x * cl + z * sl, z1 = -x * sl + z * cl; // spin about the pole
    return [x1, y * cp - z1 * sp, y * sp + z1 * cp] as const; // tip toward him
  };
}

function globePath(ctx: CanvasRenderingContext2D, vec: Float32Array, turn: ReturnType<typeof turner>, cx: number, cy: number, r: number): boolean {
  let seen = false;
  const n = vec.length / 3;
  for (let i = 0; i < n; i++) {
    let [x, y, z] = turn(vec[i * 3]!, vec[i * 3 + 1]!, vec[i * 3 + 2]!);
    if (z >= 0) seen = true;
    else { const k = 1 / Math.max(1e-6, Math.hypot(x, y)); x *= k; y *= k; }
    if (i === 0) ctx.moveTo(cx + x * r, cy - y * r); else ctx.lineTo(cx + x * r, cy - y * r);
  }
  ctx.closePath();
  return seen;
}

/** Where a point shows on the globe, and whether it's on the near side. */
export function globePoint(at: LonLat, v: GlobeView, cx: number, cy: number, r: number) {
  const lon = (at.lon * Math.PI) / 180, lat = (at.lat * Math.PI) / 180, c = Math.cos(lat);
  const [x, y, z] = turner(v)(c * Math.sin(lon), Math.sin(lat), c * Math.cos(lon));
  return { x: cx + x * r, y: cy - y * r, front: z > 0, z };
}

export function drawGlobe(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, v: GlobeView, look: EarthLook = {}) {
  const turn = turner(v), lw = look.lw ?? Math.max(1.5, r / 90);
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // the sea, a little lighter in the middle
  const sea = ctx.createRadialGradient(cx - r * .3, cy - r * .35, r * .1, cx, cy, r);
  sea.addColorStop(0, look.night ? '#2b5c9e' : '#4f9ae6'); sea.addColorStop(1, look.night ? '#0d2a55' : WATER_DEEP);
  ctx.fillStyle = sea; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  if (look.ocean) {
    const o = VOCEANS[look.ocean], tint = OCEANS.find(x => x.id === look.ocean)!.tint;
    ctx.fillStyle = tint; ctx.beginPath(); for (const ring of o.tint) globePath(ctx, ring, turn, cx, cy, r); ctx.fill();
    if (o.cover.length) { ctx.fillStyle = WATER; ctx.beginPath(); for (const ring of o.cover) globePath(ctx, ring, turn, cx, cy, r); ctx.fill(); }
  }
  // coasts: stroke everything, then fill, so the borders inside a continent vanish
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = lw * 2;
  const paths = VREGIONS.map(g => { const p = new Path2D(); let any = false; for (const ring of g.rings) { const q = new Path2D(); if (globePath(q as unknown as CanvasRenderingContext2D, ring, turn, cx, cy, r)) { p.addPath(q); any = true; } } return { id: g.id, p, any }; });
  for (const g of paths) if (g.any) ctx.stroke(g.p);
  // a glowing continent: a wide pulsing halo stroked before the fills, so only its outer edge shows
  const glowing = look.glow ? paths.find(x => x.id === look.glow) : undefined;
  if (glowing?.any) { const pulse = .55 + .45 * Math.sin((look.t ?? 0) * 5); ctx.strokeStyle = `rgba(255,255,255,${pulse})`; ctx.lineWidth = lw * 7; ctx.stroke(glowing.p); ctx.strokeStyle = OUTLINE; ctx.lineWidth = lw * 2; ctx.stroke(glowing.p); }
  for (const g of paths) if (g.any) { ctx.fillStyle = fillOf(g.id, look); ctx.fill(g.p); }
  ctx.fillStyle = WATER; ctx.beginPath(); for (const ring of VLAKES) globePath(ctx, ring, turn, cx, cy, r); ctx.fill();
  if (look.belt) {
    ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = Math.max(3, r / 40); ctx.setLineDash([r / 14, r / 22]);
    ctx.beginPath(); let started = false;
    for (let lon = -180; lon <= 180; lon += 4) {
      const p = globePoint({ lon, lat: 0 }, v, cx, cy, r);
      if (p.front) { if (started) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); started = true; } } else started = false;
    }
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
  // shading and rim
  const shade = ctx.createRadialGradient(cx - r * .35, cy - r * .4, r * .2, cx, cy, r * 1.02);
  shade.addColorStop(0, 'rgba(255,255,255,.18)'); shade.addColorStop(.6, 'rgba(255,255,255,0)'); shade.addColorStop(1, look.night ? 'rgba(0,0,20,.55)' : 'rgba(0,0,40,.28)');
  ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = Math.max(3, lw * 1.6); ctx.stroke();
  if (look.poles) for (const lat of [90, -90]) { const p = globePoint({ lon: 0, lat }, v, cx, cy, r); if (p.z > -.05) drawMark(ctx, { at: { lon: 0, lat }, kind: 'dot', colour: '#ffffff', label: lat > 0 ? 'N' : 'S' }, p.x, p.y + (lat > 0 ? r / 30 : -r / 30), r / 9, look.t ?? 0); }
  if (look.names) for (const c of CONTINENTS) { const p = globePoint(c.safe, v, cx, cy, r); if (p.z > .35) label(ctx, c.name, p.x, p.y, Math.max(11, r / 11), c.ink); }
  for (const m of look.marks ?? []) { const p = globePoint(m.at, v, cx, cy, r); if (p.z > 0) drawMark(ctx, m, p.x, p.y, Math.max(16, r / 8), look.t ?? 0); }
  ctx.restore();
}

// ---------- the flat map ----------

export function drawMap(ctx: CanvasRenderingContext2D, w: number, h: number, view: MapView, look: EarthLook = {}) {
  const { s, x, y } = mapScale(w, h, view), lw = look.lw ?? Math.max(1.2, s * .35);
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = look.night ? '#0d2a55' : WATER; ctx.fillRect(x(-180), y(MAP_TOP), 360 * s, (MAP_TOP - MAP_BOTTOM) * s);
  ctx.save(); ctx.beginPath(); ctx.rect(x(-180), y(MAP_TOP), 360 * s, (MAP_TOP - MAP_BOTTOM) * s); ctx.clip();
  const ring = (p: Path2D | CanvasRenderingContext2D, r: Float32Array) => { for (let i = 0; i < r.length; i += 2) { const px = x(r[i]!), py = y(r[i + 1]!); if (i) p.lineTo(px, py); else p.moveTo(px, py); } p.closePath(); };
  if (look.ocean) {
    const o = OCEAN_RINGS[look.ocean], tint = OCEANS.find(z => z.id === look.ocean)!.tint;
    ctx.fillStyle = tint; ctx.beginPath(); for (const r of o.tint) ring(ctx, r); ctx.fill();
    if (o.cover.length) { ctx.fillStyle = WATER; ctx.beginPath(); for (const r of o.cover) ring(ctx, r); ctx.fill(); }
  }
  const paths = REGIONS.map(g => { const p = new Path2D(); for (const r of g.rings) ring(p, r); return { id: g.id, p }; });
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = lw * 2;
  for (const g of paths) ctx.stroke(g.p);
  const glowing = look.glow ? paths.find(z => z.id === look.glow) : undefined;
  if (glowing) { const pulse = .55 + .45 * Math.sin((look.t ?? 0) * 5); ctx.strokeStyle = `rgba(255,255,255,${pulse})`; ctx.lineWidth = lw * 8; ctx.stroke(glowing.p); ctx.strokeStyle = OUTLINE; ctx.lineWidth = lw * 2; ctx.stroke(glowing.p); }
  for (const g of paths) { ctx.fillStyle = fillOf(g.id, look); ctx.fill(g.p); }
  ctx.fillStyle = WATER; ctx.beginPath(); for (const r of LAKE_RINGS) ring(ctx, r); ctx.fill();
  if (look.belt) { ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = Math.max(3, s * .9); ctx.setLineDash([s * 6, s * 4]); ctx.beginPath(); ctx.moveTo(x(-180), y(0)); ctx.lineTo(x(180), y(0)); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.strokeRect(x(-180), y(MAP_TOP), 360 * s, (MAP_TOP - MAP_BOTTOM) * s);
  if (look.names) for (const c of CONTINENTS) label(ctx, c.name, x(c.safe.lon), y(c.safe.lat), Math.max(11, Math.min(20, s * 4.5)), c.ink);
  for (const m of look.marks ?? []) drawMark(ctx, m, x(m.at.lon), y(m.at.lat), Math.max(16, Math.min(30, s * 7)), look.t ?? 0);
  ctx.restore();
}

// ---------- marks and names ----------

function label(ctx: CanvasRenderingContext2D, text: string, px: number, py: number, size: number, ink: string) {
  ctx.font = `900 ${size}px Nunito, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = size * .28; ctx.strokeStyle = '#ffffff'; ctx.strokeText(text, px, py);
  ctx.fillStyle = ink; ctx.fillText(text, px, py);
}

export function drawMark(ctx: CanvasRenderingContext2D, m: Mark, px: number, py: number, size: number, t: number) {
  ctx.save();
  ctx.lineWidth = Math.max(2.5, size / 8); ctx.strokeStyle = OUTLINE;
  const pulse = 1 + .08 * Math.sin(t * 6);
  if (m.kind === 'pin') {
    ctx.fillStyle = m.colour ?? '#ffd23f';
    ctx.beginPath(); ctx.arc(px, py - size * .9, size * .55 * pulse, Math.PI * .85, Math.PI * 2.15); ctx.lineTo(px, py); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (m.label) { ctx.font = `900 ${size * .6}px Nunito, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = OUTLINE; ctx.fillText(m.label, px, py - size * .92); }
  } else if (m.kind === 'ring' || m.kind === 'glow') {
    ctx.strokeStyle = m.kind === 'glow' ? `rgba(255,255,255,${.5 + .4 * Math.sin(t * 5)})` : (m.colour ?? '#ffd23f');
    ctx.lineWidth = Math.max(4, size / 5); ctx.beginPath(); ctx.arc(px, py, size * .8 * pulse, 0, Math.PI * 2); ctx.stroke();
  } else if (m.kind === 'dot') {
    ctx.fillStyle = m.colour ?? '#ffd23f'; ctx.beginPath(); ctx.arc(px, py, size * .42 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    const glyph = m.kind === 'snow' ? '❄️' : m.kind === 'sun' ? '☀️' : '⭐';
    ctx.fillStyle = m.colour ?? '#ffffff'; ctx.beginPath(); ctx.arc(px, py, size * .62 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = `${size * .7}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(glyph, px, py + 1);
  }
  if (m.label && m.kind === 'dot') { ctx.font = `900 ${size * .5}px Nunito, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = OUTLINE; ctx.fillText(m.label, px, py + 1); }
  else if (m.label && m.kind !== 'pin') { ctx.font = `900 ${size * .62}px Nunito, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = size * .18; ctx.strokeStyle = '#fff'; ctx.strokeText(m.label, px, py + size * 1.15); ctx.fillStyle = OUTLINE; ctx.fillText(m.label, px, py + size * 1.15); }
  ctx.restore();
}

/** A continent's outline by itself, centred and fitted in a w×h box (Continents Level 3: "Which continent is this?"). */
export function drawShape(ctx: CanvasRenderingContext2D, id: ContinentId, w: number, h: number, colour: string) {
  const g = REGIONS.find(r => r.id === id)!;
  let x0 = 999, y0 = 999, x1 = -999, y1 = -999;
  // only the big pieces decide the frame, so far islands don't shrink the shape
  const big = g.rings.filter(r => r.length > 24);
  for (const r of big) for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]!); x1 = Math.max(x1, r[i]!); y0 = Math.min(y0, r[i + 1]!); y1 = Math.max(y1, r[i + 1]!); }
  if (id === 'antarctica') y0 = Math.max(y0, -84);
  const k = Math.cos((((y0 + y1) / 2) * Math.PI) / 180), sx = (x1 - x0) * Math.max(.5, k), sy = y1 - y0;
  const s = Math.min((w * .86) / sx, (h * .86) / sy);
  const X = (lon: number) => w / 2 + (lon - (x0 + x1) / 2) * s * Math.max(.5, k), Y = (lat: number) => h / 2 - (lat - (y0 + y1) / 2) * s;
  const p = new Path2D();
  for (const r of big) { for (let i = 0; i < r.length; i += 2) { if (i) p.lineTo(X(r[i]!), Y(Math.max(-84, r[i + 1]!))); else p.moveTo(X(r[i]!), Y(Math.max(-84, r[i + 1]!))); } p.closePath(); }
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 6; ctx.stroke(p); ctx.fillStyle = colour; ctx.fill(p); ctx.restore();
}
