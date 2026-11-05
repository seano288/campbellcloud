import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import '@fontsource/bungee/latin-400.css';
import '../styles.css';
import '../time-flies/time-flies.css';
import './math-bots.css';
import { keepSoundAwake } from '../audio/context';
import { mountApp } from '../main';
import { App } from './App';
import { player } from './game';
import { place, screen } from './nav';

keepSoundAwake();
void mountApp(App, () => Promise.all([player.load(), place.load()]), () => screen.peek() === 'start');
