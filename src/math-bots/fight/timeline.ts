// What keeps a rebuilt stage on the same fight. A rebuild simulates the fight again from its seed, and the only thing that isn't in the
// seed is when he tapped 💥, so each tap is kept by physics step and tapped again at that step. Events are matched by when they
// happened rather than by their place in the list, so a fight that still came out a little different can't skip or repeat a hit, and
// the knockout is always heard, because the screen and his ticket wait on it. No three.js here.

/** The fight as this file needs it. */
export interface Steppable { chargeRequested: boolean; step(): void }
export interface Timed { t: number; type: string }

/** Steps a fight, replaying the taps in `taps` (physics step numbers, oldest first), which outlive any one stage. */
export function createStepper(fight: Steppable, taps: number[]) {
  let step = 0, next = 0;
  return {
    step() {
      for (; next < taps.length && taps[next]! <= step; next++) fight.chargeRequested = true;
      fight.step();
      step++;
    },
    /** A new tap, acted on from the next step. */
    tap() { taps.push(step); },
  };
}

export interface Heard { t: number; /** Types already heard at exactly `t`: a hit and the knockout can share a physics step. */ at: string[]; ko: boolean }
export const nothingHeard = (): Heard => ({ t: -1, at: [], ko: false });

/** The events the picture has newly reached at time `now`, marked as heard. The list runs in time order. */
export function reached<E extends Timed>(events: readonly E[], heard: Heard, now: number): E[] {
  const fresh: E[] = [];
  for (const e of events) {
    if (e.t > now) break;
    if (e.type === 'ko' ? heard.ko : e.t < heard.t || (e.t === heard.t && heard.at.includes(e.type))) continue;
    if (e.type === 'ko') heard.ko = true;
    if (e.t > heard.t) { heard.t = e.t; heard.at = []; }
    if (e.t === heard.t) heard.at.push(e.type);
    fresh.push(e);
  }
  return fresh;
}
