// The Earth turning slowly, in the game's continent colours, with his own rocket going round it on an orbit ring: the art behind Play on
// Home and on the Start screen. Drawn on a canvas at 30 frames a second (one globe a frame, well under a millisecond); still with Reduce
// Motion.
import { useEffect, useRef } from 'preact/hooks';
import { drawGlobe } from './earth';
import { drawRocket, rocketSize, type RocketLook } from './rocket';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

export function PlayGlobe({ look, class: k = '' }: { look: RocketLook; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(look);
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d');
    if (!ctx) return;
    const still = reduced(), size = rocketSize(look);
    let raf = 0, last = -1;
    const draw = (ms: number) => {
      if (!still) raf = requestAnimationFrame(draw);
      if (ms - last < 32 && last >= 0) return; // 30 a second is plenty for a slow turn
      last = ms;
      const b = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!b.width || !b.height) return;
      if (c.width !== Math.round(b.width * dpr) || c.height !== Math.round(b.height * dpr)) { c.width = Math.round(b.width * dpr); c.height = Math.round(b.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = b.width, H = b.height, t = still ? 0 : ms / 1000;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, r = Math.min(W, H) * .37, rx = Math.min(W * .48, r * 1.42), ry = r * .42, tilt = -.32;
      // where the rocket is on its ring; behind the Earth on the top half
      const a = t * .55 + 2.2, ox = Math.cos(a) * rx, oy = Math.sin(a) * ry;
      const px = cx + ox * Math.cos(tilt) - oy * Math.sin(tilt), py = cy + ox * Math.sin(tilt) + oy * Math.cos(tilt), behind = Math.sin(a) < 0;
      const ring = (from: number, to: number) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, from, to);
        ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = Math.max(2.5, r / 34); ctx.setLineDash([2, r / 9]); ctx.lineCap = 'round'; ctx.stroke();
        ctx.restore();
      };
      const rocket = () => {
        const s = (r * .5) / size.h, dx = -Math.sin(a) * rx, dy = Math.cos(a) * ry; // along the ring
        ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(dy * Math.cos(tilt) + dx * Math.sin(tilt), dx * Math.cos(tilt) - dy * Math.sin(tilt)) + Math.PI / 2);
        drawRocket(ctx, look, 0, size.h * s * .5, s, { burn: .55, t });
        ctx.restore();
      };
      ring(Math.PI, Math.PI * 2);
      if (behind) rocket();
      // a soft blue halo of air
      const halo = ctx.createRadialGradient(cx, cy, r * .96, cx, cy, r * 1.14);
      halo.addColorStop(0, 'rgba(120,190,255,.5)'); halo.addColorStop(1, 'rgba(120,190,255,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r * 1.14, 0, Math.PI * 2); ctx.fill();
      drawGlobe(ctx, cx, cy, r, { lon: 10 - t * 9, lat: 14 }, { lw: Math.max(1, r / 110) });
      ring(0, Math.PI);
      if (!behind) rocket();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [key]);
  return <canvas ref={ref} class={`gh-globe-canvas ${k}`} aria-hidden="true" />;
}
