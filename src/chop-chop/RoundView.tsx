// A Round on screen: the shared Round layout (src/round/RoundScreen.tsx) with each question's view and the end-of-Round
// celebration.
import type { ComponentChildren } from 'preact';
import type { ProblemInstance } from '../learning/round';
import { RoundScreen } from '../round/RoundScreen';
import { IconButton, Stars } from '../ui/bits';
import { BiggerView, ColorView, FairView, FindView, MeetView, NameView, ShareView } from './fractions/views';
import { EndOverlay } from './EndOverlay';
import type { Problem } from './mix';
import { screen } from './nav';
import { leaveRound, round, startRound } from './round';
import { VoiceBoundary, VoiceContext } from './voice';

function Question({ current }: { current: ProblemInstance<Problem, string> }) {
  const p = current.problem, as = <Q,>(problem: Q): ProblemInstance<Q, string> => ({ ...current, problem });
  return (
    <VoiceBoundary active={!round.value!.busy} signal={current.signal}>
      {p.mode === 'fair' ? <FairView current={as(p.q)} />
        : p.mode === 'name' ? <NameView current={as(p.q)} />
          : p.mode === 'bigger' ? <BiggerView current={as(p.q)} />
            : p.mode === 'find' ? <FindView current={as(p.q)} />
              : p.mode === 'color' ? <ColorView current={as(p.q)} />
                : p.mode === 'meet' ? <MeetView current={as(p.q)} />
                  : <ShareView current={as(p.q)} />}
    </VoiceBoundary>
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
    end: r.ended && <EndOverlay key={r.roundId} result={r} hasAffordable={hasAffordable}
      onHelipad={() => { leaveRound(); screen.value = 'helipad'; }}
      onAgain={() => startRound()}
      onHome={() => { leaveRound(); screen.value = 'home'; }} />,
  };
  return (
    <VoiceContext.Provider value={r.voice}>
      <RoundScreen {...views} display={r.shared} Problem={Question} />
    </VoiceContext.Provider>
  );
}
