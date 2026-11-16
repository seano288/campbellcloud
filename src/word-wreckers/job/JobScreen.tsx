// A Job, the reward. An old building stands on the lot ("An old brick building!"); he picks which of his machines to use (any strong
// enough), knocks it all down (a wrecking ball he pulls back and lets go, a blade he holds to push, a bucket that bites where he taps),
// the dump truck hauls the rubble away, he picks what goes up next from two or three, and lowers its pieces with the crane, moving the
// hook with his finger and letting go. It lands in his Town. Nothing can go wrong: every hit knocks something loose, and every drop lands.
//
// The Job is used, and the Bolts found in the rubble paid, only when the new building is up. Leaving halfway (🏠 twice) costs nothing.
// Every control acts on pointerdown and is big; the canvas takes touch directly (touch-action: none), and nothing here stops touchstart,
// so taps reach the buttons on the iPad. Keys work on a computer: arrows to drive or move the hook, space to swing, bite or drop.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sBoing, sChime, sClink, sCrunch, sEngine, sFanfare, sHonk, sPop, sThud, sWhoosh } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { piecesOf } from '../art/buildings';
import { BuildingView, lookOf, MachineView } from '../art/Pics';
import { ballOf } from '../art/machines';
import { WRECKERS_CURRENCY } from '../branding';
import { player, settleJob } from '../game';
import { eatNextClick, goJob, justBuilt, screen } from '../nav';
import { MATERIAL_LINES, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { building, machine, type MachineId } from '../yard/shop';
import { extrasOf, JOB_BOLTS, nextJob, ownsMachine, powerOf, wreckers, type BuildChoice } from '../yard/yard';
import { createBuild, stepBuild, type Build } from './build';
import { drawBuild, drawWreck, type Puff } from './draw';
import { BOLTS_HIDDEN, createWreck, progress, stepWreck, type Input, type Wreck } from './wreck';

type Phase = 'intro' | 'wreck' | 'clear' | 'choose' | 'build' | 'done';
const HAUL_S = 2.8;
const HINTS: Record<Wreck['action'], Phrase> = { swing: 'Pull the ball back and let go!', push: 'Hold the arrow to push!', bite: 'Tap the building to dig!' };

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
      const t0 = performance.now();
      latest.current.step(dt);
      const t1 = performance.now();
      c.setTransform(1, 0, 0, 1, 0, 0);
      latest.current.draw(c, w, h);
      // the browser tour and the frame-rate check read how long a frame's own work takes
      if (import.meta.env.DEV) { const t = (window as unknown as { __work?: number[][] }); (t.__work ??= []).push([t1 - t0, performance.now() - t1]); if (t.__work.length > 900) t.__work.shift(); }
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

export function JobScreen() {
  const voice = useVoiceScope(), yard = player.state.value.yard, say = useRef(chatter(voice)).current;
  const job = useMemo(() => nextJob(player.state.peek().yard), []);
  const able = useMemo(() => wreckers(yard).filter(m => powerOf(yard, m) >= job.tier), []);
  const [phase, setPhase] = useState<Phase>('intro'), [armed, setArmed] = useState(false);
  const [mach, setMach] = useState<MachineId>(able.includes(yard.machine) ? yard.machine : able[0] ?? 'crane');
  const [choice, setChoice] = useState<BuildChoice | null>(null), [lit, setLit] = useState(-1), [chooseReady, setChooseReady] = useState(false);
  const [bolts, setBolts] = useState(0), [paid, setPaid] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), bar = useRef<HTMLElement>(null);
  const wreck = useRef<Wreck | null>(null), build = useRef<Build | null>(null);
  const input = useRef<Input & { release?: boolean; aim?: number | null }>({}), drive = useRef<-1 | 0 | 1>(0), keys = useRef(new Set<string>());
  const toWorld = useRef<(x: number, y: number) => { x: number; y: number }>(() => ({ x: 0, y: 0 }));
  const puffs = useRef<Puff[]>([]), haul = useRef(0), frames = useRef(0), hinted = useRef(0), press = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const look = lookOf(yard, mach), dumpLook = lookOf(yard, 'dump');

  function makeWreck(m: MachineId) {
    const b = m === 'crane' || m === 'mega' ? ballOf(m, lookOf(yard, m)) : null;
    wreck.current = createWreck(job.tier, job.shape, m, {
      power: powerOf(yard, m), size: 1 + extrasOf(yard, m, 'size') * .35 + (machine(m).power >= 4 ? .3 : 0), speed: 1 + extrasOf(yard, m, 'speed') * .3,
      ball: b ? { len: b.rope, r: b.r } : undefined,
    });
  }
  if (!wreck.current) makeWreck(mach);

  useEffect(() => { sEngine(); void voice.say('A new Job!', MATERIAL_LINES[job.tier - 1]!, ...(able.length > 1 ? ['Pick a machine!' as const] : [])); }, []);
  // the browser tour reads how far the Job has got (tools/word-wreckers/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __job(): unknown }).__job = () => ({
    phase, frames: frames.current, t: wreck.current?.t, action: wreck.current?.action, left: wreck.current ? wreck.current.bricks.filter(b => b.state === 'stand').length : 0,
    bolts: wreck.current?.bolts, k: build.current?.k, n: build.current?.pieces.length, ball: wreck.current?.ball, mx: wreck.current?.mx,
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') { keys.current.add(k); if (k === ' ' && !e.repeat) { if (phase === 'build') input.current.release = true; else if (wreck.current) input.current.tap = { x: wreck.current.mx + 600, y: 420 }; } } else keys.current.delete(k);
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    return () => { removeEventListener('keydown', key); removeEventListener('keyup', key); };
  }, [phase]);

  function go(m: MachineId) {
    if (!voice.active || phase !== 'intro') return;
    if (m !== mach) { setMach(m); makeWreck(m); }
    sHonk();
    setPhase('wreck');
    void voice.say(machine(m).name, 'Knock it down!', HINTS[wreck.current!.action]);
  }

  // ---------- knocking it down ----------
  useCanvasLoop(canvas, phase === 'intro' || phase === 'wreck' || phase === 'clear', dt => {
    const w = wreck.current!;
    puffs.current = puffs.current.map(p => ({ ...p, t: p.t + dt })).filter(p => p.t < (p.bolt ? .9 : .8));
    if (phase === 'clear') {
      haul.current = Math.min(1, haul.current + dt / HAUL_S);
      if (haul.current >= 1) { setPhase('choose'); }
      return;
    }
    if (phase !== 'wreck') return;
    frames.current++;
    const kd: -1 | 0 | 1 = keys.current.has('arrowright') ? 1 : keys.current.has('arrowleft') ? -1 : 0;
    stepWreck(w, dt, { ...input.current, drive: drive.current || kd });
    input.current = { hold: input.current.hold };
    for (const e of w.events) {
      if (e === 'hit') { sThud(); puffs.current.push({ x: w.bricks.find(b => b.state === 'fall')?.x ?? 700, y: 480, t: 0 }); }
      if (e === 'crash') { sCrunch(); say((['Crash!', 'Boom!', 'Smash!'] as const)[Math.floor(Math.random() * 3)]!); puffs.current.push({ x: 720, y: 470, t: 0 }); }
      if (e === 'bump') sBoing();
      if (e === 'swing') sWhoosh(.4);
      if (e === 'bolt') { sChime(); setBolts(w.bolts); say('A Bolt!'); const b = w.bricks.find(x => x.bolt && x.found && x.state !== 'rest'); puffs.current.push({ x: b?.x ?? 700, y: b?.y ?? 420, t: 0, bolt: true }); }
      if (e === 'crumble') sCrunch();
      if (e === 'done') {
        setBolts(w.bolts); sFanfare();
        setPhase('clear');
        void voice.say('The lot is clear!', 'Haul it away!');
        sHonk();
      }
    }
    if (w.idle > 7 && w.t - hinted.current > 9) { hinted.current = w.t; say(HINTS[w.action]); }
    if (bar.current) bar.current.style.transform = `scaleX(${progress(w)})`;
  }, (c, w, h) => {
    const v = drawWreck(c, wreck.current!, w, h, job.tier, look, puffs.current, phase === 'clear' ? { t: haul.current, look: dumpLook } : null);
    toWorld.current = (px, py) => { const r = canvas.current!.getBoundingClientRect(), dpr = w / r.width; return v.toWorld((px - r.left) * dpr, (py - r.top) * dpr); };
  });

  // ---------- choosing what to build ----------
  useEffect(() => {
    if (phase !== 'choose') return;
    const kind = job.choices[0]!.kind;
    void (async () => {
      await voice.say(...(kind === 'new' ? ['What will you build?'] as const : kind === 'gold' ? ['Your Town is full!', 'Make one gold!'] as const : ['Just for fun!', 'What will you build?'] as const));
      for (let i = 0; i < job.choices.length && voice.active; i++) { setLit(i); await voice.say(building(job.choices[i]!.b).name); }
      setLit(-1);
      if (voice.active) setChooseReady(true);
    })();
  }, [phase]);
  function pick(c: BuildChoice) {
    if (!voice.active || phase !== 'choose' || !chooseReady) return;
    setChoice(c);
    const pieces = piecesOf(c.b, c.kind === 'gold');
    build.current = createBuild(pieces, 1 + extrasOf(yard, 'tower', 'speed') * .4);
    sPop();
    setPhase('build');
    void voice.say(building(c.b).name, 'Move the crane, then let go to drop!');
  }

  // ---------- putting it up ----------
  useCanvasLoop(canvas, phase === 'build' || phase === 'done', dt => {
    const b = build.current;
    if (!b || phase !== 'build') return;
    frames.current++;
    const ka = keys.current.has('arrowright') ? b.hookX + 300 : keys.current.has('arrowleft') ? b.hookX - 300 : undefined;
    stepBuild(b, dt, { aim: input.current.aim ?? ka, release: input.current.release });
    input.current.release = false;
    for (const e of b.events) {
      if (e === 'drop') sWhoosh(.3);
      if (e === 'land') { sThud(); sClink(); if (!b.done) say(b.k === b.pieces.length - 1 ? 'One more!' : 'Nice drop!'); }
      if (e === 'done') finish();
    }
  }, (c, w, h) => {
    if (!build.current || !choice) return;
    const v = drawBuild(c, build.current, w, h, choice.b, choice.kind === 'gold', { look: lookOf(yard, ownsMachine(yard, 'tower') ? 'tower' : 'crane'), tower: ownsMachine(yard, 'tower') });
    toWorld.current = (px, py) => { const r = canvas.current!.getBoundingClientRect(), dpr = w / r.width; return v.toWorld((px - r.left) * dpr, (py - r.top) * dpr); };
  });

  function finish() {
    if (!choice) return;
    const ok = settleJob(player, choice);
    setPaid(ok);
    if (choice.kind !== 'fun') justBuilt.value = choice.b;
    setPhase('done');
    void (async () => {
      sFanfare(); confetti(46, voice.signal);
      await voice.say(...(choice.kind === 'gold' ? ['It is gold now!'] as const : ['You built', building(choice.b).name] as const));
      if (ok && voice.active) await voice.say(earnedLine(WRECKERS_CURRENCY, JOB_BOLTS));
      if (voice.active) void voice.say('Off to your Town!');
    })();
  }

  // ---------- touch ----------
  function down(e: PointerEvent) {
    canvas.current?.setPointerCapture(e.pointerId);
    const p = toWorld.current(e.clientX, e.clientY), w = wreck.current;
    press.current = { x: e.clientX, y: e.clientY, moved: false };
    if (phase === 'build') { input.current.aim = p.x; return; }
    if (phase !== 'wreck' || !w) return;
    if (w.action === 'push') drive.current = 1;
    if (w.action === 'bite') input.current.tap = p;
  }
  function move(e: PointerEvent) {
    const pr = press.current;
    if (!pr) return;
    const p = toWorld.current(e.clientX, e.clientY), w = wreck.current;
    if (Math.hypot(e.clientX - pr.x, e.clientY - pr.y) > 10) pr.moved = true;
    if (phase === 'build') input.current.aim = p.x;
    else if (phase === 'wreck' && w?.action === 'swing' && pr.moved) input.current.hold = p;
  }
  function up(e: PointerEvent) {
    const pr = press.current, w = wreck.current;
    press.current = null;
    if (phase === 'build') { input.current.release = true; input.current.aim = null; return; }
    if (phase !== 'wreck' || !w) return;
    if (w.action === 'push') drive.current = 0;
    if (w.action === 'swing') { if (pr && !pr.moved) input.current.tap = toWorld.current(e.clientX, e.clientY); input.current.hold = null; }
  }
  const hold = (dir: -1 | 1) => ({
    onPointerDown: (e: PointerEvent) => { e.preventDefault(); (e.currentTarget as Element).setPointerCapture(e.pointerId); drive.current = dir; },
    onPointerUp: () => { drive.current = 0; }, onPointerCancel: () => { drive.current = 0; }, onLostPointerCapture: () => { drive.current = 0; },
  });

  const leave = () => {
    if (!voice.active) return;
    if (phase === 'done' || armed) { screen.value = phase === 'done' ? 'town' : 'yard'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const action = wreck.current!.action, after = player.state.value.yard;

  return (
    <div class={`job-screen ${phase}`} data-phase={phase}>
      <canvas ref={canvas} class="job-canvas" aria-label="The Job" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      <header class="job-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        <span class="job-title">{phase === 'build' || phase === 'done' ? (choice ? building(choice.b).name : '') : machine(mach).name}</span>
        {(phase === 'wreck' || phase === 'clear') && <span class="job-count" aria-label={`${bolts} Bolts`}><CurrencyIcon kind={WRECKERS_CURRENCY} size={26} />{bolts}/{BOLTS_HIDDEN}</span>}
      </header>
      {phase === 'wreck' && <div class="job-progress" aria-hidden="true"><i ref={bar} /><span>🚧</span></div>}
      {phase === 'wreck' && <div class="job-hint" aria-hidden="true">{action === 'swing' ? '👆 pull the ball back, let go' : action === 'push' ? '👆 hold to push' : '👆 tap the building'}</div>}
      {phase === 'build' && <div class="job-hint" aria-hidden="true">👆 move the hook, let go to drop</div>}
      {phase === 'wreck' && (
        <>
          <div class="job-ctl left"><button class="ctl back" aria-label="Back" {...hold(-1)}>◀</button></div>
          <div class="job-ctl right"><button class={`ctl fwd ${action === 'push' ? 'teach' : ''}`} aria-label={action === 'push' ? 'Push' : 'Forward'} {...hold(1)}>▶</button></div>
        </>
      )}
      {phase === 'intro' && (
        <div class="job-card-wrap" role="dialog" aria-label="A new Job">
          <div class="job-card">
            <h2>A new Job!</h2>
            <p class="job-line">{MATERIAL_LINES[job.tier - 1]}</p>
            <div class="pick-machines">
              {able.map(m => (
                <button key={m} class={`pick-machine ${m === mach ? 'on' : ''}`} aria-label={machine(m).name} onPointerDown={e => { e.preventDefault(); go(m); }}>
                  <MachineView id={m} yard={yard} label={null} /><span class="pm-name">{machine(m).name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {phase === 'choose' && (
        <div class="job-card-wrap" role="dialog" aria-label="What will you build?">
          <div class="job-card choose">
            <h2>{job.choices[0]!.kind === 'gold' ? 'Make one gold!' : 'What will you build?'}</h2>
            <div class={`build-choices n${job.choices.length}`}>
              {job.choices.map((c, i) => (
                <button key={c.b} class={`build-choice ${lit === i ? 'speaking' : ''} ${chooseReady ? '' : 'waiting'}`} aria-label={building(c.b).name} data-building={c.b} onPointerDown={e => { e.preventDefault(); pick(c); }}>
                  <BuildingView id={c.b} gold={c.kind === 'gold'} label={null} /><span class="bc-name">{building(c.b).name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {phase === 'done' && choice && (
        <div class="job-card-wrap result" role="dialog" aria-label="You built it">
          <div class="job-card done">
            <h2>{choice.kind === 'gold' ? 'It is gold now!' : 'You built it!'}</h2>
            <div class="built"><BuildingView id={choice.b} gold={choice.kind === 'gold'} label={building(choice.b).name} /></div>
            {paid && <div class="result-bolts"><CurrencyIcon kind={WRECKERS_CURRENCY} size={40} />+{JOB_BOLTS}</div>}
            <div class="btns">
              <button class="big-btn go town-btn pulse" aria-label="Town" onPointerDown={e => { e.preventDefault(); if (voice.active) { eatNextClick(); screen.value = 'town'; } }}><span class="e">🏙️</span>Town</button>
              <button class="big-btn garage my-machine" aria-label="Yard" onPointerDown={e => { e.preventDefault(); if (voice.active) { eatNextClick(); screen.value = 'yard'; } }}><MachineView id={after.machine} label={null} /></button>
              {after.jobs > 0
                ? <button class="big-btn go" aria-label="Another Job" onPointerDown={e => { e.preventDefault(); if (voice.active) { eatNextClick(); goJob(); } }}><span class="e">🏗️</span></button>
                : <button class="big-btn go" aria-label="Play" onPointerDown={e => { e.preventDefault(); if (voice.active) { eatNextClick(); startRound(); } }}><span class="e">▶</span></button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
