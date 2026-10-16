// The Goal bar: the Mod, Aircraft or Colour he's saving toward and how close he is. Tapping it says so.
import { Bolt } from '../../ui/bits';
import { player } from '../game';
import type { Phrase } from '../phrases';
import { useVoice } from '../voice';
import { needLines } from './actions';
import { buyableName, colourById, colourOf, isColourItem, isJetItem, jetOf, parseMod, type Buyable } from './catalog';
import { boltPrice, goalOf, nextLegendary } from './hangar';
import { JetArt } from './JetArt';
import { ModIcon } from './ModIcon';

function GoalIcon({ x }: { x: Buyable }) {
  const jet = player.state.value.hangar.jet ?? 'p51';
  if (isJetItem(x)) return <JetArt jet={jetOf(x)} color="#ffd23f" />;
  if (isColourItem(x)) return <i class="dab" style={{ background: colourById(colourOf(x)).hex }} />;
  return <ModIcon {...parseMod(x)} jet={jet} />;
}

export function GoalBar() {
  const { say } = useVoice();
  const state = player.state.value, bolts = state.currency.balance, g = goalOf(state.hangar);
  if (!g) {
    const left = nextLegendary(state.hangar);
    return <button class="goalchip done" aria-label="Goal" onClick={() => void say(left ? 'This one is in the Time Lock vault!' : 'You built everything!')}>{left ? '⏰' : '🏆'}</button>;
  }
  const cost = boltPrice(g);
  const tap = () => void say(...(bolts >= cost ? [`You can get ${buyableName(g)}!` as Phrase] : needLines(g)));
  return (
    <button class={`goalchip ${bolts >= cost ? 'ready' : ''}`} aria-label="Goal" onClick={tap}>
      <span class={`gi ${isJetItem(g) ? 'body' : ''}`}><GoalIcon x={g} /></span>
      <span class="track"><i style={{ width: `${Math.min(100, (bolts / cost) * 100)}%` }} /></span>
      <span class="num">{Math.min(bolts, cost)}/{cost}</span>
      <Bolt size={20} />
    </button>
  );
}
