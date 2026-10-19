import { unlockAudio } from '../audio/context';
import type { ComponentType } from 'preact';
import { GarageScreen } from '../garage/GarageScreen';
import { IconDefs } from '../garage/icons';
import { player } from '../game/store';
import { Toast } from '../ui/toast';
import { BoltPile } from '../ui/bits';
import type { RewardPresentation } from '../rewards/presentation';
import type { MODES } from '../modes/modes';
import { useVoice, VoiceContext } from '../voice/context';
import type { VoiceScope } from '../voice/say';
import { Home } from './Home';
import { garageCues } from './garageEconomy';
import { MoneyRound } from './MoneyRound';
import { PLACE_KEY, screen, screenVoice } from './nav';
import { MONEY_SAVE_KEY } from './save';
import { HoldForProgress } from '../ui/MoveProgress';
import { BuildLabel } from '../ui/BuildLabel';
import { comeBack } from '../round/round';

function start(voice: VoiceScope, reward: RewardPresentation) {
  if (!voice.active) return;
  unlockAudio(); // sound needs this tap on iPad Safari
  if (reward.setup) screen.value = 'body'; // first launch only: choose a Body
  else comeBack(); // back where he was before the page reloaded
  void screenVoice.value.say("Let's go!");
}

export function App({ branding, reward, modes, Shelf }: {
  branding: { title: string; startTitle: readonly [string, string] };
  reward: RewardPresentation;
  modes: typeof MODES;
  Shelf: ComponentType<{ onClose(): void }>;
}) {
  const setup = reward.setup;
  const balance = player.state.value.currency.balance;
  const goal = reward.Goal && <reward.Goal balance={balance} />;
  const status = <>{goal}<BoltPile count={balance} /></>;
  return (
    <VoiceContext.Provider key={screen.value} value={screenVoice.value}>
      {screen.value === 'start' && <StartScreen title={branding.startTitle} reward={reward} />}
      {screen.value === 'home' && <Home reward={reward} status={status} modes={modes} title={branding.title} />}
      {screen.value === 'body' && setup && <setup.View signal={screenVoice.value.signal} onDone={() => { screen.value = 'home'; }} />}
      {screen.value === 'round' && <MoneyRound status={status} hasAffordable={garageCues.hasAffordable(player.state.value.garage, balance)} />}
      {screen.value === 'garage' && <GarageScreen goal={goal} Shelf={Shelf} />}
      <IconDefs />
      <Toast />
    </VoiceContext.Provider>
  );
}

function StartScreen({ title, reward }: { title: readonly [string, string]; reward: RewardPresentation }) {
  const voice = useVoice();
  return (
    <div class="start">
      <HoldForProgress game="monster-truck-money" keys={[MONEY_SAVE_KEY, PLACE_KEY]}><h1>{title[0]}<br />{title[1]}</h1></HoldForProgress>
      <button class="big-btn go start-btn" aria-label="Start" onClick={() => start(voice, reward)}>
        <span class="e">▶</span>
      </button>
      <BuildLabel />
    </div>
  );
}
