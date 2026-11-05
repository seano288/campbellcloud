// A robot on a canvas, drawn by the same code the fight uses. `live` keeps its blades turning. Pictures of single parts go through
// partPic, which draws once and keeps the result, because the Workshop's tray shows dozens of them.
import { useEffect, useRef } from 'preact/hooks';
import type { Build } from './build';
import { drawBot, drawPartAlone, extentOf } from './draw';
import { catOf, type PartKey } from './parts';

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

export function BotView({ build, live = false, class: cls = '', turn = -Math.PI / 2, label }: { build: Build; live?: boolean; class?: string; turn?: number; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!, c = canvas.getContext('2d');
    if (!c) return;
    let raf = 0, gone = false;
    const draw = (ms: number) => {
      const box = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
      if (w && h) {
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, w, h);
        const fit = Math.min(w, h) / 2 / (extentOf(build) + 8);
        c.translate(w / 2, h / 2); c.scale(fit, fit); c.rotate(turn);
        drawBot(c, build, { spin: ms / 1000 });
      }
      if (live && !gone && !still()) raf = requestAnimationFrame(draw);
    };
    draw(600);
    const ro = new ResizeObserver(() => draw(600));
    ro.observe(canvas);
    return () => { gone = true; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [build, live, turn]);
  return <canvas ref={ref} class={`bot-view ${cls}`} role="img" aria-label={label ?? 'Your robot'} />;
}

const pics = new Map<PartKey, string>();
export function partPic(k: PartKey) {
  let url = pics.get(k);
  if (!url) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 180;
    const c = canvas.getContext('2d');
    if (c) drawPartAlone(c, catOf(k), k.split(':')[1]!, 180);
    url = canvas.toDataURL('image/png');
    pics.set(k, url);
  }
  return url;
}
export const PartPic = ({ k, class: cls = '' }: { k: PartKey; class?: string }) => <img class={`part-pic ${cls}`} src={partPic(k)} alt="" draggable={false} />;
