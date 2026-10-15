import { mountApp } from '../../src/main';
import { browserStorage } from '../../src/save/browser';
import { createClockRepeat } from './clockRepeat';
import { ClockView } from './ClockView';
import { PairingApp } from './PairingApp';
import { repeatPresentation, RepeatDestination } from './repeatPresentation';

const app = createClockRepeat(browserStorage);
const Destination = ({ onClose }: { onClose(): void }) => <RepeatDestination store={app.store} buy={app.buy} onClose={onClose} />;
void mountApp(() => <PairingApp title="Clock repeat fixture" balance={app.store.state.value.currency.balance}
  reward={repeatPresentation} Destination={Destination} begin={app.begin} Problem={ClockView} completion={app.completion.value}
  trophies={<output aria-label="Trophies">{Object.keys(app.store.state.value.trophies.earned).join(', ')}</output>} />, app.store.load);
