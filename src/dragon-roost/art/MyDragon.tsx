// The dragon he flies next, as a little picture: it stands for a Flight wherever one is counted (the Fly buttons, the Flights he has
// waiting, "+1 Flight"), so a Flight is always his own dragon rather than a stock emoji.
import { player } from '../game';
import { marksOf, stageOf } from '../roost/dragons';
import { lookOf, riding } from '../roost/roost';
import { dragonPic } from './dragon';

export function MyDragon({ class: cls = '' }: { class?: string }) {
  const d = riding(player.state.value.roost);
  return <img class={`my-dragon ${cls}`} src={dragonPic(lookOf(d), 64, { stage: stageOf(d.flights), marks: marksOf(d.flights) })} alt="" aria-hidden="true" />;
}
