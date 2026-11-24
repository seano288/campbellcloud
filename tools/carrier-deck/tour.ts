// Plays Carrier Deck in a real browser, as a child who taps: the Start screen and Home, a whole Round (missing on purpose, twice, the
// first question of each kind, so both lessons run, tapping the arrow through the fuller one, then answering right), the end of the
// Round, a purchase on the Carrier, a Mission (the catapult held and let go, the job flown with a held finger, the landing lights down to
// a wire), its results, the Chart and "Watch the deck", with screenshots. Answers are read from the page (window.__round in dev) and
// turned in on the wheels as he would; every tap waits for the story to be said. It fails on buttons off screen, under 44px or in the
// bottom 56px.
//   npm run dev:carrier-deck   (in another shell)
//   npx tsx tools/carrier-deck/tour.ts <url> <outDir>
// TOUR_ROUNDS=n plays n Rounds (1 by default). TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080
// upright). TOUR_SAVE=fresh|levels: a brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=1|2|3 picks another) and some
// Bolts; at Level 3 he hasn't met the bar graph yet. TOUR_WINDOW=0..10 sets how far into the Level he is (5 by default: Stretch 2).
import { mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const [url = 'http://localhost:5189/', out = '/tmp/carrier-deck-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['one', 'pick', 'compare', 'two', 'board'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2), WINDOW = Number(process.env.TOUR_WINDOW ?? 5);
const levels = {
  version: 1, balance: 40,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: Array.from({ length: WINDOW }, () => 'clean'), opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: LEVEL === 3 ? [] : ['graph', 'scale'],
    tuneUp: { one: { asked: 3, clean: 3, misses: 0 }, pick: { asked: 3, clean: 3, misses: 0 } },
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
  localStorage.removeItem('carrier-deck-place');
  if (s) localStorage.setItem('carrier-deck-save', JSON.stringify(s)); else localStorage.removeItem('carrier-deck-save');
}, save);

let n = 0;
const t0 = Date.now();
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.cd');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      const tray = el.closest('.cd-tray,.chart-body,.cd-tabs');
      if (tray) { // it scrolls: only the tray itself must be on screen, and a tile tall and wide enough
        const t = tray.getBoundingClientRect();
        if (t.bottom > innerHeight + 1 || t.right > innerWidth + 1) out.push(`off screen: the ${tray.className} tray`);
        if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
        continue;
      }
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`off screen: ${el.getAttribute('aria-label') ?? el.className}`);
      else if (r.bottom > innerHeight - 56) out.push(`in the bottom band (${Math.round(innerHeight - r.bottom)}px up): ${el.getAttribute('aria-label') ?? el.className}`);
      if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
}

type Q = { mode: string; meeting?: string; level?: number; q?: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await page.locator('.game.cd[data-lesson="next"]').count()) { await tap('Next step'); continue; } // the fuller lesson waits on the arrow
    if (await page.locator('.game.cd[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true;
    await page.waitForTimeout(150);
  }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
const tab = (label: string) => page.getByRole('tab', { name: label, exact: true }).first().click();

/** Turns the two wheels to a number, from what they show now (a miss leaves his number there). */
async function wheelsTo(target: number) {
  const want = String(Math.max(0, Math.min(99, target))).padStart(2, '0').split('').map(Number);
  for (const [i, name] of ['tens', 'ones'].entries()) {
    const now = Number(await page.locator(`.cd-wheels .wheel-${name} .digit`).textContent());
    const up = (want[i]! - now + 10) % 10;
    for (let k = 0; k < (up <= 5 ? up : 10 - up); k++) await tap(`${name} ${up <= 5 ? 'up' : 'down'}`);
  }
  await tap('Done');
}

/** Answers as he would, or misses on purpose: a real mistake first (the other operation, the first step), then another number. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q!;
  if (q.kind === 'pick') {
    const wrong = (q.choices as string[]).filter(c => c !== q.answer);
    await tap(miss ? (second && wrong[1]) || wrong[0]! : q.answer);
    return;
  }
  if (q.kind === 'two') {
    const s = q.story;
    if (q.stepped) {
      if (miss) { await wheelsTo(s.middle + (second ? 2 : 1)); return; }
      if (!(await page.locator('.cd-middle').count())) { await wheelsTo(s.middle); await page.waitForTimeout(400); }
      await page.locator('.game.cd[data-ready="yes"]').waitFor({ timeout: 30000 });
      await wheelsTo(s.answer);
      return;
    }
    await wheelsTo(miss ? (second ? s.answer + 1 : s.middle) : s.answer);
    return;
  }
  const right = Number(q.answer);
  if (!miss) { await wheelsTo(right); return; }
  if (q.kind === 'board') { await wheelsTo(second ? right + 1 : right + q.step); return; }
  const said = (q.story.sentences as { nums: number[] }[]).flatMap(x => x.nums);
  const other = q.story.op === 'add' ? Math.abs(said[0]! - said[1]!) : said[0]! + said[1]!;
  await wheelsTo(second ? (right + 1) % 100 : other <= 99 && other !== right ? other : (right + 10) % 100);
}

// ---------- Start and Home ----------
await page.goto(url);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
await shot('start');
await page.getByLabel('Start').click({ timeout: 30000 });
await page.waitForTimeout(800);
await shot('home');

// ---------- a Round (TOUR_ROUNDS of them) ----------
const roundStart = Date.now();
await tap('Play');
const missedKinds = new Set<string>(), ROUNDS = Number(process.env.TOUR_ROUNDS ?? 1);
let asked = 0;
for (let r = 1; r <= ROUNDS; r++) {
  if (r > 1) {
    await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
    await tap('Play again');
    missedKinds.clear();
  }
  for (let guard = 0; guard < 30; guard++) {
    if (await page.locator('.reward h2').isVisible()) break;
    const p = await question();
    if (!p) { await page.waitForTimeout(300); continue; }
    await ready();
    const id = p.mode === 'meet' ? `meet-${p.meeting}` : `${p.mode}-L${p.level}-${p.q?.form ?? p.q?.story?.id ?? ''}`;
    await shot(`q${++asked}-${id}`);
    if (p.mode === 'meet') await tap('Go');
    else {
      const miss = !missedKinds.has(p.mode); // one deliberate miss in every kind he meets
      await answer(p, miss);
      if (miss) {
        missedKinds.add(p.mode);
        await page.waitForTimeout(1600);
        await shot(`q${asked}-lesson`);
        await ready(60000);
        // a second miss gets the fuller lesson, walked through with the arrow (or 🔎 where only one choice is left)
        if (p.q?.kind === 'pick' && (p.q.choices as string[]).length === 2) await tap('Help'); else await answer(p, true, true);
        await page.waitForTimeout(2500);
        await shot(`q${asked}-lesson2`);
        await ready(120000);
        await answer(p, false);
      }
    }
    for (let i = 0; i < 160; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
  }
}
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
const roundSecs = (Date.now() - roundStart) / 1000;
await shot('round-done-awake');

// ---------- the Carrier: buy something ----------
await tap('Carrier');
await page.waitForTimeout(1200);
await shot('carrier');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('carrier-deck-save') ?? '{}'));
const balance = (await saved()).balance ?? 0;
const [tabName, item, id, price] = balance >= 8 ? ['Ship', 'Ship Section 1', 'part:hull1', 8] : ['Paint', 'Sea Grey', 'paint:grey', 3];
await tab(tabName as string);
await page.waitForTimeout(300);
await tap(item as string);
await page.waitForTimeout(600);
await shot('carrier-picked');
if (balance >= (price as number)) {
  await tap('Buy');
  await page.waitForTimeout(2500);
  if (!(await saved()).ship?.owned?.includes(id)) problems.push(`${item} was not bought with ${balance} Bolts`);
  await shot('carrier-bought');
} else problems.push(`only ${balance} Bolts after a Round`);
for (const t of ['Air Wing', 'Flags', 'Fleet', 'Crew']) { await tab(t); await page.waitForTimeout(250); await shot(`carrier-${t.toLowerCase().replace(' ', '-')}`); }
for (const v of ['Top', 'Inside', 'Side']) { await tap(v); await page.waitForTimeout(400); if (v !== 'Side') await shot(`carrier-${v.toLowerCase()}`); }

// ---------- a Mission: the catapult held and let go, the job with a held finger, the lights down to a wire ----------
const missionStart = Date.now();
await tap('Fly');
await page.waitForTimeout(1000);
await shot('mission-card');
await tap('Go');
await page.waitForTimeout(1500);
await shot('mission-deck');
const canvas = page.locator('.ms-canvas');
const launch = page.getByRole('button', { name: 'Launch' });
{ const bb = (await launch.boundingBox())!; await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(900); await shot('mission-gauge'); await page.waitForTimeout(500); await page.mouse.up(); }
let held = false;
for (let i = 0; i < 1500 && !(await page.locator('.ms-result').count()); i++) {
  const info = await page.evaluate(() => {
    const w = window as unknown as { __mission?: { phase: string; x: number; alt: number; vx: number; stern: number; targets: { x: number; alt: number; passed: boolean }[]; islands: { x: number; dropped: boolean }[]; hovering: number | null }; __scene?: { toAlt(y: number): number } };
    const m = w.__mission, s = w.__scene;
    if (!m || !s) return null;
    // (no named helpers in here: the page can't see tsx's __name)
    const next = m.targets.find(t => !t.passed), y0 = s.toAlt(0), perPx = y0 - s.toAlt(100); // alt units per 100px
    const want = m.phase === 'approach' ? 90 + Math.max(0, Math.min(1, (m.stern - m.x - m.vx * .25) / 2300)) * (330 - 90) : m.hovering !== null ? 60 : next ? next.alt : 220;
    return { phase: m.phase, y: (y0 - want) / perPx * 100 };
  });
  const box = (await canvas.boundingBox())!;
  if (info && info.phase !== 'deck' && info.phase !== 'catapult' && info.phase !== 'trap' && info.phase !== 'done' && info.phase !== 'around') {
    const y = Math.max(box.y + 30, Math.min(box.y + box.height - 70, box.y + info.y));
    await page.mouse.move(box.x + box.width * .55, y);
    if (!held) { await page.mouse.down(); held = true; }
    if (await page.getByRole('button', { name: 'Drop' }).count()) {
      await page.mouse.up(); held = false;
      await page.getByRole('button', { name: 'Drop' }).click({ timeout: 2000 }).catch(() => {});
    }
    if (i % 60 === 10) await shot(`mission-${info.phase}`);
  } else if (held) { await page.mouse.up(); held = false; }
  await page.waitForTimeout(100);
}
if (held) await page.mouse.up();
if (!(await page.locator('.ms-result').count())) problems.push('the Mission never finished');
const missionSecs = (Date.now() - missionStart) / 1000;
await page.waitForTimeout(2500);
await shot('mission-result');
const after = (await saved()).ship;
if (!after?.flown) problems.push('the Mission was not counted');

// ---------- the Chart, and Watch the deck ----------
await tap('Carrier');
await page.waitForTimeout(800);
await tap('Chart');
await page.waitForTimeout(800);
await shot('chart');
await tap('Carrier');
await page.waitForTimeout(600);
await tap('Watch the deck');
await page.waitForTimeout(5000);
await shot('watch');
await page.waitForTimeout(6000);
await shot('watch-later');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
console.log(`${tag}: ${asked} questions, missed in ${[...missedKinds].join(' ')}, ${clips} voice clips played, Round ${roundSecs.toFixed(0)}s, Mission ${missionSecs.toFixed(0)}s, flown ${after?.flown ?? 0}, total ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
