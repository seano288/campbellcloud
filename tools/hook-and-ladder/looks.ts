// Screenshots of the reward screens on a seeded save (no Round played), for judging the look: Start, Home, the Station (with things
// on its shelves), the Town and the Call. npx tsx tools/hook-and-ladder/looks.ts <url> <outDir> [fresh|mid|full]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { SCENES } from '../../src/hook-and-ladder/call/scenes';

const [url = 'http://localhost:5187/', out = 'looks', which = 'mid'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const n = which === 'full' ? 15 : which === 'mid' ? 6 : 0;
const answered = SCENES.slice(0, n).map(s => s.id);
const save = which === 'fresh' ? null : {
  version: 1, balance: 60,
  learning: { modes: Object.fromEntries(['join', 'opposite', 'sort', 'ending', 'strong'].map(m => [m, { level: 2, window: [], opened: true, starred: m === 'join', introPending: false, fresh: false }])), pushed: {} },
  station: {
    owned: ['truck:pumper', 'truck:ladder', 'pump:r0', 'hose:r0', 'ladder:r0', 'tank:r0', 'nozzle:straight', 'siren:wail', 'lights:red', 'paint:red', 'buddy:dalmatian',
      ...(which === 'full' ? ['station:flag', 'station:bell', 'station:helmet', 'station:axe', 'station:radio', 'station:trophy', 'station:fish', 'station:piano', 'station:clock', 'station:plant', 'station:medal', 'station:disco', 'town:tree', 'town:fountain', 'town:wheel'] : ['station:bell', 'station:helmet', 'town:tree'])],
    fitted: { truck: 'ladder', pump: 'r0', hose: 'r0', ladder: 'r0', tank: 'r0', nozzle: 'straight', siren: 'wail', lights: 'red', paint: 'red', buddy: 'dalmatian' },
    goal: null, calls: 2, answered, trips: answered.length, next: null,
  },
};
const browser = await chromium.launch();
for (const [name, viewport] of Object.entries(VIEWS)) {
  const ctx = await browser.newContext({ viewport, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(s => { localStorage.removeItem('hook-and-ladder-place'); if (s) localStorage.setItem('hook-and-ladder-save', JSON.stringify(s)); else localStorage.removeItem('hook-and-ladder-save'); }, save);
  await page.goto(url); await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}-1-start.png` });
  await page.getByLabel('Start').tap(); await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${name}-2-home.png` });
  await page.getByRole('button', { name: 'Station', exact: true }).first().tap(); await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${name}-3-station.png` });
  await page.getByRole('tab', { name: 'Station', exact: true }).tap(); await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-4-station-tab.png` });
  await page.getByRole('button', { name: 'Town', exact: true }).first().tap(); await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${name}-5-town.png` });
  if (save) {
    await page.locator('.town-go .call-btn').tap(); await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${name}-6-drive.png` });
    await page.waitForTimeout(4200);
    await page.screenshot({ path: `${out}/${name}-7-scene.png` });
  }
  await ctx.close();
}
await browser.close();
