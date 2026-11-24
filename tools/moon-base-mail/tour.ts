// Plays Moon Base Mail in a real browser, as a child who taps: the Start screen and Home, a whole Round (missing on purpose, twice, the
// first question of each kind, so both lessons run, then answering right; tapping a sentence's speaker once), the end of the Round, a
// purchase at the Moon Base, a Landing (steering to the pad and firing the engine, with the button once) to its end, putting the module
// down on a plot, and a walk round the base, with screenshots. Answers are read from the page (window.__round in dev) and given as he
// would; every tap waits for the question to be said. It fails on buttons off screen, under 44px or in the bottom 56px.
//   npm run dev:moon-base-mail   (in another shell)
//   npx tsx tools/moon-base-mail/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (810×1080 upright by default). TOUR_SAVE=fresh|levels: a brand-new player,
// or one with every kind open at Level 2 (TOUR_LEVEL=1|2|3 picks another) and some Bolts, every base word met. TOUR_MISS=all misses twice
// on every question. It also fails on any request that 404s, a line with no clip, two voice clips at once, and the sound left paused.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [url = 'http://localhost:5159/', out = '/tmp/moon-base-mail-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['ask', 'order', 'main', 'infer', 'fact'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2), ONLY = process.env.TOUR_ONLY;
const levels = {
  version: 1, balance: 60,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean', 'clean'], opened: !ONLY || ONLY === m, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: ['g0', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'],
    tuneUp: { ask: { asked: 3, clean: 3, misses: 0 }, order: { asked: 3, clean: 3, misses: 0 } },
  },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;
const tag = `${viewName}-${save ? `L${LEVEL}${ONLY ? `-${ONLY}` : ''}` : 'new'}`;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true });
await page.addInitScript(() => {
  const w = window as unknown as { __clips: number; __overlaps: string[]; __ctx?: AudioContext }, start = AudioBufferSourceNode.prototype.start, stop = AudioBufferSourceNode.prototype.stop;
  w.__clips = 0; w.__overlaps = [];
  const playing = new Map<AudioBufferSourceNode, number>();
  AudioBufferSourceNode.prototype.start = function (...a: Parameters<typeof start>) {
    if ((this.buffer?.duration ?? 0) > .05 && (this as unknown as { voice?: boolean }).voice) {
      w.__clips++;
      const now = this.context.currentTime;
      for (const [s, end] of playing) if (end <= now + 0.03) playing.delete(s);
      if (playing.size) w.__overlaps.push(`${playing.size} playing at clip ${w.__clips}`);
      playing.set(this, now + this.buffer!.duration);
      this.addEventListener('ended', () => playing.delete(this));
    }
    return start.apply(this, a);
  };
  const connect = AudioBufferSourceNode.prototype.connect as (...a: unknown[]) => unknown;
  AudioBufferSourceNode.prototype.connect = function (this: AudioBufferSourceNode, ...a: unknown[]) { if (a[0] instanceof AudioDestinationNode) (this as unknown as { voice?: boolean }).voice = true; return connect.apply(this, a); } as typeof AudioBufferSourceNode.prototype.connect;
  AudioBufferSourceNode.prototype.stop = function (...a: Parameters<typeof stop>) { playing.delete(this); return stop.apply(this, a); };
  const Ctx = window.AudioContext;
  window.AudioContext = class extends Ctx { constructor(...a: ConstructorParameters<typeof Ctx>) { super(...a); w.__ctx = this; } } as typeof AudioContext;
});
page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
page.on('requestfailed', r => { if (!/\.mp3/.test(r.url()) || !/ERR_ABORTED/.test(r.failure()?.errorText ?? '')) problems.push(`request failed: ${r.url()} ${r.failure()?.errorText ?? ''}`); });
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('moon-base-mail-place');
  if (s) localStorage.setItem('moon-base-mail-save', JSON.stringify(s)); else localStorage.removeItem('moon-base-mail-save');
}, save);

let n = 0;
const t0 = Date.now();
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.mb');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    const letter = document.querySelector('.mb-letter');
    if (letter && letter.scrollHeight - letter.clientHeight > 2) out.push(`letter cut off by ${letter.scrollHeight - letter.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      const tray = el.closest('.mb-tray,.mb-tabs,.mb-map-scroll');
      if (tray) { // it scrolls: only the tray itself must be on screen, and a tile tall and wide enough
        const t = tray.getBoundingClientRect();
        if (t.right > innerWidth + 1) out.push(`off screen: the ${tray.className} tray`);
        if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
        continue;
      }
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`off screen: ${el.getAttribute('aria-label') ?? el.className}`);
      else if (r.bottom > innerHeight - 56 && !el.closest('.fl-result')) out.push(`in the bottom band (${Math.round(innerHeight - r.bottom)}px up): ${el.getAttribute('aria-label') ?? el.className}`);
      if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
}

type Q = { mode: string; meeting?: string; level?: number; form?: string; right?: string; wrong?: string[]; lines?: number; pics?: boolean; q?: { pid: string; qi: number; choices: string[]; shown: number[] } } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(want: 'yes' | 'read' | 'any' = 'any', ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    const r = await page.locator('.game.mb').getAttribute('data-ready').catch(() => null);
    if ((want === 'any' ? r === 'yes' || r === 'read' : r === want) && !(await page.locator('.card.thinking').count())) return r;
    await page.waitForTimeout(150);
  }
  problems.push(`a question never became ready (${want})`);
  return null;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();

/** Answers as he would, or misses on purpose: `second` picks a different wrong answer from the first miss. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q!, form = p.form!;
  const wrongs = p.wrong ?? [], wrong = (second && wrongs[1] !== undefined ? wrongs[1] : wrongs[0])!;
  const pickAns = miss ? wrong : p.right!;
  const sentence = (i: number) => tap(`Sentence ${q.shown.indexOf(i) + 1}`);
  switch (form) {
    case 'pic': await tap(`Picture ${q.choices.indexOf(pickAns) + 1}`); return;
    case 'words': case 'yn': case 'label': await tap(pickAns); return;
    case 'line': await sentence(Number(pickAns)); return;
    case 'order': {
      const order = p.right!.split('|').map(Number);
      const taps = miss ? (second ? [order[1]!, order[0]!, ...order.slice(2)] : [...order].reverse()) : order;
      for (const i of taps) { if (p.pics) await tap(`Picture ${q.choices.indexOf(String(i)) + 1}`); else await sentence(i); await page.waitForTimeout(150); }
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

// ---------- a Round ----------
const roundStart = Date.now();
await tap('Play');
const missedKinds = new Set<string>();
let asked = 0, spoke = false;
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  if (p.mode === 'meet') {
    await ready('yes');
    await shot(`q${++asked}-meet-${p.meeting}`);
    await tap('Go');
  } else {
    const id = `${p.mode}-L${p.level}-${p.form}`;
    await ready('read');
    await shot(`q${++asked}-${id}-letter`);
    if (!spoke) { spoke = true; await tap('Read sentence 1'); await page.waitForTimeout(2500); }
    if (asked === 2) await page.evaluate(() => (window as unknown as { __ctx?: AudioContext }).__ctx?.suspend());
    await tap('I read it');
    await ready('yes');
    await shot(`q${asked}-${id}`);
    const miss = process.env.TOUR_MISS === 'all' || !missedKinds.has(p.mode);
    await answer(p, miss);
    if (miss) {
      missedKinds.add(p.mode);
      await page.waitForTimeout(1600);
      await shot(`q${asked}-lesson`);
      await ready('yes', 60000);
      await answer(p, true, true); // a second miss gets the fuller lesson: the whole letter read along
      await page.waitForTimeout(3000);
      await shot(`q${asked}-lesson2`);
      await ready('yes', 120000);
      await answer(p, false);
    }
  }
  for (let i = 0; i < 130; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
}
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
const roundSecs = (Date.now() - roundStart) / 1000;
await shot('round-done-awake');

// ---------- the Moon Base: buy a module ----------
await tap('Moon Base');
await page.waitForTimeout(1200);
await shot('base');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('moon-base-mail-save') ?? '{}'));
const balance = (await saved()).balance ?? 0;
async function buySomething(bal: number) {
  const [tabName, item] = bal >= 14 ? ['Modules', 'Living Dome'] : ['Things', 'Bench'];
  if (bal < 6) return false;
  await page.getByRole('tab', { name: tabName, exact: true }).click();
  await page.waitForTimeout(300);
  await tap(item);
  await page.waitForTimeout(600);
  await shot('base-picked');
  const before = JSON.stringify((await saved()).base?.owned);
  await tap('Buy');
  await page.waitForTimeout(2500);
  if (JSON.stringify((await saved()).base?.owned) === before) problems.push(`${item} was not bought with ${bal} Bolts`);
  await shot('base-bought');
  return true;
}
const boughtFirst = await buySomething(balance);
for (const t of ['Landers', 'Suits', 'Paint', 'Garden', 'Things', 'Rocks', 'Badges']) { await page.getByRole('tab', { name: t, exact: true }).click(); await page.waitForTimeout(250); await shot(`base-${t.toLowerCase()}`); }

// ---------- a Landing ----------
const goStart = Date.now();
await tap('Land the supply ship');
await page.waitForTimeout(1000);
await shot('landing-card');
await tap('Go');
await page.waitForTimeout(1500);
await shot('landing-start');
let pressedEngine = false;
for (let i = 0; i < 800 && !(await page.locator('.fl-result').count()); i++) {
  const s = await page.evaluate(() => { const l = (window as unknown as { __landing?: { x: number; y: number; vy: number; onGround: boolean; plan: { padX: number } } }).__landing; return l ? { x: l.x, y: l.y, vy: l.vy, pad: l.plan.padX, ground: l.onGround } : null; });
  if (!s) { await page.waitForTimeout(100); continue; }
  const dx = s.pad - s.x;
  if (Math.abs(dx) > 3) await page.keyboard.down(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); else { await page.keyboard.up('ArrowRight'); await page.keyboard.up('ArrowLeft'); }
  if (!pressedEngine && i > 10) { pressedEngine = true; const b = await page.getByRole('button', { name: 'Engine' }).boundingBox(); if (b) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); } await shot('landing-engine'); }
  if (Math.abs(dx) <= 8 && s.vy < -6) await page.keyboard.down('ArrowUp'); else await page.keyboard.up('ArrowUp');
  if (i === 40) await shot('landing-mid');
  await page.waitForTimeout(100);
}
for (const k of ['ArrowRight', 'ArrowLeft', 'ArrowUp']) await page.keyboard.up(k);
if (!(await page.locator('.fl-result').count())) problems.push('the ship never landed');
const goSecs = (Date.now() - goStart) / 1000;
await page.waitForTimeout(3000);
await shot('landing-result');
const after = (await saved()).base;
if (!after?.goes) problems.push('the Landing was not counted');

// ---------- put the module down, and walk ----------
await page.locator('.fl-result').getByRole('button', { name: 'Moon Base', exact: true }).click();
await page.waitForTimeout(1200);
await shot('base-placing');
if ((await saved()).base?.toPlace) { await tap('Plot 1'); await page.waitForTimeout(1200); if ((await saved()).base?.toPlace) problems.push('the module was not put down'); }
await shot('base-placed');
if (!boughtFirst && !(await buySomething((await saved()).balance ?? 0))) problems.push(`only ${(await saved()).balance} Bolts after a Round and a Landing`);
await tap('Walk the base');
await page.waitForTimeout(1500);
const right = await page.getByRole('button', { name: 'Right' }).boundingBox();
if (right) { await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2); await page.mouse.down(); await page.waitForTimeout(1500); await page.mouse.up(); }
await tap('Hop');
await page.waitForTimeout(1000);
await shot('walk');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
const overlaps = await page.evaluate(() => (window as unknown as { __overlaps: string[] }).__overlaps);
if (overlaps.length) problems.push(`voice clips overlapped ${overlaps.length} times: ${overlaps.slice(0, 3).join('; ')}`);
if (await page.evaluate(() => (window as unknown as { __ctx?: AudioContext }).__ctx?.state) !== 'running') problems.push('the sound is still paused at the end');
const heard = (await saved()).learning?.heard;
if (!heard?.sentences) problems.push('the speaker tap was not counted');
console.log(`${tag}: ${asked} questions, missed in ${[...missedKinds].join(' ')}, ${clips} voice clips played, speaker ${JSON.stringify(heard)}, Round ${roundSecs.toFixed(0)}s, Landing ${goSecs.toFixed(0)}s, goes ${after?.goes ?? 0}, total ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
