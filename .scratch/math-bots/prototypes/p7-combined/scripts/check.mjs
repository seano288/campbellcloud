import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/seancampbell/.t3/worktrees/campbellcloud/t3-579a7c1d/node_modules/playwright');
const b = await chromium.launch({ headless: false, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU'] });
const p = await b.newPage({ viewport: { width: 1180, height: 820 } });
await p.goto('http://localhost:5197/p7-combined/dist/?shot=20.5&seed=7'); await p.waitForFunction(() => window.__ready || window.__error, { timeout: 120000 });
console.log(await p.evaluate(() => { const d = __dbg, A = d.atlasA, T = d.atlasT, f = d.fight(), out = { ko: f.koT, patchesA: A.patches.length, patchesT: T.patches.length, kb: Math.round([...A.patches, ...T.patches].reduce((n, q) => n + (q.d?.o.byteLength ?? 0) + (q.s?.o.byteLength ?? 0), 0) / 1024) };
  const sc = f.scars.filter(s => s.bot), one = []; A.clear(); for (const s of sc) A.add(s); let frames = 0, worst = 0; while (A.queue.length || A.gen) { const a = performance.now(); A.pump(1.5); worst = Math.max(worst, performance.now() - a); frames++; }
  out.framesToStampAll = frames; out.worstPumpMs = +worst.toFixed(2); const a = performance.now(); A.seek(99); const b = performance.now(); A.seek(0); A.seek(99); out.seekForwardMs = +(b - a).toFixed(2); out.rewindMs = +(performance.now() - b).toFixed(2); return JSON.stringify(out); }));
const q = await b.newPage({ viewport: { width: 1600, height: 900 } });
await q.goto('http://localhost:5197/none', { waitUntil: 'commit' });
await q.evaluate(() => { document.documentElement.innerHTML = '<body style="margin:0;background:#000"><video id=v src="/p7-combined/shots/clip.webm" muted style="width:100vw;height:100vh"></video></body>'; return new Promise(r => { document.getElementById('v').onloadedmetadata = r; }); });
for (const [n, t] of [['c1', 19.2], ['c2', 28]]) { await q.evaluate(t => new Promise(r => { const v = document.getElementById('v'); v.onseeked = () => r(); v.currentTime = t; }), t); await q.waitForTimeout(300); await q.screenshot({ path: `/private/tmp/claude-501/-Users-seancampbell--t3-worktrees-campbellcloud-t3-579a7c1d/2c8d5d7b-c0e9-4da9-8452-66f8dcfa7542/scratchpad/${n}.png` }); }
console.log(await q.evaluate(() => document.getElementById('v').duration));
await b.close();
