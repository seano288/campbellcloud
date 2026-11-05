// The fight: a dark stage that the 3D chunk fills once it has loaded, the TV scoreboard on top of it, and a commentator. It's loaded
// here, by dynamic import, so nothing before this screen pays for three.js, Rapier or the textures. If the chunk can't load or the
// device can't run it (stage.ts gives up), the plain outcome still gives him the win and takes him back. He leaves with two taps at
// any time, like a Round's home button; that frees everything, and a fight he paid for and didn't see end stays his.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sCheer, sFanfare } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { player } from '../game';
import { screen } from '../nav';
import type { Phrase } from '../phrases';
import { preload, useVoiceScope, type VoiceScope } from '../voice';
import { fightSeen } from '../workshop/actions';
import { lookOf } from '../workshop/catalog';
import { TorqueArt } from '../workshop/TorqueArt';
import { seedFor } from '../workshop/workshop';
import { openingRung } from './detail';
import type { Cue, FightRun } from './stage';

type Phase = 'warming' | 'live' | 'won' | 'result' | 'plain';
/** The fight's chunk, textures and first frame get this long before he gets the plain outcome instead. */
const LOAD_LIMIT_MS = 75000;
const HITS: Phrase[] = ['What a hit!', 'Big hit!', 'Anvil is sent spinning!'];

/** Keeps the commentator from talking over himself: a line that doesn't matter is dropped if he's mid-sentence. */
function commentator(voice: VoiceScope) {
  let talking = false;
  const speak = (lines: Phrase[], must: boolean) => {
    if (talking && !must) return;
    talking = true;
    void voice.say(...lines).then(() => { talking = false; });
  };
  return { say: (...lines: Phrase[]) => speak(lines, false), must: (...lines: Phrase[]) => speak(lines, true) };
}

export function FightScreen() {
  const voice = useVoiceScope();
  const host = useRef<HTMLDivElement>(null), barT = useRef<HTMLElement>(null), barA = useRef<HTMLElement>(null), tag = useRef<HTMLSpanElement>(null);
  const load = useRef<HTMLDivElement>(null), run = useRef<FightRun | null>(null), disarm = useRef(0);
  const [phase, setPhase] = useState<Phase>('warming'), [banner, setBanner] = useState<string | null>(null), [armed, setArmed] = useState(false);

  useEffect(() => {
    const state = player.state.peek().workshop, { say, must } = commentator(voice);
    // `settled`: he got the plain outcome, and that's final. Whatever arrives after it, a late chunk or a late stage, must not act.
    let gone = false, settled = false, hits = 0, timer = 0;
    const arm = () => { timer = window.setTimeout(plain, LOAD_LIMIT_MS); };
    // CSS moves the bar, off the main thread, so a `blind` stretch still creeps forward while the build has the main thread blocked.
    const progress = (to: number, blind = false) => {
      const el = load.current;
      if (!el) return;
      el.style.setProperty('--t', blind ? '16s' : '.4s');
      el.style.setProperty('--f', to.toFixed(3));
      el.setAttribute('aria-valuenow', String(Math.round(to * 100)));
    };
    const plain = () => {
      if (gone || settled) return;
      settled = true;
      clearTimeout(timer);
      void run.current?.close();
      run.current = null;
      setPhase('plain');
      sFanfare();
      confetti(50, voice.signal);
      void voice.say('The arena lights are off today.', 'Torque won anyway!');
    };
    function cue(c: Cue) {
      if (gone || settled) return;
      if (c.kind === 'open') { setPhase('live'); must('Welcome to robot combat!', 'Torque and Anvil are in the arena!'); }
      else if (c.kind === 'go') must('Go!');
      else if (c.kind === 'spinup') say('The drum is spinning up!');
      else if (c.kind === 'drum') say(c.strength > .75 ? 'Anvil is sent spinning!' : HITS[hits++ % 2]!);
      else if (c.kind === 'hammer') say('Anvil swings the hammer!', 'Torque is still going!');
      else if (c.kind === 'panel-off') say('A plate came off!');
      else if (c.kind === 'wheel-off') say('A wheel came off!');
      else if (c.kind === 'ko') {
        fightSeen(); // the Bolts were spent on seeing this
        setBanner(c.how === 'stopped' ? 'ANVIL STOPPED' : 'ANVIL KNOCKED OUT');
        setPhase('won');
        must(c.how === 'stopped' ? 'Anvil is stopped!' : 'Anvil is knocked out!', 'Torque wins!');
        sCheer();
      }
      else if (c.kind === 'replay') { setBanner(null); say("Here's the replay!"); }
      else if (c.kind === 'result') { setPhase('result'); sFanfare(); confetti(50, voice.signal); must('Great fight!'); }
    }
    arm();
    progress(.26, true); // the chunk: an import can't say how far along it is, and on a first visit it's a quarter of the download
    void voice.say('Fight!', 'Warming up the arena.');
    preload(['Welcome to robot combat!', 'Torque and Anvil are in the arena!', 'Go!', 'Anvil is knocked out!', 'Torque wins!']); // no gap when it opens
    import('./stage').then(({ openFight }) => {
      if (gone || settled) return;
      run.current = openFight(host.current!, {
        look: lookOf(state.gear), seed: seedFor(state.fights), rung: openingRung(), cue, progress, onFailed: plain,
        hud(t, a, replay) {
          if (settled) return;
          if (barT.current) barT.current.style.transform = `scaleX(${t})`;
          if (barA.current) barA.current.style.transform = `scaleX(${a})`;
          if (tag.current) { tag.current.className = `fight-tag ${replay ? 'rep' : ''}`; tag.current.textContent = replay ? 'REPLAY' : 'LIVE'; }
        },
        busy(on) {
          if (settled) return;
          setPhase(p => (on && p === 'live' ? 'warming' : !on && p === 'warming' ? 'live' : p));
          // A rebuild in the middle of the fight gets the same limit as the first build, so it can't leave him at the bar for good.
          if (!on) { clearTimeout(timer); timer = 0; } else if (!timer) arm();
        },
      });
    }).catch(e => { console.warn('Math Bots: the fight chunk would not load', e); plain(); }); // offline before it was cached, or an update took it away
    return () => {
      gone = true;
      clearTimeout(timer); clearTimeout(disarm.current);
      void run.current?.close();
      run.current = null;
    };
  }, []);

  const back = () => { screen.value = 'reward'; };
  function leave() {
    if (!voice.active) return;
    if (armed || phase === 'result' || phase === 'plain') { back(); return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    clearTimeout(disarm.current);
    disarm.current = window.setTimeout(() => setArmed(false), 4000);
  }
  function charge() {
    if (!voice.active) return;
    run.current?.charge();
    void voice.sayMore('Charge!');
  }

  if (phase === 'plain') {
    return (
      <div class="screen fight-screen plain" data-phase="plain">
        <h1>Torque wins!</h1>
        <TorqueArt gear={player.state.value.workshop.gear} class="workshop-bot" />
        <button class="big-btn garage" aria-label="Workshop" onClick={back}><span class="e">🤖</span></button>
      </div>
    );
  }
  return (
    <div class="screen fight-screen" data-phase={phase}>
      <div class="fight-stage" ref={host} />
      <div class="fight-warm" hidden={phase !== 'warming'}>
        <div class="fight-load" ref={load} role="progressbar" aria-label="Warming up the arena" aria-valuemin={0} aria-valuemax={100}>
          <div class="track"><i /></div>
          <div class="rider"><span class="gear">⚙️</span></div>
        </div>
      </div>
      <div class="fight-top">
        <IconButton label={armed ? 'Tap again to leave' : 'Workshop'} class={armed ? 'armed' : ''} onClick={leave}>🤖</IconButton>
        <div class="fight-bars" aria-hidden="true">
          <div class="t"><b>TORQUE</b><u><i ref={barT} /></u></div>
          <div class="a"><b>ANVIL</b><u><i ref={barA} /></u></div>
        </div>
        <span class="fight-tag" ref={tag}>LIVE</span>
      </div>
      {banner && <div class="fight-banner">TORQUE WINS<small>{banner}</small></div>}
      {phase === 'live' && <button class="fight-charge" aria-label="Charge" onClick={charge}>💥</button>}
      {phase === 'result' && (
        <div class="fight-result">
          <h2>🏆 Torque wins!</h2>
          <div class="btns">
            <button class="big-btn garage" aria-label="Workshop" onClick={back}><span class="e">🤖</span></button>
            <button class="big-btn go" aria-label="Watch again" onClick={() => { if (voice.active) { run.current?.watchAgain(); setPhase('won'); } }}><span class="e">🔁</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
