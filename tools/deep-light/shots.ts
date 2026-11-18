// Screenshots of every Deep Light screen at one size, the same shots under the same names every run, so a design pass can compare
// before and after: Start and Home (new player and a well-played save), each kind at each Level (its question, the lesson after one miss,
// the fuller lesson after a second, then the next questions), the end of a Round, the Dock and its tabs, Dives in a light and a dark
// zone, the end of a Dive, and the Logbook. Math.random is seeded, so each run asks the same questions.
//   npm run dev:deep-light   (in another shell)
//   npx tsx tools/deep-light/shots.ts <url> <outDir> <portrait|landscape|phone|side> [all|kinds|screens|quick|kinds:see,mirror-L2]
import { mkdirSync } from 'node:fs';
import { chromium, type Browser, type Page } from 'playwright';

const [url = 'http://localhost:5185/', out = 'shots', viewName = 'portrait', which = 'all'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const VIEW = VIEWS[viewName as keyof typeof VIEWS];
const MODES = ['see', 'through', 'sound', 'shadow', 'mirror', 'signal'] as const;
const ANIMALS = 'clownfish turtle parrotfish seahorse manta clam tang reefoctopus lanternfish hatchetfish combjelly fireflysquid crystaljelly barreleye spermwhale swordfish anglerfish vampiresquid gulper viperfish loosejaw atolla giantsquid bristlemouth phantomjelly grouper moray lobster anemone nudibranch gpo lionfish flashlightfish pineconefish cleanershrimp urchin seacucumber bobtail cardinalfish tubeworm yeticrab pompeii ventshrimp scalyfoot ventmussel narwhal beluga krill weddell emperor icefish seaangel greenlandshark snailfish dumbo seapig amphipod tripodfish isopod grenadier'.split(' ');
const problems: string[] = [];

const mode = (level: number, opened = true) => ({ level, window: [], opened, starred: false, introPending: false, fresh: false });
const starterDock = { owned: [], fitted: {}, goal: null, dives: 1, photos: [], zone: null, done: 0 };
const richDock = {
  owned: ['hull:r0', 'hull:r1', 'hull:r2', 'hull:r3', 'hull:r4', 'hull:r5', 'hull:r6', 'lights:r0', 'lights:r1', 'lights:r2', 'lights:r3', 'sonar:r0', 'sonar:r1', 'sonar:r2', 'motor:r0', 'motor:r1', 'claw:r0', 'claw:r1', 'flash:r0', 'flash:r1',
    'paint:yellow', 'paint:stripes', 'stripes:none', 'stripes:wave', 'beam:warm', 'beam:cyan', 'horn:toot', 'horn:whale', 'buddy:fish', 'buddy:octopus', 'trail:bubbles', 'trail:glow', 'dock:buoy', 'dock:lighthouse'],
  fitted: { hull: 'r6', lights: 'r3', sonar: 'r2', motor: 'r1', claw: 'r1', flash: 'r1', paint: 'stripes', stripes: 'wave', beam: 'cyan', horn: 'whale', buddy: 'octopus', trail: 'glow' },
  goal: null, dives: 3, photos: ANIMALS.filter((_, i) => i % 3 !== 2), zone: null, done: 12,
};
const save = (modes: Record<string, unknown>, dock: unknown, balance = 40) => ({ version: 1, balance, learning: { modes, pushed: Object.fromEntries(MODES.map(m => [m, 40])) }, dock });
const only = (kind: string, level: number) => save(Object.fromEntries(MODES.map(m => [m, mode(m === kind ? level : 1, m === kind)])), starterDock, 0);
const fresh = null;
const rich = save(Object.fromEntries(MODES.map((m, i) => [m, { ...mode(i % 3 + 1), starred: m === 'see' }])), richDock, 64);

async function open(browser: Browser, seed: number, s: unknown) {
  const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true, isMobile: false });
  const page = await context.newPage();
  await page.addInitScript(([seed, s]) => {
    let a = seed as number;
    Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.removeItem('deep-light-place');
    if (s) localStorage.setItem('deep-light-save', JSON.stringify(s)); else localStorage.removeItem('deep-light-save');
  }, [seed, s] as const);
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  await page.goto(url);
  await page.waitForTimeout(600);
  return page;
}
const shot = (page: Page, name: string) => page.screenshot({ path: `${out}/${viewName}-${name}.png` });
async function start(page: Page) { await page.getByLabel('Start').tap({ timeout: 30000 }); await page.waitForTimeout(900); }

type Q = { mode: string; level: number; replay?: boolean; q: Record<string, any> } | null;
const question = (page: Page) => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(page: Page, ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.dl[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const esc = (s: string) => s.replace(/(["\\])/g, '\\$1');

/** The right answer, or (miss) a wrong one, as tools/deep-light/tour.ts gives them. */
async function answer(page: Page, p: NonNullable<Q>, miss: boolean, second = false, turned: number[] = []) {
  const tapKey = (key: string) => page.locator(`.game.dl [data-key="${esc(key)}"]`).first().tap();
  const check = () => page.locator('.game.dl .check-btn').tap();
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
    if (!turned.length) turned.push(...q.lab.mirrors.map((m: { turn: number }) => m.turn));
    if (miss) { await tapKey('m0'); turned[0] = (turned[0]! + 1) % 4; if (turned.join(',') === q.answer) { await tapKey('m0'); turned[0] = (turned[0]! + 1) % 4; } await page.waitForTimeout(150); }
    else {
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

async function nextQuestion(page: Page, p: Q) {
  for (let i = 0; i < 160; i++) { const now = await question(page); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) return; if (await page.locator('.reward h2').isVisible()) return; await page.waitForTimeout(150); }
}

async function kinds(browser: Browser, pick?: string) {
  for (const kind of MODES) for (const level of [1, 2, 3]) {
    if (pick && !pick.split(',').some(o => o === kind || o === `${kind}-L${level}`)) continue;
    const page = await open(browser, 1000 + MODES.indexOf(kind) * 10 + level, only(kind, level));
    await start(page);
    await page.getByRole('button', { name: 'Play', exact: true }).tap();
    const name = `${kind}-L${level}`;
    for (let n = 1; n <= 4; n++) {
      await page.waitForTimeout(300);
      const p = await question(page);
      if (!p) break;
      await ready(page);
      await shot(page, `${name}-q${n}-${p.q.form}`);
      const turned: number[] = [];
      if (n === 1) {
        await answer(page, p, true, false, turned);
        await page.waitForTimeout(1800);
        await shot(page, `${name}-q1-miss1`);
        await ready(page, 60000);
        await answer(page, p, true, true, turned);
        let tried = false;
        for (let i = 0; i < 120; i++) {
          if (await page.locator('.try-btn').count()) { await page.waitForTimeout(300); await shot(page, `${name}-q1-miss2`); tried = true; break; }
          if (await page.locator('.shadow-holder.drag').count()) { await shot(page, `${name}-q1-miss2`); tried = true; break; }
          if (await page.locator('.game.dl[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) break;
          await page.waitForTimeout(200);
        }
        if (!tried) { await page.waitForTimeout(400); await shot(page, `${name}-q1-miss2`); }
        await ready(page, 60000);
      }
      await answer(page, p, false, false, turned);
      await page.waitForTimeout(500);
      if (n === 1) await shot(page, `${name}-q1-right`);
      await nextQuestion(page, p);
      if (await page.locator('.reward h2').isVisible()) break;
    }
    await page.context().close();
    console.log(`${viewName} ${name}`);
  }
}

async function dive(page: Page, name: string) {
  await page.locator('.bay-go .dive-btn').tap();
  type D = { phase: string; t: number; sub: { x: number; y: number }; animals: { x: number; y: number; done: boolean }[] } | null;
  const d = () => page.evaluate(() => (window as unknown as { __dive?(): D }).__dive?.() ?? null);
  const shotsAt = [3, 20, 40];
  let held = false;
  for (let i = 0; i < 80 && (await d())?.phase !== 'dive'; i++) await page.waitForTimeout(150);
  for (let i = 0; i < 600; i++) {
    const s = await d();
    if (!s || s.phase !== 'dive') break;
    const m = s.animals.filter(a => !a.done).sort((a, b) => Math.hypot(a.x - s.sub.x, a.y - s.sub.y) - Math.hypot(b.x - s.sub.x, b.y - s.sub.y))[0] ?? s.sub;
    const x = Math.max(70, Math.min(VIEW.width - 110, m.x)), y = Math.max(90, Math.min(VIEW.height - 90, m.y));
    const box = await page.locator('canvas').first().boundingBox();
    if (box) { if (!held) { await page.mouse.move(x, y); await page.mouse.down(); held = true; } else await page.mouse.move(x, y); }
    if (shotsAt.length && s.t > shotsAt[0]!) { await shot(page, `${name}-t${shotsAt.shift()}`); }
    await page.waitForTimeout(150);
  }
  if (held) await page.mouse.up();
  for (let i = 0; i < 60; i++) { if (await page.locator('.dive-done .btns:not(.asleep)').count()) break; await page.waitForTimeout(250); }
  await shot(page, `${name}-done`);
}

/** Home, the Dock and the Logbook only (no Round, no Dive): quick to look at again. */
async function quick(browser: Browser) {
  let page = await open(browser, 7, fresh);
  await shot(page, 'start');
  await start(page); await shot(page, 'home-new');
  await page.getByRole('button', { name: 'Dock' }).tap(); await page.waitForTimeout(1000); await shot(page, 'dock-new');
  await page.context().close();
  page = await open(browser, 11, rich);
  await start(page); await shot(page, 'home-played');
  await page.getByRole('button', { name: 'Dock' }).tap(); await page.waitForTimeout(1000); await shot(page, 'dock');
  await page.getByRole('tab', { name: 'Buddy', exact: true }).tap(); await page.waitForTimeout(300); await shot(page, 'dock-tab-buddy');
  await page.getByRole('button', { name: 'Logbook' }).first().tap(); await page.waitForTimeout(900); await shot(page, 'logbook');
  await page.locator('.log-photo.got').first().tap(); await page.waitForTimeout(700); await shot(page, 'logbook-card');
  await page.context().close();
}

async function screens(browser: Browser) {
  // a new player
  let page = await open(browser, 7, fresh);
  await shot(page, 'start');
  await start(page);
  await shot(page, 'home-new');
  await page.getByRole('button', { name: 'Dock' }).tap(); await page.waitForTimeout(1000);
  await shot(page, 'dock-new');
  await page.getByRole('button', { name: 'Logbook' }).first().tap().catch(() => {});
  await page.waitForTimeout(800);
  if (await page.locator('.log-pages').count()) { await shot(page, 'logbook-new'); await page.getByRole('button', { name: 'Home' }).first().tap(); await page.waitForTimeout(600); await page.getByRole('button', { name: 'Dock' }).tap(); await page.waitForTimeout(800); }
  await dive(page, 'dive-reef');
  await page.context().close();

  // a well-played save
  page = await open(browser, 11, rich);
  await start(page);
  await shot(page, 'home-played');
  // a whole Round, all right
  await page.getByRole('button', { name: 'Play', exact: true }).tap();
  for (let g = 0; g < 12; g++) {
    await page.waitForTimeout(300);
    if (await page.locator('.reward h2').isVisible()) break;
    const p = await question(page); if (!p) continue;
    await ready(page);
    await answer(page, p, false);
    await nextQuestion(page, p);
  }
  await page.waitForTimeout(1500);
  await shot(page, 'round-done');
  await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke'));
  await shot(page, 'round-done-awake');
  await page.locator('.reward').getByRole('button', { name: 'Dock' }).tap();
  await page.waitForTimeout(1200);
  await shot(page, 'dock');
  for (const t of ['Hull', 'Headlights', 'Paint', 'Glow Stripes', 'Buddy', 'The Dock']) {
    await page.getByRole('tab', { name: t, exact: true }).tap(); await page.waitForTimeout(400);
    await shot(page, `dock-tab-${t.toLowerCase().replace(/ /g, '-')}`);
  }
  await page.getByRole('tab', { name: 'Paint', exact: true }).tap(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Orange', exact: true }).tap(); await page.waitForTimeout(600);
  await shot(page, 'dock-trying');
  await page.getByRole('button', { name: 'The Deep Trench', exact: true }).tap(); await page.waitForTimeout(500);
  await dive(page, 'dive-trench');
  await page.locator('.dive-done').getByRole('button', { name: 'Logbook' }).tap(); await page.waitForTimeout(900);
  await shot(page, 'logbook');
  await page.locator('.log-pages').evaluate(el => el.scrollTo(0, el.scrollHeight / 2)); await page.waitForTimeout(300);
  await shot(page, 'logbook-scrolled');
  await page.locator('.log-photo.got').first().tap(); await page.waitForTimeout(700);
  await shot(page, 'logbook-card');
  await page.getByRole('button', { name: 'Close' }).tap(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Home' }).first().tap(); await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Dock' }).tap(); await page.waitForTimeout(800);
  for (const z of ['The Midnight Zone', 'The Crystal Cave']) {
    await page.getByRole('button', { name: z, exact: true }).tap(); await page.waitForTimeout(400);
    await dive(page, `dive-${z.split(' ').pop()!.toLowerCase()}`);
    await page.locator('.dive-done').getByRole('button', { name: 'Dock' }).tap().catch(() => {}); await page.waitForTimeout(900);
    if (!(await page.locator('.bay-go').count())) { await page.getByRole('button', { name: 'Home' }).first().tap().catch(() => {}); await page.waitForTimeout(500); await page.getByRole('button', { name: 'Dock' }).tap(); await page.waitForTimeout(800); }
  }
  await page.context().close();
}

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
try {
  if (which === 'quick') await quick(browser);
  else if (which.startsWith('kinds:')) await kinds(browser, which.slice(6));
  else {
    if (which !== 'kinds') await screens(browser);
    if (which !== 'screens') await kinds(browser);
  }
} catch (e) { problems.push(String(e)); }
await browser.close();
console.log(problems.length ? `${viewName} PROBLEMS:\n${[...new Set(problems)].join('\n')}` : `${viewName} done`);
