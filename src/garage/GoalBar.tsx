// The Goal bar: the Mod, Body or Colour he's saving toward and how close he is. Tapping it says so. Once everything
// bought with Bolts is his, it shows the next Legendary and its price in money at his Pay the Shop Level.
import { game } from '../game/store';
import { fmt } from '../money/money';
import { useVoice } from '../voice/context';
import { BodyArt } from './BodyArt';
import { bodyOf, colourById, colourOf, isBodyItem, isColourItem, LEGENDARY, parseMod } from './catalog';
import { priceOf } from './economy';
import { goal, goalLines, legendaryPrice, nextLegendary } from './garage';
import { PartIcon } from './icons';

export function GoalBar() {
  const { say } = useVoice();
  const g = goal(), bolts = game.value.bolts, tap = () => void say(...goalLines());
  if (!g) {
    const l = nextLegendary();
    if (!l) return <button class="goalchip done" aria-label="Goal" onClick={tap}>🏆</button>;
    return (
      <button class="goalchip legend" aria-label="Goal" onClick={tap}>
        <span class="gi"><PartIcon slot={l} rung={LEGENDARY} /></span>
        <span class="num">{fmt(legendaryPrice(l))}</span>
      </button>
    );
  }
  const cost = priceOf(g).bolts!;
  return (
    <button class={`goalchip ${bolts >= cost ? 'ready' : ''}`} aria-label="Goal" onClick={tap}>
      <span class={`gi ${isBodyItem(g) ? 'body' : ''}`}>
        {isBodyItem(g) ? <BodyArt body={bodyOf(g)} color="#ffd23f" /> : isColourItem(g) ? <i class="dab" style={{ background: colourById(colourOf(g)).hex }} /> : <PartIcon {...parseMod(g)} />}
      </span>
      <span class="track"><i style={{ width: `${Math.min(100, (bolts / cost) * 100)}%` }} /></span>
      <span class="num">{Math.min(bolts, cost)}/{cost}</span>
    </button>
  );
}
