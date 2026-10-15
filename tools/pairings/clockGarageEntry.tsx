import './clockGarageVoice';
import { mountApp } from '../../src/main';
import { browserStorage } from '../../src/save/browser';
import { createGaragePresentation } from '../../src/app/garagePresentation';
import { createVoiceScope } from '../../src/voice/say';
import { VoiceContext } from '../../src/voice/context';
import { createClockGarage } from './clockGarage';
import { ClockView } from './ClockView';
import { PairingApp } from './PairingApp';
import { garageDestination } from './garageDestination';

const app = createClockGarage(browserStorage);
const reward = createGaragePresentation(app.store, { context: () => 2 });
const Destination = garageDestination(app.store, app.buy, app.checkout);
const voice = createVoiceScope();
void mountApp(() => <VoiceContext.Provider value={voice}>
  <PairingApp title="Clock Garage fixture" balance={app.store.state.value.currency.balance}
    reward={reward} Destination={Destination} begin={app.begin} Problem={ClockView} completion={app.completion.value}
    trophies={<output aria-label="Trophies">{Object.keys(app.store.state.value.trophies.earned).join(', ')}</output>} />
</VoiceContext.Provider>, app.store.load);
