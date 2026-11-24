// The Earth on screen, for the questions and the Meetings: one canvas that draws the flat map or the globe, turns the globe smoothly to
// where a lesson points, puts a small globe beside the map when a lesson turns to a place (so the map and the globe are seen to be the
// same Earth), draws the sun's light for Hot and Cold, and turns a tap into a longitude and latitude. On a narrow screen the map zooms in
// on Europe whenever Europe is part of the question, rather than shrinking it.
import { useEffect, useRef } from 'preact/hooks';
import { drawGlobe, drawMap, globePoint, type EarthLook, type Mark } from './art/earth';
import { mapScale, mapToLonLat, unOrtho, WORLD, type LonLat, type MapView } from './map/geo';
import type { Surface } from './questions/problems';
import type { ContinentId } from './world/continents';

export interface EarthProps {
  readonly surface: Surface;
  readonly look: EarthLook;
  /** Turn to this place (a lesson): the globe turns; the map gets a small globe beside it. */
  readonly face?: LonLat | null;
  /** Sun's light (Hot and Cold lessons). */
  readonly rays?: boolean;
  /** Zoom the map in on Europe on a narrow screen. */
  readonly europe?: boolean;
  /** A finger just over the globe's rim counts as the nearest point on it ("Tap the North Pole": the pole is the very top). */
  readonly rim?: boolean;
  readonly onTap?: (at: LonLat | null, px: { x: number; y: number }) => void;
  readonly label: string;
  readonly class?: string;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const NARROW = 560;
/** How far past the globe's rim (in radii) a finger still counts as on it, when `rim` is set. */
const RIM_GRAB = 1.3;
/** The map's view for a w×h canvas. */
export function mapViewFor(w: number, _h: number, europe: boolean, base?: MapView): MapView {
  if (base) return base;
  if (europe && w < NARROW) return { lon: 18, lat: 42, zoom: 2.3 };
  return WORLD;
}

export function EarthView({ surface, look, face, rays, europe, rim, onTap, label, class: k = '' }: EarthProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const props = useRef({ surface, look, face, rays, europe });
  props.current = { surface, look, face, rays, europe };
  const view = useRef<{ lon: number; lat: number }>(surface.s === 'globe' ? { lon: surface.lon, lat: surface.lat } : { lon: 0, lat: 0 });
  const inset = useRef<{ lon: number; lat: number } | null>(null);
  const geom = useRef({ w: 0, h: 0, cx: 0, cy: 0, r: 0, mapView: WORLD as MapView });

  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext('2d')!;
    let raf = 0, last = 0;
    const still = reduced();
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const t = ms / 1000, dt = last ? Math.min(.1, t - last) : 0;
      last = t;
      const b = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!b.width || !b.height) return;
      if (c.width !== Math.round(b.width * dpr) || c.height !== Math.round(b.height * dpr)) { c.width = Math.round(b.width * dpr); c.height = Math.round(b.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, b.width, b.height);
      const p = props.current, W = b.width, H = b.height;
      const ease = (from: { lon: number; lat: number }, to: LonLat) => {
        const k = still ? 1 : Math.min(1, dt * 2.6), dl = ((to.lon - from.lon + 540) % 360) - 180;
        return { lon: from.lon + dl * k, lat: from.lat + (Math.max(-70, Math.min(70, to.lat)) - from.lat) * k };
      };
      const lk: EarthLook = { ...p.look, t };
      if (p.surface.s === 'globe') {
        const target = p.face ?? { lon: p.surface.lon, lat: p.surface.lat };
        view.current = ease(view.current, target);
        const r = Math.min(W, H) * .46, cx = W / 2, cy = H / 2;
        geom.current = { ...geom.current, w: W, h: H, cx, cy, r };
        drawGlobe(ctx, cx, cy, r, view.current, lk);
        if (p.rays) drawRays(ctx, cx, cy, r, t);
      } else {
        const mv = mapViewFor(W, H, !!p.europe, p.surface.view);
        geom.current = { ...geom.current, w: W, h: H, mapView: mv };
        drawMap(ctx, W, H, mv, lk);
        // the small globe beside the map, turned to the lesson's place (or lit by the sun)
        if (p.face || p.rays) {
          const target = p.face ?? { lon: 20, lat: 0 };
          inset.current = ease(inset.current ?? { lon: target.lon - 60, lat: 0 }, target);
          const r = Math.min(W, H) * .2, cx = r + 10, cy = H - r - 10;
          ctx.fillStyle = 'rgba(3,4,12,.75)'; ctx.beginPath(); ctx.arc(cx, cy, r * 1.12, 0, Math.PI * 2); ctx.fill();
          drawGlobe(ctx, cx, cy, r, inset.current, { glow: p.look.glow, ocean: p.look.ocean, belt: p.rays || p.look.belt, t, lw: 1.5 });
          if (p.rays) drawRays(ctx, cx, cy, r, t);
        } else inset.current = null;
      }
    };
    raf = requestAnimationFrame(loop);
    // the browser tour taps a place as a child would, finding where it is drawn (tools/globe-hopper/tour.ts)
    if (import.meta.env.DEV && onTap) (window as unknown as { __earth: unknown }).__earth = { point: (at: LonLat) => screenOf(at) };
    return () => cancelAnimationFrame(raf);
  }, []);

  /** Where a place is drawn on screen now, and whether it is on the near side of the globe (or on the map at all). */
  function screenOf(at: LonLat): { x: number; y: number; front: boolean } {
    const b = canvas.current!.getBoundingClientRect(), g = geom.current;
    if (surface.s === 'globe') { const p = globePoint(at, view.current, g.cx, g.cy, g.r); return { x: b.left + p.x, y: b.top + p.y, front: p.z > .25 }; }
    const { x, y } = mapScale(g.w, g.h, g.mapView), px = x(at.lon), py = y(at.lat);
    return { x: b.left + px, y: b.top + py, front: px > 4 && px < g.w - 4 && py > 4 && py < g.h - 4 };
  }

  function tap(e: PointerEvent) {
    if (!onTap) return;
    const b = canvas.current!.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, g = geom.current;
    if (surface.s === 'globe') {
      let gx = (x - g.cx) / g.r, gy = (y - g.cy) / g.r;
      const rho = Math.hypot(gx, gy);
      if (rim && rho > 1 && rho < RIM_GRAB) { gx *= .999 / rho; gy *= .999 / rho; }
      onTap(unOrtho(gx, gy, view.current.lon, view.current.lat), { x: e.clientX, y: e.clientY });
    }
    else {
      const at = mapToLonLat(x, y, g.w, g.h, g.mapView);
      onTap(Math.abs(at.lat) <= 90 && Math.abs(at.lon) <= 180 ? at : null, { x: e.clientX, y: e.clientY });
    }
  }
  return <canvas ref={canvas} class={`gh-earth ${surface.s} ${k}`} aria-label={label} role="img" onPointerDown={e => { e.preventDefault(); tap(e as unknown as PointerEvent); }} />;
}

/** The sun's light from the left: straight onto the equator, slanting across the poles. */
function drawRays(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number) {
  ctx.save();
  const sunX = cx - r * 1.9;
  ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#14161b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(Math.max(r * .25, sunX), cy, r * .22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  for (const f of [-.85, -.55, 0, .55, .85]) {
    const y = cy + f * r, edge = cx - Math.sqrt(Math.max(0, r * r - (f * r) ** 2));
    const strong = Math.abs(f) < .3, a = .55 + .35 * Math.sin(t * 4 + f * 3);
    ctx.strokeStyle = strong ? `rgba(255,140,0,${a})` : `rgba(255,220,90,${a * .8})`; ctx.lineWidth = strong ? 7 : 4;
    ctx.beginPath(); ctx.moveTo(Math.max(r * .45, sunX + r * .3), y); ctx.lineTo(edge, y); ctx.stroke();
    // where it lands: a short bright patch on the equator, a long thin smear near the poles
    ctx.strokeStyle = strong ? 'rgba(255,120,0,.85)' : 'rgba(255,240,170,.75)'; ctx.lineWidth = strong ? 9 : 4;
    const ang = Math.asin(Math.max(-1, Math.min(1, f))), len = strong ? r * .08 : r * .3;
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI - ang - (len / r) / 2, Math.PI - ang + (len / r) / 2); ctx.stroke();
  }
  ctx.restore();
}

export type { Mark, ContinentId };
