// The Museum hall's room, painted once into its own canvas (and again only when the hall changes size or he buys the skylight): a
// sandstone block wall under a frieze, columns along it, a polished stone floor going back to the wall, and with the skylight, shafts of
// daylight. Each frame then only copies it, so the room costs one drawImage however much is in it (the iPad 9's limit is fill rate).
//
// The hall is HALL_UNITS tall in its own units; `sc` is canvas pixels per unit and `off` how far the view is scrolled into the hall,
// the same numbers the walkers are drawn with, so the columns stand still behind them.
import { layer } from '../art/loop';

export const HALL_UNITS = 260;
/** Where the wall meets the floor, as a fraction of the hall's height. */
export const FLOOR_AT = .66;

export function paintHall(cw: number, ch: number, off: number, skylight: boolean): HTMLCanvasElement {
  const { canvas, ctx: c } = layer(cw, ch), sc = ch / HALL_UNITS, fy = ch * FLOOR_AT;
  const X = (x: number) => (x - off) * sc;
  // the wall
  const wall = c.createLinearGradient(0, 0, 0, fy);
  wall.addColorStop(0, skylight ? '#f6ecd2' : '#e4cfa2'); wall.addColorStop(1, '#d8bf8c');
  c.fillStyle = wall; c.fillRect(0, 0, cw, fy);
  // its stone blocks: mortar lines, every other row's joints offset
  c.fillStyle = '#0000000f';
  const row = 22 * sc;
  for (let y = 26 * sc, k = 0; y < fy; y += row, k++) {
    c.fillRect(0, y, cw, Math.max(1, 1.5 * sc));
    for (let x = ((k % 2) * 32 - (off % 64)) * sc; x < cw; x += 64 * sc) c.fillRect(x, y, Math.max(1, 1.5 * sc), row);
  }
  // with the skylight, daylight falls in shafts
  if (skylight) {
    c.fillStyle = '#ffffff40';
    for (let x = 80 - (off % 260); x < cw / sc + 260; x += 260) {
      c.beginPath(); c.moveTo(X(x + off), 0); c.lineTo(X(x + off + 70), 0); c.lineTo(X(x + off + 130), ch); c.lineTo(X(x + off + 20), ch); c.closePath(); c.fill();
    }
  }
  // the frieze along the top, with a row of blocks under it
  c.fillStyle = '#c9a24a'; c.fillRect(0, 0, cw, 20 * sc);
  c.fillStyle = '#a8843a'; for (let x = -(off * sc) % (18 * sc); x < cw; x += 18 * sc) c.fillRect(x, 20 * sc, 10 * sc, 5 * sc);
  c.fillStyle = '#1b1410'; c.fillRect(0, 20 * sc, cw, Math.max(1, 2 * sc));
  // columns, every 200 units along the hall
  for (let x = 100 + 200 * Math.floor((off - 160) / 200); X(x) < cw + 40 * sc; x += 200) {
    const cx = X(x), w = 22 * sc;
    c.fillStyle = '#00000018'; c.fillRect(cx - w / 2 + 6 * sc, 26 * sc, w, fy - 26 * sc);
    const g = c.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); g.addColorStop(0, '#fbf3df'); g.addColorStop(.6, '#efe0bd'); g.addColorStop(1, '#d6bf8e');
    c.fillStyle = g; c.fillRect(cx - w / 2, 26 * sc, w, fy - 26 * sc);
    c.fillStyle = '#00000014'; for (let k = -1; k <= 1; k++) c.fillRect(cx + k * w * .28 - .75 * sc, 34 * sc, 1.5 * sc, fy - 46 * sc);
    c.fillStyle = '#e9d6ab'; c.fillRect(cx - w * .8, 24 * sc, w * 1.6, 8 * sc); c.fillRect(cx - w * .75, fy - 8 * sc, w * 1.5, 8 * sc);
    c.strokeStyle = '#1b141055'; c.lineWidth = Math.max(1, 1.5 * sc);
    c.strokeRect(cx - w / 2, 32 * sc, w, fy - 40 * sc); c.strokeRect(cx - w * .8, 24 * sc, w * 1.6, 8 * sc); c.strokeRect(cx - w * .75, fy - 8 * sc, w * 1.5, 8 * sc);
  }
  // the floor: polished stone going back to the wall, its tiles' lines meeting far away
  const floor = c.createLinearGradient(0, fy, 0, ch); floor.addColorStop(0, '#a9784a'); floor.addColorStop(1, '#7d5530');
  c.fillStyle = floor; c.fillRect(0, fy, cw, ch - fy);
  c.strokeStyle = '#00000022'; c.lineWidth = Math.max(1, 1.5 * sc);
  for (const t of [.18, .42, .72]) { const y = fy + (ch - fy) * t; c.beginPath(); c.moveTo(0, y); c.lineTo(cw, y); c.stroke(); }
  const vx = cw / 2;
  for (let x = -(off % 90) - 90 * 6; x < cw / sc + 90 * 6; x += 90) {
    c.beginPath(); c.moveTo(vx + (x * sc - vx) * .55, fy); c.lineTo(vx + (x * sc - vx) * 1.6, ch); c.stroke();
  }
  c.fillStyle = '#ffffff1c'; c.fillRect(0, fy + 4 * sc, cw, 3 * sc);
  // the skirting where they meet
  c.fillStyle = '#6b4523'; c.fillRect(0, fy - 5 * sc, cw, 5 * sc);
  c.fillStyle = '#1b1410'; c.fillRect(0, fy, cw, Math.max(1.5, 2 * sc));
  return canvas;
}
