// Moon Base Mail offline, on the production build: the service worker precaches the game (and its voice), the network goes away, the
// page reloads, and a Round still starts, its first question is said aloud, the answer counts and the next question comes. Then the page
// reloads again in the middle of the Round, and Start brings him back into it with his answer kept. As tools/cargo-words/offline.ts does.
//   npm run build:site && npx tsx tools/moon-base-mail/offline.ts
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { chromium, type Page } from 'playwright';
import { preview } from 'vite';

const server = await preview({ configFile: false, logLevel: 'silent', build: { outDir: resolve(import.meta.dirname, '../../dist-site') }, preview: { host: '127.0.0.1', port: 0 } });
const url = `${server.resolvedUrls!.local[0]!}moon-base-mail/`;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const ready = (page: Page, what: string) => page.locator(`.game.mb[data-ready="${what}"]`).waitFor({ timeout: 60000 });
const stars = (page: Page) => page.locator('.stars').getAttribute('aria-label');

/** Answers the first question as a child who doesn't know it would (the build has no window.__round): Go at a Meeting; at a letter, "I
 *  read it", then each answer in turn (or, to put sentences or pictures in order, each order in turn) until one counts. */
async function answerFirst(page: Page) {
  const before = await stars(page);
  for (let guard = 0; guard < 30; guard++) {
    const r = await page.locator('.game.mb').getAttribute('data-ready');
    if (await page.locator('.game.mb.meet[data-ready="yes"]').count()) { await page.getByRole('button', { name: 'Go', exact: true }).click(); await page.waitForTimeout(1500); continue; }
    if (r === 'read') { await page.getByRole('button', { name: 'I read it', exact: true }).click(); await ready(page, 'yes'); }
    if (r !== 'yes' && r !== 'read') { await page.waitForTimeout(300); continue; }
    const lines = page.locator('.mb-line-btn'), pics = page.locator('.mb-choices.pics button'), words = page.locator('.mb-choice.word,.mb-label');
    const ordering = (await lines.count()) > 0 && !(await page.locator('.mb-tip', { hasText: 'Tap the sentence.' }).count());
    const tries: number[][] = [];
    if (ordering || ((await pics.count()) && (await page.locator('.k-order.f-order').count()))) {
      const n = ordering ? await lines.count() : await pics.count(), perm = (xs: number[]): number[][] => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perm([...xs.slice(0, i), ...xs.slice(i + 1)]).map(p => [x, ...p]));
      tries.push(...perm(Array.from({ length: n }, (_, i) => i)));
    } else {
      const n = (await lines.count()) || (await pics.count()) || (await words.count());
      for (let i = 0; i < n; i++) tries.push([i]);
    }
    const target = ordering || (await page.locator('.mb-tip', { hasText: 'Tap the sentence.' }).count()) ? lines : (await pics.count()) ? pics : words;
    for (const t of tries) {
      await ready(page, 'yes');
      for (const i of t) { await target.nth(i).click(); await page.waitForTimeout(150); }
      await page.waitForTimeout(1500);
      if ((await stars(page)) !== before) return;
    }
    return;
  }
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
  assert.ok(clips > 1500, `only ${clips} voice clips precached`);
  console.log(`precached ${cached.length} files, ${clips} of them voice clips`);

  // offline: reload, Start, Play
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30000 });
  await page.locator('.game.mb[data-ready="yes"],.game.mb[data-ready="read"]').first().waitFor({ timeout: 40000 });
  const said = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
  assert.ok(said > 0, 'no recorded voice played offline');
  await answerFirst(page);
  await page.waitForTimeout(2500);
  const got = await stars(page);
  console.log(`offline: a Round started, ${said} clips played, ${got}`);
  assert.match(got ?? '', /^1 of 5|^0 of 5 stars, 1 half star/, 'the first answer did not count');
  const place = await page.evaluate(() => JSON.parse(localStorage.getItem('moon-base-mail-place') ?? '{}'));
  assert.equal(place.screen, 'round', 'the Round in progress was not remembered');

  // a reload in the middle of the Round, still offline: Start brings him back into it
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.locator('.game.mb[data-ready="yes"],.game.mb[data-ready="read"]').first().waitFor({ timeout: 40000 });
  const back = await stars(page);
  assert.equal(back, got, `after a reload the Round shows "${back}"`);
  console.log(`offline: after a reload the Round went on with ${back}`);
} catch (e) {
  problems.push(String(e));
} finally {
  await browser.close();
  await new Promise<void>(done => server.httpServer.close(() => done()));
}
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'offline: no problems');
process.exitCode = problems.length ? 1 : 0;
