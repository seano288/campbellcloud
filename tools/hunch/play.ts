// Serves dist-site under /campbellcloud/ (as GitHub Pages does), opens Hunch from the landing page and plays two words:
// one lost by typing on the real keyboard, one won by tapping the on-screen keys. Screenshots go to /tmp/hunch-*.png.
//   npm run build:site && npx tsx tools/hunch/play.ts
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium, type Page } from 'playwright';

const root = join(import.meta.dirname, '../../dist-site'), types: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
};
const server = createServer(async (req, res) => {
  let path = decodeURIComponent((req.url ?? '/').split('?')[0]!);
  if (!path.startsWith('/campbellcloud/')) { res.writeHead(404).end(); return; }
  path = normalize(path.slice('/campbellcloud'.length));
  if (path.endsWith('/')) path += 'index.html';
  try { const body = await readFile(join(root, path)); res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(5311);

const fail = (why: string) => { console.error(`FAIL: ${why}`); process.exitCode = 1; };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
const problems: string[] = [];
page.on('pageerror', e => problems.push(e.message));

await page.goto('http://localhost:5311/campbellcloud/');
const sections = await page.locator('section h2').allTextContents();
console.log('landing sections:', sections.join(' | '));
if (sections.join() !== 'Learning Games,Just for Fun') fail('landing sections');
await page.screenshot({ path: '/tmp/hunch-landing.png' });

await page.getByLabel('Hunch').click();
await page.waitForURL('**/hunch/');
await page.locator('.sheet').waitFor(); // first visit shows How to play
await page.screenshot({ path: '/tmp/hunch-help.png' });
await page.keyboard.press('Escape');

const setAnswer = async (answer: string) => {
  await page.evaluate(a => {
    const save = JSON.parse(localStorage.getItem('hunch-save') ?? '{}');
    localStorage.setItem('hunch-save', JSON.stringify({ ...save, answer: a, guesses: [] }));
  }, answer);
  await page.reload();
  await page.keyboard.press('Escape');
};
const rowText = (p: Page, r: number) => p.locator('.row').nth(r).locator('.tile').allTextContents().then(t => t.join(''));
const rowMarks = (p: Page, r: number) => p.locator('.board .row').nth(r).locator('.tile').evaluateAll(ts => ts.map(t => (t.className.match(/correct|present|absent/) ?? ['-'])[0]![0]).join(''));

// Word one: rejected guesses, then six misses.
await setAnswer('crane');
await page.keyboard.type('abc');
await page.keyboard.press('Enter');
if (!(await page.getByText('Not enough letters').count())) fail('short guess toast');
await page.keyboard.press('Backspace'); await page.keyboard.press('Backspace'); await page.keyboard.press('Backspace');
await page.keyboard.type('qzxvj');
await page.keyboard.press('Enter');
if (!(await page.getByText('Not in word list').count())) fail('unknown word toast');
for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace');
for (const guess of ['slate', 'pious', 'dumpy', 'fight', 'below', 'wacky']) {
  await page.keyboard.type(guess);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1800);
}
console.log('row 1:', await rowText(page, 0), await rowMarks(page, 0));
if (await rowMarks(page, 0) !== 'aacac') fail('slate vs crane marks');
await page.locator('.numbers').waitFor({ timeout: 5000 });
await page.screenshot({ path: '/tmp/hunch-lost.png' });
await page.getByRole('button', { name: 'New word ↻' }).last().click();

// Word two: won on the second guess with on-screen keys.
await setAnswer('those');
const tap = async (word: string) => { for (const k of word) await page.locator(`.key[data-key="${k}"]`).click(); await page.locator('.key[data-key="enter"]').click(); await page.waitForTimeout(1800); };
await tap('geese');
console.log('geese vs those:', await rowMarks(page, 0));
if (await rowMarks(page, 0) !== 'aaacc') fail('doubled letter marks');
await tap('those');
await page.locator('.numbers').waitFor({ timeout: 5000 });
const stats = await page.locator('.numbers strong').allTextContents();
console.log('stats played/win%/streak/max:', stats.join('/'));
if (stats.join('/') !== '2/50/1/1') fail('stats');
await page.screenshot({ path: '/tmp/hunch-won.png' });
await page.keyboard.press('Escape');

const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await phone.goto('http://localhost:5311/campbellcloud/hunch/');
await phone.keyboard.press('Escape');
await phone.screenshot({ path: '/tmp/hunch-phone.png' });
await phone.goto('http://localhost:5311/campbellcloud/');
await phone.screenshot({ path: '/tmp/hunch-landing-phone.png', fullPage: true });

console.log(problems.length ? `problems:\n${problems.join('\n')}` : 'no page errors');
if (problems.length) process.exitCode = 1;
await browser.close();
server.close();
