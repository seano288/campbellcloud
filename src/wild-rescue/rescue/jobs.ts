// The hands-on job at the end of a Rescue, one of three kinds reused for every animal (facts/animals.ts says which):
// - pull: drag the net (or string, or web) off the animal; each tap on it pulls it a little too, so it works without a drag.
// - lift: tap the winch to lift the animal out of the hole; a better winch takes fewer taps.
// - lead: tap the treats on the ground one by one; the animal walks to each and eats it, and after the last it hops into the crate.
// None can be failed or undone: every tap moves it on.

export interface Pull { kind: 'pull'; pulled: number }
export interface Lift { kind: 'lift'; height: number; taps: number; need: number }
export interface Lead { kind: 'lead'; eaten: number }
export type JobState = Pull | Lift | Lead;

export const TREATS = 3;
export const PULL_TAP = .26;
/** Winch taps needed by Rung: the rope winch takes 5, the Mega Crane 2. */
export const winchTaps = (rung: number) => Math.max(2, 5 - Math.floor((rung + 1) / 2));

export function createJob(kind: JobState['kind'], winchRung = 0): JobState {
  if (kind === 'pull') return { kind, pulled: 0 };
  if (kind === 'lift') return { kind, height: 0, taps: 0, need: winchTaps(winchRung) };
  return { kind, eaten: 0 };
}

/** Dragged the net by this share of the way (negative drags back nothing: it never goes back on). */
export const drag = (j: Pull, share: number): Pull => ({ ...j, pulled: Math.min(1, j.pulled + Math.max(0, share)) });
export const tapNet = (j: Pull): Pull => drag(j, PULL_TAP);
export const winch = (j: Lift): Lift => { const taps = Math.min(j.need, j.taps + 1); return { ...j, taps, height: taps / j.need }; };
/** Only the next treat counts; tapping another just says nothing happened. */
export const feed = (j: Lead, treat: number): Lead => (treat === j.eaten ? { ...j, eaten: Math.min(TREATS, j.eaten + 1) } : j);

export function done(j: JobState) {
  if (j.kind === 'pull') return j.pulled >= 1;
  if (j.kind === 'lift') return j.height >= 1;
  return j.eaten >= TREATS;
}
