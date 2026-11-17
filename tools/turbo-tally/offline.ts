// Turbo Tally offline, on the production build: the service worker precaches the game (and its voice), the network goes away, the
// page reloads, and a Round still starts, its first question is said aloud, the answer counts and the next question comes. Then the
// page reloads again in the middle of the Round, and Start brings him back into it with his answer kept. As tools/offline-check.ts
// does for the money app, and tools/word-wreckers/offline.ts for Word Wreckers.
//   npm run build:site && npx tsx tools/turbo-tally/offline.ts
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { chromium, type Page } from 'playwright';
import { preview } from 'vite';

const server = await preview({ configFile: false, logLevel: 'silent', build: { outDir: resolve(import.meta.dirname, '../../dist-site') }, preview: { host: '127.0.0.1', port: 0 } });
const url = `${server.resolvedUrls!.local[0]!}turbo-tally/`;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const placeText = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

/** Answers the first question as a child would, reading it off the screen (the build has no window.__round). */
async function answerFirst(page: Page) {
  if (await page.locator('.duel').count()) {
    const slower = (await page.locator('.ask h2').textContent())?.includes('slower');
    const nums = (await page.locator('.duel-car .speed-num').allTextContents()).map(Number);
    const want = slower ? Math.min(...nums) : Math.max(...nums);
    await page.getByRole('button', { name: `Speed ${want}`, exact: true }).click();
    return;
  }
  // Podium: the cars stand back to front, left to right; the one asked about has the pointer over it
  const cars = page.locator('.tt-road .road-car'), n = await cars.count();
  for (let i = 0; i < n; i++) if (await cars.nth(i).locator('.pointer').count()) { await page.getByRole('button', { name: placeText(n - i), exact: true }).click(); return; }
  throw new Error('a first question this check does not know how to answer');
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
  await page.locator('.game.tt[data-ready="yes"]').waitFor({ timeout: 40000 });
  const said = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
  assert.ok(said > 0, 'no recorded voice played offline');
  await answerFirst(page);
  await page.waitForTimeout(2500);
  await page.locator('.game.tt[data-ready="yes"]').waitFor({ timeout: 40000 });
  const stars = await page.locator('.stars').getAttribute('aria-label');
  console.log(`offline: a Round started, ${said} clips played, ${stars}`);
  assert.match(stars ?? '', /^1 of 5/, 'the first answer did not count');
  const place = await page.evaluate(() => JSON.parse(localStorage.getItem('turbo-tally-place') ?? '{}'));
  assert.equal(place.screen, 'round', 'the Round in progress was not remembered');

  // a reload in the middle of the Round, still offline: Start brings him back into it
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.locator('.game.tt[data-ready="yes"]').waitFor({ timeout: 40000 });
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
