// Draws every submarine, and each Nose, Tail, Fin and Top on a few of them, into one picture, so the build pieces can be checked
// against every body without playing.
//   npx tsx tools/deep-light/subs-sheet.ts [outFile]
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const [out = 'subs-sheet.png'] = process.argv.slice(2);
const bundle = await build({
  stdin: {
    contents: `import { paintSub } from './src/deep-light/art/Pics'; import { freshDock, lookOf } from './src/deep-light/dock/dock';
      import { SUBS } from './src/deep-light/dock/subs'; import { NOSES, TAILS, FINS, TOPS, PAINTS } from './src/deep-light/dock/parts';
      (window as any).art = { paintSub, freshDock, lookOf, SUBS, NOSES, TAILS, FINS, TOPS, PAINTS };`,
    resolveDir: resolve(import.meta.dirname, '../..'), loader: 'tsx',
  },
  bundle: true, write: false, format: 'iife', jsx: 'automatic', jsxImportSource: 'preact', define: { 'import.meta.env': '{}' },
});
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setContent('<body style="margin:0;background:#2a8ad8"><canvas id="c"></canvas></body>');
await page.addScriptTag({ content: bundle.outputFiles[0]!.text });
const size = await page.evaluate(() => {
  const { paintSub, freshDock, lookOf, SUBS, NOSES, TAILS, FINS, TOPS, PAINTS } = (window as any).art;
  const base = lookOf(freshDock());
  const rows: { label: string; looks: any[] }[] = [];
  rows.push({ label: 'own colors', looks: SUBS.map((s: any) => ({ ...base, kind: s.id, ...s.own, paint: s.own.color, paint2: s.own.color2, pattern: s.own.pattern })) });
  const kinds = ['explorer', 'torpedo', 'turtle', 'octo', 'bubble', 'shark', 'duck', 'dragon'];
  for (const [tab, list] of [['nose', NOSES], ['tail', TAILS], ['fins', FINS], ['top', TOPS]] as const)
    for (const k of kinds.slice(0, tab === 'top' ? 8 : 4)) rows.push({ label: `${tab} on ${k}`, looks: (list as any[]).map(p => ({ ...base, kind: k, [tab]: p.id, lights: 3, sonar: 3, flash: 2, motor: 3, claw: 2 })) });
  rows.push({ label: 'paints', looks: PAINTS.slice(-12).map((p: any) => ({ ...base, kind: 'whale', paint: p.color, paint2: p.color2, pattern: p.pattern })) });
  const cw = 190, ch = 130, cols = 12, W = cols * cw + 140, H = rows.length * ch;
  const c = document.getElementById('c') as HTMLCanvasElement; c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#2a8ad8'; ctx.fillRect(0, 0, W, H);
  rows.forEach((r, i) => {
    ctx.fillStyle = '#fff'; ctx.font = '800 13px sans-serif'; ctx.fillText(r.label, 6, i * ch + ch / 2);
    r.looks.forEach((l, j) => { ctx.save(); ctx.translate(140 + j * cw, i * ch); paintSub(ctx, l, cw, ch, 0.4); ctx.restore(); ctx.strokeStyle = '#ffffff22'; ctx.strokeRect(140 + j * cw, i * ch, cw, ch); });
  });
  return { W, H };
});
await page.setViewportSize({ width: size.W, height: size.H });
await page.locator('#c').screenshot({ path: out });
await browser.close();
console.log(`saved ${out}`);
