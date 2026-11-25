// End of a Round: the Tokens he earned drop out of the token machine one by one and clatter onto his pile, a Round where he had to try
// again says he kept trying, he's told he earned a Ride, then each Level up, newly opened kind and star is announced. Only then do the
// buttons wake up: Ride is the big one, beside his Coaster Yard and ▶ for another Round.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare } from '../audio/sfx';
import { confetti } from '../celebrate/effects';
import { playMoments } from '../celebrate/sequence';
import { earnedLine } from '../currency/kind';
import { IconButton } from '../ui/bits';
import { CurrencyIcon } from '../ui/currency';
import { CUR } from './branding';
import { player } from './game';
import { MODE_NAMES } from './learning';
import { starLine, type Phrase } from './phrases';
import type { Round, RoundEvent } from './round';
import { useVoiceScope } from './voice';

const order = (e: RoundEvent) => (e.kind === 'star' ? 3 : 2);
function eventLines(e: RoundEvent): Phrase[] {
  if (e.kind === 'levelUp') return ['Level up!', MODE_NAMES[e.mode]]; // which kind: its name is a clip of its own
  if (e.kind === 'star') return [starLine(MODE_NAMES[e.mode])];
  return [`You opened ${MODE_NAMES[e.mode]}!`];
}

/** The fairground token machine: a red and white box with a bulb on top and a chute the Tokens drop out of. */
export function TokenMachine({ dropping }: { dropping: number }) {
  return (
    <div class="cc-machine" aria-hidden="true">
      <svg viewBox="0 0 120 150">
        <rect x="18" y="22" width="84" height="108" rx="10" fill="#e63946" stroke="#14161b" stroke-width="5" />
        <path d="M18 52 H102 M18 82 H102" stroke="#fff" stroke-width="8" />
        <circle cx="60" cy="16" r="11" fill="#ffd23f" stroke="#14161b" stroke-width="4" class={dropping ? 'cc-bulb on' : 'cc-bulb'} />
        <rect x="40" y="100" width="40" height="22" rx="5" fill="#14161b" />
        <rect x="34" y="128" width="52" height="16" rx="4" fill="#c9d1da" stroke="#14161b" stroke-width="4" />
        <circle cx="60" cy="66" r="9" fill="#fff" stroke="#14161b" stroke-width="3" />
      </svg>
      {dropping > 0 && <span key={dropping} class="cc-drop"><CurrencyIcon kind={CUR} size={40} /></span>}
    </div>
  );
}

export function EndOverlay({ result: r, onRide, onYard, onAgain, onHome }: { result: Round; onRide(): void; onYard(): void; onAgain(): void; onHome(): void }) {
  const voice = useVoiceScope();
  const [pile, setPile] = useState(r.beforeBalance), [bump, setBump] = useState(false), [dropping, setDropping] = useState(0);
  const [lines, setLines] = useState<string[]>([]), [awake, setAwake] = useState(false), [earned, setEarned] = useState(false);
  useEffect(() => {
    void playMoments([
      async () => {
        for (let k = 1; k <= r.earned && voice.active; k++) {
          setDropping(k); await voice.wait(260);
          setPile(r.beforeBalance + k); setBump(true); sClink(); sClink(0.05); await voice.wait(120); setBump(false); await voice.wait(60);
        }
        setDropping(0);
        await voice.say(earnedLine(CUR, r.earned));
        if (r.results.some(o => o !== 'clean') && voice.active) { sChime(); setLines(ls => [...ls, 'You kept trying!']); await voice.say('You kept trying!'); }
        if (voice.active) { sChime(); setEarned(true); await voice.say('You earned a Ride!'); }
      },
      async () => {
        for (const e of [...r.events].sort((a, b) => order(a) - order(b))) {
          if (!voice.active) return;
          const said = eventLines(e);
          setLines(ls => [...ls, said.join(' ')]);
          if (e.kind === 'levelUp') { sFanfare(); confetti(30, voice.signal); } else sChime();
          await voice.say(...said);
        }
      },
    ], voice.signal).then(result => { if (result !== 'cancelled' && voice.active) { setAwake(true); void voice.say('Tap Ride!'); } });
    return () => voice.cancel();
  }, []);
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  const y = player.state.value.yard;
  return (
    <div class="reward cc-reward">
      <h2>Round done!</h2>
      <div class="cc-payout">
        <TokenMachine dropping={dropping} />
        <div class="bigpile"><CurrencyIcon kind={CUR} size={80} /><span class={bump ? 'bump' : ''}>{pile}</span></div>
      </div>
      {earned && <div class="earned-race cc-earned">🎢 +1 Ride</div>}
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class="big-btn garage cc-yard-btn" aria-label="Coaster Yard" onClick={go(onYard)}><span class="e">🛠️</span><span class="btn-word">Yard</span></button>
        <button class={`big-btn go race-btn cc-ride-btn ${awake ? 'pulse' : ''}`} aria-label="Ride" onClick={go(onRide)}>
          <span class="race-flag" aria-hidden="true">🎢</span>
          <span class="race-word">Ride</span>
          <span class="race-count">{y.rides}</span>
        </button>
        <button class="big-btn go again second" aria-label="Play again" onClick={go(onAgain)}><span class="e">▶</span></button>
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} onClick={go(onHome)}>🏠</IconButton>
    </div>
  );
}
