// A contact sheet of dragons, for judging the art: the starter, every bought egg's dragon and a run of Wild Eggs, each at its three
// stages and at the sizes it is really drawn (a lesson or Home, the Flight on an iPad and on a phone, the Roost and Visit, a shop tile),
// plus the eggs. Draws with the game's own drawDragon in a real browser, through the dev server.
//   npm run dev:dragon-roost   (in another shell)
//   npx tsx tools/dragon-roost/sheet.ts <url> <out.png> [catalogue|wild]
import { chromium } from 'playwright';

const [url = 'http://localhost:5164/', out = '/tmp/dragon-sheet.png', which = 'catalogue'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
await page.goto(url);
await page.waitForLoadState('networkidle');
const png = await page.evaluate(async (which) => {
  const base: string = '/src/dragon-roost/';
  const art = await import(/* @vite-ignore */ `${base}art/dragon.ts`), cat = await import(/* @vite-ignore */ `${base}roost/catalog.ts`), dr = await import(/* @vite-ignore */ `${base}roost/dragons.ts`);
  const looks = which === 'wild'
    ? Array.from({ length: 16 }, (_, i) => ({ name: `wild ${i * 3 + 1}`, look: dr.wildLook(i * 3 + 1) }))
    : [{ name: 'starter', look: cat.STARTER_LOOK }, ...cat.EGGS.slice(0, 15).map((e: { name: string; look: unknown }) => ({ name: e.name, look: e.look }))];
  // columns: [label, stage, size, cell]
  const cols = [['stage 0', 0, 150, 190], ['stage 1', 1, 150, 190], ['stage 2', 2, 150, 190], ['flight pad', 2, 120, 150], ['flight phone', 2, 58, 90], ['roost', 0, 52, 80], ['visit', 1, 70, 100], ['tile', 2, 40, 70]] as const;
  const W = 120 + cols.reduce((s, c) => s + c[3], 0) + 80, rowH = 170, H = 40 + looks.length * rowH;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff1cf'; ctx.fillRect(0, 0, W, H);
  ctx.font = '900 14px Nunito, sans-serif'; ctx.fillStyle = '#2a1a12';
  let x = 120; for (const col of cols) { ctx.fillText(col[0], x + 8, 24); x += col[3]; } ctx.fillText('egg', x + 8, 24);
  looks.forEach((l, r) => {
    const y = 40 + r * rowH;
    ctx.fillStyle = r % 2 ? '#ffe3b5' : '#ffd7c4'; ctx.fillRect(0, y, W, rowH);
    ctx.fillStyle = '#2a1a12'; ctx.fillText(l.name, 8, y + rowH / 2);
    let x = 120;
    for (const [, stage, size, cell] of cols) {
      ctx.save(); ctx.translate(x + cell * .46, y + rowH * .58);
      art.drawDragon(ctx, l.look, size, { stage: stage as 0 | 1 | 2, t: .35, flap: 1 });
      ctx.restore(); x += cell;
    }
    ctx.save(); ctx.translate(x + 30, y + rowH / 2); art.drawEgg(ctx, l.look, 54, .8); ctx.restore();
  });
  return c.toDataURL('image/png');
}, which);
const { writeFileSync } = await import('node:fs');
writeFileSync(out, Buffer.from(png.split(',')[1]!, 'base64'));
await browser.close();
console.log(out);
