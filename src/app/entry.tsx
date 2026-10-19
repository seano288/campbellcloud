import './selectedVoice';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import '../styles.css';
import { mountApp } from '../main';
import { MODES } from '../modes/modes';
import { TrophyShelf } from '../trophies/TrophyShelf';
import { App } from './App';
import { moneyBranding } from './branding';
import { createGaragePresentation } from './garagePresentation';
import { pricingAt } from '../garage/economy';
import { moneyApp } from './money';
import { place, screen } from './nav';

const reward = createGaragePresentation(moneyApp.store, { context: state => pricingAt(state.learning.modes.pay.level) });

function Shelf({ onClose }: { onClose(): void }) {
  return <TrophyShelf earned={moneyApp.store.state.value.trophies.earned} onClose={onClose} />;
}

void mountApp(() => <App branding={moneyBranding} reward={reward} modes={MODES} Shelf={Shelf} />, () => Promise.all([moneyApp.load(), place.load()]), () => screen.peek() === 'start');
