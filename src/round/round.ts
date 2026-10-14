// The Round: 5 correct answers in one Game Mode, then a Bolt for each one right on the first try and one for
// finishing. A miss holds taps while it's explained, help teaches the answer after two, and a missed problem comes
// back later. Each problem's result feeds the mode's Mastery window and the first-try streak, and any Level up,
// opened mode, star or new trophy is celebrated at the end.
import { signal } from '@preact/signals';
import { sBad, sGood } from '../audio/sfx';
import { screen } from '../app/nav';
import { pick } from '../game/rng';
import { game, update } from '../game/store';
import { affordableCount } from '../garage/garage';
import { applySolved, learningFromSave, withLearning } from '../app/practice';
import type { Outcome } from '../learning/session';
import type { Level, ModeId } from '../modes/ids';
import type { LearningChange } from '../modes/learning';
import { modeById } from '../modes/modes';
import { struggling } from '../modes/progress';
import { acknowledgeIntro, selectPractice } from '../modes/state';
import { countAnswer, finishRound } from '../app/trophies';
import { dayOf, type TrophyStep } from '../trophies/trophies';
import { toast } from '../ui/toast';
import { CHEERS } from '../voice/phrases';
import { hush } from '../voice/say';
import { boltsFor, ROUND_LENGTH, takeAgain, teachNow, THINK_MS, type Again } from './rules';

export type RoundEvent = LearningChange | { kind: 'trophy'; step: TrophyStep };

export interface Round {
  mode: ModeId;
  level: Level;
  /** The introduction card for the mode's new money comes before the first problem. */
  intro: boolean;
  /** How each answered problem went: one star each. */
  results: Outcome[];
  problem: unknown;
  /** This problem was missed earlier in the Round, so it won't come back again. */
  again: boolean;
  /** Missed problems still to come back. */
  queue: Again[];
  /** Changes with every new problem, so the mode's screen starts fresh. */
  key: number;
  firstTry: boolean;
  helped: boolean;
  /** Misses on this problem. */
  misses: number;
  busy: boolean;
  /** Taps wait while a miss is explained. */
  thinking: boolean;
  events: RoundEvent[];
  ended: boolean;
  earned: number;
  /** The Bolts from this Round made a new Mod affordable. */
  canBuild: boolean;
}

export const round = signal<Round | null>(null);

let token = 0; // bumped when a Round starts or is left, so its timers stop touching it
const later = (ms: number, fn: () => void) => { const t = token; setTimeout(() => t === token && fn(), ms); };
const set = (patch: Partial<Round>) => { if (round.value) round.value = { ...round.value, ...patch }; };

export function startRound(mode: ModeId) {
  token++;
  hush();
  const m = game.value.modes[mode];
  update(s => withLearning(s, selectPractice(learningFromSave(s), mode)));
  round.value = {
    mode, level: m.level, intro: m.introPending, results: [], problem: modeById(mode).makeProblem(m.level, Math.random), again: false, queue: [],
    key: 0, firstTry: true, helped: false, misses: 0, busy: false, thinking: false, events: [], ended: false, earned: 0, canBuild: false,
  };
  screen.value = 'round';
}

/** He's seen the introduction card: on to the first problem. */
export function introDone() {
  const r = round.value;
  if (!r) return;
  update(s => withLearning(s, acknowledgeIntro(learningFromSave(s), r.mode)));
  set({ intro: false });
}

export function leaveRound() {
  token++;
  hush();
  round.value = null;
}

export const isStruggling = (mode: ModeId) => struggling(game.value.modes[mode]);

function nextProblem() {
  const r = round.value!, m = modeById(r.mode), back = takeAgain(r.queue, r.results.length);
  const problem = back ? m.replay(back.problem, Math.random) : m.makeProblem(r.level, Math.random);
  set({ problem, again: !!back, queue: back ? back.rest : r.queue, key: r.key + 1, firstTry: true, helped: false, misses: 0, busy: false, thinking: false });
}

function record(r: Round, outcome: Outcome): RoundEvent[] {
  let changes: LearningChange[] = [];
  update(s => {
    const next = applySolved(s, r.mode, { index: r.results.length + 1, outcome, misses: r.misses, helped: r.helped, replay: r.again });
    changes = next.changes;
    return next.save;
  });
  return changes;
}

export function correct() {
  const r = round.value;
  if (!r || r.busy || r.thinking) return;
  const outcome: Outcome = !r.firstTry ? 'missed' : r.helped ? 'helped' : 'clean';
  const events = [...r.events, ...record(r, outcome)];
  const results = [...r.results, outcome];
  const queue = outcome === 'missed' && !r.again ? [...r.queue, { problem: r.problem, after: results.length }] : r.queue;
  set({ results, queue, busy: true, events });
  sGood();
  if (results.length >= ROUND_LENGTH) return later(900, endRound);
  if (outcome === 'clean') { const c = pick(Math.random, CHEERS); void toast(c, c); }
  later(1500, nextProblem);
}

/** A wrong answer. `explain` says what went wrong, teaching the answer when `teach` is set; taps wait until it's done. */
export function miss(explain: (teach: boolean) => Promise<unknown>) {
  const r = round.value;
  if (!r || r.busy || r.thinking) return;
  const misses = r.misses + 1, key = r.key;
  set({ firstTry: false, misses, thinking: true });
  update(s => countAnswer(s, 'missed')); // the streak breaks now, even if he leaves before answering
  sBad();
  void explain(teachNow(misses, isStruggling(r.mode))).then(() => later(THINK_MS, () => { if (round.value?.key === key) set({ thinking: false }); }));
}

export function helped() {
  set({ helped: true });
  update(s => countAnswer(s, 'helped'));
}

function endRound() {
  const r = round.value!, before = affordableCount();
  const earned = boltsFor(r.results);
  let trophies: TrophyStep[] = [];
  update(s => {
    const done = finishRound(s, r.results, dayOf(new Date()));
    trophies = done.earned;
    return { ...done.save, bolts: s.bolts + earned };
  });
  const events = [...r.events, ...trophies.map(step => ({ kind: 'trophy', step }) as const)];
  set({ ended: true, earned, canBuild: affordableCount() > before, events });
}
