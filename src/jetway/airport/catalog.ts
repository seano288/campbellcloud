// Everything there is to buy for the Airport. Pieces go in fixed places on the plot (plot.ts), so the layout always works; he picks the
// order. Planes make the Fleet, and each plane wears a livery made from parts he buys once and uses on any plane: a body colour, a stripe,
// a trim colour and a tail art (30 × 12 × 30 × 24 = 259,200 planes before the Charter tails). Ground vehicles drive about the airport in
// "Watch it run". Signs and lights and garden things dress it up.
//
// Pieces matter, and the Flight reads them (airport.ts): a longer runway lets bigger planes fly, each gate parks one more plane, the tower
// opens night Routes, the de-icing pad snowy ones, the seaplane dock island ones, the cargo apron cargo Flights, the radar shows the
// stars ahead, the approach lights start the line of lights further out, the terminal and the car parks and trains bring more
// passengers on each Flight.
//
// Prices up to 100 can be any number; above 100 they are whole tens up to 400, because the voice has a clip for each of those
// (phrases.ts, PRICE_TENS). A dear thing always changes what he can do; a paint is never the dearest thing.

export const CATEGORIES = ['piece', 'plane', 'paint', 'stripe', 'tail', 'mark', 'vehicle', 'sign', 'decor'] as const;
export type Category = (typeof CATEGORIES)[number];

interface Base { readonly id: string; readonly name: string; readonly price: number; readonly icon: string; readonly needs?: string }
export interface PieceItem extends Base { readonly cat: 'piece' | 'sign' | 'decor'; readonly does?: string }
export interface PlaneItem extends Base { readonly cat: 'plane'; readonly model: PlaneModel }
export interface PaintItem extends Base { readonly cat: 'paint'; readonly hex: string }
export interface StripeItem extends Base { readonly cat: 'stripe'; readonly pattern: StripePattern }
export interface TailItem extends Base { readonly cat: 'tail'; readonly glyph: string; readonly bg?: string }
export interface MarkItem extends Base { readonly cat: 'mark'; readonly shape: MarkShape }
export interface VehicleItem extends Base { readonly cat: 'vehicle'; readonly hex: string; readonly len: number }
export type Item = PieceItem | PlaneItem | PaintItem | StripeItem | TailItem | MarkItem | VehicleItem;

// ---------- pieces (and signs, lights and garden things, which also go in fixed places) ----------

const piece = <const N extends string>(id: string, name: N, price: number, icon: string, needs?: string, does?: string) => ({ cat: 'piece', id: `piece:${id}`, name, price, icon, ...(needs && { needs: `piece:${needs}` }), ...(does && { does }) }) as PieceItem & { readonly name: N };
const sign = <const N extends string>(id: string, name: N, price: number, icon: string, needs?: string, does?: string) => ({ cat: 'sign', id: `sign:${id}`, name, price, icon, ...(needs && { needs }), ...(does && { does }) }) as PieceItem & { readonly name: N };
const decor = <const N extends string>(id: string, name: N, price: number, icon: string) => ({ cat: 'decor', id: `decor:${id}`, name, price, icon }) as PieceItem & { readonly name: N };

export const PIECES = [
  // the runway: a grass strip to start, then tarmac, long, and a crossing pair
  piece('tarmac', 'Tarmac Runway', 30, '🛬', undefined, 'runway1'),
  piece('long', 'Long Runway', 120, '🛫', 'tarmac', 'runway2'),
  piece('crossing', 'Crossing Runway', 200, '✖️', 'long', 'windy'),
  piece('taxiway', 'Taxiway', 12, '〰️'),
  piece('taxiway2', 'Long Taxiway', 35, '〰️', 'taxiway'),
  piece('apron', 'Apron', 18, '⬛'),
  // the terminal, in stages
  piece('hut', 'Ticket Hut', 10, '🎟️', undefined, 'pax'),
  piece('terminal', 'Small Terminal', 45, '🏢', 'hut', 'pax'),
  piece('bigterminal', 'Big Terminal', 110, '🏬', 'terminal', 'pax'),
  piece('glass', 'Glass Terminal', 250, '💎', 'bigterminal', 'pax'),
  piece('baggage', 'Baggage Hall', 40, '🧳', 'hut'),
  piece('food', 'Food Court', 35, '🍔', 'terminal'),
  piece('shops', 'Shop Row', 28, '🛍️', 'terminal'),
  piece('lounge', 'Sky Lounge', 60, '🛋️', 'bigterminal'),
  piece('deck', 'Viewing Deck', 45, '🔭', 'terminal'),
  piece('roofgarden', 'Rooftop Garden', 40, '🌿', 'bigterminal'),
  // gates: each one parks one more plane
  piece('gate1', 'Gate 1', 14, '🚪'),
  piece('gate2', 'Gate 2', 22, '🚪', 'gate1'),
  piece('gate3', 'Gate 3', 32, '🚪', 'gate2'),
  piece('gate4', 'Gate 4', 44, '🚪', 'gate3'),
  piece('gate5', 'Gate 5', 58, '🚪', 'gate4'),
  piece('gate6', 'Gate 6', 75, '🚪', 'gate5'),
  piece('bridges', 'Jet Bridges', 50, '🌉', 'gate2'),
  // the tower and what it opens
  piece('tower', 'Control Tower', 55, '🗼', undefined, 'night'),
  piece('talltower', 'Tall Tower', 140, '📡', 'tower', 'night2'),
  piece('radar', 'Radar', 70, '📡', undefined, 'radar'),
  piece('weather', 'Weather Station', 30, '🌡️', undefined, 'weather'),
  // hangars and workshops
  piece('hangar', 'Small Hangar', 22, '🏚️'),
  piece('bighangar', 'Big Hangar', 75, '🏭', 'hangar'),
  piece('paintshop', 'Paint Shop', 26, '🎨', undefined, 'stripes'),
  piece('maintenance', 'Repair Shed', 30, '🔧'),
  piece('museum', 'Museum Hangar', 190, '🏛️', 'bighangar'),
  // airport services
  piece('fire', 'Fire Station', 40, '🚒'),
  piece('firepit', 'Fire Training Yard', 35, '🔥', 'fire'),
  piece('fuel', 'Fuel Farm', 50, '⛽', undefined, 'far'),
  piece('cargo', 'Cargo Apron', 85, '📦', undefined, 'cargo'),
  piece('warehouse', 'Cargo Warehouse', 65, '🏗️', 'cargo'),
  piece('deice', 'De-icing Pad', 60, '❄️', undefined, 'snow'),
  piece('plough', 'Snow Plough Garage', 40, '🏔️', 'deice', 'snow2'),
  piece('helipad', 'Helipad', 35, '🚁', undefined, 'heli'),
  piece('dock', 'Seaplane Dock', 70, '⚓', undefined, 'sea'),
  piece('catering', 'Catering Kitchen', 30, '🍱'),
  piece('post', 'Post Office', 26, '📮'),
  // getting there
  piece('carpark', 'Car Park', 20, '🅿️', undefined, 'pax'),
  piece('bigcarpark', 'Big Car Park', 55, '🅿️', 'carpark', 'pax'),
  piece('busstop', 'Bus Stop', 12, '🚏', undefined, 'pax'),
  piece('taxi', 'Taxi Rank', 18, '🚕', undefined, 'pax'),
  piece('hotel', 'Airport Hotel', 130, '🏨', undefined, 'pax'),
  piece('train', 'Train Station', 160, '🚉', undefined, 'pax'),
  piece('monorail', 'Monorail', 180, '🚝', 'terminal', 'pax'),
  piece('monostation', 'Monorail Station', 50, '🚏', 'monorail', 'pax'),
  // power and water
  piece('watertower', 'Water Tower', 24, '🗼'),
  piece('solar', 'Solar Farm', 65, '🔆'),
  piece('wind', 'Wind Turbines', 80, '🌬️'),
  piece('show', 'Air Show Stand', 120, '🎪', undefined, 'show'),
  piece('blast', 'Blast Fence', 16, '🧱', 'tarmac'),
  piece('clock', 'Clock Tower', 32, '🕰️'),
] as const satisfies readonly PieceItem[];

export const SIGNS = [
  sign('windsock', 'Windsock', 5, '🎐'),
  sign('flags', 'Flag Poles', 8, '🚩'),
  sign('holdlines', 'Hold Lines', 6, '🟨'),
  sign('numbers', 'Runway Numbers', 9, '🔢'),
  sign('taxisigns', 'Taxiway Signs', 11, '🪧', 'piece:taxiway'),
  sign('welcome', 'Welcome Sign', 12, '👋'),
  sign('airline', 'Airline Sign', 24, '✈️'),
  sign('arrivals', 'Arrivals Board', 16, '🛬', 'piece:hut'),
  sign('departures', 'Departures Board', 16, '🛫', 'piece:hut'),
  sign('board', 'Big Passenger Board', 20, '🔢', 'piece:terminal'),
  sign('neon', 'Neon Sign', 30, '💡'),
  sign('billboard', 'Billboard', 22, '🖼️'),
  sign('runwaylights', 'Runway Lights', 25, '💡', undefined, 'lights'),
  sign('approach', 'Approach Lights', 45, '🔦', 'sign:runwaylights', 'approach'),
  sign('edgelights', 'Taxiway Lights', 18, '🔵', 'piece:taxiway'),
  sign('glidelights', 'Glide Lights', 40, '🚦', 'sign:runwaylights', 'glide'),
  sign('beacon', 'Tower Beacon', 22, '🔆', 'piece:tower'),
  sign('flood', 'Floodlights', 35, '🔦'),
  sign('search', 'Searchlights', 48, '🔦', 'piece:tower'),
  sign('goldlights', 'Gold Runway Lights', 60, '🌟', 'sign:runwaylights', 'gold'),
] as const satisfies readonly PieceItem[];

export const DECOR = [
  decor('trees', 'Row of Trees', 6, '🌳'),
  decor('flowers', 'Flower Beds', 7, '🌷'),
  decor('palms', 'Palm Trees', 9, '🌴'),
  decor('benches', 'Benches', 5, '🪑'),
  decor('pond', 'Duck Pond', 14, '🦆'),
  decor('fountain', 'Fountain', 18, '⛲'),
  decor('statue', 'Pilot Statue', 25, '🗿'),
  decor('playground', 'Playground', 22, '🛝'),
  decor('picnic', 'Picnic Tables', 10, '🧺'),
  decor('kites', 'Kite Field', 12, '🪁'),
  decor('balloons', 'Hot Air Balloons', 38, '🎈'),
  decor('rainbow', 'Rainbow Arch', 30, '🌈'),
  decor('hedge', 'Hedge Maze', 28, '🌲'),
  decor('pines', 'Pine Woods', 15, '🌲'),
  decor('sunflowers', 'Sunflower Field', 16, '🌻'),
  decor('mushrooms', 'Toadstool Ring', 11, '🍄'),
  decor('planeplay', 'Plane Climbing Frame', 34, '🛩️'),
  decor('lake', 'Little Lake', 26, '🏞️'),
  decor('cows', 'Cow Field', 13, '🐄'),
  decor('snowman', 'Snowman', 8, '⛄'),
] as const satisfies readonly PieceItem[];

// ---------- the Fleet ----------

export const PLANE_MODELS = ['twoseater', 'duster', 'float', 'heli', 'turboprop', 'regional', 'private', 'cargo', 'bomber', 'jumbo', 'double', 'super'] as const;
export type PlaneModel = (typeof PLANE_MODELS)[number];
export type Ability = 'none' | 'spray' | 'float' | 'heli' | 'cargo' | 'water' | 'boom';
/** How each plane flies. `runway`: 0 flies off grass, 1 needs tarmac, 2 the long runway; the helicopter needs the helipad.
 *  `seats` passengers aboard (the cargo plane carries crates); `speed` its cruise, 1 the turboprop's; `size` how big it's drawn. */
export interface PlaneSpec { readonly runway: 0 | 1 | 2; readonly seats: number; readonly speed: number; readonly size: number; readonly ability: Ability; readonly engines: 0 | 1 | 2 | 4; readonly jet: boolean }
export const PLANE_SPECS: Record<PlaneModel, PlaneSpec> = {
  twoseater: { runway: 0, seats: 2, speed: .85, size: .7, ability: 'none', engines: 1, jet: false },
  duster: { runway: 0, seats: 1, speed: .85, size: .7, ability: 'spray', engines: 1, jet: false },
  float: { runway: 0, seats: 6, speed: .9, size: .8, ability: 'float', engines: 1, jet: false },
  heli: { runway: 0, seats: 5, speed: .8, size: .75, ability: 'heli', engines: 0, jet: false },
  turboprop: { runway: 1, seats: 40, speed: 1, size: .9, ability: 'none', engines: 2, jet: false },
  regional: { runway: 1, seats: 70, speed: 1.1, size: 1, ability: 'none', engines: 2, jet: true },
  private: { runway: 1, seats: 10, speed: 1.25, size: .85, ability: 'none', engines: 2, jet: true },
  cargo: { runway: 2, seats: 0, speed: 1.05, size: 1.15, ability: 'cargo', engines: 4, jet: false },
  bomber: { runway: 1, seats: 4, speed: .95, size: 1, ability: 'water', engines: 2, jet: false },
  jumbo: { runway: 2, seats: 400, speed: 1.15, size: 1.3, ability: 'none', engines: 4, jet: true },
  double: { runway: 2, seats: 550, speed: 1.15, size: 1.4, ability: 'none', engines: 4, jet: true },
  super: { runway: 2, seats: 100, speed: 1.6, size: 1.2, ability: 'boom', engines: 4, jet: true },
};
const plane = <const N extends string>(model: PlaneModel, name: N, price: number, icon: string) => ({ cat: 'plane', id: `plane:${model}`, name, price, icon, model }) as PlaneItem & { readonly name: N };
export const PLANES = [
  plane('twoseater', 'Two-Seater', 0, '🛩️'),
  plane('duster', 'Crop Duster', 20, '🛩️'),
  plane('float', 'Floatplane', 55, '🛥️'),
  plane('heli', 'Helicopter', 70, '🚁'),
  plane('turboprop', 'Turboprop', 90, '✈️'),
  plane('regional', 'Regional Jet', 120, '✈️'),
  plane('private', 'Private Jet', 140, '🛩️'),
  plane('cargo', 'Cargo Plane', 170, '📦'),
  plane('bomber', 'Water Bomber', 190, '💧'),
  plane('jumbo', 'Jumbo Jet', 260, '✈️'),
  plane('double', 'Double-Decker', 330, '✈️'),
  plane('super', 'Supersonic Jet', 400, '🚀'),
] as const satisfies readonly PlaneItem[];

// ---------- liveries ----------

const paint = <const N extends string>(id: string, name: N, price: number, hex: string) => ({ cat: 'paint', id: `paint:${id}`, name, price, icon: '🎨', hex }) as PaintItem & { readonly name: N };
export const PAINTS = [
  paint('white', 'Cloud White', 0, '#f4f6fa'),
  paint('red', 'Rocket Red', 3, '#e63946'), paint('blue', 'Sky Blue', 3, '#2f8fe8'), paint('yellow', 'Sunny Yellow', 4, '#ffd23f'),
  paint('green', 'Grass Green', 4, '#2fa84f'), paint('orange', 'Safety Orange', 5, '#ff7a00'), paint('navy', 'Night Navy', 5, '#1d3a78'),
  paint('purple', 'Plum Purple', 6, '#7b4bd1'), paint('pink', 'Bubblegum Pink', 6, '#ff7ac8'), paint('black', 'Jet Black', 7, '#24262c'),
  paint('silver', 'Shiny Silver', 8, '#b8c2cc'), paint('teal', 'Teal', 8, '#1fa6a0'), paint('lime', 'Lime', 9, '#9bd62f'),
  paint('sand', 'Desert Sand', 9, '#e3c38a'), paint('cherry', 'Cherry', 10, '#b3123a'), paint('sea', 'Sea Green', 10, '#2fbf8f'),
  paint('lemon', 'Lemon', 11, '#fff27a'), paint('grape', 'Grape', 12, '#5a2a8a'), paint('coral', 'Coral', 12, '#ff6f61'),
  paint('ice', 'Ice Blue', 13, '#a9e4ff'), paint('mint', 'Mint', 14, '#9ef0c9'), paint('chocolate', 'Chocolate', 14, '#6b3f22'),
  paint('peach', 'Peach', 15, '#ffb38a'), paint('forest', 'Forest Green', 16, '#1f6b3a'), paint('sunset', 'Sunset Orange', 18, '#ff8f3d'),
  paint('royal', 'Royal Blue', 20, '#2346c8'), paint('rose', 'Rose Gold', 24, '#e8a59a'), paint('bronze', 'Bronze', 26, '#b07a3c'),
  paint('gold', 'Gold', 30, '#e6b422'), paint('rainbow', 'Rainbow', 36, 'rainbow'),
] as const satisfies readonly PaintItem[];

export const STRIPE_PATTERNS = ['none', 'cheat', 'twin', 'swoosh', 'tailband', 'belly', 'chequer', 'zigzag', 'stars', 'waves', 'flames', 'racing', 'dots'] as const;
export type StripePattern = (typeof STRIPE_PATTERNS)[number];
const stripe = <const N extends string>(pattern: StripePattern, name: N, price: number) => ({ cat: 'stripe', id: `stripe:${pattern}`, name, price, icon: '〰️', pattern, ...(price && { needs: 'piece:paintshop' }) }) as StripeItem & { readonly name: N };
export const STRIPES = [
  stripe('none', 'Plain', 0), stripe('cheat', 'Window Stripe', 8), stripe('twin', 'Twin Stripes', 10), stripe('swoosh', 'Swoosh', 14),
  stripe('tailband', 'Tail Band', 9), stripe('belly', 'Belly Band', 12), stripe('chequer', 'Chequers', 22), stripe('zigzag', 'Zigzag', 18),
  stripe('stars', 'Star Trail', 26), stripe('waves', 'Waves', 20), stripe('flames', 'Flames', 32), stripe('racing', 'Racing Stripes', 16),
  stripe('dots', 'Polka Dots', 15),
] as const satisfies readonly StripeItem[];

const tail = <const N extends string>(id: string, name: N, price: number, glyph: string) => ({ cat: 'tail', id: `tail:${id}`, name, price, icon: glyph, glyph }) as TailItem & { readonly name: N };
export const TAILS = [
  tail('none', 'Plain Tail', 0, ''),
  tail('star', 'Star Tail', 4, '⭐'), tail('heart', 'Heart Tail', 4, '❤️'), tail('sun', 'Sun Tail', 5, '☀️'), tail('moon', 'Moon Tail', 5, '🌙'),
  tail('bolt', 'Lightning Tail', 6, '⚡'), tail('leaf', 'Leaf Tail', 6, '🍀'), tail('flower', 'Flower Tail', 7, '🌸'), tail('bird', 'Bird Tail', 8, '🐦'),
  tail('paw', 'Paw Tail', 8, '🐾'), tail('crown', 'Crown Tail', 10, '👑'), tail('wave', 'Wave Tail', 10, '🌊'), tail('mountain', 'Mountain Tail', 12, '⛰️'),
  tail('cloud', 'Cloud Tail', 12, '☁️'), tail('rocket', 'Rocket Tail', 14, '🚀'), tail('planet', 'Planet Tail', 15, '🪐'), tail('snow', 'Snowflake Tail', 16, '❄️'),
  tail('anchor', 'Anchor Tail', 18, '⚓'), tail('diamond', 'Diamond Tail', 20, '💎'), tail('rainbow', 'Rainbow Tail', 24, '🌈'), tail('fish', 'Fish Tail', 26, '🐟'),
  tail('dragon', 'Dragon Tail', 34, '🐉'), tail('owl', 'Owl Tail', 28, '🦉'), tail('tiger', 'Tiger Tail', 38, '🐯'), tail('unicorn', 'Unicorn Tail', 45, '🦄'),
] as const satisfies readonly TailItem[];

export const MARK_SHAPES = ['none', 'ring', 'wings', 'globe', 'arrow', 'triangle', 'shield', 'compass', 'propeller', 'swirl', 'diamond', 'starring', 'bolt'] as const;
export type MarkShape = (typeof MARK_SHAPES)[number];
const mark = <const N extends string>(shape: MarkShape, name: N, price: number) => ({ cat: 'mark', id: `mark:${shape}`, name, price, icon: '🔰', shape }) as MarkItem & { readonly name: N };
export const MARKS = [
  mark('none', 'No Mark', 0), mark('ring', 'Ring Mark', 5), mark('wings', 'Wings Mark', 9), mark('globe', 'Globe Mark', 12), mark('arrow', 'Arrow Mark', 7),
  mark('triangle', 'Triangle Mark', 6), mark('shield', 'Shield Mark', 14), mark('compass', 'Compass Mark', 18), mark('propeller', 'Propeller Mark', 16),
  mark('swirl', 'Swirl Mark', 11), mark('diamond', 'Diamond Mark', 13), mark('starring', 'Star Ring Mark', 20), mark('bolt', 'Bolt Mark', 10),
] as const satisfies readonly MarkItem[];

// ---------- ground vehicles ----------

const vehicle = <const N extends string>(id: string, name: N, price: number, icon: string, hex: string, len: number, needs?: string) => ({ cat: 'vehicle', id: `vehicle:${id}`, name, price, icon, hex, len, ...(needs && { needs }) }) as VehicleItem & { readonly name: N };
export const VEHICLES = [
  vehicle('bagcart', 'Bag Cart', 8, '🧳', '#ffb000', 22), vehicle('tug', 'Tug', 10, '🚜', '#ffd23f', 16), vehicle('followme', 'Follow-Me Car', 12, '🚗', '#ffd23f', 18),
  vehicle('stairs', 'Stairs Truck', 15, '🪜', '#f4f6fa', 24), vehicle('mail', 'Mail Van', 18, '🚐', '#e63946', 22, 'piece:post'), vehicle('fueltruck', 'Fuel Truck', 20, '⛽', '#2fa84f', 30),
  vehicle('sweeper', 'Runway Sweeper', 22, '🧹', '#ff7a00', 24), vehicle('catering', 'Catering Truck', 25, '🍱', '#f4f6fa', 28, 'piece:catering'), vehicle('police', 'Police Car', 25, '🚓', '#1d3a78', 20),
  vehicle('pushback', 'Pushback Tug', 28, '🚜', '#24262c', 20), vehicle('bus', 'Apron Bus', 30, '🚌', '#2f8fe8', 36), vehicle('ambulance', 'Ambulance', 30, '🚑', '#f4f6fa', 24),
  vehicle('water', 'Water Truck', 35, '💧', '#1fa6a0', 28), vehicle('fireengine', 'Fire Engine', 40, '🚒', '#e63946', 34, 'piece:fire'), vehicle('loader', 'Cargo Loader', 45, '📦', '#ffb000', 30, 'piece:cargo'),
  vehicle('plough', 'Snow Plough', 45, '❄️', '#ff7a00', 30, 'piece:plough'), vehicle('deicer', 'De-Icer Truck', 50, '🧊', '#a9e4ff', 30, 'piece:deice'), vehicle('limo', 'VIP Limo', 60, '🚘', '#24262c', 34),
] as const satisfies readonly VehicleItem[];

// ---------- everything ----------

export const ITEMS: readonly Item[] = [...PIECES, ...SIGNS, ...DECOR, ...PLANES, ...PAINTS, ...STRIPES, ...TAILS, ...MARKS, ...VEHICLES];
const BY_ID = new Map(ITEMS.map(i => [i.id, i]));
export type ItemName = (typeof PIECES)[number]['name'] | (typeof SIGNS)[number]['name'] | (typeof DECOR)[number]['name'] | (typeof PLANES)[number]['name']
  | (typeof PAINTS)[number]['name'] | (typeof STRIPES)[number]['name'] | (typeof TAILS)[number]['name'] | (typeof MARKS)[number]['name'] | (typeof VEHICLES)[number]['name'];
export const ITEM_NAMES = [...new Set(ITEMS.map(i => i.name))] as ItemName[];
export const isItemId = (x: unknown): x is string => typeof x === 'string' && BY_ID.has(x);
export const itemOf = (id: string): Item => { const i = BY_ID.get(id); if (!i) throw new Error(`No item ${id}`); return i; };
/** What he starts with: the free plane, colour, stripe, tail and mark. */
export const STARTERS = ITEMS.filter(i => i.price === 0).map(i => i.id);
/** Everything in the fixed catalogue that is for sale. */
export const FOR_SALE = ITEMS.filter(i => i.price > 0);
export const paintHex = (id: string) => (BY_ID.get(id) as PaintItem | undefined)?.hex ?? '#f4f6fa';

// ---------- things he can buy again and again ----------

/** Another concourse, gate, hangar or stretch of runway: the price rises gently and then stays flat, and nothing bought is lost. Only
 *  `drawn` of each are drawn on the plot; the rest are counted on a sign. */
export const REPEATS = [
  { id: 'concourse', name: 'Another Concourse', icon: '🏢', needs: 'piece:bigterminal', first: 60, step: 10, top: 120, drawn: 4 },
  { id: 'gate', name: 'Another Gate', icon: '🚪', needs: 'piece:gate6', first: 40, step: 5, top: 80, drawn: 8 },
  { id: 'hangar', name: 'Another Hangar', icon: '🏚️', needs: 'piece:bighangar', first: 50, step: 10, top: 100, drawn: 4 },
  { id: 'stretch', name: 'Runway Stretch', icon: '🛫', needs: 'piece:long', first: 30, step: 5, top: 60, drawn: 4 },
] as const;
export type RepeatId = (typeof REPEATS)[number]['id'];
export type RepeatName = (typeof REPEATS)[number]['name'];
export const REPEAT_IDS = REPEATS.map(r => r.id) as RepeatId[];
export const repeatOf = (id: RepeatId) => REPEATS.find(r => r.id === id)!;
/** The price of the next one when he already has `owned`. */
export const repeatPrice = (id: RepeatId, owned: number) => { const r = repeatOf(id); return Math.min(r.top, r.first + r.step * owned); };

// ---------- the airline ----------

export const AIRLINE_FIRST = ['Sky', 'Sun', 'Star', 'Blue', 'Jet', 'Rocket', 'Cloud', 'Rainbow', 'Eagle', 'Comet', 'Happy', 'Zoom'] as const;
export const AIRLINE_SECOND = ['Air', 'Airways', 'Jets', 'Wings', 'Lines', 'Flyers'] as const;
/** The names he can give a plane: he taps through them and each is said. */
export const PLANE_NAMES = ['Bluebird', 'Speedy', 'Zippy', 'Buddy', 'Captain', 'Ace', 'Skipper', 'Sunny', 'Comet', 'Rocket', 'Breezy', 'Champ',
  'Lucky', 'Maverick', 'Pebble', 'Thunder', 'Whizzer', 'Biscuit', 'Nimbus', 'Rascal', 'Scout', 'Sparky', 'Tiger', 'Bolt'] as const;
