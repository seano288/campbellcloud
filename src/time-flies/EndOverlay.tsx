// End of a Round: his plane flies in carrying the Bolts he earned, they drop onto his pile one by one, then each Level up,
// newly opened mode, star and Trophy is announced. Only then do 🛩 Hangar, ▶ Play again and 🏠 wake up. A tap anywhere
// skips to the end of the show (he's heard it before), with every line written out and the Bolts on the pile.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sWhoosh } from '../audio/sfx';
import { confetti } from '../celebrate/effects';
import { playMoments } from '../celebrate/sequence';
import { Bolt, IconButton } from '../ui/bits';
import { player } from './game';
import { JetArt } from './hangar/JetArt';
import { MODE_NAMES } from './learning';
import { earnedBolts, type Phrase } from './phrases';
import type { Round, RoundEvent } from './round';
import { earnedTrophy } from './trophies';
import { reducedMotion } from './motion';
import { createVoiceScope, useVoiceScope } from './voice';

const order = (e: RoundEvent) => (e.kind === 'trophy' ? 4 : e.kind === 'star' ? 3 : 2);
function eventLines(e: RoundEvent): Phrase[] {
  if (e.kind === 'trophy') return [earnedTrophy(e.step)];
  if (e.kind === 'levelUp') return ['Level up!'];
  if (e.kind === 'star') return [`You are a ${MODE_NAMES[e.mode]} star!`];
  return [`You opened ${MODE_NAMES[e.mode]}!`];
}

export function EndOverlay({ result: r, hasAffordable, onHangar, onAgain, onHome }: {
  result: Round; hasAffordable: boolean; onHangar(): void; onAgain(): void; onHome(): void;
}) {
  const voice = useVoiceScope();
  const [pile, setPile] = useState(r.beforeBalance);
  const [bump, setBump] = useState(false);
  const [lines, setLines] = useState<Phrase[]>([]);
  const [awake, setAwake] = useState(false);
  const [flying, setFlying] = useState(false);
  const jet = player.state.value.hangar.jet ?? 'p51';
  const plane = useRef<HTMLDivElement>(null);
  const show = useMemo(() => createVoiceScope(voice.signal), [voice]); // the show alone, so skipping it keeps the buttons
  const ordered = [...r.events].sort((a, b) => order(a) - order(b));
  const allLines: Phrase[] = [...ordered.flatMap(eventLines), ...(r.canBuild ? ['You can build something new!' as const] : [])];
  useEffect(() => {
    const calm = reducedMotion();
    void playMoments([
      async signal => { setFlying(true); sWhoosh(1.1); await show.wait(calm ? 300 : 1100); void signal; },
      async () => {
        for (let k = 1; k <= r.earned && show.active; k++) { setPile(r.beforeBalance + k); setBump(true); sClink(); await show.wait(160); setBump(false); await show.wait(90); }
        await show.say(earnedBolts(r.earned));
      },
      async () => {
        for (const e of ordered) {
          if (!show.active) return;
          const said = eventLines(e);
          setLines(ls => [...ls, ...said]);
          if (e.kind === 'trophy' || e.kind === 'levelUp') { sFanfare(); if (!calm) confetti(30, show.signal); } else sChime();
          await show.say(...said);
        }
        if (r.canBuild && show.active) { setLines(ls => [...ls, 'You can build something new!']); await show.say('You can build something new!'); }
      },
    ], show.signal).then(result => { if (result !== 'cancelled' && voice.active) setAwake(true); });
    return () => voice.cancel();
  }, []);
  function skip() {
    if (awake || !voice.active) return;
    show.cancel();
    setFlying(true); setBump(false); setPile(r.beforeBalance + r.earned); setLines(allLines); setAwake(true);
  }
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  return (
    <div class="reward" onClick={skip}>
      <h2>Round done!</h2>
      <div class="bigpile"><Bolt size={80} /><span class={bump ? 'bump' : ''}>{pile}</span></div>
      <div class="moment">
        <div ref={plane} class={`flyby ${flying ? 'go' : ''}`}>
          <JetArt jet={jet} color="#e6ebf0" />
          <div class="load">{Array.from({ length: r.earned }, (_, i) => <Bolt key={i} size={26} />)}</div>
        </div>
      </div>
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class={`big-btn garage ${awake && hasAffordable ? 'pulse' : ''}`} aria-label="Hangar" disabled={!awake} onClick={go(onHangar)}><JetArt jet={jet} color="#5b6573" class="btn-jet" /></button>
        <button class="big-btn go" aria-label="Play again" disabled={!awake} onClick={go(onAgain)}><span class="e">▶</span></button>
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} disabled={!awake} onClick={go(onHome)}>🏠</IconButton>
    </div>
  );
}
