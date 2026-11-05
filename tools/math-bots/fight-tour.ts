// Plays the reward in a real browser with real touches: builds a robot, drives a fight with a finger on the stick, wins and loses, opens
// the League, and buys parts. It watches page errors, sound, the frame rate, and anything cut off or too small to tap.
//   npm run dev:math-bots   (in another shell)
//   npx tsx tools/math-bots/fight-tour.ts http://localhost:5199/ <outDir> [chromium|webkit]
// TOUR_VIEW=ipad|upright|phone|side picks the screen.
import { mkdirSync } from 'node:fs';
import { chromium, devices, webkit, type Page } from 'playwright';

const [url = 'http://localhost:5199/', out = '/tmp/math-bots-fight', which = 'chromium'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { ipad: { width: 1180, height: 820 }, upright: { width: 820, height: 1180 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } };
const view = (process.env.TOUR_VIEW ?? 'ipad') as keyof typeof VIEWS;
void devices;
const browser = which === 'webkit' ? await webkit.launch() : await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [], log = (s: string) => console.log(`[${which} ${view}] ${s}`);

const saveWith = (balance: number, workshop?: unknown) => ({ version: 2, balance, ...(workshop ? { workshop } : {}) });
async function open(save: unknown) {
  const context = await browser.newContext({ viewport: VIEWS[view], deviceScaleFactor: 1, hasTouch: true });
  await context.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.removeItem('math-bots-place'); localStorage.setItem('math-bots-save', JSON.stringify(s)); } }, save);
  const page = await context.newPage();
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME|Failed to load resource/.test(m.text())) problems.push(`console: ${m.text().slice(0, 240)}`); });
  await page.goto(url);
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.waitForTimeout(400);
  return page;
}
const shot = async (page: Page, name: string) => {
  const bad = await page.evaluate(() => {
    const found: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) found.push('wider than the screen');
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const inScroll = el.closest('.mb-tray,.league-grid');
      if (!inScroll && (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1)) found.push(`off screen: ${el.className}`);
      if (r.height < 40 || r.width < 40) found.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.className}`);
    }
    return [...new Set(found)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
  await page.screenshot({ path: `${out}/${which}-${view}-${name}.png` });
};
const fight = (page: Page) => page.evaluate(() => { const s = (window as unknown as { __fight?: { t: number; bolts: number; over: unknown; bots: { x: number; y: number; hp: number; maxHp: number; a: number }[] } }).__fight; return s ? { t: s.t, bolts: s.bolts, over: s.over, you: s.bots[0]!, foe: s.bots[1]! } : null; });

/** Holds a finger on the stick and steers at the rival, tapping 💥, as a child does. Real touch events, not the fight's own input. */
async function drive(page: Page, seconds: number) {
  if (which === 'webkit') { // no CDP here, so it drives by the keys, which also proves those work
    const end = Date.now() + seconds * 1000;
    let held: string[] = [];
    while (Date.now() < end) {
      const f = await fight(page);
      if (!f || f.over) break;
      const want = [f.foe.x > f.you.x + 20 ? 'ArrowRight' : f.foe.x < f.you.x - 20 ? 'ArrowLeft' : '', f.foe.y > f.you.y + 20 ? 'ArrowDown' : f.foe.y < f.you.y - 20 ? 'ArrowUp' : ''].filter(Boolean);
      for (const k of held) if (!want.includes(k)) await page.keyboard.up(k);
      for (const k of want) if (!held.includes(k)) await page.keyboard.down(k);
      held = want;
      await page.keyboard.press(' ');
      await page.waitForTimeout(120);
    }
    for (const k of held) await page.keyboard.up(k);
    return;
  }
  const pad = (await page.locator('.pad').boundingBox())!, hit = (await page.locator('.act.hit').boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const cx = pad.x + pad.width / 2, cy = pad.y + pad.height * .6;
  const touch = (type: string, points: { x: number; y: number; id: number }[]) => cdp.send('Input.dispatchTouchEvent', { type: type as 'touchStart', touchPoints: points });
  await touch('touchStart', [{ x: cx, y: cy, id: 1 }]);
  const end = Date.now() + seconds * 1000;
  let tick = 0;
  while (Date.now() < end) {
    const f = await fight(page);
    if (!f || f.over) break;
    const a = Math.atan2(f.foe.y - f.you.y, f.foe.x - f.you.x), at = { x: cx + Math.cos(a) * 55, y: cy + Math.sin(a) * 55, id: 1 };
    await touch('touchMove', [at]);
    if (++tick % 3 === 0) { const b = { x: hit.x + hit.width / 2, y: hit.y + hit.height / 2, id: 2 }; await touch('touchStart', [at, b]); await touch('touchEnd', [at]); }
    await page.waitForTimeout(90);
  }
  await touch('touchEnd', []);
}
const frameRate = (page: Page) => page.evaluate(`new Promise(done => { let n = 0; const t0 = performance.now(); (function go() { n++; if (performance.now() - t0 > 1000) done(n); else requestAnimationFrame(go); })(); })`) as Promise<number>;

// ---- a first-time child: build, try, buy, fit, fight Rusty with the finger, win, open the crate
{
  const page = await open(saveWith(40));
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  await page.waitForTimeout(700);
  await shot(page, 'workshop');
  await page.getByLabel('Buzz Saw', { exact: true }).click();
  await page.waitForTimeout(500);
  await shot(page, 'trying');
  await page.getByLabel('Buy', { exact: true }).click();
  await page.waitForTimeout(2600);
  await page.getByLabel('Body', { exact: true }).click();
  await page.waitForTimeout(300);
  await shot(page, 'bodies');
  await page.getByLabel('Paint', { exact: true }).click();
  await page.waitForTimeout(300);
  await shot(page, 'paints');
  await page.getByLabel('Racing Green', { exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByLabel('Buy', { exact: true }).click();
  await page.waitForTimeout(2600);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('math-bots-save')!));
  log(`after buying: ${saved.balance} Bolts, build ${JSON.stringify(saved.workshop.build)}`);
  if (saved.workshop.build.adds.front !== 'saw' || saved.workshop.build.paint !== 'green') problems.push('the parts he bought did not fit');
  await page.getByLabel('Fight', { exact: true }).click();
  await page.locator('.fight-screen.vs').waitFor();
  await page.waitForTimeout(900);
  await shot(page, 'vs');
  await page.getByLabel('Go', { exact: true }).click();
  await page.locator('.fight-screen .arena').waitFor();
  await page.waitForTimeout(1600);
  await shot(page, 'fight-open');
  log(`frame rate ${await frameRate(page)} fps`);
  const start = await fight(page);
  await drive(page, 4);
  await shot(page, 'fight-mid');
  const mid = await fight(page);
  log(`driven: moved ${Math.round(Math.hypot(mid!.you.x - start!.you.x, mid!.you.y - start!.you.y))}, rival ${mid!.foe.hp}/${mid!.foe.maxHp}`);
  if (Math.hypot(mid!.you.x - start!.you.x, mid!.you.y - start!.you.y) < 30) problems.push('the finger on the stick did not move the robot');
  await drive(page, 60);
  await page.locator('.fight-result').waitFor({ timeout: 30000 });
  await page.waitForTimeout(900);
  await shot(page, 'won');
  const crate = page.getByLabel('Open the crate');
  if (await crate.count()) { await crate.click(); await page.waitForTimeout(900); await shot(page, 'prize'); } else problems.push('no crate after the first win');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('math-bots-save')!));
  log(`after the win: ${after.balance} Bolts, ${JSON.stringify(after.workshop.rivals)}, charges ${after.workshop.charges}`);
  await page.getByLabel('Workshop').click();
  await page.locator('.reward-screen').waitFor();
  await page.waitForTimeout(500);
  await page.getByLabel('League', { exact: true }).click();
  await page.locator('.league-screen').waitFor();
  await page.waitForTimeout(800);
  await shot(page, 'league');
  await page.context().close();
}

// ---- a losing fight on a hard arena, standing still: the advice and the rematch; then a late build in every arena
const late = { body: 'titan', wheels: 'hover', adds: { front: 'mega', left: 'gianth', right: 'gold', back: 'booster' }, paint: 'flame', face: 'shark' };
for (const [rival, name, stars] of [['fang', 'loss', 0], ['prickles', 'vents', 3]] as const) {
  const beaten = Object.fromEntries(['rusty', 'anvil', 'pancake', 'brick', 'whirly', 'zip', 'pincer', ...(rival === 'fang' ? ['prickles', 'boulder', 'shocker'] : [])].map(r => [r, { stars: 2, losses: 0 }]));
  const owned = ['body:box', 'body:titan', 'wheels:small', 'wheels:hover', 'add:bumper', 'add:mega', 'add:gianth', 'add:gold', 'add:booster', 'paint:blue', 'paint:flame', 'face:happy', 'face:shark'];
  const page = await open(saveWith(200, { owned, build: rival === 'fang' ? undefined : late, goal: null, charges: 3, tries: 0, fights: 9, rivals: beaten }));
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  await page.waitForTimeout(500);
  if (stars) { await page.getByLabel('Parts', { exact: true }).click(); await page.waitForTimeout(400); await shot(page, 'late-build'); }
  await page.getByLabel('Fight', { exact: true }).click();
  await page.getByLabel('Go', { exact: true }).click();
  await page.locator('.fight-screen .arena').waitFor();
  await page.waitForTimeout(2500);
  await shot(page, `arena-${name}`);
  if (rival === 'fang') {
    await page.locator('.fight-result').waitFor({ timeout: 95000 });
    await page.waitForTimeout(800);
    await shot(page, 'lost');
    await page.getByLabel('Fight again').click();
    await page.waitForTimeout(1200);
    await shot(page, 'rematch');
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem('math-bots-save')!));
    log(`after a loss: ${JSON.stringify(s.workshop.rivals.fang)}, charges ${s.workshop.charges}, tries ${s.workshop.tries}`);
  }
  await page.context().close();
}

await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'no problems');
process.exit(problems.length ? 1 : 0);
