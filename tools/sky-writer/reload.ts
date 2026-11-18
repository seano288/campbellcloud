// A Round resumes after a reload: answer the first question (meeting a Family), reload the page as the iPad might, tap Start, and the
// Round carries on from the second answer, not from the start.
//   npm run dev:sky-writer   (in another shell)
//   npx tsx tools/sky-writer/reload.ts <url>
import { chromium } from 'playwright';

const [url = 'http://localhost:5183/'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: 810, height: 1080 } })).newPage();
const problems: string[] = [];
page.on('pageerror', e => problems.push(e.message));
await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.removeItem('sky-writer-save'); localStorage.removeItem('sky-writer-place'); } });
await page.goto(url);
await page.getByLabel('Start').click();
await page.getByRole('button', { name: 'Play', exact: true }).click();
// the meeting says its letters first; Go works once it has
await page.locator('.game.sw.k-meet[data-ready="yes"]').waitFor({ timeout: 60000 });
await page.getByRole('button', { name: 'Go', exact: true }).click();
await page.waitForTimeout(2500);
const before = await page.evaluate(() => JSON.parse(localStorage.getItem('sky-writer-place') ?? '{}'));
await page.reload();
await page.getByLabel('Start').click();
await page.waitForTimeout(2500);
const stars = await page.locator('.stars').getAttribute('aria-label');
const onRound = await page.locator('.round-screen').count();
if (!before.round || before.round.results.length !== 1) problems.push(`the place didn't keep the Round: ${JSON.stringify(before)}`);
if (!onRound) problems.push('a reload did not come back to the Round');
if (!stars?.startsWith('1 of 5')) problems.push(`the Round restarted instead of carrying on: ${stars}`);
console.log(`after reload: ${stars}`);
await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'reload: no problems');
process.exitCode = problems.length ? 1 : 0;
