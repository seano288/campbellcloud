import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:5186/', out = process.argv[3] ?? '/tmp';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true })).newPage();
const problems: string[] = [];
page.on('pageerror', e => problems.push(e.message));
await page.goto(url);
await page.evaluate(() => { localStorage.clear(); });
await page.reload();
const q = () => page.evaluate(() => (window as any).__round?.());
async function ready() { for (let i = 0; i < 400; i++) { if (await page.locator('.game.dl[data-ready="yes"]').count() && !(await page.locator('.card.thinking').count())) return; await page.waitForTimeout(100); } problems.push('never ready'); }
async function right() { const p = await q(); await page.locator(`.game.dl [data-key="${p.q.answer}"]`).first().tap(); for (let i = 0; i < 60; i++) { if (JSON.stringify(await q()) !== JSON.stringify(p)) return; await page.waitForTimeout(100); } }
await page.getByLabel('Start').tap(); await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Play', exact: true }).tap();
// L1 kinds only on a new save: every answer is a single tap except none
for (let i = 0; i < 2; i++) { await ready(); await right(); }
await ready();
// a miss, and reload in the middle of its lesson
const p = await q();
await page.locator(`.game.dl [data-key="${p.q.choices.find((c: string) => c !== p.q.answer)}"]`).first().tap();
await page.waitForTimeout(1200);
const stars0 = await page.locator('.roundbar .star, .stars .on, .stars i').count();
await page.reload(); await page.waitForTimeout(800);
await page.getByLabel('Start').tap(); await page.waitForTimeout(1500);
await ready();
await page.screenshot({ path: `${out}/reload-round.png` });
console.log('after reload: screen', await page.locator('.round-screen').count() ? 'round' : 'other', 'place', await page.evaluate(() => localStorage.getItem('deep-light-place')));
// finish the round
for (let i = 0; i < 6 && !(await page.locator('.reward h2').isVisible()); i++) { await ready(); if (await page.locator('.reward h2').isVisible()) break; await right(); }
await page.waitForTimeout(1500);
console.log('round done:', await page.locator('.reward h2').isVisible(), 'save', await page.evaluate(() => localStorage.getItem('deep-light-save')?.slice(0, 120)));
console.log(problems.length ? problems.join('\n') : 'no problems');
await browser.close();
