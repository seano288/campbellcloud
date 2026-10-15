import { useLayoutEffect, useMemo, useState } from 'preact/hooks';
import type { ProblemInstance } from '../../src/learning/round';
import { createPlayback } from '../../src/voice/playback';
import { recordedAudio } from '../../src/audio/recorded';
import { clockVoice } from './clockVoice';
import type { ClockProblem } from '../../src/learning/nonMoney.fixture';

const playback = createPlayback({ ...clockVoice, ...recordedAudio });
export function ClockView({ current }: { current: ProblemInstance<ClockProblem, string> }) {
  const [hint, setHint] = useState(false);
  const voice = useMemo(() => playback.scope(current.signal), [current.signal]);
  useLayoutEffect(() => voice.cancel, [voice]);
  return (
    <div class="clock-problem">
      <h2>{current.problem.hour}:{String(current.problem.minute).padStart(2, '0')}</h2>
      <button aria-label="Say it again" onClick={() => void voice.say('Try again!')}>Replay recording</button>
      {hint && <p>3:00</p>}
      {['', '4:00', '3:00'].map(answer => <button onClick={() => {
        const verdict = current.actions.submit(answer);
        if (verdict === 'incorrect') void voice.say('Try again!');
      }}>{answer || 'No answer'}</button>)}
      <button onClick={() => current.actions.help(async () => { setHint(true); })}>Help</button>
    </div>
  );
}
