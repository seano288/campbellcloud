// Draws a Mission from the side on a 2D canvas: the sky and the sea of the place he's at (darker at night), his carrier at the start and
// again when he comes home, the job (rings, storm clouds, a whale or dolphins or a ferry to follow, lost boats, islands for the crates,
// rafts), his aircraft (and a wingman for each extra catapult), the landing lights and the wires. The camera follows the aircraft. No
// art files and no library; tuned to hold 60 fps on an iPad 9 (a few dozen shapes a frame, no shadows or filters).
import type { Model } from '../ship/catalog';
import type { Chart, Subject } from '../ship/missions';
import type { ShipState } from '../ship/ship';
import { drawAircraft, type AirLook } from '../art/aircraft';
import { DECK, drawCarrierSide, drawFleetShip } from '../art/ship';
import type { ShipLook } from '../ship/catalog';
import { LIGHTS_END, pathAlt, TUNING, wireX, type Sim } from './sim';

export interface Scene {
  resize(): void;
  frame(s: Sim, now: number): void;
  /** The height a finger at screen y asks for. */
  toAlt(y: number): number;
}
export interface SceneSetup {
  readonly place: Chart; readonly night: boolean; readonly waves: number; readonly subject: Subject;
  readonly look: AirLook; readonly model: Model; readonly ship: ShipState; readonly wingmen: readonly AirLook[]; readonly fleet: readonly ShipLook[];
  readonly reduced: boolean;
}

const SUBJECT_ICON: Record<Subject, string> = { whale: '🐋', dolphins: '🐬', turtle: '🐢', ferry: '⛴️', rowboat: '🚣', canoe: '🛶', kayak: '🛶', fishing: '🎣', raft: '🛟', crate: '📦', rings: '⭕', clouds: '⛈️' };
const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i]! - v) * k)).join(',')})`;
};

export function createScene(canvas: HTMLCanvasElement, setup: SceneSetup): Scene {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, k = 1, seaY = 0, dpr = 1;
  const trail: { x: number; alt: number }[] = [];
  const clouds = Array.from({ length: 9 }, (_, i) => ({ x: i * 520 + (i * 197) % 300, alt: 300 + ((i * 131) % 230), w: 90 + (i * 37) % 80 }));
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    // the whole height from the sea to the ceiling fits, and about 800 units are seen ahead and behind (more on a wide screen)
    k = Math.min((H * .82) / TUNING.maxAlt, W / 800);
    seaY = H * .84;
  }
  resize();
  const sx = (camX: number, x: number) => W * .26 + (x - camX) * k;
  const sy = (alt: number) => seaY - alt * k;

  function frame(s: Sim, now: number) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const camX = s.x, night = setup.night, place = setup.place;
    // sky and sea
    const top = night ? '#0b1230' : mix(place.sky, '#ffffff', .15), low = night ? '#1d2a55' : mix(place.sky, '#ffffff', .55);
    const g = ctx.createLinearGradient(0, 0, 0, seaY); g.addColorStop(0, top); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, seaY);
    if (night) { ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const x = ((i * 137 - camX * .05) % W + W) % W, y = (i * 61) % (seaY * .7); ctx.fillRect(x, y, 2, 2); } }
    // far clouds, slower than the world (parallax)
    ctx.fillStyle = night ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.75)';
    for (const c of clouds) {
      const x = ((c.x - camX * .4) % 4700 + 4700) % 4700 - 600;
      const px = W * .26 + x * k, py = sy(c.alt);
      ctx.beginPath(); ctx.ellipse(px, py, c.w * k, c.w * .35 * k, 0, 0, Math.PI * 2); ctx.ellipse(px + c.w * .5 * k, py - 10 * k, c.w * .6 * k, c.w * .3 * k, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = night ? '#0d1b3d' : place.sea; ctx.fillRect(0, seaY, W, H - seaY);
    // waves
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
    const amp = 2 + setup.waves * 6, t = setup.reduced ? 0 : now;
    for (let row = 0; row < 3; row++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) { const wx = x / k + camX; ctx.lineTo(x, seaY + 8 + row * 18 + Math.sin(wx / 60 + t * 2 + row) * amp); }
      ctx.stroke();
    }
    if (place.ice) { ctx.fillStyle = '#eaf6ff'; for (let i = -2; i < 8; i++) { const x = sx(camX, Math.floor(camX / 700) * 700 + i * 700 + 300); ctx.beginPath(); ctx.ellipse(x, seaY + 6, 60 * k, 10 * k, 0, 0, Math.PI * 2); ctx.fill(); } }

    // his carrier at the start and when he comes home, and the Fleet beside it
    const ships = [0, s.stern];
    for (const stern of ships) {
      const left = sx(camX, stern);
      if (left > W + 50 || left + (s.setup.deckLen + 80) * k < -50) continue;
      setup.fleet.slice(0, 3).forEach((f, i) => drawFleetShip(ctx, f, left - (180 + i * 160) * k, seaY - 4 * k, k * .55, now));
      drawCarrierSide(ctx, setup.ship, left, seaY, k, now, { night, parked: stern === 0 && s.phase !== 'deck', skipPlane: setup.model });
      if (stern !== 0) for (let w = 1; w <= s.setup.wires; w++) {
        const x = sx(camX, wireX(s, w));
        ctx.strokeStyle = s.wire === w ? '#3ddc84' : '#f4f6fa'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, sy(DECK) - 2); ctx.lineTo(x, sy(DECK) - 7); ctx.stroke();
      }
    }
    // the catapult's steam and gauge mark on the deck
    if (s.phase === 'deck' || s.phase === 'catapult') {
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(sx(camX, s.x - 30 - i * 12), sy(DECK) - 6 - (i % 2) * 6 - s.gauge * 8, (6 + s.gauge * 8) * k, 0, Math.PI * 2); ctx.fill(); }
    }

    // the job
    for (const tg of s.targets) {
      const x = sx(camX, tg.x);
      if (x < -120 || x > W + 120) continue;
      const y = sy(tg.alt), r = tg.r * k;
      if (setup.subject === 'rings') {
        ctx.lineWidth = 7 * k + 2; ctx.strokeStyle = tg.got ? '#3ddc84' : tg.passed ? 'rgba(255,255,255,.35)' : '#ffd23f';
        ctx.beginPath(); ctx.ellipse(x, y, r * .35, r, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (setup.subject === 'clouds') {
        ctx.fillStyle = tg.got ? 'rgba(180,200,220,.6)' : 'rgba(60,70,90,.85)';
        ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r * .6, 0, 0, Math.PI * 2); ctx.ellipse(x + r * .5, y - r * .3, r * .7, r * .5, 0, 0, Math.PI * 2); ctx.fill();
        if (!tg.got && Math.floor(now * 3 + tg.x) % 5 === 0) { ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + r * .4); ctx.lineTo(x - 8, y + r); ctx.lineTo(x + 4, y + r); ctx.lineTo(x - 4, y + r * 1.6); ctx.stroke(); }
        if (tg.got) emoji(ctx, '✅', x, y, 22);
      } else {
        // a whale, dolphins, a turtle or a ferry to follow; or a lost boat to find, waiting with its flag
        const bob = Math.sin(now * 2 + tg.x) * 3;
        emoji(ctx, SUBJECT_ICON[setup.subject], x, seaY - 6 + bob, Math.max(26, 44 * k));
        // the ring of where to fly, low over it
        ctx.setLineDash([6, 6]); ctx.strokeStyle = tg.got ? '#3ddc84' : 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x, y, r * .3, r * .8, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        if (tg.got) emoji(ctx, setup.subject === 'ferry' || setup.subject === 'whale' || setup.subject === 'dolphins' || setup.subject === 'turtle' ? '📸' : '🚩', x, seaY - 46 * k - 18, 24);
      }
    }
    for (const is of s.islands) {
      const x = sx(camX, is.x);
      if (x < -200 || x > W + 200) continue;
      ctx.fillStyle = place.ice ? '#f4fbff' : '#e8cf8f'; ctx.strokeStyle = '#14161b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, seaY + 2, TUNING.islandHalf * k * 1.15, 16 * k + 6, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      if (!place.ice) emoji(ctx, '🌴', x - 40 * k, seaY - 22 * k, Math.max(20, 34 * k));
      ctx.strokeStyle = '#e63946'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x - 10, seaY - 14); ctx.lineTo(x + 10, seaY - 2); ctx.moveTo(x + 10, seaY - 14); ctx.lineTo(x - 10, seaY - 2); ctx.stroke();
      if (is.landed !== null) emoji(ctx, is.score === 2 ? '🎯' : is.score === 1 ? '📦' : '💦', sx(camX, is.landed), seaY - 16, 24);
    }
    for (const c of s.crates) {
      if (c.alt <= 0) continue;
      const x = sx(camX, c.x), y = sy(c.alt);
      ctx.strokeStyle = '#14161b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y - 22); ctx.moveTo(x, y); ctx.lineTo(x + 12, y - 22); ctx.stroke();
      ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.arc(x, y - 24, 16, Math.PI, 0); ctx.fill(); ctx.stroke();
      emoji(ctx, '📦', x, y + 4, 20);
    }
    for (const r of s.rafts) {
      if (r.rescued) continue;
      const x = sx(camX, r.x);
      if (x < -100 || x > W + 100) continue;
      emoji(ctx, '🛟', x, seaY - 4 + Math.sin(now * 2 + r.x) * 3, Math.max(26, 40 * k));
      emoji(ctx, '🙋', x + 12, seaY - 20 + Math.sin(now * 2 + r.x) * 3, Math.max(18, 26 * k));
    }

    // the landing lights, on the way home: green once he flew by them on the line
    if (s.phase === 'approach' || s.phase === 'return' || s.phase === 'around' || s.phase === 'trap') {
      for (const l of s.lights) {
        const x = sx(camX, l.x);
        if (x < -20 || x > W + 20) continue;
        ctx.fillStyle = l.on ? '#3ddc84' : '#ffb000';
        ctx.beginPath(); ctx.arc(x, sy(pathAlt(s, l.x)), 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#14161b'; ctx.lineWidth = 2; ctx.stroke();
      }
      // where the lights end, over the stern
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx(camX, s.stern - 200), sy(LIGHTS_END)); ctx.lineTo(sx(camX, s.stern), sy(LIGHTS_END)); ctx.stroke(); ctx.setLineDash([]);
    }

    // the display jet's coloured smoke
    if (setup.model === 'display' && s.phase !== 'deck' && s.phase !== 'catapult') {
      trail.push({ x: s.x, alt: s.alt });
      if (trail.length > 90) trail.shift();
      const cs = ['#e63946', '#2f8fe8', '#f4f6fa'];
      cs.forEach((c, j) => { ctx.strokeStyle = c; ctx.globalAlpha = .55; ctx.lineWidth = 5; ctx.beginPath(); trail.forEach((p, i) => { const x = sx(camX, p.x) - 30, y = sy(p.alt) - 8 + (j - 1) * 6; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke(); });
      ctx.globalAlpha = 1;
    }
    // the winch line
    if (s.hovering !== null && s.winch > 0) {
      const x = sx(camX, s.x), y0 = sy(s.alt) - 6, y1 = y0 + (seaY - 10 - y0) * s.winch;
      ctx.strokeStyle = '#14161b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      emoji(ctx, s.lifting > 0 ? '🙋' : '🪝', x, y1, 20);
    }
    // wingmen, in formation behind him once airborne
    if (s.phase !== 'deck' && s.phase !== 'catapult' && s.phase !== 'trap' && s.phase !== 'done') {
      setup.wingmen.forEach((w, i) => drawAircraft(ctx, w, sx(camX, s.x - 110 - i * 70), sy(s.alt + 40 + i * 30) + Math.sin(now * 2 + i) * 4, k * 1.1, now, { gear: false }));
    }
    // his aircraft
    const air = s.phase !== 'deck' && s.phase !== 'catapult' && s.phase !== 'trap' && s.phase !== 'done';
    const tilt = s.phase === 'deck' || s.phase === 'trap' || s.phase === 'done' ? 0 : Math.max(-.35, Math.min(.35, -s.valt / 500));
    drawAircraft(ctx, setup.look, sx(camX, s.x), sy(s.alt), k * 1.6, now, { gear: !air || s.phase === 'approach', hook: s.phase === 'approach' || s.phase === 'trap', tilt });
  }

  return { resize, frame, toAlt: (y: number) => (seaY - y) / k };
}

function emoji(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number) {
  ctx.font = `${size}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}
