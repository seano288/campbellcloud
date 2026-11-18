// How long the Museum hall's and the Alive run's frames take to step and draw (the canvases' own work, from window.__work in dev), with
// the CPU slowed down (PERF_THROTTLE, 4× by default) as a stand-in for the iPad 9. Seeds a save with four living dinosaurs and the most
// costly look (rainbow, galaxy), the disco ball and the rainbow trail. Compare two builds by pointing it at each.
//   npm run dev:dino-dig   (in another shell)
//   npx tsx tools/dino-dig/perf.ts <url> [width] [height]
import { chromium, type Page } from 'playwright';

const [url = 'http://localhost:5181/', w = '1080', h = '810'] = process.argv.slice(2);
const save = {
  version: 1, balance: 60,
  learning: { modes: {}, pushed: {}, patterns: ['cvc'], sinceMeet: 0, strength: {} },
  museum: {
    owned: ['tool:trowel', 'color:rainbow', 'marking:galaxy', 'gear:trail', 'gear:sparkle', 'land:volcano', 'deco:disco', 'deco:fountain', 'deco:rocket', 'deco:palm', 'deco:skylight', 'deco:balloons'],
    bones: { compy: 4, raptor: 5, ptero: 4, pachy: 5 }, alive: ['compy', 'raptor', 'ptero', 'pachy'], pet: 'raptor',
    looks: { raptor: { color: 'rainbow', marking: 'galaxy', hat: 'none', roar: 'roar' } }, digs: 0, done: 9, finds: [], site: null, land: 'volcano', off: [], goal: null,
  },
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 2 });
const cdp = await page.context().newCDPSession(page);
await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.removeItem('dino-dig-place'); localStorage.setItem('dino-dig-save', JSON.stringify(s)); } }, save);
await page.goto(url);
await page.getByLabel('Start').click();
await page.waitForTimeout(500);
const go = (to: string) => page.evaluate(async s => { const nav = await import('/src/dino-dig/nav.ts' as string); nav.screen.value = s; }, to);
async function measure(p: Page, label: string) {
  await p.evaluate(() => { (window as unknown as { __work: number[][] }).__work = []; });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.PERF_THROTTLE ?? 4) });
  await p.waitForTimeout(4000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const work = await p.evaluate(() => (window as unknown as { __work: number[][] }).__work.slice(5));
  const draw = work.map(x => x[1]!).sort((a, b) => a - b), mean = draw.reduce((a, b) => a + b, 0) / Math.max(1, draw.length);
  console.log(`${label}: ${work.length} frames, draw mean ${mean.toFixed(2)}ms, p90 ${draw[Math.floor(draw.length * .9)]?.toFixed(2)}ms, max ${draw.at(-1)?.toFixed(2)}ms`);
}
await go('museum');
await page.waitForTimeout(800);
await measure(page, 'hall');
await page.locator('.plinth-go[aria-label="Play as Velociraptor"]').scrollIntoViewIfNeeded();
await page.locator('.plinth-go[aria-label="Play as Velociraptor"]').click();
await page.waitForTimeout(1200);
const b = (await page.getByRole('button', { name: 'Walk' }).boundingBox())!;
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
await page.mouse.down();
await measure(page, 'run');
await page.mouse.up();
await browser.close();
