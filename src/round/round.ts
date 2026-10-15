// The Round: 5 correct answers in one Game Mode, then a Bolt for each one right on the first try and one for
// finishing. A miss holds taps while it's explained, help teaches the answer after two, and a missed problem comes
// back later. Each problem's result feeds the mode's Mastery window and the first-try streak, and any Level up,
// opened mode, star or new trophy is celebrated at the end.
import { signal } from '@preact/signals';
import { sBad, sGood } from '../audio/sfx';
import { screen, screenVoice } from '../app/nav';
import { pick } from '../game/rng';
import { player } from '../game/store';
import { createPractice } from '../app/practice';
import type { LearningSession, Outcome, RoundResult } from '../learning/session';
import { createRound, type RoundDisplay } from '../learning/round';
import type { MoneyKey } from '../money/money';
import { explainLearn } from '../modes/learn/feedback';
import type { LearnProblem } from '../modes/learn/learn';
import type { CountProblem } from '../modes/count/count';
import { explainCount } from '../modes/count/feedback';
import type { PayProblem } from '../modes/pay/pay';
import { explainPay, promptPay } from '../modes/pay/feedback';
import { countSession, learnSession, paySession } from '../modes/session';
import type { Level, ModeId } from '../modes/ids';
import type { LearningChange } from '../modes/learning';
import type { TrophyStep } from '../trophies/trophies';
import { toast } from '../ui/toast';
import { CHEERS } from '../voice/phrases';
import { createVoiceScope, type VoiceScope } from '../voice/say';
import { ROUND_LENGTH } from './rules';

export type RoundEvent = LearningChange | { kind: 'trophy'; step: TrophyStep };

type Subject =
  | { mode: 'learn'; shared: RoundDisplay<LearnProblem, MoneyKey> }
  | { mode: 'count'; shared: RoundDisplay<CountProblem, number> }
  | { mode: 'pay'; shared: RoundDisplay<PayProblem, readonly MoneyKey[]> };

export type Round = RoundState & Subject;

interface RoundState {
  voice: VoiceScope;
  roundId: string;
  level: Level;
  /** The introduction card for the mode's new money comes before the first problem. */
  intro: boolean;
  /** How each answered problem went: one star each. */
  results: Outcome[];
  /** Changes with every new problem, so the mode's screen starts fresh. */
  key: number;
  busy: boolean;
  /** Taps wait while a miss is explained. */
  thinking: boolean;
  events: RoundEvent[];
  ended: boolean;
  earned: number;
  beforeBalance: number;
  afterBalance: number;
  /** The Bolts from this Round made a new Mod affordable. */
  canBuild: boolean;
}

export const round = signal<Round | null>(null);
const practice = createPractice(player);
let sharedRound: { leave(): void } | null = null;
let stopShared = () => {};

const set = (patch: Partial<RoundState>) => { if (round.value) round.value = { ...round.value, ...patch }; };

export function startRound(mode: ModeId, explanations: {
  count?: Parameters<typeof countSession>[2];
  pay?: Parameters<typeof paySession>[2];
} = {}) {
  leaveRound();
  const started = practice.start(mode);
  if (started.kind !== 'accepted') return;
  screen.value = 'round';
  const voice = createVoiceScope(screenVoice.peek().signal);
  const startShared = <P, A>(session: LearningSession<P, A>, subject: (display: RoundDisplay<P, A>) => Subject) => {
    const controller = createRound({
      roundId: started.roundId, session,
      rng: Math.random, signal: voice.signal,
      introduction: started.intro ? { acknowledge: () => { practice.acknowledge(started.roundId); } } : undefined,
      interrupt: fact => { practice.interrupt(fact.roundId, fact.index, fact.outcome); },
      solved: (roundId, fact) => {
        const committed = practice.solve(roundId, fact);
        if (committed.kind === 'accepted' && round.value?.roundId === roundId) set({ events: [...round.value.events, ...committed.changes] });
      },
      terminal: fact => { if (fact.status === 'abandoned') practice.terminal(fact); else endRound(fact); },
      effects: {
        incorrect: async () => { sBad(); },
        correct: async (fact, signal) => {
          sGood();
          if (fact.index === ROUND_LENGTH || fact.outcome !== 'clean') return;
          const cheer = pick(Math.random, CHEERS), voice = createVoiceScope(signal);
          await toast(voice, cheer, cheer);
        },
      },
    });
    sharedRound = controller;
    round.value = {
      ...subject(controller.display.peek()), voice,
      roundId: started.roundId, level: started.level, intro: started.intro, results: [],
      key: 0, busy: false, thinking: false, events: [], ended: false, earned: 0, canBuild: false, beforeBalance: 0, afterBalance: 0,
    };
    stopShared = controller.display.subscribe(display => {
      if (round.value?.roundId !== display.roundId) return;
      round.value = {
        ...round.value, ...subject(display), intro: display.phase === 'introduction', key: display.current.id,
        results: display.results.map(r => r.outcome),
        thinking: display.phase === 'explaining' || display.phase === 'thinking',
        busy: display.phase === 'success' || display.phase === 'completed' || display.phase === 'abandoned',
      };
    });
  };
  if (mode === 'learn') return startShared(learnSession(started.level, () => player.state.peek().learning.modes.learn, explainLearn), shared => ({ mode, shared }));
  if (mode === 'count') return startShared(countSession(started.level, () => player.state.peek().learning.modes.count, explanations.count ?? explainCount), shared => ({ mode, shared }));
  startShared(paySession(started.level, () => player.state.peek().learning.modes.pay, explanations.pay ?? explainPay, promptPay), shared => ({ mode, shared }));
}

export function leaveRound() {
  const r = round.value;
  sharedRound?.leave();
  stopShared();
  sharedRound = null;
  r?.voice.cancel();
  round.value = null;
}

function endRound(fact: RoundResult) {
  const r = round.value;
  const { roundId } = fact;
  if (!r || r.roundId !== roundId || r.ended) return;
  const done = practice.terminal(fact);
  if (done.kind !== 'accepted' || round.value?.roundId !== roundId) return;
  const events = [...r.events, ...done.trophies.map(step => ({ kind: 'trophy', step }) as const)];
  set({ ended: true, earned: done.earned, canBuild: done.canBuild, events, beforeBalance: done.beforeBalance, afterBalance: done.afterBalance });
}
