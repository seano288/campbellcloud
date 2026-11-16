// Reloads the page where a reload hurts most, as when iPadOS closes the app in the background: in the middle of a Round (once
// mid-lesson, after a miss), then in the middle of a Delivery. The Round must come back with the answers he gave, still take taps,
// finish and pay once; the Delivery must not be used up, and he lands on his Layout.
//   npm run dev:sentence-express   (in another shell)
//   npx tsx tools/sentence-express/reload.ts [url]
import { chromium } from 'playwright';
import { piecesOf } from '../../src/sentence-express/reading/problems';
import { sentence } from '../../src/sentence-express/sentences/index';

const [url = 'http://localhost:5194/'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: 810, height: 1080 }, hasTouch: true })).newPage();
const problems: string[] = [];
page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
await page.addInitScript(() => {
  if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.clear(); }
  // the page's AudioContext, to see the sound unlock on the first tap and wake again after the iPad parks it
  const w = window as unknown as { __ctx: AudioContext[] }, Ctx = window.AudioContext;
  w.__ctx = [];
  window.AudioContext = class extends Ctx { constructor(...a: ConstructorParameters<typeof Ctx>) { super(...a); w.__ctx.push(this); } };
});
const sound = () => page.evaluate(() => (window as unknown as { __ctx: AudioContext[] }).__ctx.map(c => c.state));

type Q = { mode: string; replay?: boolean; q: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('sentence-express-save') ?? '{}'));
const place = () => page.evaluate(() => JSON.parse(localStorage.getItem('sentence-express-place') ?? '{}'));
const stars = () => page.locator('.roundbar .stars > .on').count();
async function ready() {
  for (let i = 0; i < 300; i++) { if (await page.locator('.game.se[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
}
const esc = (s: string) => s.replace(/(["\\.?!])/g, '\\$1');
/** Build the Train and Engine and Caboose are the kinds a new player has. `miss`: a wrong answer instead. */
async function answer(p: NonNullable<Q>, miss = false) {
  if (p.q.kind === 'marks') return page.locator(`.se-choices .piece[data-piece="${esc(miss ? p.q.choices.find((c: string) => c !== p.q.answer) : p.q.answer)}"]`).first().tap();
  let want = piecesOf(sentence(p.q.s));
  if (miss) want = [want[0]!, want[2]!, want[1]!, ...want.slice(3)];
  const used = new Set<number>();
  for (const piece of want) {
    const i = (p.q.yard as string[]).findIndex((y, k) => y === piece && !used.has(k));
    used.add(i);
    await page.locator(`.se-yard .piece[data-idx="${i}"]`).first().tap();
    await page.waitForTimeout(250);
  }
}
async function start() {
  await page.getByLabel('Start').tap({ timeout: 30000 });
  await page.waitForTimeout(900);
}
async function nextQuestion(before: Q) {
  for (let i = 0; i < 100; i++) { const q = await question(); if (q && JSON.stringify(q) !== JSON.stringify(before)) return q; if (await page.locator('.reward h2').isVisible()) return null; await page.waitForTimeout(150); }
  return null;
}

await page.goto(url);
await page.waitForTimeout(500);
if ((await sound()).length) problems.push('the sound was started before his first tap');
await start();
if ((await sound()).join() !== 'running') problems.push(`after the Start tap the sound is ${(await sound()).join() || 'not there'}`);
// the iPad parks the sound in the background: the next tap wakes it
await page.evaluate(() => (window as unknown as { __ctx: AudioContext[] }).__ctx[0]!.suspend());
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await page.locator('.kind').first().tap();
await page.waitForTimeout(300);
if ((await sound()).join() !== 'running') problems.push(`after the iPad parked it and he tapped, the sound is ${(await sound()).join()}`);
await page.getByRole('button', { name: 'Play', exact: true }).tap();
// two right answers, then reload
let p = await nextQuestion(null);
for (let k = 0; k < 2 && p; k++) { await ready(); await answer(p); p = await nextQuestion(p); }
await ready();
if ((await place()).round?.results?.length !== 2) problems.push(`after 2 answers the place holds ${JSON.stringify((await place()).round)}`);
const balance0 = (await saved()).balance ?? 0;
await page.reload();
await page.waitForTimeout(600);
await start();
if (!(await page.locator('.round-screen').count())) problems.push('a reload mid-Round did not come back to the Round');
if (await stars() !== 2) problems.push(`back in the Round with ${await stars()} answers shown, not 2`);
// a miss, and a reload in the middle of its lesson
p = await nextQuestion(null);
await ready();
await answer(p!, true);
await page.waitForTimeout(1200);
if (!(await page.locator('.card.thinking').count()) && !(await page.locator('.game.se[data-ready="yes"]').count())) problems.push('no lesson after the miss');
await page.reload();
await page.waitForTimeout(600);
await start();
if (await stars() !== 2) problems.push(`after a reload mid-lesson ${await stars()} answers are shown, not 2`);
// the rest of the Round still takes taps, and it finishes once
p = await nextQuestion(null);
for (let k = 0; k < 6 && p; k++) { await ready(); await answer(p); p = await nextQuestion(p); }
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('the resumed Round never finished'));
const after = await saved();
if ((after.balance ?? 0) <= balance0 || (after.balance ?? 0) > balance0 + 6) problems.push(`the resumed Round paid ${(after.balance ?? 0) - balance0} Bolts`);
if (after.trains?.deliveries !== 2) problems.push(`after a Round he has ${after.trains?.deliveries} Deliveries, not 2`);
if ((await place()).round) problems.push('a finished Round is still in the place');

// a Delivery, reloaded while he drives
await page.getByRole('button', { name: 'Deliver' }).tap();
await page.waitForTimeout(1500);
await page.getByRole('button', { name: 'Go', exact: true }).tap();
await page.waitForTimeout(400);
const thr = (await page.locator('.throttle').boundingBox())!;
await page.mouse.move(thr.x + thr.width / 2, thr.y + thr.height - 20); await page.mouse.down(); await page.mouse.move(thr.x + thr.width / 2, thr.y + 20, { steps: 6 }); await page.mouse.up();
await page.waitForTimeout(2500);
await page.reload();
await page.waitForTimeout(600);
await start();
if (!(await page.locator('.layout-screen').count())) problems.push('a reload mid-Delivery did not land on the Layout');
const d = await saved();
if (d.trains?.deliveries !== 2 || d.balance !== after.balance) problems.push(`a reload mid-Delivery changed his Deliveries (${d.trains?.deliveries}) or Bolts (${d.balance})`);
if (!d.trains?.layout?.stations?.some((s: { id: string }) => s.id === 'town')) problems.push('Toy Town is missing from his Layout');

// a drawn piece of scenery (a water tower) on the table shows straight after a reload, not only after the next change to the table
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('sentence-express-save')!), l = s.trains.layout;
  const free = l.cells.findIndex((m: number, c: number) => !m && c > l.w * 2 && c % l.w > 2 && !l.scenery.some((x: { cell: number }) => x.cell === c));
  s.trains.owned.push('scenery:tower');
  l.scenery = [...l.scenery.filter((x: { id: string }) => x.id !== 'tower'), { id: 'tower', cell: free }];
  localStorage.setItem('sentence-express-save', JSON.stringify(s));
});
await page.reload();
await page.waitForTimeout(600);
await start();
await page.waitForTimeout(800);
const towerPixel = await page.evaluate(() => {
  const L = (window as unknown as { __layout(): { scenery: { id: string; cell: number }[]; xy(c: number): { x: number; y: number } } }).__layout();
  const cv = document.querySelector('canvas.table-canvas') as HTMLCanvasElement, box = cv.getBoundingClientRect(), p = L.xy(L.scenery.find(x => x.id === 'tower')!.cell);
  return [...cv.getContext('2d')!.getImageData((p.x - box.left) * devicePixelRatio, (p.y - box.top) * devicePixelRatio, 1, 1).data].slice(0, 3);
});
// the tower's tank is red; the bare table is pale wood
if (!(towerPixel[0]! > 150 && towerPixel[1]! < 110)) problems.push(`a water tower on the table isn't drawn after a reload (${towerPixel.join(',')})`);

await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'reloads: a Round (mid-question and mid-lesson), a Delivery and drawn scenery all come back right; the sound starts on the first tap and wakes again');
process.exitCode = problems.length ? 1 : 0;
