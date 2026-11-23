// Screenshots a fully built airport (everything bought, the again-and-again things past what's drawn) on the Airport screen and in
// "Watch it run", to check the plot's layout. npm run dev:jetway, then: npx tsx tools/jetway/looks.ts [WxH] [outDir]
import { chromium } from 'playwright';
import { ITEMS } from '../../src/jetway/airport/catalog';
const [view = '1080x810', out = '/tmp'] = process.argv.slice(2);
const [width, height] = view.split('x').map(Number);
const owned = ITEMS.map(i => i.id);
const save = { version: 1, balance: 300, airport: { owned: [...owned, 'prize:comet', 'prize:charter', 'prize:purple'], more: { concourse: 6, gate: 9, hangar: 5, stretch: 6 }, liveries: {}, flying: 'jumbo', airline: { first: 2, second: 1, mark: 'mark:wings' }, lights: 'prize:purple', flights: 3, flown: 30, routes: { r1: { flown: 2, bestStars: 8, bestLanding: 3 } }, charter: 12, passengers: 23456, trophies: ['first'] } };
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: width!, height: height! } });
await p.addInitScript(s => { localStorage.setItem('jetway-save', JSON.stringify(s)); localStorage.setItem('jetway-place', JSON.stringify({ screen: 'airport', round: null })); }, save);
await p.goto('http://localhost:5177/'); await p.waitForTimeout(1500);
await p.getByLabel('Start').click(); await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/full-airport-${view}.png` });
await p.getByRole('button', { name: 'Watch it run', exact: true }).click(); await p.waitForTimeout(9000);
await p.screenshot({ path: `${out}/full-watch-${view}.png` });
await b.close();
