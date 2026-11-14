// Visits the rover tabs at the Space Base as a child would, with screenshots: picks and buys a rover, switches gadgets on and off,
// tries on a Kit gadget, taps a gadget he hasn't found yet, then takes the new rover on a trip and plants the flag (with Fireworks).
//   npm run dev:rover-code   (in another shell)
//   npx tsx tools/rover-code/garage-tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen, as in tour.ts.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [url = 'http://localhost:5198/', out = '/tmp/rover-code-garage'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const save = {
  version: 1, balance: 140,
  base: {
    owned: ['nose:cone', 'body:can', 'fins:little', 'engine:puff', 'paint:white', 'rover:scout', 'kit:fireworks', 'engine:twin'],
    rocket: { nose: 'cone', body: 'can', fins: 'little', engine: 'twin', paint: 'white' },
    launches: 2, trips: 3, visits: { moon: 1, mars: 1 }, gadgets: ['antenna', 'wheels'], destination: null,
  },
};

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true });
page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('rover-code-place');
  localStorage.setItem('rover-code-save', JSON.stringify(s));
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${viewName}-${name}.png` }); };
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect();
      if (!r.width || el.closest('.rc-tray')) continue; // the tray scrolls
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`off screen: ${el.getAttribute('aria-label') ?? el.className}`);
      if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
}
const tap = async (label: string) => { await page.getByRole('button', { name: label, exact: true }).first().click(); await page.waitForTimeout(900); };
const base = () => page.evaluate(() => JSON.parse(localStorage.getItem('rover-code-save') ?? '{}').base);

await page.goto(url);
await page.getByLabel('Start').click({ timeout: 30000 });
await page.waitForTimeout(800);
await tap('Space Base');
await page.waitForTimeout(800);
await page.getByRole('tab', { name: 'Rover' }).click();
await page.waitForTimeout(900);
await shot('rovers');
await tap('Monster Truck');
await shot('rovers-trying-monster');
await tap('Buy');
await page.waitForTimeout(2500);
if ((await base()).rover !== 'monster') problems.push('the Monster Truck was not bought and driven');
await shot('rovers-bought-monster');
await page.getByRole('tab', { name: 'Gadgets' }).click();
await page.waitForTimeout(900);
await shot('gadgets');
await tap('Antenna');
if ((await base()).off?.monster?.includes('antenna') !== true) problems.push('the Antenna did not come off the Monster Truck');
await tap('Spoiler');
await shot('gadgets-antenna-off-trying-spoiler');
await tap('Put it back');
await tap('Crystal Magnet'); // not found yet
await shot('gadgets-magnet-locked');

await page.getByRole('button', { name: /^Launch to/ }).click();
await page.waitForTimeout(800);
await tap('Launch');
await page.waitForSelector('.trip-screen.drive', { timeout: 60000 }).catch(() => problems.push('the flight never landed'));
await page.waitForTimeout(1500);
const forward = page.getByRole('button', { name: 'Forward' });
for (let i = 0; i < 60 && !(await page.getByRole('button', { name: 'Plant your flag' }).count()); i++) {
  const fb = (await forward.boundingBox())!;
  await page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  if (i % 3 === 1) await page.keyboard.press(' ');
  if (i === 4) await shot('trip-monster-jump');
  await page.mouse.up();
}
if (await page.getByRole('button', { name: 'Plant your flag' }).count()) {
  await page.getByRole('button', { name: 'Plant your flag' }).click();
  await page.waitForTimeout(1300);
  await shot('trip-fireworks');
  await page.waitForTimeout(2500);
  await shot('trip-result');
} else problems.push('never reached the flag');

console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
