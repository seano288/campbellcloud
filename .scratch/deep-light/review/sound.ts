// Sound survives what killed it before: the context paused by the device (as iPad Safari does) mid-Round, the tab hidden and shown
// again, the second question, a miss lesson; and the Dive's own sounds go through the shared context.
import { chromium } from 'playwright';
import { CLIPS } from '../../../src/deep-light/voice.gen';
const url = process.argv[2] ?? 'http://localhost:5186/';
const CLIP_PHRASE = Object.fromEntries(Object.entries(CLIPS).map(([p, f]) => [f, p]));
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: { width: 1080, height: 810 }, hasTouch: true });
const page = await context.newPage();
const problems: string[] = [];
page.on('pageerror', e => problems.push(`pageerror ${e.message}`));
page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`); });
await page.addInitScript(() => {
  const w = window as any; w.__heard = []; w.__ctxs = 0; w.__osc = 0;
  const AC = window.AudioContext;
  (window as any).AudioContext = class extends AC { constructor(...a: any[]) { super(...a); w.__ctxs++; w.__ctx = this; } };
  const osc = BaseAudioContext.prototype.createOscillator;
  BaseAudioContext.prototype.createOscillator = function () { w.__osc++; if (this !== w.__ctx) w.__strayOsc = true; return osc.call(this); };
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a: any[]) {
    const e = { t0: performance.now(), t1: null as null | number, dur: this.buffer?.duration ?? 0, state: (this.context as AudioContext).state };
    if (e.dur > 0.05) { w.__heard.push(e); this.addEventListener('ended', () => { e.t1 = performance.now(); }); }
    return start.apply(this, a as any);
  };
  const fetch0 = window.fetch;
  w.__fetched = [];
  window.fetch = async (...a: any[]) => { const r = await fetch0(...(a as [any])); if (/voice/.test(String(a[0]?.url ?? a[0]))) w.__fetched.push(String(a[0]?.url ?? a[0]).split('/').pop()); return r; };
  localStorage.removeItem('deep-light-save'); localStorage.removeItem('deep-light-place');
});
const heard = () => page.evaluate(() => (window as any).__heard as { t0: number; t1: number | null; dur: number; state: string }[]);
const state = () => page.evaluate(() => (window as any).__ctx?.state);
const question = () => page.evaluate(() => (window as any).__round?.());
async function ready() { for (let i = 0; i < 300; i++) { if (await page.locator('.game.dl[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return; await page.waitForTimeout(100); } problems.push('never ready'); }
async function tapRight() {
  const p = await question(); const q = p.q;
  if (q.kind === 'see' && q.form === 'own') { for (const id of q.answer.split('+')) await page.locator(`[data-key="${id}"]`).tap(); await page.locator('.check-btn').tap(); return; }
  if (q.kind === 'through' && q.form === 'sort') { for (const pr of q.answer.split(',')) { const [it, b] = pr.split(':'); await page.locator(`[data-key="${it}"]`).tap(); await page.locator(`[data-key="bin-${b}"]`).tap(); } await page.locator('.check-btn').tap(); return; }
  await page.locator(`.game.dl [data-key="${q.answer}"]`).first().tap();
}
async function tapWrong() { const p = await question(); const q = p.q; await page.locator(`.game.dl [data-key="${q.choices.find((c: string) => c !== q.answer)}"]`).first().tap(); }
async function nextQ(prev: unknown) { for (let i = 0; i < 100; i++) { const q = await question(); if (q && JSON.stringify(q) !== JSON.stringify(prev)) return; await page.waitForTimeout(100); } }

await page.goto(url);
await page.getByLabel('Start').tap();
await page.waitForTimeout(800);
await page.getByRole('button', { name: 'Play', exact: true }).tap();
await ready();
const n0 = (await heard()).length;
console.log('Q1 ready; clips so far', n0, 'ctx', await state());
// 1. the device pauses the sound mid-Round
await page.evaluate(() => (window as any).__ctx.suspend());
await page.waitForTimeout(300);
console.log('suspended:', await state());
let p = await question();
await tapRight(); // his tap wakes it
await page.waitForTimeout(300);
console.log('after tap:', await state());
await nextQ(p); await ready();
const h1 = await heard();
const q2clips = h1.slice(n0);
console.log('Q2: clips since', q2clips.length, q2clips.map(c => `${c.state} ${c.t1 ? ((c.t1 - c.t0) / 1000).toFixed(2) : 'never ended'}/${c.dur.toFixed(2)}`).join(' | '));
if (!q2clips.some(c => c.state === 'running' && c.t1)) problems.push('no clip played through on question 2 after the context was suspended');
// 2. the tab is hidden and comes back (the page sees visibilitychange; the device has paused the sound meanwhile)
await page.evaluate(`(async () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get() { return 'hidden'; } }); document.dispatchEvent(new Event('visibilitychange'));
  await window.__ctx.suspend();
  Object.defineProperty(document, 'visibilityState', { configurable: true, get() { return 'visible'; } }); document.dispatchEvent(new Event('visibilitychange'));
})()`);
await page.waitForTimeout(500);
console.log('after coming back (no tap):', await state());
if ((await state()) !== 'running') problems.push('the sound did not come back when the page did');
// 3. a miss on this question: the lesson speaks
const n2 = (await heard()).length;
p = await question();
await tapWrong();
await page.waitForTimeout(6000);
const lesson = (await heard()).slice(n2);
console.log('miss lesson clips:', lesson.length, lesson.map(c => `${c.state} ${c.t1 ? ((c.t1 - c.t0) / 1000).toFixed(2) : 'never'}/${c.dur.toFixed(2)}`).join(' | '));
if (lesson.filter(c => c.t1 && c.t1 - c.t0 > c.dur * 1000 * 0.8).length < 2) problems.push('the miss lesson did not play through');
await ready(); await tapRight(); await nextQ(p); await ready();
const all = await heard();
for (let i = 1; i < all.length; i++) { const a = all[i - 1]!, b = all[i]!; if (a.t1 !== null && b.t0 < a.t1 - 25) problems.push(`two clips overlap at ${a.t0.toFixed(0)}`); }
const cut = all.filter(c => c.t1 && c.t1 - c.t0 < c.dur * 1000 * 0.6);
console.log('clips cut short (ended before 60% of their length):', cut.length, 'of', all.length);
console.log('AudioContexts made:', await page.evaluate(() => (window as any).__ctxs), 'oscillators on another context:', await page.evaluate(() => !!(window as any).__strayOsc));
console.log(problems.length ? problems.join('\n') : 'no problems');
await browser.close();
