// Screenshots of a Level 3 introduction card, a mixed Round's questions (a miss with teaching, and a drag when Set the
// Clock comes up), and the Time Lock vault, from a seeded save:  npx tsx tools/time-flies/tour-modes.ts <url> <outDir>
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
  version: 1, bolts: 80, learning: { modes: m },
  hangar: { jet: 'f14', unlocked: ['weapons:1', 'weapons:2', 'weapons:3', 'paint:1', 'paint:2', 'paint:3'], fitted: { f14: { paint: 3, weapons: 3 } } },
})), modes);

await page.goto(url);
await seed({ find: mode(3), read: mode(2), set: mode(3, { introPending: true }) });
await page.reload();
await page.getByLabel('Start').click(); await wait(800);
await page.getByLabel('Play').click(); await wait(9000); await shot('intro-l3');
await page.locator('.intro-card .big-btn').click({ force: true, timeout: 60000 }); await wait(4000);
for (let q = 0; q < 6; q++) {
  const kind = (await page.locator('.game').getAttribute('class'))!.replace('game', '').trim() || 'find';
  await shot(`q${q}-${kind}`);
  if (kind === 'set') {
    const box = (await page.locator('.big-clock .clock').boundingBox())!;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy - box.height * 0.38); await page.mouse.down();
    for (let a = 0; a <= 120; a += 10) { const r = (a * Math.PI) / 180; await page.mouse.move(cx + Math.sin(r) * box.height * 0.38, cy - Math.cos(r) * box.height * 0.38); }
    await page.mouse.up(); await wait(1500); await shot(`q${q}-set-dragged`);
    await page.getByLabel('Done').click(); await wait(6000); await shot(`q${q}-set-checked`);
  } else {
    await page.locator('.choice, .clock-btn').first().click(); await wait(9000); await shot(`q${q}-answered`);
  }
  if (await page.locator('.reward').count()) break;
}
if (!(await page.locator('.reward').count())) { await page.getByLabel('Home').first().click(); await wait(600); }
else { await page.getByLabel('Home').last().click({ timeout: 60000 }); await wait(600); }
await page.getByLabel('Hangar').first().click({ timeout: 120000 }); await wait(6000); await shot('hangar-f14');
await page.getByLabel('Weapons').click({ timeout: 120000 }); await wait(2500);
await page.getByLabel('Firework Rockets').click({ timeout: 120000 }); await wait(5000); await shot('vault');
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors');
await browser.close();
