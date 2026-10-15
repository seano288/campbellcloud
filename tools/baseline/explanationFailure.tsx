import { render } from 'preact';
import { screenVoice } from '../../src/app/nav';
import { loadGame } from '../../src/game/store';
import { RoundScreen } from '../../src/round/RoundScreen';
import { startRound } from '../../src/round/round';
import { VoiceContext } from '../../src/voice/context';

const params = new URL(location.href).searchParams;
const mode = params.get('mode') === 'count' ? 'count' : 'pay';
const failure = params.get('failure') === 'throw' ? 'throw' : 'reject';
const explain = (): Promise<void> => {
  document.getElementById('explanation-failure')!.textContent = failure;
  if (failure === 'throw') throw new Error('Explanation failed');
  return Promise.reject(new Error('Explanation failed'));
};

void loadGame().then(() => {
  startRound(mode, { count: explain, pay: explain });
  render(<VoiceContext.Provider value={screenVoice.value}><RoundScreen /></VoiceContext.Provider>, document.getElementById('fixture')!);
});
