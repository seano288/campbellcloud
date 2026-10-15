import assert from 'node:assert/strict';
import { chromium, type Page } from 'playwright';
import { preview } from 'vite';
import { button, waitForAssertion, watch } from '../baseline/play';
import { observeRecordedVoice, playedToEnd } from '../baseline/voice';

// Completion Trophies are dated by the browser's clock, fixed so their expected dates hold on any day.
const PAIRING_DAY = '2026-10-15';

export async function exerciseBuiltPairing(outDir: string, name: string) {
  const server = await preview({ configFile: false, build: { outDir }, preview: { host: '127.0.0.1', port: 0 } });
  const browser = await chromium.launch();
  try {
    const url = server.resolvedUrls?.local[0];
    assert.ok(url);
    await playPairing(await browser.newPage({ serviceWorkers: 'block' }), url, name);
  } finally {
    await browser.close();
    await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  }
}

// Plays one pairing build through its real screens: practice with recorded playback, two completions, re-shown
// completion, purchases and an insufficient-funds rejection, then a reload. The page may be offline.
// Pass `problems` from a watch() attached earlier to include loads from before the journey, such as warming.
export async function playPairing(page: Page, url: string, name: string, problems = watch(page, url)) {
  await page.goto(url);
  const audio = await observeRecordedVoice(page);
  const key = `test-${name}`;
  const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), key);
  await button(page, 'Start').click();
  if (name === 'clock-garage') {
    await button(page, 'Pickup').click();
    await button(page, 'Choose').click();
  }
  await button(page, 'Practice').click();
  await button(page, 'Say it again').click();
  await waitForAssertion(async () => assert.ok(audio.some(start => playedToEnd(audio, start)), 'Recorded prompt did not play to its end'));
  await page.clock.install({ time: new Date(`${PAIRING_DAY}T12:00:00.000Z`) });
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
    ? { 'streak:5': PAIRING_DAY, perfect: PAIRING_DAY }
    : { 'first-clock': PAIRING_DAY, perfect: PAIRING_DAY, 'rounds:1': PAIRING_DAY });
  await button(page, 'Show completion').click();
  await button(page, 'Show completion').click();
  assert.deepEqual(await saved(), completed);
  await button(page, 'Home').click();
  if (name === 'clock-garage') {
    await button(page, 'Practice').click();
    await complete();
    await button(page, 'Home').click();
    await button(page, 'Garage').click();
    await button(page, 'Buy Tires').click();
    const bought = await saved();
    assert.equal(bought.currency.balance, 3);
    assert.deepEqual(bought.garage.unlocked, ['tires:1']);
    await button(page, 'Buy Tires').click();
    assert.deepEqual(await saved(), bought);
    await button(page, 'Free fit').click();
    assert.equal((await saved()).garage.fitted.pickup.tires, 0);
  } else {
    await button(page, 'Repeat reward').click();
    const count = name === 'money-repeat' ? 3 : 2;
    for (let i = 0; i < count; i++) await button(page, 'Buy again').click();
    const bought = await saved();
    assert.equal(bought.currency.balance, 0);
    assert.equal(bought.reward.purchases, count);
    await button(page, 'Buy again').click();
    assert.deepEqual(await saved(), bought);
  }
  const committed = await saved();
  await page.reload();
  await button(page, 'Start').click();
  assert.equal(await page.getByLabel('Balance', { exact: true }).innerText(), String(committed.currency.balance));
  assert.deepEqual(await saved(), committed);
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), [key]);
  assert.deepEqual(problems, []);
}
