// Plays Hook and Ladder in a real browser, as a child who taps (by touch, as on the iPad): the Start screen and Home, a whole Round
// (with one deliberate miss in every kind it meets, so a lesson runs, and then the same question answered again: it must still take
// taps), the end of the Round, a purchase at the Station, a whole Call (the drive and the siren, then holding a finger on each fire
// until it's out and tapping each person at a window for the ladder, to the thank-you), the Town, and leaving a Round with 🏠 twice,
// with screenshots. TOUR_MISS=2 misses twice before the right answer (the fuller lesson); TOUR_MISS=0 never misses. Answers are read from the page (window.__round in dev), as a child reads them from the screen. It fails on a page
// wider than the screen, a question that scrolls, or a button off screen or under 44px.
//   npm run dev:hook-and-ladder   (in another shell)
//   npx tsx tools/hook-and-ladder/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a
// brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=3 for Level 3), some Bolts and a few Calls answered, so the
// Call is a taller one. TOUR_ROUNDS caps how many Rounds a levels save plays to miss once in every kind. TOUR_GEAR=max fits the parts that throw the most water. TOUR_SLOW=4 slows the CPU fourfold during the Call (Chromium's throttle), a rough stand-in for an iPad 9.
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, type CDPSession } from 'playwright';
import { CLIPS } from '../../src/hook-and-ladder/voice.gen';

const [url = 'http://localhost:5187/', out = 'tour-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['join', 'opposite', 'sort', 'ending', 'strong'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const ANSWERED = LEVEL === 3 ? ['bin', 'house', 'barn', 'car', 'forest', 'shop', 'school', 'treehouse', 'ship', 'flats', 'castle', 'airport', 'lighthouse', 'hotel'] : ['bin', 'house', 'barn', 'car', 'forest', 'shop', 'school', 'treehouse'];
const levels = {
  version: 1, balance: 40,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])),
  },
  station: {
    owned: ['truck:pumper', 'truck:ladder', 'pump:r0', 'pump:r1', 'pump:r2', 'hose:r0', 'hose:r1', 'ladder:r0', 'ladder:r1', 'tank:r0', 'nozzle:straight', LEVEL === 3 ? 'nozzle:rainbow' : 'nozzle:foam', 'siren:wail', 'siren:yelp', 'lights:red', 'lights:disco', 'paint:red', 'paint:flames', 'buddy:dalmatian', 'buddy:owl', 'station:bell', 'station:flag', 'town:tree', 'town:fountain'],
    fitted: { truck: 'ladder', pump: 'r2', hose: 'r1', ladder: 'r1', tank: 'r0', nozzle: LEVEL === 3 ? 'rainbow' : 'foam', siren: 'yelp', lights: 'disco', paint: 'flames', buddy: 'owl' },
    goal: null, calls: 1, answered: ANSWERED, trips: ANSWERED.length, next: null,
  },
};
// TOUR_GEAR=max: the most water at once (Super Hose, Twin Nozzle, the best Pump and Tank), so the drops hit their cap
if (process.env.TOUR_GEAR === 'max') {
  levels.station.owned.push('hose:r5', 'nozzle:twin', 'pump:r5', 'tank:r5');
  Object.assign(levels.station.fitted, { hose: 'r5', nozzle: 'twin', pump: 'r5', tank: 'r5' });
}
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true, isMobile: false });
const page = await context.newPage();
const cdp: CDPSession = await context.newCDPSession(page);
// Listens in on the voice: every recorded clip that plays, by its file, when it starts and stops.
await page.addInitScript(() => {
  type V = { f: string; t0: number; t1: number | null; dur: number };
  const w = window as unknown as { __clips: number; __voice: V[] };
  w.__clips = 0; w.__voice = [];
  const tag = new WeakMap<object, string>();
  const arrayBuffer = Response.prototype.arrayBuffer;
  Response.prototype.arrayBuffer = async function (this: Response) { const b = await arrayBuffer.call(this); if (/\/voice\//.test(this.url)) tag.set(b, this.url.split('/').pop()!); return b; };
  const decode = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function (this: BaseAudioContext, b: ArrayBuffer, ...rest: unknown[]) {
    const f = tag.get(b), p = (decode as (...a: unknown[]) => Promise<AudioBuffer>).call(this, b, ...rest);
    return f ? p.then(buf => { tag.set(buf, f); return buf; }) : p;
  } as typeof decode;
  const channel = AudioBuffer.prototype.getChannelData;
  AudioBuffer.prototype.getChannelData = function (this: AudioBuffer, c: number) { const d = channel.call(this, c); const f = tag.get(this); if (f) tag.set(d.buffer, f); return d; };
  const copy = AudioBuffer.prototype.copyToChannel;
  AudioBuffer.prototype.copyToChannel = function (this: AudioBuffer, src: Float32Array, ...r: [number, number?]) { const f = tag.get(src.buffer); if (f) tag.set(this, f); return copy.call(this, src as Float32Array<ArrayBuffer>, ...r); } as typeof copy;
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (this: AudioBufferSourceNode, ...a: Parameters<typeof start>) {
    if ((this.buffer?.duration ?? 0) > .05) w.__clips++;
    const f = this.buffer && tag.get(this.buffer);
    if (f) {
      const e: V = { f, t0: performance.now(), t1: null, dur: this.buffer!.duration };
      w.__voice.push(e);
      this.addEventListener('ended', () => { if (e.t1 === null) e.t1 = performance.now(); });
    }
    return start.apply(this, a);
  };
});
const CLIP_PHRASE = Object.fromEntries(Object.entries(CLIPS).map(([p, f]) => [f, p]));
page.on('pageerror', e => problems.push(`pageerror: ${e.message} ${(e.stack ?? '').split('\n').slice(1, 4).join(' | ')}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('hook-and-ladder-place');
  if (s) localStorage.setItem('hook-and-ladder-save', JSON.stringify(s)); else localStorage.removeItem('hook-and-ladder-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${viewName}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.hl');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    // a rule meant for something else landing on the question (the shared .fact once boxed the whole card in yellow)
    if (game) { const g = getComputedStyle(game); if (g.backgroundColor !== 'rgba(0, 0, 0, 0)' || g.borderTopWidth !== '0px') out.push(`the question card has a background or border of its own (${game.className})`); }
    for (const el of document.querySelectorAll('button, [role=button]')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep') || (el as HTMLButtonElement).disabled) continue;
      if (document.querySelector('.reward') && el.closest('.card')) continue; // the last question, under the end of the Round
      if (document.querySelector('.call-done') && !el.closest('.call-done')) continue; // under the thank-you card
      const label = el.getAttribute('aria-label') ?? el.className.toString();
      // a tile in a scrolling tray (a badge on a phone's scrolling wall, a lot in the Town) is reached by scrolling it: only the tray
      // has to be on screen
      const scroller = el.parentElement?.closest('.hl-tray,.badge-wall,.town-map') as HTMLElement | null;
      const box = scroller ? scroller.getBoundingClientRect() : r;
      if (box.right > innerWidth + 1 || box.bottom > innerHeight + 1 || box.left < -1 || box.top < -1) out.push(`off screen: ${label}`);
      if (r.height < 43.5 || r.width < 43.5) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 8).join('; ')}`);
}

/** A finger held on one spot for `ms` (touch events, so the page sees pointerType touch). */
async function hold(p: { x: number; y: number }, ms: number) {
  const tp = [{ x: Math.round(p.x), y: Math.round(p.y), id: 1, radiusX: 8, radiusY: 8, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp });
  for (let t = 0; t < ms; t += 100) { await page.waitForTimeout(100); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp }); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const touchAt = (p: { x: number; y: number }) => page.touchscreen.tap(Math.round(p.x), Math.round(p.y));

type Q = { mode: string; level: number; replay?: boolean; q: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.hl[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const esc = (s: string) => s.replace(/(["\\])/g, '\\$1');
const tapKey = (key: string) => page.locator(`.hl-choices [data-key="${esc(key)}"]`).first().tap();

/** The right answer, or (miss) a wrong one a child might give. */
async function answer(p: NonNullable<Q>, miss: boolean) {
  const q = p.q;
  if (q.kind === 'join' && q.form === 'split') {
    const right = Number(q.answer), at = miss ? (right > 1 ? right - 1 : right + 1) : right;
    const box = (await page.locator('.split-word .letter').nth(at).boundingBox())!;
    return touchAt({ x: box.x + 1, y: box.y + box.height / 2 });
  }
  if (q.kind === 'sort' && q.form === 'all') {
    const ins: string[] = q.answer.split('|');
    for (const x of miss ? ins.slice(1) : ins) { await page.locator(`.hl-choices [data-key="${esc(x)}"]`).tap(); await page.waitForTimeout(150); }
    return page.getByRole('button', { name: 'Check' }).tap();
  }
  if (q.kind === 'strong' && q.form === 'order') {
    const order: string[] = q.answer.split('|');
    for (const x of miss ? [...order].reverse() : order) { await tapKey(x); await page.waitForTimeout(200); }
    return;
  }
  const options: string[] = q.kind === 'sort' && q.form === 'odd' ? q.items : q.kind === 'strong' ? q.words : q.choices;
  return tapKey(miss ? options.find(x => x !== q.answer)! : q.answer);
}

// ---------- Start and Home ----------
await page.goto(url);
await page.waitForTimeout(600);
await shot('start');
await page.getByLabel('Start').tap({ timeout: 30000 });
await page.waitForTimeout(800);
await shot('home');

// ---------- a Round ----------
await page.getByRole('button', { name: 'Play', exact: true }).tap();
let asked = 0;
const seen = new Set<string>(), missedKinds = new Set<string>();
// a levels save plays Rounds until every kind has had its deliberate miss (TOUR_ROUNDS caps it)
const ROUNDS = Number(process.env.TOUR_ROUNDS ?? (save ? 4 : 1));
for (let round = 0; round < ROUNDS; round++) {
if (round > 0) {
  if (MODES.every(m => missedKinds.has(m))) break;
  await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 });
  await page.getByRole('button', { name: 'Play again' }).tap();
  await page.waitForTimeout(500);
}
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready();
  const id = `${p.mode}-L${p.level}-${p.q.form}`;
  seen.add(id);
  await shot(`q${++asked}-${id}`);
  // one deliberate miss in every kind he meets, then the same question again: it must still take taps after the lesson
  const miss = process.env.TOUR_MISS !== '0' && !missedKinds.has(p.mode) && !p.replay;
  await answer(p, miss);
  if (miss) {
    missedKinds.add(p.mode);
    await page.waitForTimeout(1800);
    await shot(`q${asked}-lesson`);
    await ready(60000);
    // TOUR_MISS=2: a second miss, so the fuller lesson runs too, and the question must still take taps after it
    if (process.env.TOUR_MISS === '2') { await answer(p, true); await page.waitForTimeout(1800); await shot(`q${asked}-lesson2`); await ready(60000); }
    await answer(p, false);
  }
  for (let i = 0; i < 160; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
  if (JSON.stringify(await question()) === JSON.stringify(p) && !(await page.locator('.reward h2').isVisible())) problems.push(`question ${id} did not move on after the right answer`);
}
}
if (save && !MODES.every(m => missedKinds.has(m))) console.log(`(no miss played in ${MODES.filter(m => !missedKinds.has(m)).join(', ')} in ${ROUNDS} Rounds)`);
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
await shot('round-done-awake');

// ---------- the Station: buy something ----------
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('hook-and-ladder-save') ?? '{}'));
await page.locator('.reward').getByRole('button', { name: 'Station' }).tap();
await page.waitForTimeout(1200);
await shot('station');
const balance = (await saved()).balance ?? 0;
await page.getByRole('tab', { name: 'Paint' }).tap();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Lime Green', exact: true }).tap();
await page.waitForTimeout(600);
await shot('station-trying');
await page.getByRole('button', { name: 'Buy', exact: true }).tap();
await page.waitForTimeout(3200);
if (balance >= 4 && !(await saved()).station?.owned?.includes('paint:lime')) problems.push(`Lime Green was not bought with ${balance} Bolts`);
for (const t of ['Crew Buddy', 'Station', 'Town', 'Ladder']) { await page.getByRole('tab', { name: t, exact: true }).tap(); await page.waitForTimeout(250); }
await shot('station-ladder-tab');

// ---------- a Call: the drive, the siren, every fire and everyone, the thank-you ----------
const callsBefore = (await saved()).station?.calls ?? 0, answeredBefore = (await saved()).station?.answered?.length ?? 0;
await page.locator('.bay-go .call-btn').tap();
await page.waitForTimeout(1200);
await page.locator('.siren-btn.big').tap().catch(() => problems.push('no Siren button on the drive'));
await shot('call-drive');
type C = { phase: string; sim: string; scene: string; live: number; fps: number; worst: number; fires: { x: number; y: number; out: boolean; reach: boolean }[]; rescues: { x: number; y: number; state: string; reach: boolean }[]; ladder: string } | null;
const call = () => page.evaluate(() => (window as unknown as { __call?(): C }).__call?.() ?? null);
for (let i = 0; i < 40 && (await call())?.phase === 'drive'; i++) await page.waitForTimeout(200);
const slow = Number(process.env.TOUR_SLOW ?? 1);
if (slow > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: slow });
let shotSpray = false, sprays = 0, ladders = 0, peak = 0, worst = 0;
const fpsSeen: number[] = [];
const t0 = Date.now();
for (let i = 0; i < 300; i++) {
  const c = await call();
  if (!c || c.phase === 'done') break;
  peak = Math.max(peak, c.live); worst = Math.max(worst, c.worst); if (c.fps) fpsSeen.push(c.fps);
  const r = c.rescues.find(x => x.state === 'waiting' && x.reach && c.ladder === 'rest');
  if (r) { await touchAt(r); ladders++; await page.waitForTimeout(400); continue; }
  const f = c.fires.find(x => !x.out && x.reach);
  if (f) {
    sprays++;
    if (!shotSpray) { const p = hold(f, 900); await page.waitForTimeout(600); await shot(`call-${c.scene}-spray`); shotSpray = true; await p; }
    else await hold(f, 900);
    continue;
  }
  await page.waitForTimeout(400);
}
if (slow > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
const end = await call();
const callS = (Date.now() - t0) / 1000;
if (end?.phase !== 'done') problems.push(`the Call never finished (${JSON.stringify(end && { sim: end.sim, ladder: end.ladder })})`);
const fpsLow = fpsSeen.length ? Math.min(...fpsSeen) : 0;
if (fpsLow && fpsLow < 50) problems.push(`the Call dropped to ${fpsLow.toFixed(0)} fps (worst frame ${(worst * 1000).toFixed(0)} ms)`);
await page.waitForTimeout(1500);
await shot('call-done');
await page.waitForSelector('.call-done .btns:not(.asleep)', { timeout: 20000 }).catch(() => problems.push('the thank-you card never woke up'));
await shot('call-done-awake');
const after = (await saved()).station;
if ((after?.calls ?? 0) !== callsBefore - 1) problems.push(`the Call was not used (${callsBefore} → ${after?.calls})`);
if ((after?.answered?.length ?? 0) !== answeredBefore + 1) problems.push('the Call added no badge');

// ---------- the Town ----------
await page.locator('.call-done').getByRole('button', { name: 'Station' }).tap();
await page.waitForTimeout(800);
await page.getByRole('button', { name: 'Town', exact: true }).first().tap();
await page.waitForTimeout(900);
await shot('town');
const built = page.locator('.lot.built').first();
if (await built.count()) { await built.tap(); await page.waitForTimeout(500); if (!(await saved()).station?.next) problems.push('tapping a building in the Town did not pick it for the next Call'); }
else problems.push('the Town has no buildings after a Call');

// ---------- leaving a Round with 🏠 twice ----------
await page.getByRole('button', { name: 'Home' }).first().tap();
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Play', exact: true }).tap();
await page.waitForTimeout(1500);
await page.locator('.roundbar').getByRole('button', { name: 'Home' }).tap();
await page.waitForTimeout(300);
await page.locator('.roundbar').getByRole('button', { name: 'Tap again to go home' }).tap();
await page.waitForTimeout(800);
if (!(await page.locator('.home-screen').count())) problems.push('🏠 twice did not go Home');

// ---------- the voice, as heard ----------
type Heard = { f: string; t0: number; t1: number | null; dur: number };
const log = (await page.evaluate(() => (window as unknown as { __voice: Heard[] }).__voice)).sort((a, b) => a.t0 - b.t0);
for (let i = 1; i < log.length; i++) { const a = log[i - 1]!, b = log[i]!; if (a.t1 !== null && b.t0 < a.t1 - 25) problems.push(`two clips at once: "${CLIP_PHRASE[a.f]}" and "${CLIP_PHRASE[b.f]}"`); }
const tFirst = log[0]?.t0 ?? 0;
writeFileSync(`${out}/voice-${viewName}.txt`, log.map(h => `${((h.t0 - tFirst) / 1000).toFixed(2).padStart(7)}s ${CLIP_PHRASE[h.f] ?? h.f}`).join('\n'));
console.log(`${viewName} ${process.env.TOUR_SAVE ?? 'fresh'}${save ? ` L${LEVEL}` : ''}: ${asked} questions (${[...seen].join(', ')}), missed and retried in ${[...missedKinds].join(', ')}; Call "${end?.scene}" in ${callS.toFixed(0)}s with ${sprays} sprays and ${ladders} ladder taps, drops peaked at ${peak}, ${fpsLow.toFixed(0)} fps at worst (worst frame ${(worst * 1000).toFixed(0)} ms${slow > 1 ? `, CPU ×${slow} slower` : ''}); ${log.length} voice clips`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
