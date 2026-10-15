import { useState } from 'preact/hooks';
import type { createLegendaryCheckout, LegendaryCheckout } from '../../src/app/checkout';
import type { createGaragePurchases } from '../../src/app/purchases';
import { Checkout } from '../../src/garage/Checkout';
import { BodyArt } from '../../src/garage/BodyArt';
import { fitMod, type GarageState } from '../../src/garage/state';
import type { createStore } from '../../src/save/store';

export function garageDestination<State extends { garage: GarageState; currency: { balance: number } }>(
  store: ReturnType<typeof createStore<State>>,
  buy: ReturnType<typeof createGaragePurchases<State>>,
  checkout: ReturnType<typeof createLegendaryCheckout<State>>,
) {
  return function Destination({ onClose }: { onClose(): void }) {
    const [active, setActive] = useState<LegendaryCheckout<State> | null>(null);
    const garage = store.state.value.garage;
    return (
      <section>
        <BodyArt body={garage.body ?? 'pickup'} />
        <p>Owned: {garage.unlocked.join(', ')}</p>
        <button onClick={() => buy('tires:1')}>Buy Tires</button>
        <button onClick={() => store.commit(state => ({ ...state, garage: fitMod(state.garage, 'tires', 0) }))}>Free fit</button>
        <button onClick={() => {
          const result = checkout.open('tires:4');
          if (result.kind === 'ready') setActive(result.checkout);
        }}>Legendary Tires</button>
        <button onClick={onClose}>Home</button>
        {active && <Checkout checkout={active} onClose={() => setActive(null)} />}
      </section>
    );
  };
}
