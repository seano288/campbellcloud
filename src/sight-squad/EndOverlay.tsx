// End of a Round: a few of his soldiers march in carrying the Ammo he earned, they drop onto his pile one by one (the squad
// hops as each one lands, and its load gets lighter), a round
// where he had to try again says he kept trying, then each Level up, newly opened kind, star and Trophy is announced. Only then
// do ⛺ Camp, ▶ Play again and 🏠 wake up.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare } from '../audio/sfx';
import { sMarch } from './camp/sounds';
import { confetti } from '../celebrate/effects';
import { playMoments } from '../celebrate/sequence';
import { earnedLine } from '../currency/kind';
import { IconButton } from '../ui/bits';
import { CurrencyIcon } from '../ui/currency';
import { SQUAD_CURRENCY } from './branding';
import { player } from './game';
import { colourHex } from './camp/actions';
import { Squad } from './camp/UnitArt';
import { MODE_NAMES } from './learning';
import type { Phrase } from './phrases';
import type { Round, RoundEvent } from './round';
import { earnedTrophy } from './trophies';
import { useVoiceScope } from './voice';

const order = (e: RoundEvent) => (e.kind === 'trophy' ? 4 : e.kind === 'star' ? 3 : 2);
function eventLines(e: RoundEvent): Phrase[] {
  if (e.kind === 'trophy') return [earnedTrophy(e.step)];
  if (e.kind === 'levelUp') return ['Level up!'];
  if (e.kind === 'star') return [`You are a ${MODE_NAMES[e.mode]} star!`];
  return [`You opened ${MODE_NAMES[e.mode]}!`];
}

export function EndOverlay({ result: r, hasAffordable, onCamp, onAgain, onHome }: {
  result: Round; hasAffordable: boolean; onCamp(): void; onAgain(): void; onHome(): void;
}) {
  const voice = useVoiceScope();
  const [pile, setPile] = useState(r.beforeBalance);
  const [bump, setBump] = useState(false);
  const [lines, setLines] = useState<Phrase[]>([]);
  const [awake, setAwake] = useState(false);
  const [flying, setFlying] = useState(false);
  const colour = colourHex(player.state.value.camp);
  const plane = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void playMoments([
      async signal => { setFlying(true); sMarch(); await voice.wait(1100); void signal; },
      async () => {
        for (let k = 1; k <= r.earned && voice.active; k++) { setPile(r.beforeBalance + k); setBump(true); sClink(); await voice.wait(160); setBump(false); await voice.wait(90); }
        await voice.say(earnedLine(SQUAD_CURRENCY, r.earned));
        if (r.results.some(o => o !== 'clean') && voice.active) { sChime(); setLines(ls => [...ls, 'You kept trying!']); await voice.say('You kept trying!'); }
      },
      async () => {
        for (const e of [...r.events].sort((a, b) => order(a) - order(b))) {
          if (!voice.active) return;
          const said = eventLines(e);
          setLines(ls => [...ls, ...said]);
          if (e.kind === 'trophy' || e.kind === 'levelUp') { sFanfare(); confetti(30, voice.signal); } else sChime();
          await voice.say(...said);
        }
        if (r.canBuild && voice.active) { setLines(ls => [...ls, 'You can build something new!']); await voice.say('You can build something new!'); }
      },
    ], voice.signal).then(result => { if (result !== 'cancelled' && voice.active) setAwake(true); });
    return () => voice.cancel();
  }, []);
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  return (
    <div class="reward">
      <h2>Round done!</h2>
      <div class="bigpile"><CurrencyIcon kind={SQUAD_CURRENCY} size={80} /><span class={bump ? 'bump' : ''}>{pile}</span></div>
      <div class="moment">
        <div ref={plane} class={`marchby ${flying ? 'go' : ''} ${bump ? 'hop' : ''}`}>
          <Squad colour={colour} count={Math.min(5, 1 + Math.floor(r.earned / 2))} />
          <div class="load">{Array.from({ length: Math.max(0, r.earned - (pile - r.beforeBalance)) }, (_, i) => <CurrencyIcon key={i} kind={SQUAD_CURRENCY} size={26} />)}</div>
        </div>
      </div>
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class={`big-btn garage ${awake && hasAffordable ? 'pulse' : ''}`} aria-label="Camp" onClick={go(onCamp)}><span class="e">⛺</span></button>
        <button class="big-btn go" aria-label="Play again" onClick={go(onAgain)}><span class="e">▶</span></button>
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} onClick={go(onHome)}>🏠</IconButton>
    </div>
  );
}
