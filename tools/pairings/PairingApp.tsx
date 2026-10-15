import '@fontsource/nunito/latin-800.css';
import './selected.css';
import { useLayoutEffect, useMemo, useState } from 'preact/hooks';
import type { ComponentChildren, ComponentType } from 'preact';
import { unlockAudio } from '../../src/audio/context';
import type { ProblemInstance, RoundDisplay } from '../../src/learning/round';
import type { RewardPresentation } from '../../src/rewards/presentation';
import { RoundScreen } from '../../src/round/RoundScreen';
import type { ReadonlySignal } from '@preact/signals';

export function PairingApp<P, A>({ title, balance, reward, Destination, begin, Problem, Introduction, completion, trophies }: {
  title: string;
  balance: number;
  reward: RewardPresentation;
  Destination: ComponentType<{ onClose(): void }>;
  begin(): { display: ReadonlySignal<RoundDisplay<P, A>>; leave(): void };
  Problem: ComponentType<{ current: ProblemInstance<P, A> }>;
  Introduction?: ComponentType<NonNullable<RoundDisplay<P, A>['introduction']>>;
  completion: { earned: number } | null;
  trophies?: ComponentChildren;
}) {
  const [screen, setScreen] = useState<'start' | 'setup' | 'home' | 'round' | 'reward'>('start');
  const [round, setRound] = useState<ReturnType<typeof begin> | null>(null);
  const [response, setResponse] = useState(true);
  const lifetime = useMemo(() => new AbortController(), [screen]);
  useLayoutEffect(() => () => lifetime.abort(), [lifetime]);
  useLayoutEffect(() => () => round?.leave(), [round]);
  const home = () => { round?.leave(); setScreen('home'); };
  const setup = reward.setup;
  return (
    <div class="pairing-app">
      <h1>{title}</h1>
      <output aria-label="Balance">{balance}</output>
      {reward.Goal && <reward.Goal balance={balance} />}
      {screen === 'start' && <button onClick={() => { unlockAudio(); setScreen(setup ? 'setup' : 'home'); }}>Start</button>}
      {screen === 'setup' && setup && <setup.View signal={lifetime.signal} onDone={() => setScreen('home')} />}
      {screen === 'home' && <>
        <button onClick={() => { setResponse(true); setRound(begin()); setScreen('round'); }}>Practice</button>
        <reward.Entry onOpen={() => setScreen('reward')} />
        {trophies}
      </>}
      {screen === 'round' && round && <RoundScreen
        display={round.display.value} Problem={Problem} Introduction={Introduction}
        header={<><button onClick={home}>Home</button><span>{round.display.value.answered}/5</span></>}
        end={<>
          {response && <p role="status">Completed. Earned {completion?.earned ?? 0}.</p>}
          <button onClick={() => setResponse(!response)}>Show completion</button>
          <reward.Entry onOpen={() => { round.leave(); setScreen('reward'); }} />
        </>}
      />}
      {screen === 'reward' && <Destination onClose={home} />}
    </div>
  );
}
