// Skyline: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the City he builds and the Job he
// drives through it.
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { SKYLINE_CURRENCY } from './branding';
import { CityScreen } from './city/CityScreen';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { jobId, PLACE_KEY, screen, screenVoice } from './nav';
import { JobScreen } from './job/JobScreen';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { Toast, useVoice, VoiceContext } from './voice';
import { iconSvg } from './icon';

export function App() {
  const status = <CurrencyPile kind={SKYLINE_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'city' && <CityScreen />}
      {screen.value === 'job' && <JobScreen key={jobId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start sl-start">
      <HoldForProgress game="skyline" keys={[SAVE_KEY, PLACE_KEY]}><h1>Skyline</h1></HoldForProgress>
      <div class="start-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconSvg(1).replace('<svg ', '<svg class="start-icon" ') }} />
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
