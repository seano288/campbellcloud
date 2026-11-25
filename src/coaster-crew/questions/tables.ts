// The hand-checked tables the questions draw from. Each entry is something nobody would argue about; when in doubt it was left out.

// ---------- Push or Pull: everyday actions ----------

/** A push moves the thing away from the hand (or foot); a pull brings it toward the hand. Only actions with one plain answer: no
 *  "open a door" (it can be either), no throwing (arguable), no dogs on leads (who pulls whom?). What is said never has "push" or "pull"
 *  in it, or the question would answer itself: he must look at which way the hand moves the thing (problems.test.ts checks). */
export const ACTIONS = [
  { id: 'kick', said: 'Kicking a ball.', is: 'push', thing: 'ball', by: 'foot' },
  { id: 'cart', said: 'Moving a shopping cart.', is: 'push', thing: 'trolley', by: 'hand' },
  { id: 'close', said: 'Closing a drawer.', is: 'push', thing: 'drawer', by: 'hand' },
  { id: 'swing', said: 'Sending a swing up high.', is: 'push', thing: 'swing', by: 'hand' },
  { id: 'car', said: 'Rolling a toy car away.', is: 'push', thing: 'car', by: 'hand' },
  { id: 'open', said: 'Opening a drawer.', is: 'pull', thing: 'drawer', by: 'hand' },
  { id: 'wagon', said: 'Towing a wagon.', is: 'pull', thing: 'wagon', by: 'hand' },
  { id: 'sled', said: 'Dragging a sled through the snow.', is: 'pull', thing: 'sled', by: 'hand' },
  { id: 'carrot', said: 'Getting a carrot out of the ground.', is: 'pull', thing: 'carrot', by: 'hand' },
  { id: 'rope', said: 'Playing tug of war.', is: 'pull', thing: 'rope', by: 'hand' },
] as const;
export type ActionId = (typeof ACTIONS)[number]['id'];
export const actionOf = (id: ActionId) => ACTIONS.find(a => a.id === id)!;

// ---------- Rough and Smooth: grounds ----------

/** Rolling resistance of a little wheeled cart on each ground (a share of its weight). Only the order matters to the questions, and
 *  two grounds are only ever compared when one stops it at least three times sooner (PAIR_RATIO): never grass and carpet, never grass
 *  and sand, never ice and a smooth floor. */
export const GROUNDS = [
  { id: 'ice', name: 'Ice', resistance: 0.02, colour: '#cfefff' },
  { id: 'floor', name: 'Smooth floor', resistance: 0.03, colour: '#e2b878' },
  { id: 'carpet', name: 'Carpet', resistance: 0.12, colour: '#c8455a' },
  { id: 'grass', name: 'Grass', resistance: 0.16, colour: '#5fb84a' },
  { id: 'sand', name: 'Sand', resistance: 0.45, colour: '#f1d58c' },
] as const;
export type GroundId = (typeof GROUNDS)[number]['id'];
export const groundOf = (id: GroundId) => GROUNDS.find(g => g.id === id)!;
export const PAIR_RATIO = 3;
export const comparable = (a: GroundId, b: GroundId) => {
  const ra = groundOf(a).resistance, rb = groundOf(b).resistance;
  return Math.max(ra, rb) / Math.min(ra, rb) >= PAIR_RATIO;
};

// ---------- Magnets: things ----------

/** Everything here is plainly iron or steel, or plainly not metal at all. Left out on purpose: coins, drink cans, foil, keys, jewellery,
 *  pencils (a metal band) and spoons (many steel spoons are a kind of steel a magnet does not pull), and anything just called "metal".
 *  Every thing here is small enough to jump to a small magnet across the table, as the scenes show (an iron pan was taken out: the
 *  scene would show a pan leaping to a fridge magnet). */
export const THINGS = [
  { id: 'clip', name: 'a steel paper clip', short: 'Paper clip', magnetic: true },
  { id: 'nail', name: 'an iron nail', short: 'Nail', magnetic: true },
  { id: 'ball', name: 'a steel ball', short: 'Steel ball', magnetic: true },
  { id: 'block', name: 'a wooden block', short: 'Block', magnetic: false },
  { id: 'cup', name: 'a plastic cup', short: 'Cup', magnetic: false },
  { id: 'paper', name: 'a piece of paper', short: 'Paper', magnetic: false },
  { id: 'marble', name: 'a glass marble', short: 'Marble', magnetic: false },
  { id: 'rubber', name: 'a rubber ball', short: 'Rubber ball', magnetic: false },
  { id: 'sock', name: 'a wool sock', short: 'Sock', magnetic: false },
  { id: 'feather', name: 'a feather', short: 'Feather', magnetic: false },
  { id: 'crayon', name: 'a wax crayon', short: 'Crayon', magnetic: false },
] as const;
export type ThingId = (typeof THINGS)[number]['id'];
export const thingOf = (id: ThingId) => THINGS.find(t => t.id === id)!;
/** The iron and steel things a magnet pulls across the table. */
export const SMALL_MAGNETIC: readonly ThingId[] = ['clip', 'nail', 'ball'];
/** Thin things a magnet pulls through: nobody would argue these stop it. */
export const SHEETS = [
  { id: 'paper', said: 'There is paper in between.' },
  { id: 'card', said: 'There is a card in between.' },
  { id: 'cloth', said: 'There is a cloth in between.' },
] as const;
export type SheetId = (typeof SHEETS)[number]['id'];

// ---------- carts, by colour ----------

export const CARTS = [
  { id: 'red', colour: '#e63946' },
  { id: 'blue', colour: '#2f80ed' },
  { id: 'yellow', colour: '#ffc21a' },
] as const;
export type CartId = (typeof CARTS)[number]['id'];
export const cartColour = (id: string) => CARTS.find(c => c.id === id)?.colour ?? '#888';
