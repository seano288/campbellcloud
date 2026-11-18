// Times the Dive prototype's frames per drawing approach, CPU throttled as a stand-in for an iPad 9.
//   npx vite .scratch/deep-light/proto --port 5170 &   then   npx tsx .scratch/deep-light/proto/measure.ts
import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const [w, h] of [[1080, 810], [810, 1080]]) for (const mode of ['A', 'B', 'C']) for (const dpr of [2, 1]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const cdp = await page.context().newCDPSession(page);
  await page.goto(`http://localhost:5170/?mode=${mode}&dpr=${dpr}`);
  await page.waitForTimeout(800);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.SLOW ?? 4) });
  await page.evaluate(() => { (window as any).__work = []; (window as any).__frames = []; });
  await page.waitForTimeout(4000);
  const [work, frames] = await page.evaluate(() => [(window as any).__work.slice(3), (window as any).__frames.slice(3)]) as number[][];
  const st = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return `mean ${(s.reduce((p, q) => p + q, 0) / s.length).toFixed(1)} p90 ${s[Math.floor(s.length * .9)]!.toFixed(1)} max ${s.at(-1)!.toFixed(1)}`; };
  console.log(`${w}x${h} dpr${dpr} mode ${mode}: work ${st(work)} ms | frame interval ${st(frames)} ms (${frames.length} frames)`);
  await page.close();
}
await browser.close();
