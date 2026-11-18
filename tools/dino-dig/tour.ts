// Plays Dino Dig in a real browser, as a child who taps: the Start screen and Home, a whole Round (meeting a Pattern when one is due,
// hearing the question again without it counting against him, one deliberate miss in every kind it meets so a lesson runs, and then the
// same question answered: it must still take taps), the end of the Round, a purchase in the Shop, a whole Dig by touch (rub the dirt,
// crack the rocks, drag every bone to the crate), the Museum (the bones snap on; a finished skeleton is brought to life) and the Alive
// run to the nest, with screenshots. Answers are read from the page (window.__round in dev), and taps wait for the question to be said.
//   npm run dev:dino-dig   (in another shell)
//   npx tsx tools/dino-dig/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a
// brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=3 for Level 3), every Pattern met, Bolts, tools and gadgets,
// a skeleton one bone from done and a living dinosaur. The Dig and the run are played with real touch events (Chrome DevTools
// Protocol), as on the iPad. It fails on a page wider than the screen, a question that scrolls, or a button off screen or under 44px.
import { mkdirSync } from 'node:fs';
import { chromium, type Locator } from 'playwright';

const [url = 'http://localhost:5181/', out = 'tour-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['read', 'hear', 'swap', 'real', 'sentence'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 60,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])),
    patterns: ['cvc', 'digraph', 'blend', 'magic-e', 'team', 'r'], sinceMeet: 0, strength: { cvc: 3, digraph: 3, blend: 3, 'magic-e': 3, team: 3, r: 3 },
  },
  museum: LEVEL >= 3
    ? {
      owned: ['tool:trowel', 'tool:shovel', 'tool:pickaxe', 'gadget:finder', 'gadget:blower', 'gadget:dynamite', 'gadget:dog', 'gadget:drone', 'color:gold', 'marking:tiger', 'hat:crown', 'roar:mega',
        'gear:springs', 'gear:trail', 'gear:cape', 'land:volcano', 'deco:disco', 'deco:fountain', 'deco:rocket'],
      bones: { compy: 4, raptor: 5, ptero: 4, pachy: 5, stego: 6, para: 4 }, alive: ['compy', 'raptor', 'ptero', 'pachy'], pet: 'ptero',
      looks: { ptero: { color: 'gold', marking: 'tiger', hat: 'crown', roar: 'mega' } }, digs: 2, done: 9, finds: ['ammonite', 'tooth', 'egg', 'amber'], site: 'canyon', land: 'volcano', off: [], goal: null,
    }
    : {
      owned: ['tool:trowel', 'gadget:finder', 'gadget:magnet', 'gadget:hose', 'color:red', 'hat:cap', 'gear:turbo', 'gear:magnet', 'land:beach', 'deco:palm'],
      bones: { compy: 4, raptor: 4, ptero: 1 }, alive: ['compy'], pet: 'compy', looks: { compy: { color: 'red', hat: 'cap' } }, digs: 2, done: 4, finds: ['egg'], site: null, land: 'beach', off: [], goal: null,
    },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true, isMobile: false });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
page.on('pageerror', e => problems.push(`pageerror: ${e.message} ${(e.stack ?? '').split('\n').slice(1, 3).join(' ')}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('dino-dig-place');
  if (s) localStorage.setItem('dino-dig-save', JSON.stringify(s)); else localStorage.removeItem('dino-dig-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${viewName}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.dd');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    const overlay = document.querySelector('.reward,.dig-card-wrap,.run-card-wrap');
    for (const el of document.querySelectorAll('button, [role=button]')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      if (overlay && !overlay.contains(el)) continue;
      const label = el.getAttribute('aria-label') ?? el.className.toString();
      // a thing in a scrolling list is reached by scrolling it: only the list itself has to be on screen
      const scroller = el.parentElement?.closest('.shop-tray,.museum-scroll,.dig-card-wrap,.run-card-wrap') as HTMLElement | null;
      const box = scroller ? scroller.getBoundingClientRect() : r;
      if (box.right > innerWidth + 1 || box.bottom > innerHeight + 1 || box.left < -1 || box.top < -1) out.push(`off screen: ${label}`);
      if (r.height < 43.5 || r.width < 43.5) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 8).join('; ')}`);
}

// ---------- touch, as on the iPad ----------
const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
async function centre(l: Locator) { const b = (await l.boundingBox())!; return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
async function tapAt(x: number, y: number) { await touch('touchStart', x, y); await page.waitForTimeout(50); await touch('touchEnd'); }
async function tapEl(l: Locator) { const c = await centre(l); await tapAt(c.x, c.y); }
async function drag(from: { x: number; y: number }, to: { x: number; y: number }, ms = 300, steps = 8) {
  await touch('touchStart', from.x, from.y);
  for (let i = 1; i <= steps; i++) { await touch('touchMove', from.x + (to.x - from.x) * i / steps, from.y + (to.y - from.y) * i / steps); await page.waitForTimeout(ms / steps); }
  await touch('touchEnd');
}

// ---------- a Round ----------
type Q = { mode: string; level: number; replay?: boolean; q: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.dd[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
const sceneKey = (s: Record<string, any>) => [s.size ?? '', s.a, s.rel ?? '', s.b ?? ''].join(':');

/** The right answer, or (miss) a wrong one a child might give. */
async function answer(p: NonNullable<Q>, miss: boolean) {
  const q = p.q;
  if (p.mode === 'meet') return tap('Go');
  if (q.kind === 'read' || q.kind === 'sentence') {
    const keys: string[] = q.kind === 'read' ? q.choices : q.choices.map(sceneKey), right = q.kind === 'read' ? q.word : sceneKey(q.scene);
    return page.locator(`.dd-pic[data-key="${miss ? keys.find(k => k !== right) : right}"]`).click();
  }
  if (q.kind === 'hear' || q.kind === 'real') return page.locator(`.dd-wordbtn[data-key="${miss ? (q.choices as string[]).find(c => c !== q.word) : q.word}"]`).click();
  // Sound Swap: the sound to change, then the new one
  if (miss) return page.locator(`.dd-box[data-box="${q.box === 0 ? 1 : 0}"]`).click();
  if (!(await page.locator('.dd-tiles').count())) { await page.locator(`.dd-box[data-box="${q.box}"]`).click(); await page.waitForTimeout(400); }
  return page.locator(`.dd-tile[data-tile="${q.answer}"]`).click();
}

await page.goto(url);
await page.waitForTimeout(600);
await shot('start');
await page.getByLabel('Start').click({ timeout: 30000 });
await page.waitForTimeout(800);
await shot('home');
await tap('Play');
let asked = 0, heardAgain = false;
const seen = new Set<string>(), missedKinds = new Set<string>();
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready();
  const id = p.mode === 'meet' ? `meet-${p.q.pattern}` : `${p.mode}-L${p.level}`;
  seen.add(id);
  await shot(`q${++asked}-${id}`);
  // he can hear it again as often as he likes: it never counts against him
  const hearOnly = p.mode !== 'meet' && !heardAgain;
  if (hearOnly) {
    heardAgain = true;
    for (let i = 0; i < 2; i++) { await tap('Say it again'); await page.waitForTimeout(250); }
    if (p.q.kind === 'hear') await tap('Hear the word again');
    await page.waitForTimeout(600);
    await ready();
  }
  // one deliberate miss in every kind he meets, then the same question again: it must still take taps
  const miss = p.mode !== 'meet' && !hearOnly && !missedKinds.has(p.mode) && !p.replay;
  const before = await page.locator('.stars span.on:not(.half)').count();
  await answer(p, miss);
  if (miss) {
    missedKinds.add(p.mode);
    await page.waitForTimeout(2500);
    await shot(`q${asked}-lesson`);
    await ready(60000);
    await answer(p, false);
  }
  for (let i = 0; i < 160; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
  if (hearOnly && (await page.locator('.stars span.on:not(.half)').count()) <= before) problems.push('hearing the question again counted against him');
}
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
await shot('round-done-awake');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('dino-dig-save') ?? '{}'));
if (!((await saved()).museum?.digs >= 1)) problems.push('the Round earned no Dig');

// ---------- the Shop: buy something ----------
await tap('Museum');
await page.waitForTimeout(1500);
await shot('museum');
await tap('Shop');
await page.waitForTimeout(1000);
await shot('shop');
const balance = (await saved()).balance ?? 0;
const want = save ? { tab: 'Gadgets', item: 'Leaf Blower', key: 'gadget:blower', price: 20 } : { tab: 'Colors', item: 'Red', key: 'color:red', price: 3 };
if (save && LEVEL >= 3) Object.assign(want, { tab: 'Gear', item: 'Snack Magnet', key: 'gear:magnet', price: 35 });
await page.getByRole('tab', { name: want.tab }).click();
await page.waitForTimeout(300);
await page.locator(`.shop-tile[data-key="${want.key}"]`).click();
await page.waitForTimeout(600);
await shot('shop-trying');
if (balance >= want.price) {
  await tap('Buy');
  await page.waitForTimeout(1500);
  if (!(await saved()).museum?.owned?.includes(want.key)) problems.push(`the ${want.item} was not bought with ${balance} Bolts`);
  await shot('shop-bought');
} else problems.push(`only ${balance} Bolts for the ${want.item}`);
for (const t of ['Tools', 'Hats', 'Roars', 'Lands', 'Museum']) { await page.getByRole('tab', { name: t }).click(); await page.waitForTimeout(150); }
await shot('shop-tabs');
await page.getByRole('button', { name: 'Museum', exact: true }).first().click();
await page.waitForTimeout(800);

// ---------- a Dig, by touch ----------
const dig = () => page.evaluate(() => (window as unknown as { __dig?(): any }).__dig?.());
async function playDig(name: string) {
  await tapEl(page.locator('.museum-actions .dig-btn'));
  await page.waitForTimeout(1200);
  await shot(`${name}-intro`);
  await tapEl(page.locator('.dig-card .dig-go'));
  await page.waitForTimeout(800);
  const canvas = page.locator('.dig-canvas'), box = (await canvas.boundingBox())!;
  const toScreen = async (x: number, y: number) => {
    const d = await dig(), dpr = await page.evaluate(() => { const c = document.querySelector('.dig-canvas') as HTMLCanvasElement; return c.width / c.getBoundingClientRect().width; });
    return { x: box.x + (d.view.ox + x * d.view.s) / dpr, y: box.y + (d.view.oy + y * d.view.s) / dpr };
  };
  let rubbed = 0;
  for (let i = 0; i < 160; i++) {
    const d = await dig();
    if (d.phase !== 'dig') break;
    const loose = d.things.find((t: any) => t.state === 'loose');
    if (loose) {
      const from = await toScreen(loose.px, loose.py), to = await toScreen(d.crate.x + d.crate.w / 2, d.crate.y + d.crate.h / 2);
      await drag(from, to, 400, 10);
      await page.waitForTimeout(800);
      continue;
    }
    const next = d.things.find((t: any) => t.state === 'buried');
    if (!next) { await page.waitForTimeout(300); continue; }
    const rock = d.rocks.find((r: any) => Math.abs(r.x - next.x) < r.r + next.hw && Math.abs(r.y - next.y) < r.r + next.hh);
    if (rock) { const c = await toScreen(rock.x, rock.y); await tapAt(c.x, c.y); await page.waitForTimeout(200); continue; }
    // rub back and forth across it, a little lower each time
    const y = next.y - next.hh + ((rubbed++ % 5) / 4) * next.hh * 2;
    await drag(await toScreen(next.x - next.hw - 30, y), await toScreen(next.x + next.hw + 30, y), 250, 10);
    if (i === 3) await shot(`${name}-rubbing`);
  }
  const end = await dig();
  if (end.phase !== 'done') problems.push(`${name}: the Dig never finished (${JSON.stringify({ phase: end.phase, things: end.things?.map((t: any) => t.state) })})`);
  await page.waitForTimeout(1200);
  await shot(`${name}-done`);
  const frames = end.frames;
  if (!(frames > 20)) problems.push(`${name}: the Dig drew only ${frames} frames`);
  await tapEl(page.getByRole('button', { name: 'Off to the Museum' }));
  await page.waitForTimeout(3500);
  await shot(`${name}-museum`);
}
const before = await saved();
await playDig('dig1');
const after = await saved();
if (after.museum.done !== before.museum.done + 1) problems.push(`a finished Dig was not counted (${before.museum.done} → ${after.museum.done})`);
if (after.balance !== before.balance + 2) problems.push(`a finished Dig did not pay 2 Bolts (${before.balance} → ${after.balance})`);

// a whole skeleton comes alive, and he plays as it
async function playRun(name: string) {
  await page.waitForTimeout(1500);
  await shot(`${name}-start`);
  const walk = page.getByRole('button', { name: 'Walk' }), jump = page.getByRole('button', { name: 'Jump' });
  for (let i = 0; i < 40; i++) {
    const r = await page.evaluate(() => (window as any).__run?.());
    if (!r || r.phase === 'done') break;
    if (r.phase !== 'run') { await page.waitForTimeout(500); continue; }
    const wb = await walk.boundingBox({ timeout: 500 }).catch(() => null);
    if (!wb) continue;
    await touch('touchStart', wb.x + wb.width / 2, wb.y + wb.height / 2);
    await page.waitForTimeout(700);
    await touch('touchEnd');
    if ((await page.evaluate(() => (window as any).__run?.()))?.phase !== 'run') continue;
    // the pad goes away the moment the run ends, so a button may be gone by the time it's read: then there's nothing to tap
    const tapIfThere = async (l: Locator) => { const b = await l.boundingBox({ timeout: 500 }).catch(() => null); if (b) await tapAt(b.x + b.width / 2, b.y + b.height / 2); return !!b; };
    if (i % 2) await tapIfThere(jump);
    if (i === 4 && await tapIfThere(page.getByRole('button', { name: 'Roar' }))) await shot(`${name}-running`);
  }
  const r = await page.evaluate(() => (window as any).__run?.());
  if (r?.phase !== 'done') problems.push(`${name}: the run never reached the nest (${JSON.stringify(r)})`);
  await page.waitForTimeout(1500);
  await shot(`${name}-done`);
  await tapEl(page.getByRole('button', { name: 'Museum', exact: true }).last());
  await page.waitForTimeout(1000);
}
const wake = page.locator('.plinth-go[aria-label^="Bring"]');
if (await wake.count()) {
  await wake.first().scrollIntoViewIfNeeded();
  await tapEl(wake.first());
  await playRun('alive');
} else {
  // a new player: keep digging until the first dinosaur is whole (the free Dig and the one from the Round, then more from a seeded save)
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('dino-dig-save')!); s.museum.digs = 3; localStorage.setItem('dino-dig-save', JSON.stringify(s)); });
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.waitForTimeout(800);
  for (let k = 2; k <= 4 && !(await page.locator('.plinth-go[aria-label^="Bring"]').count()); k++) await playDig(`dig${k}`);
  if (await page.locator('.plinth-go[aria-label^="Bring"]').count()) { await page.locator('.plinth-go[aria-label^="Bring"]').first().scrollIntoViewIfNeeded(); await tapEl(page.locator('.plinth-go[aria-label^="Bring"]').first()); await playRun('alive'); }
  else problems.push('the first dinosaur was not whole after four Digs');
}
// a living dinosaur can be played again from its plinth
const playAgain = page.locator('.plinth-go[aria-label^="Play as"]');
if (await playAgain.count()) { await playAgain.first().scrollIntoViewIfNeeded(); await tapEl(playAgain.first()); await playRun('again'); }
else problems.push('no living dinosaur to play again');
await page.locator('.museum-hall').scrollIntoViewIfNeeded();
await shot('museum-end');

console.log(`asked: ${[...seen].join(', ')}; missed in: ${[...missedKinds].join(', ')}`);
await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'tour: no problems');
process.exitCode = problems.length ? 1 : 0;
