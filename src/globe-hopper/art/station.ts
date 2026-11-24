// The Station drawn in code: each module a shape in its colour with windows, solar panels and a dish, joined to its neighbours on a grid,
// the named modules each in their own colour and icon. Fits whatever size it has grown to; past a few hundred modules it keeps drawing
// simple shapes so it stays quick.
import { PAYLOADS } from '../base/catalog';
import { extent, MODULE_COLOURS, type ModuleLook, type Placed } from '../base/station';

const O = '#14161b';
/** How a named payload module looks on the Station. */
const NAMED: Record<string, ModuleLook> = {
  'pl:core': { shape: 0, colour: 0, windows: 2, panels: 0, dish: false }, 'pl:solar': { shape: 2, colour: 3, windows: 0, panels: 2, dish: false },
  'pl:lab': { shape: 0, colour: 0, windows: 3, panels: 0, dish: true }, 'pl:dome': { shape: 4, colour: 9, windows: 1, panels: 0, dish: false },
  'pl:arm': { shape: 5, colour: 9, windows: 0, panels: 0, dish: false }, 'pl:greenhouse': { shape: 1, colour: 4, windows: 3, panels: 0, dish: false },
  'pl:sleep': { shape: 0, colour: 1, windows: 2, panels: 0, dish: false }, 'pl:kitchen': { shape: 2, colour: 5, windows: 1, panels: 0, dish: false },
  'pl:wings': { shape: 2, colour: 11, windows: 0, panels: 2, dish: false }, 'pl:airlock': { shape: 1, colour: 9, windows: 1, panels: 0, dish: false },
  'pl:storage': { shape: 2, colour: 10, windows: 0, panels: 0, dish: false }, 'pl:robot': { shape: 5, colour: 5, windows: 1, panels: 0, dish: false },
  'pl:gym': { shape: 0, colour: 2, windows: 2, panels: 1, dish: false }, 'pl:radiator': { shape: 3, colour: 0, windows: 0, panels: 1, dish: false },
};
export const lookOfModule = (id: string, designs: Record<number, ModuleLook>): ModuleLook => (id.startsWith('m:') ? designs[Number(id.slice(2))] : NAMED[id]) ?? NAMED['pl:core']!;
export const iconOfModule = (id: string) => (id.startsWith('m:') ? '🧩' : PAYLOADS.find(p => p.id === id)?.icon ?? '🛰️');

/** One module centred at (x, y), `s` pixels across its cell. */
export function drawModule(ctx: CanvasRenderingContext2D, l: ModuleLook, x: number, y: number, s: number, simple = false) {
  const fill = MODULE_COLOURS[l.colour] ?? '#f6f8fb', h = s * .42, w = s * .78;
  ctx.save(); ctx.translate(x, y);
  ctx.lineWidth = Math.max(1.5, s / 22); ctx.strokeStyle = O; ctx.lineJoin = 'round';
  if (!simple && l.panels) {
    ctx.fillStyle = '#2f5fb0';
    for (const d of l.panels === 2 ? [-1, 1] : [1]) { ctx.fillRect(-s * .08, d * s * .26 - (d < 0 ? s * .2 : 0), s * .16, s * .2); ctx.strokeRect(-s * .08, d * s * .26 - (d < 0 ? s * .2 : 0), s * .16, s * .2); }
  }
  ctx.fillStyle = fill; ctx.beginPath();
  switch (l.shape) {
    case 0: ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); break; // tube
    case 1: ctx.arc(0, 0, s * .3, 0, Math.PI * 2); break; // ball
    case 2: ctx.rect(-s * .3, -s * .3, s * .6, s * .6); break; // box
    case 3: ctx.arc(0, 0, s * .34, 0, Math.PI * 2); ctx.moveTo(s * .18, 0); ctx.arc(0, 0, s * .18, 0, Math.PI * 2, true); break; // ring
    case 4: ctx.moveTo(-s * .34, s * .14); ctx.arc(0, s * .14, s * .34, Math.PI, 0); ctx.closePath(); break; // dome
    default: ctx.rect(-s * .16, -s * .4, s * .32, s * .8); // tower
  }
  ctx.fill('evenodd'); ctx.stroke();
  if (!simple) {
    ctx.fillStyle = '#1b2a44';
    for (let i = 0; i < l.windows; i++) { ctx.beginPath(); ctx.arc((i - (l.windows - 1) / 2) * s * .15, l.shape === 4 ? s * .02 : 0, s * .045, 0, Math.PI * 2); ctx.fill(); }
    if (l.dish) { ctx.fillStyle = '#e8edf2'; ctx.beginPath(); ctx.arc(s * .2, -s * .32, s * .12, Math.PI * .1, Math.PI * 1.1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}

/** The whole Station fitted in a w×h box; returns where each grid spot is, for taps. `spots` glow (free places to put a module). */
export function drawStation(ctx: CanvasRenderingContext2D, placed: readonly Placed[], designs: Record<number, ModuleLook>, w: number, h: number, t: number, spots: readonly { x: number; y: number }[] = []) {
  const e = extent([...placed, ...spots.map(s => ({ id: '', ...s }))]);
  const cols = e.x1 - e.x0 + 1, rows = e.y1 - e.y0 + 1, s = Math.min(90, (w * .9) / cols, (h * .86) / rows);
  const ox = w / 2 - ((e.x0 + e.x1) / 2) * s, oy = h / 2 - ((e.y0 + e.y1) / 2) * s;
  const at = (gx: number, gy: number) => ({ x: ox + gx * s, y: oy + gy * s });
  // the joins between neighbours
  ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = Math.max(2, s / 8);
  const taken = new Set(placed.map(p => `${p.x},${p.y}`));
  for (const p of placed) for (const [dx, dy] of [[1, 0], [0, 1]] as const) if (taken.has(`${p.x + dx},${p.y + dy}`)) {
    const a = at(p.x, p.y), b = at(p.x + dx, p.y + dy); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  const simple = placed.length > 300;
  for (const p of placed) { const c = at(p.x, p.y); drawModule(ctx, lookOfModule(p.id, designs), c.x, c.y, s, simple); }
  for (const sp of spots) {
    const c = at(sp.x, sp.y), a = .45 + .35 * Math.sin(t * 5);
    ctx.strokeStyle = `rgba(255,214,63,${a})`; ctx.lineWidth = 4; ctx.setLineDash([6, 5]);
    ctx.strokeRect(c.x - s * .4, c.y - s * .4, s * .8, s * .8); ctx.setLineDash([]);
  }
  return { s, at, toGrid: (px: number, py: number) => ({ x: Math.round((px - ox) / s), y: Math.round((py - oy) / s) }) };
}
