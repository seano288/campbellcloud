// Draws Calls as they look a few seconds in: every one of the thirty-two scenes, some as Star Calls, some Mystery Call Levels, and
// the aircraft at work (a helicopter hovering with its rope down, a plane dropping water, a parachute, the Rescue Drone), so the
// scenes can be checked without playing.
//   npx tsx tools/hook-and-ladder/scenes-sheet.ts [outFile] [which: all|new|air|hot|mystery]
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const [out = 'scenes-sheet.png', which = 'all'] = process.argv.slice(2);
const bundle = await build({
  stdin: {
    contents: `import { drawBackdrop, drawCall, viewOf } from './src/hook-and-ladder/call/draw';
      import { SCENES, heated, mysteryCall } from './src/hook-and-ladder/call/scenes';
      import { startCall, step, aim, release, tapRescue, takeEvents } from './src/hook-and-ladder/call/sim';
      import { drawLot, lotScale } from './src/hook-and-ladder/art/town';
      (window as any).hl = { drawBackdrop, drawCall, viewOf, SCENES, heated, mysteryCall, startCall, step, aim, release, tapRescue, takeEvents, drawLot, lotScale };`,
    resolveDir: resolve(import.meta.dirname, '../..'), loader: 'tsx',
  },
  bundle: true, write: false, format: 'iife', define: { 'import.meta.env': '{}' },
});
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setContent('<body style="margin:0;background:#20242c"><canvas id="c"></canvas></body>');
await page.addScriptTag({ content: 'window.__name = (f) => f;' });
await page.addScriptTag({ content: bundle.outputFiles[0]!.text });
await page.evaluate(async (which: string) => {
  const hl = (window as any).hl;
  const look = (truck: string, extra: object = {}) => ({ truck, paint: 'red', lights: 'red', buddy: 'dalmatian', nozzle: 'straight', ladder: 3, tank: 3, hose: 3, pump: 4, engine: 2, gadgets: [], ...extra });
  const gear = (l: any) => ({ truck: l.truck, engine: l.engine, pump: l.pump, hose: l.hose, ladder: l.ladder, tank: l.tank, nozzle: l.nozzle, gadgets: l.gadgets });
  type Cell = { label: string; scene: any; look: any; play: 'spray' | 'rescue' | 'idle'; secs: number };
  const cells: Cell[] = [];
  const S = hl.SCENES;
  if (which === 'all' || which === 'new') S.slice(16).forEach((s: any) => cells.push({ label: s.name, scene: s, look: look('pumper'), play: 'spray', secs: 1.2 }));
  if (which === 'all' || which === 'hot') for (const id of ['bin', 'house', 'school', 'castle', 'tower', 'zoo', 'wildfire', 'volcano']) cells.push({ label: `${id} ⭐3`, scene: hl.heated(S.find((s: any) => s.id === id), 3), look: look('ladder'), play: 'idle', secs: 0.5 });
  if (which === 'all' || which === 'mystery') for (const l of [1, 3, 6, 9, 14, 20, 30, 45]) cells.push({ label: `Mystery ${l}`, scene: hl.mysteryCall(l), look: look('tower'), play: 'spray', secs: 1.0 });
  if (which === 'all' || which === 'air') {
    const at = (id: string) => S.find((s: any) => s.id === id);
    cells.push({ label: 'heli, hotel, rope', scene: at('hotel'), look: look('heli'), play: 'rescue', secs: 1.6 });
    cells.push({ label: 'twin, house', scene: at('house'), look: look('twin'), play: 'spray', secs: 1.2 });
    cells.push({ label: 'skycrane, giant', scene: at('giant'), look: look('skycrane'), play: 'spray', secs: 1.2 });
    cells.push({ label: 'drone, school', scene: at('school'), look: look('drone'), play: 'spray', secs: 1.2 });
    cells.push({ label: 'blimp, tower', scene: at('tower'), look: look('blimp'), play: 'spray', secs: 1.2 });
    cells.push({ label: 'jetpack, flats', scene: at('flats'), look: look('jetpack'), play: 'rescue', secs: 1.4 });
    cells.push({ label: 'scooper, wildfire', scene: at('wildfire'), look: look('scooper'), play: 'spray', secs: 2.2 });
    cells.push({ label: 'airtanker, tower, chute', scene: at('tower'), look: look('airtanker'), play: 'rescue', secs: 2.0 });
    cells.push({ label: 'superjet, bin', scene: at('bin'), look: look('superjet', { nozzle: 'confetti' }), play: 'spray', secs: 1.5 });
    cells.push({ label: 'drone gadget, skyscraper', scene: at('tower'), look: look('pumper', { gadgets: ['drone', 'spotlight', 'hydrant'] }), play: 'rescue', secs: 1.4 });
    cells.push({ label: 'tower truck, hospital', scene: at('hospital'), look: look('tower', { nozzle: 'hearts' }), play: 'spray', secs: 1.2 });
    cells.push({ label: 'robot, stadium', scene: at('stadium'), look: look('robot', { nozzle: 'stars' }), play: 'idle', secs: 1.5 });
  }
  const CW = 520, CH = 390, COLS = 4, rows = Math.ceil(cells.length / COLS);
  const c = document.getElementById('c') as HTMLCanvasElement;
  c.width = CW * COLS; c.height = rows * (CH + 22);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#20242c'; ctx.fillRect(0, 0, c.width, c.height);
  cells.forEach((cell, i) => {
    const off = document.createElement('canvas'); off.width = CW; off.height = CH;
    const o = off.getContext('2d')!, view = hl.viewOf(cell.scene, CW, CH);
    const bd = document.createElement('canvas'); bd.width = CW; bd.height = CH;
    hl.drawBackdrop(bd.getContext('2d')!, cell.scene, view, CW, CH);
    const s = hl.startCall(cell.scene, gear(cell.look), 7);
    for (let t = 0; t < cell.secs; t += 1 / 60) {
      const f = s.fires.filter((f: any) => !f.out && f.reach).sort((a: any, b: any) => b.y - a.y)[0];
      if (cell.play === 'spray' && f) hl.aim(s, f.x, f.y); else hl.release(s);
      if (cell.play === 'rescue' && t < 0.05) { const r = s.rescues.find((r: any) => r.state === 'waiting' && r.floor > 4) ?? s.rescues[0]; if (r) hl.tapRescue(s, r.x, r.y); if (f) hl.aim(s, f.x, f.y); }
      if (cell.play === 'rescue' && f) hl.aim(s, f.x, f.y);
      hl.step(s, 1 / 60); hl.takeEvents(s);
    }
    hl.drawCall(o, bd, s, view, cell.look, CW, CH, true);
    const x = (i % COLS) * CW, y = Math.floor(i / COLS) * (CH + 22);
    ctx.drawImage(off, x, y + 22);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(cell.label, x + 6, y + 16);
  });
}, which);
await page.locator('#c').screenshot({ path: out });
await browser.close();
console.log(out);
