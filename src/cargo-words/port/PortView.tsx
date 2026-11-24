// His port, drawn to fit its box, animating gently (the sea, the lighthouse). "Watch it run" passes `moving` to set things going.
import { useEffect, useRef } from 'preact/hooks';
import { drawPort, type Moving } from '../art/port';
import { DECOR, PIECES } from './catalog';
import { fleetKinds, has, type PortState } from './port';
import { BERTH_X, DECOR_STEP, PLACES, PLOT_H, PLOT_W } from './plot';

/** The part of the plot worth showing: from the left edge to the furthest thing he has built (at least half the plot), without the top of
 *  the sky or the far sea, so a new port isn't a speck. */
export function viewOf(p: PortState): { x: number; y: number; w: number; h: number } {
  const right = Math.max(560, ...PIECES.filter(x => has(p, x.id) && PLACES[x.id]).map(x => PLACES[x.id]!.x + PLACES[x.id]!.w + 20),
    BERTH_X[Math.min(BERTH_X.length - 1, fleetKinds(p).length)]! + 120, 40 + DECOR.filter(d => has(p, d.id)).length * DECOR_STEP);
  return { x: 0, y: 30, w: Math.min(PLOT_W, right), h: PLOT_H - 70 };
}

export function PortView({ p, class: c = '', moving }: { p: PortState; class?: string; moving?: (t: number) => Moving }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!, v = viewOf(p);
    let raf = 0;
    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (canvas.width !== Math.round(r.width * dpr) || canvas.height !== Math.round(r.height * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
      const k = Math.min(r.width / v.w, r.height / v.h), t = ms / 1000;
      // sky above and sea below fill whatever the picture doesn't
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#9fd8f5'; ctx.fillRect(0, 0, r.width, r.height / 2); ctx.fillStyle = '#1f9a8a'; ctx.fillRect(0, r.height / 2, r.width, r.height / 2);
      ctx.translate((r.width - v.w * k) / 2 - v.x * k, (r.height - v.h * k) / 2 - v.y * k); ctx.scale(k, k);
      drawPort(ctx, p, t, moving ? moving(t) : null);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [p, moving]);
  return <canvas ref={ref} class={`port-canvas ${c}`} role="img" aria-label="Your port" />;
}
