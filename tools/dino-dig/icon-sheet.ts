// A contact sheet of every game's Home Screen icon beside Dino Dig's, at landing-tile and Home Screen sizes, for judging the icon by eye.
//   npx tsx tools/dino-dig/icon-sheet.ts <out.png>
import sharp from 'sharp';
import { iconSvg as truck } from '../../src/icon/icon';
import { iconSvg as flies } from '../../src/time-flies/icon';
import { iconSvg as chop } from '../../src/chop-chop/icon';
import { iconSvg as squad } from '../../src/sight-squad/icon';
import { iconSvg as math } from '../../src/math-bots/icon';
import { iconSvg as rover } from '../../src/rover-code/icon';
import { iconSvg as fleet } from '../../src/treasure-fleet/icon';
import { iconSvg as rescue } from '../../src/wild-rescue/icon';
import { iconSvg as express } from '../../src/sentence-express/icon';
import { iconSvg as wreckers } from '../../src/word-wreckers/icon';
import { iconSvg as dino } from '../../src/dino-dig/icon';

const out = process.argv[2] ?? 'icon-sheet.png';
const icons = [dino, truck, flies, chop, squad, math, rover, fleet, rescue, express, wreckers];
const SIZES = [180, 120, 76, 60, 40];
const pad = 16, W = icons.length * (SIZES[0]! + pad) + pad;
const layers: { input: Buffer; left: number; top: number }[] = [];
let y = pad;
for (const size of SIZES) {
  for (const [i, f] of icons.entries()) {
    const png = await sharp(Buffer.from(f(1)), { density: (72 * size) / 512 }).resize(size, size).png().toBuffer();
    // rounded like the Home Screen
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * .225}" fill="#fff"/></svg>`);
    const r = await sharp(png).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    layers.push({ input: r, left: pad + i * (SIZES[0]! + pad), top: y });
  }
  y += size + pad;
}
await sharp({ create: { width: W, height: y, channels: 4, background: '#2b2f36' } }).composite(layers).png().toFile(out);
console.log(out);
// and Dino Dig's own, big, and as a maskable icon (the art at 0.8, cropped to the circle Android keeps)
const big = await sharp(Buffer.from(dino(1))).resize(400, 400).png().toBuffer();
const maskable = await sharp(Buffer.from(dino(.8))).resize(400, 400).composite([{ input: Buffer.from('<svg width="400" height="400"><circle cx="200" cy="200" r="200" fill="#fff"/></svg>'), blend: 'dest-in' }]).png().toBuffer();
await sharp({ create: { width: 832, height: 416, channels: 4, background: '#2b2f36' } }).composite([{ input: big, left: 8, top: 8 }, { input: maskable, left: 424, top: 8 }]).png().toFile(out.replace(/\.png$/, '-dino.png'));
