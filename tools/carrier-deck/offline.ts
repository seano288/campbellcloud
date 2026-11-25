// Carrier Deck offline, on the production build: the service worker precaches the game (and its voice), the network goes away, the page
// reloads, and a Round still starts, its first story is said aloud, the answer counts and the next question comes. Then the page reloads
// again in the middle of the Round, and Start brings him back into it with his answer kept. As tools/jetway/offline.ts does.
//   npm run build:site && npx tsx tools/carrier-deck/offline.ts
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { chromium, type Page } from 'playwright';
import { preview } from 'vite';
import { COMPARE, ONE_STEP, sentenceOf, solve, type Nums, type Slot } from '../../src/carrier-deck/stories/problems';
import { parseEq } from '../../src/carrier-deck/stories/teach';
import { deckBuild } from '../carrier-deck-build';
import { precachedVoice } from '../static-build';

const server = await preview({ configFile: false, logLevel: 'silent', build: { outDir: resolve(import.meta.dirname, '../../dist-site') }, preview: { host: '127.0.0.1', port: 0 } });
const url = `${server.resolvedUrls!.local[0]!}carrier-deck/`;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];

/** Works out a one-step story's answer from its sentences, as he would from the card (the build has no window.__round): find the story
 *  whose sentences match, read its numbers, and find the asked one. */
function storyAnswer(texts: string[]): number {
  for (const t of [...Object.values(ONE_STEP), ...Object.values(COMPARE)]) {
    if (t.lines.length !== texts.length) continue;
    const nums: Nums = {};
    const fits = t.lines.every((line, i) => {
      const slots = line.filter(p => p.startsWith('#')) as Slot[], found = (texts[i]!.match(/\d+/g) ?? []).map(Number);
      if (slots.length !== found.length) return false;
      slots.forEach((s, k) => { nums[s] = found[k]!; });
      return sentenceOf(line, nums).text === texts[i];
    });
    if (!fits) continue;
    const v = (s: Slot) => nums[s]!;
    if (t.shape === 'join') return t.ask === '#e' ? v('#s') + v('#c') : t.ask === '#c' ? v('#e') - v('#s') : v('#e') - v('#c');
    if (t.shape === 'sep') return t.ask === '#e' ? v('#s') - v('#c') : t.ask === '#c' ? v('#s') - v('#e') : v('#e') + v('#c');
    if (t.shape === 'part') return t.ask === '#w' ? v('#p') + v('#q') : v('#w') - v('#p');
    return t.ask === '#d' ? v('#big') - v('#small') : t.ask === '#big' ? v('#small') + v('#d') : v('#big') - v('#d');
  }
  throw new Error(`a story this check does not know: ${texts.join(' / ')}`);
}

/** Answers the first question as a child would, from the screen: a Deck Log story on the wheels, or a Which Sum number sentence. */
async function answerFirst(page: Page) {
  const texts = await page.locator('.cd-story li').allTextContents();
  const answer = storyAnswer(texts.map(t => t.replace(/\s+/g, ' ').trim()));
  if (await page.locator('.cd-sentence').count()) {
    for (const label of await page.locator('.cd-sentence').evaluateAll(els => els.map(e => e.getAttribute('aria-label') ?? ''))) {
      if (solve(parseEq(label)) === answer) { await page.getByRole('button', { name: label, exact: true }).click(); return; }
    }
    throw new Error('no number sentence fits');
  }
  const digits = String(answer).padStart(2, '0').split('').map(Number);
  for (const [i, name] of ['tens', 'ones'].entries()) for (let k = 0; k < digits[i]!; k++) await page.getByRole('button', { name: `${name} up`, exact: true }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
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
  const voice = precachedVoice(deckBuild, cached);
  assert.deepEqual(voice.missing, [], `${voice.missing.length} of ${voice.packs} voice packs not precached`);
  assert.ok(voice.clips.size > 700, `only ${voice.clips.size} voice clips in the packs`);
  console.log(`precached ${cached.length} files, ${voice.packs} of them voice packs with ${voice.clips.size} clips`);

  // offline: reload, Start, Play
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30000 });
  await page.locator('.game.cd[data-ready="yes"]').waitFor({ timeout: 60000 });
  const said = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
  assert.ok(said > 0, 'no recorded voice played offline');
  await answerFirst(page);
  await page.waitForTimeout(2500);
  await page.locator('.game.cd[data-ready="yes"]').waitFor({ timeout: 60000 });
  const stars = await page.locator('.stars').getAttribute('aria-label');
  console.log(`offline: a Round started, ${said} clips played, ${stars}`);
  assert.match(stars ?? '', /^1 of 5/, 'the first answer did not count');
  const place = await page.evaluate(() => JSON.parse(localStorage.getItem('carrier-deck-place') ?? '{}'));
  assert.equal(place.screen, 'round', 'the Round in progress was not remembered');

  // a reload in the middle of the Round, still offline: Start brings him back into it
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.locator('.game.cd[data-ready="yes"]').waitFor({ timeout: 60000 });
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
