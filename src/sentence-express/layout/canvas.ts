// A canvas sized to its box, with a cached layer for what doesn't move (the table and track) and a loop for what does.
import { useEffect, useRef } from 'preact/hooks';
import type { Layout } from './track';
import { drawTable, loadedImages, viewFor, type View } from './draw';

export interface Frame { c: CanvasRenderingContext2D; v: View; dt: number; t: number }

/**
 * Runs `frame` every animation frame while `run` is true. The table layer is redrawn into a cache only when `layout` (or the
 * canvas size, or `key`) changes; `frame` draws on top of it. Returns the current view, for turning taps into squares.
 */
export function useTable(ref: { current: HTMLCanvasElement | null }, layout: () => Layout, frame: (f: Frame) => void, opts: { grid?: boolean; target?: () => number | null; key?: () => string; rails?: () => string; snow?: () => boolean } = {}) {
  const view = useRef<View | null>(null), latest = useRef({ layout, frame, opts });
  latest.current = { layout, frame, opts };
  useEffect(() => {
    const canvas = ref.current!, c = canvas.getContext('2d')!, cache = document.createElement('canvas'), cc = cache.getContext('2d')!;
    let raf = 0, last = 0, t = 0, drawn = '', drawnLayout: Layout | null = null;
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(.05, (ms - last) / 1000) : 0;
      last = ms;
      t += dt;
      if (document.hidden) return;
      const box = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
      if (!w || !h) return;
      const l = latest.current.layout(), o = latest.current.opts;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; cache.width = w; cache.height = h; drawn = ''; }
      const v = viewFor(l, box.width, box.height, dpr), key = `${w}x${h}|${o.key?.() ?? ''}|${o.target?.() ?? ''}|${o.rails?.() ?? ''}|${o.snow?.() ?? ''}|${loadedImages()}`;
      view.current = v;
      if (key !== drawn || l !== drawnLayout) { drawTable(cc, v, l, { grid: o.grid, target: o.target?.() ?? null, rails: o.rails?.(), snow: o.snow?.() }); drawn = key; drawnLayout = l; }
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, w, h);
      c.drawImage(cache, 0, 0);
      latest.current.frame({ c, v, dt, t });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return view;
}
