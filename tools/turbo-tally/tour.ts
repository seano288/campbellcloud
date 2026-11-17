// Plays Turbo Tally in a real browser, as a child who taps: the Start screen and Home, a whole Round (missing twice, on purpose, the
// first question of each kind, so both lessons run, then answering right), the end of the Round, a purchase in the Garage, a Race steered by a held finger to the finish and
// its results board (opening the prize if he won one), the Cups shelf, and "Watch it go", with screenshots. Answers are read from the
// page (window.__round in dev), and every tap waits for the question to be said first. It fails on buttons off screen or under 44px.
//   npm run dev:turbo-tally   (in another shell)
//   npx tsx tools/turbo-tally/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a
// brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=1|2|3 picks another) and some Bolts. TOUR_BROWSER=webkit plays in WebKit.
import { mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const [url = 'http://localhost:5193/', out = '/tmp/turbo-tally-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['place', 'more', 'tally', 'chart', 'order'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 30,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean', 'clean', 'clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: ['tally', 'signs'],
    tuneUp: { place: { asked: 3, clean: 3, misses: 0 }, more: { asked: 3, clean: 3, misses: 0 } },
  },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;
const tag = `${viewName}-${save ? `L${LEVEL}` : 'new'}`;

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
  localStorage.removeItem('turbo-tally-place');
  if (s) localStorage.setItem('turbo-tally-save', JSON.stringify(s)); else localStorage.removeItem('turbo-tally-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.tt');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      // inside a scrolling tray, a tile below the fold is fine
      const tray = el.closest('.tt-tray,.shelves');
      if (tray) { // it scrolls: only the tray itself must be on screen, and a tile tall and wide enough
        const t = tray.getBoundingClientRect();
        if (t.bottom > innerHeight + 1 || t.right > innerWidth + 1) out.push(`off screen: the ${tray.className} tray`);
        if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
        continue;
      }
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`off screen: ${el.getAttribute('aria-label') ?? el.className}`);
      if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
}

type Q = { mode: string; meeting?: string; level?: number; q?: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.tt[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
const placeText = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
const SIGN: Record<string, string> = { '<': 'Less than', '=': 'Same as', '>': 'More than' };

/** Answers as he would, or misses on purpose: `second` picks a different wrong answer from the first miss, where there is one. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q!;
  const wrongOf = (xs: string[]) => { const w = xs.filter(x => x !== String(q.answer)); return (second && w[1]) || w[0]!; };
  if (q.kind === 'place') {
    if (q.form === 'tap') await tap(`${miss ? wrongOf(q.cars) : q.answer} car`);
    else await tap(placeText(Number(miss ? wrongOf(q.choices.map(String)) : q.answer)));
  } else if (q.kind === 'more') {
    if (q.form === 'sign') await tap(SIGN[miss ? wrongOf(['<', '=', '>']) : q.answer]!);
    else { const k = miss ? (q.answer === 'a' ? 'b' : 'a') : q.answer; await tap(`Speed ${k === 'a' ? q.a : q.b}`); }
  } else if (q.kind === 'tally') {
    if (q.form === 'make') { const marks = miss ? q.n - 1 : q.n; for (let i = 0; i < marks; i++) await tap('Add a mark'); await tap('Done'); }
    else if (q.form === 'pick') await tap(`Tally ${(q.choices as number[]).indexOf(miss ? Number(wrongOf(q.choices.map(String))) : q.n) + 1}`);
    else await tap(miss ? wrongOf(q.choices.map(String)) : String(q.answer));
  } else if (q.kind === 'chart') {
    if (q.form === 'most' || q.form === 'fewest') await tap(`${miss ? wrongOf(q.rows.map((r: { car: string }) => r.car)) : q.answer} car`);
    else await tap(miss ? wrongOf(q.choices.map(String)) : String(q.answer));
  } else if (q.kind === 'order') {
    if (q.form === 'between') await tap(`Number ${miss ? wrongOf(q.nums.map(String)) : q.answer}`);
    else { const order = String(q.answer).split(',').map(Number); const taps = miss ? [order[2]!, order[1]!] : [order[0]!, order[1]!]; for (const x of taps) await tap(`Number ${x}`); }
  }
}

// ---------- Start and Home ----------
await page.goto(url);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // the dev server can reload once while it prepares its modules
await shot('start');
await page.getByLabel('Start').click({ timeout: 30000 });
await page.waitForTimeout(800);
await shot('home');

// ---------- a Round ----------
await tap('Play');
const missedKinds = new Set<string>();
let asked = 0;
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready();
  const id = p.mode === 'meet' ? `meet-${p.meeting}` : `${p.mode}-L${p.level}-${p.q?.form ?? ''}`;
  await shot(`q${++asked}-${id}`);
  if (p.mode === 'meet') await tap('Go');
  else {
    const miss = !missedKinds.has(p.mode); // one deliberate miss in every kind he meets
    await answer(p, miss);
    if (miss) {
      missedKinds.add(p.mode);
      await page.waitForTimeout(1600);
      await shot(`q${asked}-lesson`);
      await ready(40000);
      // miss again, so the fuller second-miss lesson runs (Faster Car has only one wrong car: 🔎 runs the same lesson), then the right answer
      if (p.q?.kind === 'more' && p.q.form !== 'sign') await tap('Help'); else await answer(p, true, true);
      await page.waitForTimeout(2500);
      await shot(`q${asked}-lesson2`);
      await ready(60000);
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

// ---------- the Garage: buy a part ----------
await tap('Garage');
await page.waitForTimeout(1200);
await shot('garage');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('turbo-tally-save') ?? '{}'));
const balance = (await saved()).balance ?? 0;
const [slot, part, price] = balance >= 8 ? ['Engine', 'Zoomer Engine', 8] : ['Paint', 'Sunny Yellow', 3];
await page.getByRole('tab', { name: slot }).click();
await page.waitForTimeout(300);
await tap(part);
await page.waitForTimeout(600);
await shot('garage-trying');
if (balance >= price) {
  await tap('Buy');
  await page.waitForTimeout(3200);
  if (!(await saved()).garage?.owned?.some((k: string) => k.endsWith(part === 'Zoomer Engine' ? 'zoom' : 'yellow'))) problems.push(`${part} was not bought with ${balance} Bolts`);
  await shot('garage-bought');
} else problems.push(`only ${balance} Bolts after a Round`);
await page.getByRole('tab', { name: 'Race number' }).click();
await tap('tens up');
await page.waitForTimeout(300);
await shot('garage-number');

// ---------- a Race, steered by a held finger ----------
await page.getByRole('button', { name: /^Race at/ }).first().click();
await page.waitForTimeout(1000);
await shot('race-grid');
await tap('Go');
await page.waitForTimeout(2000);
await shot('race-countdown');
const canvas = page.locator('.race-canvas');
let boosted = false, steered = 0;
for (let i = 0; i < 600 && !(await page.locator('.race-result').count()); i++) {
  const spot = await page.evaluate(() => (window as unknown as { __ahead?(d: number): { x: number; y: number } }).__ahead?.(240) ?? null);
  const box = (await canvas.boundingBox())!;
  if (spot) {
    const x = Math.max(box.x + 30, Math.min(box.x + box.width - 30, box.x + spot.x)), y = Math.max(box.y + 30, Math.min(box.y + box.height - 30, box.y + spot.y));
    await page.mouse.move(x, y);
    if (!steered++) await page.mouse.down();
  }
  if (i === 40) await shot('race-driving');
  if (!boosted && i > 30) { boosted = true; await page.mouse.up(); await tap('Boost'); steered = 0; }
  await page.waitForTimeout(150);
}
await page.mouse.up();
if (!(await page.locator('.race-result').count())) problems.push('the Race never finished');
await page.waitForTimeout(2000);
await shot('race-result');
if (await page.getByRole('button', { name: 'Open the prize' }).count()) { await tap('Open the prize'); await page.waitForTimeout(1500); await shot('race-prize'); }
const after = (await saved()).garage;
if (!after?.raced) problems.push('the Race was not counted');

// ---------- the Cups, and Watch it go ----------
await tap('Cups');
await page.waitForTimeout(1200);
await shot('cups');
await tap('Watch it go');
await page.waitForTimeout(6000);
await shot('watch');
await page.waitForSelector('.race-result', { timeout: 60000 }).catch(() => problems.push('Watch it go never finished its lap'));
await shot('watch-done');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
console.log(`${tag}: ${asked} questions, missed in ${[...missedKinds].join(' ')}, ${clips} voice clips played, Race finished ${after?.raced ? 'yes' : 'no'}, place ${after?.tracks?.t1?.best ?? '?'}`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
