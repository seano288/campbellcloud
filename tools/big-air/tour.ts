// Plays Big Air in a real browser, as a child who taps: the Start screen and Home, a whole Round (missing on purpose, twice, the first
// question of each kind, so both lessons run, then answering right; tapping Go through each Meeting), the end of the Round, a purchase at
// the Arena, a Jump (holding the pedal down the run-up, boosting, tilting to land level) through the tape to its results, "Watch it", and
// the Arena's tabs, with screenshots. Answers are read from the page (window.__round in dev) and typed on the pad, tapped on the tape or
// tapped as a choice; every tap waits for the question to be said. It fails on buttons off screen, under 44px or in the bottom 56px, a
// line with no clip, a request that fails and two voice clips playing at once.
//   npm run dev:big-air   (in another shell)
//   npx tsx tools/big-air/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 upright by default). TOUR_SAVE=fresh|levels: a brand-new player, or one
// with every kind open at TOUR_LEVEL (2 by default; 3 has met nothing yet, so the Meetings come) and some Bolts.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { thingOf } from '../../src/big-air/questions/things';

const [url = 'http://localhost:5141/', out = '/tmp/big-air-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['ruler', 'guess', 'longer', 'line', 'story', 'units'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 40,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: Array.from({ length: 5 }, () => 'clean'), opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: LEVEL === 3 ? [] : ['ruler', 'cm', 'feet'],
    tuneUp: { ruler: { asked: 3, clean: 3, misses: 0 }, guess: { asked: 3, clean: 3, misses: 0 } },
  },
  // a booster to tap in the air, a better engine, and a Row bought and waiting
  arena: {
    owned: ['part:booster:puff', 'part:engine:v6', 'row:2'], truck: { booster: 'part:booster:puff', engine: 'part:engine:v6' }, rowsCleared: 1, jumps: 1, jumped: 1,
    records: [{ feet: 15, jump: 1 }],
  },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;
const tag = `${viewName}-${save ? `L${LEVEL}` : 'new'}`;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true });
await page.addInitScript(() => {
  const w = window as unknown as { __clips: number; __overlaps: string[] }, start = AudioBufferSourceNode.prototype.start, stop = AudioBufferSourceNode.prototype.stop;
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
});
page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
page.on('requestfailed', r => problems.push(`request failed: ${r.url()} ${r.failure()?.errorText ?? ''}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('big-air-place');
  if (s) localStorage.setItem('big-air-save', JSON.stringify(s)); else localStorage.removeItem('big-air-save');
}, save);

let n = 0;
const t0 = Date.now();
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.ba');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      const tray = el.closest('.ba-tray,.ba-tabs');
      if (tray) {
        const t = tray.getBoundingClientRect();
        if (t.right > innerWidth + 1) out.push(`off screen: the ${tray.className} tray`);
        if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
        continue;
      }
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`off screen: ${el.getAttribute('aria-label') ?? el.className}`);
      else if (r.bottom > innerHeight - 56) out.push(`in the bottom band (${Math.round(innerHeight - r.bottom)}px up): ${el.getAttribute('aria-label') ?? el.className}`);
      if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
    }
    // the ruler's ticks must be big enough to read: a unit at least 16px wide on screen
    const ruler = document.querySelector('.ba-ruler') as SVGSVGElement | null;
    if (ruler) {
      const vb = ruler.viewBox.baseVal, unitPx = (40 / vb.width) * ruler.getBoundingClientRect().width;
      if (unitPx < 16) out.push(`ruler too small: ${unitPx.toFixed(1)}px a unit`);
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
    if (await page.locator('.game.ba[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true;
    await page.waitForTimeout(150);
  }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
const tab = (label: string) => page.getByRole('tab', { name: label, exact: true }).first().click();
const UNIT: Record<string, [string, string]> = { in: ['inch', 'inches'], ft: ['foot', 'feet'], cm: ['centimetre', 'centimetres'] };

/** The label of a choice button, as the view writes it. */
function labelOf(q: Record<string, any>, c: string): string {
  if (q.kind === 'guess') return q.form === 'longer' ? thingOf(c).name : q.form === 'about' ? `${c} ${UNIT[q.unit]![Number(c) === 1 ? 0 : 1]}` : c === 'in' ? 'inches' : 'feet';
  if (q.kind === 'story') return `${c} ft`;
  if (q.kind === 'units') return q.form === 'which' ? (c === 'in' ? `${q.inches} inches` : `${q.cm} centimetres`) : q.form === 'more' ? `${c === 'more' ? 'More' : 'Fewer'} ${UNIT[q.to]![1]}` : c;
  return c;
}
async function typeOnPad(v: string, erase = false) {
  if (erase) { await tap('Erase'); await tap('Erase'); }
  for (const d of v) await tap(d);
  await tap('Done');
}
async function tapTape(q: Record<string, any>, v: number) {
  const box = (await page.locator('.ba-tape').first().boundingBox())!, lo = q.form === 'ones' ? q.lo : 0, hi = q.form === 'ones' ? q.lo + 10 : 100;
  const xv = 40 + ((v - lo) / (hi - lo)) * 920;
  await page.mouse.click(box.x + ((xv + 10) / 1020) * box.width, box.y + (155 / 220) * box.height);
}
/** Answers as he would, or misses on purpose: `second` picks a different wrong answer. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q!, traps = (q.traps as { value: string }[]).map(t => t.value);
  const wrongs = q.choices ? (q.choices as string[]).filter(c => c !== q.answer) : traps.length ? traps : [String(Number(q.answer) + 1)];
  const wrong = (second && wrongs[1] !== undefined ? wrongs[1] : wrongs[0])!;
  const v = miss ? wrong : q.answer;
  if (q.kind === 'ruler' || q.kind === 'longer') return typeOnPad(v, true);
  if (q.kind === 'line' && q.form !== 'hops') {
    const step = q.form === 'ones' ? 1 : 10, lo = q.form === 'ones' ? q.lo : 0;
    const w = miss ? (Number(q.answer) + (second ? -step : step) - lo) % (q.form === 'ones' ? 10 : 100) + lo : Number(q.answer);
    return tapTape(q, Math.max(lo + step, w));
  }
  return tap(labelOf(q, v));
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
    const miss = !missedKinds.has(p.mode);
    await answer(p, miss);
    if (miss) {
      missedKinds.add(p.mode);
      await page.waitForTimeout(1800);
      await shot(`q${asked}-lesson`);
      await ready(40000);
      await answer(p, true, true);
      for (let i = 0; i < 60 && !(await page.locator('[data-lesson="next"]').count()); i++) await page.waitForTimeout(200);
      await shot(`q${asked}-lesson2`);
      // the fuller lesson waits on the arrow: tap it through
      for (let i = 0; i < 80; i++) {
        if (await page.locator('.ba-next').count()) { await page.locator('.ba-next').click(); await page.waitForTimeout(300); continue; }
        if (await page.locator('.game.ba[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) break;
        await page.waitForTimeout(300);
      }
      await ready(90000);
      await answer(p, false);
    }
  }
  for (let i = 0; i < 130; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
}
await page.waitForTimeout(1500);
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
const roundSecs = (Date.now() - roundStart) / 1000;
await shot('round-done');

// ---------- the Arena: buy something ----------
await tap('Arena');
await page.waitForTimeout(1200);
await shot('arena');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('big-air-save') ?? '{}'));
async function buySomething() {
  const balance = (await saved()).balance ?? 0;
  if (balance < 3) return false;
  await tab('Paint'); await page.waitForTimeout(300);
  await tap('Blaze Orange'); await page.waitForTimeout(600); await shot('arena-picked');
  await tap('Buy'); await page.waitForTimeout(2500);
  if (!(await saved()).arena?.owned?.includes('colour:orange')) problems.push(`Blaze Orange was not bought with ${balance} Bolts`);
  await shot('arena-bought');
  return true;
}
const boughtFirst = await buySomething();
for (const t of ['Truck', 'Ramp', 'Rows', 'Arena', 'Tune', 'Records', 'Paint']) { await tab(t); await page.waitForTimeout(300); await shot(`arena-${t.toLowerCase()}`); }

// ---------- a Jump, to its end ----------
async function jumpToEnd(label: string, drive: boolean) {
  const start = Date.now();
  let pressed = false, boosted = false, shots = 0;
  for (let i = 0; i < 1500 && !(await page.locator('.ms-result').count()); i++) {
    const s = await page.evaluate(() => { const j = (window as unknown as { __jump?: { phase: string; pitch: number; airT: number; t: number; feet: number } }).__jump; return j ? { phase: j.phase, pitch: j.pitch, airT: j.airT, feet: j.feet } : null; });
    if (!s) { await page.waitForTimeout(100); continue; }
    if (drive && s.phase === 'run' && !pressed) {
      const b = (await page.locator('.js-act.pedal').boundingBox())!;
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); pressed = true;
      await shot(`${label}-runup`);
    }
    if (pressed && s.phase !== 'run' && s.phase !== 'lights') { await page.mouse.up(); pressed = false; }
    if (drive && s.phase === 'air') {
      if (!boosted && await page.locator('.js-act.boost').count()) { await page.locator('.js-act.boost').dispatchEvent('pointerdown'); boosted = true; }
      if (shots === 0) { shots++; await shot(`${label}-air`); }
    }
    if (s.phase === 'done' && shots < 2) { shots = 2; await page.waitForTimeout(1200); await shot(`${label}-tape`); }
    await page.waitForTimeout(40);
    if (label === 'watch' && !(await page.locator('.jump-screen').count())) break;
  }
  if (pressed) await page.mouse.up();
  return (Date.now() - start) / 1000;
}
await tap('Jump');
await page.waitForTimeout(1200);
await shot('jump-card');
await tap('Jump');
const jumpSecs = await jumpToEnd('jump', true);
if (!(await page.locator('.ms-result').count())) problems.push('the Jump never ended');
await page.waitForTimeout(3500);
await shot('jump-result');
const after = (await saved()).arena;
if (!after?.jumped) problems.push('the Jump was not counted');
if (!after?.records?.length) problems.push('no record was kept');
await tap('Arena');
await page.waitForTimeout(800);
if (!boughtFirst && !(await buySomething())) problems.push(`only ${(await saved()).balance} Bolts after a Round and a Jump`);
// "Watch it": the best jump again, to the foot
const best = (await saved()).arena?.best?.feet;
await tap('Watch it');
await page.waitForTimeout(500);
await jumpToEnd('watch', false);
const watched = await page.evaluate(() => (window as unknown as { __jump?: { feet: number } }).__jump?.feet);
if (best !== undefined && watched !== best) problems.push(`"Watch it" went ${watched} feet, the best was ${best}`);
await page.waitForTimeout(2500);
await tab('Records').catch(() => {}); await page.waitForTimeout(300); await shot('arena-records-after');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
const overlaps = await page.evaluate(() => (window as unknown as { __overlaps: string[] }).__overlaps);
if (overlaps.length) problems.push(`voice clips overlapped ${overlaps.length} times: ${overlaps.slice(0, 3).join('; ')}`);
console.log(`${tag}: ${asked} questions, missed in ${[...missedKinds].join(' ')}, ${clips} voice clips played, Round ${roundSecs.toFixed(0)}s, Jump ${jumpSecs.toFixed(0)}s (${after?.records?.[0]?.feet ?? 0} ft record), watched ${watched} ft, total ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
