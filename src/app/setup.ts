import { isStarter, type BodyId } from '../garage/catalog';
import { chooseBody, type GarageState } from '../garage/state';
import type { createStore } from '../save/store';

export function createGarageSetup<State extends { garage: GarageState }>(store: Pick<ReturnType<typeof createStore<State>>, 'commit'>) {
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
