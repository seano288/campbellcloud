// Sky Writer: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Airfield (build his stunt plane),
// a Show (fly it through rings, then draw in smoke and keep it as a postcard) and the Wall (his postcards, planes and patches).
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { AirfieldScreen } from './airfield/AirfieldScreen';
import { PlanePic } from './art/PlanePic';
import { SKY_CURRENCY } from './branding';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { flying, PLACE_KEY, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { ShowScreen } from './show/ShowScreen';
import { Toast, useVoice, VoiceContext } from './voice';
import { WallScreen } from './wall/WallScreen';

export function App() {
  const status = <CurrencyPile kind={SKY_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'airfield' && <AirfieldScreen />}
      {screen.value === 'wall' && <WallScreen />}
      {screen.value === 'show' && flying.value && <ShowScreen key={flying.value.id} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start sw-start">
      <HoldForProgress game="sky-writer" keys={[SAVE_KEY, PLACE_KEY]}><h1>Sky<br />Writer</h1></HoldForProgress>
      <div class="start-art"><PlanePic a={player.state.value.airfield} /></div>
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
