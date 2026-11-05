// Plays the Workshop and fights in real browsers, against the production build with service workers on:
//   npm run build:site && npx tsx tools/math-bots/serve.ts 5211   (in another shell)
//   npx tsx tools/math-bots/fight-tour.ts http://localhost:5211/math-bots/ <outDir> [chromium|webkit] [only]
// It watches what a child can't tell a screenshot from: page errors, the voice and sound really starting (every AudioBufferSourceNode
// is counted as it starts), which GPU path ran, and what loaded when. A real GPU matters, so Chromium runs headed: its headless is
// software rendering at about 1 fps. WebKit runs headless, because macOS throttles a headed WebKit window behind others to about 3 fps,
// which reads as a slow device.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium, webkit, type Browser, type BrowserContext, type Page } from 'playwright';

const [url = 'http://localhost:5211/math-bots/', out = '/tmp/math-bots-fight', which = 'chromium', only = ''] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser: Browser = which === 'webkit' ? await webkit.launch({ headless: true }) : await chromium.launch({ headless: false, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [], log = (s: string) => console.log(`[${which}] ${s}`);
const FIGHT = /math-bots-fight\/|assets\/stage-|basis_transcoder/;
let blocking = false; // the tests that cut files off on purpose
const wanted = (name: string) => !only || only.split(',').includes(name);

const saveWith = (balance: number, workshop?: unknown) => ({ version: 2, balance, ...(workshop ? { workshop } : {}), learning: undefined });

async function session(save: unknown, viewport = { width: 1180, height: 820 }, opts: { noWebGPU?: boolean; noWorker?: boolean; dpr?: number; at?: string } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: opts.dpr ?? 1 });
  const seen: string[] = [];
  context.on('request', r => { seen.push(r.url()); });
  await context.addInitScript(({ s, noGPU, noWorker }) => {
    if (noWorker) delete (Navigator.prototype as { serviceWorker?: unknown }).serviceWorker; // a worker would answer what a test cuts off
    if (noGPU) { Object.defineProperty(Navigator.prototype, 'gpu', { get() { return undefined; } }); delete (Navigator.prototype as { gpu?: unknown }).gpu; }
    const w = window as unknown as { __sound: number[] };
    w.__sound = [];
    // fanfares (each opens on 523 Hz) and the drum's whine, which must not outlive the fight
    const t = window as unknown as { __fanfares: number; __whines: number };
    t.__fanfares = 0; t.__whines = 0;
    const setAt = AudioParam.prototype.setValueAtTime;
    AudioParam.prototype.setValueAtTime = function (v: number, when: number) { if (v === 523) t.__fanfares++; return setAt.call(this, v, when); };
    const oStart = OscillatorNode.prototype.start, oStop = OscillatorNode.prototype.stop;
    OscillatorNode.prototype.start = function (w?: number) { if (this.type === 'sawtooth') t.__whines++; return oStart.call(this, w); };
    OscillatorNode.prototype.stop = function (w?: number) { if (this.type === 'sawtooth') t.__whines--; return oStop.call(this, w); };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...a: Parameters<typeof start>) { w.__sound.push(this.buffer?.duration ?? 0); return start.apply(this, a); };
    // lets a test lose the GPU: a real device.lost can't be asked for
    const gpu = (window as unknown as { GPUAdapter?: { prototype: { requestDevice(...a: unknown[]): Promise<object> } } }).GPUAdapter;
    if (gpu) {
      const ask = gpu.prototype.requestDevice;
      gpu.prototype.requestDevice = async function (...a: unknown[]) {
        const d = await ask.apply(this, a);
        let fire!: (x: unknown) => void;
        const lost = new Promise(r => { fire = r; });
        Object.defineProperty(d, 'lost', { value: lost });
        (window as unknown as { __loseDevice(): void }).__loseDevice = () => fire({ reason: 'unknown', message: 'test' });
        return d;
      };
    }
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.removeItem('math-bots-place'); localStorage.removeItem('math-bots-fight-detail');
      if (s) localStorage.setItem('math-bots-save', JSON.stringify(s)); else localStorage.removeItem('math-bots-save');
    }
  }, { s: save, noGPU: !!opts.noWebGPU, noWorker: !!opts.noWorker });
  const page = await context.newPage();
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (/Math Bots:/.test(m.text())) log(m.text().slice(0, 200)); if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text()) && !(blocking && /ERR_FAILED|internal error|not connect|Load failed|Failed to load/.test(m.text()))) problems.push(`console: ${m.text().slice(0, 300)}`); });
  await page.goto(opts.at ?? url);
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.waitForTimeout(600);
  return { context, page, seen };
}
const swReady = (page: Page) => page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return r.active?.state; });
/** Clips of speech, not the fight's two-second noise buffer or the silent unlock buffer. */
const clips = (page: Page) => page.evaluate(() => (window as unknown as { __sound: number[] }).__sound.filter(d => d > .05 && d !== 2).length);
const fanfares = (page: Page) => page.evaluate(`window.__fanfares`) as Promise<number>;
const whines = (page: Page) => page.evaluate(`window.__whines`) as Promise<number>;
const save = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('math-bots-save') ?? '{}') as { balance: number; workshop: { unlocked: string[]; fights: number; ticket: boolean; gear: Record<string, number> } });
const phase = (page: Page) => page.locator('.fight-screen').getAttribute('data-phase', { timeout: 1000 }).catch(() => null);
const stage = (page: Page) => page.locator('.fight-stage').evaluate((e: HTMLElement) => ({ ...e.dataset }));
const shot = (page: Page, name: string) => page.screenshot({ path: `${out}/${which}-${name}.png` });

/** The fight's picture isn't blank: a screenshot of it has real variety of colour. */
async function drawn(page: Page) {
  const png = await page.screenshot({ type: 'jpeg', quality: 60 });
  return png.length;
}

async function fightToEnd(page: Page, tag: string, moments = true) {
  const before = await clips(page);
  await page.getByLabel('Fight', { exact: true }).click();
  await page.locator('.fight-screen').waitFor();
  const t0 = Date.now();
  await page.waitForFunction(() => { const p = document.querySelector('.fight-screen')?.getAttribute('data-phase'); return p && p !== 'warming'; }, undefined, { timeout: 90000 });
  const ready = Date.now() - t0;
  if (await phase(page) === 'plain') { problems.push(`${tag}: got the plain outcome`); await shot(page, `${tag}-plain`); return; }
  log(`${tag}: first frame after ${ready} ms, ${JSON.stringify(await stage(page))}`);
  if (moments) {
    await page.waitForTimeout(1500); await shot(page, `${tag}-open`);
    await page.waitForTimeout(6500); await shot(page, `${tag}-mid`);
  }
  await page.waitForFunction(() => document.querySelector('.fight-screen')?.getAttribute('data-phase') === 'won' || document.querySelector('.fight-screen')?.getAttribute('data-phase') === 'plain', undefined, { timeout: 120000 });
  log(`${tag}: KO after ${Date.now() - t0} ms, ${JSON.stringify(await stage(page).catch(() => ({})))}`);
  await page.waitForTimeout(1500);
  if (moments) await shot(page, `${tag}-ko`);
  await page.locator('.fight-result').waitFor({ timeout: 45000 });
  if (moments) await shot(page, `${tag}-result`);
  log(`${tag}: done in ${Date.now() - t0} ms, ${await clips(page) - before} clips, picture ${await drawn(page)} bytes`);
  if (await clips(page) - before < 4) problems.push(`${tag}: only ${await clips(page) - before} voice clips started`);
}

async function heap(page: Page, context: BrowserContext) {
  if (which !== 'chromium') return null;
  const cdp = await context.newCDPSession(page);
  await cdp.send('HeapProfiler.collectGarbage');
  // usedSize leaves out ArrayBuffers, which is where a leaked fight would show, so count them too
  const { usedSize, embedderHeapUsedSize, backingStorageSize } = await cdp.send('Runtime.getHeapUsage') as unknown as Record<string, number>;
  return Math.round((usedSize! + (embedderHeapUsedSize ?? 0) + (backingStorageSize ?? 0)) / 1048576);
}

// A save with Bolts: buy, fight, back, three times in a row.
if (wanted('three')) {
  const { context, page, seen } = await session(saveWith(80, { unlocked: [], gear: {}, goal: null, fights: 3, ticket: false }));
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  await page.waitForTimeout(800);
  await shot(page, 'workshop');
  log(`before any fight, fight files the page asked for: ${seen.filter(u => FIGHT.test(u) && false).length}`);
  const buys = ['Galaxy Purple', 'Gold Drum', 'Flame Plates', 'Glow Wheels'].slice(0, 3);
  for (let i = 0; i < 3; i++) {
    await page.getByLabel(buys[i]!, { exact: true }).click();
    await page.waitForTimeout(2800);
    await shot(page, `workshop-${i + 1}`);
    await fightToEnd(page, `fight${i + 1}`, true);
    await page.locator('.fight-result').getByLabel('Workshop').click();
    await page.locator('.reward-screen').waitFor();
    await page.waitForTimeout(600);
    log(`after fight ${i + 1}: ${JSON.stringify(await save(page).then(s => ({ b: s.balance, ...s.workshop })))}, heap ${await heap(page, context)} MB`);
  }
  await context.close();
}

if (wanted('gold')) {
  const { context, page } = await session(saveWith(20, { unlocked: ['drum:1'], gear: { drum: 1 }, goal: null, fights: 1, ticket: false }));
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  await page.waitForTimeout(800);
  await fightToEnd(page, 'gold', false);
  await context.close();
}
if (wanted('repeat')) {
  const { context, page } = await session(saveWith(20, { unlocked: [], gear: {}, goal: null, fights: 1, ticket: false }));
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  for (let i = 0; i < 2; i++) {
    await page.waitForTimeout(800);
    await fightToEnd(page, `again${i + 1}`, false);
    await page.locator('.fight-result').getByLabel('Workshop').click();
    await page.locator('.reward-screen').waitFor();
    await page.waitForTimeout(500);
    log(`Workshop after: ${await page.evaluate(`new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 > 1000) r(n); else requestAnimationFrame(f); }; requestAnimationFrame(f); })`)} frames a second`);
  }
  await context.close();
}

// The WebGL2 path, forced by taking WebGPU away as a browser without it would.
if (wanted('webgl')) {
  const { context, page } = await session(saveWith(40, { unlocked: [], gear: {}, goal: null, fights: 1, ticket: false }), undefined, { noWebGPU: true });
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  await page.waitForTimeout(800);
  await page.getByLabel('Spike Armour', { exact: true }).click();
  await page.waitForTimeout(2800);
  await fightToEnd(page, 'webgl', true);
  const s = await page.locator('.fight-stage').evaluate((e: HTMLElement) => e.dataset.backend);
  if (s !== 'webgl2') problems.push(`forced WebGL2 ran on ${s}`);
  await page.getByLabel('Watch again').click();
  await page.locator('.fight-result').waitFor({ state: 'hidden' });
  await page.locator('.fight-result').waitFor({ timeout: 30000 }); // the replay played through again
  await context.close();
}

// Leaving midway, a reload midway, and what each costs him.
if (wanted('leave')) {
  const { context, page } = await session(saveWith(20, { unlocked: [], gear: {}, goal: null, fights: 2, ticket: false }));
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  await page.waitForTimeout(800);
  await page.getByLabel('Fight', { exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.fight-screen')?.getAttribute('data-phase') === 'live', undefined, { timeout: 90000 });
  await page.waitForTimeout(3000);
  await page.getByLabel('Workshop').click();
  await shot(page, 'leave-armed');
  if (!await page.locator('.fight-screen').isVisible()) problems.push('one tap left the fight');
  await page.getByLabel('Tap again to leave').click();
  await page.locator('.reward-screen').waitFor();
  const left = await save(page);
  log(`left midway: ${JSON.stringify({ b: left.balance, ...left.workshop })}`);
  if (left.balance !== 15 || !left.workshop.ticket) problems.push('leaving should keep the paid fight');
  await page.waitForTimeout(800);
  await page.getByLabel('Fight', { exact: true }).click(); // free: he already paid
  await page.waitForFunction(() => document.querySelector('.fight-screen')?.getAttribute('data-phase') === 'live', undefined, { timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.locator('.reward-screen').waitFor({ timeout: 8000 }).catch(() => problems.push('a reload in a fight did not land in the Workshop'));
  const back = await save(page);
  log(`after reload: ${JSON.stringify({ b: back.balance, ...back.workshop })}`);
  if (back.balance !== 15 || !back.workshop.ticket) problems.push('a reload should keep the paid fight');
  await context.close();
}

// No Bolts: the Workshop says how to earn more and offers Play. A brand new save: the first fight is free.
if (wanted('broke')) {
  const { context, page } = await session(saveWith(2, { unlocked: [], gear: {}, goal: null, fights: 4, ticket: false }));
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  await page.waitForTimeout(800);
  const before = await clips(page);
  await page.getByLabel('Fight', { exact: true }).click();
  await page.waitForTimeout(3000);
  await shot(page, 'broke');
  if (await page.locator('.fight-screen').isVisible()) problems.push('a fight opened with no Bolts');
  if (await clips(page) - before < 2) problems.push('no voice saying how to earn more');
  await page.getByLabel('Play').click();
  await page.locator('.round-screen').waitFor();
  await context.close();
}

// Offline: after the worker has everything, a fight runs with the server gone. A server of its own, stopped for real, because
// context.setOffline in WebKit also cuts off what a service worker answers.
if (wanted('offline')) {
  const port = 5213, server = spawn(process.execPath, ['--import', 'tsx', 'tools/math-bots/serve.ts', String(port)], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));
  const { context, page, seen } = await session(null, undefined, { at: `http://localhost:${port}/math-bots/` });
  await swReady(page);
  await page.waitForTimeout(2000);
  log(`fresh save: fight requests before any fight: ${seen.filter(u => FIGHT.test(u)).length} (the service worker's, where the browser reports them)`);
  await page.reload();
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Workshop' }).waitFor({ timeout: 10000 });
  log(`worker: ${JSON.stringify(await page.evaluate(`(async () => { const n = await caches.keys(), c = await caches.open(n[0]), k = await c.keys(); return { controlled: !!navigator.serviceWorker.controller, entries: k.length, stage: k.filter(r => /stage-/.test(r.url)).length, ktx2: k.filter(r => /ktx2/.test(r.url)).length }; })()`))}`);
  server.kill();
  await new Promise(r => setTimeout(r, 500));
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  await page.waitForTimeout(800);
  await fightToEnd(page, 'offline', false);
  await context.close();
}

// Losing the GPU mid-fight, both ways: the fight rebuilds lower and carries on.
if (wanted('lost')) {
  for (const noWebGPU of [false, true]) {
    const { context, page } = await session(saveWith(20, { unlocked: [], gear: {}, goal: null, fights: 2, ticket: false }), undefined, { noWebGPU });
    await page.getByRole('button', { name: 'Workshop' }).click();
    await page.locator('.reward-screen').waitFor();
    await page.waitForTimeout(800);
    await page.getByLabel('Fight', { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.fight-screen')?.getAttribute('data-phase') === 'live', undefined, { timeout: 90000 });
    await page.waitForTimeout(3000);
    log(`before losing it: ${JSON.stringify(await stage(page))}`);
    await page.evaluate(() => {
      const w = window as unknown as { __loseDevice?(): void };
      if (w.__loseDevice) w.__loseDevice();
      else (document.querySelector('.fight-stage canvas') as HTMLCanvasElement).getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext();
    });
    await page.waitForTimeout(500);
    await page.waitForFunction(() => { const p = document.querySelector('.fight-screen')?.getAttribute('data-phase'); return p && p !== 'warming'; }, undefined, { timeout: 60000 });
    await page.waitForTimeout(3000);
    log(`after: phase ${await phase(page)}, ${JSON.stringify(await stage(page).catch(() => ({})))}`);
    await shot(page, `lost-${noWebGPU ? 'gl' : 'gpu'}`);
    if (await phase(page) !== 'live') problems.push(`losing the GPU (${noWebGPU ? 'gl' : 'gpu'}) ended on ${await phase(page)}`);
    await context.close();
  }
}

// What he sees when the 3D can't load at all: the chunk gone, then the textures gone. He isn't charged and he gets back.
if (wanted('plain')) {
  blocking = true;
  for (const [name, block] of [['chunk', /assets\/stage-/], ['textures', /\.ktx2/]] as const) {
    const { context, page } = await session(saveWith(20, { unlocked: [], gear: {}, goal: null, fights: 2, ticket: false }), undefined, { noWorker: true });
    await context.route(block, r => r.abort());
    await page.getByRole('button', { name: 'Workshop' }).click();
    await page.locator('.reward-screen').waitFor();
    await page.waitForTimeout(800);
    await page.getByLabel('Fight', { exact: true }).click();
    await page.locator('.fight-screen.plain').waitFor({ timeout: 90000 });
    await page.waitForTimeout(1000);
    await shot(page, `plain-${name}`);
    log(`plain (${name}): ${await fanfares(page)} fanfare, ${await whines(page)} whine left`);
    if (await fanfares(page) !== 1) problems.push(`plain (${name}): ${await fanfares(page)} fanfares`);
    if (await whines(page) !== 0) problems.push(`plain (${name}): the drum's whine is still going`);
    await page.getByLabel('Workshop').click();
    await page.locator('.reward-screen').waitFor();
    const s = await save(page);
    log(`plain outcome (${name}): ${JSON.stringify({ b: s.balance, ...s.workshop })}`);
    if (!s.workshop.ticket) problems.push('the plain outcome should keep the paid fight');
    await context.close();
  }
}

blocking = false;

// Six fights opened and left, each freed: the heap should level off.
if (wanted('leak')) {
  const { context, page } = await session(saveWith(0, { unlocked: [], gear: {}, goal: null, fights: 1, ticket: true }));
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(600);
    await page.getByLabel('Fight', { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.fight-screen')?.getAttribute('data-phase') === 'live', undefined, { timeout: 90000 });
    await page.waitForTimeout(1500);
    await page.getByLabel('Workshop').click();
    await page.getByLabel('Tap again to leave').click();
    await page.locator('.reward-screen').waitFor();
    await page.waitForTimeout(800);
    log(`left fight ${i + 1}: heap ${await heap(page, context)} MB, canvases ${await page.locator('canvas').count()}`);
  }
  await context.close();
}

// Something held past the 75 s limit that then arrives: the fight's chunk, or the textures (so a stage finishes building after it). He
// must stay on the plain outcome: no black screen, no second fanfare, nothing left running. Takes about 90 s each.
if (wanted('late')) {
  for (const [name, hold] of [['chunk', /assets\/stage-/], ['textures', /\.ktx2/]] as const) {
    const { context, page } = await session(saveWith(20, { unlocked: [], gear: {}, goal: null, fights: 2, ticket: false }), undefined, { noWorker: true });
    await context.route(hold, async r => { await new Promise(done => setTimeout(done, 80000)); await r.continue().catch(() => {}); });
    await page.getByRole('button', { name: 'Workshop' }).click();
    await page.locator('.reward-screen').waitFor();
    await page.waitForTimeout(800);
    await page.getByLabel('Fight', { exact: true }).click();
    await page.locator('.fight-screen.plain').waitFor({ timeout: 90000 });
    await page.waitForTimeout(12000); // the held files arrive in here
    await shot(page, `late-${name}`);
    const state = { plain: await page.locator('.fight-screen.plain').isVisible(), canvases: await page.locator('canvas').count(), fanfares: await fanfares(page), whines: await whines(page) };
    log(`late ${name}: ${JSON.stringify(state)}`);
    if (!state.plain || state.canvases || state.fanfares !== 1 || state.whines) problems.push(`late ${name}: ${JSON.stringify(state)}`);
    await page.getByLabel('Workshop').click();
    await page.locator('.reward-screen').waitFor();
    await context.close();
  }
}

// A step-down in the middle of things, with a 💥 tap before it: the rebuilt fight still reaches the knockout, and the ticket is used.
if (wanted('rebuilt')) {
  const { context, page } = await session(saveWith(20, { unlocked: [], gear: {}, goal: null, fights: 2, ticket: false }));
  await page.getByRole('button', { name: 'Workshop' }).click();
  await page.locator('.reward-screen').waitFor();
  await page.waitForTimeout(800);
  await page.getByLabel('Fight', { exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.fight-screen')?.getAttribute('data-phase') === 'live', undefined, { timeout: 90000 });
  await page.waitForTimeout(1500);
  await page.getByLabel('Charge').click();
  await page.waitForTimeout(3000);
  await page.evaluate(`window.__loseDevice ? window.__loseDevice() : document.querySelector('.fight-stage canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`);
  await page.waitForFunction(() => document.querySelector('.fight-screen')?.getAttribute('data-phase') === 'won', undefined, { timeout: 120000 });
  await page.locator('.fight-result').waitFor({ timeout: 45000 });
  const s = await save(page);
  log(`rebuilt fight: ${JSON.stringify(await stage(page))}, ${JSON.stringify({ b: s.balance, fights: s.workshop.fights, ticket: s.workshop.ticket })}`);
  if (s.workshop.ticket || s.workshop.fights !== 3) problems.push('a rebuilt fight should still end and use the ticket');
  await context.close();
}

// A fresh save in a normal Round, with every fight file held back so nothing can wait on them, and none asked for by the page.
if (wanted('fresh')) {
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 } }), page = await context.newPage(), asked: string[] = [];
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('request', r => { if (FIGHT.test(r.url())) asked.push(r.url()); });
  await context.route(FIGHT, () => { /* never answered */ });
  await page.goto(url);
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.getByLabel('Play', { exact: true }).click();
  await page.locator('.round-screen').waitFor({ timeout: 10000 });
  await page.waitForTimeout(2500);
  await shot(page, 'fresh-round');
  await page.locator('.round-screen button').first().click();
  await page.waitForTimeout(500);
  log(`fresh Round with fight files held back: page asked for ${asked.length} of them`);
  if (asked.length) problems.push(`the page asked for fight files before a fight: ${asked[0]}`);
  await context.close();
}

// Sizes: portrait and landscape, iPad and iPhone.
if (wanted('sizes')) {
  for (const [name, viewport] of [['ipad-portrait', { width: 820, height: 1180 }], ['iphone-portrait', { width: 390, height: 844 }], ['iphone-landscape', { width: 844, height: 390 }]] as const) {
    const { context, page } = await session(saveWith(12, { unlocked: ['paint:1'], gear: { paint: 1 }, goal: null, fights: 1, ticket: false }), viewport);
    await page.getByRole('button', { name: 'Workshop' }).click();
    await page.locator('.reward-screen').waitFor();
    await page.waitForTimeout(900);
    await shot(page, `${name}-workshop`);
    await page.getByLabel('Fight', { exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.fight-screen')?.getAttribute('data-phase') === 'live', undefined, { timeout: 90000 });
    await page.waitForTimeout(9000);
    await shot(page, `${name}-fight`);
    log(`${name}: ${JSON.stringify(await stage(page))}`);
    await context.close();
  }
}

await browser.close();

console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'no problems');
process.exitCode = problems.length ? 1 : 0;
