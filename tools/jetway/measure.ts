// Prints the boxes of a question's parts at a size, to fix layouts: npx tsx tools/jetway/measure.ts 390x844
import { chromium } from 'playwright';
const [w, h] = (process.argv[2] ?? '390x844').split('x').map(Number);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: w!, height: h! } });
await p.addInitScript(() => { localStorage.removeItem('jetway-save'); localStorage.removeItem('jetway-place'); });
await p.goto('http://localhost:5177/'); await p.waitForTimeout(1500);
console.log(await p.evaluate(() => ['.start', '.start h1', '.start-art', '.start-btn'].map(s => { const r = document.querySelector(s)?.getBoundingClientRect(); return `${s}: ${r ? `${Math.round(r.top)}-${Math.round(r.bottom)} h${Math.round(r.height)}` : '-'}`; }).join('\n')));
await p.getByLabel('Start').click(); await p.waitForTimeout(800);
await p.getByRole('button', { name: 'Play', exact: true }).click(); await p.waitForTimeout(9000);
console.log(await p.evaluate(() => { const g = document.querySelector('.game.jw')!; return `scroll ${g.scrollHeight} client ${g.clientHeight} ready ${g.getAttribute('data-ready')}`; }));
console.log(await p.evaluate(() => ['.round-screen', '.card', '.game.jw', '.ask', '.jw-body', '.jw-stage', '.jw-controls', '.jw-wheels', '.numwheels'].map(s => { const r = document.querySelector(s)?.getBoundingClientRect(); return `${s}: ${r ? `${Math.round(r.top)}-${Math.round(r.bottom)} h${Math.round(r.height)}` : '-'}`; }).join('\n')));
await b.close();
