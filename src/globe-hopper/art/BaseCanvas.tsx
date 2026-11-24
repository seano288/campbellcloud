// His Rocket Base on a canvas that fills its box: drawn once, and again only when the base changes or the box changes size.
import { useEffect, useRef } from 'preact/hooks';
import { drawBase, type BaseDrawOpts, type BaseScene } from './base';

export function BaseCanvas({ scene, opts, label, class: k = '' }: { scene: BaseScene; opts?: BaseDrawOpts; label: string; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify([scene, opts]);
  useEffect(() => {
    const c = ref.current!;
    const draw = () => {
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width || !r.height) return;
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBase(ctx, scene, r.width, r.height, opts);
    };
    draw();
    // fonts load late on a first visit: the countdown clock's numbers and the signs are drawn again once they are in
    void document.fonts?.ready.then(draw);
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [key]);
  return label ? <canvas ref={ref} class={`gh-base-canvas ${k}`} role="img" aria-label={label} /> : <canvas ref={ref} class={`gh-base-canvas ${k}`} aria-hidden="true" />;
}
