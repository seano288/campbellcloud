// A small still globe turned to a place, with a ring round it: the next photo mission on Home, a photo on the wall. Drawn once.
import { useEffect, useRef } from 'preact/hooks';
import { drawGlobe, type EarthLook } from './earth';
import type { LonLat } from '../map/geo';

export function MiniGlobe({ at, look = {}, ring = true, class: k = '' }: { at: LonLat; look?: EarthLook; ring?: boolean; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify([at, look, ring]);
  useEffect(() => {
    const c = ref.current!;
    const draw = () => {
      const b = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), ctx = c.getContext('2d');
      if (!b.width || !b.height || !ctx) return;
      c.width = Math.round(b.width * dpr); c.height = Math.round(b.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = Math.min(b.width, b.height) / 2 - 3;
      drawGlobe(ctx, b.width / 2, b.height / 2, r, { lon: at.lon, lat: Math.max(-60, Math.min(60, at.lat)) }, {
        lw: Math.max(.8, r / 70), ...look, marks: ring ? [{ at, kind: 'ring', colour: '#ffd23f' }, ...(look.marks ?? [])] : look.marks,
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [key]);
  return <canvas ref={ref} class={`gh-mini-globe ${k}`} aria-hidden="true" />;
}
