// Plays Jetway in a real browser, as a child who taps: the Start screen and Home, a whole Round (missing on purpose, twice, the first
// question of each kind, so both lessons run, tapping the arrow through the fuller one, then answering right), the end of the Round, a
// purchase at the Airport, a Flight led by a held finger from the gate to the runway, the throttle held, the cruise and the landing,
// its results, the Routes board and "Watch it run", with screenshots. Answers are read from the page (window.__round in dev) and turned
// in on the wheels as he would; every tap waits for the question to be said. It fails on buttons off screen or under 44px.
//   npm run dev:jetway   (in another shell)
//   npx tsx tools/jetway/tour.ts <url> <outDir>
// TOUR_ROUNDS=n plays n Rounds (1 by default). TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080
// upright). TOUR_SAVE=fresh|levels: a brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=1|2|3 picks another) and some
// Bolts; at Level 3 he hasn't met the seat blocks or the signs yet. TOUR_WINDOW=0..10 sets how far into the Level he is (5 by default:
// Stretch 2; 0 asks the Level's first forms). TOUR_BROWSER=webkit plays in WebKit.
import { mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const [url = 'http://localhost:5177/', out = '/tmp/jetway-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['add', 'hundreds', 'take', 'hop', 'gap'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2), WINDOW = Number(process.env.TOUR_WINDOW ?? 5);
const levels = {
  version: 1, balance: 40,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: Array.from({ length: WINDOW }, () => 'clean'), opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: LEVEL === 3 ? [] : ['blocks', 'signs'],
    tuneUp: { add: { asked: 3, clean: 3, misses: 0 }, hundreds: { asked: 3, clean: 3, misses: 0 } },
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
  localStorage.removeItem('jetway-place');
  if (s) localStorage.setItem('jetway-save', JSON.stringify(s)); else localStorage.removeItem('jetway-save');
}, save);

let n = 0;
const t0 = Date.now();
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.jw');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      const tray = el.closest('.jw-tray,.routes-body,.jw-tabs');
      if (tray) { // it scrolls: only the tray itself must be on screen, and a tile tall and wide enough
        const t = tray.getBoundingClientRect();
        if (t.bottom > innerHeight + 1 || t.right > innerWidth + 1) out.push(`off screen: the ${tray.className} tray`);
        if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
        continue;
      }
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`off screen: ${el.getAttribute('aria-label') ?? el.className}`);
      if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
    }
    // numbers printed over each other on a picture (the runway line once labelled every ten from 700 to 1000)
    const texts = [...document.querySelectorAll('.game.jw svg text')].map(t => [t.textContent, t.getBoundingClientRect()] as const).filter(([s, b]) => b.width && s);
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const [ta, a] = texts[i]!, [tb, b] = texts[j]!;
      if (a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2) out.push(`"${ta}" printed over "${tb}"`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
}

type Q = { mode: string; meeting?: string; level?: number; q?: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await page.locator('.game.jw[data-lesson="next"]').count()) { await tap('Next step'); continue; } // the fuller lesson waits on the arrow
    if (await page.locator('.game.jw[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true;
    await page.waitForTimeout(150);
  }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
const tab = (label: string) => page.getByRole('tab', { name: label, exact: true }).first().click();
const SIGN: Record<string, string> = { '<': 'Less than', '=': 'Same as', '>': 'More than' };

/** Turns the wheels to a number, digit by digit, from what they show now (a miss leaves his number there). */
async function wheelsTo(target: number) {
  const names = (await page.locator('.jw-wheels .numwheel').count()) === 3 ? ['hundreds', 'tens', 'ones'] : ['tens', 'ones'];
  const want = String(target).padStart(names.length, '0').slice(-names.length).split('').map(Number);
  for (const [i, name] of names.entries()) {
    const now = Number(await page.locator(`.jw-wheels .wheel-${name} .digit`).textContent());
    const up = (want[i]! - now + 10) % 10;
    for (let k = 0; k < (up <= 5 ? up : 10 - up); k++) await tap(`${name} ${up <= 5 ? 'up' : 'down'}`);
  }
  await tap('Done');
}

/** Answers as he would, or misses on purpose: `second` picks a different wrong answer from the first miss, where there is one. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q!;
  const wrongOf = (xs: string[]) => { const w = xs.filter(x => x !== String(q.answer)); return (second && w[1]) || w[0]!; };
  if (q.kind === 'add' || q.kind === 'take' || q.kind === 'gap') {
    const right = Number(q.answer), trap = q.kind === 'add' ? q.traps.noCarry : q.kind === 'take' ? q.traps.smallFromBig : null;
    await wheelsTo(miss ? (second ? right + 1 : trap ?? right + 10) : right);
  } else if (q.kind === 'hundreds') {
    if (q.form === 'more') await tap(`Plane with ${(miss ? (q.answer === 'a' ? 'b' : 'a') : q.answer) === 'a' ? q.a : q.b} seats`);
    else if (q.form === 'sign') await tap(SIGN[miss ? wrongOf(['<', '=', '>']) : q.answer]!);
    else if (q.form === 'digit') { const d = String(q.n).split(''); await tap(`Digit ${miss ? wrongOf(d) : q.answer}`); }
    else await tap(miss ? wrongOf(q.choices.map(String)) : String(q.answer));
  } else if (q.kind === 'hop') {
    if (q.form === 'step') await tap(miss ? wrongOf(q.choices.map(String)) : String(q.answer));
    else if (miss) await tap(String(q.firstChoices.find((c: number) => c !== q.first)));
    else { await tap(String(q.first)); await page.waitForTimeout(1500); await tap(String(q.second)); }
  }
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
        // a second miss gets the fuller lesson, walked through with the arrow (or 🔎 where there's only one wrong answer)
        if (p.q?.kind === 'hundreds' && p.q.form === 'more') await tap('Help'); else await answer(p, true, true);
        await page.waitForTimeout(2500);
        await shot(`q${asked}-lesson2`);
        await ready(90000);
        await answer(p, false);
      }
    }
    for (let i = 0; i < 130; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
  }
}
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
const roundSecs = (Date.now() - roundStart) / 1000;
await shot('round-done-awake');

// ---------- the Airport: buy something ----------
await tap('Airport');
await page.waitForTimeout(1200);
await shot('airport');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('jetway-save') ?? '{}'));
const balance = (await saved()).balance ?? 0;
const [tabName, item, price] = balance >= 10 ? ['Build', 'Ticket Hut', 10] : ['Paint', 'Rocket Red', 3];
await tab(tabName);
await page.waitForTimeout(300);
await tap(item);
await page.waitForTimeout(600);
await shot('airport-picked');
if (balance >= price) {
  await tap('Buy');
  await page.waitForTimeout(2500);
  if (!(await saved()).airport?.owned?.some((k: string) => k === (item === 'Ticket Hut' ? 'piece:hut' : 'paint:red'))) problems.push(`${item} was not bought with ${balance} Bolts`);
  await shot('airport-bought');
} else problems.push(`only ${balance} Bolts after a Round`);
for (const t of ['Planes', 'Tails', 'Signs']) { await tab(t); await page.waitForTimeout(250); await shot(`airport-${t.toLowerCase()}`); }

// ---------- a Flight: the taxi led by a held finger, the throttle held, the cruise and the landing ----------
const flightStart = Date.now();
await page.getByRole('button', { name: /^Fly to/ }).first().click();
await page.waitForTimeout(1000);
await shot('flight-card');
await tap('Go');
await page.waitForTimeout(1500);
await shot('flight-taxi');
const canvas = page.locator('.fl-canvas');
let held = false;
for (let i = 0; i < 900 && !(await page.locator('.fl-result').count()); i++) {
  const info = await page.evaluate(() => {
    const w = window as unknown as { __flight?: { phase: string; tx: number; ty: number; pathAt: number; setup: { taxi: { from: { x: number; y: number } } | null }; x: number; alt: number }; __scene?: { toPlot(x: number, y: number): { x: number; y: number } } };
    const f = w.__flight;
    if (!f) return null;
    return { phase: f.phase, pathAt: f.pathAt, from: f.setup.taxi?.from ?? null, tx: f.tx, ty: f.ty };
  });
  const box = (await canvas.boundingBox())!;
  if (info?.phase === 'taxi') {
    // hold a finger just ahead of the plane along the taxiway, as he would
    const path = info.from ? [info.from, { x: info.from.x, y: 610 }, { x: 250, y: 610 }, { x: 250, y: 670 }] : [];
    const goal = path[Math.min(path.length - 1, info.pathAt)]!;
    const spot = await page.evaluate(([gx, gy]) => {
      const s = (window as unknown as { __scene: { toPlot(x: number, y: number): { x: number; y: number } } }).__scene;
      // find the screen point for this plot point by inverting toPlot on two probes
      const a = s.toPlot(0, 0), b = s.toPlot(100, 100), k = 100 / (b.x - a.x);
      return { x: (gx! - a.x) * k, y: (gy! - a.y) * k };
    }, [goal.x, goal.y]);
    const x = Math.max(box.x + 20, Math.min(box.x + box.width - 20, box.x + spot.x)), y = Math.max(box.y + 20, Math.min(box.y + box.height - 20, box.y + spot.y));
    await page.mouse.move(x, y);
    if (!held) { await page.mouse.down(); held = true; }
    if (i === 12) await shot('flight-taxiing');
  } else if (info?.phase === 'roll') {
    if (held) { await page.mouse.up(); held = false; }
    const b = page.getByRole('button', { name: 'Throttle' });
    if (await b.count()) { const bb = (await b.boundingBox())!; await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(1200); await shot('flight-roll'); await page.mouse.up(); }
  } else if (info?.phase === 'cruise') {
    if (!held) { await page.mouse.move(box.x + box.width * .6, box.y + box.height * .4); await page.mouse.down(); held = true; }
    await page.mouse.move(box.x + box.width * .6, box.y + box.height * (.3 + .2 * Math.sin(i / 6)));
    if (i % 40 === 0) await shot('flight-cruise');
  } else if (info?.phase === 'approach') {
    if (held) { await page.mouse.up(); held = false; } // he lets go: it drifts onto the lights
    if (i % 30 === 0) await shot('flight-approach');
  }
  await page.waitForTimeout(100);
}
if (held) await page.mouse.up();
if (!(await page.locator('.fl-result').count())) problems.push('the Flight never finished');
const flightSecs = (Date.now() - flightStart) / 1000;
await page.waitForTimeout(2500);
await shot('flight-result');
const after = (await saved()).airport;
if (!after?.flown) problems.push('the Flight was not counted');

// ---------- the Routes board, and Watch it run ----------
await tap('Airport');
await page.waitForTimeout(800);
await tap('Routes');
await page.waitForTimeout(800);
await shot('routes');
await tap('Airport');
await page.waitForTimeout(600);
await tap('Watch it run');
await page.waitForTimeout(6000);
await shot('watch');
await page.waitForTimeout(8000);
await shot('watch-later');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
console.log(`${tag}: ${asked} questions, missed in ${[...missedKinds].join(' ')}, ${clips} voice clips played, Round ${roundSecs.toFixed(0)}s, Flight ${flightSecs.toFixed(0)}s, flown ${after?.flown ?? 0}, total ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
