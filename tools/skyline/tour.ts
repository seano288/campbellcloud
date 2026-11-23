// Plays Skyline in a real browser, as a child who taps: the Start screen and Home, a whole Round (missing twice, on purpose, the
// first question of each kind, so both lessons run, then answering right), the end of the Round, a purchase in the City (and a
// building stood on a plot), the Skyline and the fly-over, then a Job driven by a held finger to its end, with screenshots. Answers
// are read from the page (window.__round in dev), and every tap waits for the question to be said first. It fails on buttons off
// screen or under 44px, and on any page error.
//   npm run dev:skyline   (in another shell)
//   npx tsx tools/skyline/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (810×1080, 1080×810, 390×844, 844×390). TOUR_SAVE=fresh|levels: a brand-new
// player, or one with every kind open at Level 2 (TOUR_LEVEL=3 for Level 3, where he meets the × sign and its name on the way) and
// some Bolts. TOUR_BROWSER=webkit plays in WebKit.
import { mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const [url = 'http://localhost:5171/', out = '/tmp/skyline-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['groups', 'array', 'pair', 'count', 'share', 'times'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 40,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean', 'clean', 'clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: LEVEL === 3 ? [] : ['sign', 'word'],
    tuneUp: { groups: { asked: 3, clean: 3, misses: 0 }, array: { asked: 3, clean: 3, misses: 0 } },
  },
  city: { done: 14, jobs: 1 },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;
const tag = `${viewName}-${save ? `L${LEVEL}` : 'new'}`;
const started = Date.now();

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
  localStorage.removeItem('skyline-place');
  if (s) localStorage.setItem('skyline-save', JSON.stringify(s)); else localStorage.removeItem('skyline-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.sl');
    // under the Round-done card the finished question is clipped and can't be scrolled to, so it isn't checked there
    if (game && !document.querySelector('.sl-reward') && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      const tray = el.closest('.sl-tray,.trophy-shelf,.land-panel,.design-panel,.bests-panel,.result-card,.reward');
      if (tray) {
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
  while (Date.now() - t < ms) { if (await page.locator('.game.sl[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click({ timeout: 15000 });
/** The label a view gives an answer. */
function labelOf(q: Record<string, any>, value: string): string {
  if (value === 'yes' || value === 'no' || value === 'odd' || value === 'even') return value[0]!.toUpperCase() + value.slice(1);
  if ((q.form === 'pick' || q.form === 'match')) return `Picture ${Number(value) + 1}`;
  if (q.kind === 'pair' && q.form === 'double') return `${value} + ${value}`;
  return value;
}
/** Answers as he would, or misses on purpose: `second` picks a different wrong answer from the first miss, where there is one. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q!;
  if (q.kind === 'share' && q.form === 'deal') {
    // right: one box to each truck, round and round; wrong: every box on the first truck
    for (let i = 0; i < q.total; i++) await tap(`Truck ${miss ? 1 : (i % q.trucks) + 1}`);
    await tap('Done');
    return;
  }
  let value = String(q.answer);
  if (miss) {
    const wrong: string[] = q.wrong ? q.wrong.map((w: { value: string }) => w.value) : q.answer === 'yes' ? ['no'] : q.answer === 'no' ? ['yes'] : q.answer === 'odd' ? ['even'] : q.answer === 'even' ? ['odd'] : (q.nums ?? []).map(String).filter((x: string) => x !== q.answer);
    value = (second && wrong[1]) || wrong[0]!;
  }
  await tap(labelOf(q, value));
}

const missedKinds = new Set<string>();
let asked = 0, roundStart = 0, roundSeconds = 0, jobSeconds = 0, after: Record<string, any> | undefined;
try {
  // ---------- Start and Home ----------
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await shot('start');
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.waitForTimeout(800);
  await shot('home');

  // ---------- a Round ----------
  roundStart = Date.now();
  await tap('Play');
  for (let guard = 0; guard < 30; guard++) {
    if (await page.locator('.reward h2').isVisible()) break;
    const p = await question();
    if (!p) { await page.waitForTimeout(300); continue; }
    await ready();
    const id = p.mode === 'meet' ? `meet-${p.meeting}` : `${p.mode}-L${p.level}-${p.q?.form ?? ''}`;
    await shot(`q${++asked}-${id}`);
    if (p.mode === 'meet') await tap('Go');
    else {
      const miss = !missedKinds.has(p.mode) && missedKinds.size < 2; // a deliberate miss in the first two kinds he meets
      await answer(p, miss);
      if (miss) {
        missedKinds.add(p.mode);
        await page.waitForTimeout(1600);
        await shot(`q${asked}-lesson`);
        await ready(40000);
        await answer(p, true, true); // again, so the fuller lesson runs
        // the fuller lesson may ask him to tap each row (or bus): he does, once it asks
        await page.locator('.row-tap,.bus-btn').first().waitFor({ timeout: 12000 }).catch(() => {});
        for (let k = 0; k < 12 && await page.locator('.row-tap,.bus-btn').count(); k++) { await page.locator('.row-tap,.bus-btn').first().click().catch(() => {}); await page.waitForTimeout(700); }
        await page.waitForTimeout(1200);
        await shot(`q${asked}-lesson2`);
        await ready(60000);
        await answer(p, false);
      }
    }
    for (let i = 0; i < 130; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
  }
  await page.waitForTimeout(1500);
  await shot('round-done');
  await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
  roundSeconds = (Date.now() - roundStart) / 1000;
  await shot('round-done-awake');

  // ---------- the City: buy something, stand it on a plot, look at the Skyline ----------
  await tap('City');
  await page.waitForTimeout(1800);
  await shot('city');
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('skyline-save') ?? '{}'));
  const before = await saved(), balance = before.balance ?? 0;
  await page.getByRole('tab', { name: 'Street', exact: true }).click();
  await page.waitForTimeout(300);
  await tap('Bench');
  await page.waitForTimeout(500);
  await shot('city-trying');
  if (balance >= 3) {
    await tap('Buy');
    await page.waitForTimeout(3200);
    if (!(await saved()).city?.owned?.includes('f:bench')) problems.push(`the Bench was not bought with ${balance} Bolts`);
    await shot('city-bought');
  } else problems.push(`only ${balance} Bolts after a Round`);
  await page.getByRole('tab', { name: 'Buildings', exact: true }).click();
  await page.waitForTimeout(300);
  await tap('Little House');
  await page.waitForTimeout(800);
  await shot('city-plot');
  // stand the house on the empty plot the City picked for it
  const tile = page.locator('.plot-panel .sl-tile').first();
  if (await tile.count()) { await tile.click(); await page.waitForTimeout(800); }
  await shot('city-placed');
  await tap('Skyline');
  await page.waitForTimeout(1200);
  await shot('skyline');
  await tap('Close the Skyline');
  await tap('Fly over');
  await page.waitForTimeout(3000);
  await shot('fly-over');
  await page.locator('.city-canvas').click({ position: { x: 30, y: 30 } }); // a tap stops it

  // ---------- a Job, driven by a held finger ----------
  const jobStart = Date.now();
  await tap('Job');
  await page.waitForTimeout(1000);
  await shot('job-card');
  await tap('Go');
  await page.waitForTimeout(1500);
  const canvas = page.locator('.job-canvas');
  let down = false;
  for (let i = 0; i < 900 && !(await page.locator('.job-result').count()); i++) {
    const spot = await page.evaluate(() => (window as unknown as { __job?: { next(): { x: number; y: number } | null } }).__job?.next() ?? null);
    const box = (await canvas.boundingBox())!;
    if (spot) {
      await page.mouse.move(box.x + Math.max(60, Math.min(box.width - 60, spot.x)), box.y + Math.max(90, Math.min(box.height - 60, spot.y)));
      if (!down) { await page.mouse.down(); down = true; }
    }
    if (i === 30) await shot('job-driving');
    await page.waitForTimeout(100);
  }
  await page.mouse.up();
  if (!(await page.locator('.job-result').count())) problems.push('the Job never finished');
  jobSeconds = (Date.now() - jobStart) / 1000;
  await page.waitForTimeout(1500);
  await shot('job-done');
  after = (await saved()).city;
  if (!after?.done || after.done <= (before.city?.done ?? 0)) problems.push('the Job was not counted');
} catch (e) {
  problems.push(`stopped: ${String(e).split('\n')[0]}`);
  await page.screenshot({ path: `${out}/${tag}-stopped.png` }).catch(() => {});
}

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
console.log(`${tag}: ${asked} questions, missed in ${[...missedKinds].join(' ')}, ${clips} voice clips played; Round ${roundSeconds.toFixed(0)}s, Job ${jobSeconds.toFixed(0)}s, whole tour ${((Date.now() - started) / 1000).toFixed(0)}s; Jobs done ${after?.done}`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
