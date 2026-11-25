// A question's scene drawn on a canvas at a moment: every position comes from questions/scenes.ts (the one motion model). The lesson
// can add marks: height bars beside the hills, arrows before and after a bump, a close-up of the rough ground catching the wheels,
// a lane lit to tap.
import { cartColour, groundOf, type ActionId } from '../questions/tables';
import { type Scene } from '../questions/problems';
import { hillTrack } from '../questions/hills';
import {
  actAt, actIs, bumpAt, groundsX, hillAt, laneDuration, lanesOf, loadsX, magnetTry, nearAt, polesGap, pushesX, throughAt, wayAt, wayVec, STOP_LINE, TABLE, BALL_R,
} from '../questions/scenes';
import { MAGNET_REACH, coastDistance } from '../physics/motion';
import { CART_FLOOR, EMPTY_CART, GROUND_PUSH, LOAD_PUSH } from '../questions/problems';
import { speedAfterPush } from '../physics/motion';
import { ball, drawArrow, drawBarMagnet, drawCart, drawGround, drawHand, drawMagnet, drawPerson, drawThing, emoji, INK, outline, rounded, type Ctx } from './draw';
import { thingOf } from '../questions/tables';

export interface Marks {
  /** Height bars beside each hill (Hills lessons). */
  bars?: boolean;
  /** Arrows showing pushes and which way things go (most lessons). */
  arrows?: boolean;
  /** A close-up of this lane's ground catching the wheels (Rough and Smooth). */
  zoom?: number | null;
  /** Lanes he can tap now (the hands-on lesson): drawn with a glowing edge. */
  tap?: readonly number[];
  /** A lane to light (the answer, after a lesson). */
  lit?: number | null;
}
/** Each lane's clock in seconds (0 before it starts). */
export interface Look { readonly clocks: readonly number[]; readonly marks: Marks; readonly idle: number }

const SKY = '#bfe9f0', TABLE_GREEN = '#2f8f6a';

export function drawScene(ctx: Ctx, sc: Scene, w: number, h: number, look: Look) {
  ctx.clearRect(0, 0, w, h);
  const t = (i: number) => look.clocks[i] ?? 0;
  switch (sc.type) {
    case 'act': return drawAct(ctx, sc.act, w, h, t(0), look);
    case 'way': return drawWay(ctx, sc, w, h, t(0), look);
    case 'pushes': return lanes(ctx, sc, w, h, look, (i, x, y, lw, lh) => {
      const lane = sc.lanes[i]!, g = laneGeom(x, y, lw, lh, 10);
      drawGround(ctx, 'floor', x, g.gy, lw, lh - (g.gy - y), '#e2b878');
      const cx = g.x0 + pushesX(lane.impulse, t(i)) * g.k;
      drawCart(ctx, cx, g.gy, 0, cartColour(lane.cart), g.s);
      if (t(i) < .4) pushArrow(ctx, cx, g, lane.impulse / 60);
    });
    case 'hills': return drawHills(ctx, sc, w, h, look);
    case 'loads': return lanes(ctx, sc, w, h, look, (i, x, y, lw, lh) => {
      const lane = sc.lanes[i]!, g = laneGeom(x, y, lw, lh, sc.mode === 'start' ? 10 : 7.5), gy = g.gy, k = g.k;
      drawGround(ctx, 'floor', x, gy, lw, lh - (gy - y), '#e2b878');
      const bags = lane.mass <= EMPTY_CART ? 0 : lane.mass < 80 ? 2 : 5, cx = g.x0 + loadsX(sc.mode, lane.mass, t(i)) * k;
      if (sc.mode === 'stop') {
        // the line where the hand starts pushing back
        const lx = g.x0 + STOP_LINE * k;
        ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(lx, y + 6); ctx.lineTo(lx, gy); ctx.strokeStyle = '#e63946'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
        if (t(i) * 2 > STOP_LINE && t(i) < laneDuration(sc, i) - .2) { drawArrow(ctx, cx + g.s * 1.3, gy - g.s * .5, cx + g.s * .6, gy - g.s * .5, '#ff7a00', g.s * .18); drawHand(ctx, cx + g.s * 1.4, gy - g.s * .5, g.s * .4); }
      }
      drawCart(ctx, cx, gy, sc.mode === 'start' && t(i) > 0 && t(i) < 1 && loadsX('start', lane.mass, 1) === 0 ? Math.sin(t(i) * 40) * .02 : 0, cartColour(lane.cart), g.s, bags);
      if (sc.mode !== 'stop' && (t(i) < (sc.mode === 'start' ? 1 : .4))) pushArrow(ctx, cx, g, .8); // the same push for every cart: the same arrow
    });
    case 'grounds': return lanes(ctx, sc, w, h, look, (i, x, y, lw, lh) => {
      const lane = sc.lanes[i]!, g = groundOf(lane.ground);
      const far = Math.max(...sc.lanes.map(l => coastDistance(GROUND_PUSH, groundOf(l.ground).resistance))) + 1, geo = laneGeom(x, y, lw, lh, far), gy = geo.gy;
      drawGround(ctx, g.id, x, gy, lw, lh - (gy - y), g.colour);
      if (sc.mode === 'station') emoji(ctx, '🚉', x + lw - geo.s * .6, gy - geo.s * .5, geo.s * .8);
      if (sc.mode === 'long') emoji(ctx, '🏁', x + lw - geo.s * .6, gy - geo.s * .5, geo.s * .8);
      const cx = geo.x0 + groundsX(g.id, t(i)) * geo.k;
      drawCart(ctx, cx, gy, 0, '#ffc21a', geo.s);
      if (t(i) < .4) pushArrow(ctx, cx, geo, .8);
      ctx.font = `900 ${Math.min(28, Math.max(14, lh * .14))}px Nunito, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = INK;
      ctx.fillText(g.name, x + 8, y + 6);
      if (look.marks.zoom === i) zoomWheel(ctx, g.id, g.colour, x + lw * .62, y + lh * .42, lh * .4);
    });
    case 'bump': return drawBump(ctx, sc, w, h, t(0), look);
    case 'magnet': return lanes(ctx, sc, w, h, look, (i, x, y, lw, lh) => {
      const id = sc.things[i]!, m = magnetTry(thingOf(id).magnetic, t(i)), k = (lw * .55) / (MAGNET_REACH * 2.5), cy = y + lh * .55;
      ctx.fillStyle = '#e9dcc0'; ctx.fillRect(x, y + lh * .78, lw, lh * .22);
      const x0 = x + lw * .18;
      drawMagnet(ctx, x0 + m.magnet * k, cy, lh * .5);
      drawThing(ctx, id, x0 + m.thing * k + lh * .3, cy, lh * .55);
      if (m.jumped) emoji(ctx, '✨', x0 + m.thing * k + lh * .3, cy - lh * .4, lh * .3);
    });
    case 'poles': {
      table(ctx, w, h, '#e9dcc0');
      const g = polesGap(sc.ends, t(0)), k = (w * .25) / MAGNET_REACH, bw = Math.min(w * .3, h * .9), bh = bw * .3, cy = h / 2;
      // the left magnet's right end is ends[0], the right magnet's left end is ends[1]
      const leftEnd = sc.ends[0], rightEnd = sc.ends[1];
      drawBarMagnet(ctx, w / 2 - g * k / 2 - bw / 2, cy, bw, bh, leftEnd === 'N' ? 'S' : 'N');
      drawBarMagnet(ctx, w / 2 + g * k / 2 + bw / 2, cy, bw, bh, rightEnd);
      if (look.marks.arrows && t(0) > .5) {
        const together = sc.ends[0] !== sc.ends[1];
        drawArrow(ctx, w / 2 - bw * .9, cy + bh * 1.4, w / 2 - bw * (together ? .5 : 1.3), cy + bh * 1.4, '#ffd23f', bh * .3);
        drawArrow(ctx, w / 2 + bw * .9, cy + bh * 1.4, w / 2 + bw * (together ? .5 : 1.3), cy + bh * 1.4, '#ffd23f', bh * .3);
      }
      return;
    }
    case 'near': {
      table(ctx, w, h, '#e9dcc0');
      const ms = Math.min(h * .4, w * .16), k = (w * .62) / (MAGNET_REACH * 2.6), mx = Math.max(w * .14, ms * 1.05);
      drawMagnet(ctx, mx, h / 2, ms);
      sc.clips.forEach((c, i) => {
        const y = h / 2 + (i === 0 ? -1 : 1) * h * .2, d = nearAt(c.d, t(0));
        drawThing(ctx, 'clip', mx + 16 + d * k + h * .06, y, h * .2);
        ctx.beginPath(); ctx.arc(mx + 16 + d * k + h * .06, y + h * .13, h * .035, 0, Math.PI * 2); ctx.fillStyle = cartColour(c.cart); ctx.fill(); outline(ctx, 2);
      });
      if (look.marks.arrows) { ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(mx, h / 2, MAGNET_REACH * k + 16, -Math.PI / 2, Math.PI / 2); ctx.strokeStyle = '#e63946'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]); }
      return;
    }
    case 'through': {
      table(ctx, w, h, '#e9dcc0');
      const m = throughAt(thingOf(sc.thing).magnetic, t(0)), sheetX = w * .5, s = Math.min(h * .42, w * .18);
      const mx0 = Math.max(w * .14, s * 1.05);
      drawMagnet(ctx, mx0 + (sheetX - mx0 - 10) * m.magnet, h / 2, s);
      const sheetCol = sc.sheet === 'paper' ? '#ffffff' : sc.sheet === 'card' ? '#f5d58a' : '#9fd3ff';
      ctx.beginPath(); ctx.rect(sheetX, h * .15, w * .03, h * .7); ctx.fillStyle = sheetCol; ctx.fill(); outline(ctx, 3);
      drawThing(ctx, sc.thing, sheetX + w * .03 + s * .35 + (w * .26) * (1 - m.thing), h / 2, s * .8);
      return;
    }
  }
}

// ---------- lanes ----------

/** A flat lane's layout: the cart's size, where it starts (room behind it for the hand and the push arrow), the ground line, and
 *  pixels a metre so the farthest a cart goes in this scene fits. */
interface LaneGeom { s: number; x0: number; gy: number; k: number }
function laneGeom(x: number, y: number, lw: number, lh: number, metres: number): LaneGeom {
  const s = Math.max(30, Math.min(lh * .42, lw * .13)), gy = y + lh - Math.max(10, Math.min(lh * .2, s * .45)), x0 = x + s * 2.3;
  return { s, x0, gy, k: (lw - (x0 - x) - s * .6) / metres };
}
/** The hand behind the cart and the push arrow from it; `size` 0 to 1 sets how long the arrow is (a big push or a small one). */
function pushArrow(ctx: Ctx, cx: number, g: LaneGeom, size: number) {
  const len = g.s * (.35 + .95 * size), ay = g.gy - g.s * .5, tip = cx - g.s * .55;
  drawArrow(ctx, tip - len, ay, tip, ay, '#ffd23f', g.s * .18);
  drawHand(ctx, tip - len - g.s * .1, ay, g.s * .4);
}

function lanes(ctx: Ctx, sc: Scene, w: number, h: number, look: Look, each: (i: number, x: number, y: number, lw: number, lh: number) => void) {
  const n = lanesOf(sc), lh = h / n;
  ctx.fillStyle = SKY; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const y = i * lh;
    ctx.save(); ctx.beginPath(); ctx.rect(0, y, w, lh); ctx.clip();
    if (i % 2) { ctx.fillStyle = '#ffffff30'; ctx.fillRect(0, y, w, lh); }
    each(i, 0, y, w, lh);
    ctx.restore();
    if (i) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); outline(ctx, 3); }
    if (look.marks.tap?.includes(i)) { const pulse = .5 + .5 * Math.sin(look.idle * 6); ctx.strokeStyle = `rgba(255,122,0,${.5 + .5 * pulse})`; ctx.lineWidth = 6; ctx.strokeRect(3, y + 3, w - 6, lh - 6); emoji(ctx, '👆', w - lh * .3, y + lh * .3, lh * .3); }
    if (look.marks.lit === i) { ctx.strokeStyle = '#2fa84f'; ctx.lineWidth = 7; ctx.strokeRect(4, y + 4, w - 8, lh - 8); }
  }
}
function table(ctx: Ctx, w: number, h: number, colour: string) { ctx.fillStyle = colour; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#00000010'; for (let i = 0; i < w; i += 40) ctx.fillRect(i, 0, 2, h); }

// ---------- Push or Pull ----------

const ACT_THING: Record<ActionId, string> = { kick: '⚽', cart: '🛒', close: '🗄️', swing: '🪑', car: '🚗', open: '🗄️', wagon: '🛒', sled: '🛷', carrot: '🥕', rope: '🪢' };
function drawAct(ctx: Ctx, act: ActionId, w: number, h: number, t: number, look: Look) {
  ctx.fillStyle = SKY; ctx.fillRect(0, 0, w, h);
  const gy = h * .82, s = Math.min(h * .42, w * .2);
  ctx.fillStyle = '#7ccf6a'; ctx.fillRect(0, gy, w, h - gy); ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); outline(ctx, 3);
  const push = actIs(act) === 'push', k = actAt(t), px = w * .2;
  if (act === 'carrot') {
    // pulled up out of the ground, toward the hand above it
    const cx = w * .55, cy = gy + s * .15 - k * s * .9;
    emoji(ctx, '🥕', cx, cy, s * .7);
    drawPerson(ctx, px + w * .12, gy, s, cx - s * .05, cy - s * .38);
    if (look.marks.arrows) drawArrow(ctx, cx + s * .5, gy, cx + s * .5, gy - s * 1.1, '#ffd23f', s * .12);
    return;
  }
  const near = px + s * .75, far = w * .78, thingX = push ? near + (far - near) * k : far - (far - near) * .85 * k;
  const ty = gy - s * .32;
  if (act === 'close' || act === 'open') {
    // a chest of drawers on the right, its drawer sliding out (toward him) or in (away)
    const cx = w * .74, out = act === 'open' ? k : 1 - k;
    rounded(ctx, cx - s * .1, gy - s * 1.1, s * .9, s * 1.1, 6); ctx.fillStyle = '#b98a55'; ctx.fill(); outline(ctx, 3);
    const dx = cx - s * .1 - out * s * .55;
    rounded(ctx, dx, gy - s * .75, s * .85, s * .32, 4); ctx.fillStyle = '#d9a86a'; ctx.fill(); outline(ctx, 3);
    drawPerson(ctx, w * .3, gy, s, dx - s * .05, gy - s * .6);
    if (look.marks.arrows || t > 0) drawArrow(ctx, dx + s * .2, gy - s * 1.35, dx + s * .2 + (act === 'open' ? -1 : 1) * s * .7, gy - s * 1.35, '#ffd23f', s * .12);
    return;
  }
  emoji(ctx, ACT_THING[act], thingX, ty - s * .1, s * .95);
  const handX = push ? thingX - s * .4 : thingX - s * .45, handY = act === 'kick' ? gy - s * .15 : ty;
  if (!push) { ctx.beginPath(); ctx.moveTo(handX, handY); ctx.lineTo(thingX - s * .25, ty); ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 5; ctx.stroke(); }
  const bodyX = push ? Math.min(handX - s * .55, px + (thingX - near) * .9) : px;
  const hx = push ? handX : Math.min(handX, bodyX + s * .7), reach = !push && handX > hx;
  if (reach) { ctx.beginPath(); ctx.moveTo(hx, handY); ctx.lineTo(handX, handY); ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 5; ctx.stroke(); }
  drawPerson(ctx, bodyX, gy, s, hx, handY, act === 'kick' ? '#e63946' : '#2f80ed');
  if (look.marks.arrows || (t > 0 && t < 1.5)) drawArrow(ctx, thingX, ty - s * .55, thingX + (push ? 1 : -1) * s * .8, ty - s * .55, '#ffd23f', s * .12);
}

function drawWay(ctx: Ctx, sc: Extract<Scene, { type: 'way' }>, w: number, h: number, t: number, look: Look) {
  table(ctx, w, h, '#e9dcc0');
  const s = Math.min(w, h) * .2, v = wayVec(sc), d = wayAt(sc, t), k = Math.min(w, h) * .18;
  const bx = w / 2 + v.x * d * k, by = h / 2 + v.y * d * k;
  // the box from above
  rounded(ctx, bx - s / 2, by - s / 2, s, s, 6); ctx.fillStyle = '#c8955a'; ctx.fill(); outline(ctx, 3);
  ctx.beginPath(); ctx.moveTo(bx - s / 2, by); ctx.lineTo(bx + s / 2, by); ctx.moveTo(bx, by - s / 2); ctx.lineTo(bx, by + s / 2); ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 3; ctx.stroke();
  const arrowLen = s * .9;
  if (sc.by === 'push') {
    // the hand behind it, pushing it along the arrow
    const hx = bx - v.x * (s * .5 + s * .3), hy = by - v.y * (s * .5 + s * .3);
    if (t < .6) { drawHand(ctx, hx, hy, s * .45); drawArrow(ctx, hx - v.x * arrowLen * 1.2, hy - v.y * arrowLen * 1.2, hx - v.x * s * .3, hy - v.y * s * .3, '#ffd23f', s * .14); }
  } else {
    // a rope tied on the far side, the hand at its end pulling it along the arrow
    const rx = bx + v.x * (s * .5 + s * .9 + Math.max(0, 1.6 - d) * 0), ry = by + v.y * (s * .5 + s * .9);
    ctx.beginPath(); ctx.moveTo(bx + v.x * s * .5, by + v.y * s * .5); ctx.lineTo(rx, ry); ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 6; ctx.stroke();
    drawHand(ctx, rx, ry, s * .45);
    drawArrow(ctx, rx + v.x * s * .3, ry + v.y * s * .3, rx + v.x * (s * .3 + arrowLen), ry + v.y * (s * .3 + arrowLen), '#ffd23f', s * .14);
  }
  if (look.marks.arrows && t > .3) drawArrow(ctx, w / 2, h / 2, w / 2 + v.x * s * 1.2, h / 2 + v.y * s * 1.2, '#2fa84f', s * .1);
}

// ---------- hills ----------

function drawHills(ctx: Ctx, sc: Extract<Scene, { type: 'hills' }>, w: number, h: number, look: Look) {
  const tracks = sc.lanes.map(l => hillTrack(l)), maxW = Math.max(...tracks.map(t => t.profile.pts.at(-1)![0])), maxH = Math.max(...sc.lanes.map(l => Math.max(l.start, l.hill ?? 0)));
  lanes(ctx, sc, w, h, look, (i, x, y, lw, lh) => {
    const lane = sc.lanes[i]!, tr = tracks[i]!, pad = lh * .1;
    // drawn a little taller than it is (at most twice), so a low hill still reads as a hill; the cart moves through the same picture
    const kx = (lw - pad * 2 - lh * .3) / maxW, ky = Math.min((lh * .72) / maxH, kx * 2);
    const ox = x + pad + lh * .2, oy = y + lh - pad;
    const P = (px: number, py: number) => [ox + px * kx, oy - py * ky] as const;
    ctx.beginPath(); ctx.moveTo(ox, oy);
    for (const [px, py] of tr.profile.pts) ctx.lineTo(...P(px, py));
    ctx.lineTo(P(tr.profile.pts.at(-1)![0], 0)[0], oy); ctx.closePath();
    ctx.fillStyle = '#8fd46a'; ctx.fill();
    ctx.beginPath(); tr.profile.pts.forEach(([px, py], j) => (j ? ctx.lineTo(...P(px, py)) : ctx.moveTo(...P(px, py))));
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(3, lh * .025); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x + lw, oy); outline(ctx, 3);
    if (look.marks.bars) {
      const bx = ox - lh * .1, bh = lane.start * ky;
      ctx.beginPath(); ctx.rect(bx - 6, oy - bh, 12, bh); ctx.fillStyle = cartColour(lane.cart); ctx.fill(); outline(ctx, 2);
      ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(ox, oy - bh); ctx.lineTo(x + lw, oy - bh); ctx.strokeStyle = cartColour(lane.cart); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
    }
    const at = hillAt(lane, look.clocks[i] ?? 0), [cx, cy] = P(at.x, at.y);
    const angle = Math.atan2(Math.sin(at.angle) * ky, Math.cos(at.angle) * kx), size = Math.max(26, Math.min(lh * .3, kx * 1.6));
    drawCart(ctx, cx, cy, -angle, cartColour(lane.cart), size);
    if (look.marks.arrows && Math.abs(at.v) > .2) drawArrow(ctx, cx, cy - size * .9, cx + Math.sign(at.v) * Math.min(lw * .3, Math.abs(at.v) * size * .35), cy - size * .9, '#ffd23f', Math.max(6, size * .14));
  });
}

// ---------- Bump ----------

function drawBump(ctx: Ctx, sc: Extract<Scene, { type: 'bump' }>, w: number, h: number, t: number, look: Look) {
  const k = Math.min(w / TABLE.w, h / TABLE.h), ox = (w - TABLE.w * k) / 2, oy = (h - TABLE.h * k) / 2;
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(0, 0, w, h);
  rounded(ctx, ox + 6, oy + 6, TABLE.w * k - 12, TABLE.h * k - 12, 14); ctx.fillStyle = TABLE_GREEN; ctx.fill(); outline(ctx, 4);
  const P = (v: { x: number; y: number }) => [ox + v.x * k, oy + v.y * k] as const, r = BALL_R * k * 1.6;
  if (sc.mode === 'wall') { const [wx] = P({ x: TABLE.w - .12, y: 0 }); ctx.beginPath(); ctx.rect(wx, oy + 10, (TABLE.w * k + ox) - wx - 10, TABLE.h * k - 20); ctx.fillStyle = '#c9d1da'; ctx.fill(); outline(ctx, 4); }
  const st = bumpAt(sc, t);
  if (st.b) { const [bx, by] = P(st.b); ball(ctx, bx, by, r, '#ffffff', '#ffffff'); ctx.beginPath(); ctx.arc(bx, by, r * .45, 0, Math.PI * 2); ctx.fillStyle = '#2f80ed'; ctx.fill(); }
  const [ax, ay] = P(st.a);
  ball(ctx, ax, ay, r, '#e63946', '#ff9aa2');
  // which way it's rolling, before anything happens (and the push to come)
  if (!st.hit && !look.marks.arrows) { const s0 = Math.hypot(sc.v.x, sc.v.y); drawArrow(ctx, ax + sc.v.x / s0 * r * 1.3, ay + sc.v.y / s0 * r * 1.3, ax + sc.v.x / s0 * r * 3.6, ay + sc.v.y / s0 * r * 3.6, '#ffd23f', r * .4); }
  if (sc.mode === 'side' && t < 1.6) { const pv = sc.push!, s = Math.hypot(pv.x, pv.y); const [cx, cy] = P({ x: TABLE.w / 2, y: TABLE.h / 2 }); drawArrow(ctx, cx - pv.x / s * r * 4.2, cy - pv.y / s * r * 4.2, cx - pv.x / s * r * 1.3, cy - pv.y / s * r * 1.3, '#ffd23f', r * .5); drawHand(ctx, cx - pv.x / s * r * 4.8, cy - pv.y / s * r * 4.8, r * 1.4); }
  if (look.marks.arrows) {
    const v0 = sc.v, s0 = Math.hypot(v0.x, v0.y), L = r * 4;
    if (!st.hit) drawArrow(ctx, ax, ay, ax + v0.x / s0 * L, ay + v0.y / s0 * L, '#ffd23f', r * .4);
    else { const a = st.after, s1 = Math.hypot(a.x, a.y); const from = sc.mode === 'ball' && st.b ? P(st.b) : [ax, ay]; if (s1 > 1e-6) drawArrow(ctx, from[0], from[1], from[0] + a.x / s1 * L, from[1] + a.y / s1 * L, '#2fa84f', r * .4); }
  }
}

/** The close-up of a ground catching a wheel: a big wheel on a big patch of the ground, with little lines where it rubs. */
function zoomWheel(ctx: Ctx, id: string, colour: string, x: number, y: number, r: number) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.clip();
  drawGround(ctx, id, x - r, y + r * .25, r * 2, r, colour);
  ctx.beginPath(); ctx.arc(x, y - r * .2, r * .45, 0, Math.PI * 2); ctx.fillStyle = '#3a3f48'; ctx.fill(); outline(ctx, 4);
  ctx.beginPath(); ctx.arc(x, y - r * .2, r * .15, 0, Math.PI * 2); ctx.fillStyle = '#c9d1da'; ctx.fill();
  if (id === 'sand' || id === 'grass' || id === 'carpet') { ctx.strokeStyle = '#e63946'; ctx.lineWidth = 4; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + r * .35 + i * 6, y + r * .2); ctx.lineTo(x + r * .55 + i * 6, y + r * .05); ctx.stroke(); } }
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); outline(ctx, 5);
}

/** Which lane a tap at (x, y) falls in. */
export function laneAt(sc: Scene, h: number, y: number): number {
  const n = lanesOf(sc);
  return Math.max(0, Math.min(n - 1, Math.floor(y / (h / n))));
}
void LOAD_PUSH; void CART_FLOOR; void speedAfterPush;
