// A coaster drawn from the side: the evening sky, the ground, the supports, two rails, the station, and the train on it. Used by the
// builder, the Ride, Home and "Watch it run". Only the pieces whose span is on screen are drawn, so a long track follows the car
// smoothly on an iPad 9.
import { pointAt, type Profile } from '../physics/motion';
import type { Built, Span } from '../coaster/track';
import { isPieceId, pieceOf } from '../coaster/pieces';
import { itemOf, type BodyItem, type FrontItem, type PaintItem, type RidersItem, type StripeItem, type StyleItem, type ThemeItem } from '../park/catalog';
import { guestPaint, type Weather } from '../coaster/guest';
import { INK, outline, rounded, emoji, type Ctx } from './draw';
import type { Train } from '../park/yard';

/** Where the world is on screen: world (x, y) metres to pixels. */
export interface View { readonly x0: number; readonly y0: number; readonly k: number; readonly w: number; readonly h: number }
export const toScreen = (v: View, x: number, y: number) => [(x - v.x0) * v.k, v.h - (y - v.y0) * v.k] as const;

const SKIES: Record<Weather, [string, string, string]> = {
  sunny: ['#5fc8e8', '#a9e5f0', '#ffe9b0'], sunset: ['#1d6f7a', '#e07a9a', '#ffc46b'], night: ['#0b1636', '#1d2d5e', '#3a3f7a'],
  rain: ['#5a6f80', '#8a9bab', '#b8c4cc'], snow: ['#9fb8d0', '#d6e4f0', '#f6f8fb'], stars: ['#050a20', '#14204a', '#2a2a6a'],
};
/** The sky behind the coaster: the summer evening by default (teal going pink), or a Guest Coaster's weather, or night. */
export function drawSky(ctx: Ctx, w: number, h: number, weather: Weather, t: number) {
  const [a, b, c] = SKIES[weather], g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, a); g.addColorStop(.6, b); g.addColorStop(1, c);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  if (weather === 'night' || weather === 'stars') { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 60; i++) ctx.fillRect((i * 137.1) % w, (i * 71.3) % (h * .6), 1.6, 1.6); }
  if (weather === 'sunset' || weather === 'sunny') { ctx.beginPath(); ctx.arc(w * .82, h * .22, Math.min(w, h) * .07, 0, Math.PI * 2); ctx.fillStyle = weather === 'sunset' ? '#ffd23f' : '#fff6c0'; ctx.fill(); }
  if (weather === 'rain') { ctx.strokeStyle = '#ffffff70'; ctx.lineWidth = 2; for (let i = 0; i < 70; i++) { const x = (i * 97 + t * 300) % w, y = (i * 53 + t * 700) % h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14); ctx.stroke(); } }
  if (weather === 'snow') { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 60; i++) { const x = (i * 97 + Math.sin(t + i) * 20) % w, y = (i * 53 + t * 40) % h; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); } }
}

/** The ground under it all, with far-off fairground bulbs. */
export function drawGround(ctx: Ctx, v: View, night: boolean) {
  const [, gy] = toScreen(v, 0, 0);
  if (gy > v.h) return;
  ctx.fillStyle = night ? '#1f3a2a' : '#5fb84a'; ctx.fillRect(0, gy, v.w, v.h - gy);
  ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(v.w, gy); outline(ctx, 3);
}

interface Look { rail: string; support: string; tie: string; wood: boolean; gold: boolean }
const lookOf = (styleId: string): Look => { const s = itemOf(styleId) as StyleItem; return { rail: s.rail, support: s.support, tie: s.tie, wood: !!s.wood, gold: false }; };
const RAINBOW = ['#e63946', '#ff7a00', '#ffd23f', '#2fa84f', '#2f80ed', '#7b4bd1'];

/** The track: supports down to the ground, ties, two rails; tunnels, water, boosters and brakes on top. Only spans on screen. */
export function drawTrack(ctx: Ctx, b: Built, v: View, styleId: string, opts: { night?: boolean; theme?: string; highlight?: number | null; back?: number | null } = {}) {
  const look = lookOf(styleId), p = b.profile, lw = Math.max(2, v.k * .5);
  const xmin = v.x0 - 20, xmax = v.x0 + v.w / v.k + 20;
  const vis = b.spans.filter(sp => Math.max(sp.x0, sp.x1) >= xmin && Math.min(sp.x0, sp.x1) <= xmax);
  // supports every 5 m, under the track (not under loops' tops)
  ctx.lineWidth = Math.max(2, v.k * .45); ctx.strokeStyle = look.support;
  for (const sp of vis) {
    if (sp.geo.g === 'splash') continue;
    for (let s = Math.ceil(sp.from / 5) * 5; s < sp.to; s += 5) {
      const q = pointAt(p, s);
      if (q.y < 1.5) continue;
      if (sp.geo.g === 'loop' && Math.abs(q.angle) > 1.2) continue;
      const [x, y] = toScreen(v, q.x, q.y), [, gy] = toScreen(v, q.x, 0);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, gy); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(4, v.k * .75); ctx.stroke();
      ctx.strokeStyle = look.support; ctx.lineWidth = Math.max(2, v.k * .45); ctx.stroke();
      if (look.wood && gy - y > 30) { ctx.beginPath(); ctx.moveTo(x - 5 * v.k * .4, gy); ctx.lineTo(x, y); ctx.moveTo(x + 5 * v.k * .4, gy); ctx.lineTo(x, y); ctx.strokeStyle = look.support; ctx.lineWidth = Math.max(1.5, v.k * .25); ctx.stroke(); }
    }
  }
  // water under splash pools
  for (const sp of vis) if (sp.geo.g === 'splash') {
    const [x0, y0] = toScreen(v, sp.x0, 0), [x1] = toScreen(v, sp.x1, 0), [, yb] = toScreen(v, 0, -3.6);
    ctx.fillStyle = '#2f9fe0'; ctx.fillRect(x0, y0 - 2, x1 - x0, yb - y0 + 2); ctx.beginPath(); ctx.rect(x0, y0 - 2, x1 - x0, yb - y0 + 2); outline(ctx, 3);
  }
  // the rails: a black underlay, then the colour; gold for prize pieces, red where it rolls back
  for (const sp of vis) {
    const gold = sp.id.startsWith('pc:') && isPrize(sp.id);
    const pts = spanPoints(p, sp);
    ctx.beginPath(); pts.forEach(([x, y], i) => { const [sx, sy] = toScreen(v, x, y); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); });
    ctx.strokeStyle = INK; ctx.lineWidth = lw * 3.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    const rail = opts.back !== null && opts.back !== undefined && sp.index === opts.back ? '#ff3b3b' : gold ? '#ffd23f' : look.rail === 'rainbow' ? RAINBOW[Math.abs(sp.index) % RAINBOW.length]! : look.rail;
    ctx.strokeStyle = rail; ctx.lineWidth = lw * 1.8; ctx.stroke();
    ctx.strokeStyle = '#ffffff60'; ctx.lineWidth = lw * .5; ctx.stroke();
    if (opts.highlight === sp.index) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = lw * 5; ctx.globalAlpha = .35; ctx.stroke(); ctx.globalAlpha = 1; }
    decorate(ctx, p, sp, v, lw);
  }
  // the station at the start, in his theme
  const st = b.spans[0]!;
  if (st.x1 >= xmin && st.x0 <= xmax) drawStation(ctx, v, st.x0, st.x1, opts.theme ?? 'th:plain');
  const end = b.spans[b.spans.length - 1]!;
  if (end.x1 >= xmin && end.x0 <= xmax) drawStation(ctx, v, end.x0, end.x1, opts.theme ?? 'th:plain');
}
const isPrize = (id: string) => isPieceId(id) && !!pieceOf(id).prize;
function spanPoints(p: Profile, sp: Span): [number, number][] {
  const out: [number, number][] = [];
  const n = Math.max(2, Math.ceil((sp.to - sp.from) / 1.5));
  for (let i = 0; i <= n; i++) { const q = pointAt(p, sp.from + (sp.to - sp.from) * i / n); out.push([q.x, q.y]); }
  return out;
}
function decorate(ctx: Ctx, p: Profile, sp: Span, v: View, lw: number) {
  const g = sp.geo;
  if (g.g === 'flat' && g.look === 'tunnel') {
    const [x0, y] = toScreen(v, sp.x0 + 1, pointAt(p, sp.from).y), [x1] = toScreen(v, sp.x1 - 1, 0), hh = 5 * v.k;
    rounded(ctx, x0, y - hh, x1 - x0, hh + lw, hh * .5); ctx.fillStyle = '#6b5a4a'; ctx.fill(); outline(ctx, 3);
    ctx.fillStyle = '#14161b'; rounded(ctx, x0 + hh * .25, y - hh * .8, Math.max(4, x1 - x0 - hh * .5), hh * .8, hh * .35); ctx.fill();
  }
  if (g.g === 'flat' && g.look === 'booster') for (let s = sp.from + 2; s < sp.to - 1; s += 3) { const q = pointAt(p, s), [x, y] = toScreen(v, q.x, q.y); ctx.beginPath(); ctx.moveTo(x - 4, y - lw * 3); ctx.lineTo(x + 4, y - lw * 1.5); ctx.lineTo(x - 4, y); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.stroke(); }
  if (g.g === 'flat' && g.look === 'brakes') for (let s = sp.from + 2; s < sp.to - 1; s += 3) { const q = pointAt(p, s), [x, y] = toScreen(v, q.x, q.y); ctx.fillStyle = '#e63946'; ctx.fillRect(x - 2, y - lw * 2.5, 4, lw * 2.5); }
  if (g.g === 'flat' && (g.look === 'helix' || g.look === 'turn' || g.look === 'wave')) {
    // a spiral or a banked curve, seen side on: loops of rail drawn faintly behind
    const [x0, y] = toScreen(v, sp.x0, pointAt(p, sp.from).y), [x1] = toScreen(v, sp.x1, 0), n = g.look === 'helix' ? Math.max(2, Math.round((sp.x1 - sp.x0) / 14)) : 1;
    ctx.strokeStyle = '#ffffff90'; ctx.lineWidth = lw * 1.2;
    for (let i = 0; i < n; i++) { const cx = x0 + (x1 - x0) * (i + .5) / n, rx = (x1 - x0) / n / 2, ry = g.look === 'wave' ? 3 * v.k : 2 * v.k; ctx.beginPath(); ctx.ellipse(cx, y - ry, rx, ry, 0, Math.PI, Math.PI * 2); ctx.stroke(); }
  }
  if (g.g === 'twist') {
    const [x0, y0] = toScreen(v, sp.x0, pointAt(p, sp.from).y), [x1] = toScreen(v, sp.x1, 0), turns = g.turns, h = 3 * v.k;
    ctx.strokeStyle = '#ffffffb0'; ctx.lineWidth = lw;
    const mid = (sp.from + sp.to) / 2, py = toScreen(v, 0, pointAt(p, mid).y)[1];
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40, x = x0 + (x1 - x0) * u, y = (y0 + (py - y0) * Math.sin(Math.PI * u)) - Math.sin(u * Math.PI * 2 * turns) * h; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
  }
}

/** The station: a platform with a roof in his theme's colours. */
export function drawStation(ctx: Ctx, v: View, x0: number, x1: number, themeId: string) {
  const th = itemOf(themeId) as ThemeItem, [sx0, gy] = toScreen(v, x0 + 1, 0), [sx1] = toScreen(v, x1 - 1, 0), hh = 7 * v.k;
  ctx.fillStyle = th.wall; ctx.fillRect(sx0, gy - hh, sx1 - sx0, hh * .25);
  for (const x of [sx0 + 4, sx1 - 8]) { ctx.fillStyle = th.wall; ctx.fillRect(x, gy - hh, 4, hh); ctx.beginPath(); ctx.rect(x, gy - hh, 4, hh); outline(ctx, 2); }
  ctx.beginPath(); ctx.moveTo(sx0 - 6, gy - hh); ctx.lineTo((sx0 + sx1) / 2, gy - hh * 1.5); ctx.lineTo(sx1 + 6, gy - hh); ctx.closePath();
  ctx.fillStyle = th.roof; ctx.fill(); outline(ctx, 3);
  emoji(ctx, th.icon, (sx0 + sx1) / 2, gy - hh * 1.18, Math.max(12, hh * .35));
}

// ---------- the train ----------

export interface TrainLook { body: string; stripe: string; front: string; faces: readonly string[]; shape: BodyItem['shape']; seats: number }
export function trainLook(t: Train): TrainLook {
  const body = itemOf(t.body) as BodyItem, front = itemOf(t.front) as FrontItem, stripe = itemOf(t.stripe) as StripeItem, riders = itemOf(t.riders) as RidersItem;
  let colour = '#e63946', stripeCol = '#ffffff';
  if (t.paint.startsWith('gp:')) { const g = guestPaint(Number(t.paint.slice(3))); colour = g.body; stripeCol = g.stripe; }
  else { const pt = itemOf(t.paint) as PaintItem; colour = pt.hex; stripeCol = pt.hex === '#f6f8fb' || pt.hex === '#fff35c' ? '#14161b' : '#ffffff'; }
  return { body: colour, stripe: stripe.pattern === 'none' ? '' : stripeCol + '|' + stripe.pattern, front: front.icon === '⬜' ? '' : front.icon, faces: riders.faces, shape: body.shape, seats: body.seats };
}
export const CAR_LEN = 3.6;
/** The train on the track, its front car at distance `s`; `hands` puts the riders' hands up. */
export function drawTrain(ctx: Ctx, p: Profile, s: number, cars: number, look: TrainLook, v: View, hands: boolean, t: number) {
  const L = CAR_LEN * v.k;
  for (let i = cars - 1; i >= 0; i--) {
    const at = s - i * (CAR_LEN + .4);
    if (at < 0) continue;
    const q = pointAt(p, at), [x, y] = toScreen(v, q.x, q.y);
    if (x < -L * 2 || x > v.w + L * 2) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-q.angle);
    drawCar(ctx, L, look, i === 0, hands, t + i);
    ctx.restore();
  }
}
function drawCar(ctx: Ctx, L: number, look: TrainLook, first: boolean, hands: boolean, t: number) {
  const h = L * .42, lw = Math.max(2, L * .05);
  // riders behind the side
  const n = look.seats >= 6 ? 3 : look.seats >= 4 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const rx = -L * .3 + i * (L * .6 / Math.max(1, n - 1 || 1)) * (n > 1 ? 1 : 0), ry = -h - L * .18;
    if (hands) { ctx.beginPath(); ctx.moveTo(rx - L * .08, ry); ctx.lineTo(rx - L * .12, ry - L * .3 - Math.sin(t * 9) * 2); ctx.moveTo(rx + L * .08, ry); ctx.lineTo(rx + L * .12, ry - L * .3 - Math.cos(t * 9) * 2); ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.5; ctx.stroke(); }
    emoji(ctx, look.faces[(i + Math.floor(t)) % look.faces.length]!, rx, ry, L * .3);
  }
  rounded(ctx, -L / 2, -h - L * .08, L, h, L * .12);
  ctx.fillStyle = look.body; ctx.fill(); outline(ctx, lw);
  if (look.stripe) {
    const [col, pat] = look.stripe.split('|');
    ctx.fillStyle = col!;
    if (pat === 'one' || pat === 'two') { ctx.fillRect(-L / 2 + lw, -h * .62, L - lw * 2, h * .14); if (pat === 'two') ctx.fillRect(-L / 2 + lw, -h * .36, L - lw * 2, h * .1); }
    else if (pat === 'checks') for (let i = 0; i < 8; i++) { if (i % 2) ctx.fillRect(-L / 2 + lw + i * (L - lw * 2) / 8, -h * .6, (L - lw * 2) / 8, h * .2); }
    else { const e: Record<string, string> = { stars: '⭐', flames: '🔥', zigzag: '⚡', dots: '⚪', waves: '🌊', hearts: '❤️' }; for (let i = 0; i < 3; i++) emoji(ctx, e[pat!] ?? '⭐', -L * .3 + i * L * .3, -h * .5, h * .38); }
  }
  for (const wx of [-L * .3, L * .3]) { ctx.beginPath(); ctx.arc(wx, -L * .06, L * .1, 0, Math.PI * 2); ctx.fillStyle = '#3a3f48'; ctx.fill(); outline(ctx, lw * .8); }
  if (first && look.front) emoji(ctx, look.front, L * .52, -h * .6, L * .32);
  if (first) { ctx.beginPath(); ctx.arc(L * .45, -h * .2, L * .05, 0, Math.PI * 2); ctx.fillStyle = '#fff6a0'; ctx.fill(); }
}
