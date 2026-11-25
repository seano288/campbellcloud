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

/** The mountain's outline, as fractions of the picture: wide shoulders, a high peak, its foot in the valley. */
const PEAK: readonly (readonly [number, number])[] = [[.03, .97], [.16, .64], [.28, .46], [.36, .2], [.44, .09], [.5, .04], [.57, .08], [.64, .22], [.72, .42], [.85, .63], [.97, .97]];
const OUTLINE = '#2a1a12';

/** Everything that never moves (sky, hills, the mountain, its ledges, the pieces he has put on them, the nests), drawn once and kept, so
 *  each frame only draws the eggs, the dragons and the hearth's fire. */
let kept: { key: string; c: HTMLCanvasElement } | null = null;
function scenery(a: RoostState, w: number, h: number, dpr: number, ls: readonly { x: number; y: number; w: number }[]): HTMLCanvasElement | null {
  const pieces = ROOST.filter(r => r.does !== 'nest' && has(a, r.id)).slice(0, 24), nests = Math.min(nestCount(a), 12);
  const key = `${Math.round(w)}x${Math.round(h)}@${dpr}|${ls.length}|${nests}|${pieces.map(p => p.id).join(',')}`;
  if (kept?.key === key) return kept.c;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const m = Math.min(w, h);
  // the dawn sky, the sun and two soft clouds
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ff9fb8'); g.addColorStop(.55, '#ffd28f'); g.addColorStop(1, '#fff1cf');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff3b066'; ctx.beginPath(); ctx.arc(w * .85, h * .15, m * .11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(w * .85, h * .15, m * .07, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffffcc';
  for (const [cx, cy, r] of [[.14, .16, .05], [.74, .3, .04]] as const) { ctx.beginPath(); ctx.arc(w * cx, h * cy, m * r, 0, Math.PI * 2); ctx.arc(w * cx + m * r * 1.1, h * cy + m * r * .2, m * r * .75, 0, Math.PI * 2); ctx.arc(w * cx - m * r * 1.1, h * cy + m * r * .25, m * r * .65, 0, Math.PI * 2); ctx.fill(); }
  // far hills
  ctx.fillStyle = '#d99ab0'; ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w + 10; x += 10) ctx.lineTo(x, h * (.66 + .05 * Math.sin(x / 60) + .02 * Math.sin(x / 23)));
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  // the mountain: warm rock, a sunlit face, layers of stone and snow on top
  ctx.beginPath(); PEAK.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h))); ctx.closePath();
  ctx.fillStyle = '#b9735a'; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#cf8a6b'; ctx.beginPath(); ctx.moveTo(w * .5, h * .04); ctx.lineTo(w * .57, h * .08); ctx.lineTo(w * .64, h * .22); ctx.lineTo(w * .72, h * .42); ctx.lineTo(w * .85, h * .63); ctx.lineTo(w, h); ctx.lineTo(w * .62, h); ctx.lineTo(w * .56, h * .5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#9a5b45'; ctx.lineWidth = Math.max(2, m * .008);
  for (let k = 0; k < 6; k++) { const y = h * (.25 + k * .12); ctx.beginPath(); ctx.moveTo(0, y + h * .02); ctx.quadraticCurveTo(w * .3, y - h * .03, w * .5, y + h * .01); ctx.quadraticCurveTo(w * .7, y + h * .04, w, y - h * .01); ctx.stroke(); }
  ctx.fillStyle = '#fff6ea'; ctx.beginPath(); ctx.moveTo(w * .36, h * .2); ctx.lineTo(w * .44, h * .09); ctx.lineTo(w * .5, h * .04); ctx.lineTo(w * .57, h * .08); ctx.lineTo(w * .64, h * .22);
  ctx.lineTo(w * .58, h * .18); ctx.lineTo(w * .54, h * .23); ctx.lineTo(w * .5, h * .17); ctx.lineTo(w * .46, h * .22); ctx.lineTo(w * .42, h * .17); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.stroke();
  // the cave at its foot, where the hearth burns
  ctx.fillStyle = '#3b1a33'; ctx.beginPath(); ctx.ellipse(w * .5, h * .95, w * .11, h * .12, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  ctx.beginPath(); PEAK.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.stroke();
  // the green valley, with round trees
  ctx.fillStyle = '#3f9b4f'; ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, h * (.9 + .015 * Math.sin(x / 40)));
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.stroke();
  for (const [tx, ts] of [[.06, 1], [.11, .8], [.89, 1.1], [.95, .8]] as const) {
    const r = m * .035 * ts, x = w * tx, y = h * .9;
    ctx.fillStyle = '#6b4423'; ctx.fillRect(x - r * .18, y - r * .9, r * .36, r * .9);
    ctx.fillStyle = '#2f7a3e'; ctx.beginPath(); ctx.arc(x, y - r * 1.4, r, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  }
  // ledges: shelves of rock with grass on their ends
  for (const l of ls) {
    const x0 = (l.x - l.w / 2) * w, x1 = (l.x + l.w / 2) * w, y = l.y * h, th = h * .035;
    ctx.fillStyle = '#8a5a44'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.quadraticCurveTo(x1 - th, y + th * 1.2, (x0 + x1) / 2, y + th * 1.4); ctx.quadraticCurveTo(x0 + th, y + th * 1.2, x0, y); ctx.closePath(); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#a8765a'; ctx.fillRect(x0 + 2, y + 1, x1 - x0 - 4, th * .3);
    ctx.fillStyle = '#5cb85c'; for (const gx of [x0 + th * .6, x1 - th * .6]) { ctx.beginPath(); ctx.ellipse(gx, y, th * .9, th * .4, 0, Math.PI, 0); ctx.fill(); }
  }
  // the pieces he owns, as their pictures, along the ledges
  ctx.font = `${m * .05}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  pieces.forEach((p, i) => {
    const l = ls[i % ls.length]!, k = (Math.floor(i / ls.length) + .5) / Math.ceil(Math.max(1, pieces.length) / ls.length);
    ctx.fillText(p.icon, (l.x - l.w / 2 + l.w * Math.min(.95, k)) * w, l.y * h);
  });
  // nests on the lowest ledges
  for (let i = 0; i < nests; i++) {
    const { x, y, s } = nestAt(ls, i, w, h);
    ctx.fillStyle = '#a8763e'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y - s * .15, s * .7, s * .28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#7a4f24'; ctx.beginPath(); ctx.moveTo(x - s * .5, y - s * .12); ctx.quadraticCurveTo(x, y - s * .02, x + s * .5, y - s * .14); ctx.stroke();
  }
  kept = { key, c };
  return c;
}
const nestAt = (ls: readonly { x: number; y: number; w: number }[], i: number, w: number, h: number) => {
  const l = ls[i % ls.length]!;
  return { x: (l.x - l.w * .35 + (Math.floor(i / ls.length) * .22)) * w, y: l.y * h, s: Math.min(w, h) * .06 };
};

export function drawRoost(ctx: CanvasRenderingContext2D, a: RoostState, balance: number, w: number, h: number, t: number, still: boolean) {
  // ledges: the bottom three, then one for each New Ledge (the top eight drawn)
  const total = 3 + a.more.ledge, shown = Math.min(8, total), ls = ledges(shown);
  const bg = scenery(a, w, h, ctx.getTransform().a || 1, ls);
  if (bg) ctx.drawImage(bg, 0, 0, w, h);
  // eggs in their nests, wobbling as they get warm
  const nests = Math.min(nestCount(a), 12);
  for (let i = 0; i < nests; i++) {
    const egg = a.eggs[i];
    if (!egg) continue;
    const { x, y, s } = nestAt(ls, i, w, h);
    ctx.save(); ctx.translate(x, y - s * .55); drawEgg(ctx, lookOf({ id: 0, egg: egg.egg, name: null, flights: 0 }), s * 1.1, Math.min(1, egg.warmth / hatchNeed(a, egg.egg)), still ? 0 : t); ctx.restore();
  }
  // dragons on the ledges
  const shownDragons = a.dragons.slice(-drawnDragons(a));
  shownDragons.forEach((d, i) => {
    const l = ls[(i + 1) % ls.length]!, x = (l.x + l.w * (.15 + (i % 3) * .12) - l.w * .2) * w, y = l.y * h, s = Math.min(w, h) * .17 * [.7, .85, 1][stageOf(d.flights)]!;
    ctx.save(); ctx.translate(x, y - s * .42 - (still ? 0 : Math.abs(Math.sin(t * 1.5 + i)) * 3));
    if (i % 2) ctx.scale(-1, 1);
    drawDragon(ctx, lookOf(d), s, { stage: stageOf(d.flights), t: t + i, flap: still ? 0 : .6, mood: (Math.floor(t / 6) + i) % 4 === 0 ? 'sleepy' : 'happy', marks: marksOf(d.flights) });
    ctx.restore();
  });
  // the hearth in the cave: burning brighter the more Flames he has, never out
  const hx = w * .5, hy = h * .94, glow = Math.min(1, .25 + balance / 120), m = Math.min(w, h);
  const f = still ? 1 : 1 + Math.sin(t * 9) * .08, fh = h * (.04 + .06 * glow) * f;
  ctx.fillStyle = `rgba(255,176,46,${.25 + .3 * glow})`; ctx.beginPath(); ctx.ellipse(hx, hy - fh * .4, w * .09, fh * 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff7a1a'; ctx.strokeStyle = '#7a1406'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(hx, hy - fh * 1.6); ctx.quadraticCurveTo(hx + w * .035 * (1 + glow), hy - fh * .6, hx + w * .02, hy); ctx.lineTo(hx - w * .02, hy); ctx.quadraticCurveTo(hx - w * .035 * (1 + glow), hy - fh * .6, hx, hy - fh * 1.6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(hx, hy - fh * .35, w * .012 * (1 + glow), fh * .55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8e94a0'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.5; // the ring of hearth stones
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(hx + k * m * .028, hy + m * .006, m * .016, m * .012, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
}

/** The meadow under the mountain, where Visit's dragons wander: the dawn sky, the mountain behind with snow on top, far hills, then a wide
 *  green meadow with flowers and round trees. Drawn once and kept, like the Roost's scenery. */
let meadowKept: { key: string; c: HTMLCanvasElement } | null = null;
export function drawMeadow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const dpr = ctx.getTransform().a || 1, key = `${Math.round(w)}x${Math.round(h)}@${dpr}`;
  if (meadowKept?.key !== key && typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g2 = c.getContext('2d');
    if (g2) {
      g2.scale(dpr, dpr); g2.lineJoin = 'round';
      const m = Math.min(w, h), hz = h * .46;
      const g = g2.createLinearGradient(0, 0, 0, hz);
      g.addColorStop(0, '#ffb3c6'); g.addColorStop(1, '#ffe0a8');
      g2.fillStyle = g; g2.fillRect(0, 0, w, hz + 4);
      g2.fillStyle = '#fff3b0'; g2.beginPath(); g2.arc(w * .2, h * .14, m * .06, 0, Math.PI * 2); g2.fill();
      g2.fillStyle = '#d99ab0'; g2.beginPath(); g2.moveTo(0, hz + 4);
      for (let x = 0; x <= w + 10; x += 10) g2.lineTo(x, hz - h * (.06 + .03 * Math.sin(x / 50)));
      g2.lineTo(w, hz + 4); g2.closePath(); g2.fill();
      // the mountain, behind on the right
      g2.fillStyle = '#b9735a'; g2.strokeStyle = OUTLINE; g2.lineWidth = 3;
      g2.beginPath(); g2.moveTo(w * .48, hz + 2); g2.lineTo(w * .7, h * .1); g2.lineTo(w * .76, h * .07); g2.lineTo(w * .83, h * .12); g2.lineTo(w * 1.04, hz + 2); g2.closePath(); g2.fill(); g2.stroke();
      g2.fillStyle = '#cf8a6b'; g2.beginPath(); g2.moveTo(w * .76, h * .07); g2.lineTo(w * .83, h * .12); g2.lineTo(w * 1.04, hz); g2.lineTo(w * .82, hz); g2.closePath(); g2.fill();
      g2.fillStyle = '#fff6ea'; g2.beginPath(); g2.moveTo(w * .7, h * .1); g2.lineTo(w * .76, h * .07); g2.lineTo(w * .83, h * .12); g2.lineTo(w * .8, h * .15); g2.lineTo(w * .77, h * .12); g2.lineTo(w * .74, h * .16); g2.lineTo(w * .67, h * .145); g2.closePath(); g2.fill(); g2.lineWidth = 2; g2.stroke();
      // the meadow
      const gm = g2.createLinearGradient(0, hz, 0, h);
      gm.addColorStop(0, '#7fcf6a'); gm.addColorStop(1, '#3f9b4f');
      g2.fillStyle = gm; g2.beginPath(); g2.moveTo(0, h);
      for (let x = 0; x <= w + 8; x += 8) g2.lineTo(x, hz + h * .012 * Math.sin(x / 45));
      g2.lineTo(w, h); g2.closePath(); g2.fill(); g2.lineWidth = 3; g2.stroke();
      for (let i = 0; i < 14; i++) { // little clumps of flowers, the same every time
        const fx = (Math.sin(i * 12.9898) * 43758.5453) % 1, fy = (Math.sin(i * 78.233) * 12543.123) % 1, x = Math.abs(fx) * w, y = hz + h * .05 + Math.abs(fy) * (h - hz - h * .08);
        g2.fillStyle = ['#fff6ea', '#ffd23f', '#ff9fb8'][i % 3]!;
        for (const [dx, dy] of [[0, 0], [m * .012, m * .006], [-m * .01, m * .008]] as const) { g2.beginPath(); g2.arc(x + dx, y + dy, m * .007, 0, Math.PI * 2); g2.fill(); }
      }
      for (const [tx, ts] of [[.05, 1.2], [.13, .9], [.42, .8]] as const) {
        const r = m * .04 * ts, x = w * tx, y = hz + r * .4;
        g2.fillStyle = '#6b4423'; g2.fillRect(x - r * .18, y - r * .9, r * .36, r * .9);
        g2.fillStyle = '#2f7a3e'; g2.beginPath(); g2.arc(x, y - r * 1.4, r, 0, Math.PI * 2); g2.fill(); g2.lineWidth = 2; g2.stroke();
      }
      meadowKept = { key, c };
    }
  }
  if (meadowKept) ctx.drawImage(meadowKept.c, 0, 0, w, h);
}
