import type { RewardPresentation } from '../../src/rewards/presentation';
import type { createStore, Commit } from '../../src/save/store';

export const repeatPresentation: RewardPresentation = {
  Entry: ({ onOpen }) => <button onClick={onOpen}>Repeat reward</button>,
  setup: null,
};
export function RepeatDestination<State extends { reward: { purchases: number } }>({ store, buy, onClose }: {
  store: Pick<ReturnType<typeof createStore<State>>, 'state'>;
  buy(item: 'buy'): Commit<State>;
  onClose(): void;
}) {
  return (
    <section>
      <p>Purchases: {store.state.value.reward.purchases}</p>
      <button onClick={() => buy('buy')}>Buy again</button>
      <button onClick={onClose}>Home</button>
    </section>
  );
}
