import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/seancampbell/.t3/worktrees/campbellcloud/t3-579a7c1d/node_modules/playwright');
const url = 'http://localhost:5197/p7-combined/dist/?shot=15.3&seed=7';
const b = await chromium.launch({ headless: false, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU'] });
const p = await b.newPage({ viewport: { width: 1180, height: 820 } }), reqs = new Set(), bad = [];
p.on('request', r => reqs.add(new URL(r.url()).host)); p.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) bad.push(r.status() + ' ' + r.url()); });
await p.goto(url); await p.waitForFunction(() => window.__ready || window.__error, { timeout: 120000 });
console.log('chromium hosts', [...reqs], 'failed', bad, await p.evaluate(() => JSON.stringify({ err: window.__error ?? null, ko: window.__stats?.ko, why: window.__stats?.why, tier: window.__stats?.tier })));
await b.close();
const w = await webkit.launch({ headless: false });
const q = await w.newPage({ viewport: { width: 1180, height: 820 } }); q.on('pageerror', e => console.log('[webkit pageerror]', e.message.slice(0, 300)));
q.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) console.log('[webkit err]', m.text().slice(0, 300)); });
await q.goto(url); try { await q.waitForFunction(() => window.__ready || window.__error, { timeout: 150000 }); } catch { console.log('webkit timeout'); }
console.log('webkit', await q.evaluate(() => JSON.stringify({ ua: navigator.userAgent.slice(-40), gpu: !!navigator.gpu, err: window.__error ?? null, backend: window.__stats?.backend, tier: window.__stats?.tier, ko: window.__stats?.ko, tris: window.__stats?.tris })));
await q.screenshot({ path: 'shots/09-webkit-check.png' }); await w.close();
