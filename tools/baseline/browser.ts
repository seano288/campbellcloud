import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium, type Page } from 'playwright';
import { preview } from 'vite';
import type { Save } from '../../src/save/migrate';
import { CLIPS } from '../../src/voice/voice.gen';
import { FRESH_EXPECTED, JOURNEY_SAVES, NOW, PROGRESSED_EXPECTED, STORAGE_KEY, TODAY } from './saves';
import { observeRecordedVoice } from './voice';
import { fixtureScript } from './fixture';
import { presentationJourneys } from './presentationJourneys';
import { celebrationJourneys } from './celebrationJourneys';

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

async function recordPurchaseSnapshots(page: Page) {
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

const purchaseSnapshots = (page: Page): Promise<Save[]> =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('purchase-snapshots') ?? '[]'));

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
let explanationFixture = '';
let checkoutFixture = '';

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

journey('Garage presentation rejects detached fitting and navigation controls', JOURNEY_SAVES.garage, async page => {
  await button(page, 'Start').click();
  await button(page, 'Garage').click();
  const oldBody = await button(page, 'Next truck').elementHandle();
  const oldHome = await button(page, 'Home').elementHandle();
  const oldPlay = await button(page, 'Play').elementHandle();
  assert.ok(oldBody && oldHome && oldPlay);
  await button(page, 'Home').click();
  await button(page, 'Learn the Coins').click();
  const before = await saved(page);
  await oldBody.evaluate(element => element.dispatchEvent(new MouseEvent('click')));
  assert.deepEqual(await saved(page), before);
  await oldHome.evaluate(element => element.dispatchEvent(new MouseEvent('click')));
  assert.equal(await page.locator('.round-screen').isVisible(), true);
  const oldAnswer = await (await correctChoice(page, 'learn')).elementHandle();
  assert.ok(oldAnswer);
  await oldPlay.evaluate(element => element.dispatchEvent(new MouseEvent('click')));
  await oldAnswer.click();
  await page.locator('main .right').first().waitFor();
  assert.equal((await saved(page)).modes.learn.window.length, before.modes.learn.window.length + 1);
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

journey('Learn cancels a held explanation and detached answer before the replacement prompt', { ...FRESH_EXPECTED, body: 'pickup', currentStreak: 3, bestStreak: 3 }, async page => {
  const events = await observeRecordedVoice(page);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let requested = false;
  await page.route(`**/voice/${CLIPS['Try again!']}`, async route => { requested = true; await held; await route.continue(); });
  try {
    await button(page, 'Start').click();
    await page.evaluate(() => { Math.random = () => 0.5; });
    await button(page, 'Learn the Coins').click();
    const right = await correctChoice(page, 'learn'), oldAnswer = await right.elementHandle();
    assert.ok(oldAnswer);
    const answer = await right.innerText();
    for (const choice of await page.locator('main .choice').all()) {
      if (await choice.innerText() !== answer) { await choice.click(); break; }
    }
    await page.locator('main.thinking').waitFor();
    await waitForAssertion(async () => assert.equal(requested, true));
    const state = await saved(page);
    assert.equal(state.currentStreak, 0);
    assert.deepEqual(state.modes.learn.window, []);
    await button(page, 'Home').click();
    assert.equal(await page.locator('.toast.show').count(), 0, 'The old explanation must disappear when its problem ends');
    await button(page, 'Learn the Coins').click();
    await page.locator('main .choice.speaking').first().waitFor();
    const replacement = events.filter(e => e.kind === 'start').at(-1)!;
    await oldAnswer.evaluate(element => { if (element instanceof HTMLElement) element.click(); });
    release();
    await waitForAssertion(async () => assert.ok(events.some(e => e.kind === 'end' && e.id === replacement.id)));
    await sleep(3500);
    assert.equal(await page.locator('main.thinking, main .wrong, main .nope, main .hint, main .right').count(), 0);
    assert.equal(events.some(e => e.kind === 'stop' && e.id >= replacement.id), false);
    assert.deepEqual(await saved(page), state);
    await solve(page, 'learn');
    assert.deepEqual((await saved(page)).modes.learn.window, ['clean']);
    assert.equal((await saved(page)).bolts, 0);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

journey('Count shared teaching locks ignored choices and replays with fresh controls', JOURNEY_SAVES.practice, async page => {
  await button(page, 'Start').click();
  await button(page, 'Count the Cash').click();
  const original = await learnTask(page);
  const right = await correctChoice(page, 'count'), correct = await right.innerText();
  const wrong = await page.locator('main .choice').all();
  let firstWrong = '';
  for (const choice of wrong) {
    const text = await choice.innerText();
    if (text !== correct) { firstWrong = text; await choice.click(); break; }
  }
  await page.locator('main.thinking').waitFor();
  await right.click();
  for (const choice of wrong) {
    const text = await choice.innerText();
    if (text !== correct && text !== firstWrong) {
      await choice.click();
      assert.equal(await choice.isDisabled(), false);
      break;
    }
  }
  assert.equal(await page.locator('main .right').count(), 0);
  assert.equal(await page.locator('main .wrong').count(), 1);
  assert.deepEqual((await saved(page)).modes.count.window, []);
  await page.locator('main.thinking').waitFor({ state: 'hidden' });
  await missChoice(page, 'count');
  assert.equal(await page.locator('main .slot.lit').count(), await page.locator('main .slot').count());
  await solve(page, 'count');
  await solve(page, 'count');
  assert.deepEqual(await learnTask(page), original);
  assert.equal(await page.locator('main .wrong, main .slot.lit').count(), 0);
  await solve(page, 'count');
  assert.deepEqual((await saved(page)).modes.count.window, ['missed', 'clean', 'clean']);
  await button(page, 'Home').click();
  assert.equal((await saved(page)).bolts, 0);
});

journey('Pay shared short and over teaching retains controls and replays an empty tray', JOURNEY_SAVES.practice, async page => {
  await button(page, 'Start').click();
  await button(page, 'Pay the Shop').click();
  const original = { item: await page.locator('main .ask h2').innerText(), price: await page.locator('.price').innerText() };
  await page.locator('.bank').getByRole('button', { name: 'Penny', exact: true }).click();
  await button(page, 'Pay').click();
  await page.locator('main.thinking').waitFor();
  await page.getByText(/^Almost! You need/).waitFor();
  await button(page, 'Pay').click();
  await page.locator('.bank').getByRole('button', { name: 'Dime', exact: true }).click();
  assert.equal(await page.locator('.paidrow b').innerText(), '1¢');
  assert.equal(await page.locator('main .right').count(), 0);
  assert.deepEqual((await saved(page)).modes.pay.window, []);
  await page.locator('main.thinking').waitFor({ state: 'hidden' });
  await button(page, 'Take one back').click();
  await fillPayment(page);
  await page.locator('.bank').getByRole('button', { name: 'Penny', exact: true }).click();
  await button(page, 'Pay').click();
  await page.getByText(/^Too much! Take back/).waitFor();
  await page.locator('main.thinking').waitFor({ state: 'hidden', timeout: 30000 });
  assert.equal(await page.locator('.paidrow b').innerText(), original.price);
  assert.deepEqual((await saved(page)).modes.pay.window, []);
  await button(page, 'Pay').click();
  await page.locator('main .right').waitFor();
  await page.locator('main .right').waitFor({ state: 'hidden' });
  await solve(page, 'pay');
  assert.equal(await page.locator('main .ask h2').innerText(), original.item);
  assert.equal(await page.locator('.price').innerText(), original.price);
  assert.equal(await page.locator('.paidrow b').innerText(), '0¢');
  await solve(page, 'pay');
  assert.deepEqual((await saved(page)).modes.pay.window, ['missed', 'clean', 'clean']);
  await button(page, 'Home').click();
  assert.equal((await saved(page)).bolts, 0);
});

for (const mode of ['count', 'pay'] as const) {
  for (const failure of ['throw', 'reject'] as const) journey(`${modeName[mode]} shared explanation failure ${failure} releases the real controls for retry`, JOURNEY_SAVES.practice, async page => {
    await page.route('**/explanation-failure?*', route => route.fulfill({
      contentType: 'text/html',
      body: '<div id="fixture"></div><output id="explanation-failure"></output>',
    }));
    await page.goto(`http://127.0.0.1:4318/explanation-failure?mode=${mode}&failure=${failure}`);
    await page.addScriptTag({ content: explanationFixture });
    if (mode === 'pay') await page.locator('.bank').getByRole('button', { name: 'Penny', exact: true }).click();
    if (mode === 'count') {
      const answer = await (await correctChoice(page, mode)).innerText();
      for (const choice of await page.locator('main .choice').all()) {
        if (await choice.innerText() !== answer) { await choice.click(); break; }
      }
    } else await button(page, 'Pay').click();
    await page.locator('main.thinking').waitFor();
    assert.equal(await page.locator('#explanation-failure').innerText(), failure);
    assert.deepEqual((await saved(page)).modes[mode].window, []);
    assert.equal((await saved(page)).currentStreak, 0);
    await page.locator('main.thinking').waitFor({ state: 'hidden' });
    if (mode === 'pay') await button(page, 'Take one back').click();
    await solve(page, mode);
    assert.deepEqual((await saved(page)).modes[mode].window, ['missed']);
    await button(page, 'Home').click();
    assert.equal((await saved(page)).roundsFinished, 0);
    assert.equal((await saved(page)).bolts, 0);
  });

  journey(`${modeName[mode]} shared cancellation leaves held teaching and detached controls behind`, JOURNEY_SAVES.practice, async page => {
    const events = await observeRecordedVoice(page);
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    let requested = false;
    const clip = mode === 'count' ? 'Not quite!' : 'Almost!';
    await page.route(`**/voice/${CLIPS[clip]}`, async route => { requested = true; await held; await route.continue(); });
    try {
      await button(page, 'Start').click();
      await button(page, modeName[mode]).click();
      const oldAnswer = await (mode === 'count' ? await correctChoice(page, mode) : button(page, 'Pay')).elementHandle();
      const oldHelp = await page.getByRole('button', { name: mode === 'count' ? /Help me count/ : /Help me pay/ }).elementHandle();
      assert.ok(oldAnswer && oldHelp);
      if (mode === 'count') {
        const correct = await (await correctChoice(page, mode)).innerText();
        for (const choice of await page.locator('main .choice').all()) {
          if (await choice.innerText() !== correct) { await choice.click(); break; }
        }
      } else {
        await page.locator('.bank').getByRole('button', { name: 'Penny', exact: true }).click();
        await button(page, 'Pay').click();
      }
      await page.locator('main.thinking').waitFor();
      await waitForAssertion(async () => assert.equal(requested, true));
      await page.getByRole('button', { name: mode === 'count' ? /Help me count/ : /Help me pay/ }).click();
      const state = await saved(page);
      await button(page, 'Home').click();
      assert.equal(await page.locator('.toast.show').count(), 0);
      const starts = events.filter(e => e.kind === 'start').length;
      await button(page, modeName[mode]).click();
      await waitForAssertion(async () => assert.ok(events.filter(e => e.kind === 'start').length > starts));
      const replacement = events.filter(e => e.kind === 'start').at(-1)!;
      await oldAnswer.evaluate(element => { if (element instanceof HTMLElement) element.click(); });
      await oldHelp.evaluate(element => { if (element instanceof HTMLElement) element.click(); });
      release();
      await waitForAssertion(async () => assert.ok(events.some(e => e.kind === 'end' && e.id === replacement.id)));
      await sleep(3500);
      assert.equal(events.some(e => e.kind === 'stop' && e.id >= replacement.id), false);
      assert.equal(await page.locator('main.thinking, main .right, main .wrong, main .slot.lit, .tray .money-btn').count(), 0);
      assert.deepEqual(await saved(page), state);
      await solve(page, mode);
      assert.deepEqual((await saved(page)).modes[mode].window, ['clean']);
    } finally {
      release();
      await page.unrouteAll({ behavior: 'wait' });
    }
  });
}

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

journey('Leaving during the final success delay keeps five answers but no completion earnings', { ...FRESH_EXPECTED, body: 'pickup' }, async page => {
  await button(page, 'Start').click();
  await button(page, 'Learn the Coins').click();
  for (let i = 0; i < 4; i++) await solve(page, 'learn');
  await page.clock.install({ time: new Date(NOW) });
  await page.clock.pauseAt(new Date(Date.parse(NOW) + 1000));
  await (await correctChoice(page, 'learn')).click();
  await page.locator('main .right').first().waitFor();
  await page.clock.runFor(899);
  const answered = await saved(page);
  assert.deepEqual(answered.modes.learn.window, ['clean', 'clean', 'clean', 'clean', 'clean']);
  assert.equal(answered.currentStreak, 5);
  assert.equal(answered.bolts, 0);
  assert.equal(answered.roundsFinished, 0);
  await button(page, 'Home').click();
  await page.clock.runFor(5000);
  await page.locator('.home').waitFor();
  assert.equal(await page.locator('.reward').count(), 0);
  assert.deepEqual(await saved(page), answered);
  assert.deepEqual(answered.trophies, {});
  assert.equal(answered.daysPlayed, 0);
  await page.reload();
  await button(page, 'Start').click();
  await page.locator('.home').waitFor();
  assert.deepEqual(await saved(page), answered);
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
  await recordPurchaseSnapshots(page);
  await button(page, 'Giant').click();
  await page.locator('.blocker').waitFor();
  const expected: Save = {
    ...FRESH_EXPECTED, body: 'pickup', bolts: 1, unlocked: ['tires:2'], goal: null,
    fitted: { ...FRESH_EXPECTED.fitted, pickup: { ...FRESH_EXPECTED.fitted.pickup, tires: 2 } },
  };
  assert.deepEqual(await purchaseSnapshots(page), [expected]);
  assert.deepEqual(await saved(page), expected);
  assert.equal(await page.locator('.garage-hud .pilebox > span').innerText(), '1');
  await page.reload();
  await button(page, 'Start').click();
  await button(page, 'Garage').click();
  await openSheet(page, 'Tires');
  assert.match(await button(page, 'Giant').getAttribute('class') ?? '', /fitted/);
  assert.equal(await page.locator('.blocker').count(), 0);
  assert.deepEqual(await saved(page), expected);
  assert.deepEqual(await purchaseSnapshots(page), [expected]);
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
    const latePay = await button(page, 'Pay').elementHandle();
    assert.ok(latePay);
    await page.locator('.checkout').getByRole('button', { name: 'Close', exact: true }).click();
    await button(page, item).click();
    await latePay.evaluate(element => { if (element instanceof HTMLElement) element.click(); });
    assert.equal(await page.locator('.checkout').count(), 1);
    assert.equal(await page.locator('.paidrow b').innerText(), '0¢');
    assert.deepEqual(await saved(page), before);
    assert.equal(await page.locator('.blocker').count(), 0);
    await page.getByRole('button', { name: /Help me pay/ }).click();
    await waitForAssertion(async () => assert.equal(await page.locator('.paidrow b').innerText(), level === 2 ? '$1.10' : '$8.80'), 30000);
    assert.deepEqual(await saved(page), before);
    await recordPurchaseSnapshots(page);
    await button(page, 'Pay').click();
    await page.locator('.checkout').waitFor({ state: 'hidden' });
    const slot = level === 2 ? 'tires' : 'horn';
    const after = await saved(page);
    const expected: Save = {
      ...before, unlocked: [...before.unlocked, `${slot}:4`],
      fitted: { ...before.fitted, pickup: { ...before.fitted.pickup, [slot]: 4 } },
    };
    assert.deepEqual(after, expected);
    assert.deepEqual(await purchaseSnapshots(page), [expected]);
    await page.locator('.blocker').waitFor({ state: 'hidden' });
    assert.match(await button(page, item).getAttribute('class') ?? '', /fitted/);
    await page.reload();
    await button(page, 'Start').click();
    await button(page, 'Garage').click();
    await openSheet(page, level === 2 ? 'Tires' : 'Horn');
    assert.match(await button(page, item).getAttribute('class') ?? '', /fitted/);
    assert.equal(await page.locator('.checkout').count(), 0);
    assert.equal(await page.locator('.blocker').count(), 0);
    assert.deepEqual(await saved(page), expected);
    assert.deepEqual(await purchaseSnapshots(page), [expected]);
  });
}

journey('Scoped recorded voice appends, interrupts, highlights and leaves counting help behind', {
  ...JOURNEY_SAVES.practice,
  modes: { ...JOURNEY_SAVES.practice.modes, count: { ...JOURNEY_SAVES.practice.modes.count, fresh: true } },
}, async page => {
  const events = await observeRecordedVoice(page);
  await button(page, 'Start').click();
  await waitForAssertion(async () => assert.equal(events.filter(e => e.kind === 'start').length, 2));
  const opening = events.filter(e => e.kind === 'start');
  assert.ok(opening.every(e => e.running && e.audible && e.duration > 0.1));
  assert.ok(events.some(e => e.kind === 'end' && e.id === opening[0]!.id));
  assert.equal(events.some(e => e.kind === 'stop'), false);
  await button(page, 'Count the Cash').click();
  await page.locator('main .choice.speaking').first().waitFor();
  const prompted = events.filter(e => e.kind === 'start').at(-1)!;
  await button(page, 'Say it again').click();
  await waitForAssertion(async () => assert.ok(events.some(e => e.kind === 'stop' && e.id === prompted.id)));
  await button(page, 'Show me all the money').click();
  await page.locator('.modal').getByRole('button', { name: 'Dime', exact: true }).click();
  await page.locator('.modal .speaking').waitFor();
  await button(page, 'Done').click();
  await page.locator('main .choice.speaking').first().waitFor();
  await page.getByRole('button', { name: /Help me count/ }).click();
  await page.locator('main .slot.lit').first().waitFor();
  await button(page, 'Home').click();
  const state = await saved(page);
  assert.deepEqual(state.modes.count.window, []);
  assert.equal(state.roundsFinished, 0);
  assert.equal(state.bolts, 0);
  const starts = events.filter(e => e.kind === 'start').length;
  await button(page, 'Garage').click();
  await waitForAssertion(async () => assert.ok(events.filter(e => e.kind === 'start').length > starts));
  await sleep(2500);
  assert.equal(events.filter(e => e.kind === 'start').length, starts + 1);
  assert.equal(await page.locator('.speaking').count(), 0);
  assert.deepEqual(await saved(page), state);
});

journey('Scoped recorded voice cancels pending checkout teaching before a replacement prompt', JOURNEY_SAVES['checkout-2'], async page => {
  const events = await observeRecordedVoice(page);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let requested = false;
  await page.route(`**/voice/${CLIPS['Almost!']}`, async route => { requested = true; await held; await route.continue(); });
  try {
    await button(page, 'Start').click();
    await button(page, 'Garage').click();
    await openSheet(page, 'Tires');
    await button(page, 'Monster Treads').click();
    const state = await saved(page);
    await page.locator('.bank').getByRole('button', { name: 'Penny', exact: true }).click();
    await button(page, 'Pay').click();
    await waitForAssertion(async () => assert.equal(requested, true));
    await button(page, 'Pay').click();
    await page.locator('.checkout').getByRole('button', { name: 'Close', exact: true }).click();
    const starts = events.filter(e => e.kind === 'start').length;
    await button(page, 'Monster Treads').click();
    await waitForAssertion(async () => assert.ok(events.filter(e => e.kind === 'start').length > starts));
    const replacement = events.filter(e => e.kind === 'start').at(-1)!;
    release();
    await waitForAssertion(async () => assert.ok(events.some(e => e.kind === 'end' && e.id === replacement.id)));
    await sleep(3500);
    assert.equal(await page.locator('.paidrow b').innerText(), '0¢');
    assert.equal(events.some(e => e.kind === 'stop' && e.id >= replacement.id), false);
    assert.equal(events.filter(e => e.kind === 'start' && e.id >= replacement.id).length, 3);
    assert.deepEqual(await saved(page), state);
    assert.equal(await page.locator('.blocker').count(), 0);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

for (const failure of ['throw', 'reject', 'late-resolve', 'late-reject'] as const) {
  journey(`Legendary scoped explanation failure ${failure} leaves real controls usable and replacement work isolated`, JOURNEY_SAVES['checkout-2'], async page => {
    await page.route('**/checkout-failure?*', route => route.fulfill({
      contentType: 'text/html',
      body: '<div id="fixture"></div><output id="explanation-failure"></output><output id="checkout-paid"></output>',
    }));
    await page.goto(`http://127.0.0.1:4318/checkout-failure?failure=${failure}`);
    await page.addScriptTag({ content: checkoutFixture });
    const before = await saved(page);
    await page.locator('.bank').getByRole('button', { name: 'Penny', exact: true }).click();
    await button(page, 'Pay').click();
    assert.equal(await page.locator('#explanation-failure').innerText(), failure);
    assert.equal(await page.locator('main.thinking').count(), 0);
    assert.deepEqual(await saved(page), before);
    if (failure.startsWith('late')) {
      await button(page, 'Pay').click();
      const oldPay = await button(page, 'Pay').elementHandle();
      const oldHelp = await page.getByRole('button', { name: /Help me pay/ }).elementHandle();
      assert.ok(oldPay && oldHelp);
      await button(page, 'Replace checkout').click();
      await button(page, 'Release teaching').click();
      await oldPay.evaluate(element => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await oldHelp.evaluate(element => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await sleep(2000);
      assert.equal(await page.locator('.paidrow b').innerText(), '0¢');
      assert.deepEqual(await saved(page), before);
    } else {
      await button(page, 'Take one back').click();
      assert.equal(await page.locator('.paidrow b').innerText(), '0¢');
    }
    await button(page, 'Use context 3').click();
    const changed = await saved(page);
    assert.equal(changed.modes.pay.level, 3);
    assert.equal(await page.locator('.price').innerText(), '$1.10');
    assert.equal(await page.locator('.bank').getByRole('button', { name: '$5 Bill', exact: true }).count(), 0);
    await page.getByRole('button', { name: /Help me pay/ }).click();
    await waitForAssertion(async () => assert.equal(await page.locator('.paidrow b').innerText(), '$1.10'), 30000);
    assert.deepEqual(await saved(page), changed);
    assert.equal(await page.locator('#checkout-paid').innerText(), '');
    await button(page, 'Pay').click();
    await waitForAssertion(async () => assert.equal(await page.locator('#checkout-paid').innerText(), 'completed'));
    assert.deepEqual(await saved(page), {
      ...changed, unlocked: [...changed.unlocked, 'tires:4'],
      fitted: { ...changed.fitted, [changed.body!]: { ...changed.fitted[changed.body!], tires: 4 } },
    });
  });
}

journey('Legendary Level 1 help edits, peek and navigation cancel teaching without a practice gate', {
  ...JOURNEY_SAVES['checkout-2'],
  modes: { ...JOURNEY_SAVES['checkout-2'].modes, pay: { ...FRESH_EXPECTED.modes.pay, opened: false, window: ['missed', 'missed', 'missed'] } },
}, async page => {
  const events = await observeRecordedVoice(page);
  await button(page, 'Start').click();
  await button(page, 'Garage').click();
  await openSheet(page, 'Tires');
  await button(page, 'Monster Treads').click();
  const before = await saved(page);
  assert.equal(await page.locator('.price').innerText(), '35¢');
  assert.deepEqual(await page.locator('.bank button').allTextContents().then(names => names.map(text => text.trim())), [
    'Dime · 10¢', 'Nickel · 5¢', 'Penny · 1¢',
  ]);
  await page.locator('.bank').getByRole('button', { name: 'Penny', exact: true }).click();
  await button(page, 'Pay').click();
  await page.getByText('Almost! You need 34¢ more.', { exact: true }).waitFor();
  await sleep(2500);
  assert.equal(await page.locator('.paidrow b').innerText(), '1¢');
  await page.getByRole('button', { name: /Help me pay/ }).click();
  await waitForAssertion(async () => assert.ok(await button(page, 'Take back Dime').count()));
  await page.locator('.bank').getByRole('button', { name: 'Penny', exact: true }).click();
  const edited = await page.locator('.paidrow b').innerText();
  await sleep(2000);
  assert.equal(await page.locator('.paidrow b').innerText(), edited);
  await page.getByRole('button', { name: /Help me pay/ }).click();
  const beforePeek = events.at(-1)?.id ?? 0;
  await button(page, 'Show me all the money').click();
  assert.equal(await page.locator('.intro-money button').count(), 3);
  await waitForAssertion(async () => assert.ok(events.some(event =>
    event.kind === 'start' && event.id > beforePeek && event.audible && event.running &&
    events.some(end => end.kind === 'end' && end.id === event.id) &&
    !events.some(stop => stop.kind === 'stop' && stop.id === event.id),
  )));
  await Promise.all([
    page.locator('.intro-money .speaking').waitFor(),
    page.locator('.intro-money').getByRole('button', { name: 'Nickel', exact: true }).click(),
  ]);
  await button(page, 'Done').click();
  const peeked = await page.locator('.paidrow b').innerText();
  await sleep(2000);
  assert.equal(await page.locator('.paidrow b').innerText(), peeked);
  assert.deepEqual(await saved(page), before);
  const oldPay = await button(page, 'Pay').elementHandle();
  const oldHelp = await page.getByRole('button', { name: /Help me pay/ }).elementHandle();
  assert.ok(oldPay && oldHelp);
  await button(page, 'Home').dispatchEvent('click');
  await page.locator('.home').waitFor();
  const starts = events.filter(event => event.kind === 'start').length;
  await oldPay.evaluate(element => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await oldHelp.evaluate(element => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(2000);
  assert.equal(events.filter(event => event.kind === 'start').length, starts);
  await button(page, 'Garage').click();
  await openSheet(page, 'Tires');
  await button(page, 'Monster Treads').click();
  assert.equal(await page.locator('.paidrow b').innerText(), '0¢');
  assert.deepEqual(await saved(page), before);
});

journeys.push(...presentationJourneys);
journeys.push(...celebrationJourneys);
const selected = journeys.filter(j => !process.argv[2] || j.name.includes(process.argv[2]));
assert.ok(selected.length, 'No matching baseline journey');

if (selected.some(j => j.name.includes('shared explanation failure'))) explanationFixture = await fixtureScript(new URL('./explanationFailure.tsx', import.meta.url));
if (selected.some(j => j.name.includes('scoped explanation failure'))) checkoutFixture = await fixtureScript(new URL('./checkoutFailure.tsx', import.meta.url));
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
