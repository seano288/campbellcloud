// The scripted child the economy and gen tests play with, as the build guide describes: every answer right first try (6 Bolts a Round,
// what a Round really pays), every Jump taken by `child`, and always the cheapest new thing bought as soon as he can, with the strongest
// engine, tires, springs, booster, run-up, kicker and landing ramp he owns fitted (as a child who wants to jump farther would). The fixed
// catalogue first; once it is all bought, the again-and-again things.
import { MAX_BOLTS } from '../../round/rules';
import { jumpWith, type Child } from '../jump/sim';
import { partsFor, rampsFor, RAMP_SLOTS, type PartItem, type RampItem } from './catalog';
import {
  bought, catalogueDone, earnJump, finishJump, fit, freshArena, has, payFor, planJump, priceOf, repeatsNow, shopNow, statsOf, type ArenaState, type Stats, type Target,
} from './arena';

/** The strongest thing he owns in every slot that changes the Jump. */
export function strongest(a: ArenaState): ArenaState {
  let next = a;
  for (const slot of ['engine', 'tires', 'springs', 'booster'] as const) {
    const best = partsFor(slot).filter(p => has(a, p.id)).sort((x, y) => (y as PartItem).power - (x as PartItem).power)[0];
    if (best) next = fit(next, best.id) ?? next;
  }
  for (const slot of RAMP_SLOTS) {
    const score = (r: RampItem) => (slot === 'runup' ? r.feet : slot === 'kicker' ? r.angle : r.window);
    const best = rampsFor(slot).filter(p => has(a, p.id)).sort((x, y) => score(y as RampItem) - score(x as RampItem))[0];
    if (best) next = fit(next, best.id) ?? next;
  }
  return next;
}

export interface Played {
  bolts: number[]; jumpBolts: number[]; newAt: number[]; catalogueAt: number | null; firstBuy: number | null; offered: boolean[];
  /** Every Jump: its target, the try it was on that target, whether it cleared, its distance and his stats then. */
  jumps: { round: number; target: Target; tryN: number; cleared: boolean; feet: number; stats: Stats }[];
  final: ArenaState;
}
export function play(rounds: number, child: Child = 'skilled'): Played {
  let a: ArenaState = freshArena(), balance = 0;
  const run: Played = { bolts: [], jumpBolts: [], newAt: [], catalogueAt: null, firstBuy: null, offered: [], jumps: [], final: a };
  for (let r = 1; r <= rounds; r++) {
    let earned = MAX_BOLTS, gotNew = false, jumpBolts = 0;
    a = earnJump(a);
    while (a.jumps > 0) {
      const plan = planJump(a), s = jumpWith(plan.setup, child);
      const res = { feet: s.feet, clean: !!s.landed?.clean, tape: [], setup: plan.setup };
      const pay = payFor(a, plan, res);
      run.jumps.push({ round: r, target: plan.course.target, tryN: plan.setup.help + 1, cleared: pay.cleared, feet: s.feet, stats: statsOf(a) });
      a = finishJump(a, plan, res);
      earned += pay.bolts; jumpBolts += pay.bolts;
      // a Show or Row he hasn't cleared, a record or a trophy is something new to beat
      if (plan.course.target.kind !== 'again' || pay.record) gotNew = true;
    }
    balance += earned;
    run.bolts.push(earned); run.jumpBolts.push(jumpBolts);
    for (;;) {
      const next = shopNow(a)[0] ?? (catalogueDone(a) ? repeatsNow(a)[0] : undefined);
      if (!next || priceOf(a, next) > balance) break;
      balance -= priceOf(a, next);
      a = strongest(bought(a, next));
      run.firstBuy ??= r;
      run.newAt.push(r);
      gotNew = true;
    }
    run.offered.push(gotNew && shopNow(a).length + repeatsNow(a).length > 0);
    if (run.catalogueAt === null && catalogueDone(a)) run.catalogueAt = r;
  }
  run.final = a;
  return run;
}
