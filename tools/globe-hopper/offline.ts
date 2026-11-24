// Globe Hopper offline, on the production build: the service worker precaches the game (and its voice), the network goes away, the page
// reloads, and a Round still starts, its first question is said aloud, the answer counts and the next question comes. Then the page
// reloads again in the middle of the Round, and Start brings him back into it with his answer kept. As tools/cargo-words/offline.ts does.
//   npm run build:site && npx tsx tools/globe-hopper/offline.ts
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { chromium, type Page } from 'playwright';
import { preview } from 'vite';

const server = await preview({ configFile: false, logLevel: 'silent', build: { outDir: resolve(import.meta.dirname, '../../dist-site') }, preview: { host: '127.0.0.1', port: 0 } });
const url = `${server.resolvedUrls!.local[0]!}globe-hopper/`;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];

/** Answers the first question as a child would, reading it from the screen (the build has no window.__round). A new save's first
 *  question is a Land and Water probe on a globe seen side-on: the North Pole at the top, the South Pole at the bottom, the equator
 *  across the middle. */
async function answerFirst(page: Page) {
  await page.locator('.game.gh[data-ready="yes"]').waitFor({ timeout: 60000 });
  const text = (await page.locator('.game.gh .ask h2').textContent()) ?? '';
  const box = (await page.locator('.gh-earth').first().boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2, r = Math.min(box.width, box.height) * .46;
  const y = /North Pole/.test(text) ? cy - r * .93 : /South Pole/.test(text) ? cy + r * .93 : cy;
  assert.match(text, /North Pole|South Pole|equator/, `the first question was "${text}"`);
  await page.mouse.click(cx, y);
}

try {
  const context = await browser.newContext({ viewport: { width: 810, height: 1080 }, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  await page.addInitScript(() => {
    const w = window as unknown as { __clips: number }, start = AudioBufferSourceNode.prototype.start;
    w.__clips = 0;
    AudioBufferSourceNode.prototype.start = function (...a: Parameters<typeof start>) { if ((this.buffer?.duration ?? 0) > .05) w.__clips++; return start.apply(this, a); };
  });
  // online once: the worker installs and precaches everything
  await page.goto(url);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(r => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
  });
  const cached = await page.evaluate(async () => {
    const paths: string[] = [];
    for (const name of await caches.keys()) for (const req of await (await caches.open(name)).keys()) paths.push(new URL(req.url).pathname);
    return paths;
  });
  const clips = cached.filter(p => p.endsWith('.mp3')).length;
  assert.ok(clips > 600, `only ${clips} voice clips precached`);
  console.log(`precached ${cached.length} files, ${clips} of them voice clips`);

  // offline: reload, Start, Play
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30000 });
  await page.locator('.game.gh[data-ready="yes"]').waitFor({ timeout: 40000 });
  const said = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
  assert.ok(said > 0, 'no recorded voice played offline');
  await answerFirst(page);
  await page.waitForTimeout(2500);
  await page.locator('.game.gh[data-ready="yes"]').waitFor({ timeout: 40000 });
  const stars = await page.locator('.stars').getAttribute('aria-label');
  console.log(`offline: a Round started, ${said} clips played, ${stars}`);
  // tapping through the choices, he may have missed first: the answer counts as a whole star or a half one
  assert.match(stars ?? '', /^1 of 5|^0 of 5 stars, 1 half star/, 'the first answer did not count');
  const place = await page.evaluate(() => JSON.parse(localStorage.getItem('globe-hopper-place') ?? '{}'));
  assert.equal(place.screen, 'round', 'the Round in progress was not remembered');

  // a reload in the middle of the Round, still offline: Start brings him back into it
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.locator('.game.gh[data-ready="yes"]').waitFor({ timeout: 40000 });
  const back = await page.locator('.stars').getAttribute('aria-label');
  assert.equal(back, stars, `after a reload the Round shows "${back}"`);
  console.log(`offline: after a reload the Round went on with ${back}`);
} catch (e) {
  problems.push(String(e));
} finally {
  await browser.close();
  await new Promise<void>(done => server.httpServer.close(() => done()));
}
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'offline: no problems');
process.exitCode = problems.length ? 1 : 0;
