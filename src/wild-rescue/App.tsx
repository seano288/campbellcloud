// Wild Rescue: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Garage (his rescue truck), the
// Rescue (the call, the drive and the hands-on job) and the Park (where he carries each animal home).
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { TruckView } from './art/Pics';
import { RESCUE_CURRENCY } from './branding';
import { player, SAVE_KEY } from './game';
import { Garage } from './park/Garage';
import { Park } from './park/Park';
import { Home } from './Home';
import { PLACE_KEY, rescueId, screen, screenVoice } from './nav';
import { RescueScreen } from './rescue/RescueScreen';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={RESCUE_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'garage' && <Garage />}
      {screen.value === 'park' && <Park />}
      {screen.value === 'rescue' && <RescueScreen key={rescueId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start wr-start">
      <HoldForProgress game="wild-rescue" keys={[SAVE_KEY, PLACE_KEY]}><h1>Wild<br />Rescue</h1></HoldForProgress>
      <div class="start-art"><TruckView truck={player.state.value.rescue.truck} label="Your rescue truck" /></div>
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
