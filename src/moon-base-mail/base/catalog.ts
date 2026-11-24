// Everything there is to buy for the Moon Base. Modules go on the plots of his base (one per plot; he picks where) and come by the
// supply ship, one each Landing. Landers and their parts change how the Landing plays; suits, helmets, flags, paints, plants and things
// for the base dress it.
//
// Modules matter (base.ts reads them): the greenhouse lets him grow plants (and feeds more crew: living domes past the second need it);
// each living dome adds a crew member; the solar field lights the base through the long night; the rover garage gives him the moon buggy
// to drive, and its parts; the observatory lets him look through the telescope; the workshop makes lander parts and holds his moon rocks;
// the second landing pad takes the bigger landers; the crane tower, hangar and rocket pad open the crane, tall and star landers.
//
// Prices up to 100 can be any number; above 100 they are whole tens, because the voice has a clip for each of those (PRICE_TENS in
// phrases.ts). A dear thing always changes what he can do; a paint is never the dearest thing.

export const CATEGORIES = ['module', 'lander', 'part', 'paint', 'dome', 'suit', 'helmet', 'flag', 'plant', 'decor', 'buggy'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Item {
  readonly id: string;
  readonly cat: Category;
  readonly name: string;
  readonly price: number;
  readonly icon: string;
  /** What it needs first (another item's id). */
  readonly needs?: string;
  /** What it does, for modules that matter. */
  readonly does?: string;
  /** A colour, for paints, suits and the like. */
  readonly hex?: string;
  /** A lander part's slot and rank. */
  readonly slot?: 'legs' | 'engine' | 'jets' | 'lights';
  readonly rank?: number;
}

const mk = (cat: Category) => <const N extends string>(id: string, name: N, price: number, icon: string, more: Partial<Item> = {}) =>
  ({ id: `${cat}:${id}`, cat, name, price, icon, ...more, ...(more.needs && { needs: more.needs.includes(':') ? more.needs : `module:${more.needs}` }) }) as Item & { readonly name: N };
const module = mk('module'), lander = mk('lander'), part = mk('part'), paint = mk('paint'), dome = mk('dome'), suit = mk('suit'), helmet = mk('helmet');
const flag = mk('flag'), plant = mk('plant'), decor = mk('decor'), buggy = mk('buggy');

// ---------- modules ----------

export const MODULES = [
  module('living1', 'Living Dome', 14, '🏠', { does: 'crew' }),
  module('greenhouse', 'Greenhouse', 22, '🌿', { does: 'plants' }),
  module('mailroom', 'Mail Room', 16, '📬'),
  module('cathouse', 'Cat House', 12, '🐈'),
  module('robotdock', 'Robot Dock', 24, '🤖'),
  module('store', 'Store Room', 18, '📦'),
  module('flagtower', 'Flag Tower', 20, '🚩'),
  module('kitchen', 'Kitchen', 26, '🍳'),
  module('radio', 'Radio Mast', 28, '📻'),
  module('solar', 'Solar Field', 32, '🔆', { does: 'night lights' }),
  module('gym', 'Gym', 30, '🏋️'),
  module('dustwash', 'Dust Wash', 27, '🚿'),
  module('fuel', 'Fuel Tanks', 29, '⛽'),
  module('living2', 'Living Dome 2', 38, '🏠', { does: 'crew' }),
  module('art', 'Art Room', 34, '🎨'),
  module('battery', 'Battery Shed', 36, '🔋', { needs: 'solar' }),
  module('medbay', 'Med Bay', 37, '🩺'),
  module('seedbank', 'Seed Bank', 39, '🌰', { needs: 'greenhouse' }),
  module('workshop', 'Workshop', 42, '🔧', { does: 'lander parts and the rock shelf' }),
  module('music', 'Music Room', 41, '🎵'),
  module('airplant', 'Air Plant', 44, '💨'),
  module('garage', 'Rover Garage', 48, '🚙', { does: 'the moon buggy' }),
  module('books', 'Book Dome', 46, '📚'),
  module('beacon', 'Beacon', 45, '🗼'),
  module('rocklab', 'Rock Lab', 49, '🪨', { needs: 'workshop' }),
  module('snacks', 'Snack Bar', 47, '🍩', { needs: 'kitchen' }),
  module('games', 'Game Room', 52, '🎲'),
  module('water', 'Water Plant', 54, '💧'),
  module('living3', 'Living Dome 3', 55, '🏠', { does: 'crew', needs: 'greenhouse' }),
  module('lookout', 'Lookout Tower', 58, '🗼'),
  module('sleeppods', 'Sleep Pods', 60, '🛏️'),
  module('lab', 'Science Lab', 63, '🔬'),
  module('pad2', 'Landing Pad 2', 66, '🛬', { does: 'bigger landers' }),
  module('dish', 'Big Dish', 68, '📡', { needs: 'radio' }),
  module('observatory', 'Observatory', 72, '🔭', { does: 'the telescope' }),
  module('living4', 'Living Dome 4', 75, '🏠', { does: 'crew', needs: 'living3' }),
  module('icemine', 'Ice Mine', 80, '🧊', { needs: 'water' }),
  module('fishdome', 'Fish Dome', 85, '🐠', { needs: 'water' }),
  module('movies', 'Movie Dome', 90, '🎬'),
  module('living5', 'Living Dome 5', 95, '🏠', { does: 'crew', needs: 'living4' }),
  module('gardendome', 'Glass Garden Dome', 120, '🌳', { needs: 'greenhouse', does: 'plants grow twice as fast' }),
  module('living6', 'Living Dome 6', 110, '🏠', { does: 'crew', needs: 'living5' }),
  module('cranetower', 'Crane Tower', 130, '🏗️', { needs: 'pad2', does: 'the crane lander' }),
  module('stardome', 'Star Dome', 130, '✨', { needs: 'observatory' }),
  module('train', 'Tunnel Train', 130, '🚇', { does: 'a train in the tunnels' }),
  module('hangar', 'Hangar', 190, '🛖', { needs: 'pad2', does: 'the tall lander' }),
  module('moonmine', 'Moon Mine', 230, '⛏️', { needs: 'icemine', does: 'rarer moon rocks' }),
  module('bigscope', 'Giant Telescope', 260, '🔭', { needs: 'stardome', does: 'see far planets' }),
  module('rocketpad', 'Rocket Pad', 290, '🚀', { needs: 'hangar', does: 'the star lander' }),
  module('elevator', 'Sky Elevator', 330, '🛗', { needs: 'lookout', does: 'a ride up high' }),
] as const;

// ---------- landers and their parts ----------

/** How each lander flies (landing/sim.ts): its engine, how fast it slides, how soft its legs are, how far it hops. */
export interface LanderSpec { readonly thrust: number; readonly slide: number; readonly bounce: number; readonly hop: number; readonly width: number }
export const LANDERS = [
  lander('little', 'Little Lander', 0, '🛸'),
  lander('hopper', 'Hopper', 40, '🦘'),
  lander('wide', 'Wide Cargo Lander', 120, '🚛', { needs: 'pad2' }),
  lander('tall', 'Tall Lander', 160, '🗼', { needs: 'hangar' }),
  lander('crane', 'Crane Lander', 220, '🏗️', { needs: 'cranetower' }),
  lander('star', 'Star Lander', 340, '🌟', { needs: 'rocketpad' }),
] as const;
export type LanderKind = 'little' | 'hopper' | 'wide' | 'tall' | 'crane' | 'star';
export const LANDER_SPECS: Record<LanderKind, LanderSpec> = {
  little: { thrust: 13, slide: 46, bounce: 0.45, hop: 1, width: 1 },
  hopper: { thrust: 13, slide: 50, bounce: 0.55, hop: 1.5, width: 1 },
  wide: { thrust: 12, slide: 44, bounce: 0.25, hop: 1.1, width: 1.5 },
  tall: { thrust: 17, slide: 50, bounce: 0.4, hop: 1.2, width: 1 },
  crane: { thrust: 15, slide: 54, bounce: 0.35, hop: 1.2, width: 1.3 },
  star: { thrust: 16, slide: 64, bounce: 0.3, hop: 1.6, width: 1.1 },
};
export const PARTS = [
  part('legs1', 'Springy Legs', 25, '🦵', { slot: 'legs', rank: 1, needs: 'workshop' }),
  part('legs2', 'Super Springs', 60, '🦵', { slot: 'legs', rank: 2, needs: 'part:legs1' }),
  part('legs3', 'Pillow Legs', 110, '☁️', { slot: 'legs', rank: 3, needs: 'part:legs2' }),
  part('engine1', 'Big Engine', 30, '🔥', { slot: 'engine', rank: 1, needs: 'workshop' }),
  part('engine2', 'Mega Engine', 70, '🔥', { slot: 'engine', rank: 2, needs: 'part:engine1' }),
  part('engine3', 'Super Engine', 130, '☄️', { slot: 'engine', rank: 3, needs: 'part:engine2' }),
  part('jets1', 'Side Jets', 28, '💨', { slot: 'jets', rank: 1, needs: 'workshop' }),
  part('jets2', 'Quick Jets', 65, '💨', { slot: 'jets', rank: 2, needs: 'part:jets1' }),
  part('jets3', 'Zoom Jets', 120, '⚡', { slot: 'jets', rank: 3, needs: 'part:jets2' }),
  part('red', 'Red Lights', 12, '🔴', { slot: 'lights', hex: '#ff4d4d', needs: 'workshop' }),
  part('blue', 'Blue Lights', 12, '🔵', { slot: 'lights', hex: '#4da6ff', needs: 'workshop' }),
  part('green', 'Green Lights', 14, '🟢', { slot: 'lights', hex: '#5cff7a', needs: 'workshop' }),
  part('gold', 'Gold Lights', 18, '🟡', { slot: 'lights', hex: '#ffd23f', needs: 'workshop' }),
  part('rainbow', 'Rainbow Lights', 40, '🌈', { slot: 'lights', hex: 'rainbow', needs: 'workshop' }),
] as const;

// ---------- paints: the lander's and the domes' ----------

export const PAINTS = [
  paint('white', 'Moon White', 0, '⚪', { hex: '#f2f2f2' }),
  paint('red', 'Fire Red', 8, '🔴', { hex: '#e63946' }), paint('blue', 'Sky Blue', 8, '🔵', { hex: '#3a86ff' }),
  paint('orange', 'Sunset Orange', 9, '🟠', { hex: '#ff8c1a' }), paint('green', 'Alien Green', 9, '🟢', { hex: '#2ec45a' }),
  paint('purple', 'Galaxy Purple', 10, '🟣', { hex: '#8e44ec' }), paint('black', 'Space Black', 11, '⚫', { hex: '#262626' }),
  paint('yellow', 'Lemon Yellow', 12, '🟡', { hex: '#ffd23f' }), paint('pink', 'Bubblegum Pink', 13, '🩷', { hex: '#ff6fb5' }),
  paint('teal', 'Ocean Teal', 14, '🩵', { hex: '#16b3b3' }), paint('silver', 'Chrome Silver', 16, '🩶', { hex: '#c0c7d0' }),
  paint('gold', 'Shiny Gold', 18, '🥇', { hex: '#e8b923' }), paint('lime', 'Glow Lime', 15, '🍏', { hex: '#b6ff3b' }),
  paint('navy', 'Midnight Blue', 17, '🌌', { hex: '#1d2b6e' }), paint('candy', 'Cotton Candy', 19, '🍬', { hex: '#ffb3de' }),
  paint('stripes', 'Racing Stripes', 24, '🏁', { hex: '#f2f2f2' }),
] as const;
export const DOME_PAINTS = [
  dome('cream', 'Moon Cream', 0, '🥛', { hex: '#f4ecd8' }),
  dome('sun', 'Sunny Yellow', 6, '🌞', { hex: '#ffd166' }), dome('mint', 'Mint Green', 7, '🍃', { hex: '#a8e6cf' }),
  dome('peach', 'Peach', 7, '🍑', { hex: '#ffb38a' }), dome('sky', 'Pale Blue', 8, '🩵', { hex: '#a9d6ff' }),
  dome('lilac', 'Lilac', 9, '💜', { hex: '#cdb4ff' }), dome('rose', 'Rose', 10, '🌹', { hex: '#ff9aa2' }),
  dome('brick', 'Brick Red', 11, '🧱', { hex: '#c8553d' }), dome('lime', 'Lime', 12, '🍋', { hex: '#d4f06c' }),
  dome('sea', 'Sea Green', 13, '🌊', { hex: '#2ec4b6' }), dome('steel', 'Steel', 14, '🔩', { hex: '#9aa5b1' }),
  dome('gold', 'Gold Dome', 18, '👑', { hex: '#f2c14e' }), dome('night', 'Night Sky', 16, '🌃', { hex: '#2b2d6e' }),
  dome('ruby', 'Ruby', 17, '💎', { hex: '#d7263d' }), dome('candy', 'Candy Stripe', 20, '🍭', { hex: '#ff8fab' }),
  dome('rainbow', 'Rainbow Dome', 30, '🌈', { hex: '#ff8fab' }),
] as const;

// ---------- suits and helmets ----------

export const SUITS = [
  suit('orange', 'Orange Suit', 0, '🟧', { hex: '#ff8c1a' }), suit('white', 'White Suit', 10, '⬜', { hex: '#f2f2f2' }),
  suit('blue', 'Blue Suit', 12, '🟦', { hex: '#3a86ff' }), suit('red', 'Red Suit', 12, '🟥', { hex: '#e63946' }),
  suit('green', 'Green Suit', 14, '🟩', { hex: '#2ec45a' }), suit('purple', 'Purple Suit', 16, '🟪', { hex: '#8e44ec' }),
  suit('pink', 'Pink Suit', 16, '🩷', { hex: '#ff6fb5' }), suit('black', 'Black Suit', 20, '⬛', { hex: '#2a2a2a' }),
  suit('silver', 'Silver Suit', 26, '🩶', { hex: '#c0c7d0' }), suit('stripe', 'Stripe Suit', 30, '🦓', { hex: '#f2f2f2' }),
  suit('star', 'Star Suit', 36, '⭐', { hex: '#1d2b6e' }), suit('gold', 'Gold Suit', 45, '🥇', { hex: '#e8b923' }),
] as const;
export const HELMETS = [
  helmet('round', 'Round Helmet', 0, '⚪'), helmet('bubble', 'Bubble Helmet', 10, '🫧'), helmet('visor', 'Gold Visor', 14, '🟡'),
  helmet('lamp', 'Lamp Helmet', 16, '🔦'), helmet('antenna', 'Antenna Helmet', 18, '📡'), helmet('cat', 'Cat Ears Helmet', 22, '🐱'),
  helmet('star', 'Star Helmet', 24, '⭐'), helmet('fin', 'Fin Helmet', 26, '🦈'), helmet('horn', 'Horn Helmet', 28, '🦄'),
  helmet('crown', 'Crown Helmet', 34, '👑'), helmet('robot', 'Robot Helmet', 38, '🤖'), helmet('rocket', 'Rocket Helmet', 48, '🚀'),
] as const;

// ---------- flags ----------

export const FLAGS = [
  flag('base', 'Base Flag', 0, '🚩'), flag('star', 'Star Flag', 5, '⭐'), flag('moon', 'Moon Flag', 6, '🌙'), flag('rocket', 'Rocket Flag', 7, '🚀'),
  flag('cat', 'Cat Flag', 8, '🐈'), flag('robot', 'Robot Flag', 8, '🤖'), flag('earth', 'Earth Flag', 9, '🌍'), flag('sun', 'Sun Flag', 9, '☀️'),
  flag('heart', 'Heart Flag', 10, '❤️'), flag('lightning', 'Lightning Flag', 11, '⚡'), flag('check', 'Checker Flag', 12, '🏁'),
  flag('comet', 'Comet Flag', 13, '☄️'), flag('planet', 'Planet Flag', 14, '🪐'), flag('alien', 'Alien Flag', 15, '👽'),
  flag('dino', 'Dino Flag', 16, '🦖'), flag('crown', 'Crown Flag', 17, '👑'), flag('fire', 'Fire Flag', 18, '🔥'),
  flag('wave', 'Wave Flag', 19, '🌊'), flag('rainbow', 'Rainbow Flag', 22, '🌈'), flag('galaxy', 'Galaxy Flag', 25, '🌌'),
  flag('gold', 'Gold Flag', 28, '🏆'),
] as const;

// ---------- the greenhouse's plants ----------

export const PLANTS = [
  plant('pepper', 'Moon Peppers', 8, '🌶️', { needs: 'greenhouse' }), plant('pea', 'Space Peas', 9, '🫛', { needs: 'greenhouse' }),
  plant('tomato', 'Tomatoes', 10, '🍅', { needs: 'greenhouse' }), plant('carrot', 'Carrots', 10, '🥕', { needs: 'greenhouse' }),
  plant('lettuce', 'Lettuce', 11, '🥬', { needs: 'greenhouse' }), plant('corn', 'Corn', 12, '🌽', { needs: 'greenhouse' }),
  plant('bean', 'Beans', 12, '🫘', { needs: 'greenhouse' }), plant('potato', 'Potatoes', 13, '🥔', { needs: 'greenhouse' }),
  plant('berry', 'Strawberries', 14, '🍓', { needs: 'greenhouse' }), plant('sunflower', 'Sunflowers', 15, '🌻', { needs: 'greenhouse' }),
  plant('tulip', 'Tulips', 15, '🌷', { needs: 'greenhouse' }), plant('pumpkin', 'Pumpkins', 17, '🎃', { needs: 'greenhouse' }),
  plant('melon', 'Melons', 18, '🍉', { needs: 'greenhouse' }), plant('grape', 'Grapes', 19, '🍇', { needs: 'greenhouse' }),
  plant('cactus', 'Cactus', 20, '🌵', { needs: 'greenhouse' }), plant('rose', 'Roses', 21, '🌹', { needs: 'greenhouse' }),
  plant('peach', 'Peach Tree', 24, '🍑', { needs: 'greenhouse' }), plant('apple', 'Apple Tree', 26, '🍎', { needs: 'greenhouse' }),
  plant('banana', 'Banana Tree', 28, '🍌', { needs: 'greenhouse' }), plant('palm', 'Palm Tree', 32, '🌴', { needs: 'greenhouse' }),
] as const;

// ---------- things for the base ----------

export const DECOR = [
  decor('bench', 'Bench', 6, '🪑'), decor('lamp', 'Lamp Post', 7, '💡'), decor('sign', 'Base Sign', 8, '🪧'),
  decor('rocks', 'Rock Garden', 9, '🪨'), decor('mailbox', 'Mailbox', 9, '📫'), decor('pole', 'Tall Flag Pole', 10, '🎌'),
  decor('swing', 'Moon Swing', 12, '🛝'), decor('slide', 'Moon Slide', 14, '🛝'), decor('dustman', 'Dust Man', 11, '⛄'),
  decor('telescope', 'Little Telescope', 13, '🔭'), decor('fountain', 'Fountain', 16, '⛲'), decor('statue', 'Astronaut Statue', 18, '🗿'),
  decor('picnic', 'Picnic Table', 15, '🧺'), decor('tent', 'Moon Tent', 17, '⛺'), decor('trampoline', 'Trampoline', 20, '🤸'),
  decor('bird', 'Robot Bird', 19, '🐦'), decor('windchime', 'Star Chimes', 21, '🎐'), decor('lights', 'String Lights', 22, '✨'),
  decor('arch', 'Moon Arch', 24, '🌉'), decor('hoop', 'Basketball Hoop', 25, '🏀'), decor('goal', 'Soccer Goal', 25, '⚽'),
  decor('maze', 'Rock Maze', 28, '🌀'), decor('sundial', 'Sun Clock', 26, '🕰️'), decor('pond', 'Ice Pond', 30, '🧊'),
  decor('bell', 'Big Bell', 27, '🔔'), decor('kite', 'Kite Stand', 23, '🪁'), decor('globe', 'Earth Globe', 32, '🌍'),
  decor('rocketstatue', 'Rocket Statue', 35, '🚀'), decor('carousel', 'Moon Carousel', 45, '🎠'), decor('ferris', 'Big Wheel', 60, '🎡'),
  decor('bus', 'Moon Bus Stop', 18, '🚏'), decor('drum', 'Drum Kit', 20, '🥁'), decor('piano', 'Moon Piano', 34, '🎹'),
  decor('castle', 'Sand Castle', 16, '🏰'), decor('robotdog', 'Robot Dog', 38, '🐕'), decor('hammock', 'Hammock', 19, '🛌'),
  decor('pool', 'Splash Pool', 40, '🏊'), decor('pizza', 'Pizza Oven', 29, '🍕'), decor('gnome', 'Moon Gnome', 12, '🧙'),
  decor('ufo', 'Toy Saucer', 50, '🛸'),
] as const;

// ---------- the moon buggy ----------

export const BUGGY = [
  buggy('wheels', 'Big Wheels', 20, '🛞', { needs: 'garage' }), buggy('lights', 'Buggy Lights', 15, '💡', { needs: 'garage' }),
  buggy('flag', 'Buggy Flag', 10, '🚩', { needs: 'garage' }), buggy('bar', 'Roll Bar', 25, '🛡️', { needs: 'garage' }),
  buggy('dish', 'Buggy Dish', 30, '📡', { needs: 'garage' }), buggy('trailer', 'Trailer', 45, '🛒', { needs: 'garage' }),
  buggy('turbo', 'Turbo', 60, '💨', { needs: 'garage' }), buggy('arm', 'Robot Arm', 70, '🦾', { needs: 'garage' }),
  buggy('gold', 'Gold Wheels', 80, '🟡', { needs: 'buggy:wheels' }), buggy('boost', 'Rocket Boost', 100, '🚀', { needs: 'buggy:turbo' }),
] as const;

// ---------- all of it ----------

export const ITEMS: readonly Item[] = [...MODULES, ...LANDERS, ...PARTS, ...PAINTS, ...DOME_PAINTS, ...SUITS, ...HELMETS, ...FLAGS, ...PLANTS, ...DECOR, ...BUGGY];
/** The free starters: one of each kind he wears or flies. */
export const STARTERS = ITEMS.filter(i => i.price === 0).map(i => i.id);
export const FOR_SALE = ITEMS.filter(i => i.price > 0);
const BY_ID = new Map(ITEMS.map(i => [i.id, i]));
export const isItemId = (x: unknown): x is string => typeof x === 'string' && BY_ID.has(x);
export const itemOf = (id: string): Item => BY_ID.get(id)!;
export const ITEM_NAMES = [...new Set(ITEMS.map(i => i.name))];
export type ItemName = (typeof ITEMS)[number]['name'];

// ---------- things he can buy again and again ----------

export const REPEATS = [
  { id: 'land', name: 'Land Patch', icon: '🟫', start: 22, step: 4, top: 50, does: 'more plots to build on' },
  { id: 'module', name: 'New Module', icon: '🛠️', start: 45, step: 5, top: 90, does: 'a module made from parts', needsCount: 12 },
  { id: 'bed', name: 'Garden Bed', icon: '🌱', start: 18, step: 3, top: 36, does: 'a new plant', needs: 'module:greenhouse' },
] as const;
export type RepeatId = (typeof REPEATS)[number]['id'];
export const REPEAT_IDS: readonly RepeatId[] = REPEATS.map(r => r.id);
export const repeatOf = (id: RepeatId) => REPEATS.find(r => r.id === id)!;
/** The price of the next one: it rises gently, then stays flat. */
export const repeatPrice = (id: RepeatId, had: number) => { const r = repeatOf(id); return Math.min(r.top, r.start + r.step * had); };
