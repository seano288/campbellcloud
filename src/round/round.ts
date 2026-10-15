// The Round: 5 correct answers in one Game Mode, then a Bolt for each one right on the first try and one for
// finishing. A miss holds taps while it's explained, help teaches the answer after two, and a missed problem comes
// back later. Each problem's result feeds the mode's Mastery window and the first-try streak, and any Level up,
// opened mode, star or new trophy is celebrated at the end.
import { signal } from '@preact/signals';
import { sBad, sGood } from '../audio/sfx';
import { screen, screenVoice } from '../app/nav';
import { pick } from '../game/rng';
import { game, player } from '../game/store';
import { createPractice } from '../app/practice';
import type { Outcome, SolvedProblem } from '../learning/session';
import type { Level, ModeId } from '../modes/ids';
import type { LearningChange } from '../modes/learning';
import { modeById } from '../modes/modes';
import { struggling } from '../modes/progress';
import type { TrophyStep } from '../trophies/trophies';
import { toast } from '../ui/toast';
import { CHEERS } from '../voice/phrases';
import { createVoiceScope, type VoiceScope } from '../voice/say';
import { ROUND_LENGTH, takeAgain, teachNow, THINK_MS, type Again } from './rules';

export type RoundEvent = LearningChange | { kind: 'trophy'; step: TrophyStep };

export interface Round {
  voice: VoiceScope;
  roundId: string;
  solved: SolvedProblem[];
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
const practice = createPractice(player);

let token = 0; // bumped when a Round starts or is left, so its timers stop touching it
const later = (ms: number, fn: () => void) => { const t = token; setTimeout(() => t === token && fn(), ms); };
const set = (patch: Partial<Round>) => { if (round.value) round.value = { ...round.value, ...patch }; };

export function startRound(mode: ModeId) {
  leaveRound();
  const started = practice.start(mode);
  if (started.kind !== 'accepted') return;
  screen.value = 'round';
  round.value = {
    voice: createVoiceScope(screenVoice.peek().signal),
    roundId: started.roundId, solved: [], mode, level: started.level, intro: started.intro, results: [], problem: modeById(mode).makeProblem(started.level, Math.random), again: false, queue: [],
    key: 0, firstTry: true, helped: false, misses: 0, busy: false, thinking: false, events: [], ended: false, earned: 0, canBuild: false,
  };
}

/** He's seen the introduction card: on to the first problem. */
export function introDone(roundId: string) {
  if (round.value?.roundId !== roundId) return;
  const result = practice.acknowledge(roundId);
  if (result.kind === 'accepted' && round.value?.roundId === roundId) set({ intro: false });
}

export function leaveRound() {
  token++;
  const r = round.value;
  if (r && !r.ended) practice.terminal({ roundId: r.roundId, status: 'abandoned', results: r.solved });
  r?.voice.cancel();
  round.value = null;
}

export const isStruggling = (mode: ModeId) => struggling(game.value.modes[mode]);

function nextProblem() {
  const r = round.value!, m = modeById(r.mode), back = takeAgain(r.queue, r.results.length);
  const problem = back ? m.replay(back.problem, Math.random) : m.makeProblem(r.level, Math.random);
  set({ problem, again: !!back, queue: back ? back.rest : r.queue, key: r.key + 1, firstTry: true, helped: false, misses: 0, busy: false, thinking: false });
}

function activeProblem(roundId: string, key: number) {
  const r = round.value;
  return r?.roundId === roundId && r.key === key && !r.intro && !r.busy && !r.ended ? r : null;
}

export function correct(roundId: string, key: number) {
  const r = activeProblem(roundId, key);
  if (!r || r.thinking) return;
  const outcome: Outcome = !r.firstTry ? 'missed' : r.helped ? 'helped' : 'clean';
  const fact: SolvedProblem = { index: r.results.length + 1, outcome, misses: r.misses, helped: r.helped, replay: r.again };
  const committed = practice.solve(roundId, fact);
  if (committed.kind !== 'accepted' || round.value?.roundId !== roundId) return;
  const events = [...r.events, ...committed.changes];
  const results = [...r.results, outcome];
  const queue = outcome === 'missed' && !r.again ? [...r.queue, { problem: r.problem, after: results.length }] : r.queue;
  set({ results, solved: [...r.solved, fact], queue, busy: true, events });
  sGood();
  if (results.length >= ROUND_LENGTH) return later(900, () => endRound(roundId));
  if (outcome === 'clean') { const c = pick(Math.random, CHEERS); void toast(r.voice, c, c); }
  later(1500, nextProblem);
}

/** A wrong answer. `explain` says what went wrong, teaching the answer when `teach` is set; taps wait until it's done. */
export function miss(roundId: string, key: number, explain: (teach: boolean) => Promise<unknown>) {
  const r = activeProblem(roundId, key);
  if (!r || r.thinking) return;
  const committed = practice.interrupt(roundId, key + 1, 'missed'); // the streak breaks now, even if he leaves before answering
  if (committed.kind !== 'accepted' || round.value?.roundId !== roundId) return;
  const misses = r.misses + 1;
  set({ firstTry: false, misses, thinking: true });
  sBad();
  void explain(teachNow(misses, isStruggling(r.mode))).then(() => {
    if (!activeProblem(roundId, key)) return;
    later(THINK_MS, () => { if (activeProblem(roundId, key)) set({ thinking: false }); });
  });
}

export function helped(roundId: string, key: number) {
  if (!activeProblem(roundId, key)) return;
  const committed = practice.interrupt(roundId, key + 1, 'helped');
  if (committed.kind === 'accepted' && round.value?.roundId === roundId) set({ helped: true });
}

function endRound(roundId: string) {
  const r = round.value;
  if (!r || r.roundId !== roundId || r.ended) return;
  const done = practice.terminal({ roundId, status: 'completed', results: r.solved });
  if (done.kind !== 'accepted' || round.value?.roundId !== roundId) return;
  const events = [...r.events, ...done.trophies.map(step => ({ kind: 'trophy', step }) as const)];
  set({ ended: true, earned: done.earned, canBuild: done.canBuild, events });
}
