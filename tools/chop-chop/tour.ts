// Plays through Chop Chop in a headless browser and screenshots each screen, for checking the look:
//   npx tsx tools/chop-chop/tour.ts <url> <outDir> [rounds]     (LEVEL=2 or 3 starts with every kind open at that Level)
// It answers by looking: a part he's asked to colour is worked out from the words; anything else it taps until one is right.
import { chromium, type Page } from 'playwright';

const [url = 'http://localhost:5201/', out = '/tmp/chop-tour', rounds = '1'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 });
const errors: string[] = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let n = 0;
const shot = async (name: string) => { await page.screenshot({ path: `${out}/${String(n++).padStart(2, '0')}-${name}.png`, timeout: 180000 }); };
const wait = (ms: number) => page.waitForTimeout(ms);

const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, half: 2, third: 3, thirds: 3, quarter: 4, quarters: 4, sixth: 6, sixths: 6, eighth: 8, eighths: 8 };
async function answer(page: Page, q: number) {
  const ask = (await page.locator('.ask h2').textContent()) ?? '';
  if (await page.locator('.fraction.tappable').count()) { // Color the Part: colour n/d of the pieces
    const [, a, b] = /Color (\w+) (\w+)/.exec(ask) ?? [];
    const pieces = await page.locator('.fraction.tappable .piece').count(), k = (WORDS[a!]! * pieces) / WORDS[b!]!;
    for (let i = 0; i < k; i++) await page.locator('.fraction.tappable .piece').nth(i).click({ force: true });
    await shot(`q${q}-colored`);
    await page.getByLabel('Done').click();
    return;
  }
  const buttons = page.locator('.pic-btn:not([disabled]), .choices .choice:not([disabled])');
  for (let tries = 0; tries < 4; tries++) {
    await buttons.first().click({ timeout: 30000 });
    await wait(400);
    if (await page.locator('.right').count()) return;
    await page.waitForFunction(() => !document.querySelector('.card.thinking'), null, { timeout: 60000 }).catch(() => {});
    await wait(300);
  }
}

const level = Number(process.env.LEVEL ?? 0);
if (level) await page.addInitScript(l => { // a save with every kind of question open at one Level
  if (localStorage.getItem('chop-chop-save')) return;
  const mode = { level: l, window: [], opened: true, starred: false, introPending: false, fresh: false };
  const modes = Object.fromEntries(['fair', 'name', 'bigger', 'find', 'color', 'share'].map(m => [m, mode]));
  localStorage.setItem('chop-chop-save', JSON.stringify({ version: 1, bolts: 40, learning: { modes } }));
}, level);
await page.goto(url);
await wait(800); await shot('start');
await page.getByLabel('Start').click({ timeout: 120000 }); await wait(1200); await shot('picker');
await page.locator('.body-card').nth(0).click(); await wait(400);
await page.getByLabel('That one').click({ timeout: 120000 }); await wait(1000); await shot('home');
for (let r = 0; r < Number(rounds); r++) {
  await page.getByLabel(r ? 'Play again' : 'Play').first().click({ timeout: 120000 }); await wait(1500);
  for (let k = 0; k < 5; k++) {
    await shot(`r${r}-q${k}`);
    await answer(page, k);
    await wait(2600);
  }
  await wait(5000); await shot(`r${r}-done`);
}
await page.getByLabel('Helipad').first().click({ timeout: 120000 }); await wait(7000); await shot('helipad');
await page.getByLabel('Rotor').click({ timeout: 120000 }); await wait(1800); await shot('rotor-sheet');
await page.getByLabel('Close').click({ timeout: 120000 }); await wait(600);
await page.getByLabel('Lift Off').click({ timeout: 120000 }); await wait(3500); await shot('lift-off');
const gun = page.getByLabel('Gun');
await gun.waitFor({ timeout: 120000 }); await shot('in-the-air');
await gun.hover(); await page.mouse.down(); await wait(1200); await shot('gun'); await page.mouse.up();
await page.getByLabel('Land').click({ timeout: 120000 }); await wait(5000); await shot('landing');
await wait(4000); await shot('landed');
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors');
await browser.close();
