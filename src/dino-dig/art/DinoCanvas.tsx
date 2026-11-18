// One dinosaur, still, filling its box: with its skin and look, or as a skeleton with the bones he has (the rest dashed). Used where a
// small picture of a particular dinosaur stands in for its name: the Shop's row of his dinosaurs and the Dig's card.
import { useEffect, useRef } from 'preact/hooks';
import { bounds, drawDino } from './dino';
import { dino, type DinoId } from '../museum/dinos';
import type { Look } from '../museum/state';

export function DinoCanvas({ id, look, have, class: cls = '' }: { id: DinoId; look?: Look; have?: number; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const draw = () => {
      const box = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!box.width || !box.height) return;
      cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr);
      const c = cv.getContext('2d')!, d = dino(id), b = bounds(d), px = Math.min((cv.width * .92) / b.width, (cv.height * .88) / b.height);
      c.clearRect(0, 0, cv.width, cv.height);
      c.save(); c.translate((cv.width - b.width * px) / 2 - b.left * px, cv.height * .95);
      drawDino(c, d, have === undefined ? { mode: 'skin', px, look, t: 1 } : { mode: 'bones', px, have: d.bones.slice(0, have) });
      c.restore();
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [id, have, look?.color, look?.marking, look?.hat]);
  return <canvas ref={ref} class={`dino-canvas ${cls}`} aria-hidden="true" />;
}
