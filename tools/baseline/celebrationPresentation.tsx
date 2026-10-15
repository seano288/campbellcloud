import '../../src/app/selectedVoice';
import { render } from 'preact';
import { useState } from 'preact/hooks';
import { EndOverlay } from '../../src/app/EndOverlay';
import { createPractice } from '../../src/app/practice';
import { moneySave } from '../../src/app/save';
import { hasAffordable } from '../../src/garage/economy';
import type { RoundEvent } from '../../src/round/round';
import { freshSave } from '../../src/save/migrate';
import { createStore } from '../../src/save/store';
import { VoiceContext } from '../../src/voice/context';
import { createVoiceScope, speaking } from '../../src/voice/say';

const seed = freshSave();
seed.body = 'pickup';
seed.modes.learn.window = Array.from({ length: 9 }, () => 'clean');
if (new URLSearchParams(location.search).has('star')) seed.modes.learn.level = 3;
const store = createStore({
  key: 'celebration-fixture', adapter: moneySave,
  backing: { read: () => JSON.stringify(seed), write() {} },
});
const practice = createPractice(store, { today: () => '2026-10-15' }), voice = createVoiceScope(), announcement = createVoiceScope(voice.signal);

void store.load().then(() => {
  const started = practice.start('learn');
  if (started.kind !== 'accepted') throw new Error('Expected fixture Round');
  const results = [1, 2, 3, 4, 5].map(index => ({ index, outcome: 'clean', misses: 0, helped: false, replay: false } as const));
  const events: RoundEvent[] = [];
  for (const fact of results) {
    const solved = practice.solve(started.roundId, fact);
    if (solved.kind === 'accepted') events.push(...solved.changes);
  }
  const done = practice.terminal({ roundId: started.roundId, status: 'completed', results });
  if (done.kind !== 'accepted') throw new Error('Expected committed fixture completion');
  const result = { ...done, events: [...done.trophies.map(step => ({ kind: 'trophy', step }) as const), ...events] };
  const before = JSON.stringify(moneySave.encode(store.state.peek()));

  function Fixture() {
    const [version, setVersion] = useState(0), [show, setShow] = useState(true), [destination, setDestination] = useState('');
    const state = store.state.value;
    return (
      <VoiceContext.Provider value={voice}>
        <output id="before-state">{before}</output>
        <output id="saved-state">{JSON.stringify(moneySave.encode(state))}</output>
        <output id="destination">{destination}</output>
        <output id="replacement-light">{speaking.value}</output>
        <button onClick={() => { void announcement.say({ parts: ['You can build something new!'], light: 'replacement' }); }}>Speak replacement</button>
        <button onClick={() => setVersion(value => value + 1)}>Replace show</button>
        <button onClick={() => setShow(value => !value)}>Toggle show</button>
        {show && <EndOverlay key={version} result={result} hasAffordable={hasAffordable(state.garage, state.currency.balance)} color="#e63946"
          onGarage={() => setDestination('garage')} onAgain={() => setDestination('again')} onHome={() => setDestination('home')} />}
      </VoiceContext.Provider>
    );
  }
  render(<Fixture />, document.getElementById('fixture')!);
});
