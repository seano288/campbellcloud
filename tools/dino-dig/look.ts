// Quick screenshots of Dino Dig's screens at one or more sizes, for design work (the tour, tour.ts, is the full check): Start and Home,
// the first few questions of a Round (one missed on purpose, so a lesson shows), then the Museum, every Shop tab, the Dig's card and the
// run. Seeds the same Level 3 save as the tour, unless LOOK_SAVE=fresh. Screens are reached through the game's own nav module.
//   npm run dev:dino-dig   (in another shell)
//   npx tsx tools/dino-dig/look.ts <url> <outDir> [portrait,landscape,phone,side]
import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright';

const [url = 'http://localhost:5181/', out = 'look-shots', which = 'portrait,landscape,phone,side'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const QUESTIONS = Number(process.env.LOOK_QUESTIONS ?? 3);
const MODES = ['read', 'hear', 'swap', 'real', 'sentence'];
const save = process.env.LOOK_SAVE === 'fresh' ? null : {
  version: 1, balance: 60,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: 3, window: ['clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])),
    patterns: ['cvc', 'digraph', 'blend', 'magic-e', 'team', 'r'], sinceMeet: 0, strength: { cvc: 3, digraph: 3, blend: 3, 'magic-e': 3, team: 3, r: 3 },
  },
  museum: {
    owned: ['tool:trowel', 'tool:shovel', 'tool:pickaxe', 'gadget:finder', 'gadget:blower', 'gadget:dynamite', 'color:gold', 'color:blue', 'marking:tiger', 'marking:spots', 'hat:crown', 'hat:cap', 'roar:mega',
      'gear:springs', 'gear:trail', ...['volcano', 'beach', 'swamp', 'desert', 'snow', 'night', 'candy'].map(l => `land:${l}`), 'deco:disco', 'deco:fountain', 'deco:rocket', 'deco:palm', 'deco:skylight'],
    bones: { compy: 4, raptor: 5, ptero: 4, pachy: 5, stego: 6, para: 4, trike: 2 }, alive: ['compy', 'raptor', 'ptero', 'pachy'], pet: 'ptero',
    looks: { ptero: { color: 'gold', marking: 'tiger', hat: 'crown', roar: 'mega' }, raptor: { color: 'blue', marking: 'spots', hat: 'cap', roar: 'roar' } },
    digs: 2, done: 9, finds: ['ammonite', 'tooth', 'egg', 'amber'], site: 'canyon', land: process.env.LOOK_LAND ?? 'volcano', off: [], goal: null,
  },
};

type Q = { mode: string; level: number; q: Record<string, any> } | null;
const question = (page: Page) => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(page: Page) {
  for (let t = 0; t < 300; t++) { if (await page.locator('.game.dd[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return; await page.waitForTimeout(100); }
}
const sceneKey = (s: Record<string, any>) => [s.size ?? '', s.a, s.rel ?? '', s.b ?? ''].join(':');
async function answer(page: Page, p: NonNullable<Q>, miss: boolean) {
  const q = p.q;
  if (p.mode === 'meet') return page.getByRole('button', { name: 'Go', exact: true }).click();
  if (q.kind === 'read' || q.kind === 'sentence') {
    const keys: string[] = q.kind === 'read' ? q.choices : q.choices.map(sceneKey), right = q.kind === 'read' ? q.word : sceneKey(q.scene);
    return page.locator(`.dd-pic[data-key="${miss ? keys.find(k => k !== right) : right}"]`).click();
  }
  if (q.kind === 'hear' || q.kind === 'real') return page.locator(`.dd-wordbtn[data-key="${miss ? (q.choices as string[]).find(c => c !== q.word) : q.word}"]`).click();
  if (miss) return page.locator(`.dd-box[data-box="${q.box === 0 ? 1 : 0}"]`).click();
  if (!(await page.locator('.dd-tiles').count())) { await page.locator(`.dd-box[data-box="${q.box}"]`).click(); await page.waitForTimeout(400); }
  return page.locator(`.dd-tile[data-tile="${q.answer}"]`).click();
}
const go = (page: Page, s: string) => page.evaluate(async to => { const nav = await import('/src/dino-dig/nav.ts' as string); nav.screen.value = to; }, s);

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
for (const name of which.split(',') as (keyof typeof VIEWS)[]) {
  const page = await browser.newPage({ viewport: VIEWS[name], deviceScaleFactor: 1, hasTouch: true });
  page.on('pageerror', e => console.log('pageerror', e.message));
  await page.addInitScript(s => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.removeItem('dino-dig-place');
    if (s) localStorage.setItem('dino-dig-save', JSON.stringify(s)); else localStorage.removeItem('dino-dig-save');
  }, save);
  const shot = (s: string) => page.screenshot({ path: `${out}/${name}-${s}.png` });
  await page.goto(url);
  await page.waitForTimeout(500);
  await shot('start');
  await page.getByLabel('Start').click();
  await page.waitForTimeout(700);
  await shot('home');
  const only = process.env.LOOK_ONLY; // 'run': straight to the run (LOOK_LAND picks the land)
  if (!only) await page.getByRole('button', { name: 'Play', exact: true }).click();
  for (let k = 1; k <= (only ? 0 : QUESTIONS); k++) {
    let p: Q = null;
    for (let t = 0; t < 50 && !p; t++) { p = await question(page); if (!p) await page.waitForTimeout(100); }
    if (!p) break;
    await ready(page);
    const id = p.mode === 'meet' ? `meet-${p.q.pattern}` : `${p.mode}-L${p.level}`;
    await shot(`q${k}-${id}`);
    // how far the answers sit above the bottom edge, and whether the question overflows
    console.log(name, id, await page.evaluate(() => {
      const els = [...document.querySelectorAll('.dd-pic,.dd-wordbtn,.dd-tile,button.dd-box,.meet-go')].map(e => e.getBoundingClientRect()).filter(r => r.height);
      const g = document.querySelector('.game.dd')!;
      return `answers ${Math.round(innerHeight - Math.max(...els.map(r => r.bottom)))}px above the bottom, overflow ${g.scrollHeight - g.clientHeight}px`;
    }));
    if (k === 1 && p.mode !== 'meet') {
      await answer(page, p, true);
      await page.waitForTimeout(2600);
      await shot(`q${k}-lesson`);
      console.log(name, 'lesson', await page.evaluate(() => { const g = document.querySelector('.game.dd')!; return `overflow ${g.scrollHeight - g.clientHeight}px`; }));
      await ready(page);
    }
    await answer(page, p, false);
    for (let t = 0; t < 100; t++) { const now = await question(page); if (JSON.stringify(now) !== JSON.stringify(p)) break; await page.waitForTimeout(100); }
  }
  if (!only) {
  await go(page, 'museum');
  await page.waitForTimeout(900);
  await shot('museum');
  await page.locator('.plinths').scrollIntoViewIfNeeded();
  await page.locator('#plinth-trike').scrollIntoViewIfNeeded();
  await shot('museum-plinths');
  await go(page, 'shop');
  await page.waitForTimeout(500);
  await shot('shop');
  for (const t of ['Tools', 'Gadgets', 'Markings', 'Hats', 'Roars', 'Gear', 'Lands', 'Museum']) {
    await page.getByRole('tab', { name: t }).click();
    await page.waitForTimeout(120);
    if (t === 'Markings' || t === 'Lands') { await page.locator('.shop-tile').nth(3).click(); await page.waitForTimeout(250); }
    await shot(`shop-${t.toLowerCase()}`);
  }
  await go(page, 'museum');
  await page.waitForTimeout(300);
  await page.locator('.museum-actions .dig-btn').click();
  await page.waitForTimeout(900);
  await shot('dig-intro');
  await page.locator('.dig-card .dig-go').click();
  await page.waitForTimeout(900);
  await shot('dig');
  }
  await go(page, 'museum');
  await page.waitForTimeout(400);
  await page.locator('.plinth-go[aria-label^="Play as"]').first().scrollIntoViewIfNeeded();
  await page.locator('.plinth-go[aria-label^="Play as"]').first().click();
  await page.waitForTimeout(1500);
  await shot(`run${only ? `-${process.env.LOOK_LAND}` : ''}`);
  const walk = page.getByRole('button', { name: 'Walk' });
  const b = await walk.boundingBox();
  if (b) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(1800); await page.mouse.up(); }
  if (!only) await shot('run-walking');
  await page.close();
}
await browser.close();
console.log('done');
