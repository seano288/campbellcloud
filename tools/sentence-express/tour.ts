// Plays Sentence Express in a real browser, as a child who taps (by touch, as on the iPad): the Start screen and Home, a whole Round
// (with one deliberate miss in every kind it meets, so a lesson runs, and then the same question answered again: it must still take
// taps), the end of the Round, a purchase in the Shed, laying track on his Layout with a finger drag, and a whole Delivery (the card,
// sliding the throttle, tapping points when they light up, the pickup and the drop-off), with screenshots. Answers are read from the
// page (window.__round in dev) and worked out from the same sentence tables the game uses; every tap waits for the prompt to be said.
//   npm run dev:sentence-express   (in another shell)
//   npx tsx tools/sentence-express/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a
// brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=1|2|3 picks another), some Bolts, scenery and track.
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit, type CDPSession } from 'playwright';
import { piecesOf } from '../../src/sentence-express/reading/problems';
import { sentence } from '../../src/sentence-express/sentences/index';
import { CLIPS } from '../../src/sentence-express/voice.gen';

const [url = 'http://localhost:5194/', out = 'tour-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['order', 'marks', 'mean', 'ask', 'fix'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 40,
  learning: {
    // TOUR_STREAK=9: one more right answer in a kind is Mastery, so the end of the Round says Level up (or the star at Level 3)
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: Array(Number(process.env.TOUR_STREAK ?? 2)).fill('clean'), opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])),
  },
  // some things bought already, and a station or two open, so the Delivery goes somewhere new
  trains: { owned: ['engine:tank', 'car:wagon', 'paint:red', 'car:coal', 'scenery:trees', 'scenery:tunnel', 'track:box1'], engine: 'tank', cars: ['wagon', 'coal'], paint: 'red', open: 2, delivered: ['farm'], deliveries: 1, trips: 1, goal: null },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;

const browser = process.env.TOUR_BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true, isMobile: false });
const page = await context.newPage();
const cdp: CDPSession | null = process.env.TOUR_BROWSER === 'webkit' ? null : await context.newCDPSession(page);
// Listens in on the sound: every recorded clip that plays, by its file (followed from the fetch, through decoding and the game's
// trim, to the buffer that starts), when it starts and stops and whether it was cut off, and every sound effect's first note.
await page.addInitScript(() => {
  type V = { f: string; t0: number; t1: number | null; dur: number; cut: boolean };
  const w = window as unknown as { __clips: number; __voice: V[]; __fx: { t: number; type: string; f: number }[]; __ctx: AudioContext[] };
  w.__clips = 0; w.__voice = []; w.__fx = []; w.__ctx = [];
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
      const e: V = { f, t0: performance.now(), t1: null, dur: this.buffer!.duration, cut: false };
      w.__voice.push(e);
      const stop = this.stop;
      this.stop = function (this: AudioBufferSourceNode, ...s: Parameters<typeof stop>) { if (e.t1 === null) { e.t1 = performance.now(); e.cut = e.t1 - e.t0 < e.dur * 1000 - 40; } return stop.apply(this, s); };
      this.addEventListener('ended', () => { if (e.t1 === null) e.t1 = performance.now(); });
    }
    return start.apply(this, a);
  };
  const osc = BaseAudioContext.prototype.createOscillator;
  BaseAudioContext.prototype.createOscillator = function (this: BaseAudioContext) {
    const o = osc.call(this) as OscillatorNode & { __f?: number }, set = o.frequency.setValueAtTime.bind(o.frequency), go = o.start.bind(o);
    o.frequency.setValueAtTime = (v: number, t: number) => { o.__f ??= Math.round(v); return set(v, t); };
    o.start = (when?: number) => { w.__fx.push({ t: performance.now() + Math.max(0, (when ?? 0) - this.currentTime) * 1000, type: o.type, f: o.__f ?? 0 }); return go(when); };
    return o;
  };
  const Ctx = window.AudioContext;
  window.AudioContext = class extends Ctx { constructor(...a: ConstructorParameters<typeof Ctx>) { super(...a); w.__ctx.push(this); } };
});
/** The voice so far: each clip as its phrase, with when it started (ms since the tour began) and whether it was cut off. */
const CLIP_PHRASE = Object.fromEntries(Object.entries(CLIPS).map(([p, f]) => [f, p]));
type Heard = { f: string; t0: number; t1: number | null; dur: number; cut: boolean };
const heard = () => page.evaluate(() => (window as unknown as { __voice: Heard[] }).__voice);
const FX: Record<string, string> = { 'triangle:523': 'right', 'square:160': 'miss', 'triangle:1800': 'clink', 'triangle:1319': 'chime', 'square:220': 'nope', 'square:880': 'whistle (question)', 'square:784': 'whistle', 'triangle:1568': 'bell', 'sawtooth:2200': 'squeal', 'square:300': 'points', 'triangle:460': 'count (lesson)', 'triangle:1047': 'fanfare' };
page.on('pageerror', e => problems.push(`pageerror: ${e.message} ${(e.stack ?? '').split('\n').slice(1, 4).join(' | ')}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('sentence-express-place');
  if (s) localStorage.setItem('sentence-express-save', JSON.stringify(s)); else localStorage.removeItem('sentence-express-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${viewName}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.se');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button, [role=button], [role=slider]')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep') || (el as HTMLButtonElement).disabled) continue;
      if (document.querySelector('.reward') && el.closest('.card')) continue; // the last question, under the end of the Round
      if (document.querySelector('.dl-card,.dl-result') && !el.closest('.dl-card,.dl-result') && el.closest('.delivery-screen')) continue; // under the card
      const label = el.getAttribute('aria-label') ?? el.className.toString();
      // a tile in a scrolling tray is reached by scrolling it: only the tray itself has to be on screen
      const scroller = el.parentElement?.closest('.se-tray,.scenery-tray') as HTMLElement | null;
      const box = scroller ? scroller.getBoundingClientRect() : r;
      if (box.right > innerWidth + 1 || box.bottom > innerHeight + 1 || box.left < -1 || box.top < -1) out.push(`off screen: ${label}`);
      if (r.height < 43.5 || r.width < 43.5) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 8).join('; ')}`);
}

/** A finger: down at the first point, through the rest, up at the last (touch events, so the page sees pointerType touch). */
async function drag(points: { x: number; y: number }[], stepMs = 30) {
  if (!cdp) { await page.mouse.move(points[0]!.x, points[0]!.y); await page.mouse.down(); for (const p of points.slice(1)) { await page.mouse.move(p.x, p.y, { steps: 4 }); } await page.mouse.up(); return; }
  const tp = (p: { x: number; y: number }) => [{ x: Math.round(p.x), y: Math.round(p.y), id: 1, radiusX: 8, radiusY: 8, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(points[0]!) });
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!, b = points[i]!;
    for (let k = 1; k <= 4; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp({ x: a.x + (b.x - a.x) * k / 4, y: a.y + (b.y - a.y) * k / 4 }) }); await page.waitForTimeout(stepMs / 4); }
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const touchAt = (p: { x: number; y: number }) => page.touchscreen.tap(Math.round(p.x), Math.round(p.y));

type Q = { mode: string; level: number; replay?: boolean; q: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.se[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const tapEl = (sel: string) => page.locator(sel).first().tap();

/** The right answer, or (miss) a wrong one a child might give. */
async function answer(p: NonNullable<Q>, miss: boolean) {
  const q = p.q;
  if (q.kind === 'order') {
    const right = piecesOf(sentence(q.s));
    // his train may already have cars on it after a lesson: take off from the first wrong one
    const onTrain: string[] = await page.locator('.se-track .piece.on-train').evaluateAll(els => els.map(e => e.getAttribute('data-piece')!));
    const wrongAt = onTrain.findIndex((x, i) => x !== right[i]);
    if (wrongAt >= 0) { await tapEl(`.se-track .piece.on-train[data-idx="${wrongAt}"]`); await page.waitForTimeout(200); }
    const kept = wrongAt >= 0 ? onTrain.slice(0, wrongAt) : onTrain;
    let want = right.slice(kept.length);
    // a miss: the two middle cars the wrong way round
    if (miss && want.length >= 4) want = [want[0]!, want[2]!, want[1]!, ...want.slice(3)];
    const used = new Set<number>(await page.locator('.se-track .piece.on-train').evaluateAll(() => [] as number[]));
    const yard: string[] = q.yard;
    const taken = new Set<number>();
    const inTrain = await page.evaluate(() => [...document.querySelectorAll('.se-yard .piece.in-yard')].map(e => Number(e.getAttribute('data-idx'))));
    for (let i = 0; i < yard.length; i++) if (!inTrain.includes(i)) taken.add(i);
    for (const piece of want) {
      const i = yard.findIndex((y, k) => y === piece && !taken.has(k) && !used.has(k));
      taken.add(i);
      await tapEl(`.se-yard .piece[data-idx="${i}"]`);
      await page.waitForTimeout(260);
    }
    return;
  }
  if (q.kind === 'marks') {
    const c = miss ? (q.choices as string[]).find(x => x !== q.answer)! : q.answer;
    return tapEl(`.se-choices .piece[data-piece="${CSS_ESC(c)}"]`);
  }
  if (q.kind === 'mean' || q.kind === 'ask') {
    const c = miss ? (q.choices as { key: string }[]).find(x => x.key !== q.answer)!.key : q.answer;
    return page.locator('.pic-card').filter({ has: page.locator('*') }).nth((q.choices as { key: string }[]).findIndex(x => x.key === c)).tap();
  }
  // Fix the Train: the bad car, then its fix
  const n = (q.cars as string[]).length;
  if (miss) { const good = [...Array(n).keys()].find(i => !(q.bad as number[]).includes(i))!; return tapEl(`.se-train .piece.fixable[data-idx="${good}"]`); }
  await tapEl(`.se-train .piece.fixable[data-idx="${q.bad[0]}"]`);
  await page.waitForTimeout(500);
  if (q.mistake === 'capital') return tapEl('[aria-label="Give it a capital"]');
  if (q.mistake === 'extra') return tapEl('[aria-label="Take it off"]');
  if (q.mistake === 'mark') return tapEl(`.se-choices .piece[data-piece="${CSS_ESC(sentence(q.s).mark)}"]`);
  return tapEl(`.se-train .piece.fixable[data-idx="${q.bad[1]}"]`);
}
const CSS_ESC = (s: string) => s.replace(/(["\\.?!])/g, '\\$1');

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
const ROUNDS = Number(process.env.TOUR_ROUNDS ?? 1);
for (let r = 0; r < ROUNDS; r++) {
  if (r > 0) { await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }); await page.getByRole('button', { name: 'Play again' }).tap(); await page.waitForTimeout(500); }
  for (let guard = 0; guard < 30; guard++) {
    if (await page.locator('.reward h2').isVisible()) break;
    const p = await question();
    if (!p) { await page.waitForTimeout(300); continue; }
    await ready();
    const id = `${p.mode}-L${p.level}-${p.q.form ?? p.q.mistake ?? p.q.about ?? ''}`;
    seen.add(id);
    await shot(`q${++asked}-${id}`);
    // one deliberate miss in every kind he meets, then the same question again: it must still take taps after the lesson
    const miss = process.env.TOUR_MISS !== '0' && !missedKinds.has(p.mode) && !p.replay;
    await answer(p, miss);
    if (miss) {
      missedKinds.add(p.mode);
      await page.waitForTimeout(2200);
      await shot(`q${asked}-lesson`);
      await ready(60000);
      await answer(p, false);
    }
    for (let i = 0; i < 160; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
    if (JSON.stringify(await question()) === JSON.stringify(p) && !(await page.locator('.reward h2').isVisible())) problems.push(`question ${id} did not move on after the right answer`);
  }
}
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
await shot('round-done-awake');

// ---------- the Shed: buy something ----------
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('sentence-express-save') ?? '{}'));
await page.getByRole('button', { name: 'Shed' }).tap();
await page.waitForTimeout(1200);
await shot('shed');
const balance = (await saved()).balance ?? 0;
await page.getByRole('tab', { name: 'Track' }).tap();
await page.waitForTimeout(300);
const box = (await saved()).trains?.owned?.includes('track:box1') ? 'Blue Track Box' : 'Red Track Box';
await page.getByRole('button', { name: box, exact: true }).tap();
await page.waitForTimeout(600);
await shot('shed-trying');
await page.getByRole('button', { name: 'Buy', exact: true }).tap();
await page.waitForTimeout(3200);
const boxKey = box === 'Red Track Box' ? 'track:box1' : 'track:box2';
if (balance >= 2 && !(await saved()).trains?.owned?.includes(boxKey)) problems.push(`the ${box} was not bought with ${balance} Bolts`);
await page.getByRole('tab', { name: 'Cars' }).tap();
await page.waitForTimeout(300);
await shot('shed-bought');

// ---------- the Layout: lay track with a finger ----------
await page.getByRole('button', { name: 'Layout', exact: true }).tap();
await page.waitForTimeout(1200);
await shot('layout');
type L = { w: number; h: number; cells: number[]; supply: number; cell: number } | null;
const lay = () => page.evaluate(() => { const l = (window as unknown as { __layout?(): L })?.__layout?.(); return l && { w: l.w, h: l.h, cells: l.cells, supply: l.supply, cell: l.cell }; });
const xy = (cell: number) => page.evaluate(c => (window as unknown as { __layout(): { xy(c: number): { x: number; y: number } } }).__layout().xy(c), cell);
const before = await lay();
if (!before) problems.push('the Layout never drew');
else {
  if (before.cell < 30) problems.push(`table squares are only ${Math.round(before.cell)}px`);
  // a spur from the top of the loop down into the middle of the table: it should close itself up
  const col = 3, path = [1, 2, 3, 4].map(y => y * before.w + col);
  await drag(await Promise.all(path.map(xy)));
  await page.waitForTimeout(800);
  const after = (await lay())!;
  const laid = after.cells.filter(m => m).length - before.cells.filter(m => m).length;
  if (laid <= 0) problems.push('a finger drag laid no track');
  if (after.cells.some(m => [1, 2, 4, 8].includes(m))) problems.push('a loose end was left after laying track');
  console.log(`layout: laid ${laid} squares with a drag (${before.supply} → ${after.supply} left), squares ${Math.round(before.cell)}px`);
  await shot('layout-laid');
  // the rubber rubs out a points square he taps (it used to switch them instead)
  const pointsAt = after.cells.findIndex(m => [7, 11, 13, 14].includes(m));
  if (pointsAt >= 0) {
    await page.getByRole('radio', { name: 'Rub out' }).tap();
    await page.waitForTimeout(300);
    await touchAt(await xy(pointsAt));
    await page.waitForTimeout(500);
    if ((await lay())!.cells[pointsAt]) problems.push('a tap with the rubber on points did not rub them out');
    await page.getByRole('radio', { name: 'Lay track' }).tap();
    await page.waitForTimeout(300);
  }
  // the scenery tool: a piece from the tray onto an empty square
  await page.getByRole('radio', { name: 'Scenery' }).tap();
  await page.waitForTimeout(600);
  const tile = page.locator('.scenery-tile').first();
  if (await tile.count()) {
    await tile.tap();
    await page.waitForTimeout(300);
    const empty = after.cells.findIndex((m, c) => !m && c > after.w * 2 && c % after.w > 4);
    await touchAt(await xy(empty));
    await page.waitForTimeout(600);
    if (!(await saved()).trains?.layout?.scenery?.length) problems.push('scenery was not placed');
  }
  await shot('layout-scenery');
}

// ---------- a Delivery: the card, the throttle, the points, the pickup, Toy Town ----------
const tripsBefore = (await saved()).trains?.trips ?? 0;
await page.getByRole('button', { name: 'Deliver' }).first().tap();
await page.waitForTimeout(2200);
await shot('delivery-card');
await page.getByRole('button', { name: 'Go', exact: true }).tap();
await page.waitForTimeout(900);
const thr = (await page.locator('.throttle').boundingBox())!;
// slide the throttle up with a finger
await drag([{ x: thr.x + thr.width / 2, y: thr.y + thr.height - 30 }, { x: thr.x + thr.width / 2, y: thr.y + thr.height * .45 }, { x: thr.x + thr.width / 2, y: thr.y + 20 }]);
await page.getByRole('button', { name: 'Whistle' }).tap();
await page.waitForTimeout(1200);
await page.getByRole('button', { name: 'Bell' }).tap();
type D = { phase: string; leg: string; hint: number | null; t: number } | null;
const dl = () => page.evaluate(() => { const d = (window as unknown as { __delivery?(): D }).__delivery?.(); return d && { phase: d.phase, leg: d.leg, hint: d.hint, t: d.t }; });
let shotDrive = false, lastLeg = '', points = 0;
for (let i = 0; i < 400; i++) {
  const d = await dl();
  if (!d || d.phase === 'done') break;
  if (d.leg !== lastLeg) {
    lastLeg = d.leg;
    if (d.leg === 'dropoff') {
      // after loading the throttle is back at zero: slide it up again
      await drag([{ x: thr.x + thr.width / 2, y: thr.y + thr.height - 30 }, { x: thr.x + thr.width / 2, y: thr.y + 20 }]);
      await shot('delivery-loaded');
    }
  }
  if (d.hint !== null) { const p = await page.evaluate(c => (window as unknown as { __delivery(): { xy(c: number): { x: number; y: number } } }).__delivery().xy(c), d.hint); if (p) { await touchAt(p); points++; } }
  if (!shotDrive && d.t > 2.5) { shotDrive = true; await shot('delivery-driving'); }
  await page.waitForTimeout(300);
}
const end = await dl();
if (end?.phase !== 'done') problems.push(`the Delivery never finished (${JSON.stringify(end)})`);
await page.waitForTimeout(2500);
await shot('delivery-done');
await page.waitForTimeout(7000); // the whole of what a finished Delivery says: the Bolts, a gift, a station opening
const s2 = await saved();
if ((s2.trains?.trips ?? 0) !== tripsBefore + 1) problems.push('the Delivery was not counted');

// ---------- leaving: what a screen says, and the Delivery itself, stop when he goes ----------
/** No clip may still be playing, or start, after he has left (a little slack for the tap that left). */
async function quietAfter(where: string, left: number, allowed: readonly string[] = []) {
  await page.waitForTimeout(1500);
  // the next screen's own greeting is fine; anything else still playing, or starting, after he left is not
  const late = (await heard()).filter(h => !allowed.includes(CLIP_PHRASE[h.f]!) && (h.t0 >= left + 60 || h.t1 === null || h.t1 > left + 120));
  if (late.length) problems.push(`still talking after leaving ${where}: ${late.map(h => `"${CLIP_PHRASE[h.f]}"`).join(', ')}`);
}
const now = () => page.evaluate(() => performance.now());
const deliveriesBefore = (await saved()).trains?.deliveries ?? 0;
if (deliveriesBefore > 0) {
  await page.getByRole('button', { name: 'Deliver again' }).tap();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Go', exact: true }).tap();
  await page.waitForTimeout(400);
  const t2 = (await page.locator('.throttle').boundingBox())!;
  await drag([{ x: t2.x + t2.width / 2, y: t2.y + t2.height - 30 }, { x: t2.x + t2.width / 2, y: t2.y + 20 }]);
  await page.getByRole('button', { name: 'Whistle' }).tap();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Leave' }).tap();
  await page.waitForTimeout(250);
  const left = await now();
  await page.getByRole('button', { name: 'Tap again to leave' }).tap();
  const t0 = (await dl())?.t ?? 0;
  await page.waitForTimeout(600);
  if (((await dl())?.t ?? 0) !== t0) problems.push('the Delivery kept running after he left it');
  if (!(await page.locator('.layout-screen').count())) problems.push('leaving a Delivery did not land on the Layout');
  if (((await saved()).trains?.deliveries ?? 0) !== deliveriesBefore) problems.push('leaving a Delivery halfway used it up');
  await quietAfter('a Delivery', left, ['Your Layout!', 'Drag your finger to lay track!']);
}
// the Layout says hello; Home straight away stops it
if (!(await page.locator('.layout-screen').count())) { await page.getByRole('button', { name: 'Layout', exact: true }).first().tap(); await page.waitForTimeout(300); }
await page.locator('.layout-screen').getByRole('button', { name: 'Home' }).tap();
await quietAfter('the Layout', await now());
// a Round: the question starts to be said, then 🏠 twice
await page.getByRole('button', { name: 'Play', exact: true }).tap();
await page.waitForTimeout(700);
await page.locator('.roundbar').getByRole('button', { name: 'Home' }).tap();
await page.waitForTimeout(300);
const leftRound = await now();
await page.locator('.roundbar').getByRole('button', { name: 'Tap again to go home' }).tap();
await quietAfter('a Round', leftRound);
if (!(await page.locator('.home-screen').count())) problems.push('🏠 twice did not go Home');

// ---------- the voice, as heard ----------
const log = (await heard()).sort((a, b) => a.t0 - b.t0);
for (let i = 1; i < log.length; i++) {
  const a = log[i - 1]!, b = log[i]!;
  if (a.t1 !== null && b.t0 < a.t1 - 25) problems.push(`two clips at once: "${CLIP_PHRASE[a.f]}" and "${CLIP_PHRASE[b.f]}"`);
}
const fx = await page.evaluate(() => (window as unknown as { __fx: { t: number; type: string; f: number }[] }).__fx);
const fxSeen = [...new Set(fx.map(x => FX[`${x.type}:${x.f}`]).filter(Boolean))];
const t00 = log[0]?.t0 ?? 0;
writeFileSync(`${out}/voice-${viewName}.txt`, [
  ...log.map(h => `${((h.t0 - t00) / 1000).toFixed(2).padStart(7)}s ${(((h.t1 ?? h.t0) - h.t0) / 1000).toFixed(2)}/${h.dur.toFixed(2)}s ${h.cut ? 'CUT ' : '    '}${CLIP_PHRASE[h.f] ?? h.f}`),
  '', `sound effects: ${fxSeen.join(', ')}`,
].join('\n'));
console.log(`voice: ${log.length} clips (${log.filter(h => h.cut).length} cut off by a tap or the next line), sound effects: ${fxSeen.join(', ')}`);

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
console.log(`${viewName} ${process.env.TOUR_SAVE ?? 'fresh'}${save ? ` L${LEVEL}` : ''}: ${asked} questions (${[...seen].join(', ')}), missed and retried in ${[...missedKinds].join(', ')}, ${points} points taps, delivery took ${end?.t.toFixed(1)}s, ${clips} voice clips played`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
