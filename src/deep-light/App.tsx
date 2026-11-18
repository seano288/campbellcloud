// Deep Light: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Dock (his submarine and its
// parts, and the map of where to dive), the Dive (he steers through the dark sea, photographing animals by holding his light on them)
// and the Logbook (every animal he has photographed, its name and one true fact said aloud).
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { AnimalPic, SubArt } from './art/Pics';
import { DEEP_CURRENCY } from './branding';
import { DiveScreen } from './dive/DiveScreen';
import { DockScreen } from './dock/DockScreen';
import { LogbookScreen } from './dock/LogbookScreen';
import { lookOf } from './dock/dock';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { diveId, PLACE_KEY, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={DEEP_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'dock' && <DockScreen />}
      {screen.value === 'logbook' && <LogbookScreen />}
      {screen.value === 'dive' && <DiveScreen key={diveId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start dl-start">
      <HoldForProgress game="deep-light" keys={[SAVE_KEY, PLACE_KEY]}><h1>Deep<br />Light</h1></HoldForProgress>
      <div class="start-art"><span class="start-beam" aria-hidden="true" /><AnimalPic id="lanternfish" class="start-fish" /><SubArt look={lookOf(player.state.value.dock)} label="Your submarine" /></div>
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
