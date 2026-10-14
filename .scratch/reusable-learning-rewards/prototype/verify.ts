import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ offline: true });
  await context.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Prototype read real browser storage'); };
    Storage.prototype.setItem = () => { throw new Error('Prototype wrote real browser storage'); };
  });
  const page = await context.newPage();
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto(new URL('swap-prototype.html', import.meta.url).href);
  const cases = [
    { tab: 'Clock + Garage', balance: 1, completed: 1, reward: { unlocked: ['tires:1'], fitted: 'tires:1', goal: null } },
    { tab: 'Money + recruitment', balance: 0, completed: 1, reward: { quantity: 2 } },
    { tab: 'Help and leaving', balance: 0, completed: 0, reward: { quantity: 0 } },
    { tab: 'Isolated saves', balance: 3, completed: 1, reward: { quantity: 1 } },
    { tab: 'Blocked save', balance: 3, completed: 1, reward: { quantity: 1 } },
  ];
  for (const example of cases) {
    await page.locator('#tabs').getByRole('button', { name: example.tab, exact: true }).click();
    for (let i = 0; i < 30 && await page.locator('#steps button:enabled').count(); i++) {
      await page.locator('#steps button:enabled').click();
    }
    assert.equal(await page.locator('#step-count').textContent(), 'Walkthrough complete.');
    const state = JSON.parse(await page.locator('#aggregate').textContent() ?? 'null');
    assert.equal(state.currency.balance, example.balance, example.tab);
    assert.equal(state.completedRounds, example.completed, example.tab);
    assert.deepEqual(state.reward, example.reward, example.tab);
    if (example.tab === 'Isolated saves') {
      assert.match(await page.locator('#other-apps').textContent() ?? '', /1 Bolts; Owned Mods: tires:1/);
    }
    console.log(`${example.tab}: passed offline from file URL`);
  }
  assert.deepEqual(errors, []);
  assert.equal(requests.length, 1, 'Standalone file must make no asset or network requests');
  console.log('No browser errors, real storage access or external requests.');
} finally {
  await browser.close();
}
