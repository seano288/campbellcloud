// Screenshots of Read the Clock, Set the Clock (with a drag), a Level 3 introduction card, a miss with teaching, and the
// Time Lock vault, from a seeded save:  npx tsx tools/time-flies/tour-modes.ts <url> <outDir>
import { chromium } from 'playwright';

const [url = 'http://localhost:5200/', out = '/tmp/tour'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
const errors: string[] = [];
page.on('pageerror', e => errors.push(e.message));
let n = 20;
const shot = async (name: string) => { await page.screenshot({ path: `${out}/${n++}-${name}.png`, timeout: 180000 }); };
const wait = (ms: number) => page.waitForTimeout(ms);
const mode = (level: number, extra = {}) => ({ level, window: [], opened: true, starred: false, introPending: false, fresh: false, ...extra });
const seed = (modes: object) => page.evaluate(m => localStorage.setItem('time-flies-save', JSON.stringify({
  version: 1, bolts: 80, learning: { modes: m, lastMode: 'find' },
  hangar: { jet: 'f14', unlocked: ['weapons:1', 'weapons:2', 'weapons:3', 'paint:1', 'paint:2', 'paint:3'], fitted: { f14: { paint: 3, weapons: 3 } } },
})), modes);

await page.goto(url);
await seed({ find: mode(3), read: mode(2), set: mode(3, { introPending: true }) });
await page.reload();
await page.getByLabel('Start').click(); await wait(800);
await page.getByLabel('Read the Clock').click(); await wait(6000); await shot('read');
await page.locator('.choice').first().click(); await wait(400);
const wrong = await page.locator('.choice.wrong').count();
if (wrong) { await wait(9000); await shot('read-miss'); }
await page.getByLabel('Home').first().click(); await wait(600);
await page.getByLabel('Set the Clock').click(); await wait(9000); await shot('intro-l3');
await page.locator('.intro-card .big-btn').click({ force: true, timeout: 60000 }); await wait(2500);
const box = (await page.locator('.big-clock .clock').boundingBox())!;
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
await page.mouse.move(cx, cy - box.height * 0.38); await page.mouse.down();
for (let a = 0; a <= 120; a += 10) { const r = (a * Math.PI) / 180; await page.mouse.move(cx + Math.sin(r) * box.height * 0.38, cy - Math.cos(r) * box.height * 0.38); }
await page.mouse.up(); await wait(1500); await shot('set-dragged');
await page.getByLabel('Done').click(); await wait(6000); await shot('set-checked');
await page.getByLabel('Home').first().click(); await wait(600);
await page.getByLabel('Hangar').first().click({ timeout: 120000 }); await wait(6000); await shot('hangar-f14');
await page.getByLabel('Weapons').click({ timeout: 120000 }); await wait(2500);
await page.getByLabel('Firework Rockets').click({ timeout: 120000 }); await wait(5000); await shot('vault');
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors');
await browser.close();
