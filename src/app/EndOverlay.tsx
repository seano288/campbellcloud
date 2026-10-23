// End of a Round: the Truck show plays every moment, then 🔧 Garage, ▶ Play again and 🏠 wake up. After the first
// second a tap anywhere skips the rest of the show: the pile jumps to its total, every line is shown, and the buttons wake.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { playRoundShow, type RoundShowFacts } from '../celebrate/roundShow';
import { eventLines, smallestFirst } from '../round/events';
import { Bolt, IconButton, TruckArt } from '../ui/bits';
import type { Phrase } from '../voice/phrases';
import { useVoiceScope } from '../voice/context';
import { createVoiceScope } from '../voice/say';
import { earnedBolts } from './presentationPhrases';

/** How long the show plays before a tap can skip it. */
const SKIP_AFTER_MS = 1000;

const allLines = (r: RoundShowFacts): Phrase[] => [
  earnedBolts(r.earned),
  ...smallestFirst(r.events).flatMap(eventLines),
  ...(r.canBuild ? ['You can build something new!' as const] : []),
];

export function EndOverlay({ result: r, hasAffordable, color, onGarage, onAgain, onHome }: {
  result: RoundShowFacts & { readonly beforeBalance: number; readonly afterBalance: number };
  hasAffordable: boolean;
  color: string;
  onGarage(): void;
  onAgain(): void;
  onHome(): void;
}) {
  const voice = useVoiceScope();
  const show = useMemo(() => createVoiceScope(voice.signal), [voice]); // its own scope, so skipping it leaves the buttons' voice alive
  const [skippable, setSkippable] = useState(false);
  const [pile, setPile] = useState(r.beforeBalance);
  const [bump, setBump] = useState(false);
  const [lines, setLines] = useState<Phrase[]>([]);
  const [awake, setAwake] = useState(false);
  const els = { reward: useRef<HTMLDivElement>(null), moment: useRef<HTMLDivElement>(null), truck: useRef<HTMLDivElement>(null), load: useRef<HTMLDivElement>(null), pile: useRef<HTMLDivElement>(null) };

  useEffect(() => {
    let alive = true;
    let bumpTimer: ReturnType<typeof setTimeout>;
    const skipTimer = setTimeout(() => { if (alive && show.active) setSkippable(true); }, SKIP_AFTER_MS);
    void playRoundShow({
      voice: show,
      reward: els.reward.current!, moment: els.moment.current!, truck: els.truck.current!, load: els.load.current!, pile: els.pile.current!,
      bump: n => { setPile(n); setBump(true); clearTimeout(bumpTimer); bumpTimer = setTimeout(() => { if (alive && voice.active) setBump(false); }, 150); },
      line: p => setLines(ls => [...ls, ...p]),
      alive: () => alive && show.active,
    }, r, r.afterBalance).then(result => {
      if (result !== 'cancelled' && alive && voice.active) { clearTimeout(bumpTimer); setBump(false); setAwake(true); }
    });
    return () => { alive = false; clearTimeout(bumpTimer); clearTimeout(skipTimer); voice.cancel(); };
  }, []);

  function skip() {
    if (awake || !skippable || !voice.active) return;
    show.cancel();
    els.load.current!.style.visibility = 'hidden';
    setBump(false);
    setPile(r.afterBalance);
    setLines(allLines(r));
    setAwake(true);
  }

  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  return (
    <div class={`reward ${awake ? '' : 'playing'}`} ref={els.reward} onClick={skip}>
      <h2>Round done!</h2>
      <div class="bigpile" ref={els.pile}><Bolt size={80} /><span class={bump ? 'bump' : ''}>{pile}</span></div>
      <div class="moment" ref={els.moment}>
        <div class="road" />
        <div class="ctruck" ref={els.truck}>
          <TruckArt color={color} />
          <div class="load" ref={els.load}>{Array.from({ length: r.earned }, (_, i) => <Bolt key={i} size={r.earned > 3 ? 17 : 34} />)}</div>
        </div>
      </div>
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class={`big-btn garage ${awake && hasAffordable ? 'pulse' : ''}`} aria-label="Garage" onClick={go(onGarage)}><span class="e">🔧</span></button>
        <button class="big-btn go" aria-label="Play again" onClick={go(onAgain)}><span class="e">▶</span></button>
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} onClick={go(onHome)}>🏠</IconButton>
    </div>
  );
}
