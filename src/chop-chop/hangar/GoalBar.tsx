// The Goal bar: the Mod, Helicopter or Colour he's saving toward and how close he is. Tapping it says so.
import { Bolt } from '../../ui/bits';
import { player } from '../game';
import type { Phrase } from '../phrases';
import { useVoice } from '../voice';
import { needLines } from './actions';
import { buyableName, colourById, colourOf, isColourItem, isHeliItem, heliOf, parseMod, type Buyable } from './catalog';
import { boltPrice, goalOf, nextLegendary } from './helipad';
import { HeliArt } from './HeliArt';
import { ModIcon } from './ModIcon';

function GoalIcon({ x }: { x: Buyable }) {
  const heli = player.state.value.helipad.heli ?? 'uh60';
  if (isHeliItem(x)) return <HeliArt heli={heliOf(x)} color="#ffd23f" />;
  if (isColourItem(x)) return <i class="dab" style={{ background: colourById(colourOf(x)).hex }} />;
  return <ModIcon {...parseMod(x)} heli={heli} />;
}

export function GoalBar() {
  const { say } = useVoice();
  const state = player.state.value, bolts = state.currency.balance, g = goalOf(state.helipad);
  if (!g) {
    const left = nextLegendary(state.helipad);
    return <button class="goalchip done" aria-label="Goal" onClick={() => void say(left ? 'This one is in the Fuel Lock!' : 'You built everything!')}>{left ? '⛽' : '🏆'}</button>;
  }
  const cost = boltPrice(g);
  const tap = () => void say(...(bolts >= cost ? [`You can get ${buyableName(g)}!` as Phrase] : needLines(g)));
  return (
    <button class={`goalchip ${bolts >= cost ? 'ready' : ''}`} aria-label="Goal" onClick={tap}>
      <span class={`gi ${isHeliItem(g) ? 'body' : ''}`}><GoalIcon x={g} /></span>
      <span class="track"><i style={{ width: `${Math.min(100, (bolts / cost) * 100)}%` }} /></span>
      <span class="num">{Math.min(bolts, cost)}/{cost}</span>
      <Bolt size={20} />
    </button>
  );
}
