// Plays Math Bots in a real browser: one full Round of every kind at every Level it can reach, each with a miss, and the
// Meetings, Home and the reward, with screenshots. Answers are read from the page, so it plays like a child who taps.
//   npm run dev:math-bots   (in another shell)
//   npx tsx tools/math-bots/tour.ts <url> <outDir>
// The fight itself has its own tour, against the production build: tools/math-bots/fight-tour.ts.
import { chromium, type Page } from 'playwright';

const [url = 'http://localhost:5199/', out = '/tmp/math-bots-shots', only] = process.argv.slice(2);
const MODES = ['ten', 'on', 'story', 'facts', 'tens', 'part', 'skip', 'scale', 'over'];
const ALL_MET = ['frame', 'path', 'bond', 'rod', 'same', 'signs'];
const rows = (asked: number) => Object.fromEntries(['ten', 'on', 'facts', 'tens', 'story'].map(a => [a, { asked, clean: 0, misses: 0 }]));
const modes = (open: string[], level: number) => Object.fromEntries(MODES.map(m => [m, { level: open.includes(m) ? level : 1, window: open.includes(m) ? ['clean', 'clean', 'clean'] : [], opened: open.includes(m), starred: false, introPending: false, fresh: false }]));
const saveFor = (open: string[], level: number, met = ALL_MET) => ({ version: 1, balance: 3, learning: { modes: modes(open, level), pushed: Object.fromEntries(MODES.map(m => [m, 40])), facts: { strength: {}, since: 0 }, met, tuneUp: rows(3) } });

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];

async function open(save: unknown, viewport = { width: 1180, height: 820 }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, hasTouch: viewport.width < 700 });
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
const shot = async (page: Page, name: string) => { await page.screenshot({ path: `${out}/${name}.png` }); };

async function tapNumber(page: Page, n: string) {
  const strip = page.locator(`.strip .num[aria-label="${n}"]`);
  if (await strip.count()) { await strip.click(); return; }
  const choice = page.locator('.choices .choice', { hasText: new RegExp(`^${n}$`) });
  if (await choice.count()) { await choice.first().click(); return; }
  if (await page.locator('.numwheel').count()) {
    const v = Number(n), [t, o] = [Math.floor(v / 10), v % 10];
    for (let i = 0; i < t; i++) await page.getByLabel('tens up').click();
    for (let i = 0; i < o; i++) await page.getByLabel('ones up').click();
    await page.getByLabel('Done').click();
    return;
  }
  throw new Error(`nowhere to tap ${n}`);
}

/** A wrong answer he could really tap for this question, or null when it has no way to be wrong yet. */
function wrongFor(q: Record<string, unknown>): string | null {
  if (q.input === 'cards') return String((Number(q.answer) + 1) % 3);
  if (q.input === 'sign') return q.answer === '<' ? '>' : '<';
  if (q.input === 'same') return q.answer === 'same' ? 'pick:not' : 'same';
  const traps = (q.traps as { value: string }[]) ?? [], choices = q.choices as number[] | undefined;
  if (choices) return String(choices.find(c => String(c) !== q.answer));
  return traps.find(t => Number(t.value) <= 20)?.value ?? (Number(q.answer) === 0 ? '1' : String(Number(q.answer) - 1));
}
async function tapWrong(page: Page, q: Record<string, unknown>, w: string) {
  if (q.input === 'cards') await page.locator('.cards .choice').nth(Number(w)).click();
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
          const w2 = p.q!.input === 'same' || p.q!.input === 'cards' || p.q!.input === 'sign' ? null : p.q!.choices ? String((p.q!.choices as number[]).find(c => String(c) !== p.q!.answer && String(c) !== String(w) && c !== Number(w))) : String(Number(w) === 0 ? 2 : Number(w) === 1 ? 3 : Number(w) - 1 === Number(p.q!.answer) ? Number(w) + 1 : Number(w) - 1);
          if (w2 !== null) {
            await tapWrong(page, p.q!, w2);
            await page.waitForTimeout(1500);
            await shot(page, `${tag}-${name}-teach-a`);
            await page.waitForTimeout(2000);
            await shot(page, `${tag}-${name}-teach-b`);
            await page.waitForTimeout(2000);
            await shot(page, `${tag}-${name}-teach`);
            await settled(page, 30000);
            await page.waitForTimeout(1700);
          }
        }
      }
    }
    await solve(page, p).catch(e => problems.push(`${tag} ${name}: ${String(e).slice(0, 160)}`));
    await page.waitForTimeout(1900);
  }
  if (!await ended(page)) problems.push(`${tag}: the Round did not finish`);
}

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
    const home = await open(saveFor(['ten', 'on', 'story', 'facts', 'tens', 'part', 'skip', 'scale', 'over'], 2), viewport);
    await shot(home, `${tag}-home`);
    await home.close();
    for (const mode of ['story', 'on', 'scale', 'tens', 'over', 'skip']) for (const lvl of [2, 3]) {
      const page = await open(saveFor([mode], lvl), viewport);
      await page.getByLabel('Play').first().click();
      await page.waitForTimeout(2500);
      const fits = await page.evaluate(() => { const g = document.querySelector('.game.math'); return g ? { over: g.scrollHeight - g.clientHeight, wide: document.documentElement.scrollWidth - innerWidth } : null; });
      console.log(tag, mode, lvl, JSON.stringify(fits));
      await shot(page, `${tag}-${mode}-${lvl}`);
      await page.close();
    }
  }
} else {
  for (const mode of only ? [only] : MODES) for (const lvl of [1, 2, 3]) {
    const page = await open(saveFor([mode], lvl));
    await page.getByLabel('Play').first().click();
    await playRound(page, 'q', seen);
    await page.close();
    console.log(mode, lvl, 'done', seen.size, 'shapes,', problems.length, 'problems');
  }
}
console.log([...seen].sort().join('\n'));
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'no problems');
await browser.close();
