// Plays Coaster Crew in a real browser, as a child who taps: the Start screen and Home, a whole Round (missing on purpose, twice, the
// first question of each kind, so both lessons run, tapping each cart or thing when the hands-on lesson asks, then answering right), the
// end of the Round, a purchase in the Coaster Yard, a piece added in the builder and taken off again, each Yard tab, and a Ride (the lever
// pulled, a finger held for hands up, the photo taken) to its results. Answers are read from the page (window.__round in dev) and tapped
// as he would tap them. It fails on buttons off screen, under 44px or in the bottom 56px, a line with no clip, a request that fails and
// two voice clips playing at once.
//   npm run dev:coaster-crew   (in another shell)
//   npx tsx tools/coaster-crew/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 upright by default). TOUR_SAVE=fresh|levels: a brand-new player, or one
// with every kind open at TOUR_LEVEL (2 by default) and some Tokens.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [url = 'http://localhost:5157/', out = '/tmp/coaster-crew-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['push', 'hill', 'heavy', 'rough', 'bump', 'magnet'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 40,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: Array.from({ length: 5 }, () => 'clean'), opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])),
    tuneUp: { push: { asked: 3, clean: 3, misses: 0 }, hill: { asked: 3, clean: 3, misses: 0 } },
  },
  // a bigger coaster with a loop, a booster and a splash, and a park with things in it
  yard: {
    owned: ['pc:lift7', 'pc:drop5', 'pc:loop', 'pc:boost', 'pc:camel3', 'pc:hump2', 'rk:ferris', 'sd:icecream', 'sd:lights', 'sd:speedo', 'ht:cap', 'bl:red'],
    coasters: [{ pieces: ['pc:lift7', 'pc:drop5', 'pc:loop', 'pc:camel3', 'pc:drop2'], best: 0 }], rides: 1, guest: 4, spots: ['rk:ferris', 'sd:icecream'],
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
  localStorage.removeItem('coaster-crew-place');
  if (s) localStorage.setItem('coaster-crew-save', JSON.stringify(s)); else localStorage.removeItem('coaster-crew-save');
}, save);

let n = 0;
const t0 = Date.now();
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.cc');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      const label = el.getAttribute('aria-label') ?? el.className;
      // inside something that scrolls (the Yard's tiles, the tray, the tabs): the scroller must be on screen, the button big enough
      const scroller = el.closest('.cc-yard-body:not(.tab-build),.cc-tray,.cc-tabs');
      if (scroller) {
        const t = scroller.getBoundingClientRect();
        if (t.right > innerWidth + 1 || t.left < -1) out.push(`off screen: the ${scroller.className} scroller`);
        if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
        continue;
      }
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`off screen: ${label}`);
      else if (r.bottom > innerHeight - 56) out.push(`in the bottom band (${Math.round(innerHeight - r.bottom)}px up): ${label}`);
      if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
}

type Q = { mode: string; level: number; q: { kind: string; choices: string[]; answer: string; scene: { type: string } } } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await page.locator('.game.cc[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true;
    await handsOn();
    await page.waitForTimeout(150);
  }
  problems.push('a question never became ready');
  return false;
}
/** The hands-on lesson: tap each lane it is waiting on, as he would. */
async function handsOn() {
  const c = page.locator('.cc-scene').first();
  if (!(await c.count())) return false;
  const waiting = (await c.getAttribute('data-waiting')) ?? '';
  if (!waiting) return false;
  const box = (await c.boundingBox())!, lanes = Number((await c.getAttribute('class'))!.match(/\bn(\d+)\b/)![1]);
  for (const lane of waiting.split(',').map(Number)) { await page.mouse.click(box.x + box.width / 2, box.y + (lane + .5) * box.height / lanes); await page.waitForTimeout(500); }
  return true;
}
const tapChoice = (i: number) => page.locator('.cc-choices button').nth(i).click();
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
const tab = (label: string) => page.getByRole('tab', { name: label, exact: true }).first().click();
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('coaster-crew-save') ?? '{}'));

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
let asked = 0, lessons = 0;
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready();
  const id = `${p.mode}-L${p.level}-${p.q.scene.type}`;
  await shot(`q${++asked}-${id}`);
  const right = p.q.choices.indexOf(p.q.answer), wrong = p.q.choices.map((_, i) => i).filter(i => i !== right);
  if (!missedKinds.has(p.mode)) {
    missedKinds.add(p.mode);
    await tapChoice(wrong[0]!);
    await page.waitForTimeout(1800);
    await shot(`q${asked}-lesson`);
    await ready(60000);
    await tapChoice(wrong[1] ?? wrong[0]!);
    await page.waitForTimeout(1500);
    // the second miss is hands-on: wait for it to ask, then tap each cart or thing
    for (let i = 0; i < 60 && !(await handsOn()); i++) { if (await page.locator('.game.cc[data-ready="yes"]').count()) break; await page.waitForTimeout(200); }
    await shot(`q${asked}-lesson2`);
    lessons++;
    await ready(90000);
  }
  await tapChoice(right);
  for (let i = 0; i < 160; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
}
await page.waitForTimeout(1500);
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
const roundSecs = (Date.now() - roundStart) / 1000;
await shot('round-done');

// ---------- the Coaster Yard: buy something, build with it ----------
await tap('Coaster Yard');
await page.waitForTimeout(1200);
await shot('yard');
const balance = (await saved()).balance ?? 0;
if (balance >= 3) {
  await tab('Track'); await page.waitForTimeout(300);
  await tap('Brakes'); await page.waitForTimeout(500); await shot('yard-picked');
  await tap('Buy'); await page.waitForTimeout(2500);
  if (!(await saved()).yard?.owned?.includes('pc:brakes')) problems.push(`the Brakes were not bought with ${balance} Tokens`);
  await shot('yard-bought');
} else problems.push(`only ${balance} Tokens after a Round`);
await tab('Build'); await page.waitForTimeout(400);
const before = (await saved()).yard?.coasters?.[0]?.pieces?.length ?? 0;
await page.locator('.cc-tray button').first().click(); await page.waitForTimeout(800);
await shot('built');
if (((await saved()).yard?.coasters?.[0]?.pieces?.length ?? 0) !== before + 1) problems.push('a piece from the tray did not snap on');
await tap('Take off the last piece'); await page.waitForTimeout(800);
if (((await saved()).yard?.coasters?.[0]?.pieces?.length ?? 0) !== before) problems.push('one tap did not take the last piece off');
for (const t of ['Track', 'Train', 'Park', 'Looks', 'Records']) { await tab(t); await page.waitForTimeout(500); await shot(`yard-${t.toLowerCase()}`); }
// the park: pick a spot, then put something on it if there is something to put
await tab('Park'); await page.waitForTimeout(300);
const map = (await page.locator('.cc-park-map').boundingBox())!;
await page.mouse.click(map.x + map.width * .2, map.y + map.height * .55); await page.waitForTimeout(500); await shot('park-spot');
await tab('Build'); await page.waitForTimeout(300);

// ---------- a Ride, to its end ----------
const rideStart = Date.now();
await tap('Ride'); await page.waitForTimeout(1500);
await shot('ride-pick');
await tap('My Coaster'); await page.waitForTimeout(1500);
const canvas = page.locator('.cc-ride-canvas');
let held = false, lever = false, photo = false, rideShots = 0;
for (let i = 0; i < 1800 && !(await page.locator('.cc-results').count()); i++) {
  if (!lever && await page.getByLabel('Pull the lever').count()) { await shot('ride-top'); await page.getByLabel('Pull the lever').dispatchEvent('pointerdown'); lever = true; }
  if (lever && !held) { const b = (await canvas.boundingBox())!; await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); held = true; }
  if (!photo && await page.getByLabel('Take a photo').count()) { await page.getByLabel('Take a photo').dispatchEvent('pointerdown'); photo = true; await shot('ride-photo'); }
  if (lever && rideShots < 2 && i % 60 === 30) { rideShots++; await shot(`ride-${rideShots}`); }
  await page.waitForTimeout(50);
}
if (held) await page.mouse.up();
if (!lever) problems.push('the lever never came up');
if (!(await page.locator('.cc-results').count())) problems.push('the Ride never reached its results');
await page.waitForSelector('.cc-results .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('the Ride results never woke up'));
const rideSecs = (Date.now() - rideStart) / 1000;
await shot('ride-done');
const after = await saved();
if ((after.yard?.ridden ?? 0) < 1) problems.push('the Ride was not counted');

// ---------- "Watch it run" ----------
await tap('Coaster Yard'); await page.waitForTimeout(800);
await tap('Watch it run'); await page.waitForTimeout(3000);
await shot('watch');

const audio = await page.evaluate(() => { const w = window as unknown as { __clips: number; __overlaps: string[] }; return { __clips: w.__clips, __overlaps: w.__overlaps }; });
if (audio.__overlaps.length) problems.push(`voice overlapped: ${audio.__overlaps.slice(0, 4).join('; ')}`);
console.log(`${tag}: ${asked} questions (${lessons} kinds missed twice), Round ${roundSecs.toFixed(0)} s, Ride ${rideSecs.toFixed(0)} s, ${audio.__clips} clips, photo ${photo}, total ${((Date.now() - t0) / 1000).toFixed(0)} s`);
await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'no problems');
process.exitCode = problems.length ? 1 : 0;
