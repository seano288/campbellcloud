import { unlockAudio } from '../audio/context';
import { BodyPicker } from '../garage/BodyPicker';
import { GarageScreen } from '../garage/GarageScreen';
import { IconDefs } from '../garage/icons';
import { game } from '../game/store';
import { RoundScreen } from '../round/RoundScreen';
import { Toast } from '../ui/toast';
import { useVoice, VoiceContext } from '../voice/context';
import type { VoiceScope } from '../voice/say';
import { Home } from './Home';
import { screen, screenVoice } from './nav';

function start(voice: VoiceScope) {
  if (!voice.active) return;
  unlockAudio(); // sound needs this tap on iPad Safari
  screen.value = game.value.body ? 'home' : 'body'; // first launch only: choose a Body
  void screenVoice.value.say("Let's go!");
}

export function App() {
  return (
    <VoiceContext.Provider value={screenVoice.value}>
      {screen.value === 'start' && <StartScreen />}
      {screen.value === 'home' && <Home />}
      {screen.value === 'body' && <BodyPicker />}
      {screen.value === 'round' && <RoundScreen />}
      {screen.value === 'garage' && <GarageScreen />}
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
