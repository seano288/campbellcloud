// A Rescue, the reward. The radio crackles with the call ("A sea turtle is caught in a fishing net!") over a picture of the animal
// and where it is. He taps Go, then drives the truck himself (hold to drive, ⤴ to jump) over mud, streams, logs and rocks that slow
// or bounce it but never stop it, picking up Bolts. At the animal he does one hands-on job: pulls the net off, winches it out of the
// hole, or leads it to the crate with treats. Into the crate it goes and the truck drives home on its own; the Park opens with the
// animal in his hands. A release (once every animal he can reach is home) ends with the animal going back to the wild instead.
//
// The call is used, and the Bolts paid, only when the job is done. Leaving halfway (🏠 twice) costs nothing and pays nothing.
// Controls stay clear of the bottom edge and the sides, which belong to iPadOS. Keys work on a computer: → to drive, space to jump.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sBoing, sChime, sClink, sCrunch, sFanfare, sHonk, sPop, sSiren, sThud, sWhoosh } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { AnimalPic, HabitatArt, TruckView } from '../art/Pics';
import { RESCUE_CURRENCY } from '../branding';
import { animal, rescuable } from '../facts/animals';
import { player, settleRescue } from '../game';
import { goRescue, rescueCall, screen } from '../nav';
import type { RescuePay } from '../park/rescue';
import { truckFor } from '../park/rescue';
import { rungOf } from '../park/shop';
import type { Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { createDrive, END_X, progress, START_X, stepDrive, type Drive } from './drive';
import { drawDrive } from './draw';
import { createJob, done, drag, feed, tapNet, TREATS, winch, type JobState } from './jobs';

type Phase = 'call' | 'drive' | 'job' | 'loaded' | 'home' | 'end';
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const HOME_S = 2.6;

/** Runs a loop on a canvas sized to its box: `step` advances the world by dt, `draw` paints it. */
function useCanvasLoop(ref: { current: HTMLCanvasElement | null }, run: boolean, step: (dt: number) => void, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const latest = useRef({ step, draw });
  latest.current = { step, draw };
  useEffect(() => {
    if (!run) return;
    const canvas = ref.current!, c = canvas.getContext('2d')!;
    let raf = 0, last = 0;
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(.05, (ms - last) / 1000) : 0;
      last = ms;
      if (document.hidden) return;
      const box = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      latest.current.step(dt);
      c.setTransform(1, 0, 0, 1, 0, 0);
      latest.current.draw(c, w, h);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [run]);
}

/** Lines that don't matter are dropped while he's mid-sentence, so the voice never queues up behind the action. */
function chatter(voice: VoiceScope) {
  let talking = false;
  return (...line: Phrase[]) => { if (talking) return; talking = true; void voice.say(...line).then(() => { talking = false; }); };
}

export function RescueScreen() {
  const voice = useVoiceScope(), state = player.state.value, call = rescueCall.value, a = rescuable(call.animal), home = a.home;
  const truck = truckFor(state.rescue, call.animal), first = state.rescue.trips === 0, release = call.kind === 'release';
  const [phase, setPhase] = useState<Phase>('call'), [armed, setArmed] = useState(false), [pay, setPay] = useState<RescuePay | null>(null);
  const [bolts, setBolts] = useState(0), [job, setJob] = useState<JobState>(() => createJob(a.rescue.job, rungOf(truck, 'winch')));
  const canvas = useRef<HTMLCanvasElement>(null), bar = useRef<HTMLElement>(null);
  const drive = useRef<Drive>(createDrive(home, rungOf(truck, 'tires')));
  const holding = useRef(false), keys = useRef(new Set<string>()), jump = useRef(false), homeT = useRef(0), frames = useRef(0);
  const say = useRef(chatter(voice)).current;

  useEffect(() => { sSiren(); void voice.say('Calling all rangers!', a.rescue.call as Phrase); }, []);
  // the browser tour reads how far the Rescue has got (tools/wild-rescue/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __rescue(): unknown }).__rescue = () => ({ phase, x: drive.current.x, t: drive.current.t, frames: frames.current, job });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') { keys.current.add(k); if (k === ' ' && !e.repeat) jump.current = true; } else keys.current.delete(k);
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    // Safari's own touch handling stays out of the way: no scroll, zoom or callout while he drives
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas,.rs-ctl,.job-area')) e.preventDefault(); };
    const root = document.querySelector('.rescue-screen');
    root?.addEventListener('touchstart', hold as EventListener, { passive: false });
    root?.addEventListener('touchmove', hold as EventListener, { passive: false });
    return () => { removeEventListener('keydown', key); removeEventListener('keyup', key); root?.removeEventListener('touchstart', hold as EventListener); root?.removeEventListener('touchmove', hold as EventListener); };
  }, []);

  function go() {
    if (!voice.active || phase !== 'call') return;
    sHonk(); sWhoosh(.8);
    setPhase('drive');
    void voice.say(...(first ? ['Hold to drive!', 'Tap the button to jump!'] as const : ['Hold to drive!'] as const));
  }

  // the drive out
  useCanvasLoop(canvas, phase === 'drive' || phase === 'job' || phase === 'loaded', dt => {
    if (phase !== 'drive') return;
    const d = drive.current;
    frames.current++;
    stepDrive(d, dt, holding.current || keys.current.has('arrowright') || keys.current.has('d'), jump.current);
    jump.current = false;
    for (const e of d.events) {
      if (e === 'jump') sBoing();
      if (e === 'bump') { sThud(); say('Bump!'); }
      if (e === 'splash') { sWhoosh(.5); say('Splash!'); }
      if (e === 'bolt') { sChime(); setBolts(d.got); say(d.got === 1 ? 'A Bolt!' : 'Grab the Bolts!'); }
      if (e === 'arrive') {
        holding.current = false;
        sFanfare();
        setPhase('job');
        void voice.say('You found it!', a.rescue.job === 'pull' ? 'Pull the net off!' : a.rescue.job === 'lift' ? 'Tap the winch to lift it out!' : 'Tap the treats to lead it to the crate!');
      }
    }
    if (bar.current) bar.current.style.transform = `scaleX(${progress(d)})`;
  }, (c, w, h) => drawDrive(c, drive.current, w, h, truck, home, call.animal, { animalAtEnd: phase === 'drive', reduced: reduced() }));

  // the drive home: the truck turns round and goes back on its own, the animal riding in the crate
  useCanvasLoop(canvas, phase === 'home', dt => {
    homeT.current += dt;
    if (homeT.current >= HOME_S) { setPhase('end'); if (!release) screen.value = 'park'; }
  }, (c, w, h) => drawDrive(c, drive.current, w, h, truck, home, call.animal, {
    animalAtEnd: false, homeX: END_X - (END_X - START_X) * Math.min(1, homeT.current / HOME_S) ** 1.4, rider: !release, reduced: reduced(),
  }));

  /** The job is done: into the crate (or back to the wild), the call is used and the Bolts paid. */
  function finish() {
    setPhase('loaded');
    const paid = settleRescue(player, call, drive.current.got);
    setPay(paid);
    void (async () => {
      sPop(); confetti(40, voice.signal);
      await voice.say(...(release ? ['This one is going back to the wild.', 'Back to the wild!'] as const : ['Into the crate!', 'You did it!'] as const));
      if (paid) await voice.say(earnedLine(RESCUE_CURRENCY, paid.bolts));
      if (!voice.active) return;
      if (release) { setPhase('end'); return; }
      sHonk();
      void voice.say('Time to go home!');
      setPhase('home');
    })();
  }
  function act(next: JobState, line?: Phrase) {
    if (phase !== 'job' || done(job)) return;
    setJob(next);
    if (done(next)) { sFanfare(); finish(); return; }
    if (line) say(line);
  }

  const leave = () => {
    if (!voice.active) return;
    if (phase === 'end' || phase === 'home' || armed) { screen.value = release || phase === 'call' || phase === 'drive' || phase === 'job' ? 'garage' : 'park'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const down = (e: PointerEvent) => { canvas.current?.setPointerCapture(e.pointerId); if (phase === 'drive') holding.current = true; };
  const up = () => { holding.current = false; };
  const after = player.state.value.rescue;

  return (
    <div class={`rescue-screen ${phase}`} data-phase={phase}>
      <canvas ref={canvas} class="rs-canvas" aria-label={`Your truck driving to the ${a.name}`} onPointerDown={down} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} />
      <header class="rs-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        <span class="rs-to"><AnimalPic id={call.animal} />{a.name}</span>
        {phase === 'drive' && <span class="rs-count" aria-label={`${bolts} Bolts`}><CurrencyIcon kind={RESCUE_CURRENCY} size={26} />{bolts}/4</span>}
      </header>
      {phase === 'drive' && <div class="rs-progress" aria-hidden="true"><i ref={bar} /><span>🚩</span></div>}
      {phase === 'drive' && <div class="drive-hint" aria-hidden="true">👆 hold to drive</div>}
      {phase === 'drive' && (
        <div class="rs-ctl right"><button class={`ctl jump ${first ? 'teach' : ''}`} aria-label="Jump" onPointerDown={e => { e.preventDefault(); e.stopPropagation(); jump.current = true; }}>⤴</button></div>
      )}
      {phase === 'call' && (
        <div class="rs-call" role="dialog" aria-label="A rescue call">
          <div class="call-card">
            <div class="radio" aria-hidden="true">📻<span class="waves">)))</span></div>
            <p class="call-line">{a.rescue.call}</p>
            <div class="call-pic"><HabitatArt id={home} /><AnimalPic id={call.animal} class="call-animal" label={a.name} /></div>
            <button class="big-btn go go-btn pulse" aria-label="Go" onClick={go}><span class="e">🚨</span>Go!</button>
          </div>
        </div>
      )}
      {(phase === 'job' || phase === 'loaded') && <JobArea job={job} who={call.animal} snack={a.snack} release={release} loaded={phase === 'loaded'}
        onDrag={share => act(drag(job as never, share))} onNet={() => act(tapNet(job as never), 'Keep pulling!')}
        onWinch={() => { sClink(); act(winch(job as never), 'Keep winching!'); }}
        onTreat={i => { if (job.kind === 'lead' && i === job.eaten) { sCrunch(); act(feed(job, i), 'Yum!'); } }} />}
      {phase === 'end' && release && (
        <div class="rs-result" role="dialog"><div class="result-card">
          <h2>Back to the wild!</h2>
          <div class="wild-off"><HabitatArt id={home} /><AnimalPic id={call.animal} class="runs-off" /></div>
          {pay && <div class="result-bolts"><CurrencyIcon kind={RESCUE_CURRENCY} size={40} />+{pay.bolts}</div>}
          <div class="btns">
            <button class="big-btn garage" aria-label="Park" onClick={() => { if (voice.active) screen.value = 'park'; }}><span class="e">🌳</span></button>
            <button class="big-btn garage my-truck" aria-label="Garage" onClick={() => { if (voice.active) screen.value = 'garage'; }}><TruckView truck={after.truck} label={null} /></button>
            {after.calls > 0
              ? <button class="big-btn go" aria-label="Rescue again" onClick={() => { if (voice.active) goRescue(); }}><span class="e">📻</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}

/** The job, close up, over the scene: the net to drag off, the hole and its winch, or the treats on the way to the crate. */
function JobArea({ job, who, snack, release, loaded, onDrag, onNet, onWinch, onTreat }: {
  job: JobState; who: Parameters<typeof AnimalPic>[0]['id']; snack: string; release: boolean; loaded: boolean;
  onDrag(share: number): void; onNet(): void; onWinch(): void; onTreat(i: number): void;
}) {
  const area = useRef<HTMLDivElement>(null), from = useRef<number | null>(null), moved = useRef(false);
  const width = () => area.current?.getBoundingClientRect().width || 400;
  const pic = <AnimalPic id={who} class="job-animal" label={animal(who).name} />;
  return (
    <div class={`job-area job-${job.kind} ${loaded ? 'loaded' : ''} ${release ? 'release' : ''}`} ref={area}>
      {job.kind === 'pull' && (
        <div class="job-stage">
          {pic}
          {job.pulled < 1 && <button class="net" aria-label="The net" style={{ transform: `translateX(${job.pulled * 110}%) rotate(${job.pulled * 25}deg)`, opacity: 1 - job.pulled * .6 }}
            onPointerDown={e => { (e.currentTarget as Element).setPointerCapture(e.pointerId); from.current = e.clientX; moved.current = false; }}
            onPointerMove={e => { if (from.current === null) return; const dx = e.clientX - from.current; if (Math.abs(dx) > 6) { moved.current = true; from.current = e.clientX; onDrag(Math.abs(dx) / (width() * .6)); } }}
            onPointerUp={() => { if (!moved.current) onNet(); from.current = null; }}>
            <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M5 10 L95 10 L95 95 L5 95 Z M5 30 H95 M5 50 H95 M5 70 H95 M25 10 V95 M45 10 V95 M65 10 V95 M85 10 V95" fill="none" stroke="#2a6f9f" stroke-width="4" /></svg>
          </button>}
          {!loaded && <div class="job-tip" aria-hidden="true">👉 drag</div>}
        </div>
      )}
      {job.kind === 'lift' && (
        <div class="job-stage">
          <div class="hole" aria-hidden="true" />
          <div class="rope" aria-hidden="true" style={{ height: `${70 - job.height * 50}%` }} />
          <div class="lifted" style={{ transform: `translateY(${(1 - job.height) * 48}%)` }}>{pic}</div>
          {!loaded && <button class="big-btn go winch-btn pulse" aria-label="Winch" onClick={onWinch}><span class="e">🪝</span>{job.taps}/{job.need}</button>}
        </div>
      )}
      {job.kind === 'lead' && (
        <div class="job-stage lead-row">
          <div class="leader" style={{ left: `${8 + (job.eaten / TREATS) * 70}%` }}>{pic}</div>
          {Array.from({ length: TREATS }, (_, i) => (
            <button key={i} class={`treat ${i < job.eaten ? 'eaten' : i === job.eaten ? 'next pulse' : ''}`} style={{ left: `${30 + i * 20}%` }} aria-label={`Treat ${i + 1}`} onClick={() => onTreat(i)}>{snack}</button>
          ))}
          {!release && <div class="crate" aria-hidden="true">📦</div>}
        </div>
      )}
      {loaded && !release && <div class="into-crate" aria-hidden="true">📦</div>}
    </div>
  );
}
