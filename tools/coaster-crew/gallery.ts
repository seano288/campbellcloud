// Design screenshots the tour doesn't reach: each kind's question at each Level (and the first miss's lesson at Level 1), the builder's
// roll-back lesson (with the fix owned and with it to buy), a full track, a small and a big park, and "Watch it run" with each.
//   npm run dev:coaster-crew   (in another shell)
//   npx tsx tools/coaster-crew/gallery.ts <url> <outDir>      TOUR_VIEW=portrait|landscape|phone|side
import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright';

const [url = 'http://localhost:5157/', out = '/tmp/coaster-crew-gallery'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['push', 'hill', 'heavy', 'rough', 'bump', 'magnet'];
const only = process.env.ONLY ?? '';
const learning = (mode: string | null, level: number) => ({
  modes: Object.fromEntries(MODES.map(m => [m, { level: m === mode || !mode ? level : 1, window: [], opened: m === mode || !mode, starred: false, introPending: false, fresh: false }])),
  pushed: Object.fromEntries(MODES.map(m => [m, 40])),
  tuneUp: { push: { asked: 3, clean: 3, misses: 0 }, hill: { asked: 3, clean: 3, misses: 0 } },
});
const PARK = ['rk:ferris', 'sd:icecream', 'rk:carousel', 'sd:tree', 'rk:bumper', 'sd:popcorn', 'rk:flume', 'sd:fountain', 'rk:tower', 'sd:palm', 'rk:swings', 'sd:flowers', 'rk:teacups', 'sd:bench', 'rk:pirate', 'sd:lamp', 'rk:haunted', 'sd:pond', 'rk:octopus', 'sd:statue', 'rk:rocket', 'sd:flags', 'rk:karts', 'sd:clock'];
const save = (yard: object, balance = 40, mode: string | null = null, level = 2) => ({ version: 1, balance, learning: learning(mode, level), yard });
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];

async function open(s: object): Promise<Page> {
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  await page.addInitScript(sv => { localStorage.removeItem('coaster-crew-place'); localStorage.setItem('coaster-crew-save', JSON.stringify(sv)); }, s);
  await page.goto(url); await page.waitForLoadState('networkidle');
  await page.getByLabel('Start').click({ timeout: 30000 }); await page.waitForTimeout(600);
  return page;
}
const shot = (page: Page, name: string) => page.screenshot({ path: `${out}/${viewName}-g-${name}.png` });
const tap = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
async function ready(page: Page, ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.cc[data-ready="yes"]').count()) return true; await page.waitForTimeout(150); }
  return false;
}
type Q = { q: { choices: string[]; answer: string } } | null;

// every kind at every Level
if (!only || only === 'kinds') for (const mode of MODES) for (const level of [1, 2, 3]) {
  const page = await open(save({}, 40, mode, level));
  await tap(page, 'Play');
  if (!(await ready(page))) problems.push(`${mode} L${level} never ready`);
  await shot(page, `q-${mode}-L${level}`);
  if (level === 1) {
    const p = await page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
    if (p) {
      const wrong = p.q.choices.findIndex(c => c !== p.q.answer);
      await page.locator('.cc-choices button').nth(wrong).click();
      await page.waitForTimeout(3500);
      await shot(page, `q-${mode}-L1-lesson`);
    }
  }
  await page.close();
}

// the builder
if (!only || only === 'yard') {
  const rb = { owned: ['pc:camel3'], coasters: [{ pieces: ['pc:lift3', 'pc:drop2', 'pc:camel3'], best: 0 }], rides: 1 };
  let page = await open(save(rb, 80));
  await tap(page, 'Coaster Yard'); await page.waitForTimeout(2500); await shot(page, 'rollback-afford');
  await page.close();
  page = await open(save(rb, 3));
  await tap(page, 'Coaster Yard'); await page.waitForTimeout(2500); await shot(page, 'rollback-to-buy');
  await page.close();
  const full = { owned: ['pc:lift7', 'pc:drop5', 'pc:loop', 'pc:camel3'], coasters: [{ pieces: ['pc:lift7', 'pc:drop5', 'pc:loop', 'pc:straight', 'pc:straight', 'pc:straight'], best: 0 }], rides: 3 };
  page = await open(save(full, 12));
  await tap(page, 'Coaster Yard'); await page.waitForTimeout(1500); await shot(page, 'build-full');
  await page.close();
  // small park (fresh), then a big one: twelve plots
  for (const [name, yard] of [['small', { owned: ['rk:ferris', 'sd:icecream'], spots: ['rk:ferris', 'sd:icecream'], coasters: [{ pieces: ['pc:lift3', 'pc:drop2', 'pc:straight'], best: 0 }] }],
    ['big', { owned: [...PARK, 'pc:lift7', 'pc:drop5', 'pc:loop', 'pc:camel3', 'ht:cap', 'sd:lights'], more: { track: 6, car: 2, plot: 10, coaster: 2 }, spots: Array.from({ length: 72 }, (_, i) => (i % 3 === 2 ? '' : PARK[i % PARK.length]!)).map((x, i, a) => (a.indexOf(x) === i ? x : '')), coasters: [{ pieces: ['pc:lift7', 'pc:drop5', 'pc:loop', 'pc:camel3', 'pc:drop2', 'pc:straight', 'pc:straight'], best: 88 }, { pieces: [], best: 0 }, { pieces: [], best: 0 }], rides: 2, riders: 230, guest: 9 }]] as const) {
    page = await open(save(yard, 25));
    await tap(page, 'Coaster Yard'); await page.waitForTimeout(1200);
    await page.getByRole('tab', { name: 'Park', exact: true }).click(); await page.waitForTimeout(800);
    await shot(page, `park-${name}`);
    const map = (await page.locator('.cc-park-map').boundingBox())!;
    await page.mouse.click(map.x + map.width * .2, map.y + Math.min(map.height * .3, 160)); await page.waitForTimeout(600);
    await shot(page, `park-${name}-spot`);
    await page.getByRole('tab', { name: 'Build', exact: true }).click(); await page.waitForTimeout(600);
    await shot(page, `build-${name}`);
    await tap(page, 'Watch it run'); await page.waitForTimeout(3000);
    await shot(page, `watch-${name}`);
    await page.close();
  }
  // the Goal: he can afford the cheapest thing already
  page = await open(save({}, 30));
  await tap(page, 'Coaster Yard'); await page.waitForTimeout(800);
  await page.getByRole('tab', { name: 'Train', exact: true }).click(); await page.waitForTimeout(600);
  await shot(page, 'goal-rich');
  await page.close();
}
await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'no problems');
