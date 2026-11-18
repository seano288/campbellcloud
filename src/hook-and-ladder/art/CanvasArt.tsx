// A picture drawn in code on a canvas at the size it's shown, and drawn again when that size (or `k`, what it shows) changes. Never
// animated: the Town's lots and the Home tile's street use it.
import { useEffect, useRef } from 'preact/hooks';

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
