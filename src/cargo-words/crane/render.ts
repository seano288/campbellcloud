// Draws the Crane on a 2D canvas, from the side: the sky and the far port, the water, the quay with its containers, the ship at the quay
// (sitting lower as it fills), the crane's legs (standing clear of the containers, so a syllable is never hidden) and its lattice boom,
// the trolley with the driver's cab under it, the cables and the grab with whatever it holds, swinging a little. Nothing here changes
// the model (sim.ts).
//
// The scene is fitted to the canvas, leaving the Lower button its own corner: on a screen on its side the scene keeps out of the button's
// column, and upright the water line sits above it, so the button never covers the ship. What never moves during a go (the sky, the far
// shore and its cranes, the water and the quay) is drawn once into a cache when the size changes; each frame draws only the waves, the
// ship, the containers and the crane, so it holds 60 fps on an iPad 9.
import { drawBox, shade, type BoxLook } from '../art/container';
import { beam, spreader } from '../art/crane';
import { drawShip, type ShipLook } from '../art/ship';
import { BOOM_Y, BOX_H, BOX_W, COL, deckY, held, maxX, minX, QUAY_Y, quayColX, shipColX, type Crane } from './sim';

export interface CraneLook {
  /** The crane's paint, and which of the five cranes it is (how it stands). */
  readonly paint: string;
  readonly kind: 'dock' | 'tall' | 'gantry' | 'floating' | 'giant';
  /** Lights along the boom. */
  readonly lights: string | null;
}

export interface CraneScene {
  resize(): void;
  /** The world x under a canvas x. */
  toWorld(px: number): number;
  frame(c: Crane, t: number, looks: (id: number) => BoxLook, ship: ShipLook, crane: CraneLook, night: boolean, finger: number | null): void;
}

const INK = '#141414';

export function createCraneScene(canvas: HTMLCanvasElement): CraneScene {
  const ctx = canvas.getContext('2d')!;
  const cache = document.createElement('canvas'), cctx = cache.getContext('2d')!;
  let w = 1, h = 1, dpr = 1, u = 1, ox = 0, waterY = 0, cacheKey = '';
  /** The Lower button's box, measured on each resize, so the scene can keep out of its way. */
  let button: DOMRect | null = null;
  const X = (x: number) => ox + x * u, Y = (y: number) => waterY - y * u;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const b = canvas.parentElement?.querySelector('.cw-lower')?.getBoundingClientRect();
    button = b && b.width ? new DOMRect(b.left - r.left, b.top - r.top, b.width, b.height) : null;
  }
  resize();
  function fit(c: Crane) {
    // the whole scene, from just above the boom to a little under the water, fits the canvas under the HUD, clear of the Lower button
    const worldH = BOOM_Y + 14, worldW = c.width + 4, side = w > h;
    const right = side && button ? Math.max(0, w - button.left + 12) : 0, top = Math.min(64, h * 0.14);
    u = Math.min((w - right) / worldW, (h - top) / worldH);
    ox = (w - right - c.width * u) / 2;
    const centred = h - Math.max(8 * u, (h - top - worldH * u) / 2 + 8 * u);
    // upright, the water line sits above the button (the hull and the quay carry on down past it), and the boom stays under the HUD
    waterY = !side && button ? Math.max(Math.min(centred, button.top - 14), 84 + (BOOM_Y + 4) * u) : centred;
    waterY = Math.min(waterY, h - 6 * u);
  }

  /** The sky, the far shore with its port, the water and the quay: everything that stays put for the whole go. */
  function drawStill(g: CanvasRenderingContext2D, c: Crane, night: boolean) {
    const sky = g.createLinearGradient(0, 0, 0, waterY);
    sky.addColorStop(0, night ? '#0d1838' : '#4fa9df'); sky.addColorStop(1, night ? '#2b3c6c' : '#d6f0fb');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    if (night) { g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(w * 0.82, Math.min(h * 0.14, waterY * 0.3), 18, 0, 7); g.fill(); g.fillStyle = '#ffffff99'; for (let i = 0; i < 30; i++) g.fillRect((i * 137) % w, ((i * 71) % 100) / 100 * waterY * 0.6, 2, 2); }
    else {
      g.fillStyle = '#ffffffd8';
      for (let i = 0; i < 5; i++) { const cx = ((i * 0.23 + 0.08) % 1) * w, cy = waterY * (0.12 + (i % 3) * 0.1), r = Math.max(12, 2.2 * u); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.arc(cx + r * 1.2, cy - r * 0.5, r * 1.25, 0, 7); g.arc(cx + r * 2.5, cy, r * 0.95, 0, 7); g.fill(); }
    }
    // the far shore: hills, and another port's cranes and stacks in the haze
    g.fillStyle = night ? '#1e2b4a' : '#93b8ad';
    g.beginPath(); g.moveTo(0, waterY);
    for (let i = 0; i <= 16; i++) g.lineTo((w / 16) * i, waterY - (7 + 4 * Math.sin(i * 1.7) + 2 * Math.sin(i * 0.6)) * u);
    g.lineTo(w, waterY); g.fill();
    g.fillStyle = night ? '#18233d' : '#7fa49a';
    for (let i = 0; i < 6; i++) {
      const fx = w * (0.52 + i * 0.09), base = waterY - 2 * u, s = u * 0.55;
      g.fillRect(fx, base - 9 * s, 1.2 * s, 9 * s); g.fillRect(fx + 5 * s, base - 9 * s, 1.2 * s, 9 * s); g.fillRect(fx - 3 * s, base - 9.6 * s, 13 * s, 1.1 * s);
      for (let k = 0; k < 3; k++) g.fillRect(fx + 8 * s + k * 3 * s, base - (2 + (k % 2)) * 2 * s, 2.6 * s, (2 + (k % 2)) * 2 * s);
    }
    // the water
    const sea = g.createLinearGradient(0, waterY, 0, h);
    sea.addColorStop(0, night ? '#145656' : '#1f9a8a'); sea.addColorStop(1, night ? '#0a3434' : '#11695f');
    g.fillStyle = sea; g.fillRect(0, waterY, w, h - waterY);
    g.fillStyle = '#ffffff44'; g.fillRect(0, waterY, w, Math.max(1.5, 0.2 * u));
    // the quay: concrete, its yellow safety edge, a bollard and a tyre fender at the water
    const qy = Y(QUAY_Y), quayR = X(c.quayX0 + c.quayCols * COL + 2);
    g.fillStyle = '#a3aaaf'; g.fillRect(-4, qy, quayR + 4, h - qy);
    g.fillStyle = '#8d969e'; for (let y = qy + 3 * u; y < h; y += 3 * u) g.fillRect(-4, y, quayR + 4, Math.max(1, 0.15 * u));
    g.fillStyle = '#ffcc00'; g.fillRect(-4, qy, quayR + 4, Math.max(2, 0.5 * u));
    g.strokeStyle = INK; g.lineWidth = Math.max(2, 0.35 * u); g.strokeRect(-4, qy, quayR + 4, h - qy + 4);
    g.fillStyle = '#2b2b2b'; g.fillRect(quayR - 3 * u, qy - 1.3 * u, 1.3 * u, 1.3 * u); g.fillRect(quayR - 3.3 * u, qy - 1.6 * u, 1.9 * u, 0.5 * u);
    g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(quayR - 0.1 * u, qy + 3 * u, 1.1 * u, 0, 7); g.fill();
    // the crane rails along the quay
    g.fillStyle = '#3a3f44'; g.fillRect(-4, qy - 0.35 * u, quayR + 4, 0.35 * u);
  }

  return {
    resize,
    toWorld: px => (px - ox) / u,
    frame(c, t, looks, ship, crane, night, finger) {
      fit(c);
      const key = `${w}x${h}@${dpr}:${u.toFixed(3)}:${night}`;
      if (key !== cacheKey) {
        cacheKey = key;
        cache.width = canvas.width; cache.height = canvas.height;
        cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawStill(cctx, c, night);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(cache, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // waves
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = Math.max(1.5, 0.25 * u); ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) { const yy = waterY + (1.2 + i * 1.6) * u, off = (t * 2.2 * u + i * 37) % (8 * u); for (let x = X(c.quayX0 + c.quayCols * COL + 2) - off + 8 * u; x < w; x += 8 * u) { ctx.moveTo(x, yy); ctx.lineTo(x + 2.6 * u, yy); } }
      ctx.stroke();

      // the ship, sitting lower as it fills, and sailing off to the right when full
      const sail = c.sail * u, bob = Math.sin(t * 1.3) * 0.25 * u;
      ctx.save(); ctx.translate(sail, bob);
      drawShip(ctx, ship, X(c.shipX0), c.ship.cols * COL * u, Y(deckY(c)), waterY, u, t);
      // the slots on the deck he can still fill, as dashed outlines
      if (c.phase === 'loading') {
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
        for (let col = 0; col < c.ship.cols; col++) {
          const n = c.boxes.filter(b => b.where === 'ship' && b.col === col).length;
          if (n < c.ship.tiers) ctx.strokeRect(X(shipColX(c, col) - BOX_W / 2), Y(deckY(c) + (n + 1) * BOX_H), BOX_W * u, BOX_H * u);
        }
        ctx.setLineDash([]);
      }
      for (const b of c.boxes) if (b.where === 'ship') drawBox(ctx, X(shipColX(c, b.col) - BOX_W / 2), Y(deckY(c) + (b.tier + 1) * BOX_H), BOX_W * u, BOX_H * u, looks(b.id), b.syl);
      ctx.restore();
      // the containers waiting on the quay
      for (const b of c.boxes) if (b.where === 'quay') drawBox(ctx, X(quayColX(c, b.col) - BOX_W / 2), Y(QUAY_Y + (b.tier + 1) * BOX_H), BOX_W * u, BOX_H * u, looks(b.id), b.syl);

      // the crane: legs either side of the quay's stacks, the boom over everything
      const legA = c.quayX0 - 1.6, legB = c.quayX0 + c.quayCols * COL + 1.4, bx0 = minX(c) - 7, bx1 = maxX(c) + 5;
      const paint = crane.paint, big = crane.kind === 'giant', apex = crane.kind === 'tall' || big ? 9 : 6;
      const W = (x: number) => x * u;
      const towerX = crane.kind === 'floating' ? legB + 5 : (legA + legB) / 2;
      if (crane.kind === 'floating') {
        // a pontoon in the water by the quay, its tower rising from it
        ctx.fillStyle = '#5b636b'; ctx.fillRect(X(legB + 1), waterY - 1.5 * u, 9 * u, 4 * u); ctx.fillStyle = '#ffcc00'; ctx.fillRect(X(legB + 1), waterY - 1.5 * u, 9 * u, 0.6 * u);
        ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, 0.35 * u); ctx.strokeRect(X(legB + 1), waterY - 1.5 * u, 9 * u, 4 * u);
        beam(ctx, X(towerX), waterY - 1.5 * u, X(towerX), Y(BOOM_Y), W(1.8), paint);
        beam(ctx, X(towerX), Y(8), X(towerX - 4), Y(BOOM_Y), W(0.8), paint, false);
      } else {
        const lean = crane.kind === 'dock' ? 2.2 : 0, legW = big ? 1.9 : 1.4;
        beam(ctx, X(legA), Y(QUAY_Y), X(legA + lean), Y(BOOM_Y), W(legW), paint, crane.kind !== 'dock');
        beam(ctx, X(legB), Y(QUAY_Y), X(legB - lean), Y(BOOM_Y), W(legW), paint, crane.kind !== 'dock');
        beam(ctx, X(legA + lean * 0.3), Y(QUAY_Y + 14), X(legB - lean * 0.3), Y(QUAY_Y + 14), W(0.8), paint, false);
        if (crane.kind !== 'dock') beam(ctx, X(legA), Y(BOOM_Y - 8), X(legB), Y(BOOM_Y - 8), W(0.7), paint, false);
        if (crane.kind === 'gantry' || big) { ctx.fillStyle = '#333'; for (const lx of [legA, legB]) { ctx.beginPath(); ctx.arc(X(lx - 1), Y(QUAY_Y) - 0.6 * u, 0.7 * u, 0, 7); ctx.arc(X(lx + 1), Y(QUAY_Y) - 0.6 * u, 0.7 * u, 0, 7); ctx.fill(); } }
      }
      // the boom, the A-frame and its stays, and the machinery house on the back-reach
      beam(ctx, X(towerX - apex * 0.35), Y(BOOM_Y), X(towerX), Y(BOOM_Y + apex), W(0.9), paint, false);
      beam(ctx, X(towerX + apex * 0.35), Y(BOOM_Y), X(towerX), Y(BOOM_Y + apex), W(0.9), paint, false);
      ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, 0.2 * u); ctx.beginPath();
      ctx.moveTo(X(bx0 + 1), Y(BOOM_Y + 0.8)); ctx.lineTo(X(towerX), Y(BOOM_Y + apex)); ctx.lineTo(X(bx1 - 1), Y(BOOM_Y + 0.8)); ctx.stroke();
      beam(ctx, X(bx0), Y(BOOM_Y), X(bx1), Y(BOOM_Y), W(big ? 2.2 : 1.7), paint);
      const house = big ? 7 : 5;
      ctx.fillStyle = shade(paint, 0.3); ctx.fillRect(X(bx0 + 0.5), Y(BOOM_Y + 4.2), W(house), W(3.2));
      ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, 0.35 * u); ctx.strokeRect(X(bx0 + 0.5), Y(BOOM_Y + 4.2), W(house), W(3.2));
      if (crane.lights) {
        for (let i = 0; i < 9; i++) { const lx = bx0 + ((bx1 - bx0) / 8) * i; ctx.fillStyle = (Math.floor(t * 3) + i) % 3 === 0 ? '#ffffff' : crane.lights; ctx.beginPath(); ctx.arc(X(lx), Y(BOOM_Y) + 1.4 * u, 0.45 * u, 0, 7); ctx.fill(); }
      }

      // where his finger is pointing on the boom
      if (finger !== null && c.mode === 'rest') { ctx.fillStyle = 'rgba(255,210,63,.55)'; ctx.beginPath(); ctx.arc(X(Math.max(minX(c), Math.min(maxX(c), finger))), Y(BOOM_Y), 2.4 * u, 0, 7); ctx.fill(); }

      // the trolley with the driver's cab under it, the cables and the grab, swinging
      const tx = X(c.x), ty = Y(BOOM_Y) + 1.2 * u, gy = Y(c.y), len = gy - ty - 2.6 * u;
      const swing = c.swing, gx = tx + Math.sin(swing) * len;
      ctx.fillStyle = '#3a3f44'; ctx.fillRect(tx - 2.6 * u, ty - 2.2 * u, 5.2 * u, 2.2 * u);
      ctx.fillStyle = shade(paint, -0.05); ctx.fillRect(tx + 0.2 * u, ty, 2.6 * u, 2.4 * u);
      ctx.fillStyle = '#9fd6f2'; ctx.fillRect(tx + 0.7 * u, ty + 0.5 * u, 1.7 * u, 1.2 * u);
      ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, 0.3 * u); ctx.strokeRect(tx - 2.6 * u, ty - 2.2 * u, 5.2 * u, 2.2 * u); ctx.strokeRect(tx + 0.2 * u, ty, 2.6 * u, 2.4 * u);
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = Math.max(1.5, 0.2 * u);
      ctx.beginPath(); ctx.moveTo(tx - 1.8 * u, ty); ctx.lineTo(gx - 2.8 * u, gy - 0.9 * u); ctx.moveTo(tx - 0.6 * u, ty); ctx.lineTo(gx + 2.8 * u, gy - 0.9 * u); ctx.stroke();
      // a line straight down to where it would land, while it's at rest
      if (c.mode === 'rest' && c.phase === 'loading') { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, gy + 2); ctx.lineTo(tx, waterY); ctx.stroke(); ctx.setLineDash([]); }
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(-swing * 0.5);
      // the spreader (the grab), safety yellow
      held(c).forEach((b, i) => drawBox(ctx, -BOX_W / 2 * u, (i * BOX_H) * u, BOX_W * u, BOX_H * u, looks(b.id), b.syl, true));
      spreader(ctx, 0, -1 * u, BOX_W * u, 1 * u);
      ctx.restore();
    },
  };
}
