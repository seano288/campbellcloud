// End of a Round: his dragon flies in and puffs the Flames he earned onto the pile one by one, each with a soft whoosh. A Round where he
// had to try again says he kept trying; he's told he earned a Flight (and that his eggs got warmer); then each Level up, newly opened kind
// and star is announced. Only then do the buttons wake up: Fly is the big one, beside the Roost and ▶ for another Round.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sFanfare, sWhoosh } from '../audio/sfx';
import { confetti } from '../celebrate/effects';
import { playMoments } from '../celebrate/sequence';
import { earnedLine } from '../currency/kind';
import { IconButton } from '../ui/bits';
import { CurrencyIcon } from '../ui/currency';
import { DragonCanvas } from './art/DragonCanvas';
import { MyDragon } from './art/MyDragon';
import { CUR } from './branding';
import { player } from './game';
import { MODE_NAMES } from './learning';
import { openedLine, starLine, type Phrase } from './phrases';
import { lookOf, riding } from './roost/roost';
import type { Round, RoundEvent } from './round';
import { useVoiceScope } from './voice';

const order = (e: RoundEvent) => (e.kind === 'star' ? 3 : 2);
function eventLines(e: RoundEvent): Phrase[] {
  if (e.kind === 'levelUp') return ['Level up!', MODE_NAMES[e.mode]];
  if (e.kind === 'star') return [starLine(e.mode)];
  return [openedLine(e.mode)];
}

export function EndOverlay({ result: r, onFly, onRoost, onAgain, onHome }: { result: Round; onFly(): void; onRoost(): void; onAgain(): void; onHome(): void }) {
  const voice = useVoiceScope();
  const [pile, setPile] = useState(r.beforeBalance), [bump, setBump] = useState(false), [puff, setPuff] = useState(0);
  const [lines, setLines] = useState<string[]>([]), [awake, setAwake] = useState(false), [earned, setEarned] = useState(false);
  const roost = player.state.value.roost, d = riding(roost);
  useEffect(() => {
    void playMoments([
      async () => {
        await voice.wait(500); // the dragon flies in
        for (let k = 1; k <= r.earned && voice.active; k++) { setPuff(k); sWhoosh(.25); await voice.wait(180); setPile(r.beforeBalance + k); setBump(true); await voice.wait(160); setBump(false); }
        await voice.say(earnedLine(CUR, r.earned));
        if (r.results.some(o => o !== 'clean') && voice.active) { sChime(); setLines(ls => [...ls, 'You kept trying!']); await voice.say('You kept trying!'); }
        if (voice.active) { sChime(); setEarned(true); await voice.say('You earned a Flight!'); }
        if (voice.active && roost.eggs.length) await voice.say('Your eggs got warmer!');
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
    ], voice.signal).then(res => { if (res !== 'cancelled' && voice.active) { setAwake(true); void voice.say('Tap Fly!'); } });
    return () => voice.cancel();
  }, []);
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  return (
    <div class="reward dr-reward">
      <h2>Round done!</h2>
      <div class="dr-end-row">
        <div class="dr-end-dragon" aria-hidden="true"><DragonCanvas look={lookOf(d)} opts={{ act: 'flap', open: puff > 0 && pile < r.afterBalance, flap: 2.5 }} /></div>
        <div class="bigpile">
          {puff > 0 && pile < r.afterBalance && <span key={puff} class="dr-puff" aria-hidden="true"><CurrencyIcon kind={CUR} size={40} /></span>}
          <CurrencyIcon kind={CUR} size={80} /><span class={bump ? 'bump' : ''}>{pile}</span>
        </div>
      </div>
      {earned && <div class="earned-race"><MyDragon /> +1 Flight</div>}
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class="big-btn garage dr-roost-btn" aria-label="Roost" onClick={go(onRoost)}><span class="e">🏔️</span><span class="btn-word">Roost</span></button>
        <button class={`big-btn go race-btn dr-fly-btn ${awake ? 'pulse' : ''}`} aria-label="Fly" onClick={go(onFly)}>
          <span class="race-flag" aria-hidden="true"><MyDragon /></span>
          <span class="race-word">Fly</span>
          <span class="race-count">{roost.flights}</span>
        </button>
        <button class="big-btn go again second" aria-label="Play again" onClick={go(onAgain)}><span class="e">▶</span></button>
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} onClick={go(onHome)}>🏠</IconButton>
    </div>
  );
}
