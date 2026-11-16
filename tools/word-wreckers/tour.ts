// Plays Word Wreckers in a real browser, as a child who taps: the Start screen and Home, a whole Round (meeting a Pattern when one is
// due, hearing the word again several times without it counting against him, one deliberate miss in every kind it meets so a lesson
// runs, and then the same question answered: it must still take taps), the end of the Round, a purchase in the Yard, a whole Job by
// touch (pick a machine, knock the building down, choose what to build, drop every piece with the crane) and the Town (drive, honk,
// tap a building), with screenshots. Answers are read from the page (window.__round in dev), and taps wait for the question to be said.
// On the Level 2 and Level 3 saves it also plays a Job with each new kind of thing by touch (the jackhammer, dynamite and its plunger,
// the magnet, a Road Job with the Steamroller or the Cement Mixer), opens a treasure chest, drives the dump truck, opens every Yard tab
// (buying a horn), and in the Town drives through the road features, taps a car and a decoration and honks with his horn.
//   npm run dev:word-wreckers   (in another shell)
//   npx tsx tools/word-wreckers/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a
// brand-new player, or one with every kind open at Level 2 (TOUR_LEVEL=3 for Level 3), every Pattern met, some Bolts and machines.
// The Job is played with real touch events (Chrome DevTools Protocol), as on the iPad: taps, holds and drags, never mouse clicks.
import { mkdirSync } from 'node:fs';
import { chromium, type Locator } from 'playwright';

const [url = 'http://localhost:5195/', out = 'tour-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['build', 'gap', 'chunk', 'fix', 'pick'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2);
const levels = {
  version: 1, balance: 30,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])),
    patterns: ['cvc', 'digraph', 'blend', 'magic-e', 'team', 'r'], sinceMeet: 0, strength: { cvc: 3, digraph: 3, blend: 3, 'magic-e': 3, team: 3, r: 3 },
  },
  // machines of every new kind, districts, traffic, decorations, a horn and road features already, so each new thing can be played
  yard: LEVEL >= 3
    ? {
      owned: ['machine:dozer', 'up:dozer:wide', 'machine:tower', 'street:park', 'street:beach', 'street:snow', 'street:dino', 'machine:magnet', 'machine:mixer', 'machine:dump',
        'traffic:racecar', 'traffic:fireengine', 'traffic:snail', 'deco:fireworks', 'deco:volcano', 'deco:rocket', 'horn:dino'],
      machine: 'dozer', horn: 'dino', jobs: 3, done: 7, town: ['house', 'barn', 'cabin', 'bakery', 'fire', 'school'].map(b => ({ b, gold: b === 'barn' })),
      roads: ['bumps', 'tunnel', 'bubbles', 'fireworkpad', 'confetti', 'sprinkler', 'rainbowarch', 'mud'], treasures: ['coin', 'bone', 'map'],
    }
    : {
      owned: ['machine:digger', 'machine:jackhammer', 'up:jackhammer:bit', 'machine:dynamite', 'machine:dump', 'machine:roller', 'street:park', 'street:farm', 'street:fair',
        'traffic:taxi', 'traffic:tractor', 'deco:trees', 'deco:rocket', 'deco:birds', 'horn:clown'],
      machine: 'digger', horn: 'clown', jobs: 4, done: 3, town: [{ b: 'house' }, { b: 'treehouse' }], roads: ['ramp', 'carwash', 'turbo', 'loop'], treasures: ['coin'],
    },
};
/** The extra Jobs each save plays, by the machine picked: one of each new kind across the two saves. */
const EXTRA_JOBS = process.env.TOUR_SAVE !== 'levels' ? [] : LEVEL >= 3 ? ['Magnet Crane', 'Cement Mixer'] : ['Jackhammer', 'Dynamite Truck', 'Steamroller'];
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true, isMobile: false });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await page.addInitScript(() => {
  const w = window as unknown as { __clips: number }, start = AudioBufferSourceNode.prototype.start;
  w.__clips = 0;
  AudioBufferSourceNode.prototype.start = function (...a: Parameters<typeof start>) { if ((this.buffer?.duration ?? 0) > .05) w.__clips++; return start.apply(this, a); };
});
page.on('pageerror', e => problems.push(`pageerror: ${e.message} ${(e.stack ?? '').split('\n').slice(1, 3).join(' ')}`));
page.on('console', m => { if (m.type() === 'error' && !/favicon|manifest|MIME/.test(m.text())) problems.push(`console: ${m.text()}`); });
await page.addInitScript(s => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.removeItem('word-wreckers-place');
  if (s) localStorage.setItem('word-wreckers-save', JSON.stringify(s)); else localStorage.removeItem('word-wreckers-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${viewName}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.ww');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    const overlay = document.querySelector('.reward,.job-card-wrap');
    for (const el of document.querySelectorAll('button, [role=button]')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      if (overlay && !overlay.contains(el)) continue; // under the end of the Round or a Job's card
      const label = el.getAttribute('aria-label') ?? el.className.toString();
      // a tile in a scrolling tray is reached by scrolling it: only the tray itself has to be on screen
      const scroller = el.parentElement?.closest('.ww-tray,.job-card-wrap') as HTMLElement | null;
      const box = scroller ? scroller.getBoundingClientRect() : r;
      if (box.right > innerWidth + 1 || box.bottom > innerHeight + 1 || box.left < -1 || box.top < -1) out.push(`off screen: ${label}`);
      if (r.height < 43.5 || r.width < 43.5) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 8).join('; ')}`);
}

// ---------- touch, as on the iPad ----------
const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
async function centre(l: Locator) { const b = (await l.boundingBox())!; return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
async function tapAt(x: number, y: number) { await touch('touchStart', x, y); await page.waitForTimeout(60); await touch('touchEnd'); }
async function tapEl(l: Locator) { const c = await centre(l); await tapAt(c.x, c.y); }
/** Taps it if it's there: a control that goes away when the Job moves on. */
async function tapIf(l: Locator) { const b = await l.boundingBox({ timeout: 300 }).catch(() => null); if (b) await tapAt(b.x + b.width / 2, b.y + b.height / 2); return !!b; }
async function holdIf(l: Locator, ms: number) { const b = await l.boundingBox({ timeout: 300 }).catch(() => null); if (!b) return false; await touch('touchStart', b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(ms); await touch('touchEnd'); return true; }
async function holdEl(l: Locator, ms: number) { const c = await centre(l); await touch('touchStart', c.x, c.y); await page.waitForTimeout(ms); await touch('touchEnd'); }
async function drag(from: { x: number; y: number }, to: { x: number; y: number }, ms = 400) {
  await touch('touchStart', from.x, from.y);
  for (let i = 1; i <= 8; i++) { await touch('touchMove', from.x + (to.x - from.x) * i / 8, from.y + (to.y - from.y) * i / 8); await page.waitForTimeout(ms / 8); }
  await touch('touchEnd');
}

// ---------- a Round ----------
type Q = { mode: string; level: number; replay?: boolean; q: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.ww[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click();
/** Marks the voice log (window.__said, dev only) where the tour moved to another screen. */
/** Waits (up to `ms`) until nothing is being said, as a child waits for the voice before tapping. */
async function quiet(ms = 9000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    const done = await page.evaluate(() => { const l = ((window as unknown as { __said?: { end?: number; phrase?: string; at: number }[] }).__said ?? []).filter(x => x.phrase); const last = l.at(-1); return !last || (last.end !== undefined && performance.now() - last.end > 350); });
    if (done) return;
    await page.waitForTimeout(150);
  }
}
const mark = (name: string) => page.evaluate(n => ((window as unknown as { __said?: object[] }).__said ??= []).push({ mark: n, at: performance.now() }), name);
const tile = (t: string) => page.locator(`.rack .ltile[data-tile="${t}"]:not(.used):not(.wrong)`).first();
const placed = () => page.locator('.ww-work .frame .cell:not(.empty)').count();

/** The right answer, or (miss) a wrong one a child might give. Build It and Chunks carry on from what's in the boxes already. */
async function answer(p: NonNullable<Q>, miss: boolean) {
  const q = p.q;
  if (p.mode === 'meet') return tap('Go');
  if (q.kind === 'build' || q.kind === 'chunk') {
    const pieces: string[] = q.kind === 'build' ? [...(q.word as string)] : q.parts;
    // the boxes may already hold letters (a lesson drops one in): count the pieces placed from the letters there
    const have = await placed();
    let k = 0, letters = 0;
    while (k < pieces.length && letters + (pieces[k]!.replace('_e', '').length + (pieces[k]!.endsWith('_e') ? 1 : 0)) <= have) { letters += pieces[k]!.replace('_e', '').length + (pieces[k]!.endsWith('_e') ? 1 : 0); k++; }
    if (miss) {
      const wrong = (q.tiles as string[]).find(t => t !== pieces[k]);
      if (wrong) return tile(wrong).click();
    }
    for (; k < pieces.length; k++) { await tile(pieces[k]!).click(); await page.waitForTimeout(120); }
    return;
  }
  if (q.kind === 'gap') return tile(miss ? (q.choices as string[]).find(c => c !== q.answer)! : q.answer).click();
  if (q.kind === 'pick') return page.locator(`.spelling[data-key="${miss ? (q.choices as string[]).find(c => c !== q.word) : q.word}"]`).click();
  // Fix It
  const m = q.mistake;
  if (m.kind === 'swap') {
    const boxes = page.locator('.ww-work .frame > button.sbox');
    if (miss) return boxes.nth(m.box === 0 ? 1 : 0).click();
    if (!(await page.locator('.ww-work .frame > button.sbox.open').count())) { await boxes.nth(m.box).click(); await page.waitForTimeout(300); }
    return tile(m.right).click();
  }
  if (m.kind === 'add') {
    if (miss) return page.locator(`.fixl[data-at="${m.at === 0 ? 1 : 0}"]`).click();
    return page.locator(`.fixl[data-at="${m.at}"]`).click();
  }
  if (miss) return page.locator(`.gapbtn[data-gap="${m.at === 0 ? 2 : 0}"]`).click();
  if (!(await page.locator('.gapbtn.open').count())) { await page.locator(`.gapbtn[data-gap="${m.at}"]`).click(); await page.waitForTimeout(300); }
  return tile(m.letter).click();
}

await page.goto(url);
await shot('start');
await page.getByLabel('Start').click({ timeout: 30000 });
await page.waitForTimeout(800);
await shot('home');
await tap('Play');
let asked = 0, heardAgain = false;
const seen = new Set<string>(), missedKinds = new Set<string>();
for (let guard = 0; guard < 30; guard++) {
  if (await page.locator('.reward h2').isVisible()) break;
  const p = await question();
  if (!p) { await page.waitForTimeout(300); continue; }
  await ready();
  const id = p.mode === 'meet' ? `meet-${p.q.pattern}` : `${p.mode}-L${p.level}${p.q.kind === 'fix' ? `-${p.q.mistake.kind}` : ''}`;
  seen.add(id);
  await shot(`q${++asked}-${id}`);
  // he can hear the word again as often as he likes: it never counts against him
  const hearOnly = p.mode !== 'meet' && !heardAgain;
  if (hearOnly) {
    heardAgain = true;
    for (let i = 0; i < 3; i++) { await tap('Say it again'); await page.waitForTimeout(250); }
    await tap('Hear the word again');
    await page.waitForTimeout(600);
    await ready();
  }
  // one deliberate miss in every kind he meets (not on the hear-again question), then the same question again: it must still take taps
  const miss = p.mode !== 'meet' && !hearOnly && !missedKinds.has(p.mode) && !p.replay;
  const before = await page.locator('.stars span.on').count();
  await answer(p, miss);
  if (miss) {
    missedKinds.add(p.mode);
    await page.waitForTimeout(2200);
    await shot(`q${asked}-lesson`);
    await ready(60000);
    await answer(p, false);
  }
  // wait for this question to go
  for (let i = 0; i < 160; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
  if (hearOnly) {
    const full = await page.locator('.stars span.on:not(.half)').count();
    if (full <= before) problems.push('hearing the word again counted against him');
  }
}
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
await shot('round-done-awake');

// ---------- the Yard: buy something ----------
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('word-wreckers-save') ?? '{}'));
await tap('Yard');
await mark('yard');
await page.waitForTimeout(1200);
await shot('yard');
const balance = (await saved()).balance ?? 0;
const want = balance >= 10 ? { tab: 'Machines', item: 'Skid Steer', key: 'machine:skid' } : { tab: 'Paint', item: 'Safety Orange', key: 'paint:orange' };
await page.getByRole('tab', { name: want.tab }).click();
await page.waitForTimeout(300);
await tap(want.item);
await page.waitForTimeout(600);
await shot('yard-trying');
await tap('Buy');
await page.waitForTimeout(3200);
if (!(await saved()).yard?.owned?.includes(want.key)) problems.push(`the ${want.item} was not bought with ${balance} Bolts`);
await shot('yard-bought');

// ---------- a Job, by touch ----------
const job = () => page.evaluate(() => (window as unknown as { __job?(): any }).__job?.());
const phase = async () => (await job())?.phase as string | undefined;
const actionsPlayed = new Set<string>();
/** Plays a whole Job by touch: picks the machine (by name, or the first offered), knocks the old building down (or paves the road), opens
 *  the treasure chest, drives the dump truck, chooses, builds, and checks it was counted and paid. */
async function playJob(name: string, pick?: string) {
  const before = await saved();
  await page.waitForTimeout(1500);
  await quiet();
  await shot(`${name}-intro`);
  const card = pick ? page.locator(`.pick-machine[aria-label="${pick}"]`) : page.locator('.pick-machine').first();
  if (!(await card.count())) { problems.push(`${name}: no ${pick} on the Job's card`); return; }
  await tapEl(card);
  await page.waitForTimeout(1200);
  await quiet();
  const canvas = page.locator('.job-canvas'), box = (await canvas.boundingBox())!;
  const action = (await job())?.action as string;
  actionsPlayed.add(action);
  for (let i = 0; i < 160 && ['wreck', 'pave'].includes((await phase()) ?? ''); i++) {
    if (action === 'push') await holdIf(page.getByRole('button', { name: 'Push' }), 1200);
    else if (action === 'pave') await holdIf(page.getByRole('button', { name: 'Drive', exact: true }), 1500);
    else if (action === 'bite' || action === 'magnet') { await tapAt(box.x + box.width * (.62 + (i % 4) * .07), box.y + box.height * (.45 + (i % 3) * .12)); await page.waitForTimeout(action === 'magnet' ? 900 : 500); }
    else if (action === 'hammer') { for (let k = 0; k < 6; k++) { if (!(await tapIf(page.getByRole('button', { name: 'Hammer' })))) break; await page.waitForTimeout(90); } }
    else if (action === 'blast') {
      // three sticks on the building, then the plunger
      for (let k = 0; k < 3; k++) { await tapAt(box.x + box.width * (.6 + k * .1), box.y + box.height * (.55 + (k % 2) * .1)); await page.waitForTimeout(250); }
      if (i === 0) await shot(`${name}-sticks`);
      if ((await job())?.sticks === 0) problems.push(`${name}: tapping the building put no dynamite on`);
      await tapIf(page.getByRole('button', { name: 'Plunger' }));
      await page.waitForTimeout(2200);
    }
    else if (i % 2) { await tapAt(box.x + box.width * .5, box.y + box.height * .5); await page.waitForTimeout(1600); }
    else {
      // drag the ball back from where it hangs (just short of the building) and let go
      const bx = box.x + box.width * .45, by = box.y + box.height * .7;
      await drag({ x: bx, y: by }, { x: bx - box.width * .2, y: by - box.height * .15 }, 300);
      await page.waitForTimeout(1600);
    }
    if (i === 2) await shot(`${name}-working`);
  }
  if (['wreck', 'pave'].includes((await phase()) ?? '')) problems.push(`${name}: the ${action} Job never finished (${JSON.stringify(await job())})`);
  // a treasure chest: tap it open, then go on
  if (await page.locator('.chest-btn').count()) {
    await page.waitForTimeout(1500);
    await shot(`${name}-chest`);
    await tapEl(page.locator('.chest-btn'));
    await page.waitForSelector('.treasure-card .big-btn:not(.asleep)', { timeout: 15000 }).catch(() => problems.push(`${name}: the treasure card never let him go on`));
    await shot(`${name}-treasure`);
    await tapEl(page.getByRole('button', { name: 'Haul it away' }));
    await page.waitForTimeout(600);
  } else if ((await job())?.treasure && action !== 'pave') problems.push(`${name}: a treasure was hidden but no chest came out`);
  // his own dump truck: hold ▶ to drive it in, load and away
  if ((await phase()) === 'clear' && (await page.getByRole('button', { name: 'Drive', exact: true }).count())) {
    const h0 = (await job())?.haul ?? 0;
    await holdIf(page.getByRole('button', { name: 'Drive', exact: true }), 1200);
    if (!(((await job())?.haul ?? 0) > h0)) problems.push(`${name}: holding ▶ did not drive the dump truck`);
    await shot(`${name}-haul`);
    for (let i = 0; i < 8 && (await phase()) === 'clear'; i++) await holdIf(page.getByRole('button', { name: 'Drive', exact: true }), 1200);
  }
  await page.waitForSelector('.build-choice:not(.waiting), .job-card.done', { timeout: 40000 }).catch(() => problems.push(`${name}: never got to choose what to build`));
  if (await page.locator('.build-choice').count()) {
    await shot(`${name}-choose`);
    await tapEl(page.locator('.build-choice').first());
    await page.waitForTimeout(1500);
  }
  for (let i = 0; i < 40 && (await phase()) === 'build'; i++) {
    // move the hook somewhere (sloppy), and let go
    const x = box.x + box.width * (.25 + (i % 5) * .12), y = box.y + box.height * .3;
    await drag({ x, y }, { x: x + box.width * .05, y }, 200);
    await page.waitForTimeout(1300);
    if (i === 1) await shot(`${name}-building`);
  }
  if ((await phase()) !== 'done') problems.push(`${name}: the building never went up (${JSON.stringify(await job())})`);
  await page.waitForTimeout(2500);
  await shot(`${name}-done`);
  const after = await saved();
  if (after.yard?.done !== (before.yard?.done ?? 0) + 1) problems.push(`${name}: the Job was not counted`);
  const grew = (after.yard?.town?.length ?? 0) > (before.yard?.town?.length ?? 0) || (after.yard?.roads?.length ?? 0) > (before.yard?.roads?.length ?? 0) || after.yard?.town?.some((l: { gold: boolean }) => l.gold);
  if (!grew) problems.push(`${name}: nothing joined the Town`);
  if ((after.balance ?? 0) !== (before.balance ?? 0) + 3) problems.push(`${name}: the Job paid ${(after.balance ?? 0) - (before.balance ?? 0)} Bolts, not 3`);
  const hid = (await job())?.treasure;
  if (hid && (await job())?.chest && !after.yard?.treasures?.includes(hid)) problems.push(`${name}: the treasure was not kept`);
}
await tap('Job');
await playJob('job');

// ---------- the Town, by touch ----------
await tapEl(page.getByRole('button', { name: 'Town', exact: true }));
await mark('town');
await page.waitForTimeout(1500);
await shot('town');
const t0 = (await page.evaluate(() => (window as unknown as { __town?(): { x: number } }).__town?.()))?.x ?? 0;
await holdEl(page.getByRole('button', { name: 'Drive', exact: true }), 1200);
const t1 = (await page.evaluate(() => (window as unknown as { __town?(): { x: number } }).__town?.()))?.x ?? 0;
if (!(t1 > t0)) problems.push('holding ▶ did not drive in the Town');
await tapEl(page.getByRole('button', { name: 'Honk', exact: true }));
const tb = (await page.locator('.town-canvas').boundingBox())!;
await tapAt(tb.x + tb.width * .5, tb.y + tb.height * .6);
await page.waitForTimeout(900);
await shot('town-drive');
type TownInfo = { x: number; width: number; roads: { f: string; x: number }[]; cars: { id: string; x: number }[]; decos: { id: string; x: number; y: number; size: number }[]; fired: number; last: string; tapped: string; particles: number };
const townInfo = () => page.evaluate(() => (window as unknown as { __town?(): unknown }).__town?.()) as Promise<TownInfo>;
if (save) {
  // tap a car in the far lane and a decoration on the pavement, driving toward each until it's on screen where nothing covers it
  const view = await page.evaluate(() => { const c = document.querySelector('.town-canvas')!.getBoundingClientRect(); return { w: c.width, h: c.height }; });
  const s = view.h / 640, x0Of = (i: TownInfo) => Math.max(0, Math.min(i.width - view.w / s, i.x + 80 - view.w / s / 2));
  const bare = (x: number, y: number) => page.evaluate(([px, py]) => document.elementFromPoint(px!, py!)?.classList.contains('town-canvas') ?? false, [x, y]);
  async function tapThing(kind: 'car' | 'deco') {
    for (let i = 0; i < 24; i++) {
      const now = await townInfo(), x0 = x0Of(now);
      const things = kind === 'car' ? now.cars.map(c => ({ id: c.id, x: c.x, y: 520 + 40 - 16 })) : now.decos.filter(d => d.y > 400).map(d => ({ id: d.id, x: d.x, y: d.y - d.size * .35 }));
      for (const t of things) {
        const px = tb.x + (t.x - x0) * s, py = tb.y + t.y * s;
        if (px < tb.x + 20 || px > tb.x + view.w - 20 || !(await bare(px, py))) continue;
        await tapAt(px, py); await page.waitForTimeout(700);
        const got = (await townInfo()).tapped;
        if (got !== `${kind}:${t.id}`) problems.push(`tapping the ${t.id} did nothing (${got})`);
        return;
      }
      const near = things.reduce<{ x: number } | null>((a, c) => (!a || Math.abs(c.x - now.x) < Math.abs(a.x - now.x) ? c : a), null);
      if (!near) break;
      await holdEl(page.getByRole('button', { name: near.x > now.x + 80 ? 'Drive' : 'Drive back', exact: true }), 500);
    }
    problems.push(`no ${kind} in the Town on screen to tap`);
  }
  await tapThing('car');
  await tapThing('deco');
  // drive through the road features: each one goes off
  const info = await townInfo();
  if (!info.roads.length) problems.push('no road features in the Town');
  const fired0 = info.fired;
  for (let i = 0; i < 14 && (await townInfo()).fired < fired0 + 2; i++) await holdEl(page.getByRole('button', { name: 'Drive', exact: true }), 1000);
  await shot('town-features');
  if ((await townInfo()).fired < fired0 + 2) problems.push(`driving along the road did not set off the features (${JSON.stringify(await townInfo())})`);
  await page.waitForTimeout(600);
}

// ---------- leaving the Town for the Yard by touch: the lifted finger must not tap whatever is under it there ----------
const machineBefore = (await saved()).yard?.machine;
await tapEl(page.getByRole('button', { name: 'Yard', exact: true }));
await mark('yard-again');
await page.waitForTimeout(900);
if (!(await page.locator('.yard-screen').count())) problems.push('the Yard button in the Town did not go to the Yard');
if ((await saved()).yard?.machine !== machineBefore || (await page.locator('.buybar').count())) problems.push('the tap that left the Town also tapped something in the Yard');

// ---------- every Yard tab, with a horn to try and buy; then a Job with each new kind of machine ----------
if (save) {
  for (const t of ['Horns', 'Streets', 'Decorations', 'Traffic', 'Treasures', 'Machines', 'Upgrades']) {
    await page.getByRole('tab', { name: t }).click();
    await page.waitForTimeout(700);
    await shot(`yard-${t.toLowerCase()}`);
    if (t === 'Traffic') {
      // try a car on: it says what traffic does
      await page.locator('.ww-tile.locked').first().click();
      await page.waitForTimeout(400);
      await quiet();
      await shot('yard-traffic-trying');
      await tap('Put it back');
    }
  }
  await page.getByRole('tab', { name: 'Horns' }).click();
  await page.waitForTimeout(500);
  const coins = (await saved()).balance ?? 0;
  if (coins >= 14) {
    await tap('Duck Quack');
    await page.waitForTimeout(600);
    await tap('Buy');
    await page.waitForTimeout(3200);
    if ((await saved()).yard?.horn !== 'duck') problems.push(`the Duck Quack horn was not bought and put on with ${coins} Bolts`);
  }
  await page.getByRole('tab', { name: 'Treasures' }).click();
  await page.waitForTimeout(400);
  const found = page.locator('.ww-tile.treasure.owned').first();
  if (await found.count()) await found.click(); else problems.push('no treasure on the shelf');
  await page.waitForTimeout(800);
  await mark('extra');
  for (const m of EXTRA_JOBS) {
    if (!(await saved()).yard?.jobs) { problems.push(`no Job left for the ${m}`); break; }
    await page.locator('.yard-screen').count() || await tapEl(page.getByRole('button', { name: 'Yard', exact: true }));
    await page.waitForTimeout(600);
    await tap('Job');
    await playJob(`job-${m.toLowerCase().replace(/ /g, '-')}`, m);
    await tapEl(page.getByRole('button', { name: 'Yard', exact: true }));
    await page.waitForTimeout(1200);
  }
}

// ---------- what was said: every kind of line, in order, never two at once, and nothing from a screen he has left ----------
type Said = { phrase?: string; mark?: string; at: number; ms?: number; end?: number };
const said = await page.evaluate(() => (window as unknown as { __said?: Said[] }).__said ?? []) as Said[];
const lines = said.filter(x => x.phrase), phrases = lines.map(x => x.phrase!);
// a lesson ran after every miss: the short one ("Listen.") or the fuller one, depending on how he has been doing
const LESSON_LINES = ['Listen.', 'Watch me build it.', 'Here is the mistake.', 'A letter is missing here.', 'This one is extra.', 'These letters make one sound.', 'Each sound gets a box.'];
if (missedKinds.size && !phrases.some(x => LESSON_LINES.includes(x))) problems.push('a miss was never taught aloud');
const WANT = ["Let's go!", 'You earned a Job!', 'Tap Job!', 'The Yard!', 'You got', 'A new Job!', 'Knock it down!', 'The lot is clear!', 'What will you build?', 'Move the crane, then let go to drop!', 'You built', 'You earned 3 Bolts!', 'Your Town!'];
// the free horn says it; a bought one just plays its sound. The saves with every new kind say what each one does.
if (!save) WANT.push('Honk honk!');
else WANT.push('A treasure chest!', 'You found', 'Drive the dump truck!', 'Or pave a road!', 'Pave the road!', 'Now the lines!', 'What goes on the road?', 'Treasures', 'Horns', 'It drives around your Town!');
if (save && LEVEL < 3) WANT.push('Tap fast to hammer!', 'Tap the building to put on dynamite!', 'Stand back!', 'Flat!');
if (save && LEVEL >= 3) WANT.push('Tap the building to lift it with the magnet!', 'Clang!', 'Filled!');
for (const want of WANT) {
  if (!phrases.includes(want)) problems.push(`never said "${want}"`);
}
if (!phrases.some(x => x.startsWith('Slowly: '))) problems.push('never said a word slowly');
if (!phrases.some(x => /^You earned \d+ Bolts?!$/.test(x) && x !== 'You earned 3 Bolts!')) problems.push('never said what the Round earned');
// a question's line chains in order: "Build the word", then the word; the word, then "Which sound is missing?" (or the line again,
// when 🔊 was tapped before it finished)
for (const [i, x] of phrases.entries()) {
  if (x === 'Build the word' && phrases[i + 1] !== x && !/^[a-z]+$/.test(phrases[i + 1] ?? '')) problems.push(`"Build the word" was followed by "${phrases[i + 1]}"`);
  if (x === 'Which sound is missing?' && i > 0 && !/^[a-z]+$/.test(phrases[i - 1]!) && phrases[i - 1] !== 'Which sound is missing?') problems.push(`"Which sound is missing?" came after "${phrases[i - 1]}"`);
}
// never two clips at once: each one ends (or is stopped) before the next starts
for (let i = 1; i < lines.length; i++) {
  const a = lines[i - 1]!, b = lines[i]!;
  if (a.end !== undefined && a.end > b.at + 20) problems.push(`"${a.phrase}" and "${b.phrase}" played at once (${Math.round(a.end - b.at)} ms)`);
}
// nothing from the end of the Round once he's in the Yard, and nothing from the Job once he's in the Town
const markedAt = (m: string) => said.find(x => x.mark === m)?.at ?? Infinity;
for (const x of lines) {
  if (x.at > markedAt('yard') + 300 && x.at < markedAt('town') && ['Tap Job!', 'You earned a Job!', 'You kept trying!'].includes(x.phrase!)) problems.push(`"${x.phrase}" from the end of the Round played in the Yard`);
  if (x.at > markedAt('town') + 300 && x.at < markedAt('extra') && ['Off to your Town!', 'You built', 'Nice drop!', 'One more!'].includes(x.phrase!)) problems.push(`"${x.phrase}" from the Job played in the Town`);
}
const clipped = lines.filter(x => x.end !== undefined && x.ms! > 0 && x.end - x.at < x.ms! - 40 && !lines.some(y => y.at >= x.at && y.at <= x.end! + 20 && y !== x));
// (a line cut short with nothing after it is fine when he left the screen; it's only counted)
console.log(`voice: ${lines.length} clips, ${new Set(phrases).size} different lines, ${clipped.length} cut short with nothing after them${clipped.length ? ` (${clipped.slice(0, 6).map(x => x.phrase).join(', ')})` : ''}`);

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
console.log(`${viewName} ${process.env.TOUR_SAVE ?? 'fresh'}${save ? ` L${LEVEL}` : ''}: ${asked} questions (${[...seen].join(', ')}), missed and retried in ${[...missedKinds].join(', ') || 'none'}, Jobs with ${[...actionsPlayed].join(', ')}, ${clips} voice clips played`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
