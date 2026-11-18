// The writing pad under real fingers (Chrome DevTools Protocol touch events, which the browser turns into pointer events as on the
// iPad): a clean stroke; a second finger landing mid-stroke; a resting hand already on the glass; a finger that slides off the pad;
// a touch the browser cancels; very fast and very slow strokes; a letter drawn tiny or huge; a stroke the wrong way (a miss, a lesson,
// then the pad must still take strokes); and mashing the pad. It fails on a miss the checker invents, a pad that stops taking strokes,
// or a page error.
//   npm run dev:sky-writer   (in another shell)
//   npx tsx tools/sky-writer/fingers.ts <url>
// FINGERS_VIEW=portrait|landscape|phone|side (iPad upright by default).
import { chromium } from 'playwright';

const [url = 'http://localhost:5183/'] = process.argv.slice(2);
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const VIEW = VIEWS[(process.env.FINGERS_VIEW ?? 'portrait') as keyof typeof VIEWS];
const MODES = ['trace', 'start', 'flip', 'size', 'write', 'word'];
const saveFor = (only: string, level: number) => ({
  version: 1, balance: 0,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level, window: [], opened: m === only, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), families: ['lines', 'c', 'tall', 'bumps', 'slants', 'rest', 'numbers', 'capitals'], sinceMeet: 0,
    strength: { lines: 3, c: 3, tall: 3, bumps: 3, slants: 3, rest: 3, numbers: 3, capitals: 3 },
  },
});
type Pad = { box: number; boxes: number; stroke: number; strokes: number; ch: string; pts: number[][]; done: number[]; scale: number } | null;
type Log = { ch: string; outcome: { kind: string; why?: string }; finished: number[]; n: number };

const problems: string[] = [];
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

async function session(only: string, level: number, run: (h: Helpers) => Promise<void>) {
  const context = await browser.newContext({ viewport: VIEW, hasTouch: true });
  const page = await context.newPage(), cdp = await context.newCDPSession(page);
  page.on('pageerror', e => problems.push(`${only} L${level} pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`${only} L${level} console: ${m.text()}`); });
  await page.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.removeItem('sky-writer-place'); localStorage.setItem('sky-writer-save', JSON.stringify(s)); }, saveFor(only, level));
  await page.goto(url);
  await page.getByLabel('Start').click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Play', exact: true }).first().click();
  type P = { id: number; x: number; y: number };
  const send = (type: string, pts: P[]) => cdp.send('Input.dispatchTouchEvent', { type: type as 'touchStart', touchPoints: pts.map(p => ({ x: p.x, y: p.y, id: p.id })) });
  const pad = () => page.evaluate(() => (window as any).__pad?.() as Pad);
  const log = () => page.evaluate(() => ((window as any).__padLog ?? []) as Log[]);
  const question = () => page.evaluate(() => JSON.stringify((window as any).__round?.()));
  /** Answers any question that isn't written (a Level 3 save opens the tap kinds too), until a writing one is up and ready. */
  async function ready() {
    for (let i = 0; i < 400; i++) {
      const q = await page.evaluate(() => (window as any).__round?.());
      if (q && q.mode !== 'meet' && !['trace', 'write', 'word'].includes(q.q.kind) && (await page.locator('.game.sw[data-ready="yes"]').count())) {
        if (q.q.step === 'second') {
          const at = await page.evaluate(() => { const el = document.querySelector('.sw-hit[data-stroke="1"]') as SVGGeometryElement | null; if (!el) return null; const len = el.getTotalLength?.() ?? 0, pt = len ? el.getPointAtLength(len * 0.6) : { x: Number(el.getAttribute('cx')), y: Number(el.getAttribute('cy')) }; const s = new DOMPoint(pt.x, pt.y).matrixTransform(el.getScreenCTM()!); return { x: s.x, y: s.y }; });
          if (at) await page.mouse.click(at.x, at.y);
        } else await page.locator(`.game.sw [data-key="${q.q.answer}"]`).first().click();
        await page.waitForTimeout(1500);
        continue;
      }
      if (q?.mode === 'meet') { await page.getByRole('button', { name: 'Go' }).click().catch(() => {}); await page.waitForTimeout(500); continue; }
      if (await page.locator('.game.sw[data-ready="yes"]').count() && (await pad())?.pts.length) return true;
      await page.waitForTimeout(100);
    }
    problems.push(`${only} L${level}: the pad never became ready`); return false;
  }
  /** One finger along screen points; `extra` touches stay down (still) the whole time. */
  async function stroke(pts: number[][], { ms = 4, every = 1, extra = [] as P[], cancel = false } = {}) {
    const at = (i: number): P => ({ id: 1, x: pts[i]![0]!, y: pts[i]![1]! });
    await send('touchStart', [...extra, at(0)]);
    for (let i = every; i < pts.length; i += every) { await send('touchMove', [...extra, at(i)]); if (ms) await page.waitForTimeout(ms); }
    await send('touchMove', [...extra, at(pts.length - 1)]);
    await send(cancel ? 'touchCancel' : 'touchEnd', cancel ? [] : extra);
    if (extra.length && !cancel) await send('touchEnd', []);
    await page.waitForTimeout(150);
  }
  async function writeRest() {
    const before = await question();
    for (let i = 0; i < 40; i++) {
      if ((await question()) !== before || (await page.locator('.reward h2').isVisible())) return true;
      const p = await pad();
      if (!p) return true;
      if (!p.pts.length || !(await page.locator('.game.sw[data-ready="yes"]').count())) { await page.waitForTimeout(200); continue; }
      await stroke(p.pts);
    }
    return false;
  }
  const misses = async () => (await log()).filter(l => l.outcome.kind === 'miss');
  try { await ready(); await run({ page, pad, log, stroke, ready, writeRest, misses, question, send }); }
  catch (e) { problems.push(`${only} L${level}: ${(e as Error).message}`); }
  await context.close();
}
type Helpers = { page: import('playwright').Page; pad(): Promise<Pad>; log(): Promise<Log[]>; stroke(pts: number[][], o?: { ms?: number; every?: number; extra?: { id: number; x: number; y: number }[]; cancel?: boolean }): Promise<void>; ready(): Promise<boolean>; writeRest(): Promise<boolean>; misses(): Promise<Log[]>; question(): Promise<string>; send(type: string, pts: { id: number; x: number; y: number }[]): Promise<unknown> };

const expectNoMiss = async (h: Helpers, what: string) => { const m = await h.misses(); if (m.length) problems.push(`${what}: called a miss ${JSON.stringify(m.at(-1))}`); };
const scaleAbout = (pts: number[][], f: number) => { const [x0, y0] = pts[0]!; return pts.map(([x, y]) => [x0! + (x! - x0!) * f, y0! + (y! - y0!) * f]); };

for (const [only, level] of [['trace', 1], ['trace', 3], ['write', 2]] as const) {
  // a second finger, a resting hand, sliding off the pad, a cancelled touch
  await session(only, level, async h => {
    let p = (await h.pad())!;
    const box = (await h.page.locator('.sw-pad').boundingBox())!;
    // a second finger lands partway through the stroke and stays: the first finger's stroke still counts
    const second = { id: 2, x: box.x + box.width - 30, y: box.y + 30 };
    const half = Math.floor(p.pts.length / 2);
    await h.send('touchStart', [{ id: 1, x: p.pts[0]![0]!, y: p.pts[0]![1]! }]);
    for (let i = 1; i < p.pts.length; i++) { await h.send('touchMove', i >= half ? [{ id: 1, x: p.pts[i]![0]!, y: p.pts[i]![1]! }, second] : [{ id: 1, x: p.pts[i]![0]!, y: p.pts[i]![1]! }]); await h.page.waitForTimeout(3); }
    await h.send('touchEnd', [second]); await h.send('touchEnd', []); await h.page.waitForTimeout(200);
    let q = await h.pad();
    // the stroke counted when the pad has moved on to the next stroke, the next box, or the next question
    const counted = (was: NonNullable<Pad>, now: Pad) => !now || now.stroke !== was.stroke || now.box !== was.box || now.ch !== was.ch;
    if (!counted(p, q) && (await h.log()).at(-1)?.outcome.kind !== 'ok') problems.push(`${only} L${level} ${p.ch}: a second finger stopped the first finger's stroke counting`);
    await expectNoMiss(h, `${only} L${level} second finger`);
    // a hand resting on the glass first, then the finger writes
    await h.ready(); p = (await h.pad())!;
    if (p.pts.length) {
      await h.stroke(p.pts, { extra: [{ id: 3, x: box.x + 20, y: box.y + box.height - 20 }] });
      q = await h.pad();
      if (!counted(p, q)) problems.push(`${only} L${level} ${p.ch}: a resting hand stopped the finger writing`);
      await expectNoMiss(h, `${only} L${level} resting hand`);
    }
    // a finger that slides off the pad partway: no error, no miss, and the next stroke still counts
    await h.ready(); p = (await h.pad())!;
    if (p.pts.length) {
      const off = [...p.pts.slice(0, Math.max(2, Math.floor(p.pts.length / 2))), [box.x + box.width + 40, box.y - 40]];
      await h.stroke(off);
      await expectNoMiss(h, `${only} L${level} off the pad`);
    }
    // the browser cancels a touch partway (an iPadOS gesture): no miss
    await h.ready(); p = (await h.pad())!;
    if (p.pts.length) { await h.stroke(p.pts.slice(0, Math.max(2, Math.floor(p.pts.length / 2))), { cancel: true }); await expectNoMiss(h, `${only} L${level} cancelled touch`); }
    if (!(await h.writeRest())) problems.push(`${only} L${level}: after the odd touches the question could not be finished`);
  });
  // fast, slow, tiny, huge
  await session(only, level, async h => {
    let p = (await h.pad())!;
    await h.stroke(p.pts, { every: Math.max(1, Math.floor(p.pts.length / 3)), ms: 0 }); // very fast: three points
    await expectNoMiss(h, `${only} L${level} fast`);
    await h.ready(); p = (await h.pad())!;
    if (p.pts.length) { await h.stroke(p.pts, { ms: 60 }); await expectNoMiss(h, `${only} L${level} slow`); }
    await h.ready(); p = (await h.pad())!;
    if (p.pts.length) { await h.stroke(scaleAbout(p.pts, 0.3)); await expectNoMiss(h, `${only} L${level} tiny`); }
    await h.ready(); p = (await h.pad())!;
    if (p.pts.length) { await h.stroke(scaleAbout(p.pts, 1.3)); await expectNoMiss(h, `${only} L${level} big`); }
    if (!(await h.writeRest())) problems.push(`${only} L${level}: after fast, slow, tiny and big strokes the question could not be finished`);
  });
  // the wrong way: a miss and a lesson, then the pad still takes strokes; then mashing
  await session(only, level, async h => {
    const p = (await h.pad())!;
    await h.stroke([...p.pts].reverse());
    const m = await h.misses();
    if (!m.length) console.log(`  (${only} L${level} ${p.ch}: the first stroke backwards was ${JSON.stringify((await h.log()).at(-1)?.outcome)})`);
    await h.ready();
    await h.page.waitForTimeout(400);
    if (!(await h.writeRest())) problems.push(`${only} L${level} ${p.ch}: after a miss and its lesson the pad stopped taking strokes`);
    // mashing: taps and scribbles all over the next question's pad
    await h.ready();
    const box = (await h.page.locator('.sw-pad').boundingBox())!, before = (await h.misses()).length;
    for (let i = 0; i < 25; i++) {
      const x = box.x + 10 + Math.random() * (box.width - 20), y = box.y + 10 + Math.random() * (box.height - 20);
      if (i % 3) await h.stroke([[x, y], [x + 2, y + 1]], { ms: 0 });
      else await h.stroke(Array.from({ length: 12 }, () => [box.x + 10 + Math.random() * (box.width - 20), box.y + 10 + Math.random() * (box.height - 20)]), { ms: 0 });
    }
    const mashed = (await h.misses()).length - before;
    if (mashed) console.log(`  (${only} L${level}: ${mashed} of 25 mashes read as a try at the letter: a scribble that ran along it)`);
    await h.ready();
    await h.page.waitForTimeout(400);
    if (!(await h.writeRest())) problems.push(`${only} L${level}: after mashing the pad stopped taking strokes`);
  });
}

await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'fingers: no problems');
process.exitCode = problems.length ? 1 : 0;
