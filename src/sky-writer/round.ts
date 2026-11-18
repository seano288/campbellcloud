// A Round: 5 correct answers on the shared Round engine (src/learning/round.ts), each question any kind he has opened (mix.ts), then a
// Bolt for each one right on the first try and one for finishing, and one Show. Meeting a new Family is one of the five. Level ups and
// opened kinds are celebrated at the end. A miss comes back later as a new question with no Mastery credit; that lives in mix.ts, so
// the shared engine is untouched.
import { signal } from '@preact/signals';
import { sBad, sGood } from '../audio/sfx';
import { pick } from '../game/rng';
import { createRound, type RoundDisplay } from '../learning/round';
import type { Outcome, RoundResult, SolvedProblem } from '../learning/session';
import { ROUND_LENGTH } from '../round/rules';
import { player, practice } from './game';
import type { LearningChange } from './learning';
import { mixedSession, type Problem } from './mix';
import { place, screen, screenVoice } from './nav';
import { CHEERS } from './phrases';
import { explain } from './writing/teach';
import { familyOf } from './writing/problems';
import { createVoiceScope, toast, type VoiceScope } from './voice';

export type RoundEvent = LearningChange;

export interface Round {
  shared: RoundDisplay<Problem, string>;
  voice: VoiceScope;
  roundId: string;
  results: Outcome[];
  busy: boolean;
  events: RoundEvent[];
  ended: boolean;
  earned: number;
  beforeBalance: number;
  afterBalance: number;
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
  const session = mixedSession(() => player.state.peek().learning, explain);
  const controller = createRound({
    roundId: started.roundId, session, rng: Math.random, signal: voice.signal, resume,
    interrupt: () => {},
    solved: (roundId, fact) => {
      const p = controller.display.peek().current.problem;
      session.note(fact.outcome);
      const committed = practice.solve(roundId, fact, p.mode === 'meet' ? { meet: p.q.family } : { mode: p.mode, push: p.push, family: familyOf(p.q) });
      if (committed.kind !== 'accepted') return;
      soFar = [...soFar, fact];
      place.round({ mode: 'mix', results: soFar });
      if (round.value?.roundId === roundId) set({ events: [...round.value.events, ...committed.changes.filter(c => c.kind !== 'met')] });
    },
    terminal: fact => { if (fact.status === 'abandoned') practice.terminal(fact); else endRound(fact); },
    effects: {
      incorrect: async () => { sBad(); },
      correct: async (fact, signal) => {
        sGood();
        const p = controller.display.peek().current.problem, said = createVoiceScope(signal);
        // on a slow connection the next question may be here already, and a cheer now would cut off its voice
        if (fact.index === ROUND_LENGTH || fact.outcome !== 'clean' || p.mode === 'meet' || controller.display.peek().phase !== 'success') return;
        const cheer = pick(Math.random, CHEERS);
        await toast(said, cheer, cheer);
      },
    },
  });
  shared = controller;
  round.value = {
    shared: controller.display.peek(), voice, roundId: started.roundId, results: resume.map(r => r.outcome),
    busy: false, events: [], ended: false, earned: 0, beforeBalance: 0, afterBalance: 0,
  };
  stopShared = controller.display.subscribe(display => {
    if (round.value?.roundId !== display.roundId) return;
    round.value = {
      ...round.value, shared: display, results: display.results.map(r => r.outcome),
      busy: display.phase === 'success' || display.phase === 'completed' || display.phase === 'abandoned',
    };
  });
}

// The browser tour reads the question from here, as a child hears it (tools/sky-writer/tour.ts).
if (import.meta.env.DEV) (window as unknown as { __round(): unknown }).__round = () => round.peek()?.shared.current.problem ?? null;

/** After the Start tap: back into the Round he was in the middle of, or to the screen he was on. */
export function comeBack() {
  const { screen: last, round: saved } = place.get();
  if (saved) startRound(saved.results);
  if (screen.peek() !== 'round') screen.value = last === 'airfield' || last === 'wall' ? last : 'home';
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
  set({ ended: true, earned: done.earned, beforeBalance: done.beforeBalance, afterBalance: done.afterBalance });
}
