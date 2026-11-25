// End of a Round: the Bolts he earned drop onto his pile one by one, a Round where he had to try again says he kept trying, he's told he
// earned a Jump, then each Level up, newly opened kind and star is announced. Only then do the buttons wake up: Jump is the big one,
// beside his Arena and ▶ for another Round.
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

export function EndOverlay({ result: r, onJump, onArena, onAgain, onHome }: { result: Round; onJump(): void; onArena(): void; onAgain(): void; onHome(): void }) {
  const voice = useVoiceScope();
  const [pile, setPile] = useState(r.beforeBalance), [bump, setBump] = useState(false);
  const [lines, setLines] = useState<string[]>([]), [awake, setAwake] = useState(false), [earned, setEarned] = useState(false);
  useEffect(() => {
    void playMoments([
      async () => {
        for (let k = 1; k <= r.earned && voice.active; k++) { setPile(r.beforeBalance + k); setBump(true); sClink(); await voice.wait(160); setBump(false); await voice.wait(90); }
        await voice.say(earnedLine(CUR, r.earned));
        if (r.results.some(o => o !== 'clean') && voice.active) { sChime(); setLines(ls => [...ls, 'You kept trying!']); await voice.say('You kept trying!'); }
        if (voice.active) { sChime(); setEarned(true); await voice.say('You earned a Jump!'); }
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
    ], voice.signal).then(result => { if (result !== 'cancelled' && voice.active) { setAwake(true); void voice.say('Tap Jump!'); } });
    return () => voice.cancel();
  }, []);
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  const a = player.state.value.arena;
  return (
    <div class="reward ba-reward">
      <div class="ba-reward-sky" aria-hidden="true" />
      <h2>Round done!</h2>
      <div class="bigpile"><CurrencyIcon kind={CUR} size={80} /><span class={bump ? 'bump' : ''}>{pile}</span></div>
      {earned && <div class="earned-race">🛻 +1 Jump</div>}
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class="big-btn garage ba-arena-btn" aria-label="Arena" onClick={go(onArena)}><span class="e">🏟️</span><span class="btn-word">Arena</span></button>
        <button class={`big-btn go race-btn ba-jump-btn ${awake ? 'pulse' : ''}`} aria-label="Jump" onClick={go(onJump)}>
          <span class="race-flag" aria-hidden="true">🛻</span>
          <span class="race-word">Jump</span>
          <span class="race-count">{a.jumps}</span>
        </button>
        <button class="big-btn go again second" aria-label="Play again" onClick={go(onAgain)}><span class="e">▶</span></button>
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} onClick={go(onHome)}>🏠</IconButton>
    </div>
  );
}
