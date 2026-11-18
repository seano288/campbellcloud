// Renders every game icon side by side at Home Screen size (60px, rounded like iOS) and at landing-tile size, and the built landing page,
// to judge Sky Writer's icon among its siblings:  npx tsx tools/sky-writer/icon-sheet.ts <outDir>   (after npm run build:site)
import { chromium } from 'playwright';
const R = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const out = process.argv[2]!;
const names = ['icon/icon', 'time-flies/icon', 'chop-chop/icon', 'sight-squad/icon', 'math-bots/icon', 'rover-code/icon', 'treasure-fleet/icon', 'wild-rescue/icon', 'sentence-express/icon', 'word-wreckers/icon', 'turbo-tally/icon', 'hook-and-ladder/icon', 'dino-dig/icon', 'sky-writer/icon'];
const svgs: string[] = [];
for (const n of names) { const m = await import(`${R}/src/${n}.ts`); svgs.push(m.iconSvg(1)); }
const cell = (s: string, px: number) => `<div style="width:${px}px;height:${px}px;border-radius:${px * 0.225}px;overflow:hidden;flex:none">${s.replace('<svg ', `<svg width="${px}" height="${px}" `)}</div>`;
const html = `<body style="margin:0;padding:16px;background:#1d1d1f;font:12px sans-serif;color:#fff">
<div style="display:flex;flex-wrap:wrap;gap:20px;width:520px">${svgs.map(s => cell(s, 60)).join('')}</div>
<div style="height:20px"></div>
<div style="display:flex;flex-wrap:wrap;gap:16px;width:1000px">${svgs.map(s => cell(s, 180)).join('')}</div></body>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1040, height: 1100 }, deviceScaleFactor: 2 });
await p.setContent(html);
await p.screenshot({ path: `${out}/icons-home-and-tile.png`, fullPage: true });
const p2 = await b.newPage({ viewport: { width: 1080, height: 900 }, deviceScaleFactor: 1 });
await p2.goto(`file://${R}/dist-site/index.html`);
await p2.waitForTimeout(500);
await p2.screenshot({ path: `${out}/landing.png`, fullPage: true });
await b.close();
