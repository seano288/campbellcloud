// A Round on screen: the shared Round layout (src/round/RoundScreen.tsx) with each question's view and the end-of-Round celebration.
// 🏠 takes two taps ("Tap again to go home."), so a stray thumb near the stars doesn't end his Round.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { ProblemInstance } from '../learning/round';
import { RoundScreen } from '../round/RoundScreen';
import { IconButton, Stars } from '../ui/bits';
import { EndOverlay } from './EndOverlay';
import type { Asking, Meet, Problem } from './mix';
import { launch, screen } from './nav';
import { leaveRound, round, startRound } from './round';
import { MeetView, QuestionView } from './views';
import { VoiceBoundary, VoiceContext } from './voice';

/** `waiting`: taps don't count right now (a lesson is running, or it's been answered). It's passed down as a prop because a view that
 *  reads its own lesson signals only re-renders when its props or those signals change, not when the Round's phase does. */
function Question({ current }: { current: ProblemInstance<Problem, string> }) {
  const r = round.value!, waiting = r.shared.phase !== 'answering';
  return (
    <VoiceBoundary active={!r.busy} signal={current.signal}>
      {current.problem.mode === 'meet'
        ? <MeetView current={current as ProblemInstance<Meet, string>} waiting={waiting} />
        : <QuestionView current={current as ProblemInstance<Asking, string>} waiting={waiting} />}
    </VoiceBoundary>
  );
}

export function RoundView({ status }: { status: ComponentChildren }) {
  const r = round.value;
  const [armed, setArmed] = useState(false), disarm = useRef(0);
  useEffect(() => () => clearTimeout(disarm.current), []);
  if (!r) return null;
  function home() {
    if (!r!.voice.active) return;
    if (armed) { leaveRound(); screen.value = 'home'; return; }
    setArmed(true);
    void r!.voice.say('Tap again to go home.');
    clearTimeout(disarm.current);
    disarm.current = window.setTimeout(() => setArmed(false), 4000);
  }
  const views = {
    header: <>
      <IconButton label={armed ? 'Tap again to go home' : 'Home'} class={armed ? 'armed' : ''} onClick={home}>🏠</IconButton>
      <Stars results={r.results} />
      {status}
    </>,
    end: r.ended && <EndOverlay key={r.roundId} result={r}
      onLaunch={() => { leaveRound(); launch(); }}
      onBase={() => { leaveRound(); screen.value = 'base'; }}
      onAgain={() => startRound()}
      onHome={() => { leaveRound(); screen.value = 'home'; }} />,
  };
  return (
    <VoiceContext.Provider value={r.voice}>
      <RoundScreen {...views} display={r.shared} Problem={Question} />
    </VoiceContext.Provider>
  );
}
