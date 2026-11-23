// Everything in the City's fixed catalogue: Districts, buildings, vehicles, paints, street things, building parts, named Jobs and
// trophies. Over 250 named things. Many change how the reward plays: a building that adds a kind of Job, a vehicle that is faster
// or flies or carries more, a District with new land. Prices go up to 100 in ones, then whole tens up to 360, because the voice has a
// clip for each of those (phrases.ts, PRICE_TENS). Every District brings cheap things as well as dear ones, so a dear thing always
// sits beside cheap ones. The economy test (economy.test.ts) plays a scripted child through all of it.
//
// Beyond this list the City never runs out (city.ts, gen.ts): more land, another floor, a fresh street of buildings made from parts,
// and Jobs made from his own streets.
import type { PlotSize } from './grid';

// ---------- Districts ----------

export const DISTRICTS = [
  { id: 0, name: 'Old Town', jobs: 0, ground: '#c9b79a', pave: '#e6d6bb', accent: '#b5523b' },
  { id: 1, name: 'Downtown', jobs: 4, ground: '#b9c0c9', pave: '#dfe3e8', accent: '#3f7cc9' },
  { id: 2, name: 'Riverside', jobs: 12, ground: '#a9cf8f', pave: '#d9ecc9', accent: '#2f8fd8' },
  { id: 3, name: 'the Harbour', jobs: 25, ground: '#b8b2a6', pave: '#ddd8cc', accent: '#2a5d8f' },
  { id: 4, name: 'the Hill', jobs: 45, ground: '#8fbf6a', pave: '#cfe5b5', accent: '#6b8f2a' },
  { id: 5, name: 'the Beach', jobs: 70, ground: '#f0dc9f', pave: '#f8edc9', accent: '#f08a2a' },
] as const;
export type DistrictName = (typeof DISTRICTS)[number]['name'];

// ---------- Jobs ----------

export const JOB_KINDS = ['bus', 'taxi', 'parcel', 'bins', 'sweeper', 'tram', 'icecream', 'heli', 'fire', 'ambulance'] as const;
export type JobKind = (typeof JOB_KINDS)[number];
/** What each kind of Job collects, said after the running count ("3. 6. 9 people!"). */
export const JOB_THINGS = {
  bus: 'people!', taxi: 'people!', parcel: 'parcels!', bins: 'bins!', sweeper: 'piles of leaves!', tram: 'people!', icecream: 'ice creams!',
  heli: 'photos!', fire: 'fires out!', ambulance: 'people!',
} as const satisfies Record<JobKind, string>;
export const JOB_NAMES = {
  bus: 'Bus Route', taxi: 'Taxi Ride', parcel: 'Parcel Round', bins: 'Bin Round', sweeper: 'Street Sweep', tram: 'Tram Line',
  icecream: 'Ice Cream Run', heli: 'Helicopter Tour', fire: 'Fire Call', ambulance: 'Ambulance Run',
} as const satisfies Record<JobKind, string>;

// ---------- buildings ----------

export type BuildingKind = 'house' | 'shop' | 'tower' | 'civic' | 'park' | 'water' | 'landmark';
/** How a building is drawn: walls, trim, how many floors high, window and roof style, and an emoji on its sign. */
export interface Look { wall: string; trim: string; floors: number; window: WindowStyle; roof: RoofStyle; sign?: string; special?: Special }
export type Special = 'park' | 'pond' | 'ferris' | 'clock' | 'stadium' | 'bridge' | 'lighthouse' | 'windmill' | 'castle' | 'coaster' | 'crane' | 'mast' | 'pier' | 'pool' | 'farm' | 'golf' | 'carpark' | 'needle' | 'observatory' | 'water-tower';
export interface Building {
  key: `b:${string}`; name: string; price: number; district: number; size: PlotSize; kind: BuildingKind; look: Look;
  /** People who live there (a tower adds more with every floor). */
  people: number;
  /** The kind of Job it adds. */
  job?: JobKind;
  /** People walk to it: shops, parks, the cinema. */
  visit?: boolean;
}
export type WindowStyle = 'square' | 'tall' | 'round' | 'arched' | 'band' | 'grid' | 'shutter' | 'porthole' | 'diamond' | 'star' | 'lattice' | 'wide';
export type RoofStyle = 'flat' | 'peak' | 'dome' | 'spire' | 'garden' | 'helipad' | 'sawtooth' | 'pagoda' | 'onion' | 'solar' | 'pool' | 'crown' | 'mansard' | 'antenna';

const b = <const N extends string>(key: string, name: N, price: number, district: number, size: PlotSize, kind: BuildingKind, people: number, look: Look, extra: Partial<Building> = {}) =>
  ({ key: `b:${key}`, name, price, district, size, kind, people, look, ...extra }) as Building & { readonly name: N };
const lk = (wall: string, trim: string, floors: number, window: WindowStyle, roof: RoofStyle, sign?: string, special?: Special): Look => ({ wall, trim, floors, window, roof, ...(sign && { sign }), ...(special && { special }) });

export const BUILDINGS = [
  // Old Town: open from the start
  b('house', 'Little House', 0, 0, 's', 'house', 4, lk('#f4d8a8', '#b5523b', 1, 'square', 'peak')),
  b('depot', 'Bus Depot', 0, 0, 'w', 'civic', 0, lk('#e9e2d0', '#e63946', 1, 'wide', 'sawtooth', '🚌'), { job: 'bus' }),
  b('cottage', 'Cottage', 6, 0, 's', 'house', 5, lk('#fff3dc', '#6b8f2a', 1, 'shutter', 'peak')),
  b('redhouse', 'Red Brick House', 8, 0, 's', 'house', 6, lk('#c8553d', '#fff', 2, 'square', 'peak')),
  b('cornershop', 'Corner Shop', 10, 0, 's', 'shop', 0, lk('#ffe08a', '#2a7f62', 1, 'wide', 'flat', '🛒'), { visit: true }),
  b('pond', 'Pond', 9, 0, 's', 'water', 0, lk('#8fd16a', '#2f8fd8', 0, 'square', 'flat', undefined, 'pond'), { visit: true }),
  b('bakery', 'Bakery', 12, 0, 's', 'shop', 0, lk('#f7c59f', '#8a4b2a', 1, 'arched', 'peak', '🥐'), { visit: true }),
  b('park', 'Park', 15, 0, 'l', 'park', 0, lk('#7cc35a', '#4a8f36', 0, 'square', 'flat', undefined, 'park'), { visit: true }),
  b('taxirank', 'Taxi Rank', 18, 0, 's', 'civic', 0, lk('#ffd23f', '#14161b', 1, 'wide', 'flat', '🚕'), { job: 'taxi' }),
  b('postoffice', 'Post Office', 20, 0, 'w', 'civic', 0, lk('#e63946', '#fff', 1, 'arched', 'flat', '📮'), { job: 'parcel' }),
  b('bricktower', 'Brick Tower', 25, 0, 's', 'tower', 4, lk('#b5523b', '#f4d8a8', 3, 'square', 'flat')),
  b('library', 'Library', 28, 0, 'w', 'civic', 0, lk('#d9c7a3', '#5a3e2b', 2, 'arched', 'peak', '📚'), { visit: true }),
  b('school', 'School', 30, 0, 'w', 'civic', 0, lk('#f2b84b', '#b5523b', 2, 'grid', 'flat', '🏫'), { visit: true }),
  b('terrace', 'Terrace Houses', 22, 0, 'w', 'house', 10, lk('#e8b796', '#5a3e2b', 2, 'square', 'peak')),
  b('firestation', 'Fire Station', 40, 0, 'w', 'civic', 0, lk('#d62828', '#fff', 2, 'wide', 'flat', '🚒'), { job: 'fire' }),
  b('clocktower', 'Clock Tower', 60, 0, 's', 'landmark', 0, lk('#d9c7a3', '#5a3e2b', 6, 'arched', 'spire', undefined, 'clock'), { visit: true }),
  b('toyshop', 'Toy Shop', 16, 0, 's', 'shop', 0, lk('#9be0ff', '#e63946', 1, 'round', 'peak', '🧸'), { visit: true }),
  // Downtown
  b('glasstower', 'Glass Tower', 35, 1, 's', 'tower', 4, lk('#7fc8f8', '#2b5d8a', 4, 'band', 'flat')),
  b('office', 'Office Block', 30, 1, 'w', 'civic', 0, lk('#c9d3dd', '#3a3f4b', 4, 'grid', 'antenna', '💼'), { visit: true }),
  b('cafe', 'Café', 12, 1, 's', 'shop', 0, lk('#fff', '#2a7f62', 1, 'wide', 'flat', '☕'), { visit: true }),
  b('pizza', 'Pizza Place', 14, 1, 's', 'shop', 0, lk('#ffe8c2', '#e63946', 1, 'wide', 'flat', '🍕'), { visit: true }),
  b('carpark', 'Car Park', 20, 1, 'w', 'civic', 0, lk('#9aa3ad', '#ffd23f', 0, 'square', 'flat', undefined, 'carpark')),
  b('bindepot', 'Bin Depot', 26, 1, 'w', 'civic', 0, lk('#5f8a3a', '#e6e6e6', 1, 'wide', 'sawtooth', '🗑️'), { job: 'bins' }),
  b('bank', 'Bank', 35, 1, 'w', 'civic', 0, lk('#ece6d6', '#3a3f4b', 2, 'tall', 'flat', '🏦')),
  b('cinema', 'Cinema', 45, 1, 'w', 'civic', 0, lk('#5b2a86', '#ffd23f', 2, 'band', 'flat', '🎬'), { visit: true }),
  b('hotel', 'Hotel', 50, 1, 's', 'tower', 4, lk('#f2e6d0', '#b08a3e', 4, 'tall', 'mansard', '🛎️')),
  b('store', 'Department Store', 60, 1, 'l', 'shop', 0, lk('#ffb3c1', '#5b2a86', 3, 'wide', 'flat', '🛍️'), { visit: true }),
  b('hospital', 'Hospital', 70, 1, 'l', 'civic', 0, lk('#ffffff', '#e63946', 3, 'grid', 'helipad', '🏥'), { job: 'ambulance' }),
  b('townhall', 'Town Hall', 90, 1, 'l', 'landmark', 0, lk('#efe4cc', '#2b5d8a', 3, 'tall', 'dome', '🏛️'), { visit: true }),
  b('needle', 'Sky Needle', 300, 1, 's', 'landmark', 0, lk('#dfe7ef', '#e63946', 16, 'band', 'spire', undefined, 'needle'), { visit: true }),
  b('flats', 'City Flats', 32, 1, 'w', 'house', 14, lk('#e9d6c0', '#3a3f4b', 4, 'square', 'flat')),
  b('gym', 'Gym', 24, 1, 's', 'shop', 0, lk('#ff8a1f', '#14161b', 1, 'wide', 'flat', '🏋️'), { visit: true }),
  b('burger', 'Burger Bar', 18, 1, 's', 'shop', 0, lk('#ffd23f', '#d62828', 1, 'wide', 'flat', '🍔'), { visit: true }),
  // Riverside
  b('boathouse', 'Boat House', 18, 2, 's', 'shop', 0, lk('#8a5a3b', '#fff', 1, 'wide', 'peak', '🛶'), { visit: true }),
  b('duckpond', 'Duck Pond', 12, 2, 's', 'water', 0, lk('#8fd16a', '#2f8fd8', 0, 'square', 'flat', '🦆', 'pond'), { visit: true }),
  b('riverflats', 'Riverside Flats', 40, 2, 's', 'tower', 4, lk('#bfe3d0', '#2a7f62', 4, 'wide', 'garden')),
  b('mill', 'Water Mill', 35, 2, 'w', 'landmark', 0, lk('#d9c7a3', '#5a3e2b', 2, 'square', 'peak', undefined, 'windmill'), { visit: true }),
  b('pier', 'Fishing Pier', 15, 2, 's', 'water', 0, lk('#2f8fd8', '#8a5a3b', 0, 'square', 'flat', '🎣', 'pier'), { visit: true }),
  b('tramdepot', 'Tram Depot', 50, 2, 'w', 'civic', 0, lk('#2a7f62', '#ffd23f', 2, 'arched', 'sawtooth', '🚋'), { job: 'tram' }),
  b('garden', 'Garden Centre', 25, 2, 'w', 'shop', 0, lk('#cfe8b8', '#2a7f62', 1, 'lattice', 'peak', '🌻'), { visit: true }),
  b('icecream', 'Ice Cream Parlour', 22, 2, 's', 'shop', 0, lk('#ffd1e0', '#e85d9a', 1, 'round', 'onion', '🍦'), { job: 'icecream', visit: true }),
  b('watertower', 'Water Tower', 30, 2, 's', 'landmark', 0, lk('#9fd8ff', '#3a3f4b', 5, 'square', 'flat', undefined, 'water-tower')),
  b('market', 'Market', 55, 2, 'l', 'shop', 0, lk('#ffe08a', '#e63946', 1, 'wide', 'sawtooth', '🍎'), { visit: true }),
  b('station', 'Train Station', 120, 2, 'l', 'landmark', 0, lk('#d9c7a3', '#2b5d8a', 2, 'arched', 'dome', '🚆'), { visit: true }),
  b('sweepershed', 'Sweeper Shed', 24, 2, 's', 'civic', 0, lk('#ffd23f', '#3a3f4b', 1, 'wide', 'flat', '🧹'), { job: 'sweeper' }),
  b('bridge', 'River Bridge', 50, 2, 'w', 'landmark', 0, lk('#2f8fd8', '#b5523b', 0, 'square', 'flat', undefined, 'bridge'), { visit: true }),
  b('cottagerow', 'River Cottages', 26, 2, 'w', 'house', 10, lk('#fff3dc', '#2f8fd8', 1, 'shutter', 'peak')),
  // the Harbour
  b('lighthouse', 'Lighthouse', 70, 3, 's', 'landmark', 0, lk('#fff', '#e63946', 7, 'porthole', 'dome', undefined, 'lighthouse'), { visit: true }),
  b('fishmarket', 'Fish Market', 30, 3, 'w', 'shop', 0, lk('#bfe3f0', '#2a5d8f', 1, 'wide', 'sawtooth', '🐟'), { visit: true }),
  b('warehouse', 'Warehouse', 40, 3, 'l', 'civic', 0, lk('#a67c52', '#3a3f4b', 2, 'wide', 'sawtooth', '📦')),
  b('crane', 'Harbour Crane', 45, 3, 's', 'landmark', 0, lk('#ffd23f', '#14161b', 6, 'square', 'flat', undefined, 'crane')),
  b('aquarium', 'Aquarium', 110, 3, 'l', 'landmark', 0, lk('#7fd3e8', '#2a5d8f', 2, 'porthole', 'dome', '🐠'), { visit: true }),
  b('sailing', 'Sailing Club', 20, 3, 's', 'shop', 0, lk('#fff', '#2a5d8f', 1, 'porthole', 'peak', '⛵'), { visit: true }),
  b('ferry', 'Ferry Terminal', 60, 3, 'w', 'civic', 0, lk('#e9e2d0', '#2a5d8f', 2, 'wide', 'flat', '⛴️'), { visit: true }),
  b('seafood', 'Seafood Shack', 14, 3, 's', 'shop', 0, lk('#ffcf99', '#2a5d8f', 1, 'wide', 'peak', '🦀'), { visit: true }),
  b('harbourtower', 'Harbour Tower', 60, 3, 's', 'tower', 4, lk('#cfe0ee', '#2a5d8f', 5, 'porthole', 'antenna')),
  b('dock', 'Dockside Flats', 36, 3, 'w', 'house', 12, lk('#d8cfc0', '#2a5d8f', 3, 'square', 'flat')),
  // the Hill
  b('observatory', 'Observatory', 120, 4, 's', 'landmark', 0, lk('#e9eef3', '#3a3f4b', 3, 'round', 'dome', undefined, 'observatory'), { visit: true }),
  b('castle', 'Castle', 250, 4, 'l', 'landmark', 0, lk('#b9b2a6', '#6b6157', 4, 'arched', 'crown', undefined, 'castle'), { visit: true }),
  b('lodge', 'Ski Lodge', 40, 4, 'w', 'house', 8, lk('#8a5a3b', '#fff', 2, 'shutter', 'peak', '🎿'), { visit: true }),
  b('windmill', 'Windmill', 35, 4, 's', 'landmark', 0, lk('#f2e6d0', '#8a5a3b', 4, 'round', 'peak', undefined, 'windmill'), { visit: true }),
  b('farm', 'Farm', 45, 4, 'l', 'civic', 0, lk('#d62828', '#fff', 1, 'shutter', 'peak', '🐄', 'farm'), { visit: true }),
  b('villa', 'Hilltop Villa', 40, 4, 'w', 'house', 8, lk('#fff6e6', '#d9822b', 2, 'arched', 'peak')),
  b('mast', 'Radio Mast', 50, 4, 's', 'landmark', 0, lk('#e63946', '#fff', 10, 'square', 'flat', undefined, 'mast')),
  b('helipad', 'Helipad', 80, 4, 's', 'civic', 0, lk('#3a3f4b', '#ffd23f', 1, 'wide', 'helipad', '🚁'), { job: 'heli' }),
  b('tearoom', 'Tea Room', 14, 4, 's', 'shop', 0, lk('#fbe3e8', '#6b8f2a', 1, 'arched', 'peak', '🫖'), { visit: true }),
  b('hilltower', 'Hill Tower', 70, 4, 's', 'tower', 4, lk('#e6dcc8', '#6b8f2a', 5, 'tall', 'pagoda')),
  b('stadium', 'Stadium', 360, 4, 'l', 'landmark', 0, lk('#e9eef3', '#2b5d8a', 3, 'band', 'flat', undefined, 'stadium'), { visit: true }),
  // the Beach
  b('ferris', 'Ferris Wheel', 200, 5, 'l', 'landmark', 0, lk('#ffd23f', '#e63946', 8, 'square', 'flat', undefined, 'ferris'), { visit: true }),
  b('beachhut', 'Beach Hut', 8, 5, 's', 'house', 2, lk('#9be0ff', '#fff', 1, 'square', 'peak')),
  b('surf', 'Surf Shop', 18, 5, 's', 'shop', 0, lk('#2ec4b6', '#ffd23f', 1, 'wide', 'flat', '🏄'), { visit: true }),
  b('beachpier', 'Seaside Pier', 90, 5, 'l', 'landmark', 0, lk('#2f8fd8', '#fff', 0, 'square', 'flat', '🎡', 'pier'), { visit: true }),
  b('sandcafe', 'Sandcastle Café', 16, 5, 's', 'shop', 0, lk('#f0dc9f', '#d9822b', 1, 'round', 'crown', '🏰'), { visit: true }),
  b('beachhotel', 'Beach Hotel', 75, 5, 's', 'tower', 4, lk('#fff', '#2ec4b6', 5, 'wide', 'pool')),
  b('lifeguard', 'Lifeguard Tower', 25, 5, 's', 'landmark', 0, lk('#e63946', '#fff', 3, 'square', 'peak')),
  b('waterpark', 'Water Park', 160, 5, 'l', 'landmark', 0, lk('#7fd3e8', '#e85d9a', 1, 'square', 'flat', '🌊', 'pool'), { visit: true }),
  b('minigolf', 'Mini Golf', 35, 5, 'w', 'park', 0, lk('#7cc35a', '#e63946', 0, 'square', 'flat', '⛳', 'golf'), { visit: true }),
  b('coaster', 'Roller Coaster', 340, 5, 'l', 'landmark', 0, lk('#e63946', '#ffd23f', 6, 'square', 'flat', undefined, 'coaster'), { visit: true }),
  b('kiosk', 'Ice Cream Kiosk', 12, 5, 's', 'shop', 0, lk('#fff', '#e85d9a', 1, 'wide', 'flat', '🍧'), { visit: true }),
  b('beachhouse', 'Beach House', 30, 5, 'w', 'house', 8, lk('#ffe8c2', '#2ec4b6', 2, 'shutter', 'flat')),
] as const satisfies readonly Building[];
/** The buildings he starts with, already standing on his first Block. */
export const STARTER_BUILDINGS = ['b:house', 'b:depot'] as const;

// ---------- vehicles ----------

export interface Vehicle {
  key: `v:${string}`; name: string; price: number; district: number; job: JobKind;
  speed: number; grip: number; radius: number; fly?: boolean;
  /** Carries this many more at each stop. */
  extra?: number;
  /** Its own colour; a paint changes it. */
  colour: string;
  shape: 'bus' | 'double' | 'bendy' | 'car' | 'van' | 'lorry' | 'sweeper' | 'tram' | 'heli' | 'truck' | 'bike' | 'mini' | 'open';
  /** Comes free with the building that adds its Job. */
  free?: boolean;
}
const v = <const N extends string>(key: string, name: N, price: number, district: number, job: JobKind, shape: Vehicle['shape'], colour: string, speed: number, grip: number, radius: number, extra: Partial<Vehicle> = {}) =>
  ({ key: `v:${key}`, name, price, district, job, shape, colour, speed, grip, radius, ...extra }) as Vehicle & { readonly name: N };

export const VEHICLES = [
  v('bus', 'City Bus', 0, 0, 'bus', 'bus', '#e63946', 170, 5.5, 17, { free: true }),
  v('minibus', 'Minibus', 15, 0, 'bus', 'mini', '#2f8fd8', 200, 7, 15),
  v('double', 'Double-Decker', 40, 1, 'bus', 'double', '#d62828', 165, 5, 18, { extra: 1 }),
  v('bendy', 'Bendy Bus', 55, 2, 'bus', 'bendy', '#2a7f62', 175, 4.5, 18, { extra: 2 }),
  v('electric', 'Electric Bus', 70, 3, 'bus', 'bus', '#2ec4b6', 215, 6, 17, { extra: 1 }),
  v('tourbus', 'Open-Top Bus', 90, 5, 'bus', 'open', '#ffd23f', 185, 5.5, 18, { extra: 2 }),
  v('goldbus', 'Golden Bus', 130, 4, 'bus', 'double', '#f2b84b', 230, 6.5, 18, { extra: 3 }),
  v('taxi', 'Taxi', 0, 0, 'taxi', 'car', '#ffd23f', 210, 7, 14, { free: true }),
  v('limo', 'Limo', 60, 1, 'taxi', 'car', '#14161b', 220, 6, 16, { extra: 1 }),
  v('rockettaxi', 'Rocket Taxi', 100, 5, 'taxi', 'car', '#e85d9a', 260, 8, 14),
  v('van', 'Parcel Van', 0, 0, 'parcel', 'van', '#e63946', 190, 6.5, 15, { free: true }),
  v('cargobike', 'Cargo Bike', 25, 1, 'parcel', 'bike', '#2a7f62', 230, 9, 12),
  v('bigvan', 'Big Van', 45, 3, 'parcel', 'lorry', '#5b2a86', 180, 5, 18, { extra: 2 }),
  v('binlorry', 'Bin Lorry', 0, 1, 'bins', 'lorry', '#5f8a3a', 160, 5, 18, { free: true }),
  v('megabin', 'Mega Bin Lorry', 65, 4, 'bins', 'lorry', '#2ec4b6', 190, 5.5, 19, { extra: 2 }),
  v('sweeper', 'Street Sweeper', 0, 2, 'sweeper', 'sweeper', '#ffd23f', 150, 7, 15, { free: true }),
  v('turbosweeper', 'Turbo Sweeper', 50, 3, 'sweeper', 'sweeper', '#ff8a1f', 210, 8, 15, { extra: 1 }),
  v('tram', 'Tram', 0, 2, 'tram', 'tram', '#2a7f62', 170, 5, 17, { free: true }),
  v('vintagetram', 'Vintage Tram', 65, 3, 'tram', 'tram', '#b5523b', 160, 5, 17, { extra: 2 }),
  v('icecreamvan', 'Ice Cream Van', 0, 2, 'icecream', 'van', '#ffd1e0', 180, 6.5, 15, { free: true }),
  v('icetruck', 'Super Ice Cream Truck', 55, 5, 'icecream', 'lorry', '#9be0ff', 200, 6, 18, { extra: 2 }),
  v('heli', 'Helicopter', 0, 4, 'heli', 'heli', '#e63946', 220, 4, 20, { free: true, fly: true }),
  v('jetheli', 'Jet Copter', 110, 5, 'heli', 'heli', '#14161b', 290, 5, 20, { fly: true, extra: 1 }),
  v('fireengine', 'Fire Engine', 0, 0, 'fire', 'truck', '#d62828', 200, 6, 18, { free: true }),
  v('laddertruck', 'Ladder Truck', 75, 2, 'fire', 'truck', '#e63946', 210, 5.5, 19, { extra: 1 }),
  v('ambulance', 'Ambulance', 0, 1, 'ambulance', 'van', '#ffffff', 230, 7, 15, { free: true }),
  v('rescuejet', 'Rescue Truck', 85, 4, 'ambulance', 'truck', '#ffd23f', 240, 7, 17, { extra: 1 }),
] as const satisfies readonly Vehicle[];

// ---------- paints (for his vehicles) ----------

export interface Paint { key: `p:${string}`; name: string; price: number; district: number; colour: string }
const PAINT_ROWS = [
  ['red', 'Fire Red', 4, 0], ['blue', 'Sky Blue', 4, 0], ['green', 'Park Green', 4, 0], ['yellow', 'Sunny Yellow', 5, 0], ['orange', 'Orange', 5, 0],
  ['purple', 'Grape Purple', 6, 1], ['pink', 'Bubblegum Pink', 6, 1], ['black', 'Night Black', 7, 1], ['white', 'Snow White', 5, 1], ['silver', 'Silver', 8, 1],
  ['teal', 'River Teal', 6, 2], ['lime', 'Lime', 6, 2], ['navy', 'Navy Blue', 7, 2], ['brown', 'Chocolate', 7, 2], ['gold', 'Gold', 12, 2],
  ['sea', 'Sea Green', 7, 3], ['coral', 'Coral', 7, 3], ['sand', 'Sand', 6, 3], ['rust', 'Rust', 8, 3], ['ocean', 'Ocean Blue', 9, 3],
  ['moss', 'Moss', 8, 4], ['plum', 'Plum', 9, 4], ['sunset', 'Sunset', 10, 4], ['mint', 'Mint', 8, 4], ['cherry', 'Cherry', 10, 4],
  ['peach', 'Peach', 9, 5], ['lemon', 'Lemon', 9, 5], ['aqua', 'Aqua', 10, 5], ['candy', 'Candy Stripe', 12, 5], ['rainbow', 'Rainbow', 14, 5],
] as const;
const PAINT_COLOURS: Record<string, string> = {
  red: '#e63946', blue: '#4aa3ec', green: '#2bb673', yellow: '#ffd23f', orange: '#ff8a1f', purple: '#7b4bc4', pink: '#ff7eb6', black: '#22252b', white: '#f6f6f6', silver: '#b8c0c8',
  teal: '#2ec4b6', lime: '#a3e635', navy: '#1e3a8a', brown: '#7b4a2a', gold: '#e0b12f', sea: '#3fb68b', coral: '#ff7f6b', sand: '#e8d29b', rust: '#b7472a', ocean: '#1f6fb2',
  moss: '#6b8f2a', plum: '#7a2d6b', sunset: '#ff5e3a', mint: '#98f5c9', cherry: '#c2185b', peach: '#ffb38a', lemon: '#fff176', aqua: '#5ee7f0', candy: '#ff9ad5', rainbow: '#ff5e3a',
};
export const PAINTS = PAINT_ROWS.map(([k, name, price, district]) => ({ key: `p:${k}` as const, name, price, district, colour: PAINT_COLOURS[k]! })) satisfies readonly Paint[];

// ---------- street things (they stand along his streets by themselves) ----------

export interface StreetThing { key: `f:${string}`; name: string; price: number; district: number; emoji: string }
const STREET_ROWS = [
  ['bench', 'Bench', 3, 0, '🪑'], ['oak', 'Oak Tree', 3, 0, '🌳'], ['lamp', 'Street Lamp', 4, 0, '💡'], ['flowers', 'Flower Bed', 4, 0, '🌷'],
  ['postbox', 'Post Box', 4, 0, '📮'], ['hydrant', 'Fire Hydrant', 3, 0, '🧯'], ['bin', 'Litter Bin', 3, 0, '🗑️'], ['busstop', 'Bus Stop Sign', 5, 0, '🚏'],
  ['fountain', 'Fountain', 20, 0, '⛲'], ['statue', 'Statue', 25, 0, '🗽'],
  ['pine', 'Pine Tree', 4, 1, '🌲'], ['lights', 'Traffic Lights', 8, 1, '🚦'], ['bikes', 'Bike Rack', 5, 1, '🚲'], ['phonebox', 'Phone Box', 6, 1, '☎️'],
  ['sculpture', 'Sculpture', 30, 1, '🗿'], ['newsstand', 'Newsstand', 9, 1, '📰'], ['planter', 'Planter', 5, 1, '🪴'], ['flag', 'Flag Pole', 10, 1, '🚩'],
  ['willow', 'Willow Tree', 6, 2, '🌿'], ['ducks', 'Ducks', 7, 2, '🦆'], ['bandstand', 'Bandstand', 35, 2, '🎺'], ['birdbath', 'Bird Bath', 6, 2, '🐦'],
  ['lilies', 'Water Lilies', 5, 2, '🪷'], ['hedge', 'Hedge', 4, 2, '🌱'],
  ['anchor', 'Anchor', 9, 3, '⚓'], ['buoy', 'Buoy', 6, 3, '🛟'], ['nets', 'Fishing Nets', 7, 3, '🥅'], ['gulls', 'Seagulls', 5, 3, '🕊️'], ['crates', 'Crates', 6, 3, '📦'],
  ['cherrytree', 'Cherry Tree', 6, 4, '🌸'], ['sheep', 'Sheep', 8, 4, '🐑'], ['scarecrow', 'Scarecrow', 9, 4, '🎃'], ['rocks', 'Big Rocks', 5, 4, '🪨'], ['sunflowers', 'Sunflowers', 6, 4, '🌻'],
  ['palm', 'Palm Tree', 6, 5, '🌴'], ['umbrella', 'Beach Umbrella', 5, 5, '⛱️'], ['shells', 'Shells', 4, 5, '🐚'], ['sandcastle', 'Sandcastle', 8, 5, '🏰'], ['kite', 'Kite', 7, 5, '🪁'], ['crab', 'Crab', 6, 5, '🦀'],
] as const;
export const STREET_THINGS = STREET_ROWS.map(([k, name, price, district, emoji]) => ({ key: `f:${k}` as const, name, price, district, emoji })) satisfies readonly StreetThing[];

// ---------- building parts (for the fresh street and for the buildings he designs) ----------

export type PartSlot = 'roof' | 'window' | 'wall' | 'sign';
export interface BuildPart { key: `r:${string}` | `w:${string}` | `m:${string}` | `s:${string}`; slot: PartSlot; name: string; price: number; district: number; value: string }
const part = <const R extends readonly (readonly [string, string, number, number])[]>(slot: PartSlot, prefix: 'r' | 'w' | 'm' | 's', rows: R) =>
  rows.map(([value, name, price, district]) => ({ key: `${prefix}:${value}` as BuildPart['key'], slot, name: name as R[number][1], price, district, value }));
export const PARTS = [
  ...part('roof', 'r', [['flat', 'Flat Roof', 0, 0], ['peak', 'Pointed Roof', 0, 0], ['garden', 'Garden Roof', 10, 0], ['dome', 'Dome Roof', 14, 1], ['spire', 'Spire', 16, 1],
    ['antenna', 'Antenna Roof', 9, 1], ['sawtooth', 'Zigzag Roof', 8, 2], ['solar', 'Solar Roof', 12, 2], ['helipad', 'Helipad Roof', 18, 3], ['pagoda', 'Pagoda Roof', 15, 4],
    ['onion', 'Onion Dome', 15, 4], ['mansard', 'Fancy Roof', 11, 3], ['pool', 'Pool Roof', 20, 5], ['crown', 'Crown Roof', 22, 5]]),
  ...part('window', 'w', [['square', 'Square Windows', 0, 0], ['tall', 'Tall Windows', 6, 0], ['round', 'Round Windows', 7, 0], ['arched', 'Arched Windows', 8, 1],
    ['band', 'Glass Bands', 10, 1], ['grid', 'Grid Windows', 7, 1], ['shutter', 'Shutters', 8, 2], ['porthole', 'Portholes', 9, 3], ['diamond', 'Diamond Windows', 10, 4],
    ['star', 'Star Windows', 12, 5], ['lattice', 'Lattice Windows', 9, 2], ['wide', 'Wide Windows', 6, 0]]),
  ...part('wall', 'm', [['#f4d8a8', 'Sandstone', 0, 0], ['#c8553d', 'Red Brick', 0, 0], ['#ffffff', 'White Plaster', 5, 0], ['#7fc8f8', 'Blue Glass', 9, 1], ['#3a3f4b', 'Dark Glass', 10, 1],
    ['#bfe3d0', 'Mint Wood', 7, 2], ['#ffd1e0', 'Pink Plaster', 7, 2], ['#d8cfc0', 'Stone', 8, 3], ['#a67c52', 'Timber', 8, 4], ['#ffe08a', 'Yellow Paint', 6, 0],
    ['#9be0ff', 'Beach Blue', 8, 5], ['#e0b12f', 'Gold Panels', 16, 5]]),
  ...part('sign', 's', [['', 'No Sign', 0, 0], ['🍕', 'Pizza Sign', 5, 0], ['☕', 'Coffee Sign', 5, 1], ['🍩', 'Doughnut Sign', 6, 1], ['📚', 'Book Sign', 5, 0], ['🎮', 'Games Sign', 7, 1],
    ['🌸', 'Flower Sign', 5, 2], ['🐟', 'Fish Sign', 6, 3], ['🍦', 'Ice Cream Sign', 6, 2], ['⭐', 'Star Sign', 8, 4], ['🎈', 'Balloon Sign', 7, 5], ['🚀', 'Rocket Sign', 9, 5]]),
] satisfies readonly BuildPart[];
export const STARTER_PARTS = PARTS.filter(p => p.price === 0).map(p => p.key);

// ---------- named Jobs ----------

export interface NamedJob { key: `j:${string}`; name: string; kind: JobKind; district: number }
const J = [
  ['loop', 'Old Town Loop', 'bus', 0], ['school', 'School Run', 'bus', 0], ['bakery', 'Bakery Rush', 'taxi', 0], ['letters', 'Letters Round', 'parcel', 0],
  ['smoke', 'Smoky Kitchen', 'fire', 0], ['market', 'Market Day', 'bus', 0],
  ['express', 'Downtown Express', 'bus', 1], ['shopping', 'Shopping Trip', 'taxi', 1], ['office', 'Office Post', 'parcel', 1], ['binday', 'Bin Day', 'bins', 1],
  ['checkup', 'Check-Up Run', 'ambulance', 1], ['movie', 'Movie Night', 'taxi', 1], ['nightbus', 'Night Bus', 'bus', 1],
  ['riverbus', 'River Bus', 'bus', 2], ['tramfirst', 'First Tram', 'tram', 2], ['leaves', 'Autumn Leaves', 'sweeper', 2], ['scoops', 'Sunny Scoops', 'icecream', 2],
  ['ducks', 'Duck Pond Drop', 'parcel', 2], ['tramloop', 'Tram Loop', 'tram', 2], ['millfire', 'Mill Fire', 'fire', 2],
  ['ferrybus', 'Ferry Bus', 'bus', 3], ['fishday', 'Fish Delivery', 'parcel', 3], ['dockbins', 'Dockside Bins', 'bins', 3], ['seaside', 'Seaside Taxi', 'taxi', 3],
  ['harbourtram', 'Harbour Tram', 'tram', 3], ['lighthouse', 'Lighthouse Call', 'ambulance', 3], ['sweepdock', 'Windy Dock Sweep', 'sweeper', 3],
  ['skytour', 'Sky Tour', 'heli', 4], ['hillbus', 'Hill Climb Bus', 'bus', 4], ['farmfire', 'Farm Fire', 'fire', 4], ['castletour', 'Castle Tour', 'heli', 4],
  ['hillpost', 'Hill Post', 'parcel', 4], ['snowsweep', 'Snowy Sweep', 'sweeper', 4], ['starwatch', 'Star Watch Taxi', 'taxi', 4],
  ['beachbus', 'Beach Bus', 'bus', 5], ['coneday', 'Ice Cream Day', 'icecream', 5], ['coast', 'Coast Tour', 'heli', 5], ['sandsweep', 'Sandy Sweep', 'sweeper', 5],
  ['pierrun', 'Pier Run', 'ambulance', 5], ['bigday', 'Big Day Out', 'tram', 5],
] as const satisfies readonly (readonly [string, string, JobKind, number])[];
export const NAMED_JOBS = J.map(([k, name, kind, district]) => ({ key: `j:${k}` as const, name, kind, district })) satisfies readonly NamedJob[];

// ---------- trophies ----------

export type TrophyRule =
  | { t: 'pop'; at: number } | { t: 'jobs'; at: number } | { t: 'floors'; at: number } | { t: 'blocks'; at: number }
  | { t: 'kind'; kind: JobKind } | { t: 'best'; at: number } | { t: 'districts'; at: number } | { t: 'bought'; at: number };
export interface Trophy { key: `t:${string}`; name: string; rule: TrophyRule; emoji: string }
const T = [
  ['town', 'Town Trophy', { t: 'pop', at: 60 }, '🏘️'], ['city', 'City Trophy', { t: 'pop', at: 200 }, '🏙️'], ['bigcity', 'Big City Trophy', { t: 'pop', at: 500 }, '🌆'],
  ['huge', 'Huge City Trophy', { t: 'pop', at: 1000 }, '🌃'], ['mega', 'Mega City Trophy', { t: 'pop', at: 2000 }, '🌉'],
  ['jobs10', '10 Jobs Medal', { t: 'jobs', at: 10 }, '🥉'], ['jobs25', '25 Jobs Medal', { t: 'jobs', at: 25 }, '🥈'], ['jobs50', '50 Jobs Medal', { t: 'jobs', at: 50 }, '🥇'],
  ['jobs100', '100 Jobs Cup', { t: 'jobs', at: 100 }, '🏆'], ['jobs200', '200 Jobs Cup', { t: 'jobs', at: 200 }, '🏆'], ['jobs365', 'Year of Jobs Cup', { t: 'jobs', at: 365 }, '👑'],
  ['tall10', 'Tall Tower Flag', { t: 'floors', at: 10 }, '🚩'], ['tall20', 'Taller Tower Flag', { t: 'floors', at: 20 }, '🎌'], ['tall30', 'Sky High Flag', { t: 'floors', at: 30 }, '🏁'],
  ['blocks8', 'Land Map', { t: 'blocks', at: 8 }, '🗺️'], ['blocks16', 'Big Land Map', { t: 'blocks', at: 16 }, '🧭'], ['blocks24', 'Huge Land Map', { t: 'blocks', at: 24 }, '🌍'],
  ['blocks40', 'Endless Land Map', { t: 'blocks', at: 40 }, '🌏'],
  ['k-bus', 'Bus Driver Badge', { t: 'kind', kind: 'bus' }, '🚌'], ['k-taxi', 'Taxi Driver Badge', { t: 'kind', kind: 'taxi' }, '🚕'],
  ['k-parcel', 'Postie Badge', { t: 'kind', kind: 'parcel' }, '📮'], ['k-bins', 'Bin Crew Badge', { t: 'kind', kind: 'bins' }, '🗑️'],
  ['k-sweeper', 'Sweeper Badge', { t: 'kind', kind: 'sweeper' }, '🧹'], ['k-tram', 'Tram Driver Badge', { t: 'kind', kind: 'tram' }, '🚋'],
  ['k-icecream', 'Ice Cream Badge', { t: 'kind', kind: 'icecream' }, '🍦'], ['k-heli', 'Pilot Badge', { t: 'kind', kind: 'heli' }, '🚁'],
  ['k-fire', 'Firefighter Badge', { t: 'kind', kind: 'fire' }, '🚒'], ['k-ambulance', 'Paramedic Badge', { t: 'kind', kind: 'ambulance' }, '🚑'],
  ['best20', 'Full Bus Star', { t: 'best', at: 20 }, '⭐'], ['best30', 'Packed Bus Star', { t: 'best', at: 30 }, '🌟'],
  ['all6', 'Six Districts Crown', { t: 'districts', at: 6 }, '👑'], ['bought50', 'Builder Badge', { t: 'bought', at: 50 }, '🔨'], ['bought150', 'Master Builder Badge', { t: 'bought', at: 150 }, '🏗️'],
] as const satisfies readonly (readonly [string, string, TrophyRule, string])[];
export const TROPHIES = T.map(([k, name, rule, emoji]) => ({ key: `t:${k}` as const, name, rule: rule as TrophyRule, emoji })) satisfies readonly Trophy[];

// ---------- the shop's things, together ----------

/** Everything that can be bought, by key. */
export type Item = Building | Vehicle | Paint | StreetThing | BuildPart;
export type ItemKey = Item['key'];
export const ITEMS: readonly Item[] = [...BUILDINGS, ...VEHICLES, ...PAINTS, ...STREET_THINGS, ...PARTS];
const byKey = new Map<string, Item>(ITEMS.map(i => [i.key, i]));
export const itemOf = (k: string): Item | null => byKey.get(k) ?? null;
export const isItemKey = (k: unknown): k is ItemKey => typeof k === 'string' && byKey.has(k);
export const buildingOf = (k: string) => (k.startsWith('b:') ? (byKey.get(k) as Building | undefined) ?? null : null);
export const vehicleOf = (k: string) => (k.startsWith('v:') ? (byKey.get(k) as Vehicle | undefined) ?? null : null);
/** Things that come free: starters, and each Job's own vehicle (it comes with the building that adds the Job). */
export const isFree = (i: Item) => i.price === 0;
export const FOR_SALE = ITEMS.filter(i => !isFree(i));
/** The fixed catalogue, everything there is to earn by name: what is sold, the Districts, the named Jobs, the trophies. */
export const CATALOGUE_SIZE = ITEMS.length + DISTRICTS.length + NAMED_JOBS.length + TROPHIES.length;
