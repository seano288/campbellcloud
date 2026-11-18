// Screenshots of every Food Truck screen at one size, for the design pass (no checks beyond a page error): each kind at each Level with
// both lessons for a miss (first and second), the three Meetings, the end of a Round, Home on a new and a well-played save, the Truck
// with every tab and something being tried, the Spot card, a Service a few seconds in and later, and the Sticker Book's three pages.
//   npm run dev:food-truck   (in another shell)
//   npx tsx tools/food-truck/gallery.ts <url> <outDir>
// GALLERY_VIEW=portrait|landscape|phone|side picks the screen (810×1080 upright by default). GALLERY_PART=questions|meet|reward|all.
// GALLERY_KINDS=need,job picks the kinds whose questions are shot (all six by default).
import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright';
import { BUY_NEEDS, GOODS, jobOf, NEEDS, SERVICES, WANTS, type JobId } from '../../src/food-truck/econ/things';

const [url = 'http://localhost:5179/', out = '/tmp/food-truck-gallery'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const viewName = (process.env.GALLERY_VIEW ?? 'portrait') as keyof typeof VIEWS, VIEW = VIEWS[viewName];
const PART = process.env.GALLERY_PART ?? 'all';
const MODES = ['need', 'goods', 'job', 'total', 'enough', 'save'] as const;

const learning = (level: number, only: string | null, met: string[]) => ({
  modes: Object.fromEntries(MODES.map(m => [m, { level, window: ['clean', 'clean', 'clean', 'clean', 'clean'], opened: !only || m === only, starred: false, introPending: false, fresh: false }])),
  pushed: Object.fromEntries(MODES.map(m => [m, 40])), met, tuneUp: { total: { asked: 3, clean: 3, misses: 0 } },
});
const RICH_TRUCK = {
  owned: ['grill:small', 'grill:big', 'awning:plain', 'awning:red', 'awning:mint', 'speaker:none', 'speaker:tin', 'speaker:bell', 'lights:none', 'lights:bulbs', 'lights:fairy',
    'paint:red', 'paint:yellow', 'paint:mint', 'paint:stripes', 'sign:plain', 'sign:star', 'sign:crown', 'mascot:none', 'mascot:robot', 'mascot:dino', 'wheels:black', 'helper:bubbles'],
  trucks: ['taco', 'pizza', 'burger'], truck: 'pizza',
  fit: { grill: 'grill:big', awning: 'awning:red', speaker: 'speaker:bell', lights: 'lights:bulbs', paint: 'paint:mint', sign: 'sign:star', mascot: 'mascot:robot', wheels: 'wheels:black' },
  off: [], goal: 'truck:icecream', services: 3, served: 9, stars: 46, best: 8, regulars: ['rosa', 'omar', 'mia', 'robo', 'leo', 'priya', 'zib'], spot: 'beach',
};

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const problems: string[] = [];
let n = 0;

async function open(save: unknown): Promise<Page> {
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1, hasTouch: true });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  await page.addInitScript(s => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.removeItem('food-truck-place');
    if (s) localStorage.setItem('food-truck-save', JSON.stringify(s)); else localStorage.removeItem('food-truck-save');
  }, save);
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  return page;
}
const shot = (page: Page, name: string) => page.screenshot({ path: `${out}/${viewName}-${String(++n).padStart(3, '0')}-${name}.png` });
const tap = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true }).first().click({ timeout: 8000 });
const start = async (page: Page) => { await page.getByLabel('Start').click({ timeout: 30000 }); await page.waitForTimeout(700); };

type Q = { mode: string; meeting?: string; level?: number; q?: Record<string, any> } | null;
const question = (page: Page) => page.evaluate(() => (window as unknown as { __round?(): unknown }).__round?.() as Q);
async function ready(page: Page, ms = 40000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await page.locator('.game.ft[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return true; await page.waitForTimeout(150); }
  return false;
}
const THINGS = [...NEEDS, ...WANTS, ...BUY_NEEDS, ...GOODS, ...SERVICES] as readonly { id: string; name: string }[];
const nameOf = (id: string) => THINGS.find(t => t.id === id)!.name;
const jobLabel = (id: string) => jobOf(id as JobId).name.replace(/^the /, '');
const SHELF_LABEL: Record<string, string> = { need: 'Need', want: 'Want', good: 'Goods', service: 'Services' };
const other: Record<string, string> = { need: 'want', want: 'need', good: 'service', service: 'good' };

async function answer(page: Page, p: NonNullable<Q>, miss: boolean, second = false) {
  const q = p.q!;
  const wrongOf = (xs: string[]) => { const w = xs.filter(x => x !== String(q.answer)); return (second && w[1]) || w[0]!; };
  const pickOf = (xs: string[]) => (miss ? wrongOf(xs) : String(q.answer));
  switch (q.form) {
    case 'pick': return tap(page, nameOf(pickOf(q.things)));
    case 'first': return tap(page, nameOf(pickOf([q.need, q.want])));
    case 'sort': {
      for (const id of q.things as string[]) {
        if (!(await page.getByRole('button', { name: nameOf(id), exact: true }).count())) continue;
        await tap(page, nameOf(id));
        await tap(page, SHELF_LABEL[miss ? other[q.shelves[id]]! : q.shelves[id]]!);
        if (miss) return;
        await page.waitForTimeout(150);
      }
      return;
    }
    case 'who': case 'user': return tap(page, jobLabel(pickOf(q.workers.map((w: { job: string }) => w.job))));
    case 'tool': return tap(page, jobOf(pickOf(q.tools) as JobId).toolName);
    case 'role': { const a = pickOf(['maker', 'buyer']); return tap(page, a === 'maker' ? 'maker' : 'shopper'); }
    case 'yesno': case 'both': return tap(page, pickOf(['yes', 'no']) === 'yes' ? 'Yes' : 'No');
    case 'which': { const id = pickOf(q.items.map((i: { id: string }) => i.id)); const it = q.items.find((i: { id: string }) => i.id === id); return tap(page, `${id}, ${it.price} dollars`); }
    case 'days': return tap(page, pickOf(q.choices.map(String)));
    default: return tap(page, `${pickOf(q.choices.map(String))} dollars`);
  }
}

/** A Round of one kind at one Level: the first question of each form, missed twice (both lessons), then the rest answered. */
async function kindRound(kind: string, level: number, all = false) {
  const page = await open({ version: 1, balance: 30, learning: learning(level, kind, ['needs', 'goods', 'money']) });
  await start(page);
  await tap(page, 'Play');
  const seen = new Set<string>();
  for (let guard = 0; guard < 12; guard++) {
    if (await page.locator('.reward h2').isVisible()) break;
    const p = await question(page);
    if (!p) { await page.waitForTimeout(300); continue; }
    await ready(page);
    const form = `${p.mode}-L${p.level}-${p.q?.form ?? p.meeting}${p.q?.form === 'pick' ? `-${p.q.ask}` : ''}`;
    if (p.mode === 'meet') { await shot(page, `meet-${p.meeting}`); await tap(page, 'Go'); }
    else if (!seen.has(form)) {
      seen.add(form);
      await shot(page, `${form}`);
      await answer(page, p, true);
      await page.waitForTimeout(1800);
      await shot(page, `${form}-miss1`);
      await ready(page);
      const two = ['pick', 'first', 'role', 'yesno', 'both'].includes(p.q?.form) || (p.q?.form === 'who' && p.mode === 'job');
      if (two) await tap(page, 'Help'); else await answer(page, p, true, true);
      await page.waitForTimeout(3000);
      await shot(page, `${form}-miss2`);
      await ready(page, 60000);
      await shot(page, `${form}-miss2-end`);
      await answer(page, p, false);
      await page.waitForTimeout(500);
      await shot(page, `${form}-right`);
    } else {
      if (!all && seen.size >= (kind === 'job' && level === 2 ? 2 : 1)) break;
      await answer(page, p, false);
    }
    for (let i = 0; i < 130; i++) { const now = await question(page); if (now !== null && JSON.stringify(now) !== JSON.stringify(p)) break; if (await page.locator('.reward h2').isVisible()) break; await page.waitForTimeout(150); }
  }
  if (all) {
    await page.waitForTimeout(1500);
    await shot(page, `round-done`);
    await page.waitForSelector('.reward .btns:not(.asleep)', { timeout: 40000 }).catch(() => problems.push('end of Round never woke up'));
    await shot(page, `round-done-awake`);
  }
  await page.close();
}

async function meetings() {
  for (const [kind, meeting] of [['need', 'needs'], ['goods', 'goods'], ['total', 'money']] as const) {
    const page = await open({ version: 1, balance: 0, learning: learning(1, kind, []) });
    await start(page);
    await tap(page, 'Play');
    await page.waitForTimeout(2500);
    await shot(page, `meet-${meeting}-saying`);
    await ready(page);
    await shot(page, `meet-${meeting}`);
    await page.close();
  }
}

async function rewards() {
  // a new player: Start, Home, the Truck, the Sticker Book
  let page = await open(null);
  await shot(page, 'start');
  await start(page);
  await shot(page, 'home-new');
  await tap(page, 'Truck'); await page.waitForTimeout(800); await shot(page, 'truck-new');
  await tap(page, 'Sticker Book'); await page.waitForTimeout(800); await shot(page, 'book-new-regulars');
  await page.close();
  // a well-played save
  const rich = { version: 1, balance: 30, learning: { ...learning(2, null, ['needs', 'goods', 'money']), modes: { ...learning(2, null, []).modes, need: { level: 3, window: [], opened: true, starred: true, introPending: false, fresh: false }, save: { level: 1, window: [], opened: false, starred: false, introPending: false, fresh: false } } }, truck: RICH_TRUCK };
  page = await open(rich);
  await start(page);
  await shot(page, 'home-rich');
  await tap(page, 'Truck'); await page.waitForTimeout(800); await shot(page, 'truck-rich');
  for (const tab of ['Trucks', 'Grill', 'Awning', 'Speaker', 'Lights', 'Paint', 'Sign', 'Mascot', 'Wheels', 'Helpers']) {
    await page.getByRole('tab', { name: tab }).click(); await page.waitForTimeout(250); await shot(page, `truck-tab-${tab.toLowerCase()}`);
  }
  await page.getByRole('tab', { name: 'Paint' }).click(); await page.waitForTimeout(200);
  await tap(page, 'Gold'); await page.waitForTimeout(500); await shot(page, 'truck-trying-afford');
  await page.getByRole('tab', { name: 'Trucks' }).click(); await page.waitForTimeout(200);
  await tap(page, 'Popcorn Truck'); await page.waitForTimeout(500); await shot(page, 'truck-trying-short');
  await tap(page, 'Put it back');
  await tap(page, 'Sticker Book'); await page.waitForTimeout(800); await shot(page, 'book-regulars');
  await page.getByRole('tab', { name: 'Spots' }).click(); await page.waitForTimeout(300); await shot(page, 'book-spots');
  await page.getByRole('tab', { name: 'Trucks' }).click(); await page.waitForTimeout(300); await shot(page, 'book-trucks');
  await tap(page, 'Truck'); await page.waitForTimeout(800);
  await tap(page, 'Open'); await page.waitForTimeout(1000); await shot(page, 'spots');
  await tap(page, 'Open'); await page.waitForTimeout(3500); await shot(page, 'service-start');
  // play a little by the hints so there is food on the grill
  const canvas = page.locator('.service-canvas');
  type Next = { step: { kind: string }; from: { x: number; y: number }; to: { x: number; y: number } | null; hold: boolean } | null;
  for (let moves = 0; moves < 5; moves++) {
    const next = await page.evaluate(() => (window as unknown as { __next?(): unknown }).__next?.() as Next);
    const box = (await canvas.boundingBox())!;
    if (!next) { await page.waitForTimeout(400); continue; }
    await page.mouse.move(box.x + next.from.x, box.y + next.from.y); await page.mouse.down();
    if (next.hold) { await page.waitForTimeout(700); await shot(page, 'service-holding'); await page.waitForTimeout(800); await page.mouse.up(); }
    else { await page.mouse.move(box.x + next.to!.x + 12, box.y + next.to!.y - 10, { steps: 6 }); if (moves === 1) await shot(page, 'service-dragging'); await page.mouse.up(); }
    await page.waitForTimeout(400);
  }
  await shot(page, 'service-mid');
  await page.waitForTimeout(9000);
  await shot(page, 'service-hint');
  await page.close();
}

if (PART === 'all' || PART === 'reward') await rewards();
if (PART === 'all' || PART === 'meet') await meetings();
if (PART === 'all' || PART === 'questions') {
  const kinds = process.env.GALLERY_KINDS?.split(',') ?? MODES;
  for (const kind of MODES.filter(m => kinds.includes(m))) for (const level of [1, 2, 3]) {
    try { await kindRound(kind, level, kind === 'need' && level === 1); } catch (e) { problems.push(`${kind} L${level}: ${(e as Error).message.split('\n')[0]}`); }
  }
}
console.log(`${viewName}: ${n} shots`);
console.log(problems.length ? `PROBLEMS:\n${[...new Set(problems)].join('\n')}` : 'no problems');
await browser.close();
