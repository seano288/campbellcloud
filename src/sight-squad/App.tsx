// Sight Squad: tap to start (which unlocks sound on the iPad), pick the army's colour on first launch, then Home, Rounds
// and the Camp.
import { useState } from 'preact/hooks';
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { SQUAD_CURRENCY } from './branding';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { hasAffordable } from './camp/camp';
import { CampScreen } from './camp/CampScreen';
import { GoalBar } from './camp/GoalBar';
import { UnitArt } from './camp/UnitArt';
import { ColourPicker } from './ColourPicker';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { PLACE_KEY, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { TrophyShelf } from './TrophyShelf';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const [shelf, setShelf] = useState(false);
  const s = player.state.value, balance = s.currency.balance;
  const status = <><GoalBar /><CurrencyPile kind={SQUAD_CURRENCY} count={balance} /></>;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'colour' && <ColourPicker onDone={() => { screen.value = 'home'; }} />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} hasAffordable={hasAffordable(s.camp, balance)} />}
      {screen.value === 'camp' && <CampScreen goal={<GoalBar />} onShelf={() => setShelf(true)} />}
      {shelf && <TrophyShelf onClose={() => setShelf(false)} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start">
      <HoldForProgress game="sight-squad" keys={[SAVE_KEY, PLACE_KEY]}><h1>Sight<br />Squad</h1></HoldForProgress>
      <div class="start-art">{['#4f7a2a', '#c8a46a', '#8a9097'].map(c => <UnitArt key={c} unit="rifleman" color={c} />)}</div>
      <button class="big-btn go start-btn" aria-label="Start" onClick={() => {
        if (!voice.active) return;
        unlockAudio(); // sound needs this tap on iPad Safari
        if (player.state.peek().camp.colour === null) screen.value = 'colour';
        else comeBack(); // back where he was before the page reloaded
        void screenVoice.value.say("Let's go!");
      }}><span class="e">▶</span></button>
      <BuildLabel />
    </div>
  );
}
