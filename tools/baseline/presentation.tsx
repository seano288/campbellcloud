import { render } from 'preact';
import { signal } from '@preact/signals';
import { useState } from 'preact/hooks';
import { createStore } from '../../src/save/store';
import { createGaragePresentation } from '../../src/app/garagePresentation';
import { moneySave } from '../../src/app/save';
import { VoiceContext } from '../../src/voice/context';
import { createMoneyVoice } from '../../src/voice/say';
import { CLIPS } from '../../src/voice/voice.gen';
import { ALL_MODS, BODY_IDS, BOUGHT_COLOURS, isLegendary } from '../../src/garage/catalog';
import { TrophyShelf } from '../../src/trophies/TrophyShelf';
import { freshSave } from '../../src/save/migrate';
import { moneyEntry } from '../../src/app/entrySelection';

const store = createStore({
  key: 'presentation-fixture', adapter: moneySave,
  backing: { read: () => JSON.stringify({ ...freshSave(), trophies: { 'learn:2': '2026-09-01', 'streak:5': '2026-09-02', 'streak:10': '2026-09-03' } }), write() {} },
});
const reward = createGaragePresentation(store, { context: state => state.learning.modes.pay.level });
const spoken = signal<string[]>([]);
const playback = createMoneyVoice({
  load: async file => file,
  play(file) {
    spoken.value = [...spoken.peek(), Object.entries(CLIPS).find(([, clip]) => clip === file)![0]];
    return { done: Promise.resolve(), stop() {} };
  },
}, moneyEntry.voice);
const lifetime = signal(playback.scope());

function Fixture() {
  const setup = reward.setup;
  const [shelf, setShelf] = useState(false);
  const voice = lifetime.value;
  return (
    <VoiceContext.Provider value={voice}>
      <button onClick={() => store.commit(state => ({ ...state, garage: { ...state.garage, body: null } }))}>Reset setup</button>
      <button onClick={() => { voice.cancel(); lifetime.value = playback.scope(); }}>Replace setup</button>
      <button onClick={() => store.commit(state => ({ ...state, garage: { ...state.garage, goal: 'colour:teal' } }))}>Choose Teal Goal</button>
      <button onClick={() => store.commit(state => ({
        ...state, garage: { ...state.garage, ownedBodies: [...BODY_IDS], unlocked: ALL_MODS.filter(m => !isLegendary(m)), colours: [], goal: null },
      }))}>Only Colours left</button>
      <button onClick={() => store.commit(state => ({ ...state, garage: { ...state.garage, colours: [...BOUGHT_COLOURS] } }))}>All Bolt items owned</button>
      <button onClick={() => store.commit(state => ({
        ...state, learning: { ...state.learning, modes: { ...state.learning.modes, pay: { ...state.learning.modes.pay, level: 3 } } },
      }))}>Use context 3</button>
      <button onClick={() => store.commit(state => ({ ...state, garage: { ...state.garage, unlocked: [...ALL_MODS] } }))}>Everything owned</button>
      <button onClick={() => setShelf(true)}>Show Trophies</button>
      <button onClick={() => store.commit(state => ({ ...state, trophies: { ...state.trophies, earned: { ...state.trophies.earned, 'streak:20': '2026-10-15' } } }))}>Upgrade streak</button>
      <output id="selected-body">{store.state.value.garage.body ?? 'none'}</output>
      <output id="spoken">{spoken.value.join('|')}</output>
      <output id="saved-state">{JSON.stringify(moneySave.encode(store.state.value))}</output>
      {setup ? <setup.View signal={voice.signal} onDone={() => {}} /> : <reward.Entry onOpen={() => {}} />}
      {reward.Goal && <reward.Goal balance={store.state.value.currency.balance} />}
      {shelf && <TrophyShelf earned={store.state.value.trophies.earned} onClose={() => setShelf(false)} />}
    </VoiceContext.Provider>
  );
}

void store.load().then(() => render(<Fixture />, document.getElementById('fixture')!));
