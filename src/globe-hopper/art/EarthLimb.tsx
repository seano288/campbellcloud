// The top of the Earth seen from orbit, along the bottom of a screen (the end of a Round): the real continents in their colours under a
// thin glow of air. Drawn once, and again if the screen changes size.
import { useEffect, useRef } from 'preact/hooks';
import { drawGlobe } from './earth';

export function EarthLimb({ lon = 10, class: k = '' }: { lon?: number; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const draw = () => {
      const b = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), ctx = c.getContext('2d');
      if (!b.width || !b.height || !ctx) return;
      c.width = Math.round(b.width * dpr); c.height = Math.round(b.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = Math.max(b.width * .8, b.height * 2.4), cx = b.width / 2, cy = b.height * .32 + r;
      const halo = ctx.createRadialGradient(cx, cy, r * .985, cx, cy, r * 1.05);
      halo.addColorStop(0, 'rgba(120,190,255,.65)'); halo.addColorStop(1, 'rgba(120,190,255,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2); ctx.fill();
      drawGlobe(ctx, cx, cy, r, { lon, lat: -30 }, { lw: Math.max(1.2, r / 300) });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [lon]);
  return <canvas ref={ref} class={`gh-earth-limb ${k}`} aria-hidden="true" />;
}
