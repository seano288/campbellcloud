// "Watch it run": his airport working by itself, for show (traffic.ts). Nothing is paid or used. The screen he shows people.
import { useEffect, useRef } from 'preact/hooks';
import { IconButton } from '../../ui/bits';
import { drawAirport, drawVehicle } from '../art/airport';
import { drawPlaneTop, lookOf } from '../art/plane';
import { liveryOf } from '../airport/airport';
import { PLANE_SPECS } from '../airport/catalog';
import { PLOT_H, PLOT_W } from '../airport/plot';
import { player } from '../game';
import { screen } from '../nav';
import { useVoice } from '../voice';
import { createTraffic, stepTraffic } from './traffic';

export function WatchScreen() {
  const voice = useVoice(), a = player.state.value.airport, ref = useRef<HTMLCanvasElement>(null), count = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    void voice.say('Watch it run!');
    const canvas = ref.current!, ctx = canvas.getContext('2d')!, tr = createTraffic(a);
    if (import.meta.env.DEV) Object.assign(window, { __traffic: tr });
    const looks = new Map(tr.planes.map(p => [p.model, lookOf(p.model, liveryOf(a, p.model), a.airline.mark)]));
    let raf = 0, last = 0, shown = -1;
    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      const t = ms / 1000, dt = last ? Math.min(.05, t - last) : 0;
      last = t;
      if (document.hidden) return;
      stepTraffic(tr, a, dt);
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
      // fit the plot, but on a tall screen zoom in (up to 1.7 times) on the runway, apron and gates, where the traffic is
      const fit = Math.min(r.width / PLOT_W, r.height / PLOT_H), k = Math.min(Math.max(r.width / PLOT_W, r.height / PLOT_H), fit * 1.7);
      const cx = Math.min(PLOT_W - r.width / (2 * k), Math.max(r.width / (2 * k), 640)), cy = Math.min(PLOT_H - r.height / (2 * k), Math.max(r.height / (2 * k), 540));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#8fd17a'; ctx.fillRect(0, 0, r.width, r.height);
      if (PLOT_W * k <= r.width) ctx.translate((r.width - PLOT_W * k) / 2, 0); else ctx.translate(r.width / 2 - cx * k, 0);
      if (PLOT_H * k <= r.height) ctx.translate(0, (r.height - PLOT_H * k) / 2); else ctx.translate(0, r.height / 2 - cy * k);
      ctx.scale(k, k);
      drawAirport(ctx, a, t);
      for (const v of tr.vehicles) drawVehicle(ctx, v.x, v.y, v.heading, v.hex, v.len);
      for (const p of tr.planes) {
        if (p.state === 'away') continue;
        const size = .55 * PLANE_SPECS[p.model].size * (1 + p.lift * .3);
        if (p.lift > 0) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(p.x + 6 + p.lift * 24, p.y + 8 + p.lift * 30, 30 * size, 12 * size, 0, 0, 7); ctx.fill(); }
        drawPlaneTop(ctx, looks.get(p.model)!, p.x, p.y - p.lift * 20, p.heading, size, t);
      }
      if (tr.landings !== shown && count.current) { shown = tr.landings; count.current.textContent = String(tr.landings); }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div class="screen watch-screen">
      <canvas ref={ref} class="watch-canvas" role="img" aria-label="Your airport working by itself" />
      <div class="fl-hud">
        <IconButton label="Airport" onClick={() => { if (voice.active) screen.value = 'airport'; }}>🏠</IconButton>
        <span class="hud-chip">👀 🛬 <span ref={count}>0</span></span>
      </div>
    </div>
  );
}
