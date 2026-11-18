// Food Truck: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Truck (buy trucks and parts), the
// Service (cook and serve with his hands) and the Sticker Book (the Regulars he has met, the Spots, his trucks).
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { TruckPic } from './art/TruckPic';
import { BookScreen } from './book/BookScreen';
import { TRUCK_CURRENCY } from './branding';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { PLACE_KEY, screen, screenVoice, serviceId } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { ServiceScreen } from './service/ServiceScreen';
import { TruckScreen } from './truck/TruckScreen';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={TRUCK_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'truck' && <TruckScreen />}
      {screen.value === 'book' && <BookScreen />}
      {screen.value === 'service' && <ServiceScreen key={serviceId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start ft-start">
      <HoldForProgress game="food-truck" keys={[SAVE_KEY, PLACE_KEY]}><h1>Food<br />Truck</h1></HoldForProgress>
      <div class="start-art"><TruckPic look={player.state.value.truck} bounce /></div>
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
