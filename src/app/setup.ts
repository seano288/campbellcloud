import { isStarter, type BodyId } from '../garage/catalog';
import { chooseBody } from '../garage/state';
import type { createStore } from '../save/store';
import type { MoneyState } from './save';

export function createGarageSetup(store: Pick<ReturnType<typeof createStore<MoneyState>>, 'commit'>) {
  let active: AbortController | undefined;
  let sequence = 0;
  return {
    open(signal: AbortSignal, onDone: () => void) {
      active?.abort();
      const lifetime = new AbortController();
      active = lifetime;
      const close = () => lifetime.abort();
      signal.addEventListener('abort', close, { once: true });
      lifetime.signal.addEventListener('abort', () => signal.removeEventListener('abort', close), { once: true });
      if (signal.aborted) close();
      let confirmed = false;
      return {
        id: ++sequence,
        signal: lifetime.signal,
        close,
        confirm(body: BodyId) {
          const result = store.commit(state => {
            if (lifetime.signal.aborted || confirmed || state.garage.body !== null || !isStarter(body) || !state.garage.ownedBodies.includes(body)) return null;
            const garage = chooseBody(state.garage, body);
            confirmed = true;
            return { ...state, garage };
          });
          if (result.kind === 'accepted' && !lifetime.signal.aborted) {
            close();
            if (active === lifetime && !signal.aborted) onDone();
          }
          return result;
        },
      };
    },
  };
}
