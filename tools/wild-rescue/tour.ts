// Plays Wild Rescue in a real browser, as a child who taps: the Start screen and Home, a whole Round (with one deliberate miss in every
// kind it meets, so a lesson runs, and then the same question answered again: it must still take taps), the end of the Round, a
// purchase in the Garage, a whole Rescue (the call, the drive to the animal, the job, the ride home) and placing the animal in the
// Park (a wrong habitat first, as a child might, then its own), with screenshots. Answers are read from the page (window.__round in
// dev), and every tap waits for the question and its choices to be said first.
//   npm run dev:wild-rescue   (in another shell)
//   npx tsx tools/wild-rescue/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a
// brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=1|2|3 picks another), some Paw Prints and a few habitats.
import { mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const [url = 'http://localhost:5196/', out = 'tour-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['home', 'parts', 'alive', 'baby', 'sky'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 30,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])),
  },
  // a few animals home already, and the forest's gear, so the next call goes somewhere new
  rescue: {
    owned: ['habitat:farm', 'habitat:grassland', 'habitat:forest', 'tires:mud', 'carrier:big'], truck: { tires: 'mud', carrier: 'big' }, calls: 1, trips: 3,
    park: ['sheep', 'chicken', 'lion'], holding: null, released: 0, goal: null,
  },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;

const browser = process.env.TOUR_BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true });
await page.addInitScript(() => {
  const w = window as unknown as { __clips: number }, start = AudioBufferSourceNode.prototype.start;
  w.__clips = 0;
  AudioBufferSourceNode.prototype.start = function (...a: Parameters<typeof start>) { if ((this.buffer?.duration ?? 0) > .05) w.__clips++; return start.apply(this, a); };
});
page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('wild-rescue-place');
  if (s) localStorage.setItem('wild-rescue-save', JSON.stringify(s)); else localStorage.removeItem('wild-rescue-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${viewName}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.wr');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button, [role=button]')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      if (document.querySelector('.reward') && el.closest('.card')) continue; // the last question, under the end of the Round
      if (el.closest('.rs-call,.rs-result') === null && document.querySelector('.rs-call,.rs-result') && el.closest('.rescue-screen')) continue; // under the call card
      const label = el.getAttribute('aria-label') ?? el.className.toString();
      // a tile in a scrolling tray is reached by scrolling it: only the tray itself has to be on screen
      const scroller = el.parentElement?.closest('.wr-tray') as HTMLElement | null;
      const box = scroller ? scroller.getBoundingClientRect() : r;
      if (box.right > innerWidth + 1 || box.bottom > innerHeight + 1 || box.left < -1 || box.top < -1) out.push(`off screen: ${label}`);
      if (r.height < 43.5 || r.width < 43.5) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 8).join('; ')}`);
}

type Q = { mode: string; level: number; replay?: boolean; q: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.wr[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
const tapKey = (key: string) => page.locator(`.choice-main[data-key="${key}"]`).first().click();
const tapPart = (part: string) => page.locator(`.part-hit[data-part="${part}"] > *`).first().click(); // one of its shapes: a part drawn in pieces (fins) has body between them

/** The right answer, or (miss) a wrong one a child might give. */
async function answer(p: NonNullable<Q>, miss: boolean) {
  const q = p.q;
  if (q.kind === 'parts' && q.form === 'tap') {
    if (!miss) return tapPart(q.answer);
    const other = await page.locator('.part-hit').evaluateAll((els, right) => els.map(e => e.getAttribute('data-part')).find(x => x !== right), q.answer);
    return tapPart(other!);
  }
  if (q.kind === 'alive' && q.form === 'needs') {
    const right: string[] = q.answer.split('+'), picked = await page.locator('.choice-card.picked .choice-main').evaluateAll(els => els.map(e => e.getAttribute('data-key')));
    const want = miss ? [...right.slice(0, -1), (q.choices as string[]).find(c => !right.includes(c))!] : right;
    for (const k of q.choices as string[]) if (want.includes(k) !== picked.includes(k)) await tapKey(k);
    return tap('Done');
  }
  const wrong = (q.choices as string[]).find(c => c !== q.answer)!;
  return tapKey(miss ? wrong : q.answer);
}

// ---------- Start and Home ----------
await page.goto(url);
await shot('start');
await page.getByLabel('Start').click({ timeout: 30000 });
await page.waitForTimeout(800);
await shot('home');

// ---------- a Round (TOUR_ROUNDS more of them, to meet more kinds) ----------
await tap('Play');
let asked = 0;
const seen = new Set<string>(), missedKinds = new Set<string>();
const ROUNDS = Number(process.env.TOUR_ROUNDS ?? 1);
for (let r = 0; r < ROUNDS; r++) {
if (r > 0) { await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }); await tap('Play again'); await page.waitForTimeout(500); }
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready();
  const id = `${p.mode}-L${p.level}-${p.q.form}`;
  seen.add(id);
  await shot(`q${++asked}-${id}`);
  // one deliberate miss in every kind he meets, then the same question again: it must still take taps after the lesson
  const miss = !missedKinds.has(p.mode) && !p.replay;
  await answer(p, miss);
  if (miss) {
    missedKinds.add(p.mode);
    await page.waitForTimeout(1800);
    await shot(`q${asked}-lesson`);
    await ready(60000);
    await answer(p, false);
  }
  // wait for this question to go
  for (let i = 0; i < 160; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
}
}
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
await shot('round-done-awake');

// ---------- the Garage: buy something ----------
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('wild-rescue-save') ?? '{}'));
await tap('Garage');
await page.waitForTimeout(1200);
await shot('garage');
const balance = (await saved()).balance ?? 0;
await page.getByRole('tab', { name: 'Lights' }).click();
await page.waitForTimeout(300);
await tap('Roof Light');
await page.waitForTimeout(600);
await shot('garage-trying');
await tap('Buy');
await page.waitForTimeout(3200);
if (balance >= 6) { if (!(await saved()).rescue?.owned?.includes('lights:roof')) problems.push('the Roof Light was not bought'); }
else {
  await tap('Put it back').catch(() => {});
  await page.getByRole('tab', { name: 'Paint' }).click();
  await tap('Ranger Green');
  await tap('Buy');
  await page.waitForTimeout(3200);
  if (!(await saved()).rescue?.owned?.includes('paint:green')) problems.push(`nothing was bought with ${balance} Paw Prints`);
}
await shot('garage-bought');

// ---------- a Rescue: the call, the drive, the job, home ----------
await tap('Rescue');
await page.waitForTimeout(2500);
await shot('rescue-call');
const before = await saved();
await tap('Go');
await page.waitForTimeout(800);
const canvas = page.locator('.rs-canvas'), box = (await canvas.boundingBox())!;
for (let i = 0; i < 60 && (await page.locator('.rescue-screen.drive').count()); i++) {
  await page.mouse.move(box.x + box.width * .45, box.y + box.height * .5);
  await page.mouse.down();
  await page.waitForTimeout(700);
  if (i % 2 === 1 && await page.getByRole('button', { name: 'Jump' }).count()) await page.getByRole('button', { name: 'Jump' }).dispatchEvent('pointerdown');
  await page.waitForTimeout(400);
  await page.mouse.up();
  if (i === 3) await shot('rescue-driving');
}
const drove = await page.evaluate(() => (window as unknown as { __rescue?(): { t: number; frames: number; job: { kind: string } } }).__rescue?.());
if (drove) console.log(`drive: ${drove.t.toFixed(1)}s in ${drove.frames} frames, job ${drove.job.kind}`);
await page.waitForSelector('.rescue-screen.job', { timeout: 120000 }).catch(() => problems.push('the truck never reached the animal'));
await page.waitForTimeout(1500);
await shot('rescue-job');
for (let i = 0; i < 12 && (await page.locator('.rescue-screen.job').count()); i++) {
  // by touch, as on the iPad: the Rescue screen stops touchstart, so a control that waits for click never hears it
  if (await page.locator('.net').count()) await page.locator('.net').tap();
  else if (await page.getByRole('button', { name: 'Winch' }).count()) await page.getByRole('button', { name: 'Winch' }).tap();
  else if (await page.locator('.treat.next').count()) await page.locator('.treat.next').tap();
  await page.waitForTimeout(1100);
}
await shot('rescue-loaded');
const after = await saved();
if (after.rescue?.trips !== (before.rescue?.trips ?? 0) + 1) problems.push('the Rescue was not counted');
if (!after.rescue?.holding && !after.rescue?.released) problems.push('no animal was brought home');
await page.waitForSelector('.park-screen', { timeout: 40000 }).catch(() => problems.push('the ride home never reached the Park'));
await page.waitForTimeout(1500);
await shot('park-holding');

// ---------- the Park: a wrong habitat first, then its own ----------
const held: string | null = (await saved()).rescue?.holding ?? null;
if (held) {
  const plots = await page.locator('.plot-base').evaluateAll(els => els.map(e => e.getAttribute('aria-label')));
  // the first plot that isn't its home: it shakes its head and stays in his hands
  const homes: Record<string, string> = await page.evaluate(() => (window as unknown as { __homes?: Record<string, string> }).__homes ?? {});
  const right = homes[held];
  const wrongPlot = plots.find(l => l && l !== right)!;
  await page.getByRole('button', { name: wrongPlot, exact: true }).click({ position: { x: 8, y: 8 } }); // a corner: the animals living there stand in the middle
  await page.waitForTimeout(1500);
  await shot('park-not-here');
  if ((await saved()).rescue?.holding !== held) problems.push('a wrong habitat took the animal');
  await page.waitForTimeout(3500);
  await shot('park-hint');
  await page.getByRole('button', { name: right!, exact: true }).click({ position: { x: 8, y: 8 } });
  await page.waitForTimeout(3000);
  await shot('park-placed');
  const s = await saved();
  if (s.rescue?.holding || !s.rescue?.park?.includes(held)) problems.push(`the ${held} was not placed in the Park`);
  // tap it (its "did you know"), then feed it
  // the animals wander, so a tap lands wherever it is now
  const name = await page.evaluate(id => (window as unknown as { __names?: Record<string, string> }).__names?.[id] ?? id, held);
  const pet = () => page.getByRole('button', { name, exact: true }).first().click({ force: true });
  await pet();
  await page.waitForTimeout(1200);
  await tap('Feed');
  await pet();
  await page.waitForTimeout(800);
  await shot('park-fed');
}

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
console.log(`${viewName} ${process.env.TOUR_SAVE ?? 'fresh'}${save ? ` L${LEVEL}` : ''}: ${asked} questions (${[...seen].join(', ')}), missed and retried in ${[...missedKinds].join(', ')}, rescued ${held ?? '(a release)'}, ${clips} voice clips played`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
