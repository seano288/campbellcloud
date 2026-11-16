// Sentence Express offline, on the production build: the service worker precaches the game (and its voice), the network goes away, the
// page reloads, and a Round still starts, its first question is said aloud, and the answer counts, as tools/offline-check.ts does
// for the money app.
//   npm run build:site && npx tsx tools/sentence-express/offline.ts
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

const server = await preview({ configFile: false, logLevel: 'silent', build: { outDir: resolve(import.meta.dirname, '../../dist-site') }, preview: { host: '127.0.0.1', port: 0 } });
const url = `${server.resolvedUrls!.local[0]!}sentence-express/`;
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
  const clips = cached.filter(p => p.includes('/sentence-express-voice/') || p.endsWith('.mp3')).length;
  assert.ok(clips > 600, `only ${clips} voice clips precached`);
  console.log(`precached ${cached.length} files, ${clips} of them voice clips`);

  // offline: reload, Start, Play
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30000 });
  await page.locator('.game.se[data-ready="yes"]').waitFor({ timeout: 40000 });
  const said = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
  assert.ok(said > 0, 'no recorded voice played offline');
  // answer it (a tap on any choice, a picture, a car in the yard or on the train), and the Round takes it: the voice and the taps work offline
  const yard = page.locator('.se-yard .piece.in-yard');
  if (await yard.count()) { for (let i = await yard.count(); i > 0; i--) { await yard.first().tap(); await page.waitForTimeout(250); } }
  else await page.locator('.se-choices .piece, .pic-card, .se-train .piece.fixable').first().tap();
  await page.waitForTimeout(1200);
  // the answer went in: it was right (a star) or the lesson for a miss began
  const counted = await page.evaluate(() => !!document.querySelector('.card.thinking') || !/^0 of 5/.test(document.querySelector('.stars')?.getAttribute('aria-label') ?? ''));
  assert.ok(counted, 'the tap did not count offline');
  await page.waitForTimeout(1300);
  const stars = await page.locator('.stars').getAttribute('aria-label');
  console.log(`offline: a Round started, ${said} clips played, ${stars}`);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sentence-express-place') ?? '{}'));
  assert.equal(saved.screen, 'round', 'the Round in progress was not remembered');
} catch (e) {
  problems.push(String(e));
} finally {
  await browser.close();
  await new Promise<void>(done => server.httpServer.close(() => done()));
}
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'offline: no problems');
process.exitCode = problems.length ? 1 : 0;
