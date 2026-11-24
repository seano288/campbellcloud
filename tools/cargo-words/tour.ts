// Plays Cargo Words in a real browser, as a child who taps: the Start screen and Home, a whole Round (missing on purpose, twice, the
// first question of each kind, so both lessons run, tapping each container through the fuller one, then answering right), the end of
// the Round, a purchase at the Port, a go at the Crane (dragging the trolley once, tapping containers and the ship, lowering with the
// button once) until the ship sails, its results, the Sea Chart and "Watch it run", with screenshots. Answers are read from the page
// (window.__round in dev) and given as he would; every tap waits for the question to be said. It fails on buttons off screen, under 44px
// or in the bottom 56px.
//   npm run dev:cargo-words   (in another shell)
//   npx tsx tools/cargo-words/tour.ts <url> <outDir>
// TOUR_ROUNDS=n plays n Rounds (1 by default). TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080
// upright). TOUR_SAVE=fresh|levels: a brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=1|2|3 picks another) and some
// Bolts; at Level 3 he hasn't met the new syllable types yet, so the Meetings come. TOUR_WINDOW=0..10 sets how far into the Level he is.
// TOUR_ONLY=split (or another kind) opens only that kind in the levels save, to look at one kind on every screen size.
// TOUR_MISS=all misses twice on every question, not only the first of each kind. It also fails on any request that 404s, a line with no
// clip, two voice clips playing at once, and the sound left paused (it pauses it on purpose before the second question, as the iPad does).
import { mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const [url = 'http://localhost:5167/', out = '/tmp/cargo-words-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['count', 'build', 'split', 'read', 'r', 'addon'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2), WINDOW = Number(process.env.TOUR_WINDOW ?? 5), ONLY = process.env.TOUR_ONLY;
const levels = {
  version: 1, balance: 40, words: [],
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: Array.from({ length: WINDOW }, () => 'clean'), opened: !ONLY || ONLY === m, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: LEVEL === 3 ? [] : ['open', 'le', 'y'],
    tuneUp: { count: { asked: 3, clean: 3, misses: 0 }, build: { asked: 3, clean: 3, misses: 0 } },
  },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;
const tag = `${viewName}-${save ? `L${LEVEL}` : 'new'}`;

const browser = process.env.TOUR_BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true });
await page.addInitScript(() => {
  const w = window as unknown as { __clips: number; __overlaps: string[]; __ctx?: AudioContext }, start = AudioBufferSourceNode.prototype.start, stop = AudioBufferSourceNode.prototype.stop;
  w.__clips = 0; w.__overlaps = [];
  // voice clips (recorded buffers longer than a blip): two playing at once means a chained line overlapped or cut itself off
  const playing = new Map<AudioBufferSourceNode, number>();
  AudioBufferSourceNode.prototype.start = function (...a: Parameters<typeof start>) {
    if ((this.buffer?.duration ?? 0) > .05 && (this as unknown as { voice?: boolean }).voice) {
      w.__clips++;
      // one that has reached its end is done, even if its 'ended' event hasn't come round yet (the next clip starts from the one before)
      const now = this.context.currentTime;
      for (const [s, end] of playing) if (end <= now + 0.03) playing.delete(s);
      if (playing.size) w.__overlaps.push(`${playing.size} playing at clip ${w.__clips} (${[...playing.values()].map(e => (e - now).toFixed(2)).join(',')}s left)`);
      playing.set(this, now + this.buffer!.duration);
      this.addEventListener('ended', () => playing.delete(this));
    }
    return start.apply(this, a);
  };
  // the voice plays straight to the speakers; the noise in the sound effects goes through a filter first
  const connect = AudioBufferSourceNode.prototype.connect as (...a: unknown[]) => unknown;
  AudioBufferSourceNode.prototype.connect = function (this: AudioBufferSourceNode, ...a: unknown[]) { if (a[0] instanceof AudioDestinationNode) (this as unknown as { voice?: boolean }).voice = true; return connect.apply(this, a); } as typeof AudioBufferSourceNode.prototype.connect;
  AudioBufferSourceNode.prototype.stop = function (...a: Parameters<typeof stop>) { playing.delete(this); return stop.apply(this, a); };
  const Ctx = window.AudioContext;
  window.AudioContext = class extends Ctx { constructor(...a: ConstructorParameters<typeof Ctx>) { super(...a); w.__ctx = this; } } as typeof AudioContext;
});
page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
page.on('requestfailed', r => problems.push(`request failed: ${r.url()} ${r.failure()?.errorText ?? ''}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('cargo-words-place');
  if (s) localStorage.setItem('cargo-words-save', JSON.stringify(s)); else localStorage.removeItem('cargo-words-save');
}, save);

let n = 0;
const t0 = Date.now();
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.cw');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      const tray = el.closest('.cw-tray,.cw-tabs,.cw-chart,.cw-side-panel');
      if (tray) { // it scrolls: only the tray itself must be on screen, and a tile tall and wide enough
        const t = tray.getBoundingClientRect();
        if (t.right > innerWidth + 1) out.push(`off screen: the ${tray.className} tray`);
        if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
        continue;
      }
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`off screen: ${el.getAttribute('aria-label') ?? el.className}`);
      else if (r.bottom > innerHeight - 56) out.push(`in the bottom band (${Math.round(innerHeight - r.bottom)}px up): ${el.getAttribute('aria-label') ?? el.className}`);
      // the cuts between letters are 44px wide and as tall as the word
      if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
}

type Q = { mode: string; meeting?: string; level?: number; q?: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
let lessonTaps = 0;
async function ready(ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    // the fuller lesson waits for him to tap each container in turn
    if (await page.locator('.game.cw[data-lesson="tap"]').count()) { await page.locator('.cw-lesson-row button').first().click(); lessonTaps++; await page.waitForTimeout(200); continue; }
    if (await page.locator('.game.cw[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true;
    await page.waitForTimeout(150);
  }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
const tab = (label: string) => page.getByRole('tab', { name: label, exact: true }).first().click();

/** Loads containers in this order by tapping them on the quay. */
async function loadBoxes(order: string[]) { for (const b of order) { await page.locator('.cw-quay-row button', { hasText: b }).and(page.getByRole('button', { name: b, exact: true })).first().click(); await page.waitForTimeout(150); } }

/** Answers as he would, or misses on purpose: `second` picks a different wrong answer from the first miss. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q!;
  const pickWrong = <T,>(xs: T[], right: T) => { const w = xs.filter(x => x !== right); return (second && w[1] !== undefined ? w[1] : w[0]) as T; };
  switch (q.kind) {
    case 'count': { const right = q.syls.length; await tap(String(miss ? pickWrong(q.choices, right) : right)); return; }
    case 'split': {
      const letters = [...q.word as string], at = miss ? pickWrong(letters.slice(0, -1).map((_, i) => i + 1), q.at) : q.at;
      await tap(`Split after ${letters.slice(0, at).join('')}`); return;
    }
    case 'read': { const w = miss ? pickWrong(q.choices, q.word) : q.word; await tap(`Picture ${q.choices.indexOf(w) + 1}`); return; }
    case 'build': case 'r': {
      if (q.kind === 'r' && q.form === 'gap') { await tap(miss ? pickWrong(q.choices, q.right) : q.right); return; }
      if (q.kind === 'r' && q.form === 'read') { const w = miss ? pickWrong(q.choices, q.word) : q.word; await tap(`Picture ${q.choices.indexOf(w) + 1}`); return; }
      const right = q.syls as string[];
      const wrong = q.spare && second ? [q.spare, ...right.slice(1)] : [...right].reverse();
      await loadBoxes(miss ? wrong : right); return;
    }
    case 'addon': {
      if (q.form === 'pic') { const pic = q.add.pic; const w = miss ? pickWrong(q.choices, pic) : pic; await tap(`Picture ${q.choices.indexOf(w) + 1}`); return; }
      if (q.form === 'means') { await tap(miss ? pickWrong(q.choices, q.word) : q.word); return; }
      if (q.form === 'hide') { await tap(miss ? pickWrong(q.choices, q.add.base) : q.add.base); return; }
      const idx = q.sizes.map((_: number, i: number) => i); await tap(`Choice ${(miss ? pickWrong(idx, q.right) : q.right) + 1}`); return;
    }
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
      // one deliberate miss in every kind he meets (TOUR_MISS=all: two misses on every question)
      const miss = process.env.TOUR_MISS === 'all' || !missedKinds.has(p.mode);
      // the Math Bots bug: the device pauses the sound mid-Round; his next tap must wake it, and the voice carry on
      if (asked === 2) await page.evaluate(() => (window as unknown as { __ctx?: AudioContext }).__ctx?.suspend());
      await answer(p, miss);
      if (miss) {
        missedKinds.add(p.mode);
        await page.waitForTimeout(1600);
        await shot(`q${asked}-lesson`);
        await ready(40000);
        await answer(p, true, true); // a second miss gets the fuller lesson, with him tapping each container
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

// ---------- the Port: buy something (after the go at the Crane if a Round with misses didn't pay enough) ----------
await tap('Port');
await page.waitForTimeout(1200);
await shot('port');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('cargo-words-save') ?? '{}'));
async function buySomething() {
  const balance = (await saved()).balance ?? 0;
  const [tabName, item, id, price] = balance >= 6 ? ['Build', 'Bollards', 'piece:bollards', 6] : ['Decorations', 'Benches', 'decor:benches', 5];
  if (balance < price) return false;
  await tab(tabName);
  await page.waitForTimeout(300);
  await tap(item);
  await page.waitForTimeout(600);
  await shot('port-picked');
  await tap('Buy');
  await page.waitForTimeout(2500);
  if (!(await saved()).port?.owned?.includes(id)) problems.push(`${item} was not bought with ${balance} Bolts`);
  await shot('port-bought');
  return true;
}
const boughtFirst = await buySomething();
for (const t of ['Cranes', 'Ships', 'Paint', 'Containers']) { await tab(t); await page.waitForTimeout(250); await shot(`port-${t.toLowerCase()}`); }

// ---------- a go at the Crane ----------
const goStart = Date.now();
await page.getByRole('button', { name: /^Load a ship for/ }).first().click();
await page.waitForTimeout(1000);
await shot('crane-card');
await tap('Go');
await page.waitForTimeout(1500);
await shot('crane-start');
const canvas = page.locator('.cw-canvas');
let dragged = false, lowered = false, shots = 0;
for (let i = 0; i < 600 && !(await page.locator('.fl-result').count()); i++) {
  const info = await page.evaluate(() => {
    const w = window as unknown as { __crane?: { mode: string; lowerAt: number | null; phase: string; boxes: { where: string; col: number; id: number }[]; quayX0: number; shipX0: number; ship: { cols: number; tiers: number } }; __scene?: { toWorld(x: number): number } };
    const c = w.__crane, s = w.__scene;
    if (!c || !s) return null;
    const a = s.toWorld(0), b = s.toWorld(100), k = 100 / (b - a);
    const held = c.boxes.some(x => x.where === 'grab');
    const next = c.boxes.filter(x => x.where === 'quay').sort((x, y) => x.id - y.id)[0];
    let target: number | null = null;
    if (!held && next) target = (c.quayX0 + next.col * 8 + 4 - a) * k;
    if (held) for (let tier = 0; tier < c.ship.tiers && target === null; tier++) for (let col = 0; col < c.ship.cols; col++) if (c.boxes.filter(x => x.where === 'ship' && x.col === col).length === tier) { target = (c.shipX0 + col * 8 + 4 - a) * k; break; }
    return { busy: c.mode !== 'rest' || c.lowerAt !== null, phase: c.phase, target, held };
  });
  const box = (await canvas.boundingBox())!;
  if (info && !info.busy && info.phase === 'loading' && info.target !== null) {
    const x = box.x + info.target, y = box.y + box.height * 0.45;
    if (!dragged && info.held) {
      // he drags the trolley over the ship, then lowers with the button
      await page.mouse.move(box.x + 40, y); await page.mouse.down(); await page.mouse.move(x, y, { steps: 12 }); await page.waitForTimeout(900);
      if (!shots++) await shot('crane-drag');
      await page.mouse.up(); dragged = true; await page.waitForTimeout(400);
      await tap('Lower the grab'); lowered = true;
    } else await page.mouse.click(x, y);
    if (i === 6) await shot('crane-loading');
  }
  await page.waitForTimeout(250);
}
if (!(await page.locator('.fl-result').count())) problems.push('the ship never sailed');
if (!lowered) problems.push('never lowered with the button');
const goSecs = (Date.now() - goStart) / 1000;
await page.waitForTimeout(2500);
await shot('crane-result');
const after = (await saved()).port;
if (!after?.goes) problems.push('the go was not counted');

// ---------- the Sea Chart, and Watch it run ----------
await tap('Port');
await page.waitForTimeout(800);
if (!boughtFirst && !(await buySomething())) problems.push(`only ${(await saved()).balance} Bolts after a Round and a go`);
await tap('Sea Chart');
await page.waitForTimeout(800);
await shot('chart');
await tap('Home');
await page.waitForTimeout(600);
await tap('Port');
await page.waitForTimeout(600);
await tap('Watch it run');
await page.waitForTimeout(5000);
await shot('watch');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
const overlaps = await page.evaluate(() => (window as unknown as { __overlaps: string[] }).__overlaps);
if (overlaps.length) problems.push(`voice clips overlapped ${overlaps.length} times: ${overlaps.slice(0, 3).join('; ')}`);
if (await page.evaluate(() => (window as unknown as { __ctx?: AudioContext }).__ctx?.state) !== 'running') problems.push('the sound is still paused at the end');
console.log(`${tag}: ${asked} questions, missed in ${[...missedKinds].join(' ')}, ${lessonTaps} lesson taps, ${clips} voice clips played, Round ${roundSecs.toFixed(0)}s, Crane ${goSecs.toFixed(0)}s, goes ${after?.goes ?? 0}, total ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
