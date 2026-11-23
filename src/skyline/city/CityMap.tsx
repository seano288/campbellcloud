// The City from above, alive: people walk the pavements, cars run the streets, and day turns slowly to night with the windows
// lighting up. He drags to look round and taps a plot to choose it. "Fly over" takes a slow helicopter pass across the whole City.
// Drawing is in paint.ts: one image per Block, redrawn only when it changes, and the moving pieces capped.
import { useEffect, useRef } from 'preact/hooks';
import { drawVehicle, reachAbove } from '../art/draw';
import { VEHICLES } from './catalog';
import { allPlots, designOf, nextBlock, population, type CityState } from './city';
import { blockRect, boundsOf, worldSize, type Pt } from './grid';
import { carsFor, drawCars, drawCity, drawWalkers, MAX_CARS, MAX_WALKERS, moveCars, walkersFor, type Camera } from './paint';

export const ZOOMS = [.45, .75, 1.1, 1.5] as const;
/** A full day in the City, in seconds: most of it day, then a night. */
const DAY_S = 100, NIGHT_S = 45;

export interface MapControl {
  /** Look at this world point. */
  look(p: Pt, zoom?: number): void;
  zoom(by: 1 | -1): void;
  fly(onDone: () => void): void;
  stopFlying(): void;
  setNight(night: boolean): void;
  /** Where a plot is on screen (CSS pixels), for the tour. */
  plotOnScreen(id: string): Pt | null;
}

export function CityMap({ city, selected, onTap, control, onNight }: {
  city: CityState; selected: string | null; onTap(plot: string | 'land' | null): void; control: { current: MapControl | null }; onNight?(night: boolean): void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ city, selected });
  live.current = { city, selected };

  useEffect(() => {
    const c = canvas.current!, g = c.getContext('2d')!, stop = new AbortController();
    const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
    let zi = 3, raf = 0, last = 0, clock = 0, night = false, flying: { t: number; done: () => void } | null = null;
    const start = blockRect(live.current.city.blocks[0] ?? 0);
    const cam: Camera = { x: start.x + start.w / 2, y: start.y + start.h / 2 + 30, zoom: 1 };
    let bounds = boundsOf(live.current.city.blocks), walkers = walkersFor(live.current.city, 0), cars = carsFor(bounds, 0), forBlocks = '';
    const people = () => {
      const s = live.current.city, key = `${s.blocks.join(',')}|${Object.keys(s.plots).length}`;
      if (key === forBlocks) return;
      forBlocks = key; bounds = boundsOf(s.blocks);
      const homes = Math.max(2, Math.round(population(s) / 6));
      walkers = walkersFor(s, Math.min(MAX_WALKERS, homes));
      cars = carsFor(bounds, Math.min(MAX_CARS, 2 + s.blocks.length));
    };
    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) c.width = Math.round(w * dpr);
      if (c.height !== Math.round(h * dpr)) c.height = Math.round(h * dpr);
      return dpr;
    };
    /** Keeps the City on screen: the view never wanders off into the empty land round it (a little sea and sky at the edges). */
    const clampCam = () => {
      const world = worldSize(bounds), z = cam.zoom / Math.min(2, devicePixelRatio || 1), hw = c.clientWidth / 2 / z, hh = c.clientHeight / 2 / z;
      const fit = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
      cam.x = fit(cam.x, hw - 40, world.w - hw + 40); cam.y = fit(cam.y, hh - 80, world.h - hh + 80);
    };
    const toWorld = (cx: number, cy: number): Pt => {
      const r = c.getBoundingClientRect(), z = cam.zoom / Math.min(2, devicePixelRatio || 1);
      return { x: cam.x + (cx - r.left - r.width / 2) / z, y: cam.y + (cy - r.top - r.height / 2) / z };
    };
    /** The plot at a world point: its ground, or the front of what stands on it (the frontmost wins). */
    const plotAt = (p: Pt): string | 'land' | null => {
      const s = live.current.city;
      let best: { id: string; y: number } | null = null;
      for (const plot of allPlots(s)) {
        const placed = s.plots[plot.id], d = placed ? designOf(s, placed.d) : null;
        const face = d ? reachAbove(d.look, placed!.floors) - 30 : 0, r = plot.rect;
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y - face && p.y <= r.y + r.h && (!best || r.y + r.h > best.y)) best = { id: plot.id, y: r.y + r.h };
      }
      if (best) return best.id;
      const next = blockRect(nextBlock(s));
      return p.x >= next.x && p.x <= next.x + next.w && p.y >= next.y && p.y <= next.y + next.h ? 'land' : null;
    };

    let down: { id: number; x: number; y: number; cx: number; cy: number; moved: boolean } | null = null;
    c.addEventListener('pointerdown', e => { if (down) return; down = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }; c.setPointerCapture(e.pointerId); if (flying) stopFly(); }, { signal: stop.signal });
    c.addEventListener('pointermove', e => {
      if (!down || e.pointerId !== down.id) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (Math.hypot(dx, dy) > 10) down.moved = true;
      if (down.moved) { const z = cam.zoom / Math.min(2, devicePixelRatio || 1); cam.x = down.cx - dx / z; cam.y = down.cy - dy / z; clampCam(); }
    }, { signal: stop.signal });
    const up = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id) return;
      const tap = !down.moved;
      down = null;
      if (tap && e.type === 'pointerup') onTap(plotAt(toWorld(e.clientX, e.clientY)));
    };
    c.addEventListener('pointerup', up, { signal: stop.signal });
    c.addEventListener('pointercancel', up, { signal: stop.signal });
    const hold = (e: TouchEvent) => e.preventDefault();
    for (const type of ['touchstart', 'touchmove'] as const) c.addEventListener(type, hold, { passive: false, signal: stop.signal });

    const stopFly = () => { const f = flying; flying = null; f?.done(); };
    const heli = VEHICLES.find(v => v.key === 'v:heli')!;
    control.current = {
      look(p, zoom) { cam.x = p.x; cam.y = p.y; if (zoom !== undefined) zi = Math.max(0, Math.min(ZOOMS.length - 1, ZOOMS.findIndex(z => z >= zoom))); clampCam(); },
      zoom(by) { zi = Math.max(0, Math.min(ZOOMS.length - 1, zi + by)); },
      fly(done) { flying = { t: 0, done }; },
      stopFlying: stopFly,
      setNight(n) { night = n; clock = n ? DAY_S : 0; },
      plotOnScreen(id) {
        const plot = allPlots(live.current.city).find(p => p.id === id);
        if (!plot) return null;
        const z = cam.zoom / Math.min(2, devicePixelRatio || 1), r = c.getBoundingClientRect();
        return { x: (plot.rect.x + plot.rect.w / 2 - cam.x) * z + r.width / 2, y: (plot.rect.y + plot.rect.h / 2 - cam.y) * z + r.height / 2 };
      },
    };

    const frame = (ms: number) => {
      raf = requestAnimationFrame(frame);
      const now = ms / 1000, dt = last ? Math.min(.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      people();
      const dpr = size(), W = c.width, H = c.height;
      // the day goes round by itself
      clock = (clock + dt) % (DAY_S + NIGHT_S);
      const isNight = clock >= DAY_S;
      if (isNight !== night) { night = isNight; onNight?.(night); }
      const world = worldSize(bounds);
      if (flying) {
        // a slow pass from one end of the City to the other, high up
        flying.t += dt;
        const k = Math.min(1, flying.t / Math.max(10, world.w / 160));
        cam.x = 100 + (world.w - 200) * (reduced ? k : k * k * (3 - 2 * k)); cam.y = world.h / 2 - 60;
        cam.zoom = Math.min(W / dpr, H / dpr) / (world.h + 420) * dpr * 1.4;
        if (k >= 1) stopFly();
      } else { cam.zoom = ZOOMS[zi]! * dpr * Math.max(.75, Math.min(1.3, Math.min(W, H) / dpr / 640)); if (!down?.moved) clampCam(); }
      for (const p of walkers) p.t += p.speed * dt * (reduced ? .5 : 1);
      moveCars(cars, bounds, dt);
      const s = live.current.city;
      drawCity(g, s, bounds, cam, W, H, night ? 1 : 0);
      drawCars(g, cars, cam, W, H);
      drawWalkers(g, walkers, cam, W, H, now);
      // dusk and dawn: a blue wash fades in and out around the change
      const edge = Math.min(Math.abs(clock - DAY_S), Math.abs(clock - (DAY_S + NIGHT_S)), clock);
      const wash = night ? .18 : Math.max(0, .18 * (1 - edge / 6));
      if (wash > 0) { g.fillStyle = `rgba(20,30,70,${wash})`; g.fillRect(0, 0, W, H); }
      g.save(); g.scale(cam.zoom, cam.zoom); g.translate(-(cam.x - W / 2 / cam.zoom), -(cam.y - H / 2 / cam.zoom));
      // the plot he picked
      const sel = live.current.selected ? allPlots(s).find(p => p.id === live.current.selected) : null;
      if (sel) { g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.setLineDash([12, 8]); g.lineDashOffset = -now * 30; g.strokeRect(sel.rect.x + 2, sel.rect.y + 2, sel.rect.w - 4, sel.rect.h - 4); g.setLineDash([]); }
      if (flying) {
        drawVehicle(g, heli, '#e63946', cam.x, cam.y, 0, now);
      }
      g.restore();
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stop.abort(); control.current = null; };
  }, []);

  return <canvas ref={canvas} class="city-canvas" aria-label="Your city: drag to look round, tap a plot to build" />;
}
