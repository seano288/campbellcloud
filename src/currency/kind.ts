// Which currency a game pays in: its name, said and shown in the singular and plural. Every game picks one (Bolts for the
// games about machines, Ammo for Sight Squad's army, Doubloons for Treasure Fleet's pirates and so on) and builds its earned and need lines from it, so a new game names its own
// currency here and gets those lines, the voice phrases and (with an icon in src/ui/currency.tsx) the pile for free.

export interface CurrencyKind {
  readonly id: string;
  readonly one: string;
  readonly many: string;
}

const kind = <const K extends CurrencyKind>(k: K) => k;

/** The vehicle games' currency: a shiny hex bolt for the Garage, Hangar and Helipad. */
export const BOLT = kind({ id: 'bolt', one: 'Bolt', many: 'Bolts' });
/** Sight Squad's currency: Ammo, what an army runs on; one word for one or many. */
export const AMMO = kind({ id: 'ammo', one: 'Ammo', many: 'Ammo' });

/** Treasure Fleet's currency: pirate gold, a doubloon from every chest and barrel. */
export const DOUBLOON = kind({ id: 'doubloon', one: 'Doubloon', many: 'Doubloons' });
/** Wild Rescue's currency: a Paw Print, an animal's thank-you. */
export const PAW_PRINT = kind({ id: 'paw-print', one: 'Paw Print', many: 'Paw Prints' });
/** Sentence Express's currency: a train Ticket. */
export const TICKET = kind({ id: 'ticket', one: 'Ticket', many: 'Tickets' });
/** Dino Dig's currency: a Gem, dug out of the ground with the bones. */
export const GEM = kind({ id: 'gem', one: 'Gem', many: 'Gems' });
/** Deep Light's currency: a Pearl from the sea floor. */
export const PEARL = kind({ id: 'pearl', one: 'Pearl', many: 'Pearls' });
/** Skyline's currency: a Brick, what a city is built from. */
export const BRICK = kind({ id: 'brick', one: 'Brick', many: 'Bricks' });
/** Coaster Crew's currency: a ride Token, the round red and white token a fairground runs on. */
export const TOKEN = kind({ id: 'token', one: 'Token', many: 'Tokens' });

export const CURRENCIES = [BOLT, AMMO, DOUBLOON, PAW_PRINT, TICKET, GEM, PEARL, BRICK, TOKEN] as const;
export type Currency = (typeof CURRENCIES)[number];
export type CurrencyId = Currency['id'];

/** "3 Ammo", "1 Bolt". */
export type CountOf<K extends CurrencyKind> = `1 ${K['one']}` | `${number} ${K['many']}`;
export const countOf = <K extends CurrencyKind>(k: K, n: number) => (n === 1 ? `1 ${k.one}` : `${n} ${k.many}`) as CountOf<K>;

/** "You earned 4 Ammo!" */
export type EarnedLine<K extends CurrencyKind> = `You earned ${CountOf<K>}!`;
export const earnedLine = <K extends CurrencyKind>(k: K, n: number) => `You earned ${countOf(k, n)}!` as EarnedLine<K>;

/** "You need 2 more Ammo." */
export type NeedLine<K extends CurrencyKind> = `You need 1 more ${K['one']}.` | `You need ${number} more ${K['many']}.`;
export const needLine = <K extends CurrencyKind>(k: K, n: number) =>
  (n === 1 ? `You need 1 more ${k.one}.` : `You need ${n} more ${k.many}.`) as NeedLine<K>;
