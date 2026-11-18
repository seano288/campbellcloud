// How long the Show's frames take to step and draw (the canvas's own work, from window.__work in dev) and how many frames it draws a second,
// with the CPU slowed down (PERF_THROTTLE, 4× by default) as a stand-in for the iPad 9, at 2 device pixels a CSS pixel. Seeds a save with the
// most costly look: the Mega Tank (the longest trail), Rainbow smoke, Stars, Sparkle Wings, the Banner, Confetti and Fireworks.
// Then Free Sky with a long drawing. Compare two builds by pointing it at each.
//   npm run dev:sky-writer   (in another shell)
//   npx tsx tools/sky-writer/perf.ts <url> [width] [height]
import { chromium, type Page } from 'playwright';

const [url = 'http://localhost:5183/', w = '1080', h = '810'] = process.argv.slice(2);
const save = {
  version: 1, balance: 60,
  learning: { modes: {}, pushed: {}, families: ['lines'], sinceMeet: 0, strength: {} },
  airfield: {
    owned: ['plane:dragon', 'engine:e5', 'wings:w5', 'tank:t5', 'smoke:rainbow', 'shape:stars', 'paint:flames', 'gear:sparkle', 'gear:banner', 'gear:confetti', 'gear:fireworks', 'trick:star'],
    fitted: { plane: 'dragon', engine: 'e5', wings: 'w5', tank: 't5', prop: 'p0', smoke: 'rainbow', shape: 'stars', paint: 'flames', pilot: 'kid', trick: 'star' },
    off: [], shows: 3, opened: 15, flown: ['beach', 'city', 'canyon', 'mountains', 'stadium', 'farm', 'jungle', 'island', 'desert', 'volcano', 'lake', 'castle', 'rainbow', 'sunset'], done: 14, pick: 'night', postcards: [], goal: null,
  },
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 2, hasTouch: true });
const cdp = await page.context().newCDPSession(page);
await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.removeItem('sky-writer-place'); localStorage.setItem('sky-writer-save', JSON.stringify(s)); } }, save);
await page.goto(url);
await page.getByLabel('Start').click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Show', exact: true }).click();
await page.waitForTimeout(800);
await page.getByRole('button', { name: 'Take off' }).click();
const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });

async function measure(p: Page, label: string, move: (i: number) => [number, number]) {
  await p.evaluate(() => { (window as unknown as { __work: number[][] }).__work = []; });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.PERF_THROTTLE ?? 4) });
  const f0 = await p.evaluate(() => (window as any).__show().frames), t0 = Date.now();
  const [x0, y0] = move(0);
  await touch('touchStart', x0, y0);
  for (let i = 1; i < 40; i++) { const [x, y] = move(i); await touch('touchMove', x, y); await p.waitForTimeout(100); }
  await touch('touchEnd');
  const frames = (await p.evaluate(() => (window as any).__show().frames)) - f0, secs = (Date.now() - t0) / 1000;
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const work = await p.evaluate(() => (window as unknown as { __work: number[][] }).__work.slice(5));
  const draw = work.map(x => x[1]! + x[0]!).sort((a, b) => a - b), mean = draw.reduce((a, b) => a + b, 0) / Math.max(1, draw.length);
  console.log(`${label}: ${(frames / secs).toFixed(0)} fps, step+draw mean ${mean.toFixed(2)}ms, p90 ${draw[Math.floor(draw.length * 0.9)]?.toFixed(2)}ms, max ${draw.at(-1)?.toFixed(2)}ms`);
}
const W = Number(w), Hh = Number(h);
await page.waitForTimeout(3000);
// the rings, steering in big circles with a trick, at its longest trail
await page.getByRole('button', { name: 'Star' }).click().catch(() => {});
await measure(page, 'rings', i => [W / 2 + Math.cos(i / 4) * W * 0.3, Hh / 2 + Math.sin(i / 4) * Hh * 0.3]);
// wait for Free Sky, then draw a long scribble
for (let i = 0; i < 120 && (await page.evaluate(() => (window as any).__show().phase)) !== 'free'; i++) await page.waitForTimeout(500);
await page.waitForTimeout(2000);
await measure(page, 'free sky', i => [W * (0.15 + (i % 20) * 0.035), Hh * (0.25 + Math.floor(i / 20) * 0.3 + Math.sin(i) * 0.05)]);
await browser.close();
