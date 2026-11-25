// Plays Dragon Roost in a real browser, as a child who taps: the Start screen and Home, a whole Round (missing on purpose, twice, the
// first question of each kind, so both lessons run, then answering right; tapping Next through each Meeting), the end of the Round,
// naming his first dragon, a purchase at the Roost (an egg), a Flight to its end (holding a finger to steer, holding Breathe by each
// beacon, tapping a trick), the Roost's tabs and Visit the roost, with screenshots. Answers are read from the page (window.__round in
// dev); the Flight is flown by the skilled child of the Flight tests, reading the Flight from window.__flight. It fails on buttons off
// screen, under 44px or in the bottom 56px, a line with no clip, a request that fails and two voice clips playing at once.
//   npm run dev:dragon-roost   (in another shell)
//   npx tsx tools/dragon-roost/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 upright by default). TOUR_SAVE=fresh|levels: a brand-new player, or one
// with every kind open at TOUR_LEVEL (2 by default; 3 has met no kind yet, so the Meetings come), named dragons, warm eggs and some Flames.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { childInput, type Sim } from '../../src/dragon-roost/flight/sim';
import { itemOf } from '../../src/dragon-roost/roost/catalog';
import { readRoost, shopNow } from '../../src/dragon-roost/roost/roost';

const [url = 'http://localhost:5164/', out = '/tmp/dragon-roost-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['noun', 'verb', 'adj', 'plural', 'past', 'squeeze', 'capital'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 40,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: Array.from({ length: 5 }, () => 'clean'), opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: LEVEL === 3 ? [] : MODES, recent: [],
  },
  roost: {
    owned: ['trick:flap', 'roost:straw', 'breath:plain', 'trail:none', 'trick:zoom', 'trick:spin', 'roost:twig', 'egg:ember', 'egg:puddle', 'gear:belt', 'trail:sparkle'],
    eggs: [{ egg: 'egg:ember', warmth: 3 }, { egg: 'egg:puddle', warmth: 1 }], tricksOn: ['trick:flap', 'trick:zoom', 'trick:spin'], worn: { belt: 'gear:belt', trail: 'trail:sparkle' },
    dragons: [{ id: 1, egg: 'starter', name: ['happy', 'storm'], flights: 9 }, { id: 2, egg: 'egg:sunny', name: ['tiny', 'comet'], flights: 2 }],
    riding: 1, flights: 1, flown: 11, reached: 11, bests: { 3: 6 }, totals: { lit: 50, popped: 40, birds: 1, flames: 20, hatched: 1 },
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
  localStorage.removeItem('dragon-roost-place');
  if (s) localStorage.setItem('dragon-roost-save', JSON.stringify(s)); else localStorage.removeItem('dragon-roost-save');
}, save);

let n = 0;
const t0 = Date.now();
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.dr');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      const tray = el.closest('.dr-tray,.dr-tabs,.dr-name');
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

type Q = { mode: string; meeting?: string; level?: number; q?: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await page.locator('.game.dr[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true;
    await page.waitForTimeout(150);
  }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click().catch(e => { console.log(`PROBLEMS SO FAR: ${problems.join(' | ')}`); throw e; });
const tab = (label: string) => page.getByRole('tab', { name: label, exact: true }).first().click();
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('dragon-roost-save') ?? '{}'));

/** Answers as he would, or misses on purpose: `second` picks a different wrong answer from the first miss. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q!, st = q.stage;
  const wrongOf = <T,>(xs: T[], right: (x: T) => boolean) => { const w = xs.filter(x => !right(x)); return (second && w[1] !== undefined ? w[1] : w[0])!; };
  if (q.choices) { await tap(miss ? wrongOf(q.choices as string[], c => c === q.answer) : q.answer); return; }
  if (st.type === 'tap') {
    const words = page.locator('.dr-word'), need: number[] = st.need;
    if (miss) { const i = wrongOf(st.shown.map((_: unknown, k: number) => k), (k: number) => need.includes(k)); await words.nth(i).click(); return; }
    for (const i of need) { await words.nth(i).click(); await page.waitForTimeout(200); }
    return;
  }
  if (st.type === 'apostrophe') {
    const right = Number(q.answer.slice(1)), gaps = Array.from({ length: st.letters.length - 1 }, (_, k) => k + 1);
    await tap(`Gap ${miss ? wrongOf(gaps, g => g === right) : right}`);
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
let asked = 0;
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready(60000);
  const id = p.mode === 'meet' ? `meet-${p.meeting}` : `${p.mode}-L${p.level}-${p.q?.stage?.type ?? ''}`;
  await shot(`q${++asked}-${id}`);
  if (p.mode === 'meet') await tap('Next');
  else {
    const miss = !missedKinds.has(p.mode);
    await answer(p, miss);
    if (miss) {
      missedKinds.add(p.mode);
      await page.waitForTimeout(1800);
      await shot(`q${asked}-lesson`);
      await ready(60000);
      await answer(p, true, true);
      await page.waitForTimeout(3500);
      await shot(`q${asked}-lesson2`);
      await ready(120000);
      await answer(p, false);
    }
  }
  for (let i = 0; i < 130; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
}
await page.waitForTimeout(1500);
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
const roundSecs = (Date.now() - roundStart) / 1000;
await shot('round-done');

// ---------- the Roost: name the starter dragon, buy an egg ----------
await tap('Roost');
await page.waitForTimeout(1200);
if (await page.locator('.dr-name').count()) {
  await shot('hatch');
  await page.waitForSelector('.dr-name .dr-dragon', { timeout: 20000 });
  await page.waitForTimeout(4000);
  await page.locator('.dr-name-row').nth(0).locator('button').first().click();
  await page.waitForTimeout(600);
  await page.locator('.dr-name-row').nth(1).locator('button').first().click();
  await page.waitForTimeout(500);
  await shot('named');
  await page.waitForTimeout(3500);
  if (!(await saved()).roost?.dragons?.[0]?.name) problems.push('the starter dragon was not named');
}
await shot('roost');
/** Buys what he would: an egg if one fits a nest and he can afford it, else the cheapest new thing. */
async function buySomething() {
  const raw = await saved(), balance = raw.balance ?? 0, a = readRoost(raw.roost);
  const can = shopNow(a).filter(w => w.kind === 'item' && itemOf(w.id).price <= balance);
  const w = can.find(x => x.kind === 'item' && itemOf(x.id).cat === 'egg') ?? can[0];
  if (!w || w.kind !== 'item') return false;
  const item = itemOf(w.id), TAB = { egg: 'Eggs', trick: 'Tricks', roost: 'Roost', gear: 'Gear', colour: 'Colours', toy: 'Toys' } as const;
  await tab(TAB[item.cat]); await page.waitForTimeout(300);
  await tap(item.name); await page.waitForTimeout(600); await shot('roost-picked');
  await tap('Buy'); await page.waitForTimeout(2500);
  if (!(await saved()).roost?.owned?.includes(item.id)) problems.push(`the ${item.name} was not bought with ${balance} Flames`);
  await shot('roost-bought');
  return true;
}
const boughtFirst = await buySomething();
if (save) { // a warm egg hatches
  await tab('Eggs'); await page.waitForTimeout(300);
  const ready = page.locator('.dr-nest.ready');
  if (await ready.count()) {
    await ready.first().click(); await page.waitForTimeout(5000);
    await page.locator('.dr-name-row').nth(0).locator('button').nth(1).click(); await page.waitForTimeout(500);
    await page.locator('.dr-name-row').nth(1).locator('button').nth(1).click(); await page.waitForTimeout(4000);
    await shot('hatched');
  } else problems.push('no warm egg to hatch');
}
for (const t of ['Roost', 'Dragons', 'Tricks', 'Gear', 'Colours', 'Toys', 'Places', 'Trophies', 'Eggs']) { await tab(t); await page.waitForTimeout(300); await shot(`roost-${t.toLowerCase()}`); }

// ---------- a Flight, to its end ----------
const flyStart = Date.now();
await tap('Fly');
await page.waitForTimeout(1200);
await shot('flight-card');
await page.locator('.dr-flight-card .big-btn').first().click();
await page.waitForTimeout(800);
const canvas = page.locator('.dr-flight');
let held = false, breathing = false, flightShots = 0, tricks = 0;
let r = 7;
const rng = () => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < 4000 && !(await page.locator('.dr-flight-card.done').count()); i++) {
  const f = await page.evaluate(() => {
    const x = (window as unknown as { __flight?(): { phase: string; sim: unknown } }).__flight?.();
    return x ? { phase: x.phase, sim: x.sim } : null;
  }) as { phase: string; sim: Sim } | null;
  if (!f || f.phase !== 'fly') { await page.waitForTimeout(100); continue; }
  const inp = childInput(f.sim, 'skilled', rng), box = (await canvas.boundingBox())!;
  if (inp.target !== null) {
    const y = box.y + box.height - inp.target * Math.min(box.height / 100, box.width / 80), x = box.x + box.width * .35;
    if (!held) { await page.mouse.move(x, y); await page.mouse.down(); held = true; } else await page.mouse.move(x, y);
  }
  if (inp.breath !== breathing) { await page.locator('.dr-breathe').dispatchEvent(inp.breath ? 'pointerdown' : 'pointerup'); breathing = inp.breath; }
  if ((inp.trick !== null || i % 60 === 30) && await page.locator('.dr-trick').count()) { await page.locator('.dr-trick').nth(inp.trick ?? 0).dispatchEvent('pointerdown'); tricks++; }
  if (flightShots === 0 && f.sim.x > 120) { flightShots++; await shot('flight'); }
  if (flightShots === 1 && f.sim.lit.filter(Boolean).length >= 2) { flightShots++; await shot('flight-lit'); }
  await page.waitForTimeout(40);
}
if (held) await page.mouse.up();
if (!(await page.locator('.dr-flight-card.done').count())) problems.push('the Flight never ended');
const flySecs = (Date.now() - flyStart) / 1000;
await page.waitForTimeout(3000);
await shot('flight-result');
const after = (await saved()).roost;
if (!after?.flown) problems.push('the Flight was not counted');
await tap('Roost');
await page.waitForTimeout(800);
if (!boughtFirst && !(await buySomething())) problems.push(`only ${(await saved()).balance} Flames after a Round and a Flight`);
await tap('Visit the roost');
await page.waitForTimeout(1500);
const v = (await page.locator('.dr-visit').boundingBox())!;
await page.mouse.click(v.x + v.width * .3, v.y + v.height * .65);
await page.waitForTimeout(1200);
await shot('visit');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
const overlaps = await page.evaluate(() => (window as unknown as { __overlaps: string[] }).__overlaps);
if (overlaps.length) problems.push(`voice clips overlapped ${overlaps.length} times: ${overlaps.slice(0, 3).join('; ')}`);
console.log(`${tag}: ${asked} questions, missed in ${[...missedKinds].join(' ')}, ${clips} voice clips played, Round ${roundSecs.toFixed(0)}s, Flight ${flySecs.toFixed(0)}s (${tricks} tricks), flown ${after?.flown ?? 0}, lit ${after?.totals?.lit ?? 0}, total ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
