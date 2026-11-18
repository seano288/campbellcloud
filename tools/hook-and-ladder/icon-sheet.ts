// Renders every Learning Games icon side by side at landing-tile size (about 170px), Home Screen size (60px) and big, so a new icon can be
// judged as a sibling. npx tsx tools/hook-and-ladder/icon-sheet.ts <out.png>
import { chromium } from 'playwright';
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
import { iconSvg as ladder } from '../../src/hook-and-ladder/icon';

const [out = 'icons.png'] = process.argv.slice(2);
// the Learning Games shelf, in its order (tools/site-build.ts); importing that file would run the whole site build
const games = Object.entries({ 'Monster Truck Money': truck, 'Time Flies': flies, 'Chop Chop': chop, 'Sight Squad': squad, 'Math Bots': math, 'Rover Code': rover,
  'Treasure Fleet': fleet, 'Wild Rescue': rescue, 'Sentence Express': express, 'Word Wreckers': wreckers, 'Hook and Ladder': ladder }).map(([name, icon]) => ({ name, icon }));
const cell = (svg: string, px: number) => `<div style="width:${px}px;height:${px}px;border-radius:22%;overflow:hidden;flex:none">${svg}</div>`;
const html = `<body style="margin:0;padding:20px;background:#f4f1ea;font:14px system-ui">
<div style="display:flex;flex-wrap:wrap;gap:18px">${games.map(g => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:180px">${cell(g.icon(1), 170)}<b>${g.name}</b></div>`).join('')}</div>
<div style="display:flex;gap:14px;margin-top:24px;padding:16px;background:#222;border-radius:16px">${games.map(g => cell(g.icon(0.8), 60)).join('')}</div>
<div style="display:flex;gap:14px;margin-top:16px;padding:16px;background:#cfd8e3;border-radius:16px">${games.map(g => cell(g.icon(0.8), 40)).join('')}</div>
</body>`.replace(/<svg /g, '<svg width="100%" height="100%" ');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
await p.setContent(html);
await p.screenshot({ path: out, fullPage: true });
await b.close();
