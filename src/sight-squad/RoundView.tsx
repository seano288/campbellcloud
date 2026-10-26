// A Round on screen: the shared Round layout (src/round/RoundScreen.tsx) with each question's view and the end-of-Round
// celebration.
import type { ComponentChildren } from 'preact';
import type { ProblemInstance } from '../learning/round';
import { RoundScreen } from '../round/RoundScreen';
import { IconButton, Stars } from '../ui/bits';
import { EndOverlay } from './EndOverlay';
import type { Problem } from './mix';
import { screen } from './nav';
import { leaveRound, round, startRound } from './round';
import { VoiceBoundary, VoiceContext } from './voice';
import { FillView, HearView, HuntView, MeetView, ReadView, SentenceView, SpellView } from './words/views';

function Question({ current }: { current: ProblemInstance<Problem, string> }) {
  const p = current.problem, as = <Q,>(problem: Q): ProblemInstance<Q, string> => ({ ...current, problem });
  return (
    <VoiceBoundary active={!round.value!.busy} signal={current.signal}>
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
  if (!r) return null;
  const views = {
    header: <>
      <IconButton label="Home" onClick={() => { if (r.voice.active) { leaveRound(); screen.value = 'home'; } }}>🏠</IconButton>
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
