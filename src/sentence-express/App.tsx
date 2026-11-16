// Sentence Express: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Shed (his engines and
// cars), his Layout (the table he lays track on and decorates), the Delivery (he drives his train on it) and Watch it go (his train
// runs round his Layout by itself).
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { TrainView } from './art/TrainView';
import { EXPRESS_CURRENCY } from './branding';
import { DeliveryScreen } from './delivery/DeliveryScreen';
import { ShowScreen } from './delivery/ShowScreen';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { LayoutScreen } from './layout/LayoutScreen';
import { deliveryId, PLACE_KEY, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Shed } from './shed/Shed';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={EXPRESS_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'shed' && <Shed />}
      {screen.value === 'layout' && <LayoutScreen />}
      {screen.value === 'delivery' && <DeliveryScreen key={deliveryId.value} />}
      {screen.value === 'show' && <ShowScreen />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start se-start">
      <HoldForProgress game="sentence-express" keys={[SAVE_KEY, PLACE_KEY]}><h1>Sentence<br />Express</h1></HoldForProgress>
      <div class="start-art"><TrainView train={player.state.value.trains} cars={2} label="Your train" /></div>
      <button class="big-btn go start-btn" aria-label="Start" onClick={() => {
        if (!voice.active) return;
        unlockAudio(); // sound needs this tap on iPad Safari
        comeBack(); // back where he was before the page reloaded
        // back in a Round, its question is said at once, and would cut this off
        if (screen.peek() !== 'round') void screenVoice.value.say("Let's go!");
      }}><span class="e">▶</span></button>
      <BuildLabel />
    </div>
  );
}
