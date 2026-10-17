// Offline browser journeys against the candidate builds, each in a fresh synthetic Chromium profile. After the
// service worker has precached a build, the network goes away and the real money app practises, teaches, pays,
// saves and plays recorded audio. The three test-only pairing builds repeat their journeys offline, the money app
// runs again with service workers blocked, and an available update must wait for the next launch.
// Run after `vite build` and `npm run build:pairings`: npx tsx tools/offline-check.ts [journey substring]
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { preview } from 'vite';
import type { Save } from '../src/save/migrate';
import { JOURNEY_SAVES, NOW, STORAGE_KEY } from './baseline/saves';
import { button, fillPayment, finishShow, missChoice, openSheet, saved, solve, waitForAssertion, watch, watchBlocker, watchToast } from './baseline/play';
import { observeRecordedVoice, playedToEnd, type VoiceEvent } from './baseline/voice';
import { playPairing } from './pairings/browser';

interface Site { root: string; url: string; close(): Promise<void> }

// Serves a private copy, so the update journey can publish a new version without touching the candidate output.
async function serve(outDir: string): Promise<Site> {
  const root = mkdtempSync(resolve(tmpdir(), 'offline-site-'));
  cpSync(outDir, root, { recursive: true });
  const server = await preview({ configFile: false, logLevel: 'silent', build: { outDir: root }, preview: { host: '127.0.0.1', port: 0 } });
  const url = server.resolvedUrls?.local[0];
  assert.ok(url, 'Preview server has no local URL');
  return {
    root, url,
    async close() {
      await new Promise<void>((done, fail) => server.httpServer.close(error => error ? fail(error) : done()));
      rmSync(root, { recursive: true, force: true });
    },
  };
}

// A fresh in-memory profile at the baseline's fixed time. The synthetic save is written once per profile, so
// reloads and relaunches read what the app saved rather than the seed.
async function profile(browser: Browser, seed: Save | null, serviceWorkers: 'allow' | 'block' = 'allow') {
  const context = await browser.newContext({ serviceWorkers, viewport: { width: 1024, height: 768 }, timezoneId: 'UTC' });
  await context.addInitScript(({ seed, key }) => {
    if (seed && !localStorage.getItem('offline-seeded')) {
      localStorage.setItem(key, JSON.stringify(seed));
      localStorage.setItem('offline-seeded', 'yes');
    }
  }, { seed, key: STORAGE_KEY });
  return context;
}

async function newPage(context: BrowserContext) {
  const page = await context.newPage();
  page.setDefaultTimeout(60000); // the Garage renders 3D in software on CI, so even a tap can wait seconds for a frame
  await page.clock.setFixedTime(new Date(NOW));
  return page;
}

// Installs the service worker and waits until it controls the page: installed means everything is precached.
async function warm(page: Page, url: string) {
  await page.goto(url);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(r => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
  });
}

// Every built file except the worker itself is precached, and nothing else is.
async function checkPrecache(page: Page, site: Site) {
  const cached = await page.evaluate(async () => {
    const paths: string[] = [];
    for (const name of await caches.keys()) for (const request of await (await caches.open(name)).keys()) paths.push(new URL(request.url).pathname);
    return paths;
  });
  const base = new URL(site.url).pathname;
  const built = readdirSync(site.root, { recursive: true }).map(String)
    .filter(file => statSync(resolve(site.root, file)).isFile() && !/^(sw|workbox-[\w-]+)\.js$/.test(file));
  assert.deepEqual(cached.map(path => path.slice(base.length)).sort(), built.sort());
}

const played = (events: readonly VoiceEvent[]) => events.some(start => playedToEnd(events, start));
const lastStart = (events: readonly VoiceEvent[]) => events.filter(event => event.kind === 'start').at(-1)?.id ?? 0;

// Waits until earlier speech has finished and no new clip has started for a second. Clip events reach Node
// asynchronously, so a clip that has only just started may not be in `events` yet.
async function quiet(page: Page, events: readonly VoiceEvent[]) {
  for (;;) {
    await waitForAssertion(async () => assert.ok(events.every(start => start.kind !== 'start' ||
      events.some(done => done.kind !== 'start' && done.id === start.id)), 'Earlier speech still playing'), 30000);
    const settled = events.length;
    await page.waitForTimeout(1000);
    if (events.length === settled) return;
  }
}

// Count asks its question and then reads each choice as an amount joined from recorded pieces, lighting the
// choice it is reading. Every piece must play to its end, and the light must visit each choice in reading order.
async function hearCountPrompt(page: Page, events: readonly VoiceEvent[]) {
  await quiet(page, events);
  const before = lastStart(events);
  await page.evaluate(() => {
    const lit: string[] = [];
    Reflect.set(window, 'litChoices', lit);
    new MutationObserver(() => {
      const speaking = document.querySelector<HTMLElement>('main .choice.speaking')?.innerText;
      if (speaking && lit.at(-1) !== speaking) lit.push(speaking);
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  });
  await button(page, 'Count the Cash').click();
  const choices = await page.locator('main .choice').allInnerTexts();
  await waitForAssertion(async () => {
    const starts = events.filter(event => event.kind === 'start' && event.id > before);
    assert.ok(starts.length > choices.length, `Only ${starts.length} prompt clips started for ${choices.length} choices`);
    assert.ok(starts.every(start => playedToEnd(events, start)), 'Prompt clips did not all finish');
    assert.deepEqual(await page.evaluate(() => Reflect.get(window, 'litChoices')), choices);
  }, 30000);
  assert.equal(events.some(event => event.kind === 'stop' && event.id > before), false);
}

const journeys: { name: string; run(browser: Browser): Promise<void> }[] = [];
const journey = (name: string, run: (browser: Browser) => Promise<void>) => { journeys.push({ name, run }); };

journey('money app practises, teaches, earns, buys, checks out, saves and plays recorded audio offline', async browser => {
  const site = await serve('dist');
  const context = await profile(browser, JOURNEY_SAVES['checkout-2']);
  try {
    let page = await newPage(context);
    const problems = watch(page, site.url);
    await warm(page, site.url);
    await checkPrecache(page, site);
    await context.setOffline(true);
    await page.reload();
    let voice = await observeRecordedVoice(page);
    await button(page, 'Start').click();
    await waitForAssertion(async () => assert.ok(played(voice), 'No recorded greeting played offline'));

    // Count's joined amount prompt plays and highlights while it speaks; then manual help, then automatic teaching.
    await hearCountPrompt(page, voice);
    await page.getByRole('button', { name: /Help me count/ }).click();
    await page.locator('main .slot.lit').first().waitFor();
    await solve(page, 'count');
    await missChoice(page, 'count');
    const taught = page.locator('main .slot.lit').first().waitFor();
    await missChoice(page, 'count');
    await taught;
    while (!await page.locator('.reward').count()) await solve(page, 'count');
    await finishShow(page);
    const completed = await saved(page);
    const window = completed.modes.count.window;
    assert.equal(window[0], 'helped');
    assert.ok(window.includes('missed'), `Expected the taught answer in ${window.join(', ')}`);
    assert.equal(completed.roundsFinished, 1);
    assert.equal(completed.bolts, 16 + window.filter(outcome => outcome === 'clean').length + 1);
    assert.equal(await page.locator('.reward').count(), 1);

    // Leaving while a prompt speaks stops that clip and earns nothing.
    await page.locator('.reward').getByRole('button', { name: 'Home', exact: true }).click();
    await button(page, 'Count the Cash').click();
    await page.locator('main .choice.speaking').first().waitFor();
    const prompt = lastStart(voice);
    await button(page, 'Home').click();
    await waitForAssertion(async () => assert.ok(voice.some(event => event.kind === 'stop' && event.id === prompt), 'Prompt kept playing after Home'));
    await page.waitForTimeout(2000);
    assert.equal(await page.locator('.speaking').count(), 0);
    assert.deepEqual(await saved(page), completed);

    // A Bolt purchase commits balance, ownership and fit together.
    await button(page, 'Garage').click();
    await openSheet(page, 'Tires');
    const blocked = await watchBlocker(page);
    await button(page, 'Giant').click();
    await blocked();
    await page.locator('.blocker').waitFor({ state: 'hidden', timeout: 90000 });
    const bought: Save = {
      ...completed, bolts: completed.bolts - 15, unlocked: [...completed.unlocked, 'tires:2'],
      fitted: { ...completed.fitted, pickup: { ...completed.fitted.pickup, tires: 2 } },
    };
    assert.deepEqual(await saved(page), bought);

    // Legendary checkout: a short payment, then automatic help on the second miss, then the exact payment.
    await button(page, 'Monster Treads').click();
    await page.locator('.checkout').waitFor();
    assert.equal(await page.locator('.price').innerText(), '$1.10');
    await page.locator('.bank').getByRole('button', { name: 'Penny', exact: true }).click();
    const toast1 = await watchToast(page, 'Almost! You need $1.09 more.');
    await button(page, 'Pay').click();
    await toast1();
    await button(page, 'Pay').click();
    await waitForAssertion(async () => assert.equal(await page.locator('.paidrow b').innerText(), '$1.10'), 120000); // help adds each piece aloud; slow on CI
    assert.deepEqual(await saved(page), bought);
    await button(page, 'Pay').click();
    await page.locator('.checkout').waitFor({ state: 'hidden' });
    await page.locator('.blocker').waitFor({ state: 'hidden', timeout: 90000 });
    const legendary: Save = {
      ...bought, unlocked: [...bought.unlocked, 'tires:4'],
      fitted: { ...bought.fitted, pickup: { ...bought.fitted.pickup, tires: 4 } },
    };
    assert.deepEqual(await saved(page), legendary);

    // Offline reload, then a relaunch in a new page, both restore the committed state.
    await page.reload();
    await button(page, 'Start').click();
    await button(page, 'Garage').click();
    await openSheet(page, 'Tires');
    assert.match(await button(page, 'Monster Treads').getAttribute('class') ?? '', /fitted/);
    assert.deepEqual(await saved(page), legendary);
    await page.close();
    page = await newPage(context);
    problems.push(...watch(page, site.url));
    await page.goto(site.url);
    voice = await observeRecordedVoice(page);
    await button(page, 'Start').click();
    await waitForAssertion(async () => assert.ok(played(voice), 'No recorded greeting played on offline relaunch'));
    await page.locator('.home').waitFor();
    assert.deepEqual(await saved(page), legendary);
    assert.deepEqual(problems, []);
  } finally {
    await context.close();
    await site.close();
  }
});

for (const name of ['money-repeat', 'clock-garage', 'clock-repeat']) {
  journey(`${name} pairing build precaches only its files and plays its journey offline`, async browser => {
    const site = await serve(`dist-pairings/${name}`);
    const context = await profile(browser, null);
    try {
      const page = await context.newPage();
      const problems = watch(page, site.url);
      await warm(page, site.url);
      await checkPrecache(page, site);
      await page.evaluate(() => localStorage.clear());
      await context.setOffline(true);
      await playPairing(page, site.url, name, problems);
    } finally {
      await context.close();
      await site.close();
    }
  });
}

journey('money app starts, practises, buys and plays recorded audio online with service workers blocked', async browser => {
  const site = await serve('dist');
  const context = await profile(browser, JOURNEY_SAVES['checkout-2'], 'block');
  try {
    const page = await newPage(context);
    const problems = watch(page, site.url);
    await page.goto(site.url);
    const voice = await observeRecordedVoice(page);
    await button(page, 'Start').click();
    assert.equal(await page.evaluate(() => navigator.serviceWorker?.controller ?? null), null);
    await hearCountPrompt(page, voice);
    await solve(page, 'count');
    await button(page, 'Home').click();
    const practised = await saved(page);
    assert.deepEqual(practised.modes.count.window, ['clean']);
    await button(page, 'Garage').click();
    await openSheet(page, 'Tires');
    const blocked = await watchBlocker(page);
    await button(page, 'Giant').click();
    await blocked();
    await page.locator('.blocker').waitFor({ state: 'hidden', timeout: 90000 });
    assert.deepEqual(await saved(page), {
      ...practised, bolts: practised.bolts - 15, unlocked: [...practised.unlocked, 'tires:2'],
      fitted: { ...practised.fitted, pickup: { ...practised.fitted.pickup, tires: 2 } },
    });
    assert.equal(await page.evaluate(async () => (await caches.keys()).length), 0);
    assert.deepEqual(problems, []);
  } finally {
    await context.close();
    await site.close();
  }
});

// Publishes version `n` of the served copy: different HTML and a matching precache revision.
function publishUpdate(site: Site, n: number) {
  const html = resolve(site.root, 'index.html'), sw = resolve(site.root, 'sw.js');
  const page = readFileSync(html, 'utf8').replace(/<meta name="candidate-update"[^>]*>/, '');
  writeFileSync(html, page.replace('<head>', `<head><meta name="candidate-update" content="${n}">`));
  const worker = readFileSync(sw, 'utf8');
  const updated = worker.replace(/(\{url:"index\.html",revision:")[\w-]+"/, `$1update-${n}"`);
  assert.notEqual(updated, worker, 'Service worker has no index.html precache entry');
  writeFileSync(sw, updated);
}

journey('an available update waits through an active Round, show and checkout and appears on the next launch', async browser => {
  const site = await serve('dist');
  const context = await profile(browser, JOURNEY_SAVES['checkout-2']);
  try {
    let page = await newPage(context);
    const problems = watch(page, site.url);
    await warm(page, site.url);
    await page.reload();
    let navigations = 0;
    page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
    await button(page, 'Start').click();
    await button(page, 'Count the Cash').click();
    await solve(page, 'count');
    // Each update installs a new worker that takes over this page while the activity is still on screen.
    let published = 0;
    const update = async () => {
      publishUpdate(site, ++published);
      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        const changed = new Promise(r => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
        await registration!.update();
        await changed;
      });
    };
    await update();
    for (let i = 0; i < 4; i++) await solve(page, 'count');
    assert.match(await page.locator('.reward .btns').getAttribute('class') ?? '', /asleep/, 'Celebration already finished');
    await update();
    await finishShow(page);
    assert.equal((await saved(page)).roundsFinished, 1);
    await button(page, 'Garage').click();
    await openSheet(page, 'Tires');
    await button(page, 'Monster Treads').click();
    await page.locator('.checkout').waitFor();
    await update();
    await fillPayment(page);
    await button(page, 'Pay').click();
    await page.locator('.checkout').waitFor({ state: 'hidden' });
    assert.ok((await saved(page)).unlocked.includes('tires:4'));
    assert.equal(navigations, 0);
    assert.equal(await page.locator('meta[name="candidate-update"]').count(), 0);
    await page.close();
    page = await newPage(context);
    problems.push(...watch(page, site.url));
    await context.setOffline(true);
    await page.goto(site.url);
    assert.equal(await page.locator('meta[name="candidate-update"]').getAttribute('content'), String(published));
    await button(page, 'Start').click();
    await page.locator('.home').waitFor();
    assert.deepEqual(problems, []);
  } finally {
    await context.close();
    await site.close();
  }
});

const selected = journeys.filter(j => !process.argv[2] || j.name.includes(process.argv[2]));
assert.ok(selected.length, 'No matching offline journey');
const browser = await chromium.launch();
let failed = false;
try {
  console.log(`Chromium ${browser.version()}; ${selected.length} offline journeys`);
  for (const { name, run } of selected) {
    try {
      await run(browser);
      console.log(`✓ ${name}`);
    } catch (error) {
      failed = true;
      console.log(`✗ ${name}`);
      console.error(error);
    }
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
