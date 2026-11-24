// End of a Round: the Gems he earned drop onto his pile one by one, a Round where he had to try again says he kept trying, he's told
// he earned a Dig, then each Level up, newly opened kind and star is announced. Only then do the buttons wake up: Dig! is the big one,
// beside his dinosaur (the Museum) and ▶ for another Round.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare } from '../audio/sfx';
import { confetti } from '../celebrate/effects';
import { playMoments } from '../celebrate/sequence';
import { earnedLine } from '../currency/kind';
import { IconButton } from '../ui/bits';
import { CurrencyIcon } from '../ui/currency';
import { DinoPic } from './art/DinoPic';
import { DINO_CURRENCY } from './branding';
import { player } from './game';
import { MODE_NAMES } from './learning';
import { starLine, type Phrase } from './phrases';
import type { Round, RoundEvent } from './round';
import { useVoiceScope } from './voice';

const order = (e: RoundEvent) => (e.kind === 'star' ? 3 : 2);
function eventLines(e: RoundEvent): Phrase[] {
  if (e.kind === 'levelUp') return ['Level up!'];
  if (e.kind === 'star') return [starLine(MODE_NAMES[e.mode])];
  if (e.kind === 'open') return [`You opened ${MODE_NAMES[e.mode]}!`];
  return [];
}

export function EndOverlay({ result: r, onDig, onMuseum, onAgain, onHome }: { result: Round; onDig(): void; onMuseum(): void; onAgain(): void; onHome(): void }) {
  const voice = useVoiceScope();
  const [pile, setPile] = useState(r.beforeBalance), [bump, setBump] = useState(false);
  const [lines, setLines] = useState<Phrase[]>([]), [awake, setAwake] = useState(false), [earned, setEarned] = useState(false);
  useEffect(() => {
    void playMoments([
      async () => {
        for (let k = 1; k <= r.earned && voice.active; k++) { setPile(r.beforeBalance + k); setBump(true); sClink(); await voice.wait(160); setBump(false); await voice.wait(90); }
        await voice.say(earnedLine(DINO_CURRENCY, r.earned));
        if (r.results.some(o => o !== 'clean') && voice.active) { sChime(); setLines(ls => [...ls, 'You kept trying!']); await voice.say('You kept trying!'); }
        if (voice.active) { sChime(); setEarned(true); await voice.say('You earned a Dig!'); }
      },
      async () => {
        for (const e of [...r.events].sort((a, b) => order(a) - order(b))) {
          if (!voice.active) return;
          const said = eventLines(e);
          if (!said.length) continue;
          setLines(ls => [...ls, ...said]);
          if (e.kind === 'levelUp') { sFanfare(); confetti(30, voice.signal); } else sChime();
          await voice.say(...said);
        }
      },
    ], voice.signal).then(result => { if (result !== 'cancelled' && voice.active) { setAwake(true); void voice.say('Tap Dig!'); } });
    return () => voice.cancel();
  }, []);
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  const m = player.state.value.museum;
  return (
    <div class="reward dd-reward">
      <h2>Round done!</h2>
      <div class="bigpile"><CurrencyIcon kind={DINO_CURRENCY} size={80} /><span class={bump ? 'bump' : ''}>{pile}</span></div>
      {earned && <div class="earned-job">🦴 +1 Dig</div>}
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class="big-btn garage my-museum" aria-label="Museum" onClick={go(onMuseum)}><DinoPic m={m} /></button>
        <button class={`big-btn go job-btn ${awake ? 'pulse' : ''}`} aria-label="Dig" onClick={go(onDig)}>
          <span class="job-icon" aria-hidden="true">⛏️</span><span class="job-word">Dig!</span><span class="job-count">{m.digs}</span>
        </button>
        <button class="big-btn go again second" aria-label="Play again" onClick={go(onAgain)}><span class="e">▶</span></button>
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} onClick={go(onHome)}>🏠</IconButton>
    </div>
  );
}
