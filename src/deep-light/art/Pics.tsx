// Pictures drawn in code, at the size they're shown: his submarine (CanvasArt, redrawn when its look or size changes) and the animals
// (drawn once into an image and kept, so a Logbook page of sixty costs nothing to show again).
import { useEffect, useRef } from 'preact/hooks';
import type { SubLook } from '../dock/dock';
import { animal } from '../sea/animals';
import { CREATURE_BOX, drawCreature, glowAt } from './creatures';
import { drawSub, SUB_BOX } from './sub';

/** A picture drawn on a canvas at the size it's shown, and drawn again when that size (or `k`, what it shows) changes. */
export function CanvasArt({ paint, k, class: cls = '', label }: { paint(ctx: CanvasRenderingContext2D, w: number, h: number): void; k: string; class?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null), latest = useRef(paint);
  latest.current = paint;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    function draw() {
      const ctx = c!.getContext('2d'), r = c!.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!ctx || !r.width || !r.height) return;
      c!.width = Math.round(r.width * dpr); c!.height = Math.round(r.height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c!.width, c!.height);
      latest.current(ctx, c!.width, c!.height);
    }
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [k]);
  return <canvas ref={ref} class={cls} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} />;
}

/** Draws the submarine to fit a w×h box, centred. */
export function paintSub(ctx: CanvasRenderingContext2D, look: SubLook, w: number, h: number, t = 0) {
  const k = Math.min(w / SUB_BOX.w, h / SUB_BOX.h);
  ctx.save(); ctx.translate(w / 2, h / 2 + SUB_BOX.cy * k); ctx.scale(k, k);
  drawSub(ctx, look, t);
  ctx.restore();
}

export function SubArt({ look, label, class: cls = '' }: { look: SubLook; label?: string; class?: string }) {
  return <CanvasArt class={`sub-art ${cls}`} k={JSON.stringify(look)} label={label} paint={(ctx, w, h) => paintSub(ctx, look, w, h, 0.4)} />;
}

const cache = new Map<string, string>();
/** An animal as an image (a data URL), drawn once at this many pixels wide; `silhouette` draws it dark, for one not found yet. */
export function animalImage(id: string, px = 240, silhouette = false): string {
  const key = `${id}:${px}:${silhouette}`;
  let url = cache.get(key);
  if (url) return url;
  const a = animal(id), c = document.createElement('canvas'), k = px / CREATURE_BOX.w;
  c.width = px; c.height = Math.round(CREATURE_BOX.h * k);
  const ctx = c.getContext('2d')!;
  ctx.translate(c.width / 2, c.height / 2); ctx.scale(k * 0.9, k * 0.9);
  if (a.glow && !silhouette) {
    const [gx, gy] = glowAt(a), g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 44);
    g.addColorStop(0, a.glow + 'cc'); g.addColorStop(1, a.glow + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, 44, 0, 7); ctx.fill();
  }
  drawCreature(ctx, a, 0.3);
  if (silhouette) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#1d3358'; ctx.fillRect(0, 0, c.width, c.height); }
  url = c.toDataURL();
  cache.set(key, url);
  return url;
}

export function AnimalPic({ id, class: cls = '', label, silhouette = false }: { id: string; class?: string; label?: string; silhouette?: boolean }) {
  return <img class={`animal-pic ${cls}`} src={animalImage(id, 240, silhouette)} alt={label ?? ''} aria-hidden={label ? undefined : 'true'} draggable={false} />;
}

const subs = new Map<string, string>();
/** The submarine as an image (a data URL), for the Dock's tray tiles, kept once drawn. */
export function subImage(look: SubLook, w = 200, h = 130): string {
  const key = `${JSON.stringify(look)}:${w}x${h}`;
  let url = subs.get(key);
  if (url) return url;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paintSub(c.getContext('2d')!, look, w, h, 0.4);
  url = c.toDataURL();
  subs.set(key, url);
  return url;
}
