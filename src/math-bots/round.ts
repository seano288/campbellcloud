// A Round: 5 correct answers on the shared Round engine (src/learning/round.ts), each question any kind in his working set
// (src/math-bots/mix.ts), then a Bolt for each one right on the first try and one for finishing. Level ups and opened kinds are
// celebrated at the end. A miss replays with new numbers and earns no Mastery credit; that lives in mix.ts, so the shared
// engine and the other games are untouched.
import { signal } from '@preact/signals';
import { sBad, sGood } from '../audio/sfx';
import { pick } from '../game/rng';
import { createRound, type RoundDisplay } from '../learning/round';
import type { Outcome, RoundResult, SolvedProblem } from '../learning/session';
import { ROUND_LENGTH } from '../round/rules';
import { player, practice } from './game';
import { factKey, type LearningChange } from './learning';
import { mixedSession, type Problem } from './mix';
import { place, screen, screenVoice } from './nav';
import { said } from './numbers/say';
import { explain, newRoundOfTeaching, tookLong } from './numbers/run';
import { CHEERS } from './phrases';
import { createVoiceScope, toast, type VoiceScope } from './voice';

export type RoundEvent = LearningChange;

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
  newRoundOfTeaching();
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
      const pair = p.mode === 'facts' && p.q.kind === 'facts' ? factKey([p.q.eq.a, p.q.eq.b]) : undefined;
      const committed = practice.solve(roundId, fact, p.mode === 'meet' ? { meet: p.meeting } : {
        mode: p.mode, push: p.push, ...(pair && { fact: pair, quick: !tookLong(controller.display.peek().current.signal) }), ...(p.probe && { probe: p.probe }),
      });
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
        const p = controller.display.peek().current.problem, voice = createVoiceScope(signal);
        // the number he just tapped, said whole (the question's own voice has already stopped with it)
        if (p.mode !== 'meet' && /^\d+$/.test(p.q.answer) && p.q.input !== 'cards') await voice.say(said(Number(p.q.answer)));
        if (fact.index === ROUND_LENGTH || fact.outcome !== 'clean') return;
        const cheer = pick(Math.random, CHEERS);
        await toast(voice, cheer, cheer);
      },
    },
  });
  shared = controller;
  round.value = {
    shared: controller.display.peek(), voice, roundId: started.roundId, results: resume.map(r => r.outcome),
    busy: false, thinking: false, events: [], ended: false, earned: 0, beforeBalance: 0, afterBalance: 0,
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

// The browser tour reads the question from here, as a child reads it from the screen (tools/math-bots/tour.ts).
if (import.meta.env.DEV) (window as unknown as { __round(): unknown }).__round = () => round.peek()?.shared.current.problem ?? null;

/** After the Start tap: back into the Round he was in the middle of, or to the screen he was on. */
export function comeBack() {
  const { screen: last, round: saved } = place.get();
  if (saved) startRound(saved.results);
  if (screen.peek() !== 'round') screen.value = last === 'reward' ? 'reward' : 'home';
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
