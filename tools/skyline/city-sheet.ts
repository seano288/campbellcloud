// Screenshots of a grown City, as the scripted child of the economy test has it after n Rounds: the map by day and by night, zoomed
// out, the Skyline, the fly-over and a Job through it, and how many frames a second the City and the Job draw (in Chromium on this
// computer, not an iPad).
//   npm run dev:skyline   (in another shell)
//   npx tsx tools/skyline/city-sheet.ts <url> <outDir> [rounds=400]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { simulate } from '../../src/skyline/city/economy';
import { skylineSave } from '../../src/skyline/game';

const [url = 'http://localhost:5171/', out = '/tmp/skyline-city', rounds = '400'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const run = simulate(Number(rounds));
const save = skylineSave.encode({ ...skylineSave.fresh(), currency: { balance: run.balance }, city: { ...run.state, jobs: 2 } });
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 810 } });
const problems: string[] = [];
page.on('pageerror', e => problems.push(e.message));
await page.addInitScript(s => { localStorage.setItem('skyline-save', JSON.stringify(s)); localStorage.removeItem('skyline-place'); }, save);
await page.goto(url); await page.waitForTimeout(1500);
await page.getByLabel('Start').click(); await page.waitForTimeout(600);
await page.getByRole('button', { name: 'City', exact: true }).click(); await page.waitForTimeout(2000);
// (a string, so the bundler's helpers stay out of the page)
const fps = () => page.evaluate('new Promise(done => { let n = 0; const t0 = performance.now(); function f() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else done(n / 3); } requestAnimationFrame(f); })') as Promise<number>;
console.log(`City after ${rounds} Rounds: ${run.state.blocks.length} Blocks, ${Object.keys(run.state.plots).length} buildings; City ${(await fps()).toFixed(0)} fps`);
await page.screenshot({ path: `${out}/city-day.png` });
await page.getByRole('button', { name: 'Zoom out', exact: true }).click(); await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
await page.getByRole('button', { name: 'Zoom out', exact: true }).click(); await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/city-far.png` });
await page.getByRole('button', { name: 'Zoom in', exact: true }).click(); await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
await page.getByRole('button', { name: 'Night', exact: true }).click(); await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/city-night.png` });
await page.getByRole('button', { name: 'Skyline', exact: true }).click(); await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/skyline-night.png` });
await page.getByRole('button', { name: 'Close the Skyline', exact: true }).click();
await page.getByRole('button', { name: 'Day', exact: true }).click(); await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Skyline', exact: true }).click(); await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/skyline-day.png` });
await page.getByRole('button', { name: 'Close the Skyline', exact: true }).click();
await page.getByRole('button', { name: 'Fly over', exact: true }).click(); await page.waitForTimeout(4000);
await page.screenshot({ path: `${out}/fly-over.png` });
await page.getByRole('button', { name: 'Fly over', exact: true }).click();
await page.getByRole('button', { name: 'Job', exact: true }).click(); await page.waitForTimeout(800);
await page.getByRole('button', { name: 'Go', exact: true }).click(); await page.waitForTimeout(1500);
const canvas = page.locator('.job-canvas'), box = (await canvas.boundingBox())!;
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
for (let i = 0; i < 30; i++) {
  const spot = await page.evaluate(() => (window as unknown as { __job?: { next(): { x: number; y: number } | null } }).__job?.next() ?? null);
  if (spot) await page.mouse.move(box.x + Math.max(60, Math.min(box.width - 60, spot.x)), box.y + Math.max(90, Math.min(box.height - 60, spot.y)));
  await page.waitForTimeout(100);
}
console.log(`Job ${(await fps()).toFixed(0)} fps`);
await page.screenshot({ path: `${out}/job.png` });
await page.mouse.up();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
