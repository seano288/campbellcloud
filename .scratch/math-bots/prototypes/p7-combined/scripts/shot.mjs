// usage: node scripts/shot.mjs <name> <seconds> [query]   Headed real-GPU Chromium, 1600x900.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/seancampbell/.t3/worktrees/campbellcloud/t3-579a7c1d/node_modules/playwright');
const list = process.argv.slice(2);
const b = await chromium.launch({ headless: false, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('console', m => { const t = m.text(); if (m.type() === 'error' || /warn/i.test(m.type())) console.log('[' + m.type() + ']', t.slice(0, 400)); });
p.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 500)));
const base = process.env.BASE || 'http://localhost:5197/dist/';
const extra = process.env.Q ? '&' + process.env.Q : '';
for (let i = 0; i < list.length; i += 2) {
  const [name, sec] = [list[i], list[i + 1]];
  await p.goto(`${base}?shot=${sec}${extra}`, { waitUntil: "commit", timeout: 90000 });
  try { await p.waitForFunction(() => window.__ready || window.__error, { timeout: 110000 }); } catch (e) { console.log('timeout'); }
  const err = await p.evaluate(() => window.__error); if (err) { console.log('ERR', err.slice(0, 900)); break; }
  await p.screenshot({ path: process.env.OUT ? `${process.env.OUT}/${name}.png` : `shots/${name}.png` });
  console.log(name, JSON.stringify(await p.evaluate(() => window.__stats)));
}
await b.close();
