// A sheet of this game's icon beside its siblings', at tile size and Home Screen sizes, plus the Token at small sizes: for the design pass.
//   npx tsx tools/coaster-crew/icons-sheet.ts <out.png>
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { iconSvg as coaster } from '../../src/coaster-crew/icon';
import { iconSvg as globe } from '../../src/globe-hopper/icon';
import { iconSvg as moon } from '../../src/moon-base-mail/icon';
import { iconSvg as express } from '../../src/sentence-express/icon';
import { iconSvg as tally } from '../../src/turbo-tally/icon';
import { iconSvg as rover } from '../../src/rover-code/icon';

const out = process.argv[2] ?? '/tmp/icons.png';
// the Token's art, read straight from src/ui/currency.tsx (its JSX is plain SVG markup)
const tokenArt = readFileSync(new URL('../../src/ui/currency.tsx', import.meta.url), 'utf8').split('token: () => (')[1]!.split('\n  ),')[0]!.replace(/<\/?>/g, '');
const token = (s: number) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40" style="flex:none">${tokenArt}</svg>`;
const icons = { 'Coaster Crew': coaster(), 'Globe Hopper': globe(), 'Moon Base Mail': moon(), 'Sentence Express': express(), 'Turbo Tally': tally(), 'Rover Code': rover() };
const cell = (svg: string, s: number) => `<div style="width:${s}px;height:${s}px;border-radius:${s * .22}px;overflow:hidden;box-shadow:0 2px 6px #0006">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>`;
const html = `<body style="margin:0;padding:20px;background:#f2eee6;font:700 14px system-ui">
<div style="display:flex;gap:18px;flex-wrap:wrap">${Object.entries(icons).map(([n, s]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">${cell(s, 180)}${n}</div>`).join('')}</div>
<div style="display:flex;gap:18px;margin-top:20px;align-items:end">${Object.values(icons).map(s => cell(s, 60)).join('')}<span style="width:30px"></span>${Object.values(icons).map(s => cell(s, 40)).join('')}</div>
<div style="display:flex;gap:18px;margin-top:20px;align-items:end;background:#1d6f7a;padding:12px">${[80, 40, 34, 24, 18, 16].map(s => token(s)).join('')}</div>
<div style="display:flex;gap:18px;margin-top:8px;align-items:end;background:#000;padding:12px">${[80, 40, 34, 24, 18, 16].map(s => token(s)).join('')}</div>
</body>`;
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1240, height: 560 }, deviceScaleFactor: 2 });
await p.setContent(html); await p.screenshot({ path: out, fullPage: true }); await b.close();
