// Big Air: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Arena, the Jump and its tape, and
// "Watch it".
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { ArenaScreen } from './arena/ArenaScreen';
import { TruckPic } from './art/TruckPic';
import { CUR } from './branding';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { JumpScreen } from './jump/JumpScreen';
import { goId, PLACE_KEY, screen, screenVoice } from './nav';
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
      {screen.value === 'arena' && <ArenaScreen />}
      {screen.value === 'jump' && <JumpScreen key={goId.value} />}
      {screen.value === 'watch' && <JumpScreen key={goId.value} replay />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start ba-start">
      <HoldForProgress game="big-air" keys={[SAVE_KEY, PLACE_KEY]}><h1>Big<br />Air</h1></HoldForProgress>
      <div class="start-art ba-start-art" aria-hidden="true"><TruckPic look={player.state.value.arena.truck} size={260} pitch={16} /><span class="start-ruler" /></div>
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
