// The Roost drawn: a mountain at dawn with ledge after ledge up its side (another for every New Ledge, without a top: the highest few are
// drawn), nests with his eggs warming in them, his dragons sitting, sleeping and playing on the ledges (as many as his perches let the
// mountain show, at most ten, so the iPad 9 keeps up), the pieces he has bought in their places, and the hearth at the bottom, burning
// brighter the more Flames he has. It never goes out, even at none.
import { drawDragon, drawEgg } from './dragon';
import { ROOST } from '../roost/catalog';
import { drawnDragons, has, hatchNeed, lookOf, nestCount, type RoostState } from '../roost/roost';
import { stageOf, marksOf } from '../roost/dragons';

/** Where each ledge is, from the bottom, as fractions of the picture. */
export function ledges(n: number): { x: number; y: number; w: number }[] {
  const out: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i < n; i++) {
    const k = i / Math.max(1, n - 1), side = i % 2 ? 1 : -1;
    out.push({ x: .5 + side * (.2 - k * .12), y: .82 - k * .62, w: .34 - k * .14 });
  }
  return out;
}

export function drawRoost(ctx: CanvasRenderingContext2D, a: RoostState, balance: number, w: number, h: number, t: number, still: boolean) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ff9fb8'); g.addColorStop(.55, '#ffd28f'); g.addColorStop(1, '#fff1cf');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(w * .85, h * .15, Math.min(w, h) * .07, 0, Math.PI * 2); ctx.fill();
  // far hills and the green valley
  ctx.fillStyle = '#c98aa6'; ctx.beginPath(); ctx.moveTo(0, h * .75); for (let x = 0; x <= w; x += 10) ctx.lineTo(x, h * (.68 + .05 * Math.sin(x / 60))); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  ctx.fillStyle = '#3f9b4f'; ctx.fillRect(0, h * .9, w, h * .1);
  // the mountain
  ctx.fillStyle = '#b9735a'; ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w * .1, h * .95); ctx.lineTo(w * .42, h * .08); ctx.lineTo(w * .5, h * .04); ctx.lineTo(w * .58, h * .09); ctx.lineTo(w * .9, h * .95); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c98a6e'; ctx.beginPath(); ctx.moveTo(w * .5, h * .04); ctx.lineTo(w * .58, h * .09); ctx.lineTo(w * .9, h * .95); ctx.lineTo(w * .6, h * .95); ctx.closePath(); ctx.fill();
  // ledges: the bottom three, then one for each New Ledge (the top eight drawn)
  const total = 3 + a.more.ledge, shown = Math.min(8, total), ls = ledges(shown);
  ls.forEach(l => {
    ctx.fillStyle = '#8a5a44'; ctx.strokeStyle = '#2a1a12';
    ctx.beginPath(); ctx.roundRect((l.x - l.w / 2) * w, l.y * h, l.w * w, h * .025, 6); ctx.fill(); ctx.stroke();
  });
  // the pieces he owns, as their pictures, along the ledges
  const pieces = ROOST.filter(r => r.does !== 'nest' && has(a, r.id));
  ctx.font = `${Math.min(w, h) * .05}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  pieces.slice(0, 24).forEach((p, i) => {
    const l = ls[i % ls.length]!, k = (Math.floor(i / ls.length) + .5) / Math.ceil(Math.max(1, pieces.length) / ls.length);
    ctx.fillText(p.icon, (l.x - l.w / 2 + l.w * Math.min(.95, k)) * w, l.y * h);
  });
  // nests and eggs, on the lowest ledges
  const nests = Math.min(nestCount(a), 12);
  for (let i = 0; i < nests; i++) {
    const l = ls[i % ls.length]!, x = (l.x - l.w * .35 + (Math.floor(i / ls.length) * .22)) * w, y = l.y * h, s = Math.min(w, h) * .06;
    ctx.fillStyle = '#a8763e'; ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y - s * .15, s * .7, s * .28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const egg = a.eggs[i];
    if (egg) { ctx.save(); ctx.translate(x, y - s * .55); drawEgg(ctx, lookOf({ id: 0, egg: egg.egg, name: null, flights: 0 }), s * 1.1, Math.min(1, egg.warmth / hatchNeed(a, egg.egg)), still ? 0 : t); ctx.restore(); }
  }
  // dragons on the ledges
  const shownDragons = a.dragons.slice(-drawnDragons(a));
  shownDragons.forEach((d, i) => {
    const l = ls[(i + 1) % ls.length]!, x = (l.x + l.w * (.15 + (i % 3) * .12) - l.w * .2) * w, y = l.y * h, s = Math.min(w, h) * .17 * [.7, .85, 1][stageOf(d.flights)]!;
    ctx.save(); ctx.translate(x, y - s * .38 - (still ? 0 : Math.abs(Math.sin(t * 1.5 + i)) * 3));
    if (i % 2) ctx.scale(-1, 1);
    drawDragon(ctx, lookOf(d), s, { stage: stageOf(d.flights), t: t + i, flap: still ? 0 : .6, mood: (Math.floor(t / 6) + i) % 4 === 0 ? 'sleepy' : 'happy', marks: marksOf(d.flights) });
    ctx.restore();
  });
  // the hearth: burning brighter the more Flames he has, never out
  const hx = w * .5, hy = h * .93, glow = Math.min(1, .25 + balance / 120);
  ctx.fillStyle = '#6b6f7a'; ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(hx - w * .08, hy - h * .02, w * .16, h * .05, 8); ctx.fill(); ctx.stroke();
  const f = still ? 1 : 1 + Math.sin(t * 9) * .08, fh = h * (.04 + .08 * glow) * f;
  ctx.fillStyle = `rgba(255,176,46,${.3 * glow})`; ctx.beginPath(); ctx.arc(hx, hy - fh * .5, fh * 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.ellipse(hx, hy - fh * .5, w * .03 * (1 + glow), fh, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(hx, hy - fh * .35, w * .015 * (1 + glow), fh * .6, 0, 0, Math.PI * 2); ctx.fill();
}
