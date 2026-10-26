// The Goal bar: the Squad, Mod or Colour he's saving toward and how close he is. Tapping it says so.
import { Bolt } from '../../ui/bits';
import { player } from '../game';
import type { Phrase } from '../phrases';
import { useVoice } from '../voice';
import { colourHex, needLines } from './actions';
import { boltPrice, goalOf, nextLegendary } from './camp';
import { buyableName, colourById, colourOf, isColourItem, isUnitItem, parseMod, unitOf, type Buyable } from './catalog';
import { ModIcon } from './ModIcon';
import { UnitArt } from './UnitArt';

function GoalIcon({ x }: { x: Buyable }) {
  if (isUnitItem(x)) return <UnitArt unit={unitOf(x)} color={colourHex(player.state.value.camp)} />;
  if (isColourItem(x)) return <i class="dab" style={{ background: colourById(colourOf(x)).hex }} />;
  return <ModIcon {...parseMod(x)} />;
}

export function GoalBar() {
  const { say } = useVoice();
  const state = player.state.value, bolts = state.currency.balance, g = goalOf(state.camp);
  if (!g) {
    const left = nextLegendary(state.camp);
    return <button class="goalchip done" aria-label="Goal" onClick={() => void say(left ? 'This one is in the Password Lock!' : 'You built everything!')}>{left ? '🔐' : '🏆'}</button>;
  }
  const cost = boltPrice(g), name = buyableName(g) as Phrase;
  const tap = () => void say(...(bolts >= cost ? [`You can get ${buyableName(g)}!` as Phrase] : needLines(g, name)));
  return (
    <button class={`goalchip ${bolts >= cost ? 'ready' : ''}`} aria-label="Goal" onClick={tap}>
      <span class={`gi ${isUnitItem(g) ? 'body' : ''}`}><GoalIcon x={g} /></span>
      <span class="track"><i style={{ width: `${Math.min(100, (bolts / cost) * 100)}%` }} /></span>
      <span class="num">{Math.min(bolts, cost)}/{cost}</span>
      <Bolt size={20} />
    </button>
  );
}
