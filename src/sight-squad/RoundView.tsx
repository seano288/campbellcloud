// A Round on screen: the shared Round layout (src/round/RoundScreen.tsx) with each question's view and the end-of-Round
// celebration. The card is a field map, and one of his soldiers stands at its corner and salutes each right answer. 🏠 takes
// two taps ("Tap again to go home."), so a stray thumb near the stars doesn't end his Round.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { ProblemInstance } from '../learning/round';
import { RoundScreen } from '../round/RoundScreen';
import { IconButton, Stars } from '../ui/bits';
import { colourHex } from './camp/actions';
import { UnitArt } from './camp/UnitArt';
import { EndOverlay } from './EndOverlay';
import { player } from './game';
import type { Problem } from './mix';
import { screen } from './nav';
import { leaveRound, round, startRound } from './round';
import { VoiceBoundary, VoiceContext } from './voice';
import { FillView, HearView, HuntView, MeetView, ReadView, SentenceView, SpellView } from './words/views';

/** His soldier at the corner of the map: at ease while he reads, saluting while a right answer is cheered. */
function Lookout() {
  const salute = round.value?.shared.phase === 'success';
  return <UnitArt unit="rifleman" color={colourHex(player.state.value.camp)} class={`lookout ${salute ? 'salute' : ''}`} />;
}

function Question({ current }: { current: ProblemInstance<Problem, string> }) {
  const p = current.problem, as = <Q,>(problem: Q): ProblemInstance<Q, string> => ({ ...current, problem });
  return (
    <VoiceBoundary active={!round.value!.busy} signal={current.signal}>
      <Lookout />
      {p.mode === 'hear' ? <HearView current={as(p.q)} />
        : p.mode === 'hunt' ? <HuntView current={as(p.q)} />
          : p.mode === 'spell' ? <SpellView current={as(p.q)} />
            : p.mode === 'read' ? <ReadView current={as(p.q)} />
              : p.mode === 'sentence' ? <SentenceView current={as(p.q)} />
                : p.mode === 'fill' ? <FillView current={as(p.q)} />
                  : <MeetView current={as(p.q)} />}
    </VoiceBoundary>
  );
}

export function RoundView({ status, hasAffordable }: { status: ComponentChildren; hasAffordable: boolean }) {
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
    end: r.ended && <EndOverlay key={r.roundId} result={r} hasAffordable={hasAffordable}
      onCamp={() => { leaveRound(); screen.value = 'camp'; }}
      onAgain={() => startRound()}
      onHome={() => { leaveRound(); screen.value = 'home'; }} />,
  };
  return (
    <VoiceContext.Provider value={r.voice}>
      <RoundScreen {...views} display={r.shared} Problem={Question} />
    </VoiceContext.Provider>
  );
}
