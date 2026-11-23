// One screenshot of a screen at a size, with a save: npx tsx tools/jetway/shot.ts 844x390 airport out.png [full]
import { chromium } from 'playwright';
import { ITEMS } from '../../src/jetway/airport/catalog';
const [view = '844x390', where = 'airport', out = '/tmp/jetway.png', full] = process.argv.slice(2);
const [width, height] = view.split('x').map(Number);
const save = { version: 1, balance: 60, airport: full ? { owned: ITEMS.map(i => i.id), more: { concourse: 2, gate: 3, hangar: 1, stretch: 1 }, flights: 2, flown: 9, passengers: 4321 } : { flights: 2 } };
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: width!, height: height! } });
await p.addInitScript(([s, w]) => { localStorage.setItem('jetway-save', JSON.stringify(s)); localStorage.setItem('jetway-place', JSON.stringify({ screen: w, round: null })); }, [save, where] as const);
await p.goto('http://localhost:5177/'); await p.waitForTimeout(1200);
await p.getByLabel('Start').click(); await p.waitForTimeout(1500);
await p.screenshot({ path: out });
await b.close();
