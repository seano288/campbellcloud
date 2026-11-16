// How smooth the demolition is: the heaviest Job (a steel building, 66 bricks, the Giant Excavator) at iPad sizes and 2× pixels, with
// the CPU throttled 4× (CPU_RATE=1 for none). Prints the frame cadence and the game's own work per frame (window.__work in dev).
//   npm run dev:word-wreckers   (in another shell)
//   npx tsx tools/word-wreckers/perf.ts
import { chromium } from 'playwright';
const save = { version: 1, balance: 0, yard: { owned: ['machine:giant'], machine: 'giant', jobs: 1, done: 0, town: [] } };
for (const view of [{ width: 810, height: 1080 }, { width: 1080, height: 810 }]) {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: view, deviceScaleFactor: 2, hasTouch: true }), p = await ctx.newPage();
  await p.addInitScript(s => { localStorage.setItem('word-wreckers-save', JSON.stringify(s)); localStorage.setItem('word-wreckers-place', JSON.stringify({ screen: 'yard' })); }, save);
  await p.goto('http://localhost:5195/');
  await p.getByLabel('Start').click(); await p.waitForTimeout(800);
  await p.getByRole('button', { name: 'Job', exact: true }).click(); await p.waitForTimeout(1500);
  await p.locator('.pick-machine').first().click(); await p.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU_RATE ?? 4) });
  const box = (await p.locator('.job-canvas').boundingBox())!;
  const j0 = await p.evaluate(() => (window as any).__job()), t0 = Date.now();
  // frame times while bricks fall
  await p.evaluate('window.__ft = []; { let last = performance.now(); function f(t) { window.__ft.push(t - last); last = t; if (window.__ft.length < 600) requestAnimationFrame(f); } requestAnimationFrame(f); }');
  for (let i = 0; i < 12; i++) { await p.mouse.click(box.x + box.width * (.6 + (i % 3) * .1), box.y + box.height * (.5 + (i % 2) * .15)); await p.waitForTimeout(500); }
  const j1 = await p.evaluate(() => (window as any).__job()), secs = (Date.now() - t0) / 1000;
  const ft: number[] = await p.evaluate(() => (window as any).__ft);
  const sorted = [...ft].sort((a, b) => a - b), p95 = sorted[Math.floor(sorted.length * .95)]!;
  const work: number[][] = await p.evaluate('window.__work.slice(-300)');
  const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!.toFixed(2), p95w = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * .95)]!.toFixed(2);
  console.log('step ms median', med(work.map(x => x[0]!)), 'p95', p95w(work.map(x => x[0]!)), '| draw ms median', med(work.map(x => x[1]!)), 'p95', p95w(work.map(x => x[1]!)));
  console.log(`${view.width}x${view.height} dpr2 cpu/${process.env.CPU_RATE ?? 4}: ${((j1.frames - j0.frames) / secs).toFixed(0)} sim fps, median frame ${sorted[Math.floor(sorted.length / 2)]!.toFixed(1)}ms, p95 ${p95.toFixed(1)}ms, ${j0.left} → ${j1.left} bricks standing`);
  await b.close();
}
