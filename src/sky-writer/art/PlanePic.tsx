// His plane, as fitted, on a small canvas (Home, the end of a Round, the Wall). The propeller turns slowly.
import { useEffect, useRef } from 'preact/hooks';
import type { AirfieldState } from '../airfield/state';
import { paintPlaneCanvas, type Look } from './plane';

export const lookOf = (a: Pick<AirfieldState, 'fitted'>): Look => ({ plane: a.fitted.plane, paint: a.fitted.paint, prop: a.fitted.prop, pilot: a.fitted.pilot });

export function PlanePic({ a, look, still }: { a?: Pick<AirfieldState, 'fitted'>; look?: Look; still?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null), l = look ?? lookOf(a!);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (still || matchMedia('(prefers-reduced-motion:reduce)').matches) { paintPlaneCanvas(cv, l, 0.1); return; }
    let raf = 0, last = 0;
    const loop = (ms: number) => { raf = requestAnimationFrame(loop); if (ms - last < 66) return; last = ms; paintPlaneCanvas(cv, l, ms / 1000); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [l.plane, l.paint, l.prop, l.pilot]);
  return <canvas ref={ref} class="plane-pic" aria-hidden="true" />;
}
