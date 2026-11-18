// His truck as a picture in the page: drawn on a canvas at the size it's shown (art/truck.ts), and drawn again when it changes.
import { useEffect, useRef } from 'preact/hooks';
import { drawTruck, type Pose, type TruckLook } from './truck';

export function TruckArt({ look, label, pose, class: cls = '' }: { look: TruckLook; label?: string | null; pose?: Pose; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null), key = JSON.stringify([look, pose]);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    function draw() {
      const ctx = c!.getContext('2d'), r = c!.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!ctx || !r.width) return;
      c!.width = Math.round(r.width * dpr); c!.height = Math.round(r.height * dpr);
      const k = Math.min(c!.width / 6.2, c!.height / 3.0);
      ctx.clearRect(0, 0, c!.width, c!.height);
      drawTruck(ctx, { k, ox: (c!.width - 5.4 * k) / 2 - 0.3 * k, oy: c!.height - 0.08 * k }, look, 0, { t: 0.1, ...pose }); // a picture: both lamps lit, no flash
    }
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [key]);
  return <canvas ref={ref} class={`truck-art ${cls}`} role={label ? 'img' : undefined} aria-label={label ?? undefined} aria-hidden={label ? undefined : 'true'} />;
}
