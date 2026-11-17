// Turbo Tally: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Garage, the Race and the Cups.
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { CarView } from './art/Art';
import { TALLY_CURRENCY } from './branding';
import { CupsScreen } from './cups/CupsScreen';
import { GarageScreen } from './garage/GarageScreen';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { PLACE_KEY, raceId, screen, screenVoice } from './nav';
import { RaceScreen } from './race/RaceScreen';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={TALLY_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'garage' && <GarageScreen />}
      {screen.value === 'cups' && <CupsScreen />}
      {screen.value === 'race' && <RaceScreen key={raceId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start tt-start">
      <HoldForProgress game="turbo-tally" keys={[SAVE_KEY, PLACE_KEY]}><h1>Turbo<br />Tally</h1></HoldForProgress>
      <div class="start-art"><CarView car={player.state.value.garage.car} live /></div>
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
