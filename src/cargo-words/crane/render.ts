// Draws the Crane on a 2D canvas, from the side: sky, the far shore, the water, the quay with its containers, the ship at the quay (sitting
// lower as it fills), the crane's legs and boom, the trolley, the cables and the grab with whatever it holds, swinging a little. The whole
// scene is fitted to the canvas, so a bigger ship zooms out. Nothing here changes the model (sim.ts).
import { drawBox, type BoxLook } from '../art/container';
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

export function createCraneScene(canvas: HTMLCanvasElement): CraneScene {
  const ctx = canvas.getContext('2d')!;
  let w = 1, h = 1, dpr = 1, u = 1, ox = 0, waterY = 0;
  const X = (x: number) => ox + x * u, Y = (y: number) => waterY - y * u;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  resize();
  function fit(c: Crane) {
    // the whole scene, from just below the boom's top to a little under the water, fits the canvas
    const worldH = BOOM_Y + 14, worldW = c.width + 4;
    u = Math.min(w / worldW, h / worldH);
    ox = (w - c.width * u) / 2;
    waterY = h - Math.max(8 * u, (h - worldH * u) / 2 + 8 * u);
  }

  return {
    resize,
    toWorld: px => (px - ox) / u,
    frame(c, t, looks, ship, crane, night, finger) {
      fit(c);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // sky and the far shore
      const sky = ctx.createLinearGradient(0, 0, 0, waterY);
      sky.addColorStop(0, night ? '#0d1838' : '#6cc0ec'); sky.addColorStop(1, night ? '#2b3c6c' : '#d8f1ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      if (night) { ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(w * 0.85, h * 0.12, 16, 0, 7); ctx.fill(); }
      ctx.fillStyle = night ? '#1e2b4a' : '#8fb3a8';
      ctx.beginPath(); ctx.moveTo(0, waterY - 6 * u);
      for (let i = 0; i <= 12; i++) ctx.lineTo((w / 12) * i, waterY - (6 + 3 * Math.sin(i * 1.7)) * u);
      ctx.lineTo(w, waterY); ctx.lineTo(0, waterY); ctx.fill();
      // the water
      ctx.fillStyle = night ? '#0f4a4a' : '#1f9a8a'; ctx.fillRect(0, waterY, w, h - waterY);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) { const yy = waterY + 6 + i * 9, off = (t * 18 + i * 37) % 60; ctx.beginPath(); for (let x = -off; x < w; x += 60) { ctx.moveTo(x, yy); ctx.lineTo(x + 22, yy); } ctx.stroke(); }

      // the ship, sitting lower as it fills, and sailing off to the right when full
      const sail = c.sail * u, bob = Math.sin(t * 1.3) * 0.25 * u;
      ctx.save(); ctx.translate(sail, bob);
      drawShip(ctx, ship, X(c.shipX0), c.ship.cols * COL * u, Y(deckY(c)), waterY, u, t);
      // the slots on the deck he can still fill, as faint outlines
      if (c.phase === 'loading') {
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
        for (let col = 0; col < c.ship.cols; col++) {
          const n = c.boxes.filter(b => b.where === 'ship' && b.col === col).length;
          if (n < c.ship.tiers) ctx.strokeRect(X(shipColX(c, col) - BOX_W / 2), Y(deckY(c) + (n + 1) * BOX_H), BOX_W * u, BOX_H * u);
        }
        ctx.setLineDash([]);
      }
      for (const b of c.boxes) if (b.where === 'ship') drawBox(ctx, X(shipColX(c, b.col) - BOX_W / 2), Y(deckY(c) + (b.tier + 1) * BOX_H), BOX_W * u, BOX_H * u, looks(b.id), b.syl);
      ctx.restore();

      // the quay
      const quayR = X(c.quayX0 + c.quayCols * COL + 2);
      ctx.fillStyle = '#9aa1a8'; ctx.fillRect(0, Y(QUAY_Y), quayR, h - Y(QUAY_Y));
      ctx.fillStyle = '#7e858c'; ctx.fillRect(0, Y(QUAY_Y), quayR, 1.2 * u);
      ctx.strokeStyle = '#141414'; ctx.lineWidth = 3; ctx.strokeRect(-4, Y(QUAY_Y), quayR + 4, h);
      // bollards and a fender
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(quayR - 3 * u, Y(QUAY_Y) - 1.4 * u, 1.4 * u, 1.4 * u);
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(quayR - 0.2 * u, Y(QUAY_Y) + 3 * u, 1.1 * u, 0, 7); ctx.fill();
      for (const b of c.boxes) if (b.where === 'quay') drawBox(ctx, X(quayColX(c, b.col) - BOX_W / 2), Y(QUAY_Y + (b.tier + 1) * BOX_H), BOX_W * u, BOX_H * u, looks(b.id), b.syl);

      // the crane: legs on the quay, the boom over everything
      const legA = c.quayX0 + 1, legB = c.quayX0 + c.quayCols * COL - 1, bx0 = minX(c) - 6, bx1 = maxX(c) + 5;
      const paint = crane.paint, line = Math.max(2, 0.35 * u);
      ctx.strokeStyle = '#141414'; ctx.lineWidth = line;
      const beam = (x0: number, y0: number, x1: number, y1: number, width: number) => {
        ctx.save(); ctx.lineCap = 'round';
        ctx.strokeStyle = '#141414'; ctx.lineWidth = width * u + line * 2; ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x1), Y(y1)); ctx.stroke();
        ctx.strokeStyle = paint; ctx.lineWidth = width * u; ctx.stroke(); ctx.restore();
      };
      if (crane.kind === 'floating') {
        // a pontoon in the water by the quay, its tower rising from it
        ctx.fillStyle = '#5b636b'; ctx.fillRect(X(legB - 2), waterY - 1.5 * u, 12 * u, 4 * u);
        beam(legB + 4, 0, legB + 4, BOOM_Y, 1.6);
      } else {
        beam(legA, QUAY_Y, legA + (crane.kind === 'dock' ? 2 : 0), BOOM_Y, crane.kind === 'giant' ? 1.8 : 1.3);
        beam(legB, QUAY_Y, legB - (crane.kind === 'dock' ? 2 : 0), BOOM_Y, crane.kind === 'giant' ? 1.8 : 1.3);
        if (crane.kind !== 'dock') beam(legA, QUAY_Y + 12, legB, QUAY_Y + 12, 0.8);
        if (crane.kind === 'gantry' || crane.kind === 'giant') { ctx.fillStyle = '#333'; for (const lx of [legA, legB]) { ctx.beginPath(); ctx.arc(X(lx - 1), Y(QUAY_Y) - 0.6 * u, 0.7 * u, 0, 7); ctx.arc(X(lx + 1), Y(QUAY_Y) - 0.6 * u, 0.7 * u, 0, 7); ctx.fill(); } }
      }
      // the boom, with a cab and a back stay
      beam(bx0, BOOM_Y, bx1, BOOM_Y, crane.kind === 'giant' ? 2.2 : 1.6);
      const towerX = crane.kind === 'floating' ? legB + 4 : (legA + legB) / 2;
      beam(towerX, BOOM_Y, towerX, BOOM_Y + (crane.kind === 'tall' || crane.kind === 'giant' ? 8 : 5), 0.9);
      ctx.strokeStyle = '#141414'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X(towerX), Y(BOOM_Y + (crane.kind === 'tall' || crane.kind === 'giant' ? 8 : 5))); ctx.lineTo(X(bx1 - 1), Y(BOOM_Y + 0.8)); ctx.moveTo(X(towerX), Y(BOOM_Y + 5)); ctx.lineTo(X(bx0 + 1), Y(BOOM_Y + 0.8)); ctx.stroke();
      if (crane.lights) {
        for (let i = 0; i < 9; i++) { const lx = bx0 + ((bx1 - bx0) / 8) * i; ctx.fillStyle = (Math.floor(t * 3) + i) % 3 === 0 ? '#ffffff' : crane.lights; ctx.beginPath(); ctx.arc(X(lx), Y(BOOM_Y) + 1.4 * u, 0.45 * u, 0, 7); ctx.fill(); }
      }

      // where his finger is pointing on the boom
      if (finger !== null && c.mode === 'rest') { ctx.fillStyle = 'rgba(255,210,63,.5)'; ctx.beginPath(); ctx.arc(X(Math.max(minX(c), Math.min(maxX(c), finger))), Y(BOOM_Y), 2.2 * u, 0, 7); ctx.fill(); }

      // the trolley, the cables and the grab, swinging
      const tx = X(c.x), ty = Y(BOOM_Y) + 1.2 * u, gy = Y(c.y), len = gy - ty;
      const swing = c.swing, gx = tx + Math.sin(swing) * len;
      ctx.fillStyle = '#3a3f44'; ctx.fillRect(tx - 2.4 * u, ty - 2.4 * u, 4.8 * u, 2.4 * u);
      ctx.strokeStyle = '#141414'; ctx.lineWidth = line; ctx.strokeRect(tx - 2.4 * u, ty - 2.4 * u, 4.8 * u, 2.4 * u);
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = Math.max(1.5, 0.2 * u);
      ctx.beginPath(); ctx.moveTo(tx - 1.5 * u, ty); ctx.lineTo(gx - 2.8 * u, gy - 0.9 * u); ctx.moveTo(tx + 1.5 * u, ty); ctx.lineTo(gx + 2.8 * u, gy - 0.9 * u); ctx.stroke();
      // a line straight down to where it would land, while it's at rest
      if (c.mode === 'rest' && c.phase === 'loading') { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, gy); ctx.lineTo(tx, waterY); ctx.stroke(); ctx.setLineDash([]); }
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(-swing * 0.5);
      // the spreader (the grab), safety yellow
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(-BOX_W / 2 * u, -1 * u, BOX_W * u, 1 * u);
      ctx.strokeStyle = '#141414'; ctx.lineWidth = line; ctx.strokeRect(-BOX_W / 2 * u, -1 * u, BOX_W * u, 1 * u);
      held(c).forEach((b, i) => drawBox(ctx, -BOX_W / 2 * u, (i * BOX_H) * u, BOX_W * u, BOX_H * u, looks(b.id), b.syl, true));
      ctx.restore();
    },
  };
}
