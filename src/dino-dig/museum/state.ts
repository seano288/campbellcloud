// The Dig, the Museum and the shop on the saved game. A finished Round earns Gems and one Dig (he starts with one free). A Dig is at
// a site his best tool can reach and finds one or two bones of the first dinosaur there still missing some (two on the first Dig and
// every other one after), two Gems hidden in the dirt, and on every other Dig a fossil. Bones go onto the dinosaur's skeleton in the
// Museum; a whole skeleton can be brought to life, and then he plays as it (the Alive run), as often as he likes.
//
// A Dig is used, and its Gems paid, only when every bone is in the crate; leaving halfway costs nothing and pays nothing. Nothing he
// owns or finds can be lost. With every dinosaur at the sites he can reach already found, a Dig still has its Gems and fossil, and says
// a better tool opens a deeper site; with everything found, it's a Dig just for fun.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  COLORS, GADGETS, GEAR, HATS, isItemKey, item, keyOf, LANDS, MARKINGS, ROARS, STARTERS, TOOLS, FOR_SALE,
  type ColorId, type GadgetId, type GearId, type HatId, type ItemKey, type LandId, type MarkingId, type RoarId, type ToolId,
} from '../shop/shop';
import { dino, DINO_IDS, DINOS, dinosAt, FOSSILS, isDinoId, isFossilId, isSiteId, site, SITES, type BoneId, type DinoId, type FossilId, type SiteId } from './dinos';

/** A living dinosaur's looks and roar. */
export interface Look { color: ColorId; marking: MarkingId; hat: HatId; roar: RoarId }
export const PLAIN_LOOK: Look = { color: 'natural', marking: 'none', hat: 'none', roar: 'roar' };

export interface MuseumState {
  owned: ItemKey[];
  /** How many of each dinosaur's bones he has found (they're found in order). */
  bones: Partial<Record<DinoId, number>>;
  /** The dinosaurs he has brought to life, in order. */
  alive: DinoId[];
  looks: Partial<Record<DinoId, Partial<Look>>>;
  /** The dinosaur the shop's looks are for, and the one Home shows. */
  pet: DinoId | null;
  /** Digs earned and not done yet. */
  digs: number;
  /** Digs finished. */
  done: number;
  finds: FossilId[];
  /** The site he picked to dig at next (null: the newest one with bones left). */
  site: SiteId | null;
  land: LandId;
  /** Gadgets and Gear he has switched off. */
  off: (GadgetId | GearId)[];
  goal: ItemKey | null;
}

export const freshMuseum = (): MuseumState => ({ owned: [...STARTERS], bones: {}, alive: [], looks: {}, pet: null, digs: 1, done: 0, finds: [], site: null, land: 'forest', off: [], goal: null });
export const isOwned = (s: Pick<MuseumState, 'owned'>, k: ItemKey) => s.owned.includes(k);

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const oneOf = <T extends { id: string }>(table: readonly T[], x: unknown, fallback: T['id']): T['id'] => (table.some(t => t.id === x) ? x as T['id'] : fallback);

/** Whatever is missing or doesn't read comes back fresh. Nothing he doesn't own is worn, no dinosaur has more bones than it is made of,
 *  and only a whole skeleton can be alive. */
export function readMuseum(raw: unknown): MuseumState {
  if (!isRecord(raw)) return freshMuseum();
  const fresh = freshMuseum();
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemKey) : [])])];
  const s = { owned };
  const bones: Partial<Record<DinoId, number>> = {};
  if (isRecord(raw.bones)) for (const [d, n] of Object.entries(raw.bones)) if (isDinoId(d) && isAmount(n) && n > 0) bones[d] = Math.min(n, dino(d).bones.length);
  const alive = [...new Set(Array.isArray(raw.alive) ? raw.alive.filter(isDinoId) : [])].filter(d => (bones[d] ?? 0) >= dino(d).bones.length);
  const looks: Partial<Record<DinoId, Partial<Look>>> = {};
  if (isRecord(raw.looks)) for (const [d, l] of Object.entries(raw.looks)) {
    if (!isDinoId(d) || !isRecord(l)) continue;
    const own = <T extends { id: string }>(tab: 'color' | 'marking' | 'hat' | 'roar', table: readonly T[], x: unknown, f: T['id']) => {
      const id = oneOf(table, x, f);
      return isOwned(s, `${tab}:${id}` as ItemKey) ? id : f;
    };
    looks[d] = { color: own('color', COLORS, l.color, 'natural'), marking: own('marking', MARKINGS, l.marking, 'none'), hat: own('hat', HATS, l.hat, 'none'), roar: own('roar', ROARS, l.roar, 'roar') };
  }
  const land = oneOf(LANDS, raw.land, 'forest') as LandId;
  return {
    owned, bones, alive, looks, pet: isDinoId(raw.pet) && alive.includes(raw.pet) ? raw.pet : alive.at(-1) ?? null,
    digs: isAmount(raw.digs) ? raw.digs : 0, done: isAmount(raw.done) ? raw.done : 0,
    finds: [...new Set(Array.isArray(raw.finds) ? raw.finds.filter(isFossilId) : [])],
    site: isSiteId(raw.site) ? raw.site : null, land: isOwned(s, keyOf('land', land)) ? land : fresh.land,
    off: [...new Set(Array.isArray(raw.off) ? raw.off.filter((x): x is GadgetId | GearId => GADGETS.some(g => g.id === x) || GEAR.some(g => g.id === x)) : [])],
    goal: isItemKey(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
  };
}

// ---------- what he has ----------

export const lookOf = (s: Pick<MuseumState, 'looks'>, d: DinoId): Look => ({ ...PLAIN_LOOK, ...s.looks[d] });
export const bonesOf = (s: Pick<MuseumState, 'bones'>, d: DinoId) => s.bones[d] ?? 0;
/** The bones of this dinosaur he has, by name. */
export const foundBones = (s: Pick<MuseumState, 'bones'>, d: DinoId): BoneId[] => dino(d).bones.slice(0, bonesOf(s, d));
export const complete = (s: Pick<MuseumState, 'bones'>, d: DinoId) => bonesOf(s, d) >= dino(d).bones.length;
/** A whole skeleton not brought to life yet. */
export const readyToWake = (s: Pick<MuseumState, 'bones' | 'alive'>) => DINO_IDS.filter(d => complete(s, d) && !s.alive.includes(d));
/** His best tool. */
export const bestTool = (s: Pick<MuseumState, 'owned'>) => [...TOOLS].reverse().find(t => isOwned(s, keyOf('tool', t.id)))!;
export const toolOf = (id: ToolId) => TOOLS.find(t => t.id === id)!;
/** The sites his best tool can dig at. */
export const openSites = (s: Pick<MuseumState, 'owned'>) => SITES.filter(x => x.tier <= bestTool(s).tier).map(x => x.id);
export const hasGadget = (s: Pick<MuseumState, 'owned' | 'off'>, g: GadgetId) => isOwned(s, keyOf('gadget', g)) && !s.off.includes(g);
export const hasGear = (s: Pick<MuseumState, 'owned' | 'off'>, g: GearId) => isOwned(s, keyOf('gear', g)) && !s.off.includes(g);
/** The first dinosaur at a site still missing bones. */
export const missingAt = (s: Pick<MuseumState, 'bones'>, x: SiteId) => dinosAt(x).find(d => !complete(s, d)) ?? null;

// ---------- a Dig ----------

/** Gems hidden in every Dig's dirt. */
export const DIG_GEMS = 2;

export interface Dig {
  site: SiteId;
  /** The dinosaur whose bones are here (null: nothing left at the sites he can reach). */
  dino: DinoId | null;
  /** Which of its bones (by index into its bones), one or two. */
  bones: number[];
  fossil: FossilId | null;
  /** Something new opens with a better tool. */
  deeper: boolean;
}

/** The next Dig: the site he picked if it still has bones, else the first open site that does, else the deepest open one. */
export function nextDig(s: Pick<MuseumState, 'owned' | 'bones' | 'done' | 'finds' | 'site'>): Dig {
  const open = openSites(s), withBones = open.filter(x => missingAt(s, x));
  const at = s.site && open.includes(s.site) && missingAt(s, s.site) ? s.site : withBones[0] ?? open.at(-1)!;
  const d = missingAt(s, at);
  const have = d ? bonesOf(s, d) : 0, n = d ? Math.min(s.done % 2 === 0 ? 2 : 1, dino(d).bones.length - have) : 0;
  const fossil = s.done % 2 === 1 ? FOSSILS.find(f => !s.finds.includes(f.id))?.id ?? null : null;
  return { site: at, dino: d, bones: Array.from({ length: n }, (_, i) => have + i), fossil, deeper: !d && DINOS.some(x => !complete(s, x.id)) };
}

export const earnDig = (s: MuseumState): MuseumState => ({ ...s, digs: s.digs + 1 });

/** Every bone is in the crate: the Dig is used, the bones go on the skeleton and the fossil on the shelf. Null if there was no Dig. */
export function finishDig(s: MuseumState, dig: Dig): MuseumState | null {
  if (s.digs < 1) return null;
  const bones = { ...s.bones };
  if (dig.dino) bones[dig.dino] = Math.min(dino(dig.dino).bones.length, Math.max(bonesOf(s, dig.dino), (dig.bones.at(-1) ?? -1) + 1));
  const finds = dig.fossil && !s.finds.includes(dig.fossil) ? [...s.finds, dig.fossil] : s.finds;
  return { ...s, bones, finds, digs: s.digs - 1, done: s.done + 1, site: s.site && missingAt({ bones }, s.site) ? s.site : null };
}

/** A whole skeleton comes alive: it walks in the Museum, can be played, and is the one the shop dresses. */
export function wake(s: MuseumState, d: DinoId): MuseumState | null {
  if (!complete(s, d) || s.alive.includes(d)) return null;
  return { ...s, alive: [...s.alive, d], pet: d };
}

// ---------- buying, wearing and switching ----------

export type Request = ItemKey;
export type Failure = 'owned' | 'unknown' | 'short';

/** Buying something: it's his, and a look goes straight onto the dinosaur he's dressing; a tool, a land or gear starts working. */
export const proposePurchase = (s: MuseumState, k: Request, balance: number): PurchaseProposal<MuseumState, Failure> => {
  if (!isItemKey(k)) return { kind: 'rejected', reason: 'unknown' };
  if (isOwned(s, k)) return { kind: 'rejected', reason: 'owned' };
  const price = item(k).price;
  if (balance < price) return { kind: 'rejected', reason: 'short' };
  const owned = [...s.owned, k];
  return { kind: 'ready', cost: price, state: wear({ ...s, owned, goal: s.goal === k ? null : s.goal }, k) ?? { ...s, owned, goal: s.goal === k ? null : s.goal } };
};

/** Puts something he owns to use: a look on his pet dinosaur, a land for the run. Null if he doesn't own it or it's not that kind. */
export function wear(s: MuseumState, k: ItemKey): MuseumState | null {
  if (!isOwned(s, k)) return null;
  const [tab, id] = k.split(':') as [string, string];
  if (tab === 'land') return { ...s, land: id as LandId };
  if (!['color', 'marking', 'hat', 'roar'].includes(tab) || !s.pet) return null;
  return { ...s, looks: { ...s.looks, [s.pet]: { ...lookOf(s, s.pet), [tab]: id } } };
}

/** Switches a gadget or gear he owns on or off. */
export function toggle(s: MuseumState, g: GadgetId | GearId): MuseumState | null {
  const owns = isOwned(s, `gadget:${g}` as ItemKey) || isOwned(s, `gear:${g}` as ItemKey);
  if (!owns) return null;
  return { ...s, off: s.off.includes(g) ? s.off.filter(x => x !== g) : [...s.off, g] };
}

/** The Goal: what he picked, else the next tool (it opens a deeper site), else the cheapest thing left. */
export function goalOf(s: Pick<MuseumState, 'owned' | 'goal'>): ItemKey | null {
  if (s.goal && !isOwned(s, s.goal)) return s.goal;
  const tool = TOOLS.find(t => !isOwned(s, keyOf('tool', t.id)));
  if (tool) return keyOf('tool', tool.id);
  const left = FOR_SALE.filter(k => !isOwned(s, k)).sort((a, b) => item(a).price - item(b).price);
  return left[0] ?? null;
}

export const siteName = (x: SiteId) => site(x).name;
