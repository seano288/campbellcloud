// The reward on the saved game. A Round earns Bolts and a fight. Bolts buy parts; beating a rival wins a part nothing else can buy, so
// the two pull the same way: Rounds buy the parts that beat the rival that gives the next part. A fight used to cost Bolts, which made
// him choose between the two things he wanted, so it doesn't any more. A Legendary is never bought and is never the Goal: the Balance Lock
// opens it for free once the dearest part of its sort is his.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { fittedAdds, starterBuild, type Build } from '../bot/build';
import { ALL_PARTS, catOf, isPartKey, LEGENDARIES, LOCK_NEEDS, MOUNTS, part, partsIn, type AddId, type BodyId, type Cat, type FaceId, type LockSlot, type Mount, type PaintId, type PartKey, type WheelId, keyOf } from '../bot/parts';
import { RIVALS, CROWN, type Rival, type RivalId } from '../league/rivals';

export interface RivalRecord { stars: number; losses: number }
export interface WorkshopState {
  owned: PartKey[];
  build: Build;
  goal: PartKey | null;
  /** Fights he has earned and not used yet. */
  charges: number;
  /** Losses on this charge: each one gives him two goes. */
  tries: number;
  fights: number;
  rivals: Partial<Record<RivalId, RivalRecord>>;
}
const STARTERS = ALL_PARTS.filter(k => part(k).how === 0);
export const freshWorkshop = (): WorkshopState => ({ owned: [...STARTERS], build: starterBuild(), goal: null, charges: 1, tries: 0, fights: 0, rivals: {} });

export const isOwned = (w: Pick<WorkshopState, 'owned'>, k: PartKey) => w.owned.includes(k);

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

function readBuild(raw: unknown, owned: readonly PartKey[]): Build {
  const b = isRecord(raw) ? raw : {}, fresh = starterBuild();
  const pick = <T extends string>(cat: Cat, x: unknown, fallback: T): T => (typeof x === 'string' && owned.includes(keyOf(cat, x)) ? x as T : fallback);
  const adds = isRecord(b.adds) ? b.adds : {};
  const kept = MOUNTS.flatMap(m => { const id = adds[m]; return typeof id === 'string' && owned.includes(keyOf('add', id)) ? [[m, id as AddId] as const] : []; });
  return {
    body: pick<BodyId>('body', b.body, fresh.body), wheels: pick<WheelId>('wheels', b.wheels, fresh.wheels),
    adds: isRecord(b.adds) ? Object.fromEntries(kept) : fresh.adds, paint: pick<PaintId>('paint', b.paint, fresh.paint), face: pick<FaceId>('face', b.face, fresh.face),
  };
}
/** The Mods he bought before robots were built from parts go back to him as Bolts, and his Legendaries stay his. */
const OLD_PRICE: Record<string, number> = { 1: 5, 2: 15, 3: 30 };
export function refundOf(raw: unknown) { return isRecord(raw) && Array.isArray(raw.unlocked) && !('owned' in raw) ? raw.unlocked.reduce((sum: number, m) => sum + (OLD_PRICE[String(m).split(':')[1] ?? ''] ?? 0), 0) : 0; }

/** Whatever is missing or doesn't read as the fresh value. */
export function readWorkshop(raw: unknown): WorkshopState {
  if (!isRecord(raw)) return freshWorkshop();
  if (!('owned' in raw)) { // a save from when the Workshop sold looks: everything but Legendaries was refunded (refundOf)
    const old = Array.isArray(raw.unlocked) ? raw.unlocked : [];
    const legends = (Object.keys(LEGENDARIES) as LockSlot[]).filter(s => old.includes(`${s}:4`)).map(s => LEGENDARIES[s]);
    return { ...freshWorkshop(), owned: [...STARTERS, ...legends], charges: 2 + (raw.ticket === true ? 1 : 0), fights: isAmount(raw.fights) ? raw.fights : 0 };
  }
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isPartKey) : [])])];
  const rivals = isRecord(raw.rivals) ? raw.rivals : {};
  return {
    owned, build: readBuild(raw.build, owned), goal: isPartKey(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
    charges: isAmount(raw.charges) ? raw.charges : 0, tries: isAmount(raw.tries) ? raw.tries : 0, fights: isAmount(raw.fights) ? raw.fights : 0,
    rivals: Object.fromEntries(RIVALS.flatMap(r => {
      const rec = rivals[r.id];
      return isRecord(rec) ? [[r.id, { stars: isAmount(rec.stars) ? Math.min(3, rec.stars) : 0, losses: isAmount(rec.losses) ? rec.losses : 0 }]] : [];
    })),
  };
}

export const priceOf = (k: PartKey) => { const how = part(k).how; return typeof how === 'number' ? how : null; };
export const buyable = (k: PartKey) => (priceOf(k) ?? 0) > 0;
/** The one he chose while it's locked, otherwise the cheapest part he hasn't got that does something in a fight. */
export function goalOf(w: Pick<WorkshopState, 'owned' | 'goal'>): PartKey | null {
  if (w.goal && !isOwned(w, w.goal)) return w.goal;
  let best: PartKey | null = null;
  for (const k of ALL_PARTS) if (buyable(k) && !isOwned(w, k) && part(k).power > 0 && (!best || priceOf(k)! < priceOf(best)!)) best = k;
  return best ?? ALL_PARTS.find(k => buyable(k) && !isOwned(w, k)) ?? null;
}
export function selectGoal(state: WorkshopState, item: PartKey): WorkshopState {
  if (!buyable(item) || isOwned(state, item)) throw new Error('Goal must be a part he can buy');
  return { ...state, goal: item };
}

/** Puts a part on: Body, Wheels, paint and face have one place, and everything else goes on `mount`. */
export function fitted(build: Build, k: PartKey, mount?: Mount): Build {
  const cat = catOf(k), id = k.split(':')[1]!;
  if (cat === 'add') { if (!mount) throw new Error('A part needs a Mount'); return { ...build, adds: { ...build.adds, [mount]: id as AddId } }; }
  return { ...build, [cat]: id };
}
export const stripped = (build: Build, mount: Mount): Build => { const adds = { ...build.adds }; delete adds[mount]; return { ...build, adds }; };
export const applyBuild = (state: WorkshopState, build: Build): WorkshopState => ({ ...state, build });
/** Fitted parts he owns: a build from before a save was cut down can't sneak one in. */
export const allowed = (w: Pick<WorkshopState, 'owned'>, b: Build) => [`body:${b.body}`, `wheels:${b.wheels}`, `paint:${b.paint}`, `face:${b.face}`, ...fittedAdds(b).map(a => `add:${a.part.id}`)].every(k => w.owned.includes(k as PartKey));

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'not-for-sale';
export function proposePurchase(state: WorkshopState, item: { key: PartKey; mount?: Mount }, balance: number): PurchaseProposal<WorkshopState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isPartKey(item.key)) return { kind: 'rejected', reason: 'invalid-item' };
  if (isOwned(state, item.key)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(item.key);
  if (cost === null) return { kind: 'rejected', reason: 'not-for-sale' };
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  const build = catOf(item.key) !== 'add' || item.mount ? fitted(state.build, item.key, item.mount) : state.build;
  return { kind: 'ready', cost, state: { ...state, owned: [...state.owned, item.key], build, goal: state.goal === item.key ? null : state.goal } };
}

// ---------- the Balance Lock ----------
export const lockWaitsOn = (w: Pick<WorkshopState, 'owned'>, slot: LockSlot): PartKey | null => (isOwned(w, LOCK_NEEDS[slot]) ? null : LOCK_NEEDS[slot]);
export function openVault(state: WorkshopState, slot: LockSlot): WorkshopState | null {
  const item = LEGENDARIES[slot];
  if (isOwned(state, item) || lockWaitsOn(state, slot)) return null;
  return { ...state, owned: [...state.owned, item] };
}

// ---------- the League ----------
/** The first rival he hasn't beaten; null when he's beaten them all. */
export const nextRival = (w: Pick<WorkshopState, 'rivals'>): Rival | null => RIVALS.find(r => !w.rivals[r.id]?.stars) ?? null;
export const beaten = (w: Pick<WorkshopState, 'rivals'>, id: RivalId) => (w.rivals[id]?.stars ?? 0) > 0;
/** He can fight any rival up to the first he hasn't beaten. */
export const canFight = (w: Pick<WorkshopState, 'rivals'>, r: Rival) => beaten(w, r.id as RivalId) || nextRival(w)?.id === r.id;
/** Each loss to the same rival takes a little off it, and a win resets it, so nobody stays stuck. */
export const mercy = (losses: number) => ({ hp: 1 - Math.min(.5, losses * .12), speed: 1 - Math.min(.15, losses * .03) });

export interface Outcome { won: boolean; stars: number; picked: number }
export interface Payout { bolts: number; prize: PartKey | null; crown: boolean; newStars: number; firstWin: boolean; spent: boolean }
/** What a fight pays: first win, the prize and the most Bolts; each new star, 3; a win he's had before, 2; a loss, what he picked up. */
export function payoutFor(w: WorkshopState, r: Rival, o: Outcome): Payout {
  const had = w.rivals[r.id as RivalId]?.stars ?? 0, firstWin = o.won && had === 0, newStars = Math.max(0, o.stars - had);
  const crown = o.won && o.stars === 3 && r.id === 'king' && !isOwned(w, CROWN);
  const bolts = o.picked + (!o.won ? 1 : (firstWin ? r.bolts : 2) + newStars * 3);
  return { bolts, prize: firstWin && !isOwned(w, r.prize) ? r.prize : null, crown, newStars, firstWin, spent: o.won || w.tries >= 1 };
}
/** He saw the fight end. A win uses the charge. A loss leaves him one more go on it, so the first loss always has a rematch. */
export function finishFight(state: WorkshopState, r: Rival, o: Outcome, pay: Payout): WorkshopState {
  const rec = state.rivals[r.id as RivalId] ?? { stars: 0, losses: 0 };
  const owned = [...state.owned, ...(pay.prize ? [pay.prize] : []), ...(pay.crown ? [CROWN] : [])];
  return {
    ...state, owned, fights: state.fights + 1,
    charges: pay.spent ? Math.max(0, state.charges - 1) : state.charges, tries: pay.spent ? 0 : state.tries + 1,
    rivals: { ...state.rivals, [r.id]: o.won ? { stars: Math.max(rec.stars, o.stars), losses: 0 } : { ...rec, losses: rec.losses + 1 } },
  };
}
/** A Round finished: one more fight. */
export const earnFight = (state: WorkshopState): WorkshopState => ({ ...state, charges: state.charges + 1 });
export const allOwned = (w: Pick<WorkshopState, 'owned'>) => ALL_PARTS.every(k => isOwned(w, k));
export const countOwned = (w: Pick<WorkshopState, 'owned'>, cat: Cat) => partsIn(cat).filter(p => isOwned(w, keyOf(cat, p.id))).length;
