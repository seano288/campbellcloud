// Coaster Crew: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Coaster Yard (the builder, the shop
// and the park), the Ride, and "Watch it run".
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { CUR } from './branding';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { goId, PLACE_KEY, screen, screenVoice } from './nav';
import { coasterOf } from './park/yard';
import { CoasterThumb, RideScreen } from './ride/RideScreen';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';
import { YardScreen } from './yard/YardScreen';

export function App() {
  const status = <CurrencyPile kind={CUR} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'yard' && <YardScreen />}
      {screen.value === 'ride' && <RideScreen key={goId.value} />}
      {screen.value === 'watch' && <RideScreen key={goId.value} replay />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice(), y = player.state.value.yard;
  return (
    <div class="start cc-start">
      <HoldForProgress game="coaster-crew" keys={[SAVE_KEY, PLACE_KEY]}><h1>Coaster<br />Crew</h1></HoldForProgress>
      <div class="start-art cc-start-art" aria-hidden="true"><CoasterThumb pieces={coasterOf(y).pieces} style={y.style} weather="sunset" theme={y.theme} /></div>
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
