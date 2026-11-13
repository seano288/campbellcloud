// Math Bots: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Workshop, the League and the fight.
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { BotView } from './bot/BotView';
import { MATH_CURRENCY } from './branding';
import { FightScreen } from './fight/FightScreen';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { LeagueScreen } from './league/LeagueScreen';
import { PLACE_KEY, screen, screenVoice } from './nav';
import { RewardScreen } from './RewardScreen';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const balance = player.state.value.currency.balance;
  const status = <CurrencyPile kind={MATH_CURRENCY} count={balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'reward' && <RewardScreen />}
      {screen.value === 'league' && <LeagueScreen />}
      {screen.value === 'fight' && <FightScreen />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start">
      <HoldForProgress game="math-bots" keys={[SAVE_KEY, PLACE_KEY]}><h1>Math<br />Bots</h1></HoldForProgress>
      <div class="start-art"><BotView build={player.state.value.workshop.build} live turn={-.63} /></div>
      <button class="big-btn go start-btn" aria-label="Start" onClick={() => {
        if (!voice.active) return;
        unlockAudio(); // sound needs this tap on iPad Safari
        comeBack(); // back where he was before the page reloaded
        void screenVoice.value.say("Let's go!");
      }}><span class="e">▶</span></button>
      <BuildLabel />
    </div>
  );
}
