import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { expect } from 'vitest';
import { observeRecordedVoice } from '../baseline/voice';

export async function exerciseBuiltPairing(outDir: string, name: string) {
  const server = await preview({ configFile: false, build: { outDir }, preview: { host: '127.0.0.1', port: 0 } });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ serviceWorkers: 'block' });
    const errors: string[] = [];
    const requests: string[] = [];
    page.on('request', request => requests.push(request.url()));
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    const url = server.resolvedUrls?.local[0];
    assert.ok(url);
    await page.goto(url);
    const audio = await observeRecordedVoice(page);
    const button = (name: string) => page.getByRole('button', { name, exact: true });
    const key = `test-${name}`;
    const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), key);
    await button('Start').click();
    if (name === 'clock-garage') {
      await button('Pickup').click();
      await button('Choose').click();
    }
    await button('Practice').click();
    await button('Say it again').click();
    await expect.poll(() => audio.some(event => event.kind === 'start' && event.running && event.audible && event.duration > 0)).toBe(true);
    await page.clock.install();
    async function complete() {
      for (let i = 0; i < 5; i++) {
        const answer = name === 'money-repeat' ? (await page.locator('main h2').innerText()).slice(8, -1) : '3:00';
        await page.locator('main').getByRole('button', { name: answer, exact: true }).click();
        await page.clock.runFor(i === 4 ? 950 : 1550);
        if (name === 'money-repeat') assert.equal((await saved()).learning.modes.learn.window.length, i + 1, await page.locator('.round-screen').innerText());
      }
      assert.match(await page.locator('[role="status"]').innerText(), /Completed\. Earned [46]\./);
    }
    await complete();
    const completed = await saved();
    assert.deepEqual(completed.trophies.earned, name === 'money-repeat'
      ? { 'streak:5': '2026-10-15', perfect: '2026-10-15' }
      : { 'first-clock': '2026-10-15', perfect: '2026-10-15', 'rounds:1': '2026-10-15' });
    await button('Show completion').click();
    await button('Show completion').click();
    assert.deepEqual(await saved(), completed);
    await button('Home').click();
    if (name === 'clock-garage') {
      await button('Practice').click();
      await complete();
      await button('Home').click();
      await button('Garage').click();
      await button('Buy Tires').click();
      const bought = await saved();
      assert.equal(bought.currency.balance, 3);
      assert.deepEqual(bought.garage.unlocked, ['tires:1']);
      await button('Buy Tires').click();
      assert.deepEqual(await saved(), bought);
      await button('Free fit').click();
      assert.equal((await saved()).garage.fitted.pickup.tires, 0);
    } else {
      await button('Repeat reward').click();
      const count = name === 'money-repeat' ? 3 : 2;
      for (let i = 0; i < count; i++) await button('Buy again').click();
      const bought = await saved();
      assert.equal(bought.currency.balance, 0);
      assert.equal(bought.reward.purchases, count);
      await button('Buy again').click();
      assert.deepEqual(await saved(), bought);
    }
    const committed = await saved();
    await page.reload();
    await button('Start').click();
    assert.equal(await page.getByLabel('Balance', { exact: true }).innerText(), String(committed.currency.balance));
    assert.deepEqual(await saved(), committed);
    assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), [key]);
    assert.deepEqual(requests.filter(request => !/^(data|blob):/.test(request) && new URL(request).origin !== new URL(url).origin), []);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  }
}
