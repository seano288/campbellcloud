// Plays Food Truck in a real browser, as a child who taps and drags: the Start screen and Home, a whole Round (missing twice, on purpose,
// the first question of each kind, so both lessons run, then answering right), the end of the Round, a purchase in the Truck shop, a
// whole Service played with a finger (dragging the base and the toppings, holding to cook, dragging the food up to the customer) to its
// end card, and the Sticker Book's three pages, with screenshots. Answers are read from the page (window.__round in dev), and every tap
// waits for the question to be said first. It fails on buttons off screen or under 44px, a page wider than the screen, a question that
// scrolls, or a Service that doesn't end.
//   npm run dev:food-truck   (in another shell)
//   npx tsx tools/food-truck/tour.ts <url> <outDir>
// TOUR_VIEW=portrait|landscape|phone|side picks the screen (iPad 9 sizes by default: 810×1080 upright). TOUR_SAVE=fresh|levels: a brand-new
// player, or one with every kind open at Level 2 (TOUR_LEVEL=1|2|3 picks another) and 30 Bolts; at Level 3 he hasn't met the ideas yet.
// TOUR_ONLY=<kind> opens only that kind in the levels save, so a Round is all one kind.
// TOUR_ROUNDS=n plays n Rounds first (1 by default), missing on purpose in every kind and form the first time it comes up.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { BUY_NEEDS, GOODS, jobOf, NEEDS, SERVICES, WANTS, type JobId } from '../../src/food-truck/econ/things';

const [url = 'http://localhost:5179/', out = '/tmp/food-truck-shots'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.TOUR_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const MODES = ['need', 'goods', 'job', 'total', 'enough', 'save'];
const LEVEL = Number(process.env.TOUR_LEVEL ?? 2), ONLY = process.env.TOUR_ONLY;
const levels = {
  version: 1, balance: 30,
  learning: {
    modes: Object.fromEntries(MODES.map(m => [m, { level: LEVEL, window: ['clean', 'clean', 'clean', 'clean', 'clean'], opened: !ONLY || m === ONLY, starred: false, introPending: false, fresh: false }])),
    pushed: Object.fromEntries(MODES.map(m => [m, 40])), met: LEVEL === 3 ? [] : ['needs', 'goods', 'money'], // at Level 3 he meets the ideas on the way
    tuneUp: { total: { asked: 3, clean: 3, misses: 0 } },
  },
};
const save = process.env.TOUR_SAVE === 'levels' ? levels : null;
const tag = `${viewName}-${save ? `L${LEVEL}` : 'new'}`;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
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
  localStorage.removeItem('food-truck-place');
  if (s) localStorage.setItem('food-truck-save', JSON.stringify(s)); else localStorage.removeItem('food-truck-save');
}, save);

let n = 0;
const shot = async (name: string) => { await fits(name); await page.screenshot({ path: `${out}/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
/** What a child would hit and a screenshot might hide: a page wider than the screen, buttons off screen or too small to tap. */
async function fits(name: string) {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth - innerWidth > 1) out.push('wider than the screen');
    const game = document.querySelector('.game.ft');
    if (game && game.scrollHeight - game.clientHeight > 2) out.push(`question scrolls ${game.scrollHeight - game.clientHeight}px`);
    for (const el of document.querySelectorAll('button')) {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || style.visibility === 'hidden' || el.closest('.asleep')) continue;
      // inside a scrolling tray, a tile below the fold is fine
      const tray = el.closest('.book-page') ?? el.closest('.ft-tray,.spot-grid,.service-result'); // the book's page scrolls, not its grids
      if (tray) {
        const t = tray.getBoundingClientRect();
        if (t.bottom > innerHeight + 1 || t.right > innerWidth + 1) out.push(`off screen: the ${tray.className} tray`);
        if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
        continue;
      }
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`off screen: ${el.getAttribute('aria-label') ?? el.className}`);
      if (r.height < 43 || r.width < 43) out.push(`small ${Math.round(r.width)}x${Math.round(r.height)}: ${el.getAttribute('aria-label') ?? el.className}`);
    }
    return [...new Set(out)];
  });
  if (bad.length) problems.push(`layout ${name}: ${bad.slice(0, 6).join('; ')}`);
}

type Q = { mode: string; meeting?: string; level?: number; q?: Record<string, any> } | null;
const question = () => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(ms = 30000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.ft[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  problems.push('a question never became ready');
  return false;
}
const tap = (label: string) => page.getByRole('button', { name: label, exact: true }).first().click({ timeout: 8000 });
const THINGS = [...NEEDS, ...WANTS, ...BUY_NEEDS, ...GOODS, ...SERVICES] as readonly { id: string; name: string }[];
const nameOf = (id: string) => THINGS.find(t => t.id === id)!.name;
const jobLabel = (id: string) => jobOf(id as JobId).name.replace(/^the /, '');
const SHELF_LABEL: Record<string, string> = { need: 'Need', want: 'Want', good: 'Goods', service: 'Services' };
const other: Record<string, string> = { need: 'want', want: 'need', good: 'service', service: 'good' };

/** Answers as he would, or misses on purpose: `second` picks a different wrong answer from the first miss, where there is one. */
async function answer(p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q!;
  const wrongOf = (xs: string[]) => { const w = xs.filter(x => x !== String(q.answer)); return (second && w[1]) || w[0]!; };
  const pickOf = (xs: string[]) => (miss ? wrongOf(xs) : String(q.answer));
  switch (q.form) {
    case 'pick': return tap(nameOf(pickOf(q.things)));
    case 'first': return tap(nameOf(pickOf([q.need, q.want])));
    case 'sort': {
      // the things already on a shelf are gone from the counter; the first left is picked for him
      for (const id of q.things as string[]) {
        if (!(await page.getByRole('button', { name: nameOf(id), exact: true }).count())) continue;
        await tap(nameOf(id));
        await tap(SHELF_LABEL[miss ? other[q.shelves[id]]! : q.shelves[id]]!);
        if (miss) return;
        await page.waitForTimeout(150);
      }
      return;
    }
    case 'who': case 'user': return tap(jobLabel(pickOf(q.workers.map((w: { job: string }) => w.job))));
    case 'tool': return tap(jobOf(pickOf(q.tools) as JobId).toolName);
    case 'role': { const a = pickOf(['maker', 'buyer']); return tap(a === 'maker' ? 'maker' : 'shopper'); }
    case 'yesno': case 'both': return tap(pickOf(['yes', 'no']) === 'yes' ? 'Yes' : 'No');
    case 'which': { const id = pickOf(q.items.map((i: { id: string }) => i.id)); const it = q.items.find((i: { id: string }) => i.id === id); return tap(`${id}, ${it.price} dollars`); }
    case 'days': return tap(pickOf(q.choices.map(String)));
    default: return tap(`${pickOf(q.choices.map(String))} dollars`);
  }
}

// ---------- Start and Home ----------
await page.goto(url);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // the dev server can reload once while it prepares its modules
await shot('start');
await page.getByLabel('Start').click({ timeout: 30000 });
await page.waitForTimeout(800);
await shot('home');

// ---------- a Round (TOUR_ROUNDS of them) ----------
await tap('Play');
const missedKinds = new Set<string>(), ROUNDS = Number(process.env.TOUR_ROUNDS ?? 1);
let asked = 0;
for (let r = 1; r <= ROUNDS; r++) {
  if (r > 1) {
    await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
    await tap('Play again');
  }
  for (let guard = 0; guard < 30; guard++) {
    if (await page.locator('.reward h2').isVisible()) break;
    const p = await question();
    if (!p) { await page.waitForTimeout(300); continue; }
    await ready();
    const id = p.mode === 'meet' ? `meet-${p.meeting}` : `${p.mode}-L${p.level}-${p.q?.form ?? ''}`;
    await shot(`q${++asked}-${id}`);
    if (p.mode === 'meet') await tap('Go');
    else {
      const form = `${p.mode}-${p.q?.form}`, miss = !missedKinds.has(form); // one deliberate miss in every kind and form he meets
      await answer(p, miss);
      if (miss) {
        missedKinds.add(form);
        await page.waitForTimeout(1600);
        await shot(`q${asked}-lesson`);
        await ready(40000);
        // miss again, so the fuller second-miss lesson runs (a two-way choice has no second wrong answer: 🔎 runs the same lesson)
        const two = ['pick', 'first', 'role', 'yesno', 'both'].includes(p.q?.form) || (p.q?.form === 'who' && p.mode === 'job');
        if (two) await tap('Help'); else await answer(p, true, true);
        await page.waitForTimeout(2500);
        await shot(`q${asked}-lesson2`);
        await ready(60000);
        await answer(p, false);
      }
    }
    // wait for this question to go
    for (let i = 0; i < 130; i++) { const now = await question(); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
  }
}
await page.waitForTimeout(1500);
await shot('round-done');
await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
await shot('round-done-awake');

// ---------- the Truck: buy something ----------
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('food-truck-save') ?? '{}'));
await tap('Truck');
await page.waitForTimeout(1200);
await shot('truck');
const balance = (await saved()).balance ?? 0;
const [tab, thing, key, price] = balance >= 15 ? ['Trucks', 'Pizza Truck', 'pizza', 15] : ['Paint', 'Mustard Yellow', 'paint:yellow', 3];
await page.getByRole('tab', { name: tab }).click();
await page.waitForTimeout(300);
await tap(thing);
await page.waitForTimeout(600);
await shot('truck-trying');
if (balance >= price) {
  await tap('Buy');
  await page.waitForTimeout(3200);
  const t = (await saved()).truck;
  if (!(key === 'pizza' ? t?.trucks?.includes('pizza') : t?.owned?.includes(key))) problems.push(`${thing} was not bought with ${balance} Bolts`);
  await shot('truck-bought');
} else problems.push(`only ${balance} Bolts after a Round`);

// ---------- a Service, played with a finger ----------
await tap('Open');
await page.waitForTimeout(1000);
await shot('spots');
await tap('Open');
await page.waitForTimeout(1500);
await shot('service');
const canvas = page.locator('.service-canvas');
type Next = { step: { kind: string }; from: { x: number; y: number }; to: { x: number; y: number } | null; hold: boolean } | null;
let moves = 0, wrongOnce = false;
const t0 = Date.now();
while (!(await page.locator('.service-result').count()) && Date.now() - t0 < 240000) {
  const next = await page.evaluate(() => (window as unknown as { __next?(): unknown }).__next?.() as Next);
  const box = (await canvas.boundingBox())!;
  if (!next) { await page.waitForTimeout(300); continue; }
  const at = (p: { x: number; y: number }) => [box.x + p.x, box.y + p.y] as const;
  const [fx, fy] = at(next.from);
  // once, drop a topping that isn't wanted on the food: it should bounce back
  if (!wrongOnce && next.step.kind === 'topping') {
    wrongOnce = true;
    const wrong = await page.evaluate(() => {
      const s = (window as unknown as { __service: { layout: { trays: { id: string; x: number; y: number }[]; spots: { x: number; y: number }[] }; customers: { order: string[] }[] } }).__service;
      const order = s.customers.flatMap(c => c.order);
      const t = s.layout.trays.find(t => t.id !== 'base' && !order.includes(t.id));
      return t ? { from: t, to: s.layout.spots[0]! } : null;
    });
    if (wrong) {
      const [wx, wy] = at(wrong.from), [tx, ty] = at(wrong.to);
      await page.mouse.move(wx, wy); await page.mouse.down(); await page.mouse.move(tx, ty, { steps: 8 }); await page.mouse.up();
      await page.waitForTimeout(700);
      await shot('service-wrong-topping');
      continue;
    }
  }
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  if (next.hold) { await page.waitForTimeout(1500); await page.mouse.up(); }
  else { const [tx, ty] = at(next.to!); await page.mouse.move(tx + 12, ty - 10, { steps: 10 }); await page.mouse.up(); }
  moves++;
  if (moves === 2) await shot('service-cooking');
  if (moves === 6) await shot('service-serving');
  await page.waitForTimeout(450);
}
if (!(await page.locator('.service-result').count())) problems.push('the Service never ended');
await page.waitForTimeout(2500);
await shot('service-done');
const after = (await saved()).truck;
if (!after?.served) problems.push('the Service was not counted');
if (!after?.stars) problems.push('no stars from the Service');

// ---------- the Sticker Book ----------
await tap('Sticker Book');
await page.waitForTimeout(1000);
await shot('book-regulars');
await page.getByRole('tab', { name: 'Spots' }).click();
await page.waitForTimeout(500);
await shot('book-spots');
await page.getByRole('tab', { name: 'Trucks' }).click();
await page.waitForTimeout(500);
await shot('book-trucks');

const clips = await page.evaluate(() => (window as unknown as { __clips: number }).__clips);
console.log(`${tag}: ${asked} questions, missed in ${[...missedKinds].join(' ')}, ${clips} voice clips played, Service fed ${after?.stars ?? 0} in ${moves} moves, Regulars ${after?.regulars?.join(' ') || 'none'}`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
process.exitCode = problems.length ? 1 : 0;
