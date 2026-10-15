import '../../src/app/selectedVoice';
import { render } from 'preact';
import { useState } from 'preact/hooks';
import { createPractice } from '../../src/app/practice';
import { createGaragePurchases } from '../../src/app/purchases';
import { EndOverlay } from '../../src/app/EndOverlay';
import { moneySave } from '../../src/app/save';
import { hasAffordable } from '../../src/garage/economy';
import { proposePurchase } from '../../src/garage/purchases';
import { freshSave } from '../../src/save/migrate';
import { createStore } from '../../src/save/store';
import { VoiceContext } from '../../src/voice/context';
import { createVoiceScope } from '../../src/voice/say';

const store = createStore({
  key: 'completion-fixture', adapter: moneySave,
  backing: {
    read: () => JSON.stringify({ ...freshSave(), body: 'pickup', bolts: 5, trophies: { perfect: '2026-09-01', 'streak:5': '2026-09-02' } }),
    write() {},
  },
});
const practice = createPractice(store), buy = createGaragePurchases(store, { proposePurchase });
const voice = createVoiceScope();

void store.load().then(() => {
  const started = practice.start('learn');
  if (started.kind !== 'accepted') throw new Error('Expected fixture Round');
  const results = [1, 2, 3, 4, 5].map(index => ({ index, outcome: 'clean', misses: 0, helped: false, replay: false } as const));
  for (const fact of results) practice.solve(started.roundId, fact);
  const done = practice.terminal({ roundId: started.roundId, status: 'completed', results });
  if (done.kind !== 'accepted') throw new Error('Expected fixture completion');
  buy('tires:1');
  const before = JSON.stringify(moneySave.encode(store.state.peek()));
  const result = { ...done, events: [] };

  function Fixture() {
    const [show, setShow] = useState(true), state = store.state.value;
    return (
      <VoiceContext.Provider value={voice}>
        <output id="before-state">{before}</output>
        <output id="saved-state">{JSON.stringify(moneySave.encode(state))}</output>
        <output id="newly-affordable">{String(result.canBuild)}</output>
        <button onClick={() => setShow(value => !value)}>Toggle show</button>
        <button onClick={() => buy('colour:orange')}>Buy Orange</button>
        <button onClick={() => buy('colour:yellow')}>Buy Yellow</button>
        {show && <EndOverlay result={result} hasAffordable={hasAffordable(state.garage, state.currency.balance)} color="#e63946"
          onGarage={() => {}} onAgain={() => {}} onHome={() => {}} />}
      </VoiceContext.Provider>
    );
  }
  render(<Fixture />, document.getElementById('fixture')!);
});
