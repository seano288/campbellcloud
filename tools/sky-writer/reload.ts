// A Round resumes after a reload: answer the first question (meeting a Family), reload the page as the iPad might, tap Start, and the
// Round carries on from the second answer, not from the start. Then the reward: a reload during a Show's rings costs and pays nothing,
// and one in Free Sky (after the rings) leaves the Show used and paid exactly once.
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

// a reload in the middle of the reward: during the Show's rings it lands at the Airfield with the Show still his (nothing used or paid);
// in Free Sky, after the rings, the Show was used and paid once, and a second reload pays nothing more
const save = { version: 1, balance: 10, learning: {}, airfield: { shows: 2, opened: 1, flown: [], done: 0, owned: [], fitted: {}, off: [], postcards: [] } };
const ctx2 = await browser.newContext({ viewport: { width: 1080, height: 810 }, hasTouch: true }), p2 = await ctx2.newPage();
p2.on('pageerror', e => problems.push(`reward: ${e.message}`));
await p2.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('sky-writer-save', JSON.stringify(s)); localStorage.removeItem('sky-writer-place'); } }, save);
const saved = () => p2.evaluate(() => JSON.parse(localStorage.getItem('sky-writer-save') ?? '{}'));
const show = () => p2.evaluate(() => (window as any).__show?.());
await p2.goto(url);
await p2.getByLabel('Start').click();
await p2.getByRole('button', { name: 'Show', exact: true }).first().click();
await p2.getByRole('button', { name: 'Take off' }).click();
await p2.waitForTimeout(5000);
await p2.reload();
await p2.getByLabel('Start').click();
await p2.waitForTimeout(1500);
let a = (await saved()).airfield;
if (!(await p2.locator('.af-screen').count())) problems.push('a reload during a Show did not land at the Airfield');
if (a.shows !== 2 || a.done !== 0 || (await saved()).balance !== 10) problems.push(`a reload during a Show used or paid it: ${JSON.stringify({ shows: a.shows, done: a.done })}`);
// fly it to Free Sky doing nothing (it can't be failed), then reload twice
await p2.getByRole('button', { name: 'Show', exact: true }).first().click();
await p2.getByRole('button', { name: 'Take off' }).click();
for (let i = 0; i < 120 && (await show())?.phase !== 'free'; i++) await p2.waitForTimeout(500);
if ((await show())?.phase !== 'free') problems.push('doing nothing, the Show never reached Free Sky');
for (let i = 0; i < 2; i++) { await p2.reload(); await p2.getByLabel('Start').click(); await p2.waitForTimeout(1200); }
a = (await saved()).airfield;
if (a.shows !== 1 || a.done !== 1 || (await saved()).balance !== 12) problems.push(`a Show's end was not counted and paid exactly once across reloads: ${JSON.stringify({ shows: a.shows, done: a.done, balance: (await saved()).balance })}`);
console.log(`reward reloads: ${a.shows} Show left, ${a.done} flown, ${(await saved()).balance} Bolts`);
await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'reload: no problems');
process.exitCode = problems.length ? 1 : 0;
