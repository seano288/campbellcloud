import { screen } from '../app/nav';
import { GoalBar } from '../garage/GoalBar';
import { modeById } from '../modes/modes';
import { LearnView } from '../modes/learn/LearnView';
import { CountView } from '../modes/count/CountView';
import { PayView } from '../modes/pay/PayView';
import { BoltPile, IconButton, Stars } from '../ui/bits';
import { VoiceBoundary, VoiceContext } from '../voice/context';
import { EndOverlay } from './EndOverlay';
import { IntroCard } from './IntroCard';
import { leaveRound, round } from './round';

export function RoundScreen() {
  const r = round.value;
  if (!r) return null;
  const mode = modeById(r.mode);
  return (
    <VoiceContext.Provider value={r.voice}>
      <div class="screen round-screen">
        <div class="roundbar">
          <IconButton label="Home" onClick={() => { leaveRound(); screen.value = 'home'; }}>🏠</IconButton>
          <Stars results={r.results} />
          <GoalBar />
          <BoltPile />
        </div>
        <main class={`card ${r.thinking ? 'thinking' : ''}`}>
          {!r.intro && <VoiceBoundary key={`${r.roundId}:${r.key}`} active={!r.busy} signal={r.shared.current.signal}>
            {r.mode === 'learn'
              ? <LearnView problem={r.shared.current.problem} actions={r.shared.current.actions} signal={r.shared.current.signal} />
              : r.mode === 'count' ? <CountView level={r.level} problem={r.shared.current.problem} actions={r.shared.current.actions} signal={r.shared.current.signal} />
              : <PayView level={r.level} problem={r.shared.current.problem} actions={r.shared.current.actions} signal={r.shared.current.signal} />}
          </VoiceBoundary>}
        </main>
        {r.intro && r.level > 1 && r.shared.introduction && <IntroCard money={mode.introMoney[r.level as 2 | 3]} signal={r.shared.introduction.signal} onGo={r.shared.introduction.acknowledge} />}
        {r.ended && <EndOverlay />}
      </div>
    </VoiceContext.Provider>
  );
}
