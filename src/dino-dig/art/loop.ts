// A loop on a canvas sized to its box (at most 2 device pixels a CSS pixel): `step` advances the world by dt seconds, `draw` paints it.
// It stops while the page is hidden, and it records how long each frame's own work takes for the tours (dev only).
import { useEffect, useRef } from 'preact/hooks';

export function useCanvasLoop(ref: { current: HTMLCanvasElement | null }, run: boolean, step: (dt: number) => void,
  draw: (c: CanvasRenderingContext2D, w: number, h: number, dpr: number) => void, maxDpr = 2) {
  const latest = useRef({ step, draw });
  latest.current = { step, draw };
  useEffect(() => {
    if (!run) return;
    const canvas = ref.current!, c = canvas.getContext('2d')!;
    let raf = 0, last = 0;
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(.05, (ms - last) / 1000) : 0;
      last = ms;
      if (document.hidden) return;
      const box = canvas.getBoundingClientRect(), dpr = Math.min(maxDpr, devicePixelRatio || 1), w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const t0 = performance.now();
      latest.current.step(dt);
      const t1 = performance.now();
      c.setTransform(1, 0, 0, 1, 0, 0);
      latest.current.draw(c, w, h, dpr);
      if (import.meta.env.DEV) { const t = (window as unknown as { __work?: number[][] }); (t.__work ??= []).push([t1 - t0, performance.now() - t1]); if (t.__work.length > 900) t.__work.shift(); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [run]);
}

/** An offscreen canvas (a sprite or a layer). */
export function layer(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return { canvas: c, ctx: c.getContext('2d')! };
}

export const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/** Lines that don't matter are dropped while the voice is mid-sentence, so it never queues up behind the action. */
export function chatter<T>(say: (...line: T[]) => Promise<void>) {
  let talking = false;
  return (...line: T[]) => { if (talking) return; talking = true; void say(...line).then(() => { talking = false; }); };
}
