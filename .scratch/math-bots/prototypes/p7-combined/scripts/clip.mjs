// Deterministic 30 fps capture: step, render, screenshot, pipe to Playwright's bundled ffmpeg (VP9).
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { homedir } from 'os';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/seancampbell/.t3/worktrees/campbellcloud/t3-579a7c1d/node_modules/playwright');
const [out, secs = '30', query = ''] = process.argv.slice(2);
const ff = spawn(`${homedir()}/Library/Caches/ms-playwright/ffmpeg-1013/ffmpeg-mac`, ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', 'pipe:0', '-an', '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-deadline', 'realtime', '-cpu-used', '6', '-row-mt', '1', '-threads', '4', out], { stdio: ['pipe', 'ignore', 'inherit'] });
let dead = false; ff.on('close', c => { dead = true; if (c) { console.error('ffmpeg exited', c); process.exit(1); } });
const b = await chromium.launch({ headless: false, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto(`${process.env.BASE}?record&${query}`, { waitUntil: 'commit', timeout: 90000 });
await p.waitForFunction(() => window.__frame || window.__error, { timeout: 200000 });
const n = Math.round(+secs * 30);
for (let i = 0; i < n; i++) { await p.evaluate(() => window.__frame()); const j = await p.screenshot({ type: 'jpeg', quality: 88 }); if (!ff.stdin.write(j)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 150 === 0) console.log('frame', i); }
ff.stdin.end(); await new Promise(r => { if (dead) r(); else ff.on('close', r); }); await b.close(); console.log('done');
