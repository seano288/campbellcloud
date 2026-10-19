import type { ComponentChildren } from 'preact';
import type { ProblemInstance } from '../learning/round';
import { modeById } from '../modes/modes';
import type { LearnProblem } from '../modes/learn/learn';
import { LearnView } from '../modes/learn/LearnView';
import type { CountProblem } from '../modes/count/count';
import { CountView } from '../modes/count/CountView';
import type { PayProblem } from '../modes/pay/pay';
import { PayView } from '../modes/pay/PayView';
import type { MoneyKey } from '../money/money';
import { truckColor } from './garage';
import { EndOverlay } from './EndOverlay';
import { IntroCard, LevelCard } from '../round/IntroCard';
import { levelLine } from '../modes/phrases';
import { leaveRound, round, startRound } from '../round/round';
import { RoundScreen } from '../round/RoundScreen';
import { IconButton, Stars } from '../ui/bits';
import { VoiceBoundary, VoiceContext } from '../voice/context';
import { screen } from './nav';

function Learn({ current }: { current: ProblemInstance<LearnProblem, MoneyKey> }) {
  return <VoiceBoundary active={!round.value!.busy} signal={current.signal}><LearnView problem={current.problem} actions={current.actions} signal={current.signal} /></VoiceBoundary>;
}

function Count({ current }: { current: ProblemInstance<CountProblem, number> }) {
  return <VoiceBoundary active={!round.value!.busy} signal={current.signal}><CountView level={round.value!.level} problem={current.problem} actions={current.actions} signal={current.signal} /></VoiceBoundary>;
}

function Pay({ current }: { current: ProblemInstance<PayProblem, readonly MoneyKey[]> }) {
  return <VoiceBoundary active={!round.value!.busy} signal={current.signal}><PayView level={round.value!.level} problem={current.problem} actions={current.actions} signal={current.signal} /></VoiceBoundary>;
}

function Introduction({ signal, acknowledge }: { signal: AbortSignal; acknowledge(): void }) {
  const r = round.value!;
  const mode = modeById(r.mode);
  if (r.level === 2 || r.level === 3) return <IntroCard money={mode.introMoney[r.level]} signal={signal} onGo={acknowledge} />;
  return r.level === 4 || r.level === 5 ? <LevelCard icon={mode.icon} level={r.level} line={levelLine(r.mode, r.level)} signal={signal} onGo={acknowledge} /> : null;
}

export function MoneyRound({ status, hasAffordable }: { status: ComponentChildren; hasAffordable: boolean }) {
  const r = round.value;
  if (!r) return null;
  const views = {
    header: <>
      <IconButton label="Home" onClick={() => { if (r.voice.active) { leaveRound(); screen.value = 'home'; } }}>🏠</IconButton>
      <Stars results={r.results} />
      {status}
    </>,
    Introduction,
    end: r.ended && <EndOverlay key={r.roundId} result={r} hasAffordable={hasAffordable} color={truckColor()}
      onGarage={() => { leaveRound(); screen.value = 'garage'; }}
      onAgain={() => startRound(r.mode)}
      onHome={() => { leaveRound(); screen.value = 'home'; }} />,
  };
  return (
    <VoiceContext.Provider value={r.voice}>
      {r.mode === 'learn' ? <RoundScreen {...views} display={r.shared} Problem={Learn} />
        : r.mode === 'count' ? <RoundScreen {...views} display={r.shared} Problem={Count} />
          : <RoundScreen {...views} display={r.shared} Problem={Pay} />}
    </VoiceContext.Provider>
  );
}
