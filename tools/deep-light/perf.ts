// How fast the Dive draws with the CPU slowed down (PERF_THROTTLE, 4× by default) as a stand-in for the iPad 9, at 2× pixels: frames a
// second and the drawing's own time (window.__dive in dev), with nothing else polling the page while it's measured. Seeds a save that
// dives into a dark zone (PERF_ZONE, the Crystal Cave by default, which draws the most) with the brightest parts.
//   npm run dev:deep-light   (in another shell)
//   npx tsx tools/deep-light/perf.ts <url> [width] [height]
import { chromium } from 'playwright';

const [url = 'http://localhost:5185/', w = '1080', h = '810'] = process.argv.slice(2);
const zone = process.env.PERF_ZONE ?? 'cave';
const save = {
  version: 1, balance: 0, learning: {},
  dock: {
    owned: ['hull:r1', 'hull:r2', 'hull:r3', 'hull:r4', 'hull:r5', 'hull:r6', 'sonar:r2', 'sonar:r5', 'lights:r3', 'lights:r5', 'claw:r1', 'flash:r4', 'stripes:sparkle', 'trail:rainbow', 'paint:galaxy'],
    fitted: { hull: 'r6', lights: 'r5', sonar: 'r5', claw: 'r1', flash: 'r4', stripes: 'sparkle', trail: 'rainbow', paint: 'galaxy' },
    dives: 3, photos: [], zone, done: 0,
  },
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: Number(process.env.PERF_DPR ?? 2), hasTouch: true });
const cdp = await page.context().newCDPSession(page);
await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.removeItem('deep-light-place'); localStorage.setItem('deep-light-save', JSON.stringify(s)); } }, save);
await page.goto(url + (process.env.PERF_QUERY ?? ''));
await page.getByLabel('Start').click();
await page.waitForTimeout(600);
await page.evaluate(async () => { const nav = await import('/src/deep-light/nav.ts' as string); nav.goDive(); });
await page.waitForTimeout(2500);
// a finger held off to one side, so the submarine swims and the camera moves
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Number(w) * 0.85, y: Number(h) * 0.6 }] });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.PERF_THROTTLE ?? 4) });
await page.waitForTimeout(5000);
type D = { fps: number; worst: number; work: number; workMax: number; zone: string; scale: number };
const d = await page.evaluate(() => (window as unknown as { __dive(): D }).__dive());
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
console.log(`${w}x${h} @${process.env.PERF_DPR ?? 2}x, ${d.zone}${process.env.PERF_QUERY ?? ''}: ${d.fps.toFixed(0)} fps (worst frame ${(d.worst * 1000).toFixed(0)} ms), drawing ${d.work.toFixed(2)} ms a frame, ${d.workMax.toFixed(1)} ms at most; drawn at ${d.scale}× pixels`);
await browser.close();
