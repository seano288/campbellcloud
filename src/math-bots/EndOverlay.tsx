// End of a Round: the Bolts he earned drop onto his pile one by one, a Round where he had to try again says he kept trying, he's
// told he earned a fight, then each Level up, newly opened kind and star is announced. Only then do the buttons wake up: Fight is the big
// one, with the rival he's up against on it, beside his own robot (the Workshop) and ▶ for another Round.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare } from '../audio/sfx';
import { confetti } from '../celebrate/effects';
import { playMoments } from '../celebrate/sequence';
import { earnedLine } from '../currency/kind';
import { IconButton } from '../ui/bits';
import { CurrencyIcon } from '../ui/currency';
import { BotView } from './bot/BotView';
import { MATH_CURRENCY } from './branding';
import { player } from './game';
import { MODE_NAMES } from './learning';
import { starLine, type Phrase } from './phrases';
import type { Round, RoundEvent } from './round';
import { useVoiceScope } from './voice';
import { nextRival } from './workshop/workshop';

const order = (e: RoundEvent) => (e.kind === 'star' ? 3 : 2);
function eventLines(e: RoundEvent): Phrase[] {
  if (e.kind === 'levelUp') return ['Level up!'];
  if (e.kind === 'star') return [starLine(MODE_NAMES[e.mode])];
  return [`You opened ${MODE_NAMES[e.mode]}!`];
}

export function EndOverlay({ result: r, onFight, onWorkshop, onAgain, onHome }: { result: Round; onFight(): void; onWorkshop(): void; onAgain(): void; onHome(): void }) {
  const voice = useVoiceScope();
  const [pile, setPile] = useState(r.beforeBalance), [bump, setBump] = useState(false);
  const [lines, setLines] = useState<Phrase[]>([]), [awake, setAwake] = useState(false), [fight, setFight] = useState(false);
  useEffect(() => {
    void playMoments([
      async () => {
        for (let k = 1; k <= r.earned && voice.active; k++) { setPile(r.beforeBalance + k); setBump(true); sClink(); await voice.wait(160); setBump(false); await voice.wait(90); }
        await voice.say(earnedLine(MATH_CURRENCY, r.earned));
        if (r.results.some(o => o !== 'clean') && voice.active) { sChime(); setLines(ls => [...ls, 'You kept trying!']); await voice.say('You kept trying!'); }
        if (voice.active) { sChime(); setFight(true); await voice.say('You earned a fight!'); }
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
    ], voice.signal).then(result => { if (result !== 'cancelled' && voice.active) { setAwake(true); if (player.state.peek().workshop.charges > 0) void voice.say('Tap Fight!'); } });
    return () => voice.cancel();
  }, []);
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  const w = player.state.value.workshop, rival = nextRival(w), canFight = w.charges > 0;
  return (
    <div class="reward">
      <h2>Round done!</h2>
      <div class="bigpile"><CurrencyIcon kind={MATH_CURRENCY} size={80} /><span class={bump ? 'bump' : ''}>{pile}</span></div>
      {fight && <div class="earned-fight">🥊 +1 fight</div>}
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class="big-btn garage my-bot" aria-label="Workshop" onClick={go(onWorkshop)}><BotView build={w.build} live={awake} label={null} /></button>
        {canFight && (
          <button class={`big-btn go fight-btn ${awake ? 'pulse' : ''}`} aria-label="Fight" onClick={go(onFight)}>
            {rival && <BotView build={rival.build} turn={Math.PI} class="fight-rival" label={rival.name} />}
            <span class="fight-word">Fight</span>
            <span class="fight-price">🥊{w.charges}</span>
          </button>
        )}
        <button class={`big-btn go again ${canFight ? 'second' : ''}`} aria-label="Play again" onClick={go(onAgain)}><span class="e">▶</span></button>
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} onClick={go(onHome)}>🏠</IconButton>
    </div>
  );
}
