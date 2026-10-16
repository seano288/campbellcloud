// Real-UI moves shared by the baseline and offline browser journeys. They read the rendered production
// screens and the saved snapshot; they never reach into app state.
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import type { Page } from 'playwright';
import type { Save } from '../../src/save/migrate';
import { STORAGE_KEY } from './saves';

export const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

// Collects browser errors, failed or missing loads and any request that leaves the served origin.
export function watch(page: Page, url: string, problems: string[] = []) {
  const origin = new URL(url).origin;
  page.on('pageerror', error => problems.push(`page error: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') problems.push(`console error: ${message.text()}`); });
  page.on('requestfailed', request => problems.push(`failed: ${request.url()} ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => {
    if (!/^(data|blob):/.test(request.url()) && new URL(request.url()).origin !== origin) problems.push(`external: ${request.url()}`);
  });
  return problems;
}

export async function saved(page: Page): Promise<Save> {
  return page.evaluate(key => {
    const text = localStorage.getItem(key);
    if (!text) throw new Error('No saved snapshot');
    return JSON.parse(text);
  }, STORAGE_KEY);
}

export async function recordPurchaseSnapshots(page: Page) {
  await page.evaluate(key => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key) {
        const snapshots = JSON.parse(sessionStorage.getItem('purchase-snapshots') ?? '[]');
        snapshots.push(JSON.parse(value));
        write.call(sessionStorage, 'purchase-snapshots', JSON.stringify(snapshots));
      }
      write.call(this, name, value);
    };
  }, STORAGE_KEY);
}

export const purchaseSnapshots = (page: Page): Promise<Save[]> =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('purchase-snapshots') ?? '[]'));

export async function waitForAssertion(check: () => Promise<void>, timeout = 15000) {
  const until = Date.now() + timeout;
  for (;;) {
    try { await check(); return; }
    catch (error) { if (Date.now() >= until) throw error; }
    await sleep(50);
  }
}

const denominations = [
  { name: '$5 Bill', cents: 500 }, { name: '$1 Bill', cents: 100 }, { name: 'Quarter', cents: 25 },
  { name: 'Dime', cents: 10 }, { name: 'Nickel', cents: 5 }, { name: 'Penny', cents: 1 },
];
const centsOf = (text: string) => Math.round(Number(text.replace(/[^0-9.]/g, '')) * (text.includes('$') ? 100 : 1));
export const modeName = { learn: 'Learn the Coins', count: 'Count the Cash', pay: 'Pay the Shop' };

export async function correctChoice(page: Page, mode: 'learn' | 'count') {
  const captions = await page.locator('main .pile .cap').allTextContents();
  const prompt = await page.locator('main .ask h2').innerText();
  if (mode === 'count') {
    const total = captions.reduce((sum, caption) => sum + centsOf(caption.split(' · ')[1]!), 0);
    const choices = page.locator('main .choice');
    for (const choice of await choices.all()) if (centsOf(await choice.innerText()) === total) return choice;
    throw new Error('Rendered Count pile has no matching answer');
  }
  if (await page.locator('main .choice').count()) {
    const [name, value] = captions[0]!.split(' · ');
    return button(page, prompt.includes('called') ? name! : value!);
  }
  if (prompt.startsWith('Tap the ')) return button(page, prompt.slice(8, -1));
  const names = await page.locator('main .money-btn').evaluateAll(elements => elements.map(el => el.getAttribute('aria-label')));
  const values = names.map(name => {
    const money = denominations.find(money => money.name === name);
    assert.ok(money, `Unknown rendered money ${name}`);
    return money;
  }).sort((a, b) => a.cents - b.cents);
  return button(page, (prompt.includes('MORE') ? values.at(-1) : values[0])!.name);
}

export async function fillPayment(page: Page) {
  let remaining = centsOf(await page.locator('.price').innerText());
  for (const { name, cents } of denominations) {
    const coin = page.locator('.bank').getByRole('button', { name, exact: true });
    if (!await coin.count()) continue;
    while (remaining >= cents) { await coin.click(); remaining -= cents; }
  }
  assert.equal(remaining, 0);
}

export async function solve(page: Page, mode: 'learn' | 'count' | 'pay') {
  if (mode === 'pay') { await fillPayment(page); await button(page, 'Pay').click(); }
  else await (await correctChoice(page, mode)).click();
  await page.locator('main .right').first().waitFor();
  await page.waitForFunction(() => document.querySelector('.reward') || !document.querySelector('main .right'));
}

export async function missChoice(page: Page, mode: 'learn' | 'count') {
  const right = await correctChoice(page, mode);
  const answer = await right.getAttribute('aria-label') ?? await right.innerText();
  for (const choice of await page.locator('main .choice:not(:disabled), main .money-btn:not(.nope)').all()) {
    if ((await choice.getAttribute('aria-label') ?? await choice.innerText()) === answer) continue;
    await choice.click();
    await page.locator('main.thinking').waitFor();
    await page.locator('main.thinking').waitFor({ state: 'hidden' });
    return;
  }
  throw new Error('No unused wrong choice');
}

export async function finishShow(page: Page) {
  await waitForAssertion(async () => assert.doesNotMatch(await page.locator('.reward .btns').getAttribute('class') ?? '', /asleep/), 60000);
}

export async function openSheet(page: Page, name: string) {
  if (await page.locator('.sheet').count()) await page.locator('.sheet').getByRole('button', { name: 'Close', exact: true }).click();
  // Hotspots follow the Truck every frame, and after 12 s idle the Truck slowly spins, so on a slow runner a hotspot is
  // never still long enough for Playwright's stability check. Tap the visible button directly instead.
  const hot = page.locator(`.hot[aria-label="${name}"]:not(.hidden)`);
  await hot.waitFor();
  await hot.dispatchEvent('click');
  await page.locator('.sheet').waitFor();
}
