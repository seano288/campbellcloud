// Plays Rover Code in a real browser, as a child who taps: the Start screen and Home, a whole Round (with one deliberate miss, so a
// lesson runs), the end of the Round, a purchase at the Space Base, a launch, the flight and the planet drive to the flag, with
// screenshots. Answers are read from the page (window.__round in dev), and every tap waits for the question to be said first.
//   npm run dev:rover-code   (in another shell)
//   npx tsx tools/rover-code/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a
// brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=1|2|3 picks another) and some Bolts. TOUR_BROWSER=webkit plays in WebKit.
import { mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const [url = 'http://localhost:5198/', out = '/tmp/rover-code-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['drive', 'pattern', 'bug', 'loop'];
const levels = {
  version: 1, balance: 30,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: Number(process.env.TOUR_LEVEL ?? 2), window: ['clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: ['program', 'loop'],
    tuneUp: { drive: { asked: 3, clean: 3, misses: 0 }, pattern: { asked: 3, clean: 3, misses: 0 } },
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
  localStorage.removeItem('rover-code-place');
  if (s) localStorage.setItem('rover-code-save', JSON.stringify(s)); else localStorage.removeItem('rover-code-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${viewName}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.rc');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
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
  while (Date.now() - t < ms) { if (await page.locator('.game.rc[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const SAID: Record<string, string | undefined> = { U: 'Up', R: 'Right', D: 'Down', L: 'Left' };
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();

async function answer(p: NonNullable<Q>, miss: boolean) {
  const q = p.q!;
  if (q.kind === 'drive') {
    const path: string[] = q.path;
    const program = miss ? path.slice(0, -1) : path;
    for (const d of program.length ? program : [path[0]!]) await tap(SAID[d]!);
    await tap('Go');
  } else if (q.kind === 'pattern') {
    const wrong = (q.choices as string[]).find(c => c !== q.answer)!;
    await tap(label(miss ? wrong : q.answer));
  } else if (q.kind === 'bug') {
    const step = miss ? (q.bug === 0 ? 1 : 0) : q.bug;
    await page.locator('.program button.step').nth(step).click();
    if (!miss && q.choose) { await page.waitForTimeout(300); await ready(); await tap(SAID[q.path[q.bug]]!); }
  } else if (q.kind === 'loop') {
    if (q.form === 'pick') {
      const want = enc(q.blocks), k = (q.options as unknown[]).findIndex(o => enc(o as Block[]) === want), other = k === 0 ? 1 : 0;
      await tap(`Program ${(miss ? other : k) + 1}`);
    } else {
      let di = 0, ti = 0; // focus each blank first, as he would tap it
      for (const [b, block] of (q.blocks as Block[]).entries()) {
        const given = q.given[b];
        if (given.dir === null) { await page.getByRole('button', { name: 'Which way' }).nth(di++).click(); await tap(SAID[block.steps[0]!]!); }
        if (given.times === null) { await page.getByRole('button', { name: 'How many times' }).nth(ti++).click(); await tap(String(miss ? (block.times === 2 ? 3 : block.times - 1) : block.times)); }
      }
      await tap('Go');
    }
  }
}
type Block = { steps: string[]; times: number };
const enc = (bs: Block[]) => bs.map(b => `${b.steps.join('')}${b.times}`).join(',');
const label = (t: string): string => SAID[t] ?? t;

// ---------- Start and Home ----------
await page.goto(url);
await shot('start');
await page.getByLabel('Start').click({ timeout: 30000 });
await page.waitForTimeout(800);
await shot('home');

// ---------- a Round ----------
await tap('Play');
let missed = false, asked = 0;
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready();
  const id = p.mode === 'meet' ? `meet-${p.meeting}` : `${p.mode}-L${p.level}-${p.q?.form ?? ''}`;
  await shot(`q${++asked}-${id}`);
  if (p.mode === 'meet') { await tap('Go'); }
  else {
    const miss = !missed && p.q?.kind !== 'pattern' || (!missed && asked > 2);
    await answer(p, miss);
    if (miss) {
      missed = true;
      await page.waitForTimeout(1600);
      await shot(`q${asked}-lesson`);
      await ready(40000);
      // try again, as he would: clear a drive program first
      if (p.q?.kind === 'drive') for (let i = 0; i < 10; i++) { if (!(await page.locator('.program button.step').count())) break; await tap('Take back a step'); }
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

// ---------- the Space Base: buy a part ----------
await tap('Space Base');
await page.waitForTimeout(1200);
await shot('base');
await page.getByRole('tab', { name: 'Engine' }).click();
await page.waitForTimeout(300);
await tap('Twin Engine');
await page.waitForTimeout(600);
await shot('base-trying');
const balance = await page.evaluate(() => JSON.parse(localStorage.getItem('rover-code-save') ?? '{}').balance ?? 0);
if (balance >= 12) {
  await tap('Buy');
  await page.waitForTimeout(3200);
  const owned = await page.evaluate(() => JSON.parse(localStorage.getItem('rover-code-save') ?? '{}').base?.owned ?? []);
  if (!owned.includes('engine:twin')) problems.push('the Twin Engine was not bought');
  await shot('base-bought');
} else {
  await tap('Buy');
  await page.waitForTimeout(800);
  await tap('Put it back');
  await page.getByRole('tab', { name: 'Paint' }).click();
  await tap('Fire Red');
  await tap('Buy');
  await page.waitForTimeout(3200);
  const owned = await page.evaluate(() => JSON.parse(localStorage.getItem('rover-code-save') ?? '{}').base?.owned ?? []);
  if (!owned.includes('paint:red')) problems.push(`nothing was bought with ${balance} Bolts`);
  await shot('base-bought');
}

// ---------- a launch, the flight and the planet ----------
await page.getByRole('button', { name: /^Launch to/ }).click();
await page.waitForTimeout(800);
await shot('trip-pad');
await tap('Launch');
await page.waitForTimeout(3200);
await shot('trip-blastoff');
const canvas = page.locator('.trip-canvas'), box = (await canvas.boundingBox())!;
// steer back and forth for the flight, as a finger would
for (let i = 0; i < 26 && (await page.locator('.trip-screen.flight').count()); i++) {
  const x = box.x + box.width * (.3 + .4 * ((i % 4) / 3));
  await page.mouse.move(x, box.y + box.height * .8);
  await page.mouse.down();
  await page.waitForTimeout(450);
  if (i === 8) await shot('trip-flight');
  await page.mouse.up();
  await page.waitForTimeout(450);
}
await page.waitForSelector('.trip-screen.drive', { timeout: 20000 }).catch(() => problems.push('the flight never landed'));
await page.waitForTimeout(1500);
await shot('trip-planet');
// drive to the flag: hold ▶, jump now and then
const forward = page.getByRole('button', { name: 'Forward' });
for (let i = 0; i < 60 && !(await page.getByRole('button', { name: 'Plant your flag' }).count()); i++) {
  const fb = (await forward.boundingBox())!;
  await page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  if (i % 3 === 1) await page.keyboard.press(' ');
  await page.mouse.up();
  if (i === 6) await shot('trip-driving');
}
if (await page.getByRole('button', { name: 'Plant your flag' }).count()) {
  await shot('trip-flag');
  await tap('Plant your flag');
  await page.waitForTimeout(2500);
  await shot('trip-result');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('rover-code-save') ?? '{}').base);
  if (!after?.visits || !Object.keys(after.visits).length) problems.push('the trip was not counted');
  if (!after?.gadgets?.length) problems.push('no gadget after a first visit');
} else problems.push('never reached the flag');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
console.log(`${viewName}: ${asked} questions, ${clips} voice clips played`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
