// Live page check: UI is on top, Again restarts with a new seed, FIRE registers, a full programme ends with the caption.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/seancampbell/.t3/worktrees/campbellcloud/t3-579a7c1d/node_modules/playwright');
const b = await chromium.launch({ headless: false, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU'] });
const p = await b.newPage({ viewport: { width: 1180, height: 820 } }), errs = [];
p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
await p.goto('http://localhost:5197/p7-combined/dist/?seed=7'); await p.waitForFunction(() => window.__ready, { timeout: 120000 });
await p.waitForTimeout(4500);
const hit = await p.evaluate(() => ['replay', 'fire'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.id; }));
console.log('top element at buttons', hit);
await p.click('#fire'); console.log('fire queued', await p.evaluate(() => __dbg.fight().chargeRequested || __dbg.fight().pilot));
await p.click('#replay'); await p.waitForTimeout(400); console.log('seed after Again', await p.evaluate(() => __dbg.seed()), 'fight t', await p.evaluate(() => +__dbg.fight().t.toFixed(2)));
await p.reload(); await p.waitForFunction(() => window.__ready, { timeout: 120000 }); await p.waitForTimeout(19500);
console.log('caption', JSON.stringify(await p.evaluate(() => [document.getElementById('ko').innerText, document.getElementById('ko').className, document.getElementById('tag').innerText, document.getElementById('hud').innerText])));
await p.screenshot({ path: 'shots/10-live-ui.png' }); console.log('errors', errs); await b.close();
