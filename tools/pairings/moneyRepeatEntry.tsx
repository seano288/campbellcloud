import './moneyRepeatVoice';
import { mountApp } from '../../src/main';
import { browserStorage } from '../../src/save/browser';
import { createVoiceScope } from '../../src/voice/say';
import { VoiceBoundary, VoiceContext } from '../../src/voice/context';
import type { ProblemInstance } from '../../src/learning/round';
import type { LearnProblem } from '../../src/modes/learn/learn';
import type { MoneyKey } from '../../src/money/money';
import { LearnView } from '../../src/modes/learn/LearnView';
import { IntroCard } from '../../src/round/IntroCard';
import { LEVEL_MONEY } from '../../src/money/money';
import { TrophyShelf } from '../../src/trophies/TrophyShelf';
import { createMoneyRepeat } from './moneyRepeat';
import { PairingApp } from './PairingApp';
import { repeatPresentation, RepeatDestination } from './repeatPresentation';

const app = createMoneyRepeat(browserStorage);
const voice = createVoiceScope();
const Destination = ({ onClose }: { onClose(): void }) => <RepeatDestination store={app.store} buy={app.buy} onClose={onClose} />;
function Problem({ current }: { current: ProblemInstance<LearnProblem, MoneyKey> }) {
  return <VoiceBoundary signal={current.signal}><LearnView problem={current.problem} actions={current.actions} signal={current.signal} /></VoiceBoundary>;
}
function Introduction({ signal, acknowledge }: { signal: AbortSignal; acknowledge(): void }) {
  return <IntroCard money={LEVEL_MONEY[app.store.state.value.learning.modes.learn.level]} signal={signal} onGo={acknowledge} />;
}
void mountApp(() => <VoiceContext.Provider value={voice}>
  <PairingApp title="Money repeat fixture" balance={app.store.state.value.currency.balance}
    reward={repeatPresentation} Destination={Destination} begin={app.begin} Problem={Problem} Introduction={Introduction} completion={app.completion.value}
    trophies={<TrophyShelf earned={app.store.state.value.trophies.earned} onClose={() => {}} />} />
</VoiceContext.Provider>, app.store.load);
