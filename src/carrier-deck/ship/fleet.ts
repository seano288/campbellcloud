// The Yard: once he has his first Fleet ship there is always a new ship in the Yard, put together from parts (a hull, a deckhouse, a
// mast, a funnel, a colour and a stripe), made from its number, so the same number always gives the same ship. Every number up to
// LOOKS gives a different ship. Its kind (Cargo Ship, Ferry, Fishing Boat, Survey Ship, Tugboat, Sailing Ship) comes from its hull.
import type { ShipLook } from './catalog';

export const YARD_KINDS = ['Cargo Ship', 'Ferry', 'Fishing Boat', 'Survey Ship', 'Tugboat', 'Sailing Ship'] as const;
export type YardKind = (typeof YARD_KINDS)[number];
export const HULLS = 6, HOUSES = 6, MASTS = 5, FUNNELS = 3;
export const YARD_COLOURS = ['#e63946', '#ff7a00', '#ffd23f', '#2fa84f', '#2f8fe8', '#7b4bd1', '#f4f6fa', '#1f3a68', '#14a3a3', '#ff7aa8', '#4a525c', '#c46a2f'] as const;
/** How many different ships the Yard can make before one comes round again. */
export const LOOKS = HULLS * HOUSES * MASTS * FUNNELS * YARD_COLOURS.length * YARD_COLOURS.length;
const SPREAD = 7919; // coprime with LOOKS, so the first LOOKS ships are all different

export interface YardShip { readonly n: number; readonly kind: YardKind; readonly look: ShipLook }
export function yardShip(n: number): YardShip {
  let k = ((n % LOOKS) * SPREAD) % LOOKS;
  const take = (radix: number) => { const d = k % radix; k = Math.floor(k / radix); return d; };
  const hull = take(HULLS), house = take(HOUSES), mast = take(MASTS), funnel = take(FUNNELS), colour = take(YARD_COLOURS.length), stripe = take(YARD_COLOURS.length);
  const hex = YARD_COLOURS[colour]!, other = stripe === colour ? YARD_COLOURS[(stripe + 6) % YARD_COLOURS.length]! : YARD_COLOURS[stripe]!;
  return { n, kind: YARD_KINDS[hull]!, look: { hull, house, mast, funnel, hex, stripe: other } };
}
