// Screenshots the built landing page (dist-site/index.html) at an iPad and a phone width, to judge Dino Dig's tile beside the others.
//   npm run build:site && npx tsx tools/dino-dig/landing-shot.ts <outDir>
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const out = process.argv[2] ?? 'landing-shots';
const html = readFileSync('dist-site/index.html', 'utf8');
const browser = await chromium.launch();
for (const [name, viewport] of [['ipad', { width: 810, height: 1080 }], ['phone', { width: 390, height: 844 }]] as const) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: `${out}/landing-${name}.png`, fullPage: true });
  await page.close();
}
await browser.close();
