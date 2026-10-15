import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium, type Page } from 'playwright';
import { preview } from 'vite';
import type { Save } from '../../src/save/migrate';
import { FRESH_EXPECTED, JOURNEY_SAVES, NOW, PROGRESSED_EXPECTED, STORAGE_KEY, TODAY } from './saves';

const journeys: { name: string; seed: unknown; run: (page: Page) => Promise<void> }[] = [];
const journey = (name: string, seed: unknown, run: (page: Page) => Promise<void>) => { journeys.push({ name, seed, run }); };
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function saved(page: Page): Promise<Save> {
  return page.evaluate(key => {
    const text = localStorage.getItem(key);
    if (!text) throw new Error('No saved snapshot');
    return JSON.parse(text);
  }, STORAGE_KEY);
}

async function waitForAssertion(check: () => Promise<void>, timeout = 15000) {
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
const modeName = { learn: 'Learn the Coins', count: 'Count the Cash', pay: 'Pay the Shop' };

async function correctChoice(page: Page, mode: 'learn' | 'count') {
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

async function fillPayment(page: Page) {
  let remaining = centsOf(await page.locator('.price').innerText());
  for (const { name, cents } of denominations) {
    const coin = page.locator('.bank').getByRole('button', { name, exact: true });
    if (!await coin.count()) continue;
    while (remaining >= cents) { await coin.click(); remaining -= cents; }
  }
  assert.equal(remaining, 0);
}

async function solve(page: Page, mode: 'learn' | 'count' | 'pay') {
  if (mode === 'pay') { await fillPayment(page); await button(page, 'Pay').click(); }
  else await (await correctChoice(page, mode)).click();
  await page.locator('main .right').first().waitFor();
  await page.waitForFunction(() => document.querySelector('.reward') || !document.querySelector('main .right'));
}

async function finishShow(page: Page) {
  await waitForAssertion(async () => assert.doesNotMatch(await page.locator('.reward .btns').getAttribute('class') ?? '', /asleep/), 60000);
}

journey('fresh setup previews without saving and confirms a starter', null, async page => {
  await button(page, 'Start').click();
  await page.locator('.picker-screen').waitFor();
  assert.equal(await button(page, 'Choose').isDisabled(), true);
  await button(page, 'Big Foot').click();
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY), null);
  await button(page, 'Choose').click();
  await page.locator('.home').waitFor();
  assert.deepEqual(await saved(page), { ...FRESH_EXPECTED, body: 'bigfoot' });
  assert.match(await button(page, 'Count the Cash').getAttribute('class') ?? '', /locked/);
  await button(page, 'Count the Cash').click();
  assert.equal(await page.locator('.home').isVisible(), true);
  await page.reload();
  await button(page, 'Start').click();
  await page.locator('.home').waitFor();
  assert.equal((await saved(page)).body, 'bigfoot');
});

journey('Learn progression, combined celebrations, Trophies and next-Round introduction', JOURNEY_SAVES.milestones, async page => {
  await button(page, 'Start').click();
  await button(page, 'Learn the Coins').click();
  for (let i = 0; i < 5; i++) {
    assert.doesNotMatch((await page.locator('main .cap').allTextContents()).join(' '), /Quarter|Bill/);
    await solve(page, 'learn');
  }
  const state = await saved(page);
  assert.equal(state.bolts, 6);
  assert.deepEqual(state.modes.learn, { level: 2, window: ['clean', 'clean', 'clean', 'clean'], opened: true, starred: false, introPending: true, fresh: false });
  assert.equal(state.modes.count.opened, true);
  assert.equal(state.modes.count.fresh, true);
  assert.equal(state.roundsFinished, 10);
  assert.equal(state.daysPlayed, 5);
  assert.deepEqual(state.trophies, { 'learn:2': TODAY, 'streak:5': TODAY, perfect: TODAY, 'rounds:10': TODAY, 'days:5': TODAY });
  assert.match(await page.locator('.reward .btns').getAttribute('class') ?? '', /asleep/);
  await finishShow(page);
  assert.deepEqual(await page.locator('.reward .lines > div').allTextContents(), [
    'You earned 6 Bolts!', 'Level up!', 'Now you get quarters!', 'You opened Count the Cash!',
    'You earned Learn the Coins Level 2!', 'You earned 5 in a Row!', 'You earned Perfect Round!',
    'You earned 10 Rounds!', 'You earned 5 Days!', 'You can build something new!',
  ]);
  assert.equal(await page.locator('.bigpile > span').innerText(), '6');
  assert.match(await page.locator('.reward').getByRole('button', { name: 'Garage', exact: true }).getAttribute('class') ?? '', /pulse/);
  await button(page, 'Play again').click();
  await page.getByRole('heading', { name: 'New money!' }).waitFor();
  assert.equal((await saved(page)).modes.learn.introPending, true);
  await page.locator('.modal').getByRole('button', { name: 'Quarter', exact: true }).click();
  await button(page, 'Play').click();
  await page.locator('.modal').waitFor({ state: 'hidden' });
  assert.equal((await saved(page)).modes.learn.introPending, false);
  await button(page, 'Home').click();
  await button(page, 'Garage').click();
  await button(page, 'Trophies').click();
  assert.equal(await page.locator('.shelf .plank').count(), 3);
  assert.equal(await page.locator('.shelf-trophy.earned').count(), 5);
  await button(page, 'Perfect Round').click();
  assert.equal((await saved(page)).bolts, 6);
});

journey('counting Trophies upgrade in place on the rendered shelf', {
  ...FRESH_EXPECTED, body: 'pickup', currentStreak: 9, bestStreak: 9, roundsFinished: 24,
  daysPlayed: 4, lastDay: '2026-10-13', trophies: { 'streak:5': '2026-09-01', 'rounds:10': '2026-09-02' },
}, async page => {
  await button(page, 'Start').click();
  await button(page, 'Garage').click();
  await button(page, 'Trophies').click();
  assert.equal(await page.locator('.shelf-trophy').count(), 13);
  assert.equal(await button(page, '5 in a Row').locator('.pips .on').count(), 1);
  assert.equal(await button(page, '10 Rounds').locator('svg path').first().getAttribute('stroke'), '#cd7f32');
  await page.locator('.shelf').getByRole('button', { name: 'Close', exact: true }).click();
  await button(page, 'Home').click();
  await button(page, 'Learn the Coins').click();
  for (let i = 0; i < 5; i++) await solve(page, 'learn');
  const state = await saved(page);
  assert.deepEqual(state.trophies, { 'streak:5': '2026-09-01', 'rounds:10': '2026-09-02', 'streak:10': TODAY, perfect: TODAY, 'rounds:25': TODAY, 'days:5': TODAY });
  await page.reload();
  await button(page, 'Start').click();
  await button(page, 'Garage').click();
  await button(page, 'Trophies').click();
  assert.equal(await page.locator('.shelf-trophy').count(), 13);
  assert.equal(await page.locator('.shelf-trophy.earned').count(), 4);
  for (const name of ['10 in a Row', '25 Rounds']) {
    const trophy = button(page, name);
    assert.equal(await trophy.locator('.pips .on').count(), 2);
    assert.equal(await trophy.locator('svg path').first().getAttribute('stroke'), '#d4dae3');
  }
  assert.equal(await page.locator('.shelf-trophy:not(.earned) svg path').first().getAttribute('stroke'), '#4b5160');
});

for (const mode of ['count', 'pay'] as const) {
  const seed: Save = {
    ...FRESH_EXPECTED, body: 'pickup', bolts: 4,
    modes: { ...JOURNEY_SAVES.practice.modes, [mode]: { level: 2, window: ['clean', 'clean', 'clean', 'clean', 'clean', 'clean', 'clean'], opened: true, starred: false, introPending: true, fresh: true } },
  };
  journey(`${modeName[mode]} introduction, clean Round, progression and saved earnings`, seed, async page => {
    await button(page, 'Start').click();
    await button(page, modeName[mode]).click();
    assert.equal((await saved(page)).modes[mode].fresh, false);
    await page.getByRole('heading', { name: 'New money!' }).waitFor();
    await page.reload();
    await button(page, 'Start').click();
    assert.equal((await saved(page)).modes[mode].introPending, true);
    await button(page, modeName[mode]).click();
    await button(page, 'Play').click();
    for (let i = 0; i < 5; i++) await solve(page, mode);
    const state = await saved(page);
    assert.equal(state.bolts, 10);
    assert.equal(state.lastMode, mode);
    assert.equal(state.modes[mode].level, 3);
    assert.equal(state.modes[mode].introPending, true);
    assert.deepEqual(state.modes[mode].window, ['clean', 'clean', 'clean', 'clean']);
    if (mode === 'count') assert.equal(state.modes.pay.opened, true);
    await finishShow(page);
    assert.match((await page.locator('.reward .lines').innerText()), /You earned 6 Bolts!/);
    await page.reload();
    await button(page, 'Start').click();
    await page.locator('.home').waitFor();
    assert.deepEqual(await saved(page), state);
  });
}

async function missChoice(page: Page, mode: 'learn' | 'count') {
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

async function learnTask(page: Page) {
  return {
    prompt: await page.locator('main .ask h2').innerText(),
    money: (await page.locator('main .cap').allTextContents()).sort(),
    choices: (await page.locator('main .choice').allTextContents()).sort(),
  };
}

journey('Learn wrong answers teach, retry and replay the same task with fresh choices', { ...FRESH_EXPECTED, body: 'pickup', currentStreak: 3, bestStreak: 3 }, async page => {
  await button(page, 'Start').click();
  await button(page, 'Learn the Coins').click();
  const original = await learnTask(page);
  await missChoice(page, 'learn');
  assert.equal((await saved(page)).currentStreak, 0);
  assert.deepEqual((await saved(page)).modes.learn.window, []);
  await missChoice(page, 'learn');
  assert.ok(await page.locator('main .hint').count());
  await solve(page, 'learn');
  await solve(page, 'learn');
  assert.deepEqual(await learnTask(page), original);
  assert.equal(await page.locator('main .wrong, main .nope, main .hint').count(), 0);
  await missChoice(page, 'learn');
  await solve(page, 'learn');
  await solve(page, 'learn');
  await solve(page, 'learn');
  assert.deepEqual((await saved(page)).modes.learn.window, ['missed', 'clean', 'missed', 'clean', 'clean']);
  assert.equal((await saved(page)).bolts, 4);
  assert.equal((await saved(page)).roundsFinished, 1);
  await finishShow(page);
});

journey('Count peeks and counting help break the streak and earn only clean-answer Bolts', {
  ...JOURNEY_SAVES.practice,
  modes: {
    ...JOURNEY_SAVES.practice.modes,
    count: { ...JOURNEY_SAVES.practice.modes.count, window: ['clean', 'clean', 'clean', 'clean', 'clean', 'clean'] },
    pay: { ...FRESH_EXPECTED.modes.pay },
  },
}, async page => {
  await button(page, 'Start').click();
  await button(page, 'Count the Cash').click();
  await button(page, 'Say it again').click();
  await solve(page, 'count');
  await solve(page, 'count');
  for (let i = 0; i < 3; i++) {
    if (i === 1) {
      await page.getByRole('button', { name: /Help me count/ }).click();
      await page.locator('main .slot.lit').first().waitFor();
      await button(page, 'Start again').click();
      assert.equal(await page.locator('main .slot.lit').count(), 0);
    } else {
      await button(page, 'Show me all the money').click();
      await page.locator('.modal').getByRole('button', { name: 'Dime', exact: true }).click();
      await button(page, 'Done').click();
    }
    assert.equal((await saved(page)).currentStreak, 0);
    await solve(page, 'count');
  }
  assert.deepEqual((await saved(page)).modes.count.window, ['helped', 'helped', 'helped']);
  assert.equal((await saved(page)).modes.count.level, 2);
  assert.equal((await saved(page)).modes.pay.opened, true);
  assert.equal((await saved(page)).modes.pay.fresh, true);
  assert.equal((await saved(page)).bolts, 3);
  await finishShow(page);
});

journey('Leaving Count after solved answers and a miss keeps progress but earns no Round credit', JOURNEY_SAVES.practice, async page => {
  await button(page, 'Start').click();
  await button(page, 'Count the Cash').click();
  await solve(page, 'count');
  await solve(page, 'count');
  await missChoice(page, 'count');
  await button(page, 'Home').click();
  const state = await saved(page);
  assert.deepEqual(state.modes.count.window, ['clean', 'clean']);
  assert.equal(state.currentStreak, 0);
  assert.equal(state.bolts, 0);
  assert.equal(state.roundsFinished, 0);
  await page.reload();
  await button(page, 'Start').click();
  await page.locator('.home').waitFor();
  assert.deepEqual(await saved(page), state);
});

journey('Pay empty tray, help and explicit payment do not invent a clean answer', JOURNEY_SAVES.practice, async page => {
  await button(page, 'Start').click();
  await button(page, 'Pay the Shop').click();
  const before = await saved(page);
  await button(page, 'Pay').click();
  await page.getByText('Tap some money first!', { exact: true }).waitFor();
  assert.deepEqual(await saved(page), before);
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: /Help me pay/ }).click();
    await waitForAssertion(async () => assert.equal(await page.locator('.paidrow b').innerText(), await page.locator('.price').innerText()), 30000);
    assert.equal((await saved(page)).bolts, 0);
    await button(page, 'Pay').click();
    await page.locator('main .right').first().waitFor();
    await page.waitForFunction(() => document.querySelector('.reward') || !document.querySelector('main .right'));
  }
  assert.deepEqual((await saved(page)).modes.pay.window, ['helped', 'helped', 'helped', 'helped', 'helped']);
  assert.equal((await saved(page)).bolts, 1);
  await finishShow(page);
});

journey('Level-3 mastery earns a star and celebrates it before Trophies', JOURNEY_SAVES.star, async page => {
  await button(page, 'Start').click();
  await button(page, 'Learn the Coins').click();
  for (let i = 0; i < 5; i++) await solve(page, 'learn');
  assert.equal((await saved(page)).modes.learn.starred, true);
  assert.equal((await saved(page)).trophies['learn:star'], TODAY);
  await finishShow(page);
  const lines = await page.locator('.reward .lines > div').allTextContents();
  assert.ok(lines.indexOf('You are a Learn the Coins star!') > 0);
  assert.ok(lines.indexOf('You earned Learn the Coins Star!') > lines.indexOf('You are a Learn the Coins star!'));
});

journey('progressed save retains per-Body state on relaunch', PROGRESSED_EXPECTED, async page => {
  await button(page, 'Start').click();
  await page.locator('.home').waitFor();
  await button(page, 'Garage').click();
  assert.equal(await page.locator('.bodyname').innerText(), 'Jeep');
  await openSheet(page, 'Tires');
  assert.match(await button(page, 'Monster Treads').getAttribute('class') ?? '', /fitted/);
  await page.locator('.sheet').getByRole('button', { name: 'Close', exact: true }).click();
  await button(page, 'Big Foot').click();
  await openSheet(page, 'Door Number');
  assert.equal(await button(page, 'Pick your number').innerText(), '7');
  await page.locator('.sheet').getByRole('button', { name: 'Close', exact: true }).click();
  await button(page, 'Jeep').click();
  assert.deepEqual(await saved(page), PROGRESSED_EXPECTED);
  await page.reload();
  await button(page, 'Start').click();
  await page.locator('.home').waitFor();
  assert.deepEqual(await saved(page), PROGRESSED_EXPECTED);
});

async function openSheet(page: Page, name: string) {
  if (await page.locator('.sheet').count()) await page.locator('.sheet').getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator(`.hot[aria-label="${name}"]:not(.hidden)`).click();
  await page.locator('.sheet').waitFor();
}

journey('Bolt purchase commits once before celebration and reload renders the fitted Mod without replaying it', {
  ...FRESH_EXPECTED, body: 'pickup', bolts: 16, goal: 'tires:2',
}, async page => {
  await button(page, 'Start').click();
  await button(page, 'Garage').click();
  await openSheet(page, 'Tires');
  assert.match(await button(page, 'Giant').getAttribute('class') ?? '', /afford/);
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
  await button(page, 'Giant').click();
  await page.locator('.blocker').waitFor();
  const expected: Save = {
    ...FRESH_EXPECTED, body: 'pickup', bolts: 1, unlocked: ['tires:2'], goal: null,
    fitted: { ...FRESH_EXPECTED.fitted, pickup: { ...FRESH_EXPECTED.fitted.pickup, tires: 2 } },
  };
  assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('purchase-snapshots') ?? '[]')), [expected]);
  assert.deepEqual(await saved(page), expected);
  assert.equal(await page.locator('.garage-hud .pilebox > span').innerText(), '1');
  await page.reload();
  await button(page, 'Start').click();
  await button(page, 'Garage').click();
  await openSheet(page, 'Tires');
  assert.match(await button(page, 'Giant').getAttribute('class') ?? '', /fitted/);
  assert.equal(await page.locator('.blocker').count(), 0);
  assert.deepEqual(await saved(page), expected);
  assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('purchase-snapshots') ?? '[]')), [expected]);
});

journey('Garage purchases, free fits, Body memory, Door Numbers and each selected Goal kind', JOURNEY_SAVES.garage, async page => {
  await button(page, 'Start').click();
  await button(page, 'Garage').click();
  await openSheet(page, 'Tires');
  await button(page, 'Giant').click();
  await waitForAssertion(async () => {
    const state = await saved(page);
    assert.equal(state.bolts, 35);
    assert.ok(state.unlocked.includes('tires:2'));
    assert.equal(state.fitted.pickup.tires, 2);
    assert.equal(state.goal, null);
  });
  await page.locator('.blocker').waitFor({ state: 'hidden' });
  await button(page, 'Small').click();
  await button(page, 'Giant').click();
  assert.equal((await saved(page)).bolts, 35);
  assert.equal((await saved(page)).fitted.pickup.tires, 2);
  await openSheet(page, 'Paint');
  await button(page, 'Teal').click();
  await waitForAssertion(async () => {
    const state = await saved(page);
    assert.equal(state.bolts, 32);
    assert.deepEqual(state.colours, ['teal']);
    assert.equal(state.fitted.pickup.colour, 'teal');
    assert.equal(state.fitted.pickup.paint, 0);
  });
  await page.locator('.blocker').waitFor({ state: 'hidden' });
  await button(page, 'Red').click();
  await button(page, 'Teal').click();
  await page.locator('.sheet').getByRole('button', { name: 'Close', exact: true }).click();
  await button(page, 'Big Foot').click();
  await openSheet(page, 'Door Number');
  await button(page, 'Outlined').click();
  await button(page, 'Pick your number').click();
  await button(page, 'ones up').click();
  assert.equal((await saved(page)).fitted.bigfoot.doorNumber, 2);
  assert.equal((await saved(page)).bolts, 32);
  await page.locator('.sheet').getByRole('button', { name: 'Close', exact: true }).click();
  await button(page, 'Pickup').click();
  assert.equal((await saved(page)).fitted.pickup.doorNumber, 42);
  assert.equal((await saved(page)).fitted.pickup.colour, 'teal');
  await button(page, 'Fire Truck').click();
  await waitForAssertion(async () => {
    const state = await saved(page);
    assert.equal(state.bolts, 2);
    assert.equal(state.body, 'firetruck');
    assert.ok(state.ownedBodies.includes('firetruck'));
  });
  await page.locator('.blocker').waitFor({ state: 'hidden' });
  await button(page, 'Jeep').click();
  assert.equal((await saved(page)).goal, 'body:jeep');
  assert.equal(await page.locator('.goalchip .num').innerText(), '2/30');
  await openSheet(page, 'Tires');
  await button(page, 'Mega Spikes').click();
  assert.equal((await saved(page)).goal, 'tires:3');
  await openSheet(page, 'Paint');
  await button(page, 'Lime').click();
  assert.equal((await saved(page)).goal, 'colour:lime');
  assert.equal(await page.locator('.goalchip .num').innerText(), '2/3');
  await button(page, 'Goal').click();
  const state = await saved(page);
  await page.reload();
  await button(page, 'Start').click();
  await page.locator('.home').waitFor();
  assert.deepEqual(await saved(page), state);
});

for (const level of [2, 3] as const) {
  const seed = JOURNEY_SAVES[`checkout-${level}`];
  journey(`Legendary Level ${level} payment, help, close/reopen and no practice or Bolt effects`, seed, async page => {
    await button(page, 'Start').click();
    await button(page, 'Garage').click();
    await openSheet(page, level === 2 ? 'Tires' : 'Horn');
    const item = level === 2 ? 'Monster Treads' : 'Train Horn';
    await button(page, item).click();
    await page.locator('.checkout').waitFor();
    assert.equal(await page.locator('.price').innerText(), level === 2 ? '$1.10' : '$8.80');
    const before = await saved(page);
    if (level === 2) {
      await button(page, 'Pay').click();
      await page.getByText('Tap some money first!', { exact: true }).waitFor();
      for (let i = 0; i < 4; i++) await page.locator('.bank').getByRole('button', { name: 'Quarter', exact: true }).click();
      await button(page, 'Pay').click();
      await page.getByText('Almost! You need 10¢ more.', { exact: true }).waitFor();
      await page.locator('.bank').getByRole('button', { name: 'Dime', exact: true }).click();
      await page.locator('.bank').getByRole('button', { name: 'Dime', exact: true }).click();
      await button(page, 'Pay').click();
      await page.getByText('Too much! Take back 10¢.', { exact: true }).waitFor();
    } else {
      assert.equal(await page.locator('.bank').getByRole('button', { name: '$5 Bill', exact: true }).isVisible(), true);
      await page.getByRole('button', { name: /Help me pay/ }).click();
    }
    await waitForAssertion(async () => assert.equal(await page.locator('.paidrow b').innerText(), level === 2 ? '$1.10' : '$8.80'), 30000);
    assert.deepEqual(await saved(page), before);
    if (level === 3) assert.equal(await button(page, 'Take back $5 Bill').count(), 1);
    await page.locator('.checkout').getByRole('button', { name: 'Close', exact: true }).click();
    await button(page, item).click();
    assert.equal(await page.locator('.paidrow b').innerText(), '0¢');
    await page.getByRole('button', { name: /Help me pay/ }).click();
    await waitForAssertion(async () => assert.equal(await page.locator('.paidrow b').innerText(), level === 2 ? '$1.10' : '$8.80'), 30000);
    assert.deepEqual(await saved(page), before);
    await button(page, 'Pay').click();
    await page.locator('.checkout').waitFor({ state: 'hidden' });
    const slot = level === 2 ? 'tires' : 'horn';
    const after = await saved(page);
    assert.deepEqual(after, {
      ...before, unlocked: [...before.unlocked, `${slot}:4`],
      fitted: { ...before.fitted, pickup: { ...before.fitted.pickup, [slot]: 4 } },
    });
    await page.locator('.blocker').waitFor({ state: 'hidden' });
    assert.match(await button(page, item).getAttribute('class') ?? '', /fitted/);
  });
}

const selected = journeys.filter(j => !process.argv[2] || j.name.includes(process.argv[2]));
assert.ok(selected.length, 'No matching baseline journey');
const server = await preview({ preview: { host: '127.0.0.1', port: 4318, strictPort: true }, logLevel: 'silent' });
let browser;
try {
  browser = await chromium.launch();
  console.log(`Chromium ${browser.version()}; ${selected.length} baseline journeys`);
  for (const { name, seed, run } of selected) {
    console.log(`RUN ${name}`);
    const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1024, height: 768 }, timezoneId: 'UTC' });
    try {
      await context.addInitScript(({ seed, key }) => {
        if (!sessionStorage.getItem('baseline-seeded')) {
          if (seed !== null) localStorage.setItem(key, JSON.stringify(seed));
          sessionStorage.setItem('baseline-seeded', 'yes');
        }
        let random = 123456789;
        Math.random = () => { random = (1664525 * random + 1013904223) >>> 0; return random / 4294967296; };
      }, { seed, key: STORAGE_KEY });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.setFixedTime(new Date(NOW));
      await page.goto('http://127.0.0.1:4318/');
      await run(page);
      assert.deepEqual(errors, [], `${name}: browser errors`);
      console.log(`PASS ${name}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser?.close();
  await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
