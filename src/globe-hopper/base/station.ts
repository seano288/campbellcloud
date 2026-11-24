// The Station: modules on a grid in orbit, round the core. The named modules (payloads in the catalogue) and, once he has the Module
// Factory, new modules he designs himself from parts: a shape, a colour, windows, solar panels and a dish. Every module he launches waits
// until he puts it on the Station where he likes, on any free spot next to one already there. A new module's parts start from a design
// made from its number (the same every time), which he can change before he buys it. Nothing here ever runs out.
import { int, seeded } from '../../game/rng';

export const SHAPES = ['Tube', 'Ball', 'Box', 'Ring', 'Dome', 'Tower'] as const;
export const MODULE_COLOURS = ['#f6f8fb', '#ffd23f', '#e63946', '#2f8fe8', '#2fa84f', '#ff7a00', '#7b4bd1', '#14a3a3', '#ff7aa8', '#c9d1da', '#e0b13a', '#1f3a68'] as const;
export interface ModuleLook { readonly shape: number; readonly colour: number; readonly windows: number; readonly panels: number; readonly dish: boolean }
export const WINDOWS_MAX = 3, PANELS_MAX = 2;
/** How many different modules the parts make. */
export const MODULE_LOOKS = SHAPES.length * MODULE_COLOURS.length * (WINDOWS_MAX + 1) * (PANELS_MAX + 1) * 2;

/** The design a new module starts from, made from its number: the same each time. */
export function suggestModule(n: number): ModuleLook {
  const rng = seeded(0x5e7 + n * 7919);
  return { shape: int(rng, 0, SHAPES.length - 1), colour: int(rng, 0, MODULE_COLOURS.length - 1), windows: int(rng, 0, WINDOWS_MAX), panels: int(rng, 0, PANELS_MAX), dish: rng() < .4 };
}
export const isLook = (x: unknown): x is ModuleLook => {
  if (typeof x !== 'object' || x === null) return false;
  const l = x as Record<string, unknown>, n = (v: unknown, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;
  return n(l.shape, SHAPES.length - 1) && n(l.colour, MODULE_COLOURS.length - 1) && n(l.windows, WINDOWS_MAX) && n(l.panels, PANELS_MAX) && typeof l.dish === 'boolean';
};

/** A module on the Station: a named payload (`pl:lab`) or one he designed (`m:3`), and where it is. */
export interface Placed { readonly id: string; readonly x: number; readonly y: number }
const key = (x: number, y: number) => `${x},${y}`;
const AROUND = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/** The free spots a new module can go: next to any module already there (the core is at 0,0). With none yet, the core's spot. */
export function freeSpots(placed: readonly Placed[]): { x: number; y: number }[] {
  if (!placed.length) return [{ x: 0, y: 0 }];
  const taken = new Set(placed.map(p => key(p.x, p.y))), out = new Map<string, { x: number; y: number }>();
  for (const p of placed) for (const [dx, dy] of AROUND) { const x = p.x + dx, y = p.y + dy; if (!taken.has(key(x, y))) out.set(key(x, y), { x, y }); }
  // nearest the core first, so the suggested spot keeps the Station compact
  return [...out.values()].sort((a, b) => Math.abs(a.x) + Math.abs(a.y) * 1.3 - (Math.abs(b.x) + Math.abs(b.y) * 1.3) || a.y - b.y || a.x - b.x);
}
export const canPlace = (placed: readonly Placed[], x: number, y: number) => freeSpots(placed).some(s => s.x === x && s.y === y);
export function place(placed: readonly Placed[], id: string, x: number, y: number): Placed[] | null {
  return canPlace(placed, x, y) ? [...placed, { id, x, y }] : null;
}
/** The Station's size, for drawing it to fit. */
export function extent(placed: readonly Placed[]) {
  const xs = placed.map(p => p.x), ys = placed.map(p => p.y);
  return { x0: Math.min(0, ...xs), x1: Math.max(0, ...xs), y0: Math.min(0, ...ys), y1: Math.max(0, ...ys) };
}
