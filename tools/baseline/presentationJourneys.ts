import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { fixtureScript } from './fixture';

export const presentationJourneys: { name: string; seed: null; run(page: Page): Promise<void> }[] = [];
const journey = (name: string, run: (page: Page) => Promise<void>) => { presentationJourneys.push({ name: `presentation: ${name}`, seed: null, run }); };
const scripts = new Map<string, Promise<string>>();

async function present(page: Page, fixture: 'presentation' | 'alternativePresentation' | 'completionPresentation') {
  let script = scripts.get(fixture);
  if (!script) { script = fixtureScript(new URL(`./${fixture}.tsx`, import.meta.url)); scripts.set(fixture, script); }
  const content = await script;
  await page.setContent('<div id="fixture"></div>');
  await page.addScriptTag({ content });
  return content;
}

journey('renders live optional setup and only completes after confirmation', async page => {
  await present(page, 'presentation');
  await page.getByRole('button', { name: 'Big Foot', exact: true }).click();
  assert.equal(await page.locator('#selected-body').textContent(), 'none');
  await page.getByRole('button', { name: 'Choose', exact: true }).click();
  await page.locator('.tile').waitFor();
  assert.equal(await page.locator('#selected-body').textContent(), 'bigfoot');
  assert.equal(await page.locator('.picker-screen').count(), 0);
  await page.getByRole('button', { name: 'Reset setup', exact: true }).click();
  await page.locator('.picker-screen').waitFor();
  assert.equal(await page.locator('#selected-body').textContent(), 'none');
});

journey('assembles a non-Garage entry with no setup or Goal and a typed non-money Round view', async page => {
  const alternative = await present(page, 'alternativePresentation');
  await page.getByRole('button', { name: 'Collection', exact: true }).waitFor({ timeout: 1000 });
  assert.equal(await page.locator('.picker-screen, .goalchip').count(), 0);
  assert.equal(await page.locator('#balance').textContent(), '7');
  await page.getByRole('button', { name: 'Begin clocks', exact: true }).click();
  assert.equal(await page.locator('#acknowledged').textContent(), '1');
  assert.equal(await page.locator('main button').textContent(), 'Read the clock');
  await page.getByRole('button', { name: 'Collection', exact: true }).click();
  assert.equal(await page.locator('h1').textContent(), 'Collection opened');
  assert.equal(await page.locator('#balance').textContent(), '7');
  assert.ok(!alternative.includes('Monster Treads'));
  assert.ok(!alternative.includes('Pay the Shop'));
});

journey('does not retain a preview or accept detached controls from a replaced setup', async page => {
  await present(page, 'presentation');
  await page.getByRole('button', { name: 'Big Foot', exact: true }).click();
  const oldChoose = await page.getByRole('button', { name: 'Choose', exact: true }).elementHandle();
  const oldCard = await page.getByRole('button', { name: 'Pickup', exact: true }).elementHandle();
  await page.getByRole('button', { name: 'Replace setup', exact: true }).click();
  assert.ok(oldChoose && oldCard);
  assert.equal(await page.getByRole('button', { name: 'Choose', exact: true }).isDisabled(), true);
  await oldChoose.evaluate(element => element.dispatchEvent(new MouseEvent('click')));
  await oldCard.evaluate(element => element.dispatchEvent(new MouseEvent('click')));
  assert.equal(await page.locator('#selected-body').textContent(), 'none');
  assert.equal(await page.getByRole('button', { name: 'Choose', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: 'Pickup', exact: true }).click();
  await page.getByRole('button', { name: 'Choose', exact: true }).click();
  assert.equal(await page.locator('#selected-body').textContent(), 'pickup');
});

journey('does not acknowledge or navigate through an introduction left on another screen', async page => {
  await present(page, 'alternativePresentation');
  const oldGo = await page.getByRole('button', { name: 'Begin clocks', exact: true }).elementHandle();
  await page.getByRole('button', { name: 'Leave introduction', exact: true }).click();
  assert.ok(oldGo);
  await oldGo.evaluate(element => element.dispatchEvent(new MouseEvent('click')));
  assert.equal(await page.locator('#acknowledged').textContent(), '0');
  assert.equal(await page.locator('h1').textContent(), 'Collection opened');
});

journey('renders and speaks current Goal choices, Colour fallback, Legendary context and completion', async page => {
  await present(page, 'presentation');
  const goal = page.getByRole('button', { name: 'Goal', exact: true });
  await goal.waitFor({ timeout: 1000 });
  assert.equal(await goal.textContent(), '0/5');
  await goal.click();
  await page.waitForFunction(() => document.querySelector('#spoken')?.textContent === 'Chunky|You need 5 more Bolts.');
  await page.getByRole('button', { name: 'Choose Teal Goal', exact: true }).click();
  assert.equal(await goal.textContent(), '0/3');
  await goal.click();
  await page.waitForFunction(() => document.querySelector('#spoken')?.textContent?.endsWith('Teal|You need 3 more Bolts.'));
  await page.getByRole('button', { name: 'Only Colours left', exact: true }).click();
  assert.match(await goal.locator('.dab').getAttribute('style') ?? '', /rgb\(255, 123, 28\)/);
  await page.getByRole('button', { name: 'All Bolt items owned', exact: true }).click();
  assert.equal(await goal.textContent(), '35¢');
  assert.equal(await goal.locator('.track').count(), 0);
  await page.getByRole('button', { name: 'Use context 3', exact: true }).click();
  assert.equal(await goal.textContent(), '$3.35');
  await goal.click();
  await page.waitForFunction(() => document.querySelector('#spoken')?.textContent?.endsWith('Monster Treads costs|3 dollars|35 cents'));
  await page.getByRole('button', { name: 'Everything owned', exact: true }).click();
  assert.match(await goal.getAttribute('class') ?? '', /done/);
  await goal.click();
  await page.waitForFunction(() => document.querySelector('#spoken')?.textContent?.endsWith('You built everything!'));
});

journey('places the real Trophy Shelf independently of purchases without awarding or redating on render', async page => {
  await present(page, 'presentation');
  const snapshot = () => page.locator('#saved-state').textContent();
  const before = await snapshot();
  await page.getByRole('button', { name: 'Show Trophies', exact: true }).click();
  assert.equal(await page.locator('.plank').count(), 3);
  assert.equal(await page.locator('.plank').nth(0).locator('button').count(), 9);
  assert.equal(await page.locator('.plank').nth(1).locator('button').count(), 2);
  assert.equal(await page.locator('.plank').nth(2).locator('button').count(), 2);
  assert.equal(await page.locator('.shelf-trophy.earned').count(), 2);
  assert.equal(await page.locator('.shelf-trophy:not(.earned) svg path').first().getAttribute('stroke'), '#4b5160');
  assert.equal(await snapshot(), before);
  await page.getByRole('button', { name: 'Upgrade streak', exact: true }).click();
  const streak = page.locator('.plank').nth(1).locator('button').first();
  assert.equal(await streak.locator('.pips .on').count(), 3);
  assert.equal(await streak.locator('.tt').textContent(), '20');
  assert.equal(await streak.locator('svg path').first().getAttribute('stroke'), '#ffd23f');
  const upgraded = await snapshot();
  assert.deepEqual(JSON.parse(upgraded!).trophies, {
    'learn:2': '2026-09-01', 'streak:5': '2026-09-02', 'streak:10': '2026-09-03', 'streak:20': '2026-10-15',
  });
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Show Trophies', exact: true }).click();
  assert.equal(await snapshot(), upgraded);
  assert.equal(await page.locator('.shelf-trophy').count(), 13);
});

journey('renders and re-shows committed balances without earning, granting or awarding and pulses for current affordability', async page => {
  await present(page, 'completionPresentation');
  await page.locator('.reward').waitFor();
  assert.equal(await page.locator('.bigpile span').textContent(), '5');
  assert.equal(await page.locator('#newly-affordable').textContent(), 'false');
  const snapshot = () => page.locator('#saved-state').textContent();
  const before = await page.locator('#before-state').textContent();
  assert.equal(await snapshot(), before);
  await page.locator('.reward .btns:not(.asleep)').waitFor();
  assert.equal(await page.locator('.bigpile span').textContent(), '11');
  assert.match(await page.getByRole('button', { name: 'Garage', exact: true }).getAttribute('class') ?? '', /pulse/);
  assert.ok(!(await page.locator('.lines').textContent())?.includes('You can build something new!'));
  assert.equal(await snapshot(), before);
  await page.getByRole('button', { name: 'Buy Orange', exact: true }).click();
  await page.getByRole('button', { name: 'Buy Yellow', exact: true }).click();
  assert.doesNotMatch(await page.getByRole('button', { name: 'Garage', exact: true }).getAttribute('class') ?? '', /pulse/);
  const spent = await snapshot();
  await page.getByRole('button', { name: 'Toggle show', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle show', exact: true }).click();
  assert.equal(await page.locator('.bigpile span').textContent(), '5');
  assert.equal(await snapshot(), spent);
});
