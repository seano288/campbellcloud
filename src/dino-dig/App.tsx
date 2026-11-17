// Dino Dig: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: a Dig (rub the dirt away, crack the
// rocks, drag the bones to the crate), the Museum (each dinosaur's skeleton, bone by bone; the living ones walking in the hall), the
// Alive run (play as a dinosaur he brought to life) and the Shop.
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { DinoPic } from './art/DinoPic';
import { DINO_CURRENCY } from './branding';
import { DigScreen } from './dig/DigScreen';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { MuseumScreen } from './museum/MuseumScreen';
import { digId, PLACE_KEY, running, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { RunScreen } from './run/RunScreen';
import { ShopScreen } from './shop/ShopScreen';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={DINO_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'museum' && <MuseumScreen />}
      {screen.value === 'shop' && <ShopScreen />}
      {screen.value === 'dig' && <DigScreen key={digId.value} />}
      {screen.value === 'run' && running.value && <RunScreen key={`${running.value.dino}:${running.value.waking}`} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start dd-start">
      <HoldForProgress game="dino-dig" keys={[SAVE_KEY, PLACE_KEY]}><h1>Dino<br />Dig</h1></HoldForProgress>
      <div class="start-art"><DinoPic m={player.state.value.museum} /></div>
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
