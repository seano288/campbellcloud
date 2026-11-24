// Draws the orbit: black space and stars, the Earth turning below in the same colours as the questions, the camera's sight in the middle,
// the place to photograph glowing faintly once it is close (with an arrow pointing to it if he has the GPS satellite), and his payload
// drifting away at the start. One globe a frame: about 6,000 points, fine on an iPad 9.
import { drawGlobe, globePoint } from '../art/earth';
import { glows, isUnder, target, type Sim } from './sim';

export interface OrbitScene { resize(): void; frame(s: Sim, now: number): void; readonly globe: () => { cx: number; cy: number; r: number } }
export interface OrbitSetup { readonly night: boolean; readonly gps: boolean; readonly payloadIcon: string; readonly reduced: boolean }

export function createOrbitScene(canvas: HTMLCanvasElement, setup: OrbitSetup): OrbitScene {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, r = 0;
  const stars = Array.from({ length: 90 }, (_, i) => ({ x: (i * 0.618034) % 1, y: (i * 0.41421) % 1, s: i % 9 === 0 ? 2 : 1 }));
  function resize() {
    const b = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = b.width; H = b.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    r = Math.min(W * .46, H * .44); cx = W / 2; cy = H * .52;
  }
  resize();
  function frame(s: Sim, now: number) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#03040c'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    for (const st of stars) ctx.fillRect(((st.x * W - (setup.reduced ? 0 : s.lon * .3)) % W + W) % W, st.y * H, st.s, st.s);
    // a thin glow of air round the Earth
    const halo = ctx.createRadialGradient(cx, cy, r * .98, cx, cy, r * 1.08);
    halo.addColorStop(0, 'rgba(120,190,255,.55)'); halo.addColorStop(1, 'rgba(120,190,255,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2); ctx.fill();
    const g = target(s), glow = g && glows(s);
    drawGlobe(ctx, cx, cy, r, { lon: s.lon, lat: s.lat }, { night: setup.night, t: now, marks: glow ? [{ at: g, kind: 'glow' }] : [] });
    // the GPS arrow points from the sight toward the place while it is on the far side or out of view
    if (g && setup.gps) {
      const p = globePoint(g, { lon: s.lon, lat: s.lat }, cx, cy, r), dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
      if (!isUnder(s) && d > r * .12) {
        const ux = dx / d, uy = dy / d, ax = cx + ux * r * .22, ay = cy + uy * r * .22;
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(Math.atan2(uy, ux));
        ctx.fillStyle = '#2fa84f'; ctx.strokeStyle = '#14161b'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-6, -12); ctx.lineTo(-6, 12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }
    // the camera's sight
    const under = s.phase === 'photo' ? isUnder(s) : s.phase === 'free';
    ctx.strokeStyle = under ? '#ffd23f' : 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(3, r / 60);
    const q = r * .13;
    ctx.beginPath(); ctx.arc(cx, cy, q, 0, Math.PI * 2); ctx.stroke();
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) { ctx.beginPath(); ctx.moveTo(cx + a * q * .6, cy + b * q * .6); ctx.lineTo(cx + a * q * 1.5, cy + b * q * 1.5); ctx.stroke(); }
    // the payload drifting off
    if (s.phase === 'deploy' || (s.phase === 'photo' && s.t < 9)) {
      const k = s.phase === 'deploy' ? 0 : Math.min(1, (s.t - (s.t - s.pt)) / 4);
      ctx.font = `${Math.max(28, r * .16)}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = 1 - k * .8;
      ctx.fillText(setup.payloadIcon, W * .2 + k * W * .15, H * .14 - k * H * .05 + Math.sin(now * 2) * 4);
      ctx.globalAlpha = 1;
    }
  }
  return { resize, frame, globe: () => ({ cx, cy, r }) };
}
