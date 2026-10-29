// Plays through Sight Squad in a headless browser and screenshots each screen, for checking the look:
//   npx tsx tools/sight-squad/tour.ts <url> <outDir> [rounds]
// LEVEL=2 or 3 starts with every kind open at that Level and 40 words met; AMMO=n starts with that many Ammo and a big army.
// It answers by trying: Build It at Level 1 reads the faint letters in the slots, anything else it taps until one is right.
import { chromium, type Page } from 'playwright';

const [url = 'http://localhost:5210/', out = '/tmp/squad-tour', rounds = '1'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
// VIEWPORT=390x844 for an iPhone held upright (default: an iPad on its side)
const [vw = 1180, vh = 820] = (process.env.VIEWPORT ?? '').split('x').map(Number).filter(Boolean);
const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, hasTouch: vw < 700 || vh < 700 });
const errors: string[] = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let n = 0;
const shot = async (name: string) => { await page.screenshot({ path: `${out}/${String(n++).padStart(2, '0')}-${name}.png`, timeout: 180000 }); };
const wait = (ms: number) => page.waitForTimeout(ms);
const idle = () => page.waitForFunction(() => !document.querySelector('.card.thinking'), null, { timeout: 60000 }).catch(() => {});

async function answer(page: Page, q: number) {
  if (await page.locator('.meet-word').count()) { // meeting a word: watch it spelled, then tap it
    await shot(`q${q}-meet`);
    await page.locator('.meet-word.pulse').waitFor({ timeout: 120000 });
    await shot(`q${q}-met`);
    await page.locator('.meet-word').click();
    return;
  }
  if (await page.locator('.game.spell').count()) { // Build It: the faint letters say what to tap
    const want = (await page.locator('.slot .ghost').allTextContents()).join('');
    for (const c of want) { await page.locator(`.tile-btn:not(.used)[aria-label="${c}"]`).first().click(); await wait(250); }
    if (!want) for (let k = 0; k < 30 && !(await page.locator('.slots.right').count()); k++) { await idle(); await page.locator('.tile-btn:not(.used)').first().click().catch(() => {}); await wait(500); }
    return;
  }
  if (await page.locator('.game.hunt').count()) {
    for (let k = 0; k < 16 && (await page.locator('.game.hunt').count()); k++) {
      await idle();
      const b = page.locator('.hunt-grid .word-btn:not([disabled])').first();
      if (!(await b.count())) break;
      await b.click().catch(() => {});
      await wait(450);
      if (k === 1) await shot(`q${q}-hunting`);
    }
    return;
  }
  const buttons = page.locator('.words .word-btn:not([disabled]), .said-btn:not([disabled]), .tok-btn:not([disabled])');
  for (let tries = 0; tries < 8; tries++) {
    await idle();
    await buttons.first().click({ timeout: 30000 });
    await wait(450);
    if (tries === 0 && (await page.locator('.teach-panel').count())) await shot(`q${q}-teaching`);
    if (await page.locator('.right').count()) return;
  }
}

const level = Number(process.env.LEVEL ?? 0), ammo = Number(process.env.AMMO ?? 0);
await page.addInitScript(([l, b]) => { // a save with every kind of question open at one Level, or a rich army
  if (localStorage.getItem('sight-squad-save')) return;
  const words = ['I', 'a', 'see', 'go', 'up', 'the', 'can', 'run', 'my', 'look', 'is', 'we', 'jump', 'down', 'and', 'it', 'you', 'me', 'play', 'come', 'to', 'in', 'big', 'little', 'said', 'here', 'not', 'stop', 'help', 'yes', 'he', 'like', 'are', 'on', 'all', 'was', 'at', 'they', 'have', 'good'];
  const save: Record<string, unknown> = { version: 1, balance: b };
  if (l) {
    const mode = { level: l, window: [], opened: true, starred: false, introPending: false, fresh: false };
    save.learning = { modes: Object.fromEntries(['hear', 'hunt', 'spell', 'read', 'sentence', 'fill'].map(m => [m, mode])), words, sinceWord: 0, strength: Object.fromEntries(words.map(w => [w, 1])) };
  }
  if (b) save.camp = { colour: 'green', units: ['rifleman', 'scout', 'drummer', 'medic', 'rocket', 'dog', 'para', 'jeep', 'cannon', 'tank'],
    army: { rifleman: 14, scout: 4, drummer: 3, medic: 2, rocket: 4, dog: 2, para: 3, jeep: 1, cannon: 1, tank: 2 },
    unlocked: ['helmet:1', 'helmet:2', 'pack:1', 'flag:1', 'flag:2', 'flag:3'], gear: { helmet: 2, pack: 1, flag: 3, finish: 0, mat: 0, boom: 0 } };
  if (l || b) localStorage.setItem('sight-squad-save', JSON.stringify(save));
}, [level, ammo] as const);
await page.goto(url);
await wait(800); await shot('start');
await page.getByLabel('Start').click({ timeout: 120000 }); await wait(1200);
if (await page.getByLabel('That one').count()) {
  await shot('picker');
  await page.locator('.body-card').nth(0).click(); await wait(400);
  await page.getByLabel('That one').click({ timeout: 120000 }); await wait(1000);
}
await shot('home');
for (let r = 0; r < Number(rounds); r++) {
  await page.getByLabel(r ? 'Play again' : 'Play').first().click({ timeout: 120000 }); await wait(1500);
  for (let k = 0; k < 5; k++) {
    await shot(`r${r}-q${k}`);
    await answer(page, k);
    await wait(2600);
  }
  await wait(6000); await shot(`r${r}-done`);
}
await page.getByLabel('Camp').first().click({ timeout: 120000 }); await wait(6000); await shot('camp');
await page.getByLabel('Squads').click({ timeout: 120000 }); await wait(1500); await shot('squads');
await page.getByLabel('Rifleman').click({ timeout: 120000 }); await wait(2500); await shot('recruited');
await page.getByLabel('Close').click(); await wait(400);
await page.getByLabel('Helmet').first().click({ timeout: 120000 }); await wait(1200); await shot('helmet-sheet');
await page.getByLabel('Close').click(); await wait(400);
await page.getByLabel('Parade').click({ timeout: 120000 }); await wait(8000); await shot('parade');
if (await page.locator('.order').count()) { await page.locator('.order').first().click(); await wait(2500); await shot('order'); }
await page.getByLabel('Halt').click(); await wait(3000);
await page.getByLabel('Battle').click({ timeout: 120000 }); await wait(4000); await shot('battle-lining-up');
await page.locator('.go-word').waitFor({ timeout: 180000 }); await shot('battle-ready');
await page.locator('.go-word').click(); await wait(5000); await shot('battle-fight');
await page.waitForFunction(() => document.querySelector('.show-overlay.battle.won'), null, { timeout: 240000 }).catch(() => {});
await wait(1500); await shot('battle-won');
await page.getByLabel('Back to Camp').click(); await wait(3000); await shot('camp-after');
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors');
await browser.close();
