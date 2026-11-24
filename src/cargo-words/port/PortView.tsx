// His port, drawn to fit its box, animating gently (the sea, the lighthouse, the wind turbine). The parts that never move are drawn once
// into a cache (art/port.ts, drawPortStatic) and only the moving parts each frame, so Home, the Port and "Watch it run" stay smooth on an
// iPad 9. "Watch it run" passes `moving` to set things going and `pan` to fill the screen: it zooms in so the port is big, and the view
// drifts slowly along the quay from one end to the other and back.
import { useEffect, useRef } from 'preact/hooks';
import { drawPortBackdrop, drawPortLive, drawPortStatic, type Moving } from '../art/port';
import { DECOR, PIECES } from './catalog';
import { fleetKinds, has, type PortState } from './port';
import { BERTH_X, DECOR_STEP, PLACES, PLOT_H, PLOT_W } from './plot';

/** The part of the plot worth showing: from the left edge to the furthest thing he has built (at least half the plot), without the top of
 *  the sky or the far sea, so a new port isn't a speck. */
export function viewOf(p: PortState): { x: number; y: number; w: number; h: number } {
  const right = Math.max(560, ...PIECES.filter(x => has(p, x.id) && PLACES[x.id]).map(x => PLACES[x.id]!.x + PLACES[x.id]!.w + 20),
    BERTH_X[Math.min(BERTH_X.length - 1, fleetKinds(p).length)]! + 120, 40 + DECOR.filter(d => has(p, d.id)).length * DECOR_STEP);
  return { x: 0, y: 0, w: Math.min(PLOT_W, right), h: PLOT_H - 50 };
}

/** The pan's period, in seconds: one slow trip along the quay and back. */
const PAN = 48;

export function PortView({ p, class: c = '', moving, pan = false }: { p: PortState; class?: string; moving?: (t: number) => Moving; pan?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!, v = viewOf(p);
    const cache = document.createElement('canvas'), cctx = cache.getContext('2d')!;
    let raf = 0, key = '', start: number | null = null;
    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), W = r.width, H = r.height;
      if (W < 2 || H < 2) return;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
      const fit = Math.min(W / v.w, H / v.h);
      // panning, a big port fills more of the screen (about 720 plot units across a screen on its side, 420 upright) and the view drifts
      // along it; a small one is shown whole
      const k = pan ? Math.min(H / v.h, Math.max(fit, W / Math.min(v.w, W > H ? 720 : 420))) : fit;
      const t = ms / 1000, spare = Math.max(0, v.w * k - W);
      if (start === null) start = t;
      const ox = pan && spare ? -spare * (0.5 - 0.5 * Math.cos(((t - start) / PAN) * Math.PI * 2)) : (W - v.w * k) / 2, oy = (H - v.h * k) / 2;
      // the still parts, drawn once at this size
      const want = `${Math.round(v.w * k * dpr)}x${Math.round(v.h * k * dpr)}`;
      if (want !== key) {
        key = want;
        cache.width = Math.max(1, Math.round(v.w * k * dpr)); cache.height = Math.max(1, Math.round(v.h * k * dpr));
        cctx.setTransform(k * dpr, 0, 0, k * dpr, -v.x * k * dpr, -v.y * k * dpr);
        drawPortBackdrop(cctx, v.x - 40, v.x + v.w + 40, v.y - 40, v.y + v.h + 40);
        drawPortStatic(cctx, p);
      }
      // the sky and sea beyond the picture, the cached port, then what moves
      ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (ox - v.x * k), dpr * (oy - v.y * k));
      const x0 = v.x - ox / k, x1 = x0 + W / k, y0 = v.y - oy / k, y1 = y0 + H / k;
      if (ox > 0 || oy > 0 || ox + v.w * k < W || oy + v.h * k < H) drawPortBackdrop(ctx, x0 - 2, x1 + 2, y0 - 2, y1 + 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(cache, Math.round(ox * dpr), Math.round(oy * dpr));
      ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (ox - v.x * k), dpr * (oy - v.y * k));
      drawPortLive(ctx, p, t, moving ? moving(t) : null, x0, x1);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [p, moving, pan]);
  return <canvas ref={ref} class={`port-canvas ${c}`} role="img" aria-label="Your port" />;
}
