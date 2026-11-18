// Review probe: every kind at every Level on its own (the other kinds starred, so nearly every question is this kind): the first
// question right, the second missed once, the third missed twice (trying the stage himself), the rest right. Screenshots each step,
// watches the network (404s, failed requests), the console, and two clips at once.
//   npx tsx .scratch/deep-light/review/probe.ts <url> <outDir> <view> [kinds] [levels]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, type CDPSession, type Page } from 'playwright';
import { CLIPS } from '../../../src/deep-light/voice.gen';

const [url = 'http://localhost:5185/', out = '/tmp/probe', viewName = 'portrait', kindsArg = 'see,through,sound,shadow,mirror,signal', levelsArg = '1,2,3'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const VIEW = VIEWS[viewName as keyof typeof VIEWS];
const MODES = ['see', 'through', 'sound', 'shadow', 'mirror', 'signal'];
const CLIP_PHRASE = Object.fromEntries(Object.entries(CLIPS).map(([p, f]) => [f, p]));
const problems: string[] = [];
const log: string[] = [];

function saveFor(kind: string, level: number) {
  return {
    version: 1, balance: 40,
    learning: {
      modes: Object.fromEntries(MODES.map(m => [m, { level: m === kind ? level : 2, window: [], opened: true, starred: m !== kind, introPending: false, fresh: false }])),
      pushed: Object.fromEntries(MODES.map(m => [m, 40])),
    },
    dock: { owned: [], fitted: {}, goal: null, dives: 1, photos: [], zone: null, done: 0 },
  };
}

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true, isMobile: false });
const page: Page = await context.newPage();
const cdp: CDPSession = await context.newCDPSession(page);
await page.addInitScript(() => {
  type V = { f: string; t0: number; t1: number | null };
  const w = window as unknown as { __voice: V[] };
  w.__voice = [];
  const tag = new WeakMap<object, string>();
  const arrayBuffer = Response.prototype.arrayBuffer;
  Response.prototype.arrayBuffer = async function (this: Response) { const b = await arrayBuffer.call(this); if (/voice\//.test(this.url)) tag.set(b, this.url.split('/').pop()!); return b; };
  const decode = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function (this: BaseAudioContext, b: ArrayBuffer, ...rest: unknown[]) {
    const f = tag.get(b), p = (decode as (...a: unknown[]) => Promise<AudioBuffer>).call(this, b, ...rest);
    return f ? p.then(buf => { tag.set(buf, f); return buf; }) : p;
  } as typeof decode;
  const channel = AudioBuffer.prototype.getChannelData;
  AudioBuffer.prototype.getChannelData = function (this: AudioBuffer, c: number) { const d = channel.call(this, c); const f = tag.get(this); if (f) tag.set(d.buffer, f); return d; };
  const copy = AudioBuffer.prototype.copyToChannel;
  AudioBuffer.prototype.copyToChannel = function (this: AudioBuffer, src: Float32Array, ...r: [number, number?]) { const f = tag.get(src.buffer); if (f) tag.set(this, f); return copy.call(this, src as Float32Array<ArrayBuffer>, ...r); } as typeof copy;
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (this: AudioBufferSourceNode, ...a: Parameters<typeof start>) {
    const f = this.buffer && tag.get(this.buffer);
    if (f) { const e: V = { f, t0: performance.now(), t1: null }; w.__voice.push(e); this.addEventListener('ended', () => { if (e.t1 === null) e.t1 = performance.now(); }); }
    return start.apply(this, a);
  };
});
page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest/.test(m.text())) problems.push(`console: ${m.text()}`); });
page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`); });
page.on('requestfailed', r => { if (!/favicon/.test(r.url())) problems.push(`request failed ${r.url()} ${r.failure()?.errorText}`); });

let tag = '', n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.dl');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    if (game) { const g = getComputedStyle(game); if (g.backgroundColor !== 'rgba(0, 0, 0, 0)' || g.borderTopWidth !== '0px') out.push(`question card styled (${game.className})`); }
    for (const el of document.querySelectorAll('button, [role=button]')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep') || (el as HTMLButtonElement).disabled) continue;
      if (document.querySelector('.reward') && el.closest('.card')) continue;
      const label = el.getAttribute('aria-label') ?? el.className.toString();
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`off screen: ${label}`);
      if (r.height < 43.5 || r.width < 43.5) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
      if (r.bottom > innerHeight - 56 + 1 && !el.closest('.dl-tray,.log-pages')) out.push(`in the bottom band (${Math.round(innerHeight - r.bottom)}px up): ${label}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${tag} ${name}: ${bad.slice(0, 8).join('; ')}`);
}
async function touch(type: 'touchStart' | 'touchMove' | 'touchEnd', p?: { x: number; y: number }) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: Math.round(p.x), y: Math.round(p.y), id: 1, radiusX: 8, radiusY: 8, force: 1 }] : [] });
}
type Q = { mode: string; level: number; replay?: boolean; q: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 60000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.dl[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push(`${tag}: a question never became ready`);
  return false;
}
const esc = (s: string) => s.replace(/(["\\])/g, '\\$1');
const tapKey = (key: string) => page.locator(`.game.dl [data-key="${esc(key)}"]`).first().tap({ timeout: 8000 }).catch(e => { problems.push(`${tag}: could not tap ${key}: ${String(e).split('\n')[0]}`); });
const check = () => page.locator('.game.dl .check-btn').tap({ timeout: 8000 }).catch(e => { problems.push(`${tag}: could not tap check: ${String(e).split('\n')[0]}`); });
let turned: number[] = [];
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q;
  if (q.kind === 'see' && q.form === 'own') {
    const right: string[] = q.answer.split('+'), extra = (q.items as string[]).filter(i => !right.includes(i));
    const want: string[] = !miss ? right : second ? [...right, extra[0]!] : right.length > 1 ? right.slice(1) : [extra[0]!];
    for (const id of q.items as string[]) {
      const on = (await page.locator(`.game.dl [data-key="${id}"]`).getAttribute('aria-pressed')) === 'true';
      if (on !== want.includes(id)) { await tapKey(id); await page.waitForTimeout(250); }
    }
    return check();
  }
  if (q.kind === 'through' && q.form === 'sort') {
    const bins = Object.fromEntries(q.answer.split(',').map((x: string) => x.split(':')));
    for (const id of q.items as string[]) { await tapKey(id); await page.waitForTimeout(150); await tapKey(`bin-${miss ? (second ? 'none' : 'all') : bins[id]}`); await page.waitForTimeout(150); }
    return check();
  }
  if (q.kind === 'mirror' && (q.form === 'turn' || q.form === 'two')) {
    if (!turned.length) turned = q.lab.mirrors.map((m: { turn: number }) => m.turn);
    if (miss) { await tapKey('m0'); turned[0] = (turned[0]! + 1) % 4; if (turned.join(',') === q.answer) { await tapKey('m0'); turned[0] = (turned[0]! + 1) % 4; } await page.waitForTimeout(150); }
    if (!miss) {
      const target = q.answer.split(',').map(Number);
      for (let i = 0; i < target.length; i++) while (turned[i] !== target[i]) { await tapKey(`m${i}`); turned[i] = (turned[i]! + 1) % 4; await page.waitForTimeout(150); }
    }
    return check();
  }
  if (q.kind === 'signal' && q.form === 'copy') {
    const pattern: string = !miss ? q.pattern : second ? 's'.repeat(q.pattern.length) : [...q.pattern].map((f: string) => (f === 's' ? 'l' : 's')).join('');
    for (const f of pattern) { await tapKey(f); await page.waitForTimeout(250); }
    return check();
  }
  const wrongs = (q.choices as string[]).filter(x => x !== q.answer);
  return tapKey(miss ? (second ? wrongs[wrongs.length - 1]! : wrongs[0]!) : q.answer);
}

await page.goto(url);
const kinds = kindsArg.split(','), levels = levelsArg.split(',').map(Number);
for (const kind of kinds) for (const level of levels) {
  tag = `${viewName}-${kind}${level}`; n = 0;
  await page.evaluate(s => { localStorage.setItem('deep-light-save', JSON.stringify(s)); localStorage.removeItem('deep-light-place'); }, saveFor(kind, level));
  await page.reload();
  await page.waitForTimeout(600);
  await page.getByLabel('Start').tap();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Play', exact: true }).tap();
  let i = 0;
  for (let guard = 0; guard < 14; guard++) {
    if (await page.locator('.reward h2').isVisible()) break;
    const p = await question();
    if (!p) { await page.waitForTimeout(300); continue; }
    await ready();
    turned = [];
    const id = `${p.mode}-L${p.level}-${p.q.form}${p.replay ? '-replay' : ''}`;
    await shot(`q${i}-${id}`);
    const t0 = Date.now();
    const misses = p.replay || p.mode !== kind ? 0 : i === 1 ? 1 : i === 2 ? 2 : 0;
    log.push(`${tag} q${i} ${id} misses=${misses} ${JSON.stringify(p.q).slice(0, 220)}`);
    if (misses >= 1) {
      await answer(p, true);
      await page.waitForTimeout(1600);
      await shot(`q${i}-lesson1`);
      await ready();
      await shot(`q${i}-after1`);
    }
    if (misses >= 2) {
      await answer(p, true, true);
      let tried = false;
      for (let k = 0; k < 150; k++) {
        if (await page.locator('.try-btn').count()) { await shot(`q${i}-try`); await page.locator('.try-btn').first().tap().catch(() => {}); tried = true; await page.waitForTimeout(900); await shot(`q${i}-tried`); break; }
        if (await page.locator('.shadow-holder.drag').count()) {
          await shot(`q${i}-try`);
          const b = (await page.locator('.shadow-holder.drag').boundingBox())!;
          await touch('touchStart', { x: b.x + b.width * 0.15, y: b.y + b.height * 0.3 });
          for (let s = 1; s <= 8; s++) { await touch('touchMove', { x: b.x + b.width * (0.15 + s * 0.09), y: b.y + b.height * 0.3 }); await page.waitForTimeout(60); }
          await touch('touchEnd'); tried = true; await shot(`q${i}-tried`); break;
        }
        if (k > 10 && await page.locator('.game.dl[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) break;
        await page.waitForTimeout(200);
      }
      log.push(`${tag} q${i} second lesson: tried=${tried}`);
      await ready();
      await shot(`q${i}-after2`);
    }
    await answer(p, false);
    await page.waitForTimeout(500);
    await shot(`q${i}-right`);
    let moved = false;
    for (let k = 0; k < 120; k++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) { moved = true; break; } if (await page.locator('.reward h2').isVisible()) { moved = true; break; } await page.waitForTimeout(150); }
    if (!moved) { problems.push(`${tag}: ${id} did not move on after the right answer`); await shot(`q${i}-STUCK`); break; }
    log.push(`${tag} q${i} took ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    i++;
  }
  await page.waitForTimeout(1200);
  await shot('end');
}
const heard = (await page.evaluate(() => (window as unknown as { __voice: { f: string; t0: number; t1: number | null }[] }).__voice)).sort((a, b) => a.t0 - b.t0);
for (let k = 1; k < heard.length; k++) { const a = heard[k - 1]!, b = heard[k]!; if (a.t1 !== null && b.t0 < a.t1 - 25) problems.push(`two clips at once: "${CLIP_PHRASE[a.f]}" and "${CLIP_PHRASE[b.f]}"`); }
writeFileSync(`${out}/voice-${viewName}.txt`, heard.map(h => `${(h.t0 / 1000).toFixed(2).padStart(8)} ${h.t1 ? ((h.t1 - h.t0) / 1000).toFixed(2) : '?'} ${CLIP_PHRASE[h.f] ?? h.f}`).join('\n'));
writeFileSync(`${out}/log-${viewName}.txt`, log.join('\n'));
console.log(`${viewName}: ${heard.length} clips`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
