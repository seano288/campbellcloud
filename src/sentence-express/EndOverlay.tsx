// End of a Round: the Tickets he earned drop onto his pile one by one, a Round where he had to try again says he kept trying, he's told
// he earned a Delivery, then each Level up, newly opened kind and star is announced. Only then do the buttons wake up: Deliver! is the
// big one (a whistle), beside his train (the Shed) and ▶ for another Round.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare } from '../audio/sfx';
import { confetti } from '../celebrate/effects';
import { playMoments } from '../celebrate/sequence';
import { earnedLine } from '../currency/kind';
import { IconButton } from '../ui/bits';
import { CurrencyIcon } from '../ui/currency';
import { TrainView } from './art/TrainView';
import { EXPRESS_CURRENCY } from './branding';
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

export function EndOverlay({ result: r, onDeliver, onShed, onAgain, onHome }: { result: Round; onDeliver(): void; onShed(): void; onAgain(): void; onHome(): void }) {
  const voice = useVoiceScope();
  const [pile, setPile] = useState(r.beforeBalance), [bump, setBump] = useState(false);
  const [lines, setLines] = useState<Phrase[]>([]), [awake, setAwake] = useState(false), [earned, setEarned] = useState(false);
  useEffect(() => {
    void playMoments([
      async () => {
        for (let k = 1; k <= r.earned && voice.active; k++) { setPile(r.beforeBalance + k); setBump(true); sClink(); await voice.wait(160); setBump(false); await voice.wait(90); }
        await voice.say(earnedLine(EXPRESS_CURRENCY, r.earned));
        if (r.results.some(o => o !== 'clean') && voice.active) { sChime(); setLines(ls => [...ls, 'You kept trying!']); await voice.say('You kept trying!'); }
        if (voice.active) { sChime(); setEarned(true); await voice.say('You earned a Delivery!'); }
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
    ], voice.signal).then(result => { if (result !== 'cancelled' && voice.active) { setAwake(true); void voice.say('Tap Deliver!'); } });
    return () => voice.cancel();
  }, []);
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  const t = player.state.value.trains;
  return (
    <div class="reward se-reward">
      <h2>Round done!</h2>
      <div class="bigpile"><CurrencyIcon kind={EXPRESS_CURRENCY} size={80} /><span class={bump ? 'bump' : ''}>{pile}</span></div>
      {earned && <div class="earned-call">📦 +1 Delivery</div>}
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class="big-btn garage my-train" aria-label="Shed" onClick={go(onShed)}><TrainView train={t} cars={1} /></button>
        <button class={`big-btn go deliver-btn ${awake ? 'pulse' : ''}`} aria-label="Deliver" onClick={go(onDeliver)}>
          <span class="deliver-icon" aria-hidden="true">🚂</span><span class="deliver-word">Deliver!</span><span class="deliver-count">{t.deliveries}</span>
        </button>
        <button class="big-btn go again second" aria-label="Play again" onClick={go(onAgain)}><span class="e">▶</span></button>
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} onClick={go(onHome)}>🏠</IconButton>
    </div>
  );
}
