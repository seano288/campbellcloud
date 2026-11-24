// Globe Hopper: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Rocket Base, the Launch and its
// orbit, and "Watch the launch".
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { rocketPic } from './art/rocket';
import { flyingKind, lookOf } from './base/base';
import { BaseScreen } from './base/BaseScreen';
import { CUR } from './branding';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { LaunchScreen } from './launch/LaunchScreen';
import { goId, PLACE_KEY, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={CUR} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'base' && <BaseScreen />}
      {screen.value === 'launch' && <LaunchScreen key={goId.value} />}
      {screen.value === 'watch' && <LaunchScreen key={goId.value} replay />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice(), b = player.state.value.base;
  return (
    <div class="start gh-start">
      <HoldForProgress game="globe-hopper" keys={[SAVE_KEY, PLACE_KEY]}><h1>Globe<br />Hopper</h1></HoldForProgress>
      <div class="start-art gh-start-art" aria-hidden="true"><span class="gh-play-globe"><i /></span><img src={rocketPic(lookOf(b, flyingKind(b)), 140)} alt="" /></div>
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
