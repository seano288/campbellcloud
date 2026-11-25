// Food Truck offline, on the production build: the service worker precaches the game (and its voice), the network goes away, the page
// reloads, and a Round still starts, its first step (a new player's Meeting about needs and wants) is said aloud, the answer counts and
// the next question comes. Then the page reloads again in the middle of the Round, and Start brings him back into it with his answer
// kept. As tools/turbo-tally/offline.ts does for Turbo Tally.
//   npm run build:site && npx tsx tools/food-truck/offline.ts
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { truckBuild } from '../food-truck-build';
import { precachedVoice } from '../static-build';

const server = await preview({ configFile: false, logLevel: 'silent', build: { outDir: resolve(import.meta.dirname, '../../dist-site') }, preview: { host: '127.0.0.1', port: 0 } });
const url = `${server.resolvedUrls!.local[0]!}food-truck/`;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];

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
  const voice = precachedVoice(truckBuild, cached);
  assert.deepEqual(voice.missing, [], `${voice.missing.length} of ${voice.packs} voice packs not precached`);
  assert.ok(voice.clips.size > 700, `only ${voice.clips.size} voice clips in the packs`);
  console.log(`precached ${cached.length} files, ${voice.packs} of them voice packs with ${voice.clips.size} clips`);

  // offline: reload, Start, Play
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30000 });
  await page.locator('.game.ft[data-ready="yes"]').waitFor({ timeout: 40000 });
  const said = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
  assert.ok(said > 0, 'no recorded voice played offline');
  // a new player's first step is the Meeting about needs and wants: he taps Go
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await page.waitForTimeout(2500);
  await page.locator('.game.ft[data-ready="yes"]').waitFor({ timeout: 40000 });
  const stars = await page.locator('.stars').getAttribute('aria-label');
  console.log(`offline: a Round started, ${said} clips played, ${stars}`);
  assert.match(stars ?? '', /^1 of 5/, 'the first answer did not count');
  const place = await page.evaluate(() => JSON.parse(localStorage.getItem('food-truck-place') ?? '{}'));
  assert.equal(place.screen, 'round', 'the Round in progress was not remembered');

  // a reload in the middle of the Round, still offline: Start brings him back into it
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.locator('.game.ft[data-ready="yes"]').waitFor({ timeout: 40000 });
  const back = await page.locator('.stars').getAttribute('aria-label');
  assert.match(back ?? '', /^1 of 5/, `after a reload the Round shows "${back}"`);
  console.log(`offline: after a reload the Round went on with ${back}`);
} catch (e) {
  problems.push(String(e));
} finally {
  await browser.close();
  await new Promise<void>(done => server.httpServer.close(() => done()));
}
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'offline: no problems');
process.exitCode = problems.length ? 1 : 0;
