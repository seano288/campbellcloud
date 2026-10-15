import { unlockAudio } from '../audio/context';
import { GarageScreen } from '../garage/GarageScreen';
import { IconDefs } from '../garage/icons';
import { player } from '../game/store';
import { Toast } from '../ui/toast';
import { BoltPile } from '../ui/bits';
import { TrophyShelf } from '../trophies/TrophyShelf';
import { useVoice, VoiceContext } from '../voice/context';
import type { VoiceScope } from '../voice/say';
import { Home } from './Home';
import { createGaragePresentation } from './garagePresentation';
import { garageCues } from './garageEconomy';
import { MoneyRound } from './MoneyRound';
import { screen, screenVoice } from './nav';

const reward = createGaragePresentation(player, { context: state => state.learning.modes.pay.level });

function Shelf({ onClose }: { onClose(): void }) {
  return <TrophyShelf earned={player.state.value.trophies.earned} onClose={onClose} />;
}

function start(voice: VoiceScope) {
  if (!voice.active) return;
  unlockAudio(); // sound needs this tap on iPad Safari
  screen.value = reward.setup ? 'body' : 'home'; // first launch only: choose a Body
  void screenVoice.value.say("Let's go!");
}

export function App() {
  const setup = reward.setup;
  const balance = player.state.value.currency.balance;
  const goal = reward.Goal && <reward.Goal balance={balance} />;
  const status = <>{goal}<BoltPile count={balance} /></>;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <StartScreen />}
      {screen.value === 'home' && <Home reward={reward} status={status} />}
      {screen.value === 'body' && setup && <setup.View signal={screenVoice.value.signal} onDone={() => { screen.value = 'home'; }} />}
      {screen.value === 'round' && <MoneyRound status={status} hasAffordable={garageCues.hasAffordable(player.state.value.garage, balance)} />}
      {screen.value === 'garage' && <GarageScreen goal={goal} Shelf={Shelf} />}
      <IconDefs />
      <Toast />
    </VoiceContext.Provider>
  );
}

function StartScreen() {
  const voice = useVoice();
  return (
    <div class="start">
      <h1>Monster Truck<br />Money</h1>
      <button class="big-btn go start-btn" aria-label="Start" onClick={() => start(voice)}>
        <span class="e">▶</span>
      </button>
    </div>
  );
}
