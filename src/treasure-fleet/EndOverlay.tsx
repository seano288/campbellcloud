// End of a Round: the Doubloons he earned drop onto his pile one by one, a Round where he had to try again says he kept trying, he's told
// he earned a Voyage, then each Level up, newly opened kind and star is announced. Only then do the buttons wake up: Set Sail is the
// big one, with the island it goes to on it, beside his ship (the Shipyard) and ▶ for another Round.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare } from '../audio/sfx';
import { confetti } from '../celebrate/effects';
import { playMoments } from '../celebrate/sequence';
import { earnedLine } from '../currency/kind';
import { IconButton } from '../ui/bits';
import { CurrencyIcon } from '../ui/currency';
import { IslandBadge } from './art/IslandBadge';
import { ShipView } from './art/ShipView';
import { FLEET_CURRENCY } from './branding';
import { destinationOf } from './fleet/fleet';
import { player } from './game';
import { MODE_NAMES } from './learning';
import { starLine, type Phrase } from './phrases';
import type { Round, RoundEvent } from './round';
import { useVoiceScope } from './voice';

const order = (e: RoundEvent) => (e.kind === 'star' ? 3 : 2);
function eventLines(e: RoundEvent): Phrase[] {
  if (e.kind === 'levelUp') return ['Level up!'];
  if (e.kind === 'star') return [starLine(MODE_NAMES[e.mode])];
  return [`You opened ${MODE_NAMES[e.mode]}!`];
}

export function EndOverlay({ result: r, onSail, onYard, onAgain, onHome }: { result: Round; onSail(): void; onYard(): void; onAgain(): void; onHome(): void }) {
  const voice = useVoiceScope();
  const [pile, setPile] = useState(r.beforeBalance), [bump, setBump] = useState(false);
  const [lines, setLines] = useState<Phrase[]>([]), [awake, setAwake] = useState(false), [earned, setEarned] = useState(false);
  useEffect(() => {
    void playMoments([
      async () => {
        for (let k = 1; k <= r.earned && voice.active; k++) { setPile(r.beforeBalance + k); setBump(true); sClink(); await voice.wait(160); setBump(false); await voice.wait(90); }
        await voice.say(earnedLine(FLEET_CURRENCY, r.earned));
        if (r.results.some(o => o !== 'clean') && voice.active) { sChime(); setLines(ls => [...ls, 'You kept trying!']); await voice.say('You kept trying!'); }
        if (voice.active) { sChime(); setEarned(true); await voice.say('You earned a voyage!'); }
      },
      async () => {
        for (const e of [...r.events].sort((a, b) => order(a) - order(b))) {
          if (!voice.active) return;
          const said = eventLines(e);
          setLines(ls => [...ls, ...said]);
          if (e.kind === 'levelUp') { sFanfare(); confetti(30, voice.signal); } else sChime();
          await voice.say(...said);
        }
      },
    ], voice.signal).then(result => { if (result !== 'cancelled' && voice.active) { setAwake(true); void voice.say('Tap Set Sail!'); } });
    return () => voice.cancel();
  }, []);
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  const fleet = player.state.value.fleet, to = destinationOf(fleet);
  return (
    <div class="reward tf-reward">
      <h2>Round done!</h2>
      <div class="bigpile"><CurrencyIcon kind={FLEET_CURRENCY} size={80} /><span class={bump ? 'bump' : ''}>{pile}</span></div>
      {earned && <div class="earned-voyage">⛵ +1 voyage</div>}
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class="big-btn garage my-ship" aria-label="Shipyard" onClick={go(onYard)}><ShipView ship={fleet.ship} label={null} sea={false} /></button>
        <button class={`big-btn go sail-btn ${awake ? 'pulse' : ''}`} aria-label={`Set sail to ${to.name}`} onClick={go(onSail)}>
          <IslandBadge island={to} class="sail-isle" />
          <span class="sail-word">Set Sail</span>
          <span class="sail-count">⛵{fleet.voyages}</span>
        </button>
        <button class="big-btn go again second" aria-label="Play again" onClick={go(onAgain)}><span class="e">▶</span></button>
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} onClick={go(onHome)}>🏠</IconButton>
    </div>
  );
}
