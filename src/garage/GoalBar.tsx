// The Goal bar: the Mod, Body or Colour he's saving toward and how close he is. Tapping it says so. Once everything
// bought with Bolts is his, it shows the next Legendary and its price in money at his Pay the Shop Level.
import { fmt } from '../money/money';
import { useVoice } from '../voice/context';
import { BodyArt } from './BodyArt';
import { needBolts, type Phrase } from '../voice/phrases';
import type { Item } from '../voice/say';
import { bodyOf, buyableName, colourById, colourOf, isBodyItem, isColourItem, LEGENDARY, modId, modName, parseMod } from './catalog';
import { boltsNeeded, goalOf, nextLegendary, priceOf, type GaragePricingContext } from './economy';
import type { GarageInventory } from './state';
import { PartIcon } from './icons';

/** What tapping the Goal bar says. */
export function goalLines(state: GarageInventory, balance: number, context: GaragePricingContext): Item[] {
  const g = goalOf(state);
  if (!g) {
    const l = nextLegendary(state, context);
    return l ? [`${modName(l, LEGENDARY)} costs` as Phrase, { cents: priceOf(modId(l, LEGENDARY), context).cents }] : ['You built everything!'];
  }
  const needed = boltsNeeded(balance, g);
  return needed > 0 ? [buyableName(g), needBolts(needed)] : [`You can get ${buyableName(g)}!` as Phrase];
}

export function GoalBar({ state, balance: bolts, context }: { state: GarageInventory; balance: number; context: GaragePricingContext }) {
  const { say } = useVoice();
  const g = goalOf(state), tap = () => void say(...goalLines(state, bolts, context));
  if (!g) {
    const l = nextLegendary(state, context);
    if (!l) return <button class="goalchip done" aria-label="Goal" onClick={tap}>🏆</button>;
    return (
      <button class="goalchip legend" aria-label="Goal" onClick={tap}>
        <span class="gi"><PartIcon slot={l} rung={LEGENDARY} /></span>
        <span class="num">{fmt(priceOf(modId(l, LEGENDARY), context).cents)}</span>
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
