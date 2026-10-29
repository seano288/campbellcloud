// Screenshots of the moments a tour doesn't reach on its own: teaching after two misses, meeting a heart word, the Password
// Lock, the army in Legendary Gear on the Moon, and an iPhone held upright.
//   npx tsx tools/sight-squad/shots.ts <url> <outDir>
import { chromium, type Browser } from 'playwright';

const [url = 'http://localhost:5210/', out = '/tmp/squad-shots'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const errors: string[] = [];
const WORDS = ['I', 'a', 'see', 'go', 'up', 'the', 'can', 'run', 'my', 'look', 'is', 'we', 'jump', 'down', 'and', 'it', 'you', 'me', 'play', 'come', 'to', 'in', 'big', 'little'];
const allOpen = (level: number) => Object.fromEntries(['hear', 'hunt', 'spell', 'read', 'sentence', 'fill'].map(m => [m, { level, window: [], opened: true, starred: false, introPending: false, fresh: false }]));

async function open(b: Browser, save: unknown, viewport = { width: 1180, height: 820 }) {
  const page = await b.newPage({ viewport, deviceScaleFactor: 1, hasTouch: viewport.width < 700 });
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(s => { localStorage.setItem('sight-squad-save', JSON.stringify(s)); localStorage.removeItem('sight-squad-place'); }, save);
  await page.goto(url);
  await page.getByLabel('Start').click({ timeout: 120000 });
  await page.waitForTimeout(1200);
  return page;
}
const camp = (gear: Record<string, number>, unlocked: string[], colour = 'green') => ({
  colour, units: ['rifleman', 'scout', 'drummer', 'medic', 'rocket', 'dog', 'para', 'jeep', 'cannon', 'tank'],
  army: { rifleman: 10, scout: 3, drummer: 2, medic: 2, rocket: 3, dog: 2, para: 2, jeep: 1, cannon: 1, tank: 1 }, unlocked, gear,
});

// meeting a heart word: "said" is next once every word before it is known well
{
  const strength = Object.fromEntries(WORDS.map(w => [w, 4]));
  const page = await open(browser, { version: 1, balance: 0, learning: { modes: allOpen(1), words: WORDS, sinceWord: 9, strength }, camp: camp({}, []) });
  await page.getByLabel('Play').first().click();
  await page.waitForTimeout(9000); await page.screenshot({ path: `${out}/meet-said-spelling.png` });
  await page.locator('.meet-word.pulse').waitFor({ timeout: 120000 }); await page.screenshot({ path: `${out}/meet-said-sentence.png` });
  await page.close();
}
// teaching: 🔎 Help spells the word out over the question
{
  const strength = Object.fromEntries(WORDS.map(w => [w, 1]));
  const page = await open(browser, { version: 1, balance: 0, learning: { modes: allOpen(2), words: WORDS, sinceWord: 0, strength }, camp: camp({}, []) });
  await page.getByLabel('Play').first().click(); await page.waitForTimeout(3000);
  await page.getByLabel('Help').click(); await page.waitForTimeout(3800);
  await page.screenshot({ path: `${out}/teaching.png` });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${out}/taught.png` });
  await page.close();
}
// Legendary Gear on the Moon, and the Password Lock
{
  const unlocked = ['helmet', 'pack', 'flag', 'finish', 'mat', 'boom'].flatMap(s => [1, 2, 3, 4].map(r => `${s}:${r}`)).filter(m => m !== 'helmet:4');
  const page = await open(browser, { version: 1, balance: 99, learning: { modes: allOpen(2), words: WORDS, sinceWord: 0, strength: {} }, camp: camp({ helmet: 3, pack: 3, flag: 4, finish: 4, mat: 4, boom: 4 }, unlocked) });
  await page.getByLabel('Camp').first().click(); await page.waitForTimeout(7000);
  await page.screenshot({ path: `${out}/moon-gold.png` });
  await page.getByLabel('Helmet').first().click(); await page.waitForTimeout(800);
  await page.getByLabel('Viking Horns').click(); await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/password-lock.png` });
  await page.locator('.vault-card .x').click(); await page.waitForTimeout(500);
  await page.locator('.sheethead .x').click(); await page.waitForTimeout(500);
  await page.getByLabel('Battle').click(); await page.locator('.go-word').waitFor({ timeout: 180000 });
  await page.locator('.go-word').click(); await page.waitForTimeout(4000);
  await page.screenshot({ path: `${out}/rainbow-battle.png` });
  await page.close();
}
// an iPhone held upright
{
  const strength = Object.fromEntries(WORDS.map(w => [w, 1]));
  const page = await open(browser, { version: 1, balance: 40, learning: { modes: allOpen(3), words: WORDS, sinceWord: 0, strength }, camp: camp({ helmet: 1, flag: 2 }, ['helmet:1', 'flag:1', 'flag:2'], 'tan') }, { width: 390, height: 844 });
  await page.screenshot({ path: `${out}/phone-home.png` });
  await page.getByLabel('Play').first().click();
  for (let k = 0; k < 3; k++) { await page.waitForTimeout(3500); await page.screenshot({ path: `${out}/phone-q${k}.png` }); await page.locator('.words .word-btn, .said-btn, .tok-btn, .tile-btn, .card-btn').first().click().catch(() => {}); await page.waitForTimeout(3000); }
  await page.getByLabel('Home').first().click(); await page.waitForTimeout(800);
  await page.getByLabel('Camp').first().click(); await page.waitForTimeout(7000);
  await page.screenshot({ path: `${out}/phone-camp.png` });
  await page.getByLabel('Squads').click(); await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/phone-squads.png` });
  await page.close();
}
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors');
await browser.close();
