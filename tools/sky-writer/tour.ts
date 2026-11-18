// Plays Sky Writer in a real browser, as a child would: the Start screen and Home, a whole Round (meeting a Family when one is due,
// hearing the question again without it counting against him, one deliberate miss in every kind it meets so a lesson runs, then the same
// question answered: it must still take a finger), the end of the Round, a purchase at the Airfield, a whole Show by touch (steering
// through rings, a Loop and a Roll, then drawing in Free Sky and keeping it as a postcard) and the Wall, with screenshots. Writing is
// done with real touch events (Chrome DevTools Protocol), along the stroke the pad says is next (window.__pad in dev), as on the iPad.
//   npm run dev:sky-writer   (in another shell)
//   npx tsx tools/sky-writer/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a
// brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=3 for Level 3), every Family met, Bolts, parts and a Show.
// It fails on a page wider than the screen, a question that scrolls, or a button off screen or under 44px.
import { mkdirSync } from 'node:fs';
import { chromium, type Locator } from 'playwright';

const [url = 'http://localhost:5183/', out = 'tour-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['trace', 'start', 'flip', 'size', 'write', 'word'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 80,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])),
    families: ['lines', 'c', 'tall', 'bumps', 'slants', 'rest', 'numbers', 'capitals'], sinceMeet: 0,
    strength: { lines: 3, c: 3, tall: 3, bumps: 3, slants: 3, rest: 3, numbers: 3, capitals: 3 },
  },
  airfield: LEVEL >= 3
    ? { owned: ['plane:jet', 'engine:e1', 'engine:e2', 'wings:w1', 'tank:t1', 'tank:t2', 'smoke:rainbow', 'shape:stars', 'paint:flames', 'pilot:robot', 'trick:heart', 'gear:turbo', 'gear:magnet', 'gear:banner', 'wall:trophy', 'wall:frames'],
      fitted: { plane: 'jet', engine: 'e2', wings: 'w1', tank: 't2', prop: 'p0', smoke: 'rainbow', shape: 'stars', paint: 'flames', pilot: 'robot', trick: 'heart' }, off: [], shows: 1, opened: 4, flown: ['beach', 'city', 'canyon'], done: 3, pick: null,
      postcards: [{ show: 'beach', smoke: 'red', shape: 'plain', pts: [20, 40, 60, 80, 100, 120, -1, 150, 40, 150, 200] }], goal: null }
    : { owned: ['plane:glider', 'engine:e1', 'smoke:red', 'shape:dots', 'paint:blue', 'pilot:cat', 'gear:sparkle'],
      fitted: { plane: 'glider', engine: 'e1', wings: 'w0', tank: 't0', prop: 'p0', smoke: 'red', shape: 'dots', paint: 'blue', pilot: 'cat', trick: 'loop' }, off: [], shows: 1, opened: 2, flown: ['beach'], done: 1, pick: null, postcards: [], goal: null },
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
  localStorage.removeItem('sky-writer-place');
  if (s) localStorage.setItem('sky-writer-save', JSON.stringify(s)); else localStorage.removeItem('sky-writer-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${viewName}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.sw');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    const overlay = document.querySelector('.reward,.show-card-wrap,.wall-big-wrap');
    for (const el of document.querySelectorAll('button, [role=button]')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      if (overlay && !overlay.contains(el)) continue;
      const label = el.getAttribute('aria-label') ?? el.className.toString();
      // a thing in a scrolling list is reached by scrolling it: only the list itself has to be on screen
      const scroller = el.parentElement?.closest('.af-tray,.af-tabs,.wall-scroll,.show-card-wrap,.t-kinds') as HTMLElement | null;
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
async function tapAt(x: number, y: number) { await touch('touchStart', x, y); await page.waitForTimeout(40); await touch('touchEnd'); }
async function tapEl(l: Locator) { const c = await centre(l); await tapAt(c.x, c.y); }
/** A finger along these screen points, a few milliseconds apart, with a little wobble. */
async function stroke(pts: number[][], wobble = 1.5) {
  if (!pts.length) return;
  await touch('touchStart', pts[0]![0]!, pts[0]![1]!);
  for (let i = 1; i < pts.length; i += 2) { await touch('touchMove', pts[i]![0]! + (Math.random() - 0.5) * wobble, pts[i]![1]! + (Math.random() - 0.5) * wobble); await page.waitForTimeout(4); }
  const last = pts.at(-1)!;
  await touch('touchMove', last[0]!, last[1]!);
  await touch('touchEnd');
  await page.waitForTimeout(120);
}

// ---------- a Round ----------
type Q = { mode: string; level: number; replay?: boolean; q: Record<string, any> } | null;
type Pad = { box: number; boxes: number; stroke: number; strokes: number; ch: string; pts: number[][]; done: number[] } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
const pad = () => page.evaluate(() => (window as unknown as { __pad?(): unknown }).__pad?.() as Pad);
async function ready(ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.sw[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();

/** Writes the whole thing, stroke by stroke, until the question moves on. */
async function writeAll(before: string) {
  for (let i = 0; i < 40; i++) {
    const p = await pad(), now = await question();
    if (!p || JSON.stringify(now) !== before) return true;
    if (!p.pts.length) { await page.waitForTimeout(200); continue; }
    await stroke(p.pts);
    await page.waitForTimeout(150);
  }
  return false;
}

/** The right answer, or (miss) a wrong one a child might give. */
async function answer(p: NonNullable<Q>, miss: boolean) {
  const q = p.q;
  if (p.mode === 'meet') return tap('Go');
  if (q.kind === 'trace' || q.kind === 'write' || q.kind === 'word') {
    if (miss) {
      // the first stroke from its end: the wrong way
      const pd = await pad();
      if (pd?.pts.length) await stroke([...pd.pts].reverse());
      return;
    }
    if (!(await writeAll(JSON.stringify(p)))) problems.push(`${q.kind} ${q.ch}: the letter was written but the question did not move on`);
    return;
  }
  if (q.kind === 'start' && q.step === 'second') {
    const want = miss ? '0' : q.answer;
    const at = await page.evaluate(k => {
      const el = document.querySelector(`.sw-hit[data-stroke="${k}"]`) as SVGGeometryElement | null;
      if (!el) return null;
      const len = el.getTotalLength?.() ?? 0, pt = len ? el.getPointAtLength(len * 0.6) : { x: Number(el.getAttribute('cx')), y: Number(el.getAttribute('cy')) };
      const m = el.getScreenCTM()!, s = new DOMPoint(pt.x, pt.y).matrixTransform(m);
      return { x: s.x, y: s.y };
    }, want);
    if (at) await page.mouse.click(at.x, at.y); else problems.push('no stroke to tap');
    return;
  }
  const keys: string[] = q.choices, right: string = q.answer, key = miss ? keys.find(k => k !== right)! : right;
  return page.locator(`.game.sw [data-key="${key}"]`).first().click();
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
// a levelled save plays Rounds until every kind has had its deliberate miss (at most ROUNDS)
const ROUNDS = Number(process.env.TOUR_ROUNDS ?? (save ? 4 : 1));
for (let roundNo = 1; roundNo <= ROUNDS; roundNo++) {
if (roundNo > 1) {
  if (missedKinds.size >= MODES.length) break;
  await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
  await tap('Play again');
  await page.waitForTimeout(800);
}
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready();
  const id = p.mode === 'meet' ? `meet-${p.q.family}` : `${p.mode}-L${p.level}`;
  seen.add(id);
  await shot(`q${++asked}-${id}`);
  // he can hear it again as often as he likes: it never counts against him
  const hearOnly = p.mode !== 'meet' && !heardAgain;
  if (hearOnly) {
    heardAgain = true;
    for (let i = 0; i < 2; i++) { await tap('Say it again'); await page.waitForTimeout(250); }
    await page.waitForTimeout(600);
    await ready();
  }
  // one deliberate miss in every kind he meets, then the same question again: it must still take taps
  const miss = p.mode !== 'meet' && !hearOnly && !missedKinds.has(p.mode) && !p.replay;
  const before = await page.locator('.stars span.on:not(.half)').count();
  const results = () => page.evaluate(() => JSON.parse(localStorage.getItem('sky-writer-place') ?? '{}').round?.results?.length ?? 0);
  await answer(p, miss);
  if (miss) {
    missedKinds.add(p.mode);
    await page.waitForTimeout(2500);
    await shot(`q${asked}-lesson`);
    await ready(90000);
    await page.waitForTimeout(300);
    await answer(p, false);
  }
  for (let i = 0; i < 160; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
  if (hearOnly && (await page.locator('.stars span.on:not(.half)').count()) <= before) problems.push('hearing the question again counted against him');
  void results;
}
}
if (save && missedKinds.size < MODES.length) console.log(`(no miss played in: ${MODES.filter(m => !missedKinds.has(m)).join(', ')})`);
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
await shot('round-done-awake');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('sky-writer-save') ?? '{}'));
if (!((await saved()).airfield?.shows >= 1 + Math.min(ROUNDS, 1))) problems.push(`the Round earned no Show (${(await saved()).airfield?.shows})`);

// ---------- the Airfield: buy something ----------
await tap('Airfield');
await page.waitForTimeout(1200);
await shot('airfield');
const balance = (await saved()).balance ?? 0;
const want = save ? { tab: 'Engines', item: 'Zoom Engine', key: 'engine:e2', price: 20 } : { tab: 'Smoke Colors', item: 'Blue Smoke', key: 'smoke:blue', price: 3 };
if (save && LEVEL >= 3) Object.assign(want, { tab: 'Gear', item: 'Bubble Shield', key: 'gear:shield', price: 25 });
await page.getByRole('tab', { name: want.tab }).click();
await page.waitForTimeout(300);
await page.locator(`.af-tile[data-key="${want.key}"]`).click();
await page.waitForTimeout(600);
await shot('airfield-trying');
if (balance >= want.price) {
  await tap('Buy');
  await page.waitForTimeout(1500);
  if (!(await saved()).airfield?.owned?.includes(want.key)) problems.push(`the ${want.item} was not bought with ${balance} Bolts`);
  await shot('airfield-bought');
} else problems.push(`only ${balance} Bolts for the ${want.item}`);
for (const t of ['Planes', 'Paint', 'Tricks', 'Gear', 'Wall']) { await page.getByRole('tab', { name: t }).click(); await page.waitForTimeout(150); }
await shot('airfield-tabs');

// ---------- a Show, by touch ----------
const sh = () => page.evaluate(() => (window as any).__show?.());
const before = await saved();
await tap('Show');
await page.waitForTimeout(1200);
await shot('show-pick');
await tapEl(page.getByRole('button', { name: 'Take off' }));
await page.waitForTimeout(1500);
await shot('show-flying');
let tricks = 0;
for (let i = 0; i < 400; i++) {
  const s = await sh();
  if (!s || s.phase !== 'fly') break;
  if (i === 20 && tricks === 0) { await tapEl(page.getByRole('button', { name: 'Loop' })); tricks++; }
  if (i === 60 && tricks === 1) { await tapEl(page.getByRole('button', { name: 'Roll' })); tricks++; }
  if (i === 40) await shot('show-rings');
  if (s.ring && s.rect) {
    // hold a finger on the ring for a moment: the plane turns toward it
    const x = s.rect.left + s.ring.x * s.scale, y = s.rect.top + s.ring.y * s.scale;
    await touch('touchStart', x, y); await page.waitForTimeout(220); await touch('touchMove', x + 1, y); await page.waitForTimeout(220); await touch('touchEnd');
  } else await page.waitForTimeout(200);
}
const flown = await sh();
if (flown?.phase !== 'free') problems.push(`the Show's rings never ended (${JSON.stringify(flown)})`);
if (!(flown?.passed >= 3)) problems.push(`steering at the rings flew through only ${flown?.passed}`);
if (!(flown?.frames > 600)) problems.push(`the Show drew only ${flown?.frames} frames`);
await page.waitForTimeout(1500);
await shot('show-free');
// Free Sky: draw a zigzag and a circle, then keep it
const field = (await page.locator('.show-canvas').boundingBox())!;
const zig = Array.from({ length: 40 }, (_, i) => [field.x + field.width * (0.2 + i * 0.015), field.y + field.height * (0.35 + (i % 8 < 4 ? i % 4 : 4 - (i % 4)) * 0.04)]);
await touch('touchStart', zig[0]![0]!, zig[0]![1]!);
for (const [x, y] of zig) { await touch('touchMove', x!, y!); await page.waitForTimeout(60); }
await touch('touchEnd');
await page.waitForTimeout(400);
const circle = Array.from({ length: 50 }, (_, i) => [field.x + field.width * (0.55 + 0.12 * Math.cos(i / 8)), field.y + field.height * (0.4 + 0.15 * Math.sin(i / 8))]);
await touch('touchStart', circle[0]![0]!, circle[0]![1]!);
for (const [x, y] of circle) { await touch('touchMove', x!, y!); await page.waitForTimeout(60); }
await touch('touchEnd');
await page.waitForTimeout(800);
await shot('show-drawn');
await tapEl(page.getByRole('button', { name: 'Keep it' }));
await page.waitForTimeout(1200);
const after = await saved();
if (after.airfield.done !== before.airfield.done + 1) problems.push(`a finished Show was not counted (${before.airfield.done} → ${after.airfield.done})`);
if (after.balance !== before.balance + 2) problems.push(`a finished Show did not pay 2 Bolts (${before.balance} → ${after.balance})`);
if (after.airfield.postcards.length !== before.airfield.postcards.length + 1) problems.push('the postcard was not kept');
await shot('show-kept');

// ---------- the Wall ----------
await tapEl(page.getByRole('button', { name: 'Wall' }).last());
await page.waitForTimeout(1500);
await shot('wall');
await tapEl(page.getByRole('button', { name: /^Postcard/ }).last());
await page.waitForTimeout(2200);
await shot('wall-postcard');
await tapEl(page.getByRole('button', { name: 'Close' }));
await page.waitForTimeout(400);

console.log(`asked: ${[...seen].join(', ')}; missed in: ${[...missedKinds].join(', ')}`);
await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'tour: no problems');
process.exitCode = problems.length ? 1 : 0;
