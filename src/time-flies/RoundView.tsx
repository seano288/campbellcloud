// A Round on screen: the shared Round layout (src/round/RoundScreen.tsx) with each question's view (a clock, or a
// calendar question), a card introducing the new times when a clock kind reaches a new Level, and the end-of-Round
// celebration.
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { sCount } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { RoundScreen } from '../round/RoundScreen';
import { IconButton, Stars } from '../ui/bits';
import { ClockFace } from './clock/ClockFace';
import { QuizView } from './calendar/QuizView';
import { FIVES, timePhrase } from './clock/speech';
import { FindView, ReadView, SetView } from './clock/views';
import { EndOverlay } from './EndOverlay';
import type { Problem } from './mix';
import { screen } from './nav';
import { leaveRound, round, startRound } from './round';
import { useVoiceScope, VoiceBoundary, VoiceContext } from './voice';

function Question({ current }: { current: ProblemInstance<Problem, string> }) {
  const p = current.problem, as = <Q,>(problem: Q): ProblemInstance<Q, string> => ({ ...current, problem });
  return (
    <VoiceBoundary active={!round.value!.busy} signal={current.signal}>
      {p.mode === 'find' ? <FindView current={as(p.choice)} level={p.level} />
        : p.mode === 'read' ? <ReadView current={as(p.choice)} />
          : p.mode === 'set' ? <SetView current={as(p.set)} level={p.level} />
            : <QuizView current={as(p.quiz)} />}
    </VoiceBoundary>
  );
}

/** New times: at Level 2 the long hand visits the quarters; at Level 3 it counts round by fives. */
function Introduction({ signal, acknowledge }: { signal: AbortSignal; acknowledge(): void }) {
  const level = round.value!.introLevel, voice = useVoiceScope(signal);
  const [minutes, setMinutes] = useState(180);
  const [fives, setFives] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void (async () => {
      await voice.say('Level up!', 'New times!');
      if (level === 2) {
        await voice.say('The long hand can point to the three, the six and the nine.');
        for (const m of [15, 30, 45]) { if (!voice.active) return; setMinutes(180 + m); await voice.wait(500); await voice.say(timePhrase({ hour: 3, minute: m })); }
      } else {
        await voice.say('Now the long hand can point to every number.', 'Count by fives!');
        for (let k = 1; k <= 11; k++) { if (!voice.active) return; setMinutes(180 + k * 5); setFives(k); sCount(k); await voice.say(FIVES[k - 1]!); }
      }
      if (voice.active) setReady(true);
    })();
  }, []);
  const lesson = { hand: { value: 'minute' }, lit: { value: [] }, fives: { value: fives }, pick: { value: null }, show: { value: null } } as never;
  return (
    <div class="modal">
      <div class="modal-card intro-card">
        <h2>New times!</h2>
        <div class="big-clock"><ClockFace minutes={minutes} lesson={lesson} minuteLabels={level === 3 && fives === 0} /></div>
        <button class={`big-btn go ${ready ? 'pulse' : ''}`} aria-label="Go" onClick={() => { voice.cancel(); acknowledge(); }}><span class="e">▶</span></button>
      </div>
    </div>
  );
}

export function RoundView({ status, hasAffordable }: { status: ComponentChildren; hasAffordable: boolean }) {
  const r = round.value;
  if (!r) return null;
  const views = {
    header: <>
      <IconButton label="Home" onClick={() => { if (r.voice.active) { leaveRound(); screen.value = 'home'; } }}>🏠</IconButton>
      <Stars results={r.results} />
      {status}
    </>,
    Introduction,
    end: r.ended && <EndOverlay key={r.roundId} result={r} hasAffordable={hasAffordable}
      onHangar={() => { leaveRound(); screen.value = 'hangar'; }}
      onAgain={() => startRound()}
      onHome={() => { leaveRound(); screen.value = 'home'; }} />,
  };
  return (
    <VoiceContext.Provider value={r.voice}>
      <RoundScreen {...views} display={r.shared} Problem={Question} />
    </VoiceContext.Provider>
  );
}
