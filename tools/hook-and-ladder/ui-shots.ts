// Screenshots of the reward screens on a save like his after the first sixteen Calls (every one answered, two with stars, some
// Mystery Levels done, some Bolts): the Station's Aircraft, Gadgets and Engine tabs, the Town scrolled to its Mystery lot, and a Call
// in the Water Bomber to its thank-you. npx tsx tools/hook-and-ladder/ui-shots.ts <url> <outDir>
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { SCENES } from '../../src/hook-and-ladder/call/scenes';

const [url = 'http://localhost:5187/', out = 'ui-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 } } as const;
const answered = SCENES.slice(0, 16).map(s => s.id);
const save = {
  version: 1, balance: 140,
  learning: { modes: Object.fromEntries(['join', 'opposite', 'sort', 'ending', 'strong'].map(m => [m, { level: 3, window: [], opened: true, starred: true, introPending: false, fresh: false }])), pushed: {} },
  station: {
    owned: ['truck:pumper', 'truck:ladder', 'truck:tanker', 'air:heli', 'air:scooper', 'gadget:bell', 'gadget:drone', 'gadget:flag', 'engine:r0', 'engine:r1', 'engine:r2', 'pump:r0', 'hose:r0', 'ladder:r0', 'tank:r0', 'nozzle:straight', 'siren:wail', 'lights:red', 'paint:red', 'buddy:dalmatian', 'lights:fireworks'],
    fitted: { truck: 'scooper', engine: 'r2', pump: 'r0', hose: 'r0', ladder: 'r0', tank: 'r0', nozzle: 'straight', siren: 'wail', lights: 'fireworks', paint: 'red', buddy: 'dalmatian' },
    gadgets: ['flag', 'drone'], goal: null, calls: 3, answered, stars: { bin: 3, house: 1 }, mystery: 5, trips: 30, next: { id: 'school', heat: 1 },
  },
};
const browser = await chromium.launch();
for (const [name, viewport] of Object.entries(VIEWS)) {
  const ctx = await browser.newContext({ viewport, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(s => { localStorage.removeItem('hook-and-ladder-place'); localStorage.setItem('hook-and-ladder-save', JSON.stringify(s)); }, save);
  await page.goto(url); await page.waitForTimeout(700);
  await page.getByLabel('Start').tap(); await page.waitForTimeout(900);
  await page.getByRole('button', { name: 'Station', exact: true }).first().tap(); await page.waitForTimeout(900);
  for (const tab of ['Aircraft', 'Gadgets', 'Engine', 'Trucks']) {
    await page.getByRole('tab', { name: tab, exact: true }).tap(); await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${name}-station-${tab}.png` });
  }
  await page.getByRole('button', { name: 'Monster Fire Truck' }).tap(); await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}-station-trying.png` });
  await page.getByRole('button', { name: 'Town', exact: true }).first().tap(); await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${name}-town.png` });
  await page.locator('.mystery-lot').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${name}-town-end.png` });
  if (name === 'portrait') {
    await page.locator('.town-go .call-btn').tap(); await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${name}-drive.png` });
    await page.waitForTimeout(3500);
    // hold a finger on each fire until it's out, as a child would
    for (let i = 0; i < 60; i++) {
      const c = await page.evaluate(() => (window as any).__call());
      if (!c || c.phase === 'done') break;
      const f = c.fires.find((f: any) => !f.out);
      const r = c.rescues.find((r: any) => r.state === 'waiting');
      if (r) { await page.touchscreen.tap(r.x, r.y); await page.waitForTimeout(200); }
      if (f) { await page.mouse.move(f.x, f.y); await page.mouse.down(); await page.waitForTimeout(700); if (i === 2) await page.screenshot({ path: `${out}/${name}-call.png` }); await page.mouse.up(); }
      else await page.waitForTimeout(500);
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${name}-done.png` });
  }
  await ctx.close();
}
await browser.close();
