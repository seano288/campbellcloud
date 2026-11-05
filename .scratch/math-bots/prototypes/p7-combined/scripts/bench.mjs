// usage: node scripts/bench.mjs "<query>" <seconds> [width height]   Reports realtime fps on a real GPU.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/seancampbell/.t3/worktrees/campbellcloud/t3-579a7c1d/node_modules/playwright');
const [query, secs = '20', w = '1600', h = '900'] = process.argv.slice(2);
const b = await chromium.launch({ headless: false, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 240)); });
await p.goto(`${process.env.BASE || 'http://localhost:5197/p7-combined/dist/'}?bench&t=${process.env.START || 0}&${query}`);
await p.waitForFunction(() => window.__ready || window.__error, { timeout: 150000 });
const e = await p.evaluate(() => window.__error);
if (e) { console.log('ERR', e.slice(0, 600)); await b.close(); process.exit(1); }
await p.waitForFunction(() => document.getElementById('hud').textContent.includes('fps'), { timeout: 120000 });
await p.waitForTimeout(+secs * 1000);
await p.evaluate(() => window.__finish());
const r = await p.evaluate(() => window.__bench);
console.log(query.padEnd(24), 'max', r.maxMs?.toFixed(0), 'over50ms', r.over50, 'p99', r.p99Ms?.toFixed(1), 'phys', r.physMs?.toFixed(2), 'load', r.loadMs?.toFixed(0), r.backend, `${r.res[0]}x${r.res[1]}`, 'n', r.frames, 'fps', r.avgFps?.toFixed(1), 'med', r.medMs?.toFixed(1), 'p10', r.p10Ms?.toFixed(1), 'p95', r.p95Ms?.toFixed(1), 'draws', r.draws, 'tris', r.tris, errs.length ? 'errs:' + [...new Set(errs)].slice(0, 2).join(' | ') : '');
await b.close();
