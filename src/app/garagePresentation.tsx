import { useLayoutEffect, useMemo } from 'preact/hooks';
import { BodyPicker } from '../garage/BodyPicker';
import { truckColor } from '../garage/BodyArt';
import { GoalBar } from '../garage/GoalBar';
import type { GaragePricingContext } from '../garage/economy';
import type { RewardPresentation } from '../rewards/presentation';
import type { createStore } from '../save/store';
import { TruckArt } from '../ui/bits';
import { VoiceBoundary, useVoice } from '../voice/context';
import type { MoneyState } from './save';
import { createGarageSetup } from './setup';

export function createGaragePresentation(
  store: Pick<ReturnType<typeof createStore<MoneyState>>, 'state' | 'commit'>,
  { context }: { context(state: MoneyState): GaragePricingContext },
): RewardPresentation {
  const setup = createGarageSetup(store);
  function Setup({ onDone, signal }: { onDone(): void; signal: AbortSignal }) {
    const active = useMemo(() => setup.open(signal, onDone), [signal]);
    useLayoutEffect(() => active.close, [active]);
    return <VoiceBoundary key={active.id} signal={active.signal}><BodyPicker onConfirm={active.confirm} /></VoiceBoundary>;
  }
  return {
    Entry({ onOpen }) {
      const voice = useVoice(), state = store.state.value.garage;
      const fit = state.fitted[state.body ?? 'pickup'];
      return (
        <button class="tile t-garage" aria-label="Garage" onClick={() => { if (voice.active) onOpen(); }}>
          <TruckArt color={truckColor(fit)} />
          <span class="nm">🔧 Garage</span>
        </button>
      );
    },
    get setup() { return store.state.value.garage.body === null ? { View: Setup } : null; },
    Goal({ balance }) {
      const state = store.state.value;
      return <GoalBar state={state.garage} balance={balance} context={context(state)} />;
    },
  };
}
