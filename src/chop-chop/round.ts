// A Round: 5 correct answers on the shared Round engine (src/learning/round.ts), each question any kind he has opened
// (src/chop-chop/mix.ts), then a Bolt for each one right on the first try and one for finishing. Level ups, opened kinds,
// stars and Trophies are celebrated at the end.
import { signal } from '@preact/signals';
import { sBad, sGood } from '../audio/sfx';
import { pick } from '../game/rng';
import { createRound, type RoundDisplay } from '../learning/round';
import type { Outcome, RoundResult, SolvedProblem } from '../learning/session';
import { ROUND_LENGTH } from '../round/rules';
import { explainBigger, explainColor, explainFair, explainFind, explainName, explainShare, explainWrite } from './fractions/teach';
import { practice, player } from './game';
import type { LearningChange } from './learning';
import { mixedSession, type Problem } from './mix';
import { place, screen, screenVoice } from './nav';
import { CHEERS } from './phrases';
import type { TrophyStep } from './trophies';
import { createVoiceScope, toast, type VoiceScope } from './voice';

export type RoundEvent = LearningChange | { kind: 'trophy'; step: TrophyStep };

export interface Round {
  shared: RoundDisplay<Problem, string>;
  voice: VoiceScope;
  roundId: string;
  results: Outcome[];
  busy: boolean;
  thinking: boolean;
  events: RoundEvent[];
  ended: boolean;
  earned: number;
  beforeBalance: number;
  afterBalance: number;
  canBuild: boolean;
}

export const round = signal<Round | null>(null);
let shared: { leave(): void } | null = null;
let stopShared = () => {};

const set = (patch: Partial<Round>) => { if (round.value) round.value = { ...round.value, ...patch }; };

/** `resume`: the answers he gave in this Round before the page reloaded. */
export function startRound(resume: readonly SolvedProblem[] = []) {
  leaveRound();
  const started = practice.start(resume);
  if (started.kind !== 'accepted') return;
  screen.value = 'round';
  let soFar = [...resume];
  place.round({ mode: 'mix', results: soFar });
  const voice = createVoiceScope(screenVoice.peek().signal);
  const session = mixedSession(() => player.state.peek().learning, { fair: explainFair, name: explainName, bigger: explainBigger, find: explainFind, color: explainColor, share: explainShare, write: explainWrite });
  const controller = createRound({
    roundId: started.roundId, session, rng: Math.random, signal: voice.signal, resume,
    interrupt: fact => { practice.interrupt(fact.roundId, fact.index, fact.outcome); },
    solved: (roundId, fact) => {
      const asked = controller.display.peek().current.problem;
      session.note(fact.outcome);
      const committed = practice.solve(roundId, fact, asked.mode === 'meet' ? { meet: asked.q.d } : asked.mode === 'meetWriting' ? { writing: true } : { mode: asked.mode, push: asked.push });
      if (committed.kind !== 'accepted') return;
      soFar = [...soFar, fact];
      place.round({ mode: 'mix', results: soFar });
      if (round.value?.roundId === roundId) set({ events: [...round.value.events, ...committed.changes] });
    },
    terminal: fact => { if (fact.status === 'abandoned') practice.terminal(fact); else endRound(fact); },
    effects: {
      incorrect: async () => { sBad(); },
      correct: async (fact, signal) => {
        sGood();
        if (fact.index === ROUND_LENGTH || fact.outcome !== 'clean') return;
        const cheer = pick(Math.random, CHEERS);
        await toast(createVoiceScope(signal), cheer, cheer);
      },
    },
  });
  shared = controller;
  round.value = {
    shared: controller.display.peek(), voice, roundId: started.roundId, results: resume.map(r => r.outcome),
    busy: false, thinking: false, events: [], ended: false, earned: 0, canBuild: false, beforeBalance: 0, afterBalance: 0,
  };
  stopShared = controller.display.subscribe(display => {
    if (round.value?.roundId !== display.roundId) return;
    round.value = {
      ...round.value, shared: display, results: display.results.map(r => r.outcome),
      thinking: display.phase === 'explaining' || display.phase === 'thinking',
      busy: display.phase === 'success' || display.phase === 'completed' || display.phase === 'abandoned',
    };
  });
}

/** After the Start tap: back into the Round he was in the middle of, or to the screen he was on. */
export function comeBack() {
  const { screen: last, round: saved } = place.get();
  if (saved) startRound(saved.results);
  if (screen.peek() !== 'round') screen.value = last === 'helipad' ? 'helipad' : 'home';
}

export function leaveRound() {
  const r = round.value;
  place.round(null);
  shared?.leave();
  stopShared();
  shared = null;
  r?.voice.cancel();
  round.value = null;
}

function endRound(fact: RoundResult) {
  const r = round.value;
  if (!r || r.roundId !== fact.roundId || r.ended) return;
  const done = practice.terminal(fact);
  if (done.kind !== 'accepted') return;
  place.round(null);
  if (round.value?.roundId !== fact.roundId) return;
  const events = [...r.events, ...done.trophies.map(step => ({ kind: 'trophy', step }) as const)];
  set({ ended: true, earned: done.earned, canBuild: done.canBuild, events, beforeBalance: done.beforeBalance, afterBalance: done.afterBalance });
}
