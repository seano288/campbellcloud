// Draws the Flight on a 2D canvas. The taxi is from above: his own airport (art/airport.ts), the camera on the plane, the finger's spot
// marked, and the follow-me car when it comes. From the line-up on it's from the side: the sky for the Route's weather and time of day,
// scenery that slides by slower than the plane, clouds, the stars to pick up, fires below for the water bomber, the far airport built from
// its parts, and the line of lights down to its runway. Particles are capped (rain or snow at 70) for the iPad 9.
import { drawAirport, roundRect, type AirportLook } from '../art/airport';
import { drawPlaneSide, drawPlaneTop, shade, type Look } from '../art/plane';
import { seeded } from '../../game/rng';
import { PLOT_H, PLOT_W, HOLD_POINT, taxiPath } from '../airport/plot';
import { SKY_HIGH, type Destination, type Scene } from '../airport/routes';
import { cruiseStart, glideAlt, type Flight } from './sim';


const SKY: Record<'day' | 'night' | 'grey', [string, string]> = { day: ['#4fa3e8', '#bfe6ff'], night: ['#0b1636', '#2a3b6e'], grey: ['#7d8ea3', '#c9d3de'] };
const GROUND: Partial<Record<Scene, string>> = { beach: '#e9d39a', desert: '#e3c38a', canyon: '#c8744a', snow: '#f4f8ff', pole: '#f4f8ff', glacier: '#dff3ff', jungle: '#2f8a3f', volcano: '#4a3a34', space: '#8a8f9c', island: '#e9d39a', reef: '#e9d39a' };
const HILLS: Partial<Record<Scene, string>> = { mountain: '#7d8ea3', canyon: '#b8603a', volcano: '#5a4038', snow: '#cfe0f0', pole: '#dfeaf6', glacier: '#bfe0f5', jungle: '#1f6b3a', desert: '#d7a868', city: '#6b7a8f', castle: '#6f8a5a' };

export interface Scene2D {
  resize(): void;
  /** The plot point under a finger at (px, py) on the canvas, while taxiing. */
  toPlot(px: number, py: number): { x: number; y: number };
  /** The height a finger at canvas y asks for, in the air. */
  toAlt(py: number): number;
  frame(f: Flight, t: number, look: Look, airport: AirportLook, finger: { x: number; y: number } | null, lightColour: string): void;
}

export function createScene(canvas: HTMLCanvasElement, dest: Destination, reduced: boolean): Scene2D {
  const ctx = canvas.getContext('2d')!;
  let w = 0, h = 0, dpr = 1;
  const rng = seeded(dest.id.length * 977 + dest.distance);
  // clouds, scenery and particles are made once
  const clouds = Array.from({ length: 26 }, () => ({ x: rng() * 1, alt: 120 + rng() * 420, s: .6 + rng() * 1.2, dark: dest.weather === 'rain' && rng() < .5 }));
  const hills = Array.from({ length: 30 }, (_, i) => ({ x: i * 420 + rng() * 200, hgt: 60 + rng() * 140, wid: 260 + rng() * 260 }));
  const props = Array.from({ length: 60 }, (_, i) => ({ x: i * 260 + rng() * 120, kind: rng() }));
  const flakes = Array.from({ length: reduced ? 20 : 70 }, () => ({ x: rng(), y: rng(), v: .5 + rng() }));
  const nightStars = Array.from({ length: 50 }, () => ({ x: rng(), y: rng() * .6 }));
  let plotScale = 1, plotX = 0, plotY = 0;
  // the side view: how many pixels a Flight unit is, and where the ground is
  let k = 1, groundY = 0, camX = 0;
  const sx = (x: number) => (x - camX) * k + w * .3, sy = (alt: number) => groundY - alt * k;

  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  resize();

  function taxi(f: Flight, t: number, look: Look, airport: AirportLook, finger: { x: number; y: number } | null) {
    // the camera on the plane, zoomed so a good piece of the airport shows
    plotScale = Math.max(Math.min(w, h) / 520, Math.min(w / PLOT_W, h / PLOT_H) * 1.5);
    plotX = Math.max(Math.min(0, w / 2 - f.tx * plotScale), w - PLOT_W * plotScale);
    plotY = Math.max(Math.min(0, h / 2 - f.ty * plotScale), h - PLOT_H * plotScale);
    if (PLOT_W * plotScale < w) plotX = (w - PLOT_W * plotScale) / 2;
    if (PLOT_H * plotScale < h) plotY = (h - PLOT_H * plotScale) / 2;
    ctx.save(); ctx.translate(plotX, plotY); ctx.scale(plotScale, plotScale);
    drawAirport(ctx, airport, t, dest.night && false);
    // the way to go: arrows along the path, and the runway end glowing
    const path = taxiPath(f.setup.taxi!.from);
    ctx.strokeStyle = 'rgba(255,210,63,.85)'; ctx.lineWidth = 6; ctx.setLineDash([10, 12]); ctx.lineDashOffset = -t * 40;
    ctx.beginPath(); ctx.moveTo(f.tx, f.ty); for (let i = f.pathAt; i < path.length; i++) ctx.lineTo(path[i]!.x, path[i]!.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = `rgba(61,220,132,${.4 + .3 * Math.sin(t * 5)})`; ctx.beginPath(); ctx.arc(HOLD_POINT.x, HOLD_POINT.y, 40, 0, 7); ctx.fill();
    if (f.followMe) { const p = path[Math.min(path.length - 1, f.pathAt)]!, a = Math.atan2(p.y - f.ty, p.x - f.tx); ctx.save(); ctx.translate(f.tx + Math.cos(a) * 60, f.ty + Math.sin(a) * 60); ctx.rotate(a); ctx.fillStyle = '#ffd23f'; roundRect(ctx, -12, -7, 24, 14, 3); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#111'; ctx.font = '900 7px Nunito'; ctx.textAlign = 'center'; ctx.fillText('FOLLOW', 0, 3); ctx.restore(); }
    if (finger) { const p = toPlot(finger.x, finger.y); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, 16 + Math.sin(t * 8) * 3, 0, 7); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(f.tx + 4, f.ty + 6, 26, 14, 0, 0, 7); ctx.fill();
    drawPlaneTop(ctx, look, f.tx, f.ty, f.heading, .9, t);
    ctx.restore();
  }

  function sky(t: number) {
    const tone = dest.night ? SKY.night : dest.weather === 'rain' || dest.weather === 'fog' || dest.weather === 'snow' ? SKY.grey : SKY.day;
    const g = ctx.createLinearGradient(0, 0, 0, groundY); g.addColorStop(0, tone[0]); g.addColorStop(1, tone[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (dest.night) { ctx.fillStyle = '#fff'; for (const s of nightStars) { ctx.globalAlpha = .5 + .5 * Math.sin(t * 2 + s.x * 40); ctx.fillRect(s.x * w, s.y * groundY, 2, 2); } ctx.globalAlpha = 1; ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(w * .82, h * .14, 22, 0, 7); ctx.fill(); }
    else if (dest.weather === 'clear') { ctx.fillStyle = '#fff3a6'; ctx.beginPath(); ctx.arc(w * .85, h * .13, 28, 0, 7); ctx.fill(); }
  }

  function scenery(f: Flight) {
    // far hills slide by at a fifth of the speed
    const hc = HILLS[dest.scene];
    if (hc) {
      ctx.fillStyle = dest.night ? shade(hc, -.5) : hc;
      for (const hl of hills) { const x = (hl.x - camX * .2) * k * .9 + w * .3; if (x + hl.wid * k < -50 || x - hl.wid * k > w + 50) continue; ctx.beginPath(); ctx.moveTo(x - hl.wid * k * .6, groundY); ctx.lineTo(x, groundY - hl.hgt * k * (dest.scene === 'city' ? 1 : 1.2)); ctx.lineTo(x + hl.wid * k * .6, groundY); ctx.fill();
        if (dest.scene === 'volcano' && hl.hgt > 150) { ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.arc(x, groundY - hl.hgt * k * 1.2, 8 * k, 0, 7); ctx.fill(); ctx.fillStyle = dest.night ? shade(hc, -.5) : hc; } }
    }
    // the ground
    const sea = dest.sea || dest.scene === 'beach' || dest.scene === 'coast' || dest.scene === 'harbour' || dest.scene === 'lighthouse';
    ctx.fillStyle = dest.night ? '#1f3324' : GROUND[dest.scene] ?? '#7cc46a'; ctx.fillRect(0, groundY, w, h - groundY);
    if (sea) { // water in the middle of the trip
      const a = sx(f.setup.runway + 1200), b = sx(f.cruiseEnd - 800);
      ctx.fillStyle = dest.night ? '#123a5a' : '#3b8fd8'; ctx.fillRect(Math.max(0, a), groundY, Math.min(w, b) - Math.max(0, a), h - groundY);
    }
    // near things: trees, houses, cacti, flowers, at full speed
    for (const p of props) {
      const x = sx(f.setup.runway + 200 + p.x);
      if (x < -40 || x > w + 40) continue;
      const glyph = dest.scene === 'desert' || dest.scene === 'canyon' ? '🌵' : dest.scene === 'snow' || dest.scene === 'pole' || dest.scene === 'glacier' ? '🌲' : dest.scene === 'city' ? (p.kind < .5 ? '🏢' : '🏠') : dest.scene === 'jungle' || dest.scene === 'beach' || dest.scene === 'island' ? '🌴' : dest.scene === 'farm' ? (p.kind < .3 ? '🐄' : '🌳') : p.kind < .4 ? '🏠' : '🌳';
      ctx.font = `${Math.max(14, 34 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(glyph, x, groundY + 4);
    }
  }

  function runway(x0: number, len: number, colour: string) {
    const a = sx(x0), b = sx(x0 + len);
    if (b < 0 || a > w) return;
    ctx.fillStyle = colour; ctx.fillRect(a, groundY - 4, b - a, 14);
    ctx.fillStyle = '#f4f6fa'; for (let x = x0 + 30; x < x0 + len - 30; x += 90) ctx.fillRect(sx(x), groundY + 1, 40 * k, 3);
  }

  function farAirport(f: Flight) {
    const x0 = f.threshold, far = dest.far;
    runway(x0, far.runway, '#3a3f4b');
    for (const p of far.parts) {
      const x = sx(x0 + p.x), wd = p.w * k, ht = p.h * k, base = groundY - 6;
      if (x > w + 60 || x + wd < -60) continue;
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#111';
      if (p.kind === 'tree') { ctx.font = `${ht}px sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(dest.scene === 'snow' || dest.scene === 'pole' ? '🌲' : '🌳', x, base + 4); continue; }
      if (p.kind === 'tower') { ctx.fillStyle = far.wall; ctx.fillRect(x + wd * .3, base - ht, wd * .4, ht); ctx.strokeRect(x + wd * .3, base - ht, wd * .4, ht); ctx.fillStyle = '#2a4a6a'; ctx.fillRect(x, base - ht - 16 * k, wd, 18 * k); ctx.strokeRect(x, base - ht - 16 * k, wd, 18 * k); continue; }
      if (p.kind === 'sign') { ctx.fillStyle = '#14161b'; ctx.fillRect(x, base - ht, wd, ht * .6); ctx.fillStyle = '#ffd23f'; ctx.font = `900 ${Math.max(9, 12 * k)}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✈', x + wd / 2, base - ht * .7); continue; }
      ctx.fillStyle = p.kind === 'hangar' ? '#8a96a3' : far.wall; ctx.fillRect(x, base - ht, wd, ht); ctx.strokeRect(x, base - ht, wd, ht);
      ctx.fillStyle = far.roof; ctx.fillRect(x - 3, base - ht - 8 * k, wd + 6, 8 * k); ctx.strokeRect(x - 3, base - ht - 8 * k, wd + 6, 8 * k);
      if (p.kind === 'terminal') { ctx.fillStyle = dest.night ? '#ffe9a0' : '#9fd8ff'; for (let i = 0; i < Math.floor(wd / (14 * k)); i++) ctx.fillRect(x + 6 + i * 14 * k, base - ht * .65, 8 * k, ht * .3); }
    }
  }

  function frame(f: Flight, t: number, look: Look, airport: AirportLook, finger: { x: number; y: number } | null, lightColour: string) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (f.phase === 'taxi') { ctx.fillStyle = '#8fd17a'; ctx.fillRect(0, 0, w, h); taxi(f, t, look, airport, finger); return; }
    groundY = h * .84; k = (groundY - h * .06) / (SKY_HIGH + 60); camX = f.x;
    sky(t);
    // clouds, slower than the plane
    for (const c of clouds) {
      // each cloud comes round again every 3000 units, at 70% of the plane's speed
      const cx = (((c.x * 3000 - camX * .7) % 3000) + 3000) % 3000 * k - 200, cy = sy(c.alt);
      ctx.fillStyle = c.dark ? 'rgba(110,120,135,.85)' : dest.night ? 'rgba(160,170,200,.35)' : 'rgba(255,255,255,.88)';
      for (const [dx, dy, r] of [[0, 0, 28], [26, -8, 22], [-24, -4, 20], [10, -18, 18]] as const) { ctx.beginPath(); ctx.arc(cx + dx * c.s * k * 2, cy + dy * c.s * k * 2, r * c.s * k * 2, 0, 7); ctx.fill(); }
    }
    if (dest.weather === 'fog') { ctx.fillStyle = 'rgba(230,236,242,.35)'; ctx.fillRect(0, 0, w, groundY); }
    scenery(f);
    // his runway, and the far one
    runway(-200, f.setup.runway + 200, '#3a3f4b');
    farAirport(f);
    // stars (or crates) along the cruise
    const cs = cruiseStart(f), crate = f.setup.ability === 'cargo';
    dest.stars.forEach((s, i) => {
      if (f.stars[i]) return;
      const x = sx(cs + s.x), y = sy(s.alt);
      if (x < -40 || x > w + 40) return;
      ctx.font = `${Math.max(22, 40 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.save(); ctx.translate(x, y); if (!reduced) ctx.rotate(Math.sin(t * 3 + i) * .2); ctx.fillText(crate ? '📦' : '⭐', 0, 0); ctx.restore();
    });
    if (f.setup.ability === 'water') dest.fires.forEach((fx, i) => {
      const x = sx(cs + fx);
      if (x < -40 || x > w + 40) return;
      ctx.font = `${Math.max(22, 36 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(f.fires[i] ? '💨' : '🔥', x, groundY + 2);
    });
    // the line of lights down to the far runway
    if (f.phase === 'approach' || f.phase === 'goaround' || f.x > f.cruiseEnd - 1500) {
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.setLineDash([8, 10]);
      ctx.beginPath(); ctx.moveTo(sx(f.threshold - 2400), sy(glideAlt(f, f.threshold - 2400))); ctx.lineTo(sx(f.threshold), sy(0)); ctx.stroke(); ctx.setLineDash([]);
      f.lightAt.forEach((l, i) => {
        const x = sx(l.x), y = sy(l.alt);
        if (x < -30 || x > w + 30) return;
        ctx.lineWidth = 5; ctx.strokeStyle = f.lights[i] ? '#3ddc84' : lightColour === 'rainbow' ? `hsl(${i * 40} 90% 60%)` : lightColour;
        ctx.beginPath(); ctx.arc(x, y, 22 * Math.max(.6, k), 0, 7); ctx.stroke();
      });
    }
    // the plane
    const tilt = f.phase === 'climb' ? -.18 : f.phase === 'goaround' ? -.25 : f.phase === 'approach' ? Math.max(-.2, Math.min(.2, f.valt / -900)) + .05 : f.phase === 'cruise' ? Math.max(-.25, Math.min(.25, -f.valt / 700)) : 0;
    const scale = Math.max(.5, k * 1.25), px = sx(f.x), py = sy(f.alt) - 12 * scale;
    if (f.setup.ability === 'spray' && f.phase === 'cruise') { ctx.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.arc(px - 40 * scale - i * 14, py + 8 + Math.sin(t * 9 + i) * 4, 5 + i, 0, 7); ctx.fill(); } }
    drawPlaneSide(ctx, look, px, py, scale, { t, gear: f.alt < 80, tilt });
    if (finger && f.phase !== 'roll') { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(px + 40, py); ctx.lineTo(finger.x, finger.y); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(finger.x, finger.y, 14, 0, 7); ctx.stroke(); }
    // rain or snow
    if (dest.weather === 'rain' || dest.weather === 'snow') {
      ctx.fillStyle = dest.weather === 'snow' ? 'rgba(255,255,255,.9)' : 'rgba(200,220,255,.7)';
      for (const p of flakes) {
        const y = ((p.y + t * p.v * (dest.weather === 'snow' ? .15 : .9)) % 1) * h, x = ((p.x - t * .1 - camX * .00005) % 1 + 1) % 1 * w;
        if (dest.weather === 'snow') { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); } else ctx.fillRect(x, y, 1.6, 10);
      }
    }
    if (dest.night) { ctx.fillStyle = 'rgba(5,10,30,.25)'; ctx.fillRect(0, 0, w, h); }
    if (f.setup.radar && f.phase === 'cruise') radarPanel(f, t);
  }

  /** The Radar piece: a scope in the corner showing the next stars ahead, above or below the plane. */
  function radarPanel(f: Flight, t: number) {
    const r = Math.min(70, w * .1), cx = w - r - 24, cy = h - r - Math.max(70, h * .1), at = f.x - cruiseStart(f);
    ctx.fillStyle = 'rgba(8,30,18,.85)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(61,220,132,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r * .5, 0, 7); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 2); ctx.fillStyle = 'rgba(61,220,132,.25)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, 0, .6); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ffd23f';
    dest.stars.forEach((s, i) => {
      if (f.stars[i] || s.x < at || s.x > at + 2400) return;
      const dx = ((s.x - at) / 2400) * r * .9 - r * .3, dy = ((f.alt - s.alt) / 300) * r * .6;
      ctx.beginPath(); ctx.arc(cx + dx, cy + Math.max(-r * .8, Math.min(r * .8, dy)), 5, 0, 7); ctx.fill();
    });
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - r * .3 + 7, cy); ctx.lineTo(cx - r * .3 - 6, cy - 5); ctx.lineTo(cx - r * .3 - 6, cy + 5); ctx.fill();
  }

  function toPlot(px: number, py: number) { return { x: (px - plotX) / plotScale, y: (py - plotY) / plotScale }; }
  const toAlt = (py: number) => (groundY - py) / k;
  return { resize, toPlot, toAlt, frame };
}
