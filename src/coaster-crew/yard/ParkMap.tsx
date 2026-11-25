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
/** The empty places left in the last row of plots: land for sale, drawn as a dashed plot with a sign (a tap there offers More Land). */
export function forSale(w: number, plots: number) {
  const COLS = colsFor(w), left = (COLS - (plots % COLS)) % COLS, pw = w / COLS, ph = pw * .8, row = Math.floor(plots / COLS);
  return Array.from({ length: left }, (_, i) => ({ x: ((plots % COLS) + i) * pw + 4, y: 70 + row * ph + 4, w: pw - 8, h: ph - 8 }));
}

/** A little visitor (with a hat and a balloon), drawn once and copied: emoji text is slow to draw, and there can be two dozen walking. */
const sprites = new Map<string, HTMLCanvasElement>();
function visitor(hat: string, balloon: string) {
  const key = `${hat}|${balloon}`;
  let c = sprites.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = 64; c.height = 76;
  const x = c.getContext('2d')!; x.scale(2, 2);
  if (balloon) { x.strokeStyle = '#14161b80'; x.lineWidth = 1; x.beginPath(); x.moveTo(20, 30); x.lineTo(24, 12); x.stroke(); emoji(x, balloon, 24, 9, 11); }
  emoji(x, '🧑', 14, 28, 14);
  if (hat) emoji(x, hat, 14, 18, 10);
  sprites.set(key, c);
  return c;
}

export function ParkMap({ y, picked, onSpot, onMore, fit = false }: { y: YardState; picked: number | null; onSpot(i: number): void; onMore?(): void; fit?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const plots = y.spots.length / SPOTS_PER_PLOT;
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!;
    let raf = 0, layer: HTMLCanvasElement | null = null, layerKey = '';
    const hats = HATS.filter(h => y.owned.includes(h.id)).map(h => h.icon), balloons = BALLOONS.filter(b => y.owned.includes(b.id)).map(b => b.icon);
    const night = y.night && does(y, 'night'), queue = does(y, 'queue'), board = does(y, 'board');
    /** Everything that stands still, drawn once for this size: the ground, the coaster's loop, the plots and what's on them. */
    const still = (w: number, H: number, dpr: number) => {
      const l = document.createElement('canvas'); l.width = Math.round(w * dpr); l.height = Math.round(H * dpr);
      const x = l.getContext('2d')!; x.scale(dpr, dpr);
      x.fillStyle = night ? '#1b2a3a' : '#ecdcb4'; x.fillRect(0, 0, w, H);
      // the coaster looping along the top, two rails seen from above with ties between, and its station at the left
      x.beginPath(); x.ellipse(w / 2, 34, w * .44, 22, 0, 0, Math.PI * 2);
      x.strokeStyle = INK; x.lineWidth = 13; x.stroke(); x.strokeStyle = '#e63946'; x.lineWidth = 8; x.stroke();
      x.setLineDash([2, 7]); x.strokeStyle = INK; x.lineWidth = 8; x.stroke(); x.setLineDash([]);
      rounded(x, w * .06 - 16, 22, 32, 24, 6); x.fillStyle = '#fff6e6'; x.fill(); outline(x, 3);
      x.fillStyle = '#e63946'; x.fillRect(w * .06 - 14, 24, 28, 6);
      if (queue) for (let i = 0; i < 6; i++) emoji(x, '🧍', w * .12 + i * 14, 62, 14);
      // the Rider Board by the gate: everyone his trains have carried
      if (board) { rounded(x, w - 92, 46, 84, 22, 6); x.fillStyle = '#14161b'; x.fill(); x.fillStyle = '#ffd23f'; x.font = '900 13px Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(`🧑 ${y.riders}`, w - 50, 58); }
      for (let i = 0; i < y.spots.length; i++) {
        const sp = spotRect(i, w, plots);
        if (i % SPOTS_PER_PLOT === 0) { rounded(x, sp.x - 8, sp.y - 8, sp.w * 3 + 16, sp.h * 2 + 16, 14); x.fillStyle = night ? '#24503a' : '#8fd46a'; x.fill(); outline(x, 3); }
        rounded(x, sp.x + 3, sp.y + 3, sp.w - 6, sp.h - 6, 10); x.fillStyle = picked === i ? '#ffd23f' : night ? '#2f6a4a' : '#a6e07e'; x.fill();
        if (picked === i) outline(x, 4);
        const id = y.spots[i];
        if (id) { const it = itemOf(id); emoji(x, it.icon, sp.x + sp.w / 2, sp.y + sp.h / 2, Math.min(sp.w, sp.h) * .62); if (night) { x.fillStyle = '#ffd23f40'; x.beginPath(); x.arc(sp.x + sp.w / 2, sp.y + sp.h / 2, Math.min(sp.w, sp.h) * .5, 0, Math.PI * 2); x.fill(); } }
      }
      // land for sale in the rest of the last row (not in "Watch it run")
      if (!fit) for (const g of forSale(w, plots)) {
        rounded(x, g.x, g.y, g.w, g.h, 14); x.setLineDash([10, 8]); x.strokeStyle = night ? '#ffffff60' : '#14161b55'; x.lineWidth = 3; x.stroke(); x.setLineDash([]);
        emoji(x, '🪧', g.x + g.w / 2, g.y + g.h / 2 - 8, Math.min(g.w, g.h) * .3);
        x.fillStyle = night ? '#ffffffa0' : '#14161b99'; x.font = `900 ${Math.max(14, Math.min(g.w, g.h) * .12)}px Nunito, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('+', g.x + g.w / 2, g.y + g.h / 2 + Math.min(g.w, g.h) * .22);
      }
      return l;
    };
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width) return;
      if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = r.width, t = now / 1000, COLS = colsFor(w), H = mapHeight(w, plots);
      // in the Yard the canvas is as tall as the map; to fit a box, the whole map is scaled evenly and centred
      if (!fit && Math.abs(r.height - H) > 1) c.style.height = `${H}px`;
      const k = fit ? Math.min(1, r.height / H, r.width / w) : 1;
      const key = `${Math.round(w)}x${Math.round(H)}@${dpr}`;
      if (key !== layerKey) { layer = still(w, H, dpr); layerKey = key; }
      ctx.clearRect(0, 0, w, r.height);
      ctx.save(); ctx.translate((w - w * k) / 2, fit ? Math.max(0, (r.height - H * k) / 2) : 0); ctx.scale(k, k);
      if (layer) ctx.drawImage(layer, 0, 0, w, H);
      const a = t * .9; emoji(ctx, '🎢', w / 2 + Math.cos(a) * w * .44, 34 + Math.sin(a) * 22, 22);
      // visitors walking the paths between the plots
      const n = Math.min(24, 4 + Math.floor(y.riders / 30));
      for (let i = 0; i < n; i++) {
        const lane = i % (Math.ceil(plots / COLS) + 1), yy = 70 + lane * (w / COLS) * .8 - 2, xx = ((i * 97 + t * (18 + (i % 5) * 6)) % (w + 40)) - 20;
        ctx.drawImage(visitor(hats.length ? hats[i % hats.length]! : '', balloons.length && i % 2 ? balloons[i % balloons.length]! : ''), xx - 14, yy - 28, 32, 38);
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [y, picked]);
  const tap = (e: PointerEvent) => {
    if (fit) return;
    const r = ref.current!.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, inside = (s: { x: number; y: number; w: number; h: number }) => px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h;
    for (let i = 0; i < y.spots.length; i++) { if (inside(spotRect(i, r.width, plots))) { onSpot(i); return; } }
    if (onMore && forSale(r.width, plots).some(inside)) onMore();
  };
  return <canvas ref={ref} class={`cc-park-map${fit ? ' fit' : ''}`} role="img" aria-label="Your park" onPointerDown={tap} />;
}
