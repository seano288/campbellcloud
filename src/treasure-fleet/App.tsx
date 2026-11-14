// Treasure Fleet: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Shipyard (with the sea
// chart), the Voyage (sailing, then digging on the island) and the Hoard.
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { ShipView } from './art/ShipView';
import { FLEET_CURRENCY } from './branding';
import { Hoard } from './fleet/Hoard';
import { Shipyard } from './fleet/Shipyard';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { PLACE_KEY, screen, screenVoice, voyageId } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { VoyageScreen } from './voyage/VoyageScreen';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={FLEET_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'shipyard' && <Shipyard />}
      {screen.value === 'hoard' && <Hoard />}
      {screen.value === 'voyage' && <VoyageScreen key={voyageId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start tf-start">
      <HoldForProgress game="treasure-fleet" keys={[SAVE_KEY, PLACE_KEY]}><h1>Treasure<br />Fleet</h1></HoldForProgress>
      <div class="start-art"><ShipView ship={player.state.value.fleet.ship} label="Your ship" /></div>
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
