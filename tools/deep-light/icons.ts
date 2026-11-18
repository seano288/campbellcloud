// Every game's icon side by side, large and at Home Screen size (60px), rounded as iOS shows them, so Deep Light's can be judged as a
// sibling of the others.   npx tsx tools/deep-light/icons.ts <out.png>
import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const [out = 'icons.png', only] = process.argv.slice(2);
const root = resolve(import.meta.dirname, '../../src');
const games = readdirSync(root).filter(d => existsSync(`${root}/${d}/icon.ts`) && d !== 'icon' && (!only || only.split(',').includes(d)));
const svgs: [string, string][] = [];
for (const g of games) { const m = await import(`${root}/${g}/icon.ts`); svgs.push([g, m.iconSvg()]); }
const cell = (s: string, px: number) => `<div style="width:${px}px;height:${px}px;border-radius:${px * 0.225}px;overflow:hidden;box-shadow:0 2px 6px #0006">${s.replace('<svg ', `<svg width="${px}" height="${px}" `)}</div>`;
const html = `<body style="margin:0;padding:16px;background:#6b7a8f;font:700 12px sans-serif;color:#fff;display:grid;grid-template-columns:repeat(5,200px);gap:14px">`
  + svgs.map(([g, s]) => `<div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start${g === 'deep-light' ? ';outline:3px solid #ffd23f;outline-offset:4px' : ''}">${cell(s, 180)}<div style="display:flex;gap:10px;align-items:center">${cell(s, 60)}${cell(s, 40)}<span>${g}</span></div></div>`).join('') + '</body>';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 400 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`saved ${out}`);
