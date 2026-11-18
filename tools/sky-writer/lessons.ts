// Screenshots of the miss lessons the tour may not reach by chance: the b/d (or p/q) side-by-side lesson, in Trace It and in Which Way,
// and the second-miss walk-through (the start dot held lit, one stroke at a time). The save has met the first four Families (up to the bumps) and nothing else, so
// b, d, p and q come up often. Writing is done with real touch events, as in tour.ts.
//   npm run dev:sky-writer   (in another shell)
//   TOUR_VIEW=portrait|landscape|phone|side npx tsx tools/sky-writer/lessons.ts <url> <outDir>
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [url = 'http://localhost:5183/', out = 'lesson-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const mode = (level: number, opened: boolean) => ({ level, window: [], opened, starred: false, introPending: false, fresh: false });
const save = {
  version: 1, balance: 10,
  learning: {
    modes: { trace: mode(1, true), start: mode(1, false), flip: mode(1, true), size: mode(1, false), write: mode(1, false), word: mode(1, false) },
    pushed: { trace: 0, start: 0, flip: 0, size: 0, write: 0, word: 0 },
    families: ['lines', 'c', 'tall', 'bumps'], sinceMeet: 0, strength: { lines: 3, c: 3, tall: 3, bumps: 3 },
  },
};
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('sky-writer-place');
  localStorage.setItem('sky-writer-save', JSON.stringify(s));
}, save);
const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
async function stroke(pts: number[][]) {
  await touch('touchStart', pts[0]![0]!, pts[0]![1]!);
  for (let i = 1; i < pts.length; i += 2) { await touch('touchMove', pts[i]![0]!, pts[i]![1]!); await page.waitForTimeout(4); }
  await touch('touchEnd');
  await page.waitForTimeout(120);
}
type Q = { mode: string; q: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
const pad = () => page.evaluate(() => (window as unknown as { __pad?(): unknown }).__pad?.() as { pts: number[][]; ch: string } | null);
async function ready() { for (let i = 0; i < 400; i++) { if (await page.locator('.game.sw[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return; await page.waitForTimeout(150); } }
const shot = (name: string) => page.screenshot({ path: `${out}/${viewName}-${name}.png` });

await page.goto(url);
await page.waitForTimeout(600);
await page.getByLabel('Start').click();
await page.waitForTimeout(800);
await page.getByRole('button', { name: 'Play', exact: true }).click();
const got = new Set<string>();
for (let guard = 0; guard < 40 && got.size < 3; guard++) {
  if (await page.locator('.reward h2').isVisible()) {
    await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 });
    await page.getByRole('button', { name: 'Play again', exact: true }).click();
    await page.waitForTimeout(800);
    continue;
  }
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready();
  const q = p.q, bdpq = /^[bdpq]$/.test(q.ch ?? '');
  if (p.mode === 'meet') { await page.getByRole('button', { name: 'Go', exact: true }).click(); }
  else if (q.kind === 'trace' && bdpq && !(got.has('pair-trace') && got.has('walk'))) {
    // the wrong way, twice: the b/d lesson, then the walk-through
    let pd = await pad();
    await stroke([...pd!.pts].reverse());
    await page.waitForSelector('.sw-pair-one.on', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
    if (await page.locator('.sw-pair').count()) { await shot(`pair-trace-${q.ch}`); got.add('pair-trace'); }
    await page.waitForTimeout(5000);
    await shot(`lesson-plane-${q.ch}`);
    await ready();
    pd = await pad();
    await stroke([...pd!.pts].reverse());
    await page.waitForTimeout(4500);
    await shot(`walk-${q.ch}`); got.add('walk');
    await ready();
  } else if (q.kind === 'flip' && q.step === 'two' && !got.has('pair-flip') && bdpq) {
    await page.locator(`.game.sw [data-key="${(q.choices as string[]).find(k => k !== q.answer)}"]`).first().click();
    await page.waitForSelector('.sw-pair-one.on', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
    if (await page.locator('.sw-pair').count()) { await shot(`pair-flip-${q.ch}`); got.add('pair-flip'); }
    await page.waitForTimeout(3500);
    await shot(`flip-taught-${q.ch}`);
    await ready();
  }
  // then answer it right
  const now = await question();
  if (now && JSON.stringify(now) === JSON.stringify(p) && p.mode !== 'meet') {
    if (q.kind === 'trace' || q.kind === 'write' || q.kind === 'word') {
      for (let i = 0; i < 40; i++) { const pd = await pad(), n2 = await question(); if (!pd || JSON.stringify(n2) !== JSON.stringify(p)) break; if (!pd.pts.length) { await page.waitForTimeout(200); continue; } await stroke(pd.pts); await page.waitForTimeout(150); }
    } else await page.locator(`.game.sw [data-key="${q.answer}"]`).first().click().catch(() => {});
  }
  for (let i = 0; i < 100; i++) { const n2 = await question(); if (JSON.stringify(n2) !== JSON.stringify(p) || await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
}
console.log(`lessons (${viewName}): ${[...got].join(', ') || 'none'}`);
await browser.close();
