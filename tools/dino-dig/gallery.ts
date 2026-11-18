// Draws all twelve dinosaurs on one sheet, for judging them by eye: each as a half-built skeleton (missing bones dashed), a whole
// skeleton, with its own skin, and in a few looks from the shop (a colour, a pattern and a hat), at Museum-plinth size.
//   npm run dev:dino-dig   (in another shell)
//   npx tsx tools/dino-dig/gallery.ts <url> <out.png>
import { chromium } from 'playwright';

const [url = 'http://localhost:5181/', out = 'dino-gallery.png'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1500 }, deviceScaleFactor: 1 });
await page.goto(url);
await page.waitForTimeout(800);
await page.evaluate(async () => {
  const { drawDino, bounds } = await import('/src/dino-dig/art/dino.ts' as string);
  const { DINOS } = await import('/src/dino-dig/museum/dinos.ts' as string);
  document.body.innerHTML = '';
  const W = 1400, cellW = 230, cellH = 120, cv = document.createElement('canvas');
  cv.width = W; cv.height = DINOS.length * cellH + 30;
  document.body.append(cv);
  Object.assign(document.body.style, { margin: '0', background: '#fff' });
  const c = cv.getContext('2d')!;
  const looks = [
    null,
    { color: 'natural', marking: 'stripes', hat: 'cap', roar: 'roar' },
    { color: 'blue', marking: 'spots', hat: 'crown', roar: 'roar' },
    { color: 'rainbow', marking: 'stars', hat: 'shades', roar: 'roar' },
  ];
  const cols = ['half bones', 'all bones', ...looks.map(l => (l ? `${l.color} ${l.marking} ${l.hat}` : 'skin'))];
  c.font = '900 14px Nunito, sans-serif'; c.fillStyle = '#000';
  cols.forEach((t, k) => c.fillText(t, 10 + k * cellW, 18));
  DINOS.forEach((d: any, row: number) => {
    const y0 = 30 + row * cellH;
    cols.forEach((_, col) => {
      const x0 = 10 + col * cellW;
      c.fillStyle = col < 2 ? '#f4e3b8' : '#e7f3dc'; c.fillRect(x0, y0, cellW - 10, cellH - 8);
      const b = bounds(d), px = Math.min(((cellW - 10) * .92) / b.width, ((cellH - 8) * .86) / b.height);
      c.save(); c.translate(x0 + (cellW - 10 - b.width * px) / 2 - b.left * px, y0 + (cellH - 8) * .95);
      if (col < 2) drawDino(c, d, { mode: 'bones', px, have: col === 0 ? d.bones.slice(0, Math.ceil(d.bones.length / 2)) : d.bones });
      else drawDino(c, d, { mode: 'skin', px, look: looks[col - 2] ?? undefined, t: 1 });
      c.restore();
    });
  });
});
// GALLERY=looks: every colour and every pattern from the shop, on a Velociraptor and a Triceratops, at plinth size
if (process.env.GALLERY === 'looks') await page.evaluate(async () => {
  const { drawDino, bounds } = await import('/src/dino-dig/art/dino.ts' as string);
  const { DINOS } = await import('/src/dino-dig/museum/dinos.ts' as string);
  const { COLORS, MARKINGS } = await import('/src/dino-dig/shop/shop.ts' as string);
  const cv = document.querySelector('canvas')!, c = cv.getContext('2d')!;
  const looks = [...COLORS.map((x: any) => ({ color: x.id, marking: 'none', hat: 'none', roar: 'roar', label: x.name })), ...MARKINGS.map((x: any) => ({ color: 'natural', marking: x.id, hat: 'none', roar: 'roar', label: x.name }))];
  const cellW = 170, cellH = 110, cols = 8, rows = Math.ceil(looks.length / cols) * 2;
  cv.width = cols * cellW + 10; cv.height = rows * (cellH + 16) + 10;
  c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height);
  ['raptor', 'trike'].forEach((id, half) => {
    const d = DINOS.find((x: any) => x.id === id), b = bounds(d);
    looks.forEach((l, i) => {
      const x0 = 5 + (i % cols) * cellW, y0 = 5 + (half * Math.ceil(looks.length / cols) + Math.floor(i / cols)) * (cellH + 16);
      c.fillStyle = '#e7f3dc'; c.fillRect(x0, y0, cellW - 8, cellH);
      c.fillStyle = '#000'; c.font = '900 12px Nunito, sans-serif'; c.fillText(l.label, x0 + 4, y0 + cellH + 12);
      const px = Math.min(((cellW - 8) * .92) / b.width, (cellH * .86) / b.height);
      c.save(); c.translate(x0 + (cellW - 8 - b.width * px) / 2 - b.left * px, y0 + cellH * .95); drawDino(c, d, { mode: 'skin', px, look: l, t: 1 }); c.restore();
    });
  });
});
await page.locator('canvas').screenshot({ path: out });
await browser.close();
console.log(out);
