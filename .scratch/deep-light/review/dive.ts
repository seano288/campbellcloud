// The Dive as a child plays it: doing nothing at all; mashing (many fingers, fast taps, drags off the edges, the HUD buttons); leaving
// halfway; reloading halfway; and the parts (headlights, sonar) compared on screen.
import { mkdirSync } from 'node:fs';
import { chromium, type CDPSession } from 'playwright';
const [url = 'http://localhost:5186/', out = '/tmp/dive', viewName = 'landscape'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const VIEW = VIEWS[viewName as keyof typeof VIEWS];
const problems: string[] = [];
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: VIEW, hasTouch: true });
const page = await context.newPage();
const cdp: CDPSession = await context.newCDPSession(page);
page.on('pageerror', e => problems.push(`pageerror ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !/MIME|favicon/.test(m.text())) problems.push(`console ${m.text()}`); });
page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`); });
function save(fitted: Record<string, string>, owned: string[], zone: string | null, dives = 3, photos: string[] = []) {
  return { version: 1, balance: 0, learning: {}, dock: { owned, fitted, goal: null, dives, photos, zone, done: 0 } };
}
const ALL_RUNGS = ['hull', 'lights', 'sonar', 'motor', 'claw', 'flash'].flatMap(t => Array.from({ length: t === 'hull' ? 7 : t === 'flash' ? 5 : 6 }, (_, i) => `${t}:r${i}`));
async function load(s: unknown) {
  await page.goto(url);
  await page.evaluate(sv => { if (sv) localStorage.setItem('deep-light-save', JSON.stringify(sv)); else localStorage.removeItem('deep-light-save'); localStorage.setItem('deep-light-place', JSON.stringify({ screen: 'dock' })); }, s);
  await page.reload(); await page.waitForTimeout(500);
  await page.getByLabel('Start').tap(); await page.waitForTimeout(800);
}
const dive = () => page.evaluate(() => (window as any).__dive?.() ?? null);
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('deep-light-save') ?? '{}'));
async function startDive() { await page.locator('.bay-go .dive-btn').tap(); await page.waitForTimeout(1200); }
async function waitDone(maxS = 110) { for (let i = 0; i < maxS * 4; i++) { const d = await dive(); if (d?.phase === 'done') return d; await page.waitForTimeout(250); } problems.push('dive never finished'); return dive(); }
async function touch(type: string, pts: { x: number; y: number; id: number }[]) { await cdp.send('Input.dispatchTouchEvent', { type: type as 'touchStart', touchPoints: pts.map(p => ({ x: Math.round(p.x), y: Math.round(p.y), id: p.id, radiusX: 6, radiusY: 6, force: 1 })) }).catch(() => {}); }
function checkFits(tag: string) {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('.dive-screen button')) {
      const r = el.getBoundingClientRect(); if (!r.width || el.closest('.asleep')) continue;
      const l = el.getAttribute('aria-label');
      if (r.width < 43.5 || r.height < 43.5) out.push(`small ${l}`);
      if (r.bottom > innerHeight - 56 + 1) out.push(`in the bottom band: ${l} (${Math.round(innerHeight - r.bottom)}px up)`);
      if (r.left < 16 || r.right > innerWidth - 16) out.push(`at the side: ${l}`);
    }
    return out;
  }).then(o => { if (o.length) problems.push(`${tag}: ${o.join('; ')}`); });
}
const base = { hull: 'r0', lights: 'r0', sonar: 'r0', motor: 'r0', claw: 'r0', flash: 'r0', paint: 'yellow', stripes: 'none', beam: 'warm', horn: 'toot', buddy: 'fish', trail: 'bubbles' };

// 1. a new save: the free Dive, doing nothing at all
await load(null);
await page.screenshot({ path: `${out}/${viewName}-01-dock-new.png` });
const before = (await saved()).dock?.dives ?? 1;
await startDive();
await checkFits('dive hud');
await page.waitForTimeout(8000);
await page.screenshot({ path: `${out}/${viewName}-02-nothing.png` });
let d = await waitDone();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/${viewName}-03-nothing-done.png` });
await page.waitForSelector('.dive-done .btns:not(.asleep)', { timeout: 15000 }).catch(() => problems.push('done buttons never woke'));
await checkFits('dive done');
const after = (await saved()).dock;
console.log(`nothing: t=${d?.t.toFixed(1)} photos=${d?.photos.length} treasure=${d?.treasure}; dives ${before} -> ${after?.dives}; done=${after?.done}`);
if (after?.dives !== before - 1) problems.push('the free Dive was not used up');

// 2. mashing: many fingers, fast taps, drags off the edges, the HUD buttons over and over
await load(save(base, [], null, 3));
await startDive();
const t0 = Date.now();
let k = 0;
while (Date.now() - t0 < 25000) {
  const n = 1 + (k % 4), pts = Array.from({ length: n }, (_, i) => ({ x: Math.random() * VIEW.width, y: Math.random() * VIEW.height, id: i + 1 }));
  await touch('touchStart', pts);
  await touch('touchMove', pts.map(p => ({ ...p, x: p.x + (Math.random() - 0.5) * VIEW.width * 1.6, y: p.y + (Math.random() - 0.5) * VIEW.height * 1.6 })));
  await touch('touchEnd', []).catch(() => {});
  if (k % 5 === 0) { for (const l of ['Sonar', 'Horn']) await page.getByRole('button', { name: l }).tap({ timeout: 1000 }).catch(() => {}); }
  k++;
  await page.waitForTimeout(40);
}
await touch('touchEnd', []).catch(() => {});
await page.screenshot({ path: `${out}/${viewName}-04-mashed.png` });
d = await dive();
console.log(`mashed: ${k} bursts, phase ${d?.phase} t=${d?.t.toFixed(1)} sub at ${Math.round(d?.sub.x)},${Math.round(d?.sub.y)}`);
d = await waitDone();
console.log(`mashed dive ended: photos ${d?.photos.length}, treasure ${d?.treasure}`);

// 3. leaving halfway with 🏠 twice: the Dive is still his
const dives3 = (await saved()).dock.dives;
await page.waitForSelector('.dive-done .btns:not(.asleep)', { timeout: 15000 });
await page.getByRole('button', { name: 'Dive again' }).tap();
await page.waitForTimeout(4000);
await page.getByRole('button', { name: 'Leave' }).tap(); await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Tap again to leave' }).tap(); await page.waitForTimeout(1000);
console.log(`left halfway: on the ${await page.locator('.dock-screen').count() ? 'Dock' : '??'}; dives ${dives3} -> ${(await saved()).dock.dives}`);
if ((await saved()).dock.dives !== dives3) problems.push('leaving halfway used the Dive');

// 4. reloading halfway
await startDive(); await page.waitForTimeout(5000);
await page.reload(); await page.waitForTimeout(800);
await page.getByLabel('Start').tap(); await page.waitForTimeout(1000);
console.log(`reloaded halfway: on ${await page.locator('.dock-screen').count() ? 'the Dock' : await page.locator('.home-screen').count() ? 'Home' : '??'}; dives ${(await saved()).dock.dives}`);
if ((await saved()).dock.dives !== dives3) problems.push('reloading halfway used the Dive');

// 5. the parts: headlights and sonar, starter vs best, in the Midnight Zone; screenshots side by side
for (const [name, fit] of [['starter', base], ['best', { ...base, hull: 'r6', lights: 'r5', sonar: 'r5', motor: 'r5', claw: 'r5', flash: 'r4' }]] as const) {
  await load(save(fit, ALL_RUNGS, 'midnight', 2));
  await startDive();
  // steer right a little, then hold still and let the sonar ping
  const sub = (await dive()).sub;
  await touch('touchStart', [{ x: sub.x + 200, y: sub.y + 60, id: 1 }]); await page.waitForTimeout(2500); await touch('touchEnd', []);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${viewName}-05-midnight-${name}.png` });
  if (name === 'best') { await page.getByRole('button', { name: 'Camera flash' }).tap(); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/${viewName}-06-flash.png` }); }
  d = await dive();
  console.log(`${name}: photos after 7s ${d?.photos.length}`);
  await page.getByRole('button', { name: 'Leave' }).tap(); await page.waitForTimeout(200); await page.getByRole('button', { name: 'Tap again to leave' }).tap(); await page.waitForTimeout(500);
}
// 6. every zone, a quick look
for (const z of ['reef', 'twilight', 'wreck', 'cave', 'vents', 'ice', 'trench']) {
  await load(save({ ...base, hull: 'r6', lights: 'r3', sonar: 'r2', claw: 'r1' }, ALL_RUNGS, z, 2));
  await startDive(); await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/${viewName}-07-zone-${z}.png` });
}
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
