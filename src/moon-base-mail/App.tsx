// Moon Base Mail: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Moon Base, the Landing and a
// walk round the base.
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { BaseSkyline } from './art/bits';
import { BaseScreen } from './base/BaseScreen';
import { CUR } from './branding';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { LandingScreen } from './landing/LandingScreen';
import { goId, PLACE_KEY, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';
import { WalkScreen } from './walk/WalkScreen';

export function App() {
  const status = <CurrencyPile kind={CUR} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'base' && <BaseScreen />}
      {screen.value === 'landing' && <LandingScreen key={goId.value} />}
      {screen.value === 'walk' && <WalkScreen key={goId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start mb-start">
      <HoldForProgress game="moon-base-mail" keys={[SAVE_KEY, PLACE_KEY]}><h1>Moon Base<br />Mail</h1></HoldForProgress>
      <div class="start-art"><BaseSkyline b={player.state.value.base} /></div>
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
