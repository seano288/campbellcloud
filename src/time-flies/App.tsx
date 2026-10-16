// Time Flies: tap to start (which unlocks sound on the iPad), pick a first plane on first launch, then Home, Rounds and
// the Hangar.
import { useState } from 'preact/hooks';
import { unlockAudio } from '../audio/context';
import { BoltPile } from '../ui/bits';
import { player } from './game';
import { GoalBar } from './hangar/GoalBar';
import { hasAffordable } from './hangar/hangar';
import { HangarScreen } from './hangar/HangarScreen';
import { Home } from './Home';
import { JetPicker } from './JetPicker';
import { screen, screenVoice } from './nav';
import { RoundView } from './RoundView';
import { TrophyShelf } from './TrophyShelf';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const [shelf, setShelf] = useState(false);
  const s = player.state.value, balance = s.currency.balance;
  const status = <><GoalBar /><BoltPile count={balance} /></>;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'jet' && <JetPicker onDone={() => { screen.value = 'home'; }} />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} hasAffordable={hasAffordable(s.hangar, balance)} />}
      {screen.value === 'hangar' && <HangarScreen goal={<GoalBar />} onShelf={() => setShelf(true)} />}
      {shelf && <TrophyShelf onClose={() => setShelf(false)} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start">
      <h1>Time<br />Flies</h1>
      <div class="start-art">🕒✈️</div>
      <button class="big-btn go start-btn" aria-label="Start" onClick={() => {
        if (!voice.active) return;
        unlockAudio(); // sound needs this tap on iPad Safari
        screen.value = player.state.peek().hangar.jet === null ? 'jet' : 'home';
        void screenVoice.value.say("Let's go!");
      }}><span class="e">▶</span></button>
    </div>
  );
}
