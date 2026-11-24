// Carrier Deck: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Carrier, the Mission, the sea
// chart (the Voyage, his patches and medals) and "Watch the deck".
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { DECK_CURRENCY } from './branding';
import { ChartScreen } from './ship/ChartScreen';
import { CarrierView, ShipScreen } from './ship/ShipScreen';
import { MissionScreen } from './mission/MissionScreen';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { missionId, PLACE_KEY, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';
import { WatchScreen } from './watch/WatchScreen';

export function App() {
  const status = <CurrencyPile kind={DECK_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'ship' && <ShipScreen />}
      {screen.value === 'chart' && <ChartScreen />}
      {screen.value === 'mission' && <MissionScreen key={missionId.value} />}
      {screen.value === 'watch' && <WatchScreen key={missionId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start cd-start">
      <HoldForProgress game="carrier-deck" keys={[SAVE_KEY, PLACE_KEY]}><h1>Carrier<br />Deck</h1></HoldForProgress>
      <div class="start-art"><CarrierView a={player.state.value.ship} class="mini" /></div>
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
