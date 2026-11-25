// Dragon Roost: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Roost (his eggs, dragons and
// everything he has bought), the Flight (he flies his dragon), and Visit the roost (every dragon he has, wandering).
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { DragonCanvas } from './art/DragonCanvas';
import { CUR } from './branding';
import { FlightScreen } from './flight/FlightScreen';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { flightId, PLACE_KEY, screen, screenVoice } from './nav';
import { lookOf, riding } from './roost/roost';
import { RoostScreen } from './roost/RoostScreen';
import { VisitScreen } from './roost/VisitScreen';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={CUR} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'roost' && <RoostScreen />}
      {screen.value === 'flight' && <FlightScreen key={flightId.value} />}
      {screen.value === 'visit' && <VisitScreen />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice(), a = player.state.value.roost;
  return (
    <div class="start dr-start">
      <HoldForProgress game="dragon-roost" keys={[SAVE_KEY, PLACE_KEY]}><h1>Dragon<br />Roost</h1></HoldForProgress>
      <div class="start-art dr-start-art" aria-hidden="true"><DragonCanvas look={lookOf(riding(a))} opts={{ act: 'fly', flap: 2.4 }} /></div>
      <button class="big-btn go start-btn" aria-label="Start" onClick={() => {
        if (!voice.active) return;
        unlockAudio(); // sound needs this tap on iPad Safari
        comeBack(); // back where he was before the page reloaded
        if (screen.peek() !== 'round') void screenVoice.value.say("Let's go!");
      }}><span class="e">▶</span></button>
      <BuildLabel />
    </div>
  );
}
