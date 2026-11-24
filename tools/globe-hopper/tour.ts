// Plays Globe Hopper in a real browser, as a child who taps: the Start screen and Home, a whole Round (missing on purpose, twice, the
// first question of each kind, so both lessons run, then answering right; tapping Next through each Meeting), the end of the Round, a
// purchase at the Rocket Base, a Launch (holding a finger to burn and steering along the path, dropping the stages, letting the payload
// go, tapping each place when it is under the camera, snapping in free time) to its results, and the Base's tabs, with screenshots.
// Answers are read from the page (window.__round in dev) and tapped where they are drawn (window.__earth); every tap waits for the
// question to be said. It fails on buttons off screen, under 44px or in the bottom 56px, a line with no clip, a request that fails and
// two voice clips playing at once.
//   npm run dev:globe-hopper   (in another shell)
//   npx tsx tools/globe-hopper/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 upright by default). TOUR_SAVE=fresh|levels: a brand-new player, or one
// with every kind open at TOUR_LEVEL (2 by default; 3 has met no continent yet, so the Meetings come) and some Bolts.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { pathTilt, pathX, TUNING } from '../../src/globe-hopper/launch/sim';
import { CONTINENTS } from '../../src/globe-hopper/world/continents';
import { OCEANS } from '../../src/globe-hopper/world/oceans';

const [url = 'http://localhost:5163/', out = '/tmp/globe-hopper-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['globe', 'continent', 'ocean', 'land', 'climate', 'place'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 40,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: Array.from({ length: 5 }, () => 'clean'), opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: LEVEL === 3 ? [] : CONTINENTS.map(c => c.id),
    tuneUp: { globe: { asked: 3, clean: 3, misses: 0 }, continent: { asked: 3, clean: 3, misses: 0 } },
  },
  // a two-stage rocket with boosters, so the Launch drops both, and a payload waiting to fly
  base: {
    owned: ['b:tower1', 'r:launcher', 'p:boosters:two-little', 'p:engines:twin', 'pl:weather'], flying: 'launcher', waiting: ['pl:weather'], launches: 1,
    rockets: { launcher: { kind: 'launcher', nose: 'p:nose:round', capsule: 'p:capsule:none', upper: 'p:upper:short', main: 'p:main:plain', boosters: 'p:boosters:two-little', engines: 'p:engines:twin', fins: 'p:fins:none', paint: 'paint:white', decal: 'decal:none', flame: 'flame:orange' } },
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
  localStorage.removeItem('globe-hopper-place');
  if (s) localStorage.setItem('globe-hopper-save', JSON.stringify(s)); else localStorage.removeItem('globe-hopper-save');
}, save);

let n = 0;
const t0 = Date.now();
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.gh');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      const tray = el.closest('.gh-tray,.gh-tabs');
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
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
}

type LL = { lon: number; lat: number };
type Q = { mode: string; meeting?: string; level?: number; q?: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await page.locator('.game.gh[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true;
    await page.waitForTimeout(150);
  }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
const tab = (label: string) => page.getByRole('tab', { name: label, exact: true }).first().click();
/** Taps a place on the Earth where it is drawn, trying the spots given until one shows. */
async function tapEarth(spots: LL[], quiet = false) {
  for (const at of spots) {
    const p = await page.evaluate(a => (window as unknown as { __earth?: { point(a: LL): { x: number; y: number; front: boolean } } }).__earth?.point(a), at);
    if (p?.front) { await page.mouse.click(p.x, p.y); return true; }
  }
  if (!quiet) problems.push(`nowhere to tap among ${JSON.stringify(spots).slice(0, 80)}`);
  return false;
}
let skippedMisses = 0;
const spotOf = (id: string): LL | null => CONTINENTS.find(c => c.id === id)?.safe ?? OCEANS.find(o => o.id === id)?.safe ?? null;
const LAND: LL[] = CONTINENTS.filter(c => c.id !== 'antarctica').map(c => c.safe), WATER: LL[] = OCEANS.filter(o => o.id !== 'arctic' && o.id !== 'southern').map(o => o.safe);

/** Answers as he would, or misses on purpose: `second` picks a different wrong answer from the first miss. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false): Promise<boolean> {
  const q = p.q!, st = q.stage;
  const wrongOf = (xs: string[]) => { const w = xs.filter(x => x !== q.answer); return (second && w[1] !== undefined ? w[1] : w[0])!; };
  const want: string = miss ? '' : q.answer;
  if (q.choices) { await tap(nameOf(miss ? wrongOf(q.choices) : want)); return true; }
  if (st.type === 'cards') { const id = miss ? wrongOf(st.cards) : want; await tap(`Picture ${st.cards.indexOf(id) + 1}`); return true; }
  const pins = (st.pins ?? []) as { id: string; at: LL }[];
  if (pins.length && (!st.tap || st.tap.by === 'pins')) { const id = miss ? wrongOf(pins.map(x => x.id)) : want; await tapEarth([pins.find(x => x.id === id)!.at]); return true; }
  const t = st.tap;
  if (t.by === 'surface') { const id = miss ? wrongOf(['land', 'water']) : want; await tapEarth(id === 'land' ? LAND : WATER); return true; }
  if (t.by === 'poles') { const id = miss ? wrongOf(['npole', 'spole', 'equator']) : want; const lon = st.surface.lon; await tapEarth(id === 'npole' ? [{ lon, lat: 70 }] : id === 'spole' ? [{ lon, lat: -70 }] : [{ lon, lat: 0 }]); return true; }
  const among = t.among as string[], id = miss ? wrongOf(among) : want;
  // the target first; a miss taps another choice that is in view
  const order = miss ? among.filter(x => x !== q.answer) : [id];
  // zoomed in on Europe on a narrow screen, the other choices can be out of view: then he can't miss onto them, so he answers
  if (!(await tapEarth(order.map(x => spotOf(x)!).filter(Boolean), miss)) && miss) { skippedMisses++; await tapEarth([spotOf(q.answer)!]); return false; }
  return true;
}
const NAMES: Record<string, string> = { land: 'Land', water: 'Water', north: 'North', south: 'South' };
const nameOf = (id: string) => NAMES[id] ?? CONTINENTS.find(c => c.id === id)?.name ?? OCEANS.find(o => o.id === id)?.name ?? id;

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
  const id = p.mode === 'meet' ? `meet-${p.meeting}` : `${p.mode}-L${p.level}-${p.q?.stage?.type ?? ''}`;
  await shot(`q${++asked}-${id}`);
  if (p.mode === 'meet') await tap('Next');
  else {
    const miss = !missedKinds.has(p.mode);
    const missed = await answer(p, miss);
    if (miss && missed) {
      missedKinds.add(p.mode);
      await page.waitForTimeout(1800);
      await shot(`q${asked}-lesson`);
      await ready(40000);
      await answer(p, true, true);
      await page.waitForTimeout(3500);
      await shot(`q${asked}-lesson2`);
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

// ---------- the Rocket Base: buy something ----------
await tap('Rocket Base');
await page.waitForTimeout(1200);
await shot('base');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('globe-hopper-save') ?? '{}'));
async function buySomething() {
  const balance = (await saved()).balance ?? 0;
  if (balance < 5) return false;
  await tab('Build'); await page.waitForTimeout(300);
  await tap('Fence'); await page.waitForTimeout(600); await shot('base-picked');
  await tap('Buy'); await page.waitForTimeout(2500);
  if (!(await saved()).base?.owned?.includes('b:fence')) problems.push(`the Fence was not bought with ${balance} Bolts`);
  await shot('base-bought');
  return true;
}
const boughtFirst = await buySomething();
for (const t of ['Rockets', 'Parts', 'Paint', 'Payloads', 'Station', 'Photos', 'Logbook', 'Build']) { await tab(t); await page.waitForTimeout(300); await shot(`base-${t.toLowerCase()}`); }

// ---------- a Launch, to its end ----------
const goStart = Date.now();
await tap('Launch');
await page.waitForTimeout(1200);
await shot('launch-card');
await tap('Go');
await page.waitForTimeout(3000);
await shot('launch-countdown');
const canvas = page.locator('.ls-canvas');
let held = false, dropped = 0, photos = 0, deployed = false, launchShots = 0;
for (let i = 0; i < 2400 && !(await page.locator('.ms-result').count()); i++) {
  const s = await page.evaluate(() => {
    const w = window as unknown as { __launch?: { phase: string; alt: number; x: number; empty: string | null }; __orbit?: { phase: string; lon: number; lat: number; i: number; setup: { targets: { lon: number; lat: number }[] } } };
    const o = w.__orbit, l = w.__launch;
    if (o && document.querySelector('.launch-screen.in-orbit')) {
      const g = o.setup.targets[o.i];
      const rad = Math.PI / 180, arc = g ? Math.acos(Math.min(1, Math.sin(o.lat * rad) * Math.sin(g.lat * rad) + Math.cos(o.lat * rad) * Math.cos(g.lat * rad) * Math.cos((g.lon - o.lon) * rad))) / rad : 99;
      return { where: 'orbit', phase: o.phase, under: arc < 9 };
    }
    return l ? { where: 'launch', phase: l.phase, alt: l.alt, x: l.x, empty: l.empty } : null;
  });
  const box = (await canvas.boundingBox())!;
  if (s?.where === 'launch' && s.phase === 'climb') {
    // a finger on the screen, left or right of the rocket to steer along the path
    const off = pathX(s.alt! + 40) - s.x!, steer = Math.max(-1, Math.min(1, off / 60 + pathTilt(s.alt!) / TUNING.maxTilt));
    const x = box.x + box.width / 2 + steer * box.width * .3, y = box.y + box.height * .4;
    if (!held) { await page.mouse.move(x, y); await page.mouse.down(); held = true; } else await page.mouse.move(x, y);
    if (s.empty) { await page.mouse.up(); held = false; await page.locator('.ls-act.drop').first().dispatchEvent('pointerdown'); dropped++; await page.waitForTimeout(150); }
    if (launchShots === 0 && s.alt! > 250) { launchShots++; await shot('launch-clouds'); }
    if (launchShots === 1 && s.alt! > 800) { launchShots++; await shot('launch-space'); }
  } else if (held) { await page.mouse.up(); held = false; }
  if (s?.where === 'orbit') {
    if (s.phase === 'deploy' && !deployed) { await page.waitForTimeout(800); await shot('orbit-deploy'); await page.locator('.ls-act.deploy').first().dispatchEvent('pointerdown'); deployed = true; }
    if (s.phase === 'photo' && s.under) { await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); photos++; if (photos === 1) await shot('orbit-photo'); await page.waitForTimeout(400); }
    if (s.phase === 'free' && i % 12 === 0) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }
  await page.waitForTimeout(50);
}
if (held) await page.mouse.up();
if (!(await page.locator('.ms-result').count())) problems.push('the Launch never ended');
if (!deployed) problems.push('never let the payload go');
if (save && dropped < 2) problems.push(`dropped ${dropped} stages, not the boosters and the main stage`);
const goSecs = (Date.now() - goStart) / 1000;
const frames = await page.evaluate(() => (window as unknown as { __frames?: number[] }).__frames ?? []);
const frameMs = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0, worst = frames.length ? [...frames].sort((a, b) => b - a)[Math.floor(frames.length / 100)]! : 0;
await page.waitForTimeout(3000);
await shot('launch-result');
const after = (await saved()).base;
if (!after?.flown) problems.push('the Launch was not counted');
if (!after?.photos?.length) problems.push('no photos were kept');
await tap('Rocket Base');
await page.waitForTimeout(800);
if (!boughtFirst && !(await buySomething())) problems.push(`only ${(await saved()).balance} Bolts after a Round and a Launch`);
await tab('Photos'); await page.waitForTimeout(300); await shot('base-photos-after');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
const overlaps = await page.evaluate(() => (window as unknown as { __overlaps: string[] }).__overlaps);
if (overlaps.length) problems.push(`voice clips overlapped ${overlaps.length} times: ${overlaps.slice(0, 3).join('; ')}`);
console.log(`${tag}: ${asked} questions, missed in ${[...missedKinds].join(' ')}${skippedMisses ? ` (${skippedMisses} misses skipped: nothing else in view)` : ''}, ${clips} voice clips played, Round ${roundSecs.toFixed(0)}s, Launch ${goSecs.toFixed(0)}s (${dropped} drops, ${photos} photos), flown ${after?.flown ?? 0}, orbit frame ${frameMs.toFixed(1)}ms average, ${worst.toFixed(1)}ms 99th percentile over ${frames.length} frames, total ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
