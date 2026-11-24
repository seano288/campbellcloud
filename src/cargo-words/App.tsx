// Cargo Words: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Port, the Crane, the Sea Chart and
// "Watch it run".
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { CUR } from './branding';
import { CraneScreen } from './crane/CraneScreen';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { goId, PLACE_KEY, screen, screenVoice } from './nav';
import { ChartScreen } from './port/ChartScreen';
import { PortScreen } from './port/PortScreen';
import { PortView } from './port/PortView';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';
import { WatchScreen } from './port/WatchScreen';

export function App() {
  const status = <CurrencyPile kind={CUR} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'port' && <PortScreen />}
      {screen.value === 'chart' && <ChartScreen />}
      {screen.value === 'crane' && <CraneScreen key={goId.value} />}
      {screen.value === 'watch' && <WatchScreen key={goId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start cw-start">
      <HoldForProgress game="cargo-words" keys={[SAVE_KEY, PLACE_KEY]}><h1>Cargo<br />Words</h1></HoldForProgress>
      <div class="start-art"><PortView p={player.state.value.port} class="mini" /></div>
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
