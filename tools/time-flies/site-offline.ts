// Serves dist-site under /campbellcloud/ (as GitHub Pages does), opens the landing page, goes into Time Flies, lets its
// service worker warm up, then goes offline and relaunches both the landing page and Time Flies.
//   npm run build:site && npx tsx tools/time-flies/site-offline.ts
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = join(import.meta.dirname, '../../dist-site'), types: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.hdr': 'application/octet-stream', '.svg': 'image/svg+xml',
};
const server = createServer(async (req, res) => {
  let path = decodeURIComponent((req.url ?? '/').split('?')[0]!);
  if (!path.startsWith('/campbellcloud/')) { res.writeHead(404).end(); return; }
  path = normalize(path.slice('/campbellcloud'.length));
  if (path.endsWith('/')) path += 'index.html';
  try { const body = await readFile(join(root, path)); res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(5310);

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();
const problems: string[] = [];
page.on('pageerror', e => problems.push(e.message));
await page.goto('http://localhost:5310/campbellcloud/');
console.log('landing tiles:', await page.locator('a.game').count());
await page.evaluate(async () => { await navigator.serviceWorker.ready; });
await page.getByLabel('Time Flies').click();
await page.waitForURL('**/time-flies/');
await page.evaluate(async () => { await navigator.serviceWorker.ready; });
await page.waitForTimeout(8000); // precache 670 files
const cached = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async k => (await (await caches.open(k)).keys()).length))).reduce((a, b) => a + b, 0));
console.log('cached entries:', cached);
await context.setOffline(true);
await page.reload();
await page.getByLabel('Start').click({ timeout: 20000 });
await page.waitForTimeout(1500);
const onScreen = await page.locator('.picker-screen, .home-screen').count();
const voiceOk = await page.evaluate(async () => (await fetch('./voice/' + 'x').catch(() => null)) !== undefined);
console.log('offline Time Flies start ->', onScreen ? 'picker/home shown' : 'NOT SHOWN', voiceOk);
await page.goto('http://localhost:5310/campbellcloud/');
console.log('offline landing tiles:', await page.locator('a.game').count());
await page.goto('http://localhost:5310/campbellcloud/monster-truck-money/').catch(e => console.log('money offline (not yet visited):', e.message.split('\n')[0]));
console.log(problems.length ? `problems:\n${problems.join('\n')}` : 'no page errors');
await browser.close();
server.close();
