import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import '@fontsource/bungee/latin-400.css';
import './purrdoku.css';
import { mountApp } from '../main';
import { App } from './App';
import { game, start } from './game';

start();
void mountApp(App, async () => {}, () => game.peek()?.status !== 'playing');
