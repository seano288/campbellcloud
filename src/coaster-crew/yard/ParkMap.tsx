// His park from above: plots of grass with paths between, every ride and stand on its spot, his coaster's track looping round the top,
// and little visitors walking the paths in the hats and with the balloons he has bought (queuing at the coaster once he has Queue Lines).
// With a spot picked, it glows; with Night Lights on, the park is lit at night.
//
// It is drawn at one scale both ways, never squashed: land can be bought without end, so in the Yard the map simply grows taller (the Yard
// scrolls, and every spot stays big enough to tap), and in "Watch it run" (`fit`) the whole park shrinks evenly to fit its box.
import { useEffect, useRef } from 'preact/hooks';
import { emoji, INK, outline, rounded } from '../art/draw';
import { BALLOONS, HATS, itemOf, SPOTS_PER_PLOT } from '../park/catalog';
import { does, type YardState } from '../park/yard';

/** Plots a row: two on a narrow screen, so a spot stays at least 44pt across on a phone. */
export const colsFor = (w: number) => (w < 600 ? 2 : 3);
export function spotRect(i: number, w: number, plots: number) {
  const COLS = colsFor(w), plot = Math.floor(i / SPOTS_PER_PLOT), j = i % SPOTS_PER_PLOT, rows = Math.ceil(plots / COLS);
  const pw = w / COLS, ph = pw * .8, px = (plot % COLS) * pw, py = 70 + Math.floor(plot / COLS) * ph;
  const sw = (pw - 24) / 3, sh = (ph - 24) / 2;
  return { x: px + 12 + (j % 3) * sw, y: py + 12 + Math.floor(j / 3) * sh, w: sw, h: sh, total: 70 + rows * ph + 10 };
}
export const mapHeight = (w: number, plots: number) => spotRect(0, w, plots).total;

export function ParkMap({ y, picked, onSpot, fit = false }: { y: YardState; picked: number | null; onSpot(i: number): void; fit?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const plots = y.spots.length / SPOTS_PER_PLOT;
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!;
    let raf = 0;
    const hats = HATS.filter(h => y.owned.includes(h.id)).map(h => h.icon), balloons = BALLOONS.filter(b => y.owned.includes(b.id)).map(b => b.icon);
    const night = y.night && does(y, 'night'), queue = does(y, 'queue'), board = does(y, 'board');
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width) return;
      if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = r.width, t = now / 1000, COLS = colsFor(w), H = mapHeight(w, plots);
      // in the Yard the canvas is as tall as the map; to fit a box, the whole map is scaled evenly and centred
      if (!fit && Math.abs(r.height - H) > 1) c.style.height = `${H}px`;
      const k = fit ? Math.min(1, r.height / H) : 1;
      ctx.clearRect(0, 0, w, r.height);
      ctx.save(); ctx.translate((w - w * k) / 2, 0); ctx.scale(k, k);
      ctx.fillStyle = night ? '#1b2a3a' : '#e9d8b0'; ctx.fillRect(0, 0, w, fit ? H : r.height);
      // the coaster looping along the top
      ctx.beginPath(); ctx.ellipse(w / 2, 34, w * .44, 22, 0, 0, Math.PI * 2); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = '#e63946'; ctx.lineWidth = 5; ctx.stroke();
      const a = t * .9; emoji(ctx, '🎢', w / 2 + Math.cos(a) * w * .44, 34 + Math.sin(a) * 22, 22);
      if (queue) for (let i = 0; i < 6; i++) emoji(ctx, '🧍', w * .12 + i * 14, 62, 14);
      // the Rider Board by the gate: everyone his trains have carried
      if (board) { rounded(ctx, w - 92, 46, 84, 22, 6); ctx.fillStyle = '#14161b'; ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.font = '900 13px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`🧑 ${y.riders}`, w - 50, 58); }
      for (let i = 0; i < y.spots.length; i++) {
        const s = spotRect(i, w, plots);
        if (i % SPOTS_PER_PLOT === 0) { rounded(ctx, s.x - 8, s.y - 8, s.w * 3 + 16, s.h * 2 + 16, 14); ctx.fillStyle = night ? '#24503a' : '#8fd46a'; ctx.fill(); outline(ctx, 3); }
        rounded(ctx, s.x + 3, s.y + 3, s.w - 6, s.h - 6, 10); ctx.fillStyle = picked === i ? '#ffd23f' : night ? '#2f6a4a' : '#a6e07e'; ctx.fill();
        if (picked === i) outline(ctx, 4);
        const id = y.spots[i];
        if (id) { const it = itemOf(id); emoji(ctx, it.icon, s.x + s.w / 2, s.y + s.h / 2 + (it.id === 'rk:ferris' ? 0 : Math.sin(t * 2 + i) * 1.5), Math.min(s.w, s.h) * .62); if (night) { ctx.fillStyle = '#ffd23f40'; ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + s.h / 2, Math.min(s.w, s.h) * .5, 0, Math.PI * 2); ctx.fill(); } }
      }
      // visitors walking the paths between the plots
      const n = Math.min(24, 4 + Math.floor(y.riders / 30));
      for (let i = 0; i < n; i++) {
        const lane = i % (Math.ceil(plots / COLS) + 1), yy = 70 + lane * (w / COLS) * .8 - 2, xx = ((i * 97 + t * (18 + (i % 5) * 6)) % (w + 40)) - 20;
        emoji(ctx, '🧑', xx, yy, 14);
        if (hats.length) emoji(ctx, hats[i % hats.length]!, xx, yy - 10, 10);
        if (balloons.length && i % 2) emoji(ctx, balloons[i % balloons.length]!, xx + 8, yy - 18, 11);
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [y, picked]);
  const tap = (e: PointerEvent) => {
    if (fit) return;
    const r = ref.current!.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    for (let i = 0; i < y.spots.length; i++) { const s = spotRect(i, r.width, plots); if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) { onSpot(i); return; } }
  };
  return <canvas ref={ref} class={`cc-park-map${fit ? ' fit' : ''}`} role="img" aria-label="Your park" onPointerDown={tap} />;
}
