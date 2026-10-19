// A Round of one Game Mode: 5 correct answers on the shared Round engine (src/learning/round.ts), then a Bolt for each
// one right on the first try and one for finishing. Level ups, opened modes, stars and Trophies are celebrated at the end.
import { signal } from '@preact/signals';
import { sBad, sGood } from '../audio/sfx';
import { pick } from '../game/rng';
import { createRound, type RoundDisplay } from '../learning/round';
import type { LearningSession, Outcome, RoundResult, SolvedProblem } from '../learning/session';
import { ROUND_LENGTH } from '../round/rules';
import { explainChoice, explainFind, explainSet } from './clock/feedback';
import type { ClockTime, Level } from './clock/time';
import { practice, player } from './game';
import { choiceSession, setSession, type ChoiceProblem, type LearningChange, type ModeId, type SetProblem } from './learning';
import { place, screen, screenVoice } from './nav';
import { CHEERS } from './phrases';
import type { TrophyStep } from './trophies';
import { createVoiceScope, toast, type VoiceScope } from './voice';

export type RoundEvent = LearningChange | { kind: 'trophy'; step: TrophyStep };

type Subject =
  | { mode: 'find'; shared: RoundDisplay<ChoiceProblem, string> }
  | { mode: 'read'; shared: RoundDisplay<ChoiceProblem, string> }
  | { mode: 'set'; shared: RoundDisplay<SetProblem, ClockTime> };

export interface RoundState {
  voice: VoiceScope;
  roundId: string;
  level: Level;
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
export type Round = RoundState & Subject;

export const round = signal<Round | null>(null);
let shared: { leave(): void } | null = null;
let stopShared = () => {};

const set = (patch: Partial<RoundState>) => { if (round.value) round.value = { ...round.value, ...patch }; };
const progressOf = (mode: ModeId) => () => player.state.peek().learning.modes[mode];

/** `resume`: the answers he gave in this Round before the page reloaded. */
export function startRound(mode: ModeId, resume: readonly SolvedProblem[] = []) {
  leaveRound();
  const started = practice.start(mode, resume);
  if (started.kind !== 'accepted') return;
  screen.value = 'round';
  let soFar = [...resume];
  place.round({ mode, results: soFar });
  const voice = createVoiceScope(screenVoice.peek().signal);
  const begin = <P, A>(session: LearningSession<P, A>, subject: (display: RoundDisplay<P, A>) => Subject) => {
    const controller = createRound({
      roundId: started.roundId, session, rng: Math.random, signal: voice.signal, resume,
      introduction: started.intro ? { acknowledge: () => { practice.acknowledge(started.roundId); } } : undefined,
      interrupt: fact => { practice.interrupt(fact.roundId, fact.index, fact.outcome); },
      solved: (roundId, fact) => {
        const committed = practice.solve(roundId, fact);
        if (committed.kind !== 'accepted') return;
        soFar = [...soFar, fact];
        place.round({ mode, results: soFar });
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
      ...subject(controller.display.peek()), voice, roundId: started.roundId, level: started.level, results: resume.map(r => r.outcome),
      busy: false, thinking: false, events: [], ended: false, earned: 0, canBuild: false, beforeBalance: 0, afterBalance: 0,
    };
    stopShared = controller.display.subscribe(display => {
      if (round.value?.roundId !== display.roundId) return;
      round.value = {
        ...round.value, ...subject(display), results: display.results.map(r => r.outcome),
        thinking: display.phase === 'explaining' || display.phase === 'thinking',
        busy: display.phase === 'success' || display.phase === 'completed' || display.phase === 'abandoned',
      };
    });
  };
  const level = started.level;
  if (mode === 'find') return begin(choiceSession(level, progressOf(mode), explainFind), shared => ({ mode, shared }));
  if (mode === 'read') return begin(choiceSession(level, progressOf(mode), explainChoice), shared => ({ mode, shared }));
  begin(setSession(level, progressOf(mode), explainSet), shared => ({ mode, shared }));
}

/** After the Start tap: back into the Round he was in the middle of, or to the screen he was on. */
export function comeBack() {
  const { screen: last, round: saved } = place.get();
  if (saved && player.state.peek().learning.modes[saved.mode].opened) startRound(saved.mode, saved.results);
  if (screen.peek() !== 'round') screen.value = last === 'hangar' ? 'hangar' : 'home';
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
