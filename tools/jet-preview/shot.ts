// Screenshots of the preview: npx tsx tools/jet-preview/shot.ts out.png "jet=f16&paint=3" [more queries...]
import { chromium } from 'playwright';

const [out, ...queries] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text()); });
page.on('pageerror', e => console.log('pageerror:', e.message));
let i = 0;
for (const q of queries) {
  await page.goto(`http://localhost:5199/?${q}`);
  await page.waitForTimeout(Number(process.env.WAIT ?? 6000));
  const file = queries.length > 1 ? out!.replace('.png', `-${i++}.png`) : out!;
  await page.screenshot({ path: file });
  console.log(file);
}
await browser.close();
