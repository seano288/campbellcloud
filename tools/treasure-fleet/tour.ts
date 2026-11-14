// Plays Treasure Fleet in a real browser, as a child who taps: the Start screen and Home, a whole Round (with one deliberate miss, so a
// lesson runs, and the miss tried again on the same question), the end of the Round, a purchase at the Shipyard, a Voyage (set sail,
// steer, fire the cannon, land), the walk along the beach to the X, the dig, and the Hoard, with screenshots. Answers are read from the
// page (window.__round in dev), and every tap waits for the question to be said first.
//   npm run dev:treasure-fleet   (in another shell)
//   npx tsx tools/treasure-fleet/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a
// brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=1|2|3 picks another) and some Bolts. TOUR_BROWSER=webkit plays in WebKit.
import { mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const [url = 'http://localhost:5197/', out = 'tour-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['where', 'key', 'grid', 'clue', 'above'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 30,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: LEVEL === 3 ? ['compass', 'key', 'grid'] : [], // at Level 2 he still meets the rose, the key and the grid
  },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;

const browser = process.env.TOUR_BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true });
await page.addInitScript(() => {
  const w = window as unknown as { __clips: number }, start = AudioBufferSourceNode.prototype.start;
  w.__clips = 0;
  AudioBufferSourceNode.prototype.start = function (...a: Parameters<typeof start>) { if ((this.buffer?.duration ?? 0) > .05) w.__clips++; return start.apply(this, a); };
});
page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('treasure-fleet-place');
  if (s) localStorage.setItem('treasure-fleet-save', JSON.stringify(s)); else localStorage.removeItem('treasure-fleet-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${viewName}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons (and map squares) off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.tf');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button, [role=button]')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      if (document.querySelector('.reward') && el.closest('.card')) continue; // the last question, under the end of the Round
      const label = el.getAttribute('aria-label') ?? el.className.toString();
      // a tile in a scrolling tray is reached by scrolling it: only the tray itself has to be on screen
      const scroller = (el.parentElement?.closest('.tf-tray') as HTMLElement | null);
      const box = scroller ? scroller.getBoundingClientRect() : r;
      if (box.right > innerWidth + 1 || box.bottom > innerHeight + 1 || box.left < -1 || box.top < -1) out.push(`off screen: ${label}`);
      if (r.height < 43.5 || r.width < 43.5) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
}

type Cell = { x: number; y: number };
type Q = { mode: string; meeting?: string; level?: number; replay?: boolean; q?: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.tf[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
const tapCell = (c: Cell) => page.locator(`[data-cell="${c.x},${c.y}"]`).first().click();
const WORD: Record<string, string> = { palm: 'palm tree', hut: 'hut', cave: 'cave', hill: 'hill', rock: 'rock', dock: 'dock', bridge: 'bridge', river: 'river' };
const LETTERS = 'ABCDE';
const name = (c: Cell, h: number) => `${LETTERS[c.x]}${h - c.y}`;
const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

/** The right answer, or (miss) a wrong one a child might give. */
async function answer(p: NonNullable<Q>, miss: boolean) {
  const q = p.q!;
  const otherThing = (right: Cell) => (q.map.things as (Cell & { sym: string })[]).find(t => !same(t, right) && t.sym !== 'bridge') ?? (q.map.things as Cell[]).find(t => !same(t, right))!;
  if (q.kind === 'where') await tapCell(miss ? otherThing(q.answer) : q.answer);
  else if (q.kind === 'key') {
    if (q.form === 'symbol') await tap(WORD[miss ? (q.key as string[]).find(k => k !== q.ask)! : q.ask]!);
    else if (q.form === 'count') await tap(String(miss ? q.count + 1 : q.count));
    else await tapCell(miss ? otherThing(q.answer) : q.answer);
  } else if (q.kind === 'grid') {
    if (q.form === 'tap') await tapCell(miss ? { x: (q.target.x + 1) % q.map.w, y: q.target.y } : q.target);
    else { const k = miss ? (q.answer + 1) % 3 : q.answer; await tap(name(q.choices[k], q.map.h)); }
  } else if (q.kind === 'clue') await tapCell(miss ? q.start : q.end);
  else if (q.kind === 'above') await tap(`Map ${(miss ? (q.answer + 1) % q.options.length : q.answer) + 1}`);
}

// ---------- Start and Home ----------
await page.goto(url);
await shot('start');
await page.getByLabel('Start').click({ timeout: 30000 });
await page.waitForTimeout(800);
await shot('home');

// ---------- a Round ----------
await tap('Play');
let asked = 0;
const seen = new Set<string>(), missedKinds = new Set<string>();
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready();
  const id = p.mode === 'meet' ? `meet-${p.meeting}` : `${p.mode}-L${p.level}-${p.q?.form ?? ''}`;
  seen.add(id);
  await shot(`q${++asked}-${id}`);
  if (p.mode === 'meet') {
    if (p.meeting === 'compass') await page.getByRole('button', { name: 'North' }).click();
    else if (p.meeting === 'key') await tap('Go on');
    else await tapCell({ x: 1, y: 1 });
  } else {
    // one deliberate miss in every kind he meets, then the same question again: it must still take taps after the lesson
    const miss = !missedKinds.has(p.mode) && !p.replay;
    await answer(p, miss);
    if (miss) {
      missedKinds.add(p.mode);
      await page.waitForTimeout(1800);
      await shot(`q${asked}-lesson`);
      await ready(40000);
      // the same question still takes taps after the lesson: try again, as he would
      await answer(p, false);
    }
  }
  // wait for this question to go
  for (let i = 0; i < 130; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
}
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
await shot('round-done-awake');

// ---------- the Shipyard: buy a part ----------
await tap('Shipyard');
await page.waitForTimeout(1200);
await shot('yard');
await page.getByRole('tab', { name: 'Sails' }).click();
await page.waitForTimeout(300);
await tap('Patched Sails');
await page.waitForTimeout(600);
await shot('yard-trying');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('treasure-fleet-save') ?? '{}'));
const balance = (await saved()).balance ?? 0;
if (balance >= 8) {
  await tap('Buy');
  await page.waitForTimeout(3200);
  if (!(await saved()).fleet?.owned?.includes('sails:patched')) problems.push('the Patched Sails were not bought');
} else {
  await tap('Buy'); // too dear: it becomes his Goal
  await page.waitForTimeout(800);
  await tap('Put it back');
  await page.getByRole('tab', { name: 'Flag' }).click();
  await tap('Shark Flag');
  await tap('Buy');
  await page.waitForTimeout(3200);
  if (!(await saved()).fleet?.owned?.includes('flag:shark')) problems.push(`nothing was bought with ${balance} Bolts`);
}
await page.getByRole('tab', { name: 'Flag' }).click();
await tap('Red');
await page.waitForTimeout(500);
await shot('yard-bought');
if ((await saved()).fleet?.ship?.colour !== 'red') problems.push('the flag colour did not change');

// ---------- a Voyage: sail, the island, dig ----------
await page.getByRole('button', { name: /^Set sail to/ }).click();
await page.waitForTimeout(800);
await shot('voyage-harbour');
await tap('Set sail');
await page.waitForTimeout(1500);
const canvas = page.locator('.voy-canvas'), box = (await canvas.boundingBox())!;
let fired = 0;
// steer back and forth with a finger, firing the cannon now and then
for (let i = 0; i < 40 && (await page.locator('.voyage-screen.sail').count()); i++) {
  const x = box.x + box.width * (.25 + .5 * ((i % 4) / 3));
  await page.mouse.move(x, box.y + box.height * .35);
  await page.mouse.down();
  await page.waitForTimeout(350);
  await page.mouse.up();
  if (await page.getByRole('button', { name: 'Fire the cannon' }).count()) { await page.getByRole('button', { name: 'Fire the cannon' }).dispatchEvent('pointerdown'); fired++; }
  if (i === 10) await shot('voyage-sailing');
  await page.waitForTimeout(350);
}
const sailed = await page.evaluate(() => (window as unknown as { __voyage?(): { t: number; frames: number } }).__voyage?.());
if (sailed) console.log(`at sea: ${sailed.t.toFixed(1)}s sailed in ${sailed.frames} frames`);
// a slow headless canvas sails slower than an iPad: give it time
await page.waitForSelector('.voyage-screen.island', { timeout: 120000 }).catch(() => problems.push('the ship never reached the island'));
await page.waitForTimeout(1200);
await shot('voyage-island');
// walk to the X: hold on the sand, jump now and then
for (let i = 0; i < 40 && !(await page.getByRole('button', { name: 'Dig' }).count()); i++) {
  await page.mouse.move(box.x + box.width * .4, box.y + box.height * .5);
  await page.mouse.down();
  await page.waitForTimeout(600);
  if (i % 2 === 1 && await page.getByRole('button', { name: 'Jump' }).count()) await page.getByRole('button', { name: 'Jump' }).dispatchEvent('pointerdown');
  await page.waitForTimeout(300);
  await page.mouse.up();
  if (i === 4) await shot('voyage-walking');
}
if (await page.getByRole('button', { name: 'Dig' }).count()) {
  await shot('voyage-x');
  for (let i = 0; i < 3; i++) { await tap('Dig'); await page.waitForTimeout(400); }
  await page.waitForTimeout(3500);
  await shot('voyage-result');
  const f = (await saved()).fleet;
  if (!f?.hoard?.length) problems.push('no treasure in the Hoard after a first dig');
  if (!f?.trips) problems.push('the Voyage was not counted');
  await tap('Hoard');
  await page.waitForTimeout(1200);
  await shot('hoard');
} else problems.push('never reached the X');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
console.log(`${viewName} ${process.env.TOUR_SAVE ?? 'fresh'}${save ? ` L${LEVEL}` : ''}: ${asked} questions (${[...seen].join(', ')}), missed and retried in ${[...missedKinds].join(', ')}, ${clips} voice clips played, cannon fired ${fired}×`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
