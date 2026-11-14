// Rover Code: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Space Base and the trip (launch,
// flight, and driving his rover on the planet).
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { RocketView } from './art/Art';
import { BaseScreen } from './base/BaseScreen';
import { ROVER_CURRENCY } from './branding';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { PLACE_KEY, screen, screenVoice, tripId } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { TripScreen } from './trip/TripScreen';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={ROVER_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'base' && <BaseScreen />}
      {screen.value === 'trip' && <TripScreen key={tripId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start rc-start">
      <HoldForProgress game="rover-code" keys={[SAVE_KEY, PLACE_KEY]}><h1>Rover<br />Code</h1></HoldForProgress>
      <div class="start-art"><RocketView rocket={player.state.value.base.rocket} live flame={.5} /></div>
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
