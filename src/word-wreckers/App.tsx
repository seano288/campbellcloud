// Word Wreckers: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Yard (his machines), a Job
// (knock an old building down, then put a new one up with the crane) and the Town (where everything he builds stands, and he drives).
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { MachineView } from './art/Pics';
import { WRECKERS_CURRENCY } from './branding';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { JobScreen } from './job/JobScreen';
import { jobId, PLACE_KEY, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { TownScreen } from './town/TownScreen';
import { Toast, useVoice, VoiceContext } from './voice';
import { YardScreen } from './yard/YardScreen';

export function App() {
  const status = <CurrencyPile kind={WRECKERS_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'yard' && <YardScreen />}
      {screen.value === 'town' && <TownScreen />}
      {screen.value === 'job' && <JobScreen key={jobId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice(), yard = player.state.value.yard;
  return (
    <div class="start ww-start">
      <HoldForProgress game="word-wreckers" keys={[SAVE_KEY, PLACE_KEY]}><h1>Word<br />Wreckers</h1></HoldForProgress>
      <div class="start-art"><MachineView yard={yard} id={yard.machine} label="Your machine" /></div>
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
