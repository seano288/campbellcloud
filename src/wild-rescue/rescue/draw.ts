// Draws the drive on a 2D canvas: the place's sky and far hills, the road with its mud, sand, snow, streams, logs and rocks, the four
// Bolts, his truck (the same drawing as the Garage's, as an image) and the animal waiting at the end. The camera keeps the truck a
// third of the way across, so he sees what's coming. Pieces are few and simple, for an iPad 9 at 60 fps.
import { animal, type RescueId } from '../facts/animals';
import { habitat, type HabitatId } from '../facts/habitats';
import { drawnSvg } from '../art/drawn';
import { truckSvg, TRUCK_BOX, TRUCK_H } from '../art/truck';
import type { Truck } from '../park/shop';
import { END_X, groundAt, GROUND_Y, VIEW_H, type Drive } from './drive';

const images = new Map<string, HTMLImageElement>();
/** An SVG string as an image, made once. Until it has loaded nothing is drawn for it. */
function image(svg: string): HTMLImageElement | null {
  let img = images.get(svg);
  if (!img) {
    img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    images.set(svg, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}

/** World width shown for a canvas of this aspect: the height is always VIEW_H. */
export const widthFor = (aspect: number) => VIEW_H * Math.max(.6, Math.min(2.4, aspect));
export const TRUCK_SCALE = .74;
const TRUCK_PX_W = TRUCK_BOX.w * TRUCK_SCALE, TRUCK_PX_H = TRUCK_BOX.h * TRUCK_SCALE, WHEEL_BOTTOM = (TRUCK_H - 6 - TRUCK_BOX.y) * TRUCK_SCALE;

const DIRT: Record<HabitatId, string> = { farm: '#8a6a3a', grassland: '#b89a4a', forest: '#5a4a2a', rainforest: '#5a3f22', pond: '#7a6a3a', desert: '#e2b25e', ocean: '#e9d39a', polar: '#dfeaf2' };
const FAR: Record<HabitatId, string> = { farm: '#9fcf78', grassland: '#c9b45a', forest: '#2f6a2a', rainforest: '#1f6a3a', pond: '#7cbf6a', desert: '#e9bf72', ocean: '#2f8fd8', polar: '#bcd8ea' };

/** Draws an animal at (x, y) bottom-centre, `size` world units tall, facing left (toward the truck as it comes, and the way it
 *  drives home). Most of Apple's animals already face left; the drawn ones face right, so they're turned. */
export function drawAnimal(c: CanvasRenderingContext2D, id: RescueId, x: number, y: number, size: number) {
  const art = animal(id).art;
  c.save();
  c.translate(x, y);
  if ('emoji' in art) {
    c.font = `${size}px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.fillText(art.emoji, 0, 0);
  } else {
    c.scale(-1, 1);
    const img = image(drawnSvg(art.drawn));
    if (img) c.drawImage(img, -size / 2, -size, size, size);
  }
  c.restore();
}

export function drawTruck(c: CanvasRenderingContext2D, truck: Truck, x: number, groundY: number, tilt: number, flip = false) {
  const img = image(truckSvg(truck));
  c.save();
  c.translate(x, groundY);
  c.rotate(tilt);
  if (flip) c.scale(-1, 1);
  if (img) c.drawImage(img, -TRUCK_PX_W * .55, -WHEEL_BOTTOM, TRUCK_PX_W, TRUCK_PX_H);
  c.restore();
}

function drawBolt(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  c.save();
  c.translate(x, y + Math.sin(t * 3 + x) * 6);
  c.fillStyle = '#ffd23f'; c.strokeStyle = '#1d1d1f'; c.lineWidth = 4;
  c.beginPath();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; c.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fill(); c.stroke();
  c.restore();
}

/** The drive. `showTruckAt` (the drive home): draw the truck there, facing back, with the animal riding. */
export function drawDrive(c: CanvasRenderingContext2D, d: Drive, w: number, h: number, truck: Truck, home: HabitatId, who: RescueId, opts: { animalAtEnd: boolean; homeX?: number; rider?: boolean; reduced: boolean }) {
  const k = h / VIEW_H, worldW = w / k, focus = opts.homeX ?? d.x;
  const cam = Math.max(0, Math.min(END_X + 400 - worldW, focus - worldW * (opts.homeX !== undefined ? .6 : .32)));
  const hab = habitat(home);
  c.save();
  c.scale(k, k);
  // sky and far hills (a slow parallax)
  const sky = c.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, hab.sky); sky.addColorStop(1, '#ffffff');
  c.fillStyle = sky; c.fillRect(0, 0, worldW, VIEW_H);
  c.fillStyle = FAR[home];
  c.beginPath(); c.moveTo(0, VIEW_H);
  for (let x = 0; x <= worldW + 40; x += 40) c.lineTo(x, GROUND_Y - 90 - Math.sin((x + cam * .3) / 170) * 40 - Math.sin((x + cam * .3) / 61) * 12);
  c.lineTo(worldW, VIEW_H); c.closePath(); c.fill();
  c.translate(-cam, 0);
  // the road
  c.fillStyle = hab.ground; c.strokeStyle = '#1d1d1f'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(cam - 20, VIEW_H);
  for (let x = cam - 20; x <= cam + worldW + 40; x += 16) c.lineTo(x, GROUND_Y - groundAt(d, x));
  c.lineTo(cam + worldW + 40, VIEW_H); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = DIRT[home];
  c.fillRect(cam - 20, GROUND_Y + 40, worldW + 60, VIEW_H);
  // what's in the road
  for (const o of d.obstacles) {
    if (o.x + o.w < cam - 40 || o.x > cam + worldW + 40) continue;
    const gy = (x: number) => GROUND_Y - groundAt(d, x);
    if (o.kind === 'stream') {
      c.fillStyle = '#4aa3df'; c.beginPath(); c.moveTo(o.x, gy(o.x));
      for (let x = o.x; x <= o.x + o.w; x += 10) c.lineTo(x, gy(x) - 4);
      c.lineTo(o.x + o.w, gy(o.x + o.w)); c.closePath(); c.fill();
      c.strokeStyle = '#ffffffaa'; c.lineWidth = 3;
      for (let x = o.x + 20; x < o.x + o.w - 10; x += 34) { c.beginPath(); c.arc(x + Math.sin(d.t * 4 + x) * 4, gy(x) - 10, 7, Math.PI, 0); c.stroke(); }
    } else if (o.kind === 'log') {
      c.fillStyle = '#8a5a2b'; c.strokeStyle = '#1d1d1f'; c.lineWidth = 4;
      c.beginPath(); c.roundRect(o.x - 10, gy(o.x) - 34, o.w + 20, 34, 16); c.fill(); c.stroke();
      c.fillStyle = '#c99a5a'; c.beginPath(); c.ellipse(o.x + o.w + 4, gy(o.x) - 17, 10, 16, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    } else if (o.kind === 'rock') {
      c.fillStyle = home === 'polar' ? '#bcd8ea' : '#9a9a8a'; c.strokeStyle = '#1d1d1f'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(o.x - 12, gy(o.x)); c.lineTo(o.x, gy(o.x) - 38); c.lineTo(o.x + o.w, gy(o.x) - 30); c.lineTo(o.x + o.w + 12, gy(o.x)); c.closePath(); c.fill(); c.stroke();
    } else {
      c.fillStyle = o.kind === 'mud' ? '#6a4a2a' : o.kind === 'sand' ? '#f2d38a' : '#ffffff';
      c.beginPath(); c.moveTo(o.x, gy(o.x));
      for (let x = o.x; x <= o.x + o.w; x += 12) c.lineTo(x, gy(x) - 10 - Math.sin(x / 14) * 4);
      c.lineTo(o.x + o.w, gy(o.x + o.w)); c.closePath(); c.fill();
      if (o.kind === 'mud') { c.fillStyle = '#4a3018'; for (let x = o.x + 30; x < o.x + o.w; x += 50) { c.beginPath(); c.arc(x, gy(x) - 6, 5, 0, Math.PI * 2); c.fill(); } }
    }
  }
  for (const b of d.bolts) if (!b.got && opts.homeX === undefined) drawBolt(c, b.x, GROUND_Y - groundAt(d, b.x) - b.y, opts.reduced ? 0 : d.t);
  // the animal waiting at the end, and a little flag
  const endY = GROUND_Y - groundAt(d, END_X + 120);
  if (opts.animalAtEnd) drawAnimal(c, who, END_X + 150, endY, 120);
  c.strokeStyle = '#1d1d1f'; c.lineWidth = 5; c.beginPath(); c.moveTo(END_X + 40, endY); c.lineTo(END_X + 40, endY - 120); c.stroke();
  c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(END_X + 40, endY - 120); c.lineTo(END_X + 90, endY - 104); c.lineTo(END_X + 40, endY - 88); c.closePath(); c.fill(); c.stroke();
  // the truck
  const tx = opts.homeX ?? d.x, ty = opts.homeX !== undefined ? GROUND_Y - groundAt(d, tx) : GROUND_Y - d.y;
  const slope = Math.atan2(groundAt(d, tx - 40) - groundAt(d, tx + 40), 80);
  const flip = opts.homeX !== undefined;
  drawTruck(c, truck, tx, ty + (d.splashing && !flip ? 10 : 0), flip ? -slope : slope, flip);
  if (opts.rider) drawAnimal(c, who, tx + (flip ? 42 : -42), ty - 80, 60);
  c.restore();
}
