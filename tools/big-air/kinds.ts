// Plays every kind at every Level in a real browser, one kind at a time, as a child who misses: for each kind and Level a save where only
// that kind is practised (the others are starred, so they come back only as the Round's one review question), then a Round in which the
// first question of that kind is missed once and then answered, the second is missed twice and its fuller lesson tapped through, and the
// rest are answered right. After every miss the question must take taps again. The number pad is tried with nothing typed, a leading
// zero, three digits and Erase. The Bolts the Round pays are checked against what it should pay. Every voice pack is fetched once, none
// fails, nothing is written to the console as an error and no two clips play at once.
//
// Then the Jump: doing nothing at all, mashing every control, a reload in the middle of a Round and in the middle of a Jump, and the
// same jump at 60 and at 20 frames a second (it must go the same distance).
//   npm run dev:big-air   (in another shell)
//   npx tsx tools/big-air/kinds.ts <url> [view] [kinds]      view: portrait|landscape|phone|side; kinds: ruler,guess,... (all by default)
import { chromium, type Page } from 'playwright';
import { thingOf } from '../../src/big-air/questions/things';

const [url = 'http://localhost:5141/', viewName = 'side', only = ''] = process.argv.slice(2);
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const VIEW = VIEWS[viewName as keyof typeof VIEWS];
const MODES = ['ruler', 'guess', 'longer', 'line', 'story', 'units'];
const problems: string[] = [], notes: string[] = [];
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

function saveFor(kind: string | null, level: number, arena: Record<string, unknown> = {}, balance = 0) {
  return {
    version: 1, balance,
    learning: {
      modes: Object.fromEntries(MODES.map(m => [m, { level: kind ? level : 1, window: [], opened: kind ? true : m === 'ruler' || m === 'guess', starred: kind ? m !== kind : false, introPending: false, fresh: false }])),
      pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: ['ruler', 'cm', 'feet'],
      tuneUp: { ruler: { asked: 3, clean: 3, misses: 0 }, guess: { asked: 3, clean: 3, misses: 0 } },
    },
    arena,
  };
}

async function open(save: unknown, fps?: number) {
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true });
  const packs = new Map<string, number>();
  await page.addInitScript(([s, f]) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.removeItem('big-air-place');
      if (s) localStorage.setItem('big-air-save', JSON.stringify(s)); else localStorage.removeItem('big-air-save');
    }
    if (f) {
      // a slow (or fast) device: frames at `f` a second
      window.requestAnimationFrame = ((cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 1000 / (f as number))) as unknown as typeof requestAnimationFrame;
      window.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof cancelAnimationFrame;
    }
    const w = window as unknown as { __overlaps: string[]; __said: number }, start = AudioBufferSourceNode.prototype.start;
    w.__overlaps = []; w.__said = 0;
    // each voice clip and when it will end: a clip that starts before another has ended (by more than a few ms) is an overlap
    const playing = new Map<AudioBufferSourceNode, number>();
    const connect = AudioBufferSourceNode.prototype.connect as (...a: unknown[]) => unknown;
    AudioBufferSourceNode.prototype.connect = function (this: AudioBufferSourceNode, ...a: unknown[]) { if (a[0] instanceof AudioDestinationNode) (this as unknown as { voice?: boolean }).voice = true; return connect.apply(this, a); } as typeof AudioBufferSourceNode.prototype.connect;
    AudioBufferSourceNode.prototype.start = function (...a: Parameters<typeof start>) {
      if ((this as unknown as { voice?: boolean }).voice && (this.buffer?.duration ?? 0) > .05) {
        w.__said++;
        const now = this.context.currentTime;
        for (const [src, end] of playing) if (end <= now + .03) playing.delete(src);
        if (playing.size) w.__overlaps.push(`clip ${w.__said} started over ${playing.size}`);
        playing.set(this, now + this.buffer!.duration);
      }
      return start.apply(this, a);
    };
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.stop = function (...a: Parameters<typeof stop>) { playing.delete(this); return stop.apply(this, a); };
  }, [save, fps ?? 0] as const);
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
  page.on('response', r => {
    if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`);
    if (/\/voice\/[0-9a-f]-/.test(r.url())) packs.set(r.url(), (packs.get(r.url()) ?? 0) + 1);
  });
  page.on('requestfailed', r => problems.push(`request failed: ${r.url()}`));
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.waitForTimeout(600);
  return { page, packs };
}

type Q = { mode: string; meeting?: string; level?: number; q?: Record<string, any> } | null;
const question = (page: Page) => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('big-air-save') ?? '{}'));
async function ready(page: Page, what: string, ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await page.locator('.game.ba[data-ready="yes"]').count() || await page.locator('.reward h2').isVisible()) return true;
    if (await page.locator('.ba-next').count()) await page.locator('.ba-next').click().catch(() => {});
    await page.waitForTimeout(150);
  }
  problems.push(`${what}: never took taps again`);
  return false;
}
const tap = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true }).first().click({ timeout: 5000 });
const UNIT: Record<string, [string, string]> = { in: ['inch', 'inches'], ft: ['foot', 'feet'], cm: ['centimetre', 'centimetres'] };
function labelOf(q: Record<string, any>, c: string): string {
  if (q.kind === 'guess') return q.form === 'longer' ? thingOf(c).name : q.form === 'about' ? `${c} ${UNIT[q.unit]![Number(c) === 1 ? 0 : 1]}` : c === 'in' ? 'inches' : 'feet';
  if (q.kind === 'story') return `${c} ft`;
  if (q.kind === 'units') return q.form === 'which' ? (c === 'in' ? `${q.inches} inches` : `${q.cm} centimetres`) : q.form === 'more' ? `${c === 'more' ? 'More' : 'Fewer'} ${UNIT[q.to]![1]}` : c;
  return c;
}
async function pad(page: Page, v: string) {
  for (let i = 0; i < 3; i++) await tap(page, 'Erase');
  for (const d of v) await tap(page, d);
  await tap(page, 'Done');
}
async function tapTape(page: Page, q: Record<string, any>, v: number) {
  const box = (await page.locator('.ba-tape').first().boundingBox())!, lo = q.form === 'ones' ? q.lo : 0, hi = q.form === 'ones' ? q.lo + 10 : 100;
  const xv = 40 + ((v - lo) / (hi - lo)) * 920;
  await page.mouse.click(box.x + ((xv + 40) / 1080) * box.width, box.y + (155 / 220) * box.height);
}
async function answer(page: Page, p: NonNullable<Q>, miss: 0 | 1 | 2) {
  const q = p.q!, traps = (q.traps as { value: string }[]).map(t => t.value);
  const wrongs = q.choices ? (q.choices as string[]).filter(c => c !== q.answer) : traps.length ? traps : [String(Number(q.answer) + 1)];
  const v = miss ? (miss === 2 && wrongs[1] !== undefined ? wrongs[1] : wrongs[0])! : q.answer;
  if (q.kind === 'ruler' || q.kind === 'longer') return pad(page, v);
  if (q.kind === 'line' && q.form !== 'hops') {
    // a wrong tick on the tape: one step off for the first miss, two for the second, never the answer itself
    const step = q.form === 'ones' ? 1 : 10, lo = q.form === 'ones' ? q.lo : 0, hi = lo + (q.form === 'ones' ? 10 : 100), n = Number(q.answer);
    const off = (miss === 2 ? 2 : 1) * step, w = !miss ? n : n + off <= hi ? n + off : n - off;
    return tapTape(page, q, w);
  }
  return tap(page, labelOf(q, v));
}
/** How many answers the Round has (Meetings too), as the stars at the top show them: it goes up when he answers right. */
const answered = (page: Page) => page.locator('.stars span.on').count();
async function moved(page: Page, p: Q, before: number) {
  for (let i = 0; i < 150; i++) { if (await answered(page) > before) return; if (await page.locator('.reward h2').isVisible()) return; await page.waitForTimeout(150); }
  const state = await page.evaluate(() => ({
    ready: document.querySelector('.game.ba')?.getAttribute('data-ready'), lesson: document.querySelector('.game.ba')?.getAttribute('data-lesson'),
    pad: document.querySelector('.pad-show')?.textContent, mark: document.querySelector('.tape-mark text')?.textContent, stars: document.querySelector('.stars')?.outerHTML.length,
  }));
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/stuck-${Date.now()}.png` });
  problems.push(`stuck after answering ${JSON.stringify(p?.q).slice(0, 120)}: ${JSON.stringify(state)}`);
}

/** The number pad's edges: nothing typed, a leading zero, a third digit, Erase. */
async function tryPad(page: Page, p: NonNullable<Q>, tag: string) {
  const shown = () => page.locator('.pad-show b').innerText();
  const misses = async () => (await page.locator('.stars .star, .stars span').count());
  await tap(page, 'Done'); await page.waitForTimeout(400);
  if (!(await page.locator('.game.ba[data-ready="yes"]').count())) problems.push(`${tag}: Done with nothing typed stopped the pad`);
  if ((await question(page))?.q?.answer !== p.q!.answer) problems.push(`${tag}: Done with nothing typed moved on`);
  await tap(page, '0'); await tap(page, '7');
  if (await shown() !== '7') problems.push(`${tag}: 0 then 7 shows "${await shown()}"`);
  await tap(page, '3'); await tap(page, '9');
  if (await shown() !== '73') problems.push(`${tag}: a third digit shows "${await shown()}"`);
  await tap(page, 'Erase'); if (await shown() !== '7') problems.push(`${tag}: Erase shows "${await shown()}"`);
  await tap(page, 'Erase'); if (await shown() !== '?') problems.push(`${tag}: erased pad shows "${await shown()}"`);
  await tap(page, '1');
  const unit = await page.locator('.pad-show small').innerText();
  if (/s$/.test(unit)) problems.push(`${tag}: the pad writes "1 ${unit}"`);
  await tap(page, 'Erase');
  void misses;
}

async function playKind(kind: string, level: number) {
  const tag = `${kind} L${level} ${viewName}`;
  const { page, packs } = await open(saveFor(kind, level));
  const before = (await saved(page)).balance ?? 0;
  await tap(page, 'Play');
  let seen = 0, firstTry = 0, padTried = false;
  for (let guard = 0; guard < 30; guard++) {
    if (await page.locator('.reward h2').isVisible()) break;
    // the question as it is on screen once it takes taps (the star fills as he answers, before the next question comes)
    if (!(await ready(page, `${tag} q`))) break;
    if (await page.locator('.reward h2').isVisible()) break;
    const p = await question(page);
    if (!p) { await page.waitForTimeout(300); continue; }
    const had = await answered(page);
    if (p.mode === 'meet') { await tap(page, 'Go'); await moved(page, p, had); continue; }
    if (p.mode !== kind) { await answer(page, p, 0); firstTry++; await moved(page, p, had); continue; }
    seen++;
    const which = `${tag} #${seen} ${p.q?.form ?? ''} L${p.level}`;
    if (!padTried && (p.q?.kind === 'ruler' || p.q?.kind === 'longer')) { padTried = true; await tryPad(page, p, which); }
    if (seen === 1 && !(p.q as any).replay) {
      await answer(page, p, 1);
      await page.waitForTimeout(500);
      if (!(await ready(page, `${which} after one miss`))) break;
      await answer(page, p, 0);
    } else if (seen === 2) {
      await answer(page, p, 1);
      await page.waitForTimeout(500);
      if (!(await ready(page, `${which} after one miss`))) break;
      await answer(page, p, 2);
      for (let i = 0; i < 60 && !(await page.locator('[data-lesson="next"]').count()); i++) await page.waitForTimeout(200);
      if (!(await page.locator('[data-lesson="next"]').count())) notes.push(`${which}: the second miss had no step-by-step lesson`);
      if (!(await ready(page, `${which} after the fuller lesson`, 120000))) break;
      await answer(page, p, 0);
    } else { await answer(page, p, 0); if (!(p.q as any).replay) firstTry++; }
    await moved(page, p, had);
  }
  await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 60000 }).catch(() => problems.push(`${tag}: end of Round never woke up`));
  const s = await saved(page), paid = (s.balance ?? 0) - before;
  // a Round pays one for each answer right at the first try and one for finishing
  const expected = 5 + 1 - 2;
  if (paid !== expected) notes.push(`${tag}: paid ${paid} (expected ${expected}: five answers, two of them missed, plus one)`);
  if (seen < 2) problems.push(`${tag}: only ${seen} questions of the kind came`);
  const again = [...packs.entries()].filter(([, n]) => n > 1);
  if (again.length) problems.push(`${tag}: voice packs fetched twice: ${again.map(([u]) => u.split('/').pop()).join(', ')}`);
  const overlaps = await page.evaluate(() => (window as unknown as { __overlaps: string[] }).__overlaps);
  if (overlaps.length) problems.push(`${tag}: clips overlapped: ${overlaps.slice(0, 3).join('; ')}`);
  console.log(`${tag}: ${seen} of the kind, paid ${paid}, ${packs.size} voice packs`);
  await page.close();
}

const kinds = only ? only.split(',') : MODES;
for (const k of kinds) for (const l of [1, 2, 3]) await playKind(k, l).catch(e => problems.push(`${k} L${l}: ${String(e).split('\n')[0]}`));

// ---------- reloads ----------
{
  const { page } = await open(saveFor(null, 1, {}, 0));
  await tap(page, 'Play');
  let done = 0;
  while (done < 2) {
    await ready(page, 'reload Round');
    const p = await question(page);
    if (!p) { await page.waitForTimeout(200); continue; }
    const had = await answered(page);
    if (p.mode === 'meet') await tap(page, 'Go'); else { await answer(page, p, 0); done++; }
    await moved(page, p, had);
  }
  await page.reload(); await page.waitForLoadState('networkidle');
  await page.getByLabel('Start').click();
  await page.waitForTimeout(1500);
  await ready(page, 'after a reload');
  const p = await question(page);
  if (!p) problems.push('a reload in the middle of a Round did not come back to it');
  else { const had = await answered(page); if (p.mode === 'meet') await tap(page, 'Go'); else await answer(page, p, 0); await moved(page, p, had); }
  const stars = await page.evaluate(() => JSON.parse(localStorage.getItem('big-air-place') ?? '{}'));
  console.log(`reload mid-Round: back in the Round with ${JSON.stringify(stars?.round?.results?.length ?? stars).slice(0, 80)} answers kept`);
  await page.close();
}
async function toCard(page: Page) {
  await tap(page, 'Jump'); await page.waitForTimeout(900);
  await page.locator('.js-card').waitFor({ timeout: 10000 });
  await tap(page, 'Jump');
}
async function jumpEnd(page: Page, ms = 60000) {
  await page.locator('.ms-result').waitFor({ timeout: ms }).catch(() => problems.push('a Jump never reached its results'));
}
{
  // reload in the middle of a Jump: back at the Arena, the Jump not used, nothing paid
  const arena = { jumps: 1 };
  const { page } = await open(saveFor(null, 1, arena, 5));
  await tap(page, 'Arena').catch(() => {}); await page.waitForTimeout(800);
  await toCard(page);
  for (let i = 0; i < 100; i++) { const ph = await page.evaluate(() => (window as any).__jump?.phase); if (ph === 'air' || ph === 'land') break; await page.waitForTimeout(100); }
  await page.reload(); await page.waitForLoadState('networkidle'); await page.getByLabel('Start').click(); await page.waitForTimeout(1200);
  const s = await saved(page);
  if (!(await page.locator('.arena-view').count())) problems.push('a reload mid-Jump did not land at the Arena');
  if (s.arena?.jumps !== 1 || (s.balance ?? 0) !== 5) problems.push(`a reload mid-Jump changed things: ${s.arena?.jumps} Jumps, ${s.balance} Bolts`);
  // doing nothing at all: it still ends, is measured, pays and goes home
  await toCard(page);
  const t = Date.now();
  await jumpEnd(page);
  const s2 = await saved(page);
  console.log(`a Jump with no input: ${((Date.now() - t) / 1000).toFixed(0)}s, ${s2.arena?.records?.[0]?.feet} ft, paid ${(s2.balance ?? 0) - 5}, Jumps left ${s2.arena?.jumps}`);
  if (!s2.arena?.jumped || (s2.balance ?? 0) <= 5) problems.push('a Jump with no input did not pay or count');
  await page.waitForTimeout(6000);
  await tap(page, 'Arena');
  await page.waitForTimeout(800);
  await page.close();
}
{
  // mashing: every control, over and over, all through a Jump; and the leave button pressed once in the middle
  const { page } = await open(saveFor(null, 1, { jumps: 3, owned: ['part:booster:puff'], truck: { booster: 'part:booster:puff' } }, 0));
  await tap(page, 'Arena').catch(() => {}); await page.waitForTimeout(800);
  for (let round = 0; round < 2; round++) {
    await toCard(page);
    const c = (await page.locator('canvas').boundingBox())!;
    for (let i = 0; i < 400 && !(await page.locator('.ms-result').count()); i++) {
      const x = c.x + ((i * 97) % 100) / 100 * c.width, y = c.y + ((i * 53) % 100) / 100 * c.height;
      await page.mouse.click(x, y).catch(() => {});
      if (i % 7 === 0) await page.locator('.js-act').first().dispatchEvent('pointerdown').catch(() => {});
      if (i % 9 === 0) await page.keyboard.press(['Space', 'ArrowLeft', 'ArrowRight', 'b'][i % 4]!).catch(() => {});
      if (i === 40 && round === 1) await page.getByRole('button', { name: 'Leave', exact: true }).click().catch(() => {});
    }
    await jumpEnd(page, 30000);
    await page.waitForTimeout(500);
    for (let i = 0; i < 20; i++) { await page.mouse.click(c.x + c.width / 2, c.y + c.height / 3).catch(() => {}); }
    await page.waitForTimeout(6000);
    await tap(page, 'Arena').catch(() => problems.push('no way back to the Arena after a mashed Jump'));
    await page.waitForTimeout(800);
  }
  const s = await saved(page);
  console.log(`mashed two Jumps: ${s.arena?.jumped} taken, ${s.balance} Bolts, record ${s.arena?.records?.[0]?.feet} ft`);
  await page.close();
}
// ---------- the same jump at 60 and at 20 frames a second, and at 144 ----------
async function heldJump(fps: number | undefined, hold: boolean) {
  const { page } = await open(saveFor(null, 1, { jumps: 1, owned: ['part:engine:v6'], truck: { engine: 'part:engine:v6' } }, 0), fps);
  await tap(page, 'Arena').catch(() => {}); await page.waitForTimeout(800);
  await toCard(page);
  // the pedal held from the lights (the Jump listens for keys once it starts)
  for (let i = 0; i < 100 && !(await page.evaluate(() => !!(window as any).__jump)); i++) await page.waitForTimeout(20);
  if (hold) await page.keyboard.down('Space');
  await jumpEnd(page, 90000);
  if (hold) await page.keyboard.up('Space');
  const feet = await page.evaluate(() => (window as any).__jump?.feet);
  await page.close();
  return feet as number;
}
const rates: Record<string, number> = {};
for (const hold of [false, true]) for (const fps of [undefined, 20, 144]) rates[`${hold ? 'pedal held' : 'no input'} @${fps ?? 'native'}`] = await heldJump(fps, hold);
console.log('same jump, different frame rates:', JSON.stringify(rates));
const byHold = (h: string) => new Set(Object.entries(rates).filter(([k]) => k.startsWith(h)).map(([, v]) => v));
if (byHold('no input').size !== 1 || byHold('pedal held').size !== 1) problems.push(`frame rate changed the distance: ${JSON.stringify(rates)}`);

console.log(notes.length ? `NOTES:\n${notes.join('\n')}` : 'no notes');
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
