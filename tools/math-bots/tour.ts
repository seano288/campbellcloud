// Plays Math Bots in a real browser: one full Round of every kind at every Level it can reach, each with a miss, and the
// Meetings, Home and the reward, with screenshots. Answers are read from the page, so it plays like a child who taps.
//   npm run dev:math-bots   (in another shell)
//   npx tsx tools/math-bots/tour.ts <url> <outDir> [kind|fresh|phone]
// TOUR_BROWSER=webkit plays in WebKit; TOUR_VIEW=phone|side plays at iPhone sizes, short on a 660 point tall screen; TOUR_STRETCH=0|1|2 sets how far each Level has stretched.
// Every speech clip that really starts is counted, and anything too big for the screen is reported.
// The fight itself has its own tour, against the production build: tools/math-bots/fight-tour.ts.
import { chromium, webkit, type Page } from 'playwright';
import { FILLS, type FillId } from '../../src/math-bots/numbers/shapes';

const [url = 'http://localhost:5199/', out = '/tmp/math-bots-shots', only] = process.argv.slice(2);
const MODES = ['ten', 'on', 'story', 'facts', 'tens', 'part', 'skip', 'chart', 'measure', 'shape', 'scale', 'over', 'jump'];
const ALL_MET = ['frame', 'path', 'bond', 'rod', 'same', 'signs', 'chart', 'unit', 'sides', 'fill'];
const rows = (asked: number) => Object.fromEntries(['ten', 'on', 'facts', 'tens', 'story'].map(a => [a, { asked, clean: 0, misses: 0 }]));
const STRETCH_WINDOW = { 0: [], 1: ['clean', 'clean', 'clean'], 2: ['clean', 'clean', 'clean', 'clean', 'clean', 'clean'] }[Number(process.env.TOUR_STRETCH ?? 1) as 0 | 1 | 2];
const VIEW = { ipad: { width: 1180, height: 820 }, short: { width: 1000, height: 660 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } }[process.env.TOUR_VIEW ?? 'ipad' as 'ipad']!;
const modes = (open: string[], level: number) => Object.fromEntries(MODES.map(m => [m, { level: open.includes(m) ? level : 1, window: open.includes(m) ? STRETCH_WINDOW : [], opened: open.includes(m), starred: false, introPending: false, fresh: false }]));
const saveFor = (open: string[], level: number, met = ALL_MET) => ({ version: 2, balance: 3, learning: { modes: modes(open, level), pushed: Object.fromEntries(MODES.map(m => [m, 40])), facts: { strength: {}, since: 0 }, met, tuneUp: rows(3) } });

const browser = process.env.TOUR_BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];

async function open(save: unknown, viewport = VIEW) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, hasTouch: Math.min(viewport.width, viewport.height) < 700 });
  await page.addInitScript(() => {
    const w = window as unknown as { __clips: number }, start = AudioBufferSourceNode.prototype.start;
    w.__clips = 0;
    AudioBufferSourceNode.prototype.start = function (...a: Parameters<typeof start>) { if ((this.buffer?.duration ?? 0) > .05) w.__clips++; return start.apply(this, a); };
  });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
  await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.removeItem('math-bots-place'); if (s) localStorage.setItem('math-bots-save', JSON.stringify(s)); else localStorage.removeItem('math-bots-save'); } }, save);
  await page.goto(url);
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.waitForTimeout(500);
  return page;
}
const ended = (page: Page) => page.locator('.reward h2').isVisible();

/** The page's own question, out of the shared Round: exposed in dev through window.__round. */
const question = (page: Page) => page.evaluate(() => {
  const r = (window as unknown as { __round?(): unknown }).__round?.();
  return r as { mode: string; meeting?: string; level?: number; q?: Record<string, unknown> } | null;
});
const id = (p: { mode: string; meeting?: string; level?: number; q?: Record<string, unknown> }) => (p.mode === 'meet' ? `meet-${p.meeting}` : `${p.mode}-L${p.level}-${p.q?.form ?? p.q?.id ?? ''}`);

async function settled(page: Page, ms = 12000) {
  const started = Date.now();
  while (Date.now() - started < ms) {
    if (await page.evaluate(() => !document.querySelector('.strip.waiting') && !document.querySelector('.card.thinking'))) { await page.waitForTimeout(250); return; }
    await page.waitForTimeout(100);
  }
}
/** What a child would hit and a screenshot might hide: cut-off pictures and buttons too small to tap. */
async function fits(page: Page, name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [], game = document.querySelector('.game.math');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`scrolls ${game.scrollHeight - game.clientHeight}px`);
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    for (const el of document.querySelectorAll('.game.math button, .lock-card button')) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1)) out.push(`off screen: ${(el as HTMLElement).className}`);
      if (r.width && (r.height < 40 || (r.width < 40 && !el.classList.contains('nc')))) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${(el as HTMLElement).className}`);
    }
    const buttons = [...document.querySelectorAll('.game.math button:not(.nc), .lock-card button')].map(el => [el, el.getBoundingClientRect()] as const).filter(([, r]) => r.width);
    buttons.forEach(([a, r], i) => { for (const [b, t] of buttons.slice(i + 1)) if (!a.contains(b) && !b.contains(a) && r.left < t.right - 1 && t.left < r.right - 1 && r.top < t.bottom - 1 && t.top < r.bottom - 1) out.push(`overlap: ${(a as HTMLElement).className || a.getAttribute('aria-label')} and ${(b as HTMLElement).className || b.getAttribute('aria-label')}`); });
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 5).join('; ')}`);
}
const shot = async (page: Page, name: string) => { await fits(page, name); await page.screenshot({ path: `${out}/${name}.png` }); };

async function tapNumber(page: Page, n: string) {
  const cell = page.locator(`.nchart button[aria-label="${n}"]`);
  if (await cell.count()) { await cell.click(); return; }
  const strip = page.locator(`.strip .num[aria-label="${n}"]`);
  if (await strip.count()) { await strip.click(); return; }
  const choice = page.locator('.choices .choice', { hasText: new RegExp(`^${n}$`) });
  if (await choice.count()) { await choice.first().click(); return; }
  if (await page.locator('.numwheel').count()) {
    const v = Number(n), [t, o] = [Math.floor(v / 10), v % 10], now = (await page.locator('.numwheel .digit').allTextContents()).map(Number);
    for (let i = now[0]!; i !== t; i = (i + 1) % 10) await page.getByLabel('tens up').click();
    for (let i = now[1]!; i !== o; i = (i + 1) % 10) await page.getByLabel('ones up').click();
    await page.getByLabel('Done').click();
    return;
  }
  throw new Error(`nowhere to tap ${n}`);
}

/** A wrong answer he could really tap for this question, or null when it has no way to be wrong yet. */
function wrongFor(q: Record<string, unknown>): string | null {
  if (q.input === 'lay') return 'lay';
  if (q.input === 'pick' || q.input === 'tiles' || q.input === 'fill') return (q.traps as { value: string }[])[0]?.value ?? null;
  if (q.input === 'chart') return (q.traps as { value: string }[])[0]!.value;
  if (q.input === 'cards') return String((Number(q.answer) + 1) % 3);
  if (q.input === 'sign') return q.answer === '<' ? '>' : '<';
  if (q.input === 'same') return q.answer === 'same' ? 'pick:not' : 'same';
  const traps = (q.traps as { value: string }[]) ?? [], choices = q.choices as number[] | undefined;
  if (choices) return String(choices.find(c => String(c) !== q.answer));
  return traps.find(t => Number(t.value) <= 20)?.value ?? (Number(q.answer) === 0 ? '1' : String(Number(q.answer) - 1));
}
/** Lays wrenches until this many are down, then ✓. */
async function lay(page: Page, to: number) {
  for (let have = await page.locator('.wrench').count(); have !== to; have += have < to ? 1 : -1) await page.getByLabel(have < to ? 'Lay a wrench' : 'Take one off').click();
  await page.getByLabel('Done').click();
}
const tapPick = async (page: Page, value: string) => {
  if (value === 'big' || value === 'small') await page.getByLabel(value === 'big' ? 'Big wrenches' : 'Small wrenches').click();
  else await page.locator('.m-pick').nth('abc'.indexOf(value)).click();
};
const PIECE_LABEL: Record<string, string> = { triangle: 'Triangle.', square: 'Square.', half: 'Half circle.' };
async function tapWrong(page: Page, q: Record<string, unknown>, w: string) {
  if (q.input === 'lay') await lay(page, (q.len as number) + (w === 'lay' ? 1 : -1));
  else if (q.input === 'pick') await tapPick(page, w);
  else if (q.input === 'tiles') await page.locator('.shape-tile').nth(Number(w.slice(5))).click();
  else if (q.input === 'fill') await page.getByLabel(PIECE_LABEL[w.slice(6)]!).click();
  else if (q.input === 'cards') await page.locator('.cards .choice').nth(Number(w)).click();
  else if (q.input === 'sign') await page.locator(`.signs .choice:text-is("${w}")`).click();
  else if (q.input === 'same') await page.getByLabel(w === 'same' ? 'Same' : 'Not the same', { exact: true }).click();
  else if (q.kind === 'tens' && q.form === 'make') await page.getByLabel('Done').click();
  else await tapNumber(page, w);
}

async function solve(page: Page, p: { mode: string; meeting?: string; q?: Record<string, unknown> }) {
  if (p.mode === 'meet') {
    await page.locator('.meet-stage.pulse').waitFor({ timeout: 30000 });
    const taps = p.meeting === 'path' ? 3 : 1;
    for (let i = 0; i < taps; i++) { await page.locator('.meet-stage').click(); await page.waitForTimeout(250); }
    return;
  }
  const q = p.q!;
  if (q.kind === 'over' && q.form === 'fill' && await page.locator('.frame button.dot').count()) {
    while (await page.locator('.frame button.dot').count() && !await page.locator('.strip').count() && !await page.locator('.choices').count()) {
      const left = await page.locator('.frame button.dot').count();
      if (left <= (q.left as number)) break;
      await page.locator('.frame button.dot').first().click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(300);
    if (q.steps) { await page.locator('.choices .choice', { hasText: `10 + ${q.left}` }).click(); await page.waitForTimeout(400); }
    await page.locator('.strip').waitFor();
    await settled(page);
  }
  if (q.input === 'same') {
    if (q.answer === 'same') { await page.getByLabel('Same', { exact: true }).click(); return; }
    await page.getByLabel('Not the same', { exact: true }).click();
    await page.waitForTimeout(400);
    await shot(page, 'fix-it');
    for (let i = 0; i < 5 && await page.locator('.pan').count(); i++) {
      const add = page.getByLabel('Add a counter');
      if (await add.count()) await add.click(); else break;
      await page.waitForTimeout(350);
    }
    return;
  }
  if (q.input === 'lay') { await lay(page, q.len as number); return; }
  if (q.input === 'pick') { await tapPick(page, q.answer as string); return; }
  if (q.input === 'tiles' && q.form === 'every') {
    for (const i of q.targets as number[]) { await page.locator('.shape-tile').nth(i).click(); await page.waitForTimeout(250); }
    return;
  }
  if (q.input === 'tiles') { await page.locator('.shape-tile').nth(Number((q.answer as string).slice(5))).click(); return; }
  if (q.input === 'fill') {
    for (const p of FILLS[q.fill as FillId].parts) { await page.getByLabel(PIECE_LABEL[p.piece]!).click(); await page.waitForTimeout(250); }
    return;
  }
  if (q.input === 'cards') { await page.locator('.cards .choice').nth(Number(q.answer)).click(); return; }
  if (q.input === 'sign') { await page.locator(`.signs .choice:text-is("${q.answer}")`).click(); return; }
  if (q.kind === 'tens' && q.form === 'make') {
    const n = q.n as number;
    for (let i = 0; i < Math.floor(n / 10); i++) await page.getByLabel('Add a ten').click();
    for (let i = 0; i < n % 10; i++) await page.getByLabel('Add a one').click();
    await page.getByLabel('Done').click();
    return;
  }
  await tapNumber(page, q.answer as string);
}

/** Plays to the end of a Round, missing the first question it can, twice over when `twice`. */
async function playRound(page: Page, tag: string, seen: Set<string>) {
  let missed = false;
  for (let turn = 0; turn < 12 && !await ended(page); turn++) {
    await page.waitForTimeout(350);
    const p = await question(page);
    if (!p) break;
    const name = id(p);
    if (process.env.TOUR_LOG) console.log(turn, name, JSON.stringify(p.q ?? {}).slice(0, 120));
    if (p.q?.kind === 'chart' && !await page.locator(`.nc[data-n="${p.q.answer as string}"]`).count()) problems.push(`${name}: the row of ${p.q.answer as string} is off screen`);
    if (!seen.has(name)) { seen.add(name); await page.waitForTimeout(p.mode === 'meet' ? 1800 : 500); await shot(page, `${tag}-${name}`); }
    if (p.mode !== 'meet') {
      const kind = p.q!.kind;
      if (kind === 'over' && p.q!.form === 'fill') await page.waitForTimeout(3500);
      if (kind === 'tens' && p.q!.form === 'make') await page.waitForTimeout(3000);
      if (kind === 'story') await page.locator('.strip:not(.waiting)').waitFor({ timeout: 30000 });
      await settled(page);
      if (kind !== 'over' || p.q!.form !== 'fill') await page.waitForTimeout(p.q!.input === 'strip' ? 0 : 3500);
      const skipMiss = (kind === 'tens' && p.q!.form === 'make') || (kind === 'over' && p.q!.form === 'fill');
      if (!missed && !skipMiss) {
        const w = wrongFor(p.q!);
        if (w !== null) {
          missed = true;
          await tapWrong(page, p.q!, w);
          await page.waitForTimeout(900);
          await shot(page, `${tag}-${name}-miss1`);
          await settled(page, 20000);
          await page.waitForTimeout(1700);
          const traps = p.q!.traps as { value: string }[];
          const onPicture = ['pick', 'tiles', 'fill', 'chart'].includes(p.q!.input as string);
          const w2 = p.q!.input === 'lay' ? 'lay-short' : onPicture ? traps[1]?.value ?? null : p.q!.input === 'same' || p.q!.input === 'cards' || p.q!.input === 'sign' ? null : p.q!.choices ? String((p.q!.choices as number[]).find(c => String(c) !== p.q!.answer && String(c) !== String(w) && c !== Number(w))) : String(Number(w) === 0 ? 2 : Number(w) === 1 ? 3 : Number(w) - 1 === Number(p.q!.answer) ? Number(w) + 1 : Number(w) - 1);
          if (w2 !== null) {
            await tapWrong(page, p.q!, w2);
            await page.waitForTimeout(1500);
            await shot(page, `${tag}-${name}-teach-a`);
            await page.waitForTimeout(2000);
            await shot(page, `${tag}-${name}-teach-b`);
            await page.waitForTimeout(2000);
            await shot(page, `${tag}-${name}-teach`);
            await settled(page, 30000);
            await page.waitForTimeout(onPicture || p.q!.input === 'lay' ? 14000 : 1700);
          }
        }
      }
    }
    await solve(page, p).catch(e => problems.push(`${tag} ${name}: ${String(e).slice(0, 160)}`));
    await page.waitForTimeout(1900);
  }
  if (!await ended(page)) problems.push(`${tag}: the Round did not finish`);
}

const clipsHeard = (page: Page) => page.evaluate(() => (window as unknown as { __clips: number }).__clips);
const seen = new Set<string>();
const level = async (page: Page) => page.evaluate(() => { const l = JSON.parse(localStorage.getItem('math-bots-save')!).learning; return { levels: Object.fromEntries(Object.entries(l.modes as Record<string, { level: number; opened: boolean }>).filter(([, m]) => m.opened).map(([k, m]) => [k, m.level])), met: l.met, tuneUp: l.tuneUp, balance: JSON.parse(localStorage.getItem('math-bots-save')!).balance }; });

if (only === 'fresh') {
  // A new player, all right answers: Meetings, Tune-Up, placement, the reward, and a reload in the middle of a Round.
  const page = await open(null as unknown as object);
  await shot(page, 'home-fresh');
  for (let round = 1; round <= 4; round++) {
    await page.getByLabel(round === 1 ? 'Play' : 'Play again').first().click({ timeout: 60000 });
    for (let turn = 0; turn < 12 && !await ended(page); turn++) {
      await page.waitForTimeout(350);
      const p = await question(page);
      if (!p) break;
      const name = id(p);
      if (!seen.has(name)) { seen.add(name); await page.waitForTimeout(p.mode === 'meet' ? 2500 : 500); await shot(page, `fresh-${name}`); }
      if (round === 2 && turn === 2) { // the iPad closing the app, in the middle of a Round
        await page.reload();
        await page.getByLabel('Start').click({ timeout: 30000 });
        await page.waitForTimeout(800);
        console.log('reloaded mid-Round; back in a Round:', await page.locator('.round-screen').count() === 1, await page.locator('.stars .on').count(), 'stars kept');
        continue;
      }
      if (p.mode !== 'meet') { await settled(page); await page.waitForTimeout(p.q!.input === 'strip' ? 0 : 3500); if (p.q!.kind === 'story') await page.locator('.strip:not(.waiting)').waitFor({ timeout: 30000 }); }
      await solve(page, p).catch(e => problems.push(`fresh ${name}: ${String(e).slice(0, 160)}`));
      await page.waitForTimeout(1900);
    }
    await page.locator('.reward .btns:not(.asleep)').waitFor({ timeout: 60000 });
    await shot(page, `fresh-end-${round}`);
    console.log('after Round', round, JSON.stringify(await level(page)));
  }
  await page.getByLabel('Workshop').click();
  await page.waitForTimeout(1200);
  await shot(page, 'workshop');
  await page.getByLabel('Home').click();
  await page.waitForTimeout(800);
  await shot(page, 'home-after');
  await page.close();
} else if (only === 'phone') {
  // iPhone both ways round, on the busiest screens
  for (const [tag, viewport] of [['ipad-up', { width: 820, height: 1180 }], ['phone-up', { width: 390, height: 844 }], ['phone-side', { width: 844, height: 390 }]] as const) {
    const home = await open(saveFor(MODES, 2), viewport);
    await shot(home, `${tag}-home`);
    await home.close();
    for (const mode of ['story', 'on', 'scale', 'tens', 'over', 'skip', 'chart', 'jump', 'measure', 'shape']) for (const lvl of [1, 2, 3]) {
      const page = await open(saveFor([mode], lvl), viewport);
      await page.getByLabel('Play').first().click();
      await page.waitForTimeout(2500);
      const fits = await page.evaluate(() => { const g = document.querySelector('.game.math'); return g ? { over: g.scrollHeight - g.clientHeight, wide: document.documentElement.scrollWidth - innerWidth } : null; });
      console.log(tag, mode, lvl, JSON.stringify(fits));
      await shot(page, `${tag}-${mode}-${lvl}`);
      await page.close();
    }
  }
} else if (only === 'oldsave') {
  // A version 2 save exactly as the game wrote it before the four later kinds and Legendaries.
  const nine = ['ten', 'on', 'story', 'facts', 'tens', 'part', 'skip', 'scale', 'over'];
  const old = {
    version: 2, balance: 41,
    learning: {
      modes: Object.fromEntries(nine.map(m => [m, { level: m === 'on' ? 3 : 2, window: ['clean', 'clean'], opened: m !== 'over', starred: false, introPending: false, fresh: false }])),
      pushed: Object.fromEntries(nine.map(m => [m, 20])), facts: { strength: { '5+3': 3 }, since: 1 }, met: ALL_MET.slice(0, 6),
      tuneUp: { ten: { asked: 3, clean: 3, misses: 0 }, on: { asked: 2, clean: 2, misses: 0 }, facts: { asked: 3, clean: 1, misses: 2 }, tens: { asked: 3, clean: 2, misses: 1 }, story: { asked: 1, clean: 1, misses: 0 } },
    },
    workshop: { unlocked: ['paint:1', 'paint:2', 'paint:3', 'drum:1'], gear: { paint: 3, drum: 1, armour: 0, wheels: 0 }, goal: 'wheels:2', fights: 4, ticket: true },
  };
  const page = await open(old);
  await shot(page, 'oldsave-home');
  for (let n = 0; n < 2; n++) {
    await page.getByLabel(n ? 'Play again' : 'Play').first().click({ timeout: 60000 });
    await playRound(page, 'oldsave', seen);
    await page.locator('.reward .btns:not(.asleep)').waitFor({ timeout: 60000 });
    console.log('after Round', n + 1, JSON.stringify(await level(page)));
  }
  await page.getByLabel('Workshop').click();
  await page.waitForTimeout(1200);
  await shot(page, 'oldsave-workshop');
  console.log('workshop', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('math-bots-save')!).workshop)), await clipsHeard(page), 'clips');
  await page.close();
} else if (only === 'meetings') {
  // A child partway through: the old six pictures met, the four new ones still to come.
  for (const [mode, lvl] of [['chart', 1], ['measure', 2], ['shape', 1], ['shape', 3], ['jump', 1]] as const) {
    const page = await open(saveFor([mode], lvl, ALL_MET.slice(0, 6).concat(mode === 'shape' && lvl === 3 ? ['sides'] : [])));
    await page.getByLabel('Play').first().click();
    await playRound(page, 'meet', seen);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('math-bots-save')!).learning.met as string[]);
    console.log(mode, lvl, 'met', after.join(' '), await clipsHeard(page), 'clips');
    await page.close();
  }
} else {
  for (const mode of only ? [only] : MODES) for (const lvl of [1, 2, 3]) {
    const page = await open(saveFor([mode], lvl));
    await page.getByLabel('Play').first().click();
    await playRound(page, `${process.env.TOUR_VIEW ?? 'ipad'}`, seen);
    const heard = await clipsHeard(page);
    if (heard < 10) problems.push(`${mode} L${lvl}: only ${heard} clips started`);
    await page.close();
    console.log(mode, lvl, 'done', seen.size, 'shapes,', heard, 'clips,', problems.length, 'problems');
  }
}
console.log([...seen].sort().join('\n'));
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'no problems');
await browser.close();
