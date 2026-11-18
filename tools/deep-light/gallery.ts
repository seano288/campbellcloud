// Draws every Deep Light animal (or one) on a dark sea and saves the picture, so the art can be looked at without playing a Dive.
//   npx tsx tools/deep-light/gallery.ts [outFile] [animalId[,animalId...]]
// With an id it draws that one large (the anglerfish was shown to the parent first: .scratch/deep-light/anglerfish.png).
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const [out = 'gallery.png', only] = process.argv.slice(2);
const bundle = await build({
  stdin: { contents: `import { drawCreature, glowAt } from './src/deep-light/art/creatures'; import { ANIMALS } from './src/deep-light/sea/animals'; (window as any).art = { drawCreature, glowAt, ANIMALS };`, resolveDir: resolve(import.meta.dirname, '../..'), loader: 'ts' },
  bundle: true, write: false, format: 'iife',
});
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.setContent('<body style="margin:0;background:#06102a"><canvas id="c"></canvas></body>');
await page.addScriptTag({ content: bundle.outputFiles[0]!.text });
const size = await page.evaluate(only => {
  const { drawCreature, glowAt, ANIMALS } = (window as any).art;
  const ids = only ? only.split(',') : null, list = ids ? ANIMALS.filter((a: any) => ids.includes(a.id)) : ANIMALS;
  const one = !!ids && ids.length === 1, cell = one ? 420 : ids ? 300 : 170, cols = one ? 1 : ids ? Math.min(4, ids.length) : 8, rows = Math.ceil(list.length / cols);
  const c = document.getElementById('c') as HTMLCanvasElement, W = cols * cell, H = rows * (cell + (only ? 40 : 24));
  c.width = W * 2; c.height = H * 2; c.style.width = `${W}px`; c.style.height = `${H}px`;
  const ctx = c.getContext('2d')!; ctx.scale(2, 2);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d2a5a'); g.addColorStop(1, '#030818'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  list.forEach((a: any, i: number) => {
    const x = (i % cols) * cell + cell / 2, y = Math.floor(i / cols) * (cell + (only ? 40 : 24)) + cell / 2, k = (cell / 200) * 0.95;
    if (a.glow) { const [gx, gy] = glowAt(a, 0); const rg = ctx.createRadialGradient(x + gx * k, y + gy * k, 0, x + gx * k, y + gy * k, 40 * k); rg.addColorStop(0, a.glow); rg.addColorStop(1, a.glow + '00'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x + gx * k, y + gy * k, 40 * k, 0, 7); ctx.fill(); }
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); drawCreature(ctx, a, 0.3); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = `800 ${only ? 22 : 12}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(a.name, x, y + cell / 2 + (only ? 26 : 12));
  });
  return { W, H };
}, only ?? null);
await page.setViewportSize({ width: size.W, height: size.H });
await page.locator('#c').screenshot({ path: out });
await browser.close();
console.log(`saved ${out}`);
