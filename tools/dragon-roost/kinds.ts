// One question of each kind, for judging how each looks: a save with only that kind open (at a Level), the first question, a miss and
// its lesson, a second miss and its fuller lesson, with screenshots. Kinds and Levels come from the command line.
//   npm run dev:dragon-roost   (in another shell)
//   npx tsx tools/dragon-roost/kinds.ts <url> <outDir> <view> noun:1 verb:3 ...
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [url = 'http://localhost:5164/', out = '/tmp/dragon-roost-kinds', view = 'portrait', ...picks] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = { portrait: { width: 810, height: 1080 }, landscape: { width: 1080, height: 810 }, phone: { width: 390, height: 844 }, side: { width: 844, height: 390 } } as const;
const MODES = ['noun', 'verb', 'adj', 'plural', 'past', 'squeeze', 'capital'];
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

async function one(mode: string, level: number) {
  const save = {
    version: 1, balance: 5,
    learning: {
      modes: Object.fromEntries(MODES.map(m => [m, { level: m === mode ? level : 1, window: [], opened: m === mode, starred: false, introPending: false, fresh: false }])),
      pushed: Object.fromEntries(MODES.map(m => [m, 0])), met: MODES, recent: [],
    },
    roost: { dragons: [{ id: 1, egg: 'starter', name: ['happy', 'storm'], flights: 4 }], riding: 1, flights: 1 },
  };
  const page = await browser.newPage({ viewport: VIEWS[view as keyof typeof VIEWS], hasTouch: true });
  await page.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.removeItem('dragon-roost-place'); localStorage.setItem('dragon-roost-save', JSON.stringify(s)); }, save);
  await page.goto(url);
  await page.getByLabel('Start').click({ timeout: 30000 });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const ready = () => page.waitForSelector('.game.dr[data-ready="yes"]', { timeout: 60000 });
  await ready();
  const tag = `${view}-${mode}-L${level}`;
  await page.screenshot({ path: `${out}/${tag}-1-question.png` });
  const q = await page.evaluate(() => (window as unknown as { __round(): any }).__round()) as { q: any };
  const st = q.q.stage;
  const miss = async (k: number) => {
    if (q.q.choices) { const w = (q.q.choices as string[]).filter(c => c !== q.q.answer); await page.getByRole('button', { name: w[k] ?? w[0], exact: true }).first().click(); return; }
    if (st.type === 'tap') { const i = st.shown.map((_: unknown, j: number) => j).filter((j: number) => !st.need.includes(j))[k] ?? 0; await page.locator('.dr-word').nth(i).click(); return; }
    if (st.type === 'apostrophe') { const right = Number(q.q.answer.slice(1)); const gaps = Array.from({ length: st.letters.length - 1 }, (_, j) => j + 1).filter(g => g !== right); await page.getByRole('button', { name: `Gap ${gaps[k] ?? gaps[0]}`, exact: true }).click(); }
  };
  await miss(0); await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/${tag}-2-lesson.png` });
  await ready(); await miss(1); await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${tag}-3-lesson2.png` });
  await page.close();
}
for (const p of picks) { const [m, l] = p.split(':'); await one(m!, Number(l)).catch(e => console.log(`${p} failed: ${e.message.split('\n')[0]}`)); }
await browser.close();
