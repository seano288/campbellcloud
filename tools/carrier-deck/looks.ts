// Screenshots of the Mission's jobs on a built-up ship, for the design pass: a save with a long deck, every part, a few aircraft and
// Fleet ships, flown up to Mission N (MISSION=4 is the first drop, 5 the first winch, 6 at night). Flies with no finger.
//   npm run dev:carrier-deck   (in another shell)
//   MISSION=5 npx tsx tools/carrier-deck/looks.ts <url> <outDir>
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { FOR_SALE } from '../../src/carrier-deck/ship/catalog';

const [url = 'http://localhost:5189/', out = '/tmp/carrier-deck-looks'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const N = Number(process.env.MISSION ?? 5), VIEW = process.env.TOUR_VIEW === 'side' ? { width: 844, height: 390 } : { width: 1080, height: 810 };
const records = Object.fromEntries(Array.from({ length: N - 1 }, (_, i) => [i + 1, { flown: 1, bestGrade: 2, bestStars: 2 }]));
const save = { version: 1, balance: 500, learning: {}, ship: { owned: FOR_SALE.filter(i => i.cat !== 'aircraft' || ['air:rescue', 'air:cargo', 'air:display'].includes(i.id)).map(i => i.id), more: { hull: 4, bay: 0, yard: 3 }, yard: [1, 2, 3], flying: 'display', records, missions: 2, hullPaint: 'hull:navy', flag: 'flag:rainbow', mark: 'mark:gold' } };
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: VIEW, hasTouch: true });
await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('carrier-deck-save', JSON.stringify(s)); localStorage.removeItem('carrier-deck-place'); } }, save);
await page.goto(url);
await page.getByLabel('Start').click({ timeout: 30000 });
await page.getByRole('button', { name: 'Carrier', exact: true }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/m${N}-carrier.png` });
for (const v of ['Top', 'Inside']) { await page.getByRole('button', { name: v, exact: true }).click(); await page.waitForTimeout(600); await page.screenshot({ path: `${out}/m${N}-carrier-${v.toLowerCase()}.png` }); }
await page.getByRole('button', { name: 'Fly', exact: true }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/m${N}-card.png` });
await page.getByRole('button', { name: 'Go', exact: true }).click();
for (const [i, s] of [3, 9, 6, 6, 6, 6, 6, 6].entries()) { await page.waitForTimeout(s * 1000); await page.screenshot({ path: `${out}/m${N}-fly-${i}.png` }); if (await page.locator('.ms-result').count()) break; }
await page.getByRole('button', { name: 'Carrier', exact: true }).click().catch(() => {});
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Watch the deck', exact: true }).click().catch(() => {});
await page.waitForTimeout(7000);
await page.screenshot({ path: `${out}/m${N}-watch.png` });
await browser.close();
