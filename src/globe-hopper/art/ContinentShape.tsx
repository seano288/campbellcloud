// A continent's own shape by itself, in its colour (or grey, not yet photographed), fitted to its box: the photo wall. Drawn once.
import { useEffect, useRef } from 'preact/hooks';
import { drawShape } from './earth';
import type { ContinentId } from '../world/continents';

export function ContinentShape({ id, colour, class: k = '' }: { id: ContinentId; colour: string; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const draw = () => {
      const b = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), ctx = c.getContext('2d');
      if (!b.width || !b.height || !ctx) return;
      c.width = Math.round(b.width * dpr); c.height = Math.round(b.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawShape(ctx, id, b.width, b.height, colour);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [id, colour]);
  return <canvas ref={ref} class={`gh-shape-pic ${k}`} aria-hidden="true" />;
}
