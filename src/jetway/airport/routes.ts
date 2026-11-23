// Where he flies. Twenty-four Routes, each with its own little airport, weather and scenery, flown in order; a Route he can't fly yet
// needs a piece of his own airport first (the tower for night, the de-icing pad for snow, the seaplane dock for islands), and the
// Flight button skips past it to the next one, so he is never stuck. Then the Charter Flights, made on the spot (charter.ts).
import { int, pick, seeded, shuffle, type Rng } from '../../game/rng';

export const WEATHERS = ['clear', 'cloud', 'rain', 'snow', 'wind', 'fog'] as const;
export type Weather = (typeof WEATHERS)[number];
export const SCENES = ['beach', 'farm', 'lake', 'mountain', 'desert', 'city', 'island', 'snow', 'jungle', 'canyon', 'volcano', 'harbour', 'space', 'castle', 'lighthouse', 'rainbow', 'glacier', 'reef', 'pole', 'coast'] as const;
export type Scene = (typeof SCENES)[number];

/** How the far airport is built, from parts: drawn beside its runway in the side view as he lands. */
export interface FarAirport {
  readonly tower: 0 | 1 | 2 | 3;
  readonly terminal: 0 | 1 | 2 | 3;
  readonly hangars: number;
  readonly trees: number;
  readonly roof: string;
  readonly wall: string;
  /** The runway's length, in Flight units. */
  readonly runway: number;
  /** Where each building stands, from the runway's far end (x) and how wide it is. */
  readonly parts: readonly { readonly kind: 'tower' | 'terminal' | 'hangar' | 'tree' | 'sign'; readonly x: number; readonly w: number; readonly h: number }[];
}

export interface Destination {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly scene: Scene;
  readonly weather: Weather;
  readonly night: boolean;
  /** 0 calm to 1 gusty: gusts wobble the plane, never more. */
  readonly wind: number;
  /** How long the cruise is, in Flight units (the turboprop flies about 260 a second). */
  readonly distance: number;
  /** Stars (or crates) to pick up on the way, and fires below for the water bomber. */
  readonly stars: readonly { readonly x: number; readonly alt: number }[];
  readonly fires: readonly number[];
  readonly far: FarAirport;
  /** Water to land on: an island or a reef. */
  readonly sea: boolean;
  /** A piece of his airport this Route needs (Routes only; a Charter can always be flown). */
  readonly needs: string | null;
}

/** The band he flies in, in Flight units above the ground. */
export const SKY_LOW = 90, SKY_HIGH = 520, CRUISE_ALT = 280;
const COLOURS = ['#e63946', '#2f8fe8', '#ffd23f', '#2fa84f', '#ff7a00', '#7b4bd1', '#1fa6a0', '#f4f6fa', '#ff7ac8'];

/** Lays out the far airport from parts, so the same seed always builds the same one. Nothing overlaps (charter.test.ts). */
export function farAirport(rng: Rng, size: number): FarAirport {
  const tower = int(rng, 0, 3) as FarAirport['tower'], terminal = Math.min(3, int(rng, 0, 1 + size)) as FarAirport['terminal'], hangars = int(rng, 0, 2), trees = int(rng, 1, 5);
  const parts: FarAirport['parts'][number][] = [];
  let x = 40;
  const put = (kind: FarAirport['parts'][number]['kind'], w: number, h: number) => { parts.push({ kind, x, w, h }); x += w + int(rng, 16, 40); };
  const order = shuffle(rng, [
    ...(tower ? [['tower', 40, 90 + tower * 40] as const] : []),
    ['terminal', 120 + terminal * 70, 50 + terminal * 22] as const,
    ...Array.from({ length: hangars }, () => ['hangar', 110, 60] as const),
    ['sign', 40, 40] as const,
  ]);
  for (const [k, w, h] of order) put(k, w, h);
  for (let i = 0; i < trees; i++) put('tree', 30, int(rng, 30, 60));
  return { tower, terminal, hangars, trees, roof: pick(rng, COLOURS), wall: pick(rng, ['#f4f6fa', '#e3c38a', '#b8c2cc', '#ffe9c7', '#c9e7ff']), runway: Math.max(900, x + 120), parts };
}

/** Stars along the cruise: in little arcs and lines, all inside the band he can fly in. */
export function starsFor(rng: Rng, distance: number, count: number): Destination['stars'] {
  const out: { x: number; alt: number }[] = [];
  const gap = distance / (count + 1);
  let alt = CRUISE_ALT;
  for (let i = 1; i <= count; i++) {
    alt = Math.max(SKY_LOW + 40, Math.min(SKY_HIGH - 40, alt + int(rng, -90, 90)));
    out.push({ x: Math.round(i * gap), alt });
  }
  return out;
}

interface RouteDef { id: string; name: string; icon: string; scene: Scene; weather: Weather; night?: boolean; wind: number; needs?: string }
const DEFS = [
  { id: 'r1', name: 'Sandy Beach', icon: '🏖️', scene: 'beach', weather: 'clear', wind: 0 },
  { id: 'r2', name: 'Farm Field', icon: '🚜', scene: 'farm', weather: 'clear', wind: .1 },
  { id: 'r3', name: 'Lake Town', icon: '🏞️', scene: 'lake', weather: 'cloud', wind: .1 },
  { id: 'r4', name: 'Desert Strip', icon: '🌵', scene: 'desert', weather: 'clear', wind: .2 },
  { id: 'r5', name: 'Big City', icon: '🏙️', scene: 'city', weather: 'cloud', wind: .15, needs: 'piece:terminal' },
  { id: 'r6', name: 'High Mountains', icon: '🏔️', scene: 'mountain', weather: 'cloud', wind: .35, needs: 'piece:tarmac' },
  { id: 'r7', name: 'Palm Island', icon: '🏝️', scene: 'island', weather: 'clear', wind: .2, needs: 'piece:dock' },
  { id: 'r8', name: 'Snowy Town', icon: '⛄', scene: 'snow', weather: 'snow', wind: .2, needs: 'piece:deice' },
  { id: 'r9', name: 'City at Night', icon: '🌃', scene: 'city', weather: 'clear', night: true, wind: .1, needs: 'piece:tower' },
  { id: 'r10', name: 'Rainforest', icon: '🌴', scene: 'jungle', weather: 'rain', wind: .25 },
  { id: 'r11', name: 'Red Canyon', icon: '🏜️', scene: 'canyon', weather: 'wind', wind: .55, needs: 'piece:weather' },
  { id: 'r12', name: 'Volcano Island', icon: '🌋', scene: 'volcano', weather: 'cloud', wind: .4, needs: 'piece:dock' },
  { id: 'r13', name: 'Busy Harbour', icon: '⚓', scene: 'harbour', weather: 'rain', wind: .3, needs: 'piece:cargo' },
  { id: 'r14', name: 'Castle Hill', icon: '🏰', scene: 'castle', weather: 'fog', wind: .25, needs: 'piece:long' },
  { id: 'r15', name: 'Lighthouse Point', icon: '🗼', scene: 'lighthouse', weather: 'fog', night: true, wind: .35, needs: 'piece:tower' },
  { id: 'r16', name: 'Rainbow Valley', icon: '🌈', scene: 'rainbow', weather: 'rain', wind: .2 },
  { id: 'r17', name: 'North Pole', icon: '🎅', scene: 'pole', weather: 'snow', wind: .45, needs: 'piece:deice' },
  { id: 'r18', name: 'Coral Reef', icon: '🐠', scene: 'reef', weather: 'clear', wind: .3, needs: 'piece:dock' },
  { id: 'r19', name: 'Sunset Coast', icon: '🌅', scene: 'coast', weather: 'clear', wind: .3, needs: 'piece:fuel' },
  { id: 'r20', name: 'Ice Glacier', icon: '🧊', scene: 'glacier', weather: 'snow', wind: .5, needs: 'piece:plough' },
  { id: 'r21', name: 'Rocket Range', icon: '🚀', scene: 'space', weather: 'clear', wind: .3, needs: 'piece:radar' },
  { id: 'r22', name: 'Capital City', icon: '🏛️', scene: 'city', weather: 'cloud', wind: .35, needs: 'piece:bigterminal' },
  { id: 'r23', name: 'Space Port', icon: '🛸', scene: 'space', weather: 'clear', night: true, wind: .4, needs: 'piece:talltower' },
  { id: 'r24', name: 'Northern Lights', icon: '🌌', scene: 'snow', weather: 'clear', night: true, wind: .5, needs: 'piece:talltower' },
] as const satisfies readonly RouteDef[];

export type RouteId = (typeof DEFS)[number]['id'];
export type RouteName = (typeof DEFS)[number]['name'];
export const ROUTE_NAMES = DEFS.map(d => d.name) as RouteName[];

export const ROUTES: readonly Destination[] = DEFS.map((d: RouteDef, i) => {
  const rng = seeded(1000 + i * 17), distance = 5200 + i * 120, count = 10 + Math.floor(i / 4);
  return {
    id: d.id, name: d.name, icon: d.icon, scene: d.scene, weather: d.weather, night: d.night ?? false, wind: d.wind, distance,
    stars: starsFor(rng, distance, count), fires: [distance * .3, distance * .6].map(Math.round), far: farAirport(rng, Math.floor(i / 8)),
    sea: d.scene === 'island' || d.scene === 'reef' || d.scene === 'volcano', needs: d.needs ?? null,
  };
});
export const ROUTE_IDS = ROUTES.map(r => r.id);
export const isRouteId = (x: unknown): x is string => typeof x === 'string' && ROUTE_IDS.includes(x);
export const routeBy = (id: string) => ROUTES.find(r => r.id === id) ?? ROUTES[0]!;
