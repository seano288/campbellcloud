// Plays Deep Light in a real browser, as a child who taps (by touch, as on the iPad): the Start screen and Home, a whole Round (with
// one deliberate miss in every kind it meets, so a lesson runs, and then the same question answered again: it must still take taps),
// the end of the Round, a purchase at the Dock, a whole Dive (holding a finger on each animal until its photo is taken, to the end when
// the submarine rises by itself), the Logbook, and leaving a Round with 🏠 twice, with screenshots. TOUR_MISS=2 misses twice before
// the right answer (the fuller lesson, which hands him the lamp or the string); TOUR_MISS=0 never misses. Answers are read from the
// page (window.__round in dev), as a child reads them from the screen. It fails on a page wider than the screen, a question that
// scrolls, or a button off screen or under 44px.
//   npm run dev:deep-light   (in another shell)
//   npx tsx tools/deep-light/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a
// brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=3 for Level 3), some Pearls, parts and photos, so the Dive goes
// deeper. TOUR_ROUNDS caps how many Rounds a levels save plays to miss once in every kind. TOUR_SLOW=4 slows the CPU fourfold during
// the Dive (Chromium's throttle), a rough stand-in for an iPad 9. TOUR_DPR sets the device pixel ratio (1 by default; 2 is an iPad's).
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, type CDPSession } from 'playwright';
import { CLIPS } from '../../src/deep-light/voice.gen';
import { deepBuild } from '../deep-light-build';
import { packVoice, selectedVoice } from '../static-build';

const [url = 'http://localhost:5185/', out = 'tour-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['see', 'through', 'sound', 'shadow', 'mirror', 'signal'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 40,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])),
  },
  dock: {
    owned: ['hull:r0', 'hull:r1', 'hull:r2', ...(LEVEL === 3 ? ['hull:r3'] : []), 'lights:r0', 'lights:r1', 'lights:r2', 'sonar:r0', 'sonar:r1', 'sonar:r2', 'motor:r0', 'motor:r1', 'claw:r0', 'claw:r1', 'flash:r0', 'flash:r1',
      'paint:yellow', 'paint:stripes', 'stripes:none', 'stripes:wave', 'beam:warm', 'beam:cyan', 'horn:toot', 'horn:whale', 'buddy:fish', 'buddy:octopus', 'trail:bubbles', 'trail:glow', 'dock:buoy', 'dock:lighthouse'],
    fitted: { hull: LEVEL === 3 ? 'r3' : 'r2', lights: 'r2', sonar: 'r2', motor: 'r1', claw: 'r1', flash: 'r1', paint: 'stripes', stripes: 'wave', beam: 'cyan', horn: 'whale', buddy: 'octopus', trail: 'glow' },
    goal: null, dives: 1, photos: ['clownfish', 'turtle', 'parrotfish', 'seahorse', 'lanternfish', 'hatchetfish'], zone: null, done: 4,
  },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: Number(process.env.TOUR_DPR ?? 1), hasTouch: true, isMobile: false });
const page = await context.newPage();
const cdp: CDPSession = await context.newCDPSession(page);
// Listens in on the voice: every recorded clip that plays, by its file, when it starts and stops.
const { index: packs } = packVoice(selectedVoice(deepBuild));
const clipAt = Object.fromEntries(Object.entries(packs.clips).map(([file, [pack, offset]]) => [`${packs.packs[pack]!.file}@${offset}`, file]));
await page.addInitScript((clipAt: Record<string, string>) => {
  type V = { f: string; t0: number; t1: number | null; dur: number };
  const w = window as unknown as { __clips: number; __voice: V[] };
  w.__clips = 0; w.__voice = [];
  const tag = new WeakMap<object, string>();
  // the voice comes in packs (tools/voice-packs.ts): a clip is a slice of its pack's Blob, known by the pack's file and where the slice starts
  const blob = Response.prototype.blob, slice = Blob.prototype.slice, bytes = Blob.prototype.arrayBuffer;
  Response.prototype.blob = async function (this: Response) { const b = await blob.call(this); if (/\/voice\//.test(this.url)) tag.set(b, this.url.split('/').pop()!); return b; };
  Blob.prototype.slice = function (this: Blob, ...a: Parameters<typeof slice>) { const s = slice.apply(this, a), p = tag.get(this), f = p && clipAt[`${p}@${a[0] ?? 0}`]; if (f) tag.set(s, f); return s; };
  Blob.prototype.arrayBuffer = async function (this: Blob) { const b = await bytes.call(this); const f = tag.get(this); if (f) tag.set(b, f); return b; };
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
}, clipAt);
const CLIP_PHRASE = Object.fromEntries(Object.entries(CLIPS).map(([p, f]) => [f, p]));
page.on('pageerror', e => problems.push(`pageerror: ${e.message} ${(e.stack ?? '').split('\n').slice(1, 4).join(' | ')}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('deep-light-place');
  if (s) localStorage.setItem('deep-light-save', JSON.stringify(s)); else localStorage.removeItem('deep-light-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${viewName}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.dl');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    // a rule meant for something else landing on the question
    if (game) { const g = getComputedStyle(game); if (g.backgroundColor !== 'rgba(0, 0, 0, 0)' || g.borderTopWidth !== '0px') out.push(`the question card has a background or border of its own (${game.className})`); }
    for (const el of document.querySelectorAll('button, [role=button]')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep') || (el as HTMLButtonElement).disabled) continue;
      if (document.querySelector('.reward') && el.closest('.card')) continue; // the last question, under the end of the Round
      if (document.querySelector('.dive-done') && !el.closest('.dive-done')) continue; // under the end of the Dive card
      if (document.querySelector('.log-card') && !el.closest('.log-card')) continue;
      const label = el.getAttribute('aria-label') ?? el.className.toString();
      // a tile in a scrolling tray (or a photo in the scrolling Logbook) is reached by scrolling: only the tray has to be on screen
      const scroller = el.parentElement?.closest('.dl-tray,.log-pages') as HTMLElement | null;
      const box = scroller ? scroller.getBoundingClientRect() : r;
      if (box.right > innerWidth + 1 || box.bottom > innerHeight + 1 || box.left < -1 || box.top < -1) out.push(`off screen: ${label}`);
      if (r.height < 43.5 || r.width < 43.5) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 8).join('; ')}`);
}

/** A finger held on a spot that may move (touch events, so the page sees pointerType touch). */
async function touch(type: 'touchStart' | 'touchMove' | 'touchEnd', p?: { x: number; y: number }) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: Math.round(p.x), y: Math.round(p.y), id: 1, radiusX: 8, radiusY: 8, force: 1 }] : [] });
}

type Q = { mode: string; level: number; replay?: boolean; q: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.dl[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const esc = (s: string) => s.replace(/(["\\])/g, '\\$1');
const tapKey = (key: string) => page.locator(`.game.dl [data-key="${esc(key)}"]`).first().tap();
const check = () => page.locator('.game.dl .check-btn').tap();

/** Mirror turns he has made so far on this question (the lab remembers them through a lesson). */
let turned: number[] = [];
/** The right answer, or (miss) a wrong one a child might give. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q;
  if (q.kind === 'see' && q.form === 'own') {
    const right: string[] = q.answer.split('+'), extra = (q.items as string[]).filter(i => !right.includes(i));
    // a miss leaves one out (or adds one that doesn't make light); a second, different miss adds one too many
    const want: string[] = !miss ? right : second ? [...right, extra[0]!] : right.length > 1 ? right.slice(1) : [extra[0]!];
    for (const id of q.items as string[]) {
      const on = (await page.locator(`.game.dl [data-key="${id}"]`).getAttribute('aria-pressed')) === 'true';
      if (on !== want.includes(id)) { await tapKey(id); await page.waitForTimeout(250); }
    }
    return check();
  }
  if (q.kind === 'through' && q.form === 'sort') {
    const bins = Object.fromEntries(q.answer.split(',').map((x: string) => x.split(':')));
    for (const id of q.items as string[]) { await tapKey(id); await page.waitForTimeout(150); await tapKey(`bin-${miss ? (second ? 'none' : 'all') : bins[id]}`); await page.waitForTimeout(150); }
    return check();
  }
  if (q.kind === 'mirror' && (q.form === 'turn' || q.form === 'two')) {
    if (!turned.length) turned = q.lab.mirrors.map((m: { turn: number }) => m.turn);
    if (miss && second) { await tapKey('m0'); turned[0] = (turned[0]! + 1) % 4; if (turned.join(',') === q.answer) { await tapKey('m0'); turned[0] = (turned[0]! + 1) % 4; } await page.waitForTimeout(150); }
    if (!miss) {
      const target = q.answer.split(',').map(Number);
      for (let i = 0; i < target.length; i++) while (turned[i] !== target[i]) { await tapKey(`m${i}`); turned[i] = (turned[i]! + 1) % 4; await page.waitForTimeout(150); }
    }
    return check();
  }
  if (q.kind === 'signal' && q.form === 'copy') {
    const pattern: string = !miss ? q.pattern : second ? 's'.repeat(q.pattern.length) : [...q.pattern].map((f: string) => (f === 's' ? 'l' : 's')).join('');
    for (const f of pattern) { await tapKey(f); await page.waitForTimeout(250); }
    return check();
  }
  const options: string[] = q.choices;
  const wrongs = options.filter(x => x !== q.answer);
  return tapKey(miss ? (second ? wrongs[wrongs.length - 1]! : wrongs[0]!) : q.answer);
}

// ---------- Start and Home ----------
await page.goto(url);
await page.waitForTimeout(800);
await shot('start');
await page.getByLabel('Start').tap({ timeout: 30000 });
await page.waitForTimeout(900);
await shot('home');

// ---------- a Round ----------
await page.getByRole('button', { name: 'Play', exact: true }).tap();
let asked = 0, tried = 0;
const seen = new Set<string>(), missedKinds = new Set<string>();
const ROUNDS = Number(process.env.TOUR_ROUNDS ?? (save ? 5 : 1));
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
    turned = [];
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
      // a fuller lesson hands him the stage: try what it offers (a lamp, a string, a light)
      await ready(60000);
      if (process.env.TOUR_MISS === '2') {
        await answer(p, true, true);
        // the fuller lesson ends by handing him the stage: a button to try (or the lamp to drag); do it as soon as it's offered
        for (let i = 0; i < 120; i++) {
          if (await page.locator('.try-btn').count()) { await shot(`q${asked}-try`); await page.locator('.try-btn').first().tap(); tried++; break; }
          if (await page.locator('.shadow-holder.drag').count()) {
            await shot(`q${asked}-try`);
            const b = (await page.locator('.shadow-holder.drag').boundingBox())!;
            await touch('touchStart', { x: b.x + b.width * 0.15, y: b.y + b.height * 0.3 });
            for (let k = 1; k <= 8; k++) { await touch('touchMove', { x: b.x + b.width * (0.15 + k * 0.09), y: b.y + b.height * 0.3 }); await page.waitForTimeout(60); }
            await touch('touchEnd'); tried++; break;
          }
          if (await page.locator('.game.dl[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) break;
          await page.waitForTimeout(200);
        }
        await ready(60000);
        await shot(`q${asked}-lesson2`);
      }
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

// ---------- the Dock: buy something ----------
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('deep-light-save') ?? '{}'));
await page.locator('.reward').getByRole('button', { name: 'Dock' }).tap();
await page.waitForTimeout(1200);
await shot('dock');
const balance = (await saved()).balance ?? 0;
await page.getByRole('tab', { name: 'Paint' }).tap();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Orange', exact: true }).tap();
await page.waitForTimeout(600);
await shot('dock-trying');
await page.getByRole('button', { name: 'Buy', exact: true }).tap();
await page.waitForTimeout(3200);
if (balance >= 4 && !(await saved()).dock?.owned?.includes('paint:orange')) problems.push(`Orange was not bought with ${balance} Pearls`);
for (const t of ['Buddy', 'The Dock', 'Headlights', 'Hull']) { await page.getByRole('tab', { name: t, exact: true }).tap(); await page.waitForTimeout(250); }
await shot('dock-hull-tab');
await page.getByRole('button', { name: 'The Deep Trench', exact: true }).tap();
await page.waitForTimeout(500);

// ---------- a Dive: hold a finger on each animal until its photo is taken, to the end ----------
const before = await saved();
await page.locator('.bay-go .dive-btn').tap();
await page.waitForTimeout(1500);
type D = { phase: string; t: number; zone: string; photos: string[]; treasure: number; fps: number; worst: number; work: number; workMax: number; sub: { x: number; y: number }; animals: { id: string; x: number; y: number; done: boolean }[]; treasures: { x: number; y: number; got: boolean }[] } | null;
const dive = () => page.evaluate(() => (window as unknown as { __dive?(): D }).__dive?.() ?? null);
const slow = Number(process.env.TOUR_SLOW ?? 1);
if (slow > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: slow });
let shotDive = false, worst = 0, workMax = 0;
const fpsSeen: number[] = [], works: number[] = [];
const t0 = Date.now();
const inside = (p: { x: number; y: number }) => ({ x: Math.max(70, Math.min(VIEW.width - 110, p.x)), y: Math.max(90, Math.min(VIEW.height - 90, p.y)) });
let holding = false;
for (let i = 0; i < 600; i++) {
  const d = await dive();
  if (!d || d.phase !== 'dive') break;
  worst = Math.max(worst, d.worst); workMax = Math.max(workMax, d.workMax); if (d.fps && d.t > 2) { fpsSeen.push(d.fps); works.push(d.work); }
  const m = d.animals.filter(a => !a.done).sort((a, b) => Math.hypot(a.x - d.sub.x, a.y - d.sub.y) - Math.hypot(b.x - d.sub.x, b.y - d.sub.y))[0];
  const tr = d.treasures.find(x => !x.got);
  const goal = m ?? tr ?? d.sub;
  // a finger steering toward a corner must land on the sea, not on the Sonar and Horn buttons (a row on a sideways phone)
  let p = inside(goal);
  for (const [dx, dy] of [[0, 0], [-170, 0], [0, -110], [-170, -110]] as const) {
    const q = { x: p.x + dx, y: p.y + dy };
    if (await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === 'CANVAS', q)) { p = q; break; }
  }
  await touch(holding ? 'touchMove' : 'touchStart', p); holding = true;
  if (!shotDive && d.t > 6) { await shot(`dive-${d.zone}`); shotDive = true; }
  await page.waitForTimeout(150);
}
if (holding) await touch('touchEnd');
if (slow > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
for (let i = 0; i < 60 && (await dive())?.phase !== 'done'; i++) await page.waitForTimeout(250);
const end = await dive();
const diveS = (Date.now() - t0) / 1000;
if (end?.phase !== 'done') problems.push(`the Dive never finished (${JSON.stringify(end && { phase: end.phase, t: end.t })})`);
if (!end?.photos.length) problems.push('the Dive took no photos');
const fpsLow = fpsSeen.length ? Math.min(...fpsSeen) : 0;
if (fpsLow && fpsLow < 50) problems.push(`the Dive dropped to ${fpsLow.toFixed(0)} fps (worst frame ${(worst * 1000).toFixed(0)} ms)`);
await page.waitForTimeout(1500);
await shot('dive-done');
await page.waitForSelector('.dive-done .btns:not(.asleep)', { timeout: 20000 }).catch(() => problems.push('the end of the Dive never woke up'));
await shot('dive-done-awake');
const after = (await saved()).dock;
if ((after?.dives ?? 0) !== (before.dock?.dives ?? 0) - 1) problems.push(`the Dive was not used (${before.dock?.dives} → ${after?.dives})`);
if ((after?.photos?.length ?? 0) <= (before.dock?.photos?.length ?? 0) && end?.photos.some(p => !before.dock?.photos?.includes(p))) problems.push('the new photos did not go in the Logbook');

// ---------- the Logbook ----------
await page.locator('.dive-done').getByRole('button', { name: 'Logbook' }).tap();
await page.waitForTimeout(900);
await shot('logbook');
const got = page.locator('.log-photo.got').first();
if (await got.count()) { await got.tap(); await page.waitForTimeout(700); await shot('logbook-card'); await page.getByRole('button', { name: 'Close' }).tap(); }
else problems.push('the Logbook has no photos after a Dive');

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
const avg = (a: number[]) => (a.length ? a.reduce((p, q) => p + q, 0) / a.length : 0);
console.log(`${viewName} ${process.env.TOUR_SAVE ?? 'fresh'}${save ? ` L${LEVEL}` : ''}: ${asked} questions (${[...seen].join(', ')}), missed and retried in ${[...missedKinds].join(', ')}${process.env.TOUR_MISS === '2' ? `, tried it himself in ${tried} fuller lessons` : ''}; Dive "${end?.zone}" in ${diveS.toFixed(0)}s, ${end?.photos.length} photos (${end?.photos.join(', ')}), ${end?.treasure} treasure, ${fpsLow.toFixed(0)} fps at worst (worst frame ${(worst * 1000).toFixed(0)} ms; drawing ${avg(works).toFixed(2)} ms a frame on average, ${workMax.toFixed(1)} ms at most${slow > 1 ? `, CPU ×${slow} slower` : ''}); ${log.length} voice clips`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
