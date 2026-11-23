// Buildings made from parts, from a seed. The shop's fresh street is the next few seeds he hasn't bought, so the same street comes
// back after a reload, and every one he buys makes room for a new one. He can also put one together himself (a Custom design).
import { seeded } from '../../game/rng';
import { PARTS, type Look, type RoofStyle, type WindowStyle } from './catalog';
import type { PlotSize } from './grid';

export const GEN_KINDS = ['House', 'Flats', 'Shop', 'Café', 'Bakery', 'Bookshop', 'Diner', 'Office', 'Tower', 'Hotel', 'Sweet Shop', 'Flower Shop', 'Bike Shop', 'Studio', 'Gallery', 'Cake Shop'] as const;
export type GenKind = (typeof GEN_KINDS)[number];
export const GEN_COLOURS = ['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'White', 'Silver', 'Gold', 'Brown', 'Teal'] as const;
export type GenColour = (typeof GEN_COLOURS)[number];
const COLOUR_HEX: Record<GenColour, string> = {
  Red: '#d9534f', Blue: '#5aa9e6', Green: '#6cc57a', Yellow: '#ffd95a', Pink: '#ff9ec4', Purple: '#9b7fd1', Orange: '#ffa552', White: '#f7f4ee',
  Silver: '#c3cad3', Gold: '#e8c05a', Brown: '#a9785a', Teal: '#45c4b6',
};
const TRIMS = ['#14161b', '#ffffff', '#3a3f4b', '#b5523b', '#2a5d8f', '#2a7f62'];
const SIGNS: Partial<Record<GenKind, string>> = {
  Shop: '🛒', Café: '☕', Bakery: '🥐', Bookshop: '📚', Diner: '🍳', Office: '💼', Hotel: '🛎️', 'Sweet Shop': '🍬', 'Flower Shop': '💐', 'Bike Shop': '🚲',
  Studio: '🎨', Gallery: '🖼️', 'Cake Shop': '🎂',
};

/** A design: something he can stand on a plot, whatever made it. */
export interface Design {
  /** How it is said: a name clip, or a colour and a kind ("Blue", "Bakery"). */
  said: readonly string[];
  size: PlotSize;
  look: Look;
  people: number;
  /** A tower grows a floor at a time. */
  tower: boolean;
}
export interface GenDesign extends Design { seed: number; kind: GenKind; colour: GenColour; price: number }

const ROOFS = PARTS.filter(p => p.slot === 'roof').map(p => p.value as RoofStyle);
const WINDOWS = PARTS.filter(p => p.slot === 'window').map(p => p.value as WindowStyle);

const cache = new Map<number, GenDesign>();
export function genDesign(seed: number): GenDesign {
  const hit = cache.get(seed);
  if (hit) return hit;
  const rng = seeded(seed * 7919 + 13), pick = <T,>(xs: readonly T[]) => xs[Math.floor(rng() * xs.length)]!;
  const kind = pick(GEN_KINDS), colour = pick(GEN_COLOURS);
  const tower = kind === 'Tower' || kind === 'Hotel' || (kind === 'Flats' && rng() < .5);
  const size: PlotSize = tower ? 's' : kind === 'House' || rng() < .55 ? 's' : 'w';
  const floors = tower ? 3 + Math.floor(rng() * 4) : kind === 'Office' ? 3 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 2);
  const roof = tower || kind === 'Office' ? pick(ROOFS.filter(r => r !== 'peak')) : pick(ROOFS);
  const look: Look = { wall: COLOUR_HEX[colour], trim: pick(TRIMS), floors, window: pick(WINDOWS), roof, ...(SIGNS[kind] && { sign: SIGNS[kind] }) };
  const people = tower ? floors * 4 : kind === 'House' ? 3 + floors : kind === 'Flats' ? floors * (size === 'w' ? 6 : 3) : 0;
  const price = Math.min(48, 16 + floors * 4 + (size === 'w' ? 8 : 0));
  const d: GenDesign = { seed, kind, colour, said: [colour, kind], size, look, people, tower, price };
  cache.set(seed, d);
  return d;
}

/** One he puts together himself. */
export interface Custom { wall: string; trim: string; roof: RoofStyle; window: WindowStyle; sign: string; floors: number; size: PlotSize }
export const CUSTOM_PRICE = 15;
export const CUSTOM_FLOORS = 6;
export function customDesign(c: Custom): Design {
  const tower = c.size === 's' && c.floors >= 3;
  return {
    said: ['Your building'], size: c.size, tower,
    look: { wall: c.wall, trim: c.trim, floors: c.floors, window: c.window, roof: c.roof, ...(c.sign && { sign: c.sign }) },
    people: tower ? c.floors * 4 : c.floors * (c.size === 'w' ? 5 : 3),
  };
}
