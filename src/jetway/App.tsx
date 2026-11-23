// Jetway: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Airport, the Flight, the Routes and
// "Watch it run".
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { AirportScreen, AirportView } from './airport/AirportScreen';
import { RoutesScreen } from './airport/RoutesScreen';
import { JET_CURRENCY } from './branding';
import { FlightScreen } from './flight/FlightScreen';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { flightId, PLACE_KEY, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';
import { WatchScreen } from './watch/WatchScreen';

export function App() {
  const status = <CurrencyPile kind={JET_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'airport' && <AirportScreen />}
      {screen.value === 'routes' && <RoutesScreen />}
      {screen.value === 'flight' && <FlightScreen key={flightId.value} />}
      {screen.value === 'watch' && <WatchScreen key={flightId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start jw-start">
      <HoldForProgress game="jetway" keys={[SAVE_KEY, PLACE_KEY]}><h1>Jet<br />way</h1></HoldForProgress>
      <div class="start-art"><AirportView a={player.state.value.airport} class="mini" /></div>
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
