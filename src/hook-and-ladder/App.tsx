// Hook and Ladder: tap to start (which unlocks sound on the iPad), then Home, Rounds, and the reward: the Station (his fire engines
// and their parts), the Call (he drives out, sprays the fires and raises the ladder) and the Town (a building for each Call he
// answered, with a thank-you sign).
import { unlockAudio } from '../audio/context';
import { CurrencyPile } from '../ui/currency';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { TruckArt } from './art/TruckArt';
import { LADDER_CURRENCY } from './branding';
import { CallScreen } from './call/CallScreen';
import { player, SAVE_KEY } from './game';
import { Home } from './Home';
import { callId, PLACE_KEY, screen, screenVoice } from './nav';
import { comeBack } from './round';
import { RoundView } from './RoundView';
import { StationScreen } from './station/StationScreen';
import { TownScreen } from './station/TownScreen';
import { lookOf } from './station/station';
import { Toast, useVoice, VoiceContext } from './voice';

export function App() {
  const status = <CurrencyPile kind={LADDER_CURRENCY} count={player.state.value.currency.balance} />;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <Start />}
      {screen.value === 'home' && <Home status={status} />}
      {screen.value === 'round' && <RoundView status={status} />}
      {screen.value === 'station' && <StationScreen />}
      {screen.value === 'town' && <TownScreen />}
      {screen.value === 'call' && <CallScreen key={callId.value} />}
      <Toast />
    </VoiceContext.Provider>
  );
}

function Start() {
  const voice = useVoice();
  return (
    <div class="start hl-start">
      <HoldForProgress game="hook-and-ladder" keys={[SAVE_KEY, PLACE_KEY]}><h1>Hook and<br />Ladder</h1></HoldForProgress>
      <div class="start-art"><TruckArt look={lookOf(player.state.value.station)} label="Your fire engine" /></div>
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
