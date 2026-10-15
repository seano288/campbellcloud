import { signal } from '@preact/signals';
import { render } from 'preact';
import { createRound, type ProblemInstance } from '../../src/learning/round';
import { nonMoneySession } from '../../src/learning/nonMoney.fixture';
import type { RewardPresentation } from '../../src/rewards/presentation';
import { RoundScreen } from '../../src/round/RoundScreen';

const reward: RewardPresentation = {
  setup: null,
  Entry: ({ onOpen }) => <button onClick={onOpen}>Collection</button>,
};
const balance = signal(7), opened = signal(false), acknowledged = signal(0);
const lifetime = new AbortController();
const round = createRound({
  roundId: 'clock-fixture', session: nonMoneySession(), rng: () => 0, signal: lifetime.signal,
  introduction: { acknowledge: () => acknowledged.value++ },
  interrupt() {}, solved() {}, terminal() {},
});

function Problem({ current }: { current: ProblemInstance<{ hour: 3; minute: 0 }, string> }) {
  return <button onClick={() => current.actions.submit('3:00')}>Read the clock</button>;
}

function Fixture() {
  return (
    <>
      <output id="balance">{balance.value}</output>
      <output id="acknowledged">{acknowledged.value}</output>
      <button onClick={() => { lifetime.abort(); opened.value = true; }}>Leave introduction</button>
      {opened.value ? <h1>Collection opened</h1> : <RoundScreen
        display={round.display.value}
        Problem={Problem}
        Introduction={({ acknowledge }) => <button onClick={acknowledge}>Begin clocks</button>}
        header={<reward.Entry onOpen={() => { round.leave(); opened.value = true; }} />}
        end={<p>Finished clocks</p>}
      />}
    </>
  );
}

render(<Fixture />, document.getElementById('fixture')!);
