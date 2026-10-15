import '@fontsource/nunito/latin-800.css';
import './selected.css';
import { mountApp } from '../../src/main';
import { createPlayback } from '../../src/voice/playback';
import { recordedAudio } from '../../src/audio/recorded';
import { fixtureEntry } from './entry';

const voice = createPlayback({ ...fixtureEntry.voice, ...recordedAudio });
function Fixture() {
  return <button onClick={() => void voice.scope().say('Tick')}>Selected fixture</button>;
}
void mountApp(Fixture, async () => {});
