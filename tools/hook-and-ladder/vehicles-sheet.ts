// Draws every vehicle (as a Station tile, and at the Call with its ladder up, its exhaust on and gadgets fitted), every paint, every
// light, every nozzle and every engine's exhaust into one picture, so the art can be checked without playing.
//   npx tsx tools/hook-and-ladder/vehicles-sheet.ts [outFile]
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const [out = 'vehicles-sheet.png'] = process.argv.slice(2);
const bundle = await build({
  stdin: {
    contents: `import { drawTruck, truckPic } from './src/hook-and-ladder/art/truck';
      import { TRUCKS, AIRCRAFT, PAINTS, LIGHTS, NOZZLES, ENGINES, GADGETS, kindOf, TOWER_NOZZLE } from './src/hook-and-ladder/station/parts';
      (window as any).art = { drawTruck, truckPic, TRUCKS, AIRCRAFT, PAINTS, LIGHTS, NOZZLES, ENGINES, GADGETS, kindOf, TOWER_NOZZLE };`,
    resolveDir: resolve(import.meta.dirname, '../..'), loader: 'tsx',
  },
  bundle: true, write: false, format: 'iife', define: { 'import.meta.env': '{}' },
});
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setContent('<body style="margin:0;background:#cfe9fb"><canvas id="c"></canvas></body>');
// tsx names the page function's inner functions with a helper the page doesn't have
await page.addScriptTag({ content: 'window.__name = (f) => f;' });
await page.addScriptTag({ content: bundle.outputFiles[0]!.text });
const size = await page.evaluate(() => {
  const { drawTruck, TRUCKS, AIRCRAFT, PAINTS, LIGHTS, NOZZLES, ENGINES, kindOf, TOWER_NOZZLE } = (window as any).art;
  const base = { truck: 'pumper', paint: 'red', lights: 'red', buddy: 'dalmatian', nozzle: 'straight', ladder: 2, tank: 2, hose: 2, pump: 2, engine: 0, gadgets: [] as string[] };
  const vehicles = [...TRUCKS, ...AIRCRAFT].map((v: any) => v.id);
  type Item = { label: string; look: any; pose?: any };
  // a view: how the cell maps world units, either like a Station tile (truckPic), the Station bay (TruckArt), or a box round the world
  type View = 'tile' | 'bay' | { x0: number; x1: number; y0: number; y1: number };
  type Section = { title: string; cw: number; ch: number; view: View; items: Item[]; sky?: boolean };
  const sections: Section[] = [];
  sections.push({ title: 'Station tiles (200×120, as truckPic draws them)', cw: 200, ch: 120, view: 'tile', items: vehicles.map((id: string) => ({ label: id, look: { ...base, truck: id } })) });
  sections.push({ title: 'Station bay (as TruckArt draws them), some paints', cw: 260, ch: 130, view: 'bay', items: vehicles.map((id: string, i: number) => ({ label: id, look: { ...base, truck: id, paint: ['tiger', 'galaxy', 'lime', 'spots', 'blueflames', 'checker', 'diamond'][i % 7], buddy: i % 2 ? 'cat' : 'dalmatian' } })) });
  const callPose = (id: string, i: number) => {
    const k = kindOf(id);
    return { t: 1.3 + i * 0.37, flash: true, aim: 0.55, exhaust: true, ladderAngle: k === 'truck' ? 0.95 : -1.3, ladderLen: k === 'truck' ? 3.4 : 1.0, bounce: k === 'truck' ? 0 : 0.2 };
  };
  sections.push({ title: 'At the Call: ladder up, aimed, flashing, exhaust (engine by column), a few gadgets', cw: 260, ch: 200, view: { x0: -2.6, x1: 6.0, y0: -0.2, y1: 5.6 }, sky: true,
    items: vehicles.map((id: string, i: number) => ({ label: `${id} e${i % 7}`, look: { ...base, truck: id, engine: i % 7, paint: ['red', 'stripe', 'polka', 'leopard', 'waves', 'lightning', 'starry'][i % 7], lights: ['blue', 'police', 'fireworks', 'rainbow'][i % 4], nozzle: ['straight', 'cannon', 'triple', 'sprinkler', 'golden'][i % 5], gadgets: i % 2 ? ['flag', 'bell', 'turbo', 'cape'] : ['spotlight', 'fan', 'cannon', 'drone'] }, pose: callPose(id, i) })) });
  sections.push({ title: 'Every gadget on (trailer, hydrant…)', cw: 260, ch: 150, view: { x0: -1.6, x1: 6.0, y0: -0.2, y1: 3.6 },
    items: vehicles.filter((id: string) => kindOf(id) === 'truck').map((id: string) => ({ label: id, look: { ...base, truck: id, paint: 'rainbow', gadgets: ['bell', 'flag', 'spotlight', 'fan', 'turbo', 'trailer', 'drone', 'cannon', 'hydrant', 'cape'] }, pose: { t: 0.4 } })) });
  sections.push({ title: 'Planes flying left (facing -1)', cw: 260, ch: 130, view: { x0: -2.6, x1: 6.0, y0: -0.2, y1: 2.6 },
    items: AIRCRAFT.filter((a: any) => a.kind === 'plane').map((a: any, i: number) => ({ label: a.id, look: { ...base, truck: a.id, paint: ['yellow', 'navy', 'purple'][i], engine: 4 + i }, pose: { t: 0.7, facing: -1, exhaust: true, flash: true } })) });
  sections.push({ title: 'Every paint', cw: 150, ch: 90, view: 'tile', items: PAINTS.map((p: any) => ({ label: p.id, look: { ...base, paint: p.id } })) });
  sections.push({ title: 'Every light (flashing, t=0.9)', cw: 150, ch: 90, view: { x0: 2.8, x1: 5.6, y0: 0.6, y1: 2.6 }, items: LIGHTS.map((l: any) => ({ label: l.id, look: { ...base, lights: l.id }, pose: { t: 0.9, flash: true } })) });
  sections.push({ title: 'Every nozzle (hose rung 4)', cw: 150, ch: 90, view: { x0: 3.4, x1: 5.6, y0: 0.9, y1: 2.6 }, items: NOZZLES.map((n: any) => ({ label: n.id, look: { ...base, nozzle: n.id, hose: 4 }, pose: { t: 0.5, aim: 0.5 } })) });
  sections.push({ title: 'Every engine exhaust', cw: 200, ch: 100, view: { x0: -2.4, x1: 4.2, y0: -0.1, y1: 2.0 }, items: ENGINES.map((e: any, i: number) => ({ label: e.name, look: { ...base, engine: i }, pose: { t: 0.8, exhaust: true } })) });
  sections.push({ title: 'Tower boom raised (TOWER_NOZZLE dot) and the hovers at rest', cw: 260, ch: 200, view: { x0: -0.5, x1: 6.0, y0: -0.2, y1: 4.6 },
    items: [{ label: 'tower up', look: { ...base, truck: 'tower' }, pose: { t: 0.2, aim: 0.3 } }, ...AIRCRAFT.filter((a: any) => a.kind === 'hover').map((a: any) => ({ label: a.id, look: { ...base, truck: a.id }, pose: { t: 0.2 } }))] });

  const cols = 9, W = cols * 262 + 10;
  let H = 0;
  for (const s of sections) H += 26 + Math.ceil(s.items.length / Math.floor(W / s.cw)) * s.ch;
  const c = document.getElementById('c') as HTMLCanvasElement; c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#e9eef3'; ctx.fillRect(0, 0, W, H);
  let y = 0;
  for (const s of sections) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1c2a6b'; ctx.font = '800 16px sans-serif'; ctx.fillText(s.title, 8, y + 19);
    y += 26;
    const per = Math.floor(W / s.cw);
    s.items.forEach((it, j) => {
      const cx = (j % per) * s.cw, cy = y + Math.floor(j / per) * s.ch, w = s.cw - 4, h = s.ch - 4;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.save();
      ctx.beginPath(); ctx.rect(cx + 2, cy + 2, w, h); ctx.clip();
      ctx.fillStyle = s.sky ? '#7cc1f2' : '#ffffff'; ctx.fillRect(cx + 2, cy + 2, w, h);
      let m;
      if (s.view === 'tile') {
        const k = Math.min(w / 6.4, h / 2.6);
        m = { k, ox: cx + 2 + (w - 5.6 * k) / 2 - 0.2 * k, oy: cy + 2 + h - 0.1 * k };
      } else if (s.view === 'bay') {
        const k = Math.min(w / 6.2, h / 3.0);
        m = { k, ox: cx + 2 + (w - 5.4 * k) / 2 - 0.3 * k, oy: cy + 2 + h - 0.08 * k };
      } else {
        const v = s.view, k = Math.min(w / (v.x1 - v.x0), h / (v.y1 - v.y0));
        m = { k, ox: cx + 2 - v.x0 * k, oy: cy + 2 + v.y1 * k };
        if (s.sky) { ctx.fillStyle = '#6b7480'; ctx.fillRect(cx + 2, m.oy, w, h); }
      }
      drawTruck(ctx, m, it.look, 0, it.pose ?? { t: 0.1 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (it.label === 'tower up') { ctx.fillStyle = '#ff00ff'; ctx.beginPath(); ctx.arc(m.ox + TOWER_NOZZLE.x * m.k, m.oy - TOWER_NOZZLE.y * m.k, 3, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#000000aa'; ctx.font = '700 11px sans-serif'; ctx.fillText(it.label, cx + 6, cy + 14);
      ctx.restore();
    });
    y += Math.ceil(s.items.length / per) * s.ch;
  }
  return { W, H };
});
await page.setViewportSize({ width: size.W, height: Math.min(size.H, 16000) });
await page.locator('#c').screenshot({ path: out });
await browser.close();
console.log(`saved ${out}`);
