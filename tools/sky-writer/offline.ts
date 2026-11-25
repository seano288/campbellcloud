// Sky Writer offline, on the production build: the service worker precaches the game (and its voice), the network goes away, the
// page reloads, and a Round still starts, its first question is said aloud, the answer counts and the next question comes, as tools/offline-check.ts does
// for the money app.
//   npm run build:site && npx tsx tools/sky-writer/offline.ts
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { CLIPS } from '../../src/sky-writer/voice.gen';
import { skyBuild } from '../sky-writer-build';
import { precachedVoice } from '../static-build';

const server = await preview({ configFile: false, logLevel: 'silent', build: { outDir: resolve(import.meta.dirname, '../../dist-site') }, preview: { host: '127.0.0.1', port: 0 } });
const url = `${server.resolvedUrls!.local[0]!}sky-writer/`;
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
  const voice = precachedVoice(skyBuild, cached);
  assert.deepEqual(voice.missing, [], `${voice.missing.length} of ${voice.packs} voice packs not precached`);
  // every clip the game can say is in a pack, not just most of them
  const unpacked = [...new Set(Object.values(CLIPS))].filter(f => !voice.clips.has(f));
  assert.deepEqual(unpacked, [], `${unpacked.length} voice clips not in a pack`);
  console.log(`precached ${cached.length} files, ${voice.packs} of them voice packs with ${voice.clips.size} clips`);

  // offline: reload, Start, Play
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30000 });
  await page.locator('.game.sw[data-ready="yes"]').waitFor({ timeout: 40000 });
  const said = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
  assert.ok(said > 0, 'no recorded voice played offline');
  // answer it: a new player first meets a Family (Go), and the Round moves on: the voice and the taps work offline
  await page.getByRole('button', { name: 'Go', exact: true }).click({ timeout: 40000 });
  await page.waitForTimeout(2500);
  await page.locator('.game.sw[data-ready="yes"]').waitFor({ timeout: 40000 });
  const stars = await page.locator('.stars').getAttribute('aria-label');
  // the second question (the first one he answers) is said too: its letter, offline
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
  assert.ok(after > said, 'the second question was not said offline');
  console.log(`offline: a Round started, ${said} clips played for the first question and ${after - said} more for the second, ${stars}`);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sky-writer-place') ?? '{}'));
  assert.equal(saved.screen, 'round', 'the Round in progress was not remembered');
} catch (e) {
  problems.push(String(e));
} finally {
  await browser.close();
  await new Promise<void>(done => server.httpServer.close(() => done()));
}
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'offline: no problems');
process.exitCode = problems.length ? 1 : 0;
