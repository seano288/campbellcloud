// Plays through Time Flies in a headless browser and screenshots each screen, for checking the look:
//   npx tsx tools/time-flies/tour.ts <url> <outDir>
import { chromium, type Page } from 'playwright';

const [url = 'http://localhost:5200/', out = '/tmp/tour'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 });
const errors: string[] = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let n = 0;
const shot = async (name: string) => { await page.screenshot({ path: `${out}/${String(n++).padStart(2, '0')}-${name}.png`, timeout: 180000 }); };
const wait = (ms: number) => page.waitForTimeout(ms);

async function answerFind(page: Page) {
  const target = (await page.locator('.ask h2').textContent())!.replace('Find ', '');
  await page.locator(`.clock-btn[data-time="${target}"]`).click();
}

await page.goto(url);
await wait(800); await shot('start');
await page.getByLabel('Start').click({ timeout: 120000 }); await wait(1200); await shot('picker');
await page.locator('.body-card').nth(1).click(); await wait(400);
await page.getByLabel('That one').click({ timeout: 120000 }); await wait(1000); await shot('home');
await page.getByLabel('Play').click({ timeout: 120000 }); await wait(1500); await shot('question');
for (let k = 0; k < 5; k++) { await answerFind(page); await wait(k === 4 ? 1200 : 2200); }
await wait(5000); await shot('round-done');
await page.getByLabel('Hangar').first().click({ timeout: 120000 }); await wait(7000); await shot('hangar');
await page.getByLabel('Paint').click({ timeout: 120000 }); await wait(1500); await shot('paint-sheet');
await page.getByLabel('Close').click({ timeout: 120000 }); await wait(600);
await page.getByLabel('Weapons').click({ timeout: 120000 }); await wait(1500); await shot('weapons-sheet');
await page.getByLabel('Close').click({ timeout: 120000 }); await wait(600);
await page.getByLabel('Take Off').click({ timeout: 120000 }); await wait(2500); await shot('take-off');
const guns = page.getByLabel('Guns'); // shown once it's up in the clouds
await guns.waitFor({ timeout: 120000 }); await shot('in-the-air');
await guns.hover(); await page.mouse.down(); await wait(1500); await shot('guns'); await page.mouse.up();
await page.getByLabel('Missiles').click({ timeout: 120000 }); await wait(1500); await shot('missiles');
await page.getByLabel('Land').click({ timeout: 120000 }); await wait(4000); await shot('landing');
await page.getByLabel('Home').click({ timeout: 120000 }); await wait(800); await shot('home-after');
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors');
await browser.close();
