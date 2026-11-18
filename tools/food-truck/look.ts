// Screenshots of each Food Truck screen at one size, for a look while building (no checks): Start, Home, the Truck, the Spot card, the
// Service a few seconds in, and the Sticker Book. A save can be passed to see a later game.
//   npm run dev:food-truck   (in another shell)
//   npx tsx tools/food-truck/look.ts <url> <outDir> [width] [height]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [url = 'http://localhost:5179/', out = '/tmp/food-truck-look', w = '810', h = '1080'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1, hasTouch: true });
page.on('pageerror', e => console.log('pageerror', e.stack));
page.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
const tag = `${w}x${h}`;
const shot = (name: string) => page.screenshot({ path: `${out}/${tag}-${name}.png` });
await page.goto(url);
await page.waitForTimeout(1500);
await shot('start');
await page.getByLabel('Start').click();
await page.waitForTimeout(800);
await shot('home');
await page.getByRole('button', { name: 'Truck', exact: true }).click();
await page.waitForTimeout(800);
await shot('truck');
await page.getByRole('button', { name: 'Open', exact: true }).click();
await page.waitForTimeout(800);
await shot('spots');
await page.getByRole('button', { name: 'Open', exact: true }).click();
await page.waitForTimeout(4000);
await shot('service');
await page.waitForTimeout(8000);
await shot('service-hint');
await browser.close();
