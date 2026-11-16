// A Job, the reward. An old building stands on the lot ("An old brick barn!"); he picks which of his machines to use (any strong
// enough), knocks it all down (a wrecking ball he pulls back and lets go, a blade he holds to push, a bucket that bites where he taps,
// a jackhammer he taps fast, dynamite he sticks on and sets off with the plunger, a magnet that lifts the top off), opens the treasure
// chest when one was hidden in it, the dump truck hauls the rubble away (he drives it, once it's his), he picks what goes up next from
// two or three, and lowers its pieces with the crane, moving the hook with his finger and letting go. It lands in his Town.
//
// Picking the Steamroller or the Cement Mixer makes it a Road Job instead: he drives along the old road to roll its bumps flat (or fill
// its holes), the line gets painted, and he picks a feature for his Town's road (a Car Wash, a Jump Ramp...).
//
// Nothing can go wrong: every hit knocks something loose, every drop lands, and every bump is flattened by driving past it. The Job is
// used, and the Bolts found in the rubble paid (and a treasure kept), only when the new building is up or the road is done. Leaving
// halfway (🏠 twice) costs nothing. Every control acts on pointerdown and is big; the canvas takes touch directly (touch-action: none),
// and nothing here stops touchstart, so taps reach the buttons on the iPad. Keys work on a computer: arrows to drive or move the hook,
// space to swing, bite, hammer, stick dynamite or drop, Enter for the plunger.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { noise, sBoing, sChime, sClink, sCrunch, sEngine, sFanfare, sPop, sThud, sWhoosh, tone } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { piecesOf } from '../art/buildings';
import { BuildingView, FeatureView, lookOf, MachineView } from '../art/Pics';
import { ballOf, magnetOf } from '../art/machines';
import { WRECKERS_CURRENCY } from '../branding';
import { player, settleJob } from '../game';
import { playHorn } from '../horns';
import { eatNextClick, goJob, justBuilt, screen } from '../nav';
import { oldLine, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { actionOf, building, feature, machine, treasure, type FeatureId, type MachineId, type WreckAction } from '../yard/shop';
import { extrasOf, JOB_BOLTS, nextJob, ownsMachine, ownsUpgrade, pavers, powerOf, wreckers, type JobChoice } from '../yard/yard';
import { createBuild, stepBuild, type Build } from './build';
import { drawBuild, drawRoad, drawWreck, puffLife, type Puff } from './draw';
import { createRoad, fixAt, stepRoad, type Road } from './road';
import { BOLTS_HIDDEN, createWreck, GROUND_Y, progress, stepWreck, type Input, type Wreck } from './wreck';

type Phase = 'intro' | 'wreck' | 'treasure' | 'clear' | 'pave' | 'choose' | 'build' | 'done';
const HAUL_S = 2.8;
const HINTS: Record<WreckAction, Phrase> = {
  swing: 'Pull the ball back and let go!', push: 'Hold the arrow to push!', bite: 'Tap the building to dig!', hammer: 'Tap fast to hammer!',
  blast: 'Tap the building to put on dynamite!', magnet: 'Tap the building to lift it with the magnet!',
};
const HINT_TEXT: Record<WreckAction, string> = {
  swing: '👆 pull the ball back, let go', push: '👆 hold to push', bite: '👆 tap the building', hammer: '👆 tap fast to hammer',
  blast: '👆 tap the building, then 💥', magnet: '👆 tap the building',
};
/** A closed treasure chest, drawn like the one that pops out of the rubble (draw.ts). */
const CHEST_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -32 60 58"><path d="M-24 -6 Q0 -30 24 -6 Z" fill="#c47a34" stroke="#1d1d1f" stroke-width="3.5" stroke-linejoin="round"/><rect x="-24" y="-6" width="48" height="28" rx="4" fill="#a8662a" stroke="#1d1d1f" stroke-width="3.5"/><path d="M-24 4 H24" stroke="#ffd23f" stroke-width="4"/><rect x="-5" y="-4" width="10" height="13" rx="2" fill="#ffd23f" stroke="#1d1d1f" stroke-width="3"/></svg>';
/** How many machines the Job's card offers at most: the one he drives, then the strongest of each kind. */
const MAX_PICKS = 6;

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

const sClang = () => { tone(660, .5, 'square', 0, .07, 640); tone(990, .4, 'triangle', 0, .08); noise({ dur: .12, vol: .2, type: 'highpass', f: 2500 }); };
const sChip = () => { noise({ dur: .06, vol: .3, type: 'bandpass', f: 1800 }); tone(140, .05, 'square', 0, .08); };
const sFizz = (dur: number) => noise({ dur, vol: .12, type: 'highpass', f: 3000, beat: .03 });
const sBoom = () => { noise({ dur: .9, vol: .7, f: 600, f2: 120 }); tone(70, .9, 'sine', 0, .5, 30); };

/** The machines on the Job's card: the one he drives first (if it can do this Job), then the strongest of each other kind. */
function pickList(able: readonly MachineId[], driven: MachineId) {
  const out: MachineId[] = able.includes(driven) ? [driven] : [];
  for (const m of able) if (!out.some(o => actionOf(o) === actionOf(m))) out.push(m);
  for (const m of able) if (!out.includes(m)) out.push(m);
  return out.slice(0, MAX_PICKS);
}

export function JobScreen() {
  const voice = useVoiceScope(), yard = player.state.value.yard, say = useRef(chatter(voice)).current;
  const job = useMemo(() => nextJob(player.state.peek().yard), []);
  const able = useMemo(() => pickList(wreckers(yard).filter(m => powerOf(yard, m) >= job.tier), yard.machine), []);
  const roadMachines = useMemo(() => pavers(yard), []);
  const [phase, setPhase] = useState<Phase>('intro'), [armed, setArmed] = useState(false);
  const [mach, setMach] = useState<MachineId>(able.includes(yard.machine) ? yard.machine : able[0] ?? 'crane');
  const [choice, setChoice] = useState<JobChoice | null>(null), [lit, setLit] = useState(-1), [chooseReady, setChooseReady] = useState(false);
  const [bolts, setBolts] = useState(0), [paid, setPaid] = useState(false), [opened, setOpened] = useState(false), [goOn, setGoOn] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), bar = useRef<HTMLElement>(null);
  const wreck = useRef<Wreck | null>(null), build = useRef<Build | null>(null), road = useRef<Road | null>(null);
  const input = useRef<Input & { release?: boolean; aim?: number | null }>({}), drive = useRef<-1 | 0 | 1>(0), keys = useRef(new Set<string>());
  const toWorld = useRef<(x: number, y: number) => { x: number; y: number }>(() => ({ x: 0, y: 0 }));
  const puffs = useRef<Puff[]>([]), haul = useRef(0), haulIdle = useRef(0), frames = useRef(0), hinted = useRef(0), press = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const look = lookOf(yard, mach), dumpLook = lookOf(yard, 'dump'), ownDump = ownsMachine(yard, 'dump');
  const isRoad = phase === 'pave' || choice?.kind === 'road';
  const found = wreck.current?.chestFound && job.treasure ? job.treasure : null;

  function makeWreck(m: MachineId) {
    const b = m === 'crane' || m === 'mega' ? ballOf(m, lookOf(yard, m)) : null;
    wreck.current = createWreck(job.tier, job.shape, m, {
      power: powerOf(yard, m), size: 1 + extrasOf(yard, m, 'size') * .35 + (machine(m).power >= 4 ? .3 : 0), speed: 1 + extrasOf(yard, m, 'speed') * .3,
      ball: b ? { len: b.rope, r: b.r } : undefined, magnet: m === 'magnet' || m === 'supermag' ? magnetOf(m, lookOf(yard, m)).w : undefined,
      treasure: !!job.treasure,
    });
  }
  if (!wreck.current) makeWreck(mach);

  useEffect(() => {
    sEngine();
    void voice.say('A new Job!', oldLine(job.tier, job.shape), ...(able.length > 1 ? ['Pick a machine!' as const] : []), ...(roadMachines.length ? ['Or pave a road!' as const] : []));
  }, []);
  // the browser tour reads how far the Job has got (tools/word-wreckers/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __job(): unknown }).__job = () => ({
    phase, frames: frames.current, t: wreck.current?.t, action: phase === 'pave' ? 'pave' : wreck.current?.action, left: wreck.current ? wreck.current.bricks.filter(b => b.state === 'stand').length : 0,
    bolts: wreck.current?.bolts, k: build.current?.k, n: build.current?.pieces.length, ball: wreck.current?.ball, mx: wreck.current?.mx, treasure: job.treasure,
    chest: wreck.current?.chestFound, sticks: wreck.current?.blast.sticks.length, fixed: road.current?.spots.filter(s => s.fixed).length, haul: haul.current,
    features: job.features, roadMx: road.current?.mx,
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') {
        keys.current.add(k);
        if (k === ' ' && !e.repeat) { if (phase === 'build') input.current.release = true; else if (wreck.current) input.current.tap = { x: wreck.current.bricks.find(b => b.state === 'stand')?.x ?? 700, y: 420 }; }
        if (k === 'enter' && !e.repeat && phase === 'wreck') input.current.fire = true;
      } else keys.current.delete(k);
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    return () => { removeEventListener('keydown', key); removeEventListener('keyup', key); };
  }, [phase]);

  function go(m: MachineId) {
    if (!voice.active || phase !== 'intro') return;
    setMach(m);
    playHorn(yard.horn);
    if (actionOf(m) === 'pave') {
      road.current = createRoad(m, { speed: 1 + extrasOf(yard, m, 'speed') * .3, size: 1 + extrasOf(yard, m, 'size') * .4 });
      setPhase('pave');
      void voice.say(machine(m).name, 'Pave the road!', m === 'mixer' ? 'Hold the arrow to fill the holes!' : 'Hold the arrow to roll the bumps flat!');
      return;
    }
    if (m !== mach) makeWreck(m);
    setPhase('wreck');
    void voice.say(machine(m).name, 'Knock it down!', HINTS[wreck.current!.action]);
  }

  // ---------- knocking it down, and hauling the rubble away ----------
  useCanvasLoop(canvas, phase === 'intro' || phase === 'wreck' || phase === 'treasure' || phase === 'clear', dt => {
    const w = wreck.current!;
    puffs.current = puffs.current.map(p => ({ ...p, t: p.t + dt })).filter(p => p.t < puffLife(p));
    if (phase === 'clear') {
      // his own dump truck drives while he holds; it stops at the pile to load, and drives itself if he waits
      const driving = !!drive.current || keys.current.has('arrowright');
      haulIdle.current = driving ? 0 : haulIdle.current + dt;
      const loading = haul.current > .4 && haul.current < .5;
      const rate = !ownDump || loading || haulIdle.current > 5 ? 1 : driving ? 1.5 : 0;
      haul.current = Math.min(1, haul.current + (dt / HAUL_S) * rate);
      if (ownDump && haulIdle.current > 4 && haulIdle.current - dt <= 4) say('Drive the dump truck!');
      if (haul.current >= 1) { drive.current = 0; setPhase(job.choices.length ? 'choose' : 'done'); }
      return;
    }
    if (phase !== 'wreck') return;
    frames.current++;
    const kd: -1 | 0 | 1 = keys.current.has('arrowright') ? 1 : keys.current.has('arrowleft') ? -1 : 0;
    stepWreck(w, dt, { ...input.current, drive: drive.current || kd });
    input.current = { hold: input.current.hold, hammering: input.current.hammering };
    for (const e of w.events) {
      if (e === 'hit') { sThud(); puffs.current.push({ x: w.bricks.find(b => b.state === 'fall')?.x ?? 700, y: 480, t: 0 }); }
      if (e === 'crash') { sCrunch(); say((['Crash!', 'Boom!', 'Smash!'] as const)[Math.floor(Math.random() * 3)]!); puffs.current.push({ x: 720, y: 470, t: 0 }); }
      if (e === 'bump') sBoing();
      if (e === 'swing') sWhoosh(.4);
      if (e === 'chip') sChip();
      if (e === 'stick') sPop();
      if (e === 'full') say('Press the plunger!');
      if (e === 'fuse') { sFizz(w.blast.fuse); say('Stand back!'); }
      if (e === 'boom') {
        sBoom(); say('Boom!');
        const party = ownsUpgrade(yard, 'blaster', 'confetti') && w.machine === 'blaster';
        for (const b of w.blast.booms) puffs.current.push({ x: b.x, y: b.y, t: 0, kind: party ? 'confetti' : 'boom' });
      }
      if (e === 'clang') { sClang(); say('Clang!'); }
      if (e === 'drop') sThud();
      if (e === 'bolt') { sChime(); setBolts(w.bolts); say('A Bolt!'); const b = w.bricks.find(x => x.bolt && x.found && x.state !== 'rest'); puffs.current.push({ x: b?.x ?? 700, y: b?.y ?? 420, t: 0, bolt: true }); }
      if (e === 'treasure') { sChime(); say('A treasure chest!'); const b = w.bricks.find(x => x.chest); puffs.current.push({ x: b?.x ?? 700, y: b?.y ?? 420, t: 0, kind: 'chest' }); }
      if (e === 'crumble') sCrunch();
      if (e === 'done') {
        setBolts(w.bolts); sFanfare();
        input.current = {};
        if (job.treasure && w.chestFound) { setPhase('treasure'); void voice.say('The lot is clear!', 'A treasure chest!', 'Tap the chest to open it!'); }
        else clearLot();
      }
    }
    if (w.idle > 7 && w.t - hinted.current > 9) { hinted.current = w.t; say(w.action === 'blast' && w.blast.sticks.length ? 'Press the plunger!' : HINTS[w.action]); }
    if (bar.current) bar.current.style.transform = `scaleX(${progress(w)})`;
  }, (c, w, h) => {
    const v = drawWreck(c, wreck.current!, w, h, job.tier, look, puffs.current, phase === 'clear' || phase === 'treasure' ? { t: haul.current, look: dumpLook } : null);
    toWorld.current = (px, py) => { const r = canvas.current!.getBoundingClientRect(), dpr = w / r.width; return v.toWorld((px - r.left) * dpr, (py - r.top) * dpr); };
  });
  function clearLot() {
    setPhase('clear');
    haul.current = 0; haulIdle.current = 0;
    void voice.say('The lot is clear!', ...(ownDump ? ['Drive the dump truck!' as const] : ['Haul it away!' as const]));
    playHorn(yard.horn);
  }

  // ---------- the treasure chest ----------
  function openChest() {
    if (!voice.active || phase !== 'treasure' || opened || !job.treasure) return;
    setOpened(true);
    sFanfare(); confetti(30, voice.signal);
    void voice.say('You found', treasure(job.treasure).name).then(() => { if (voice.active) setGoOn(true); });
    setTimeout(() => { if (voice.active) setGoOn(true); }, 3500); // a stalled voice never keeps him here
  }
  function leaveChest() {
    if (!voice.active || phase !== 'treasure' || !goOn) return;
    clearLot();
  }

  // ---------- a Road Job ----------
  useCanvasLoop(canvas, phase === 'pave', dt => {
    const r = road.current;
    if (!r) return;
    frames.current++;
    puffs.current = puffs.current.map(p => ({ ...p, t: p.t + dt })).filter(p => p.t < puffLife(p));
    const kd: -1 | 0 | 1 = keys.current.has('arrowright') ? 1 : keys.current.has('arrowleft') ? -1 : 0;
    stepRoad(r, dt, { drive: drive.current || kd });
    for (const e of r.events) {
      if (e === 'fix') { if (r.kind === 'bump') { sCrunch(); say('Flat!'); } else { sThud(); say('Filled!'); } puffs.current.push({ x: fixAt(r), y: GROUND_Y - 10, t: 0, kind: r.kind === 'hole' ? 'concrete' : undefined }); }
      if (e === 'paint') { sChime(); void voice.say('Now the lines!'); drive.current = 0; }
      if (e === 'done') { sFanfare(); if (job.features.length) { setPhase('choose'); } else finish({ kind: 'road', f: null }); }
    }
    if (r.idle > 7 && r.t - hinted.current > 9 && r.paint === 0) { hinted.current = r.t; say(r.kind === 'hole' ? 'Hold the arrow to fill the holes!' : 'Hold the arrow to roll the bumps flat!'); }
    if (bar.current) bar.current.style.transform = `scaleX(${r.spots.filter(s => s.fixed).length / r.spots.length})`;
  }, (c, w, h) => {
    const v = drawRoad(c, road.current!, w, h, look, puffs.current);
    toWorld.current = (px, py) => { const r = canvas.current!.getBoundingClientRect(), dpr = w / r.width; return v.toWorld((px - r.left) * dpr, (py - r.top) * dpr); };
  });

  // ---------- choosing what to build, or what goes on the road ----------
  const roadJob = road.current !== null;
  const cards: JobChoice[] = roadJob ? job.features.map(f => ({ kind: 'road', f })) : job.choices;
  const nameOf = (c: JobChoice) => (c.kind === 'road' ? (c.f ? feature(c.f).name : null) : building(c.b).name);
  useEffect(() => {
    if (phase !== 'choose') return;
    const kind = cards[0]!.kind;
    void (async () => {
      await voice.say(...(roadJob ? ['The road is ready!', 'What goes on the road?'] as const : kind === 'new' ? ['What will you build?'] as const : kind === 'gold' ? ['Your Town is full!', 'Make one gold!'] as const : ['Just for fun!', 'What will you build?'] as const));
      for (let i = 0; i < cards.length && voice.active; i++) { setLit(i); await voice.say(nameOf(cards[i]!)!); }
      setLit(-1);
      if (voice.active) setChooseReady(true);
    })();
  }, [phase]);
  function pick(c: JobChoice) {
    if (!voice.active || phase !== 'choose' || !chooseReady) return;
    if (c.kind === 'road') { sPop(); finish(c); return; }
    setChoice(c);
    const pieces = piecesOf(c.b, c.kind === 'gold');
    build.current = createBuild(pieces, 1 + extrasOf(yard, 'tower', 'speed') * .4);
    sPop();
    setPhase('build');
    void voice.say(building(c.b).name, 'Move the crane, then let go to drop!');
  }

  // ---------- putting it up ----------
  useCanvasLoop(canvas, phase === 'build' || (phase === 'done' && !isRoad), dt => {
    const b = build.current;
    if (!b || phase !== 'build') return;
    frames.current++;
    const ka = keys.current.has('arrowright') ? b.hookX + 300 : keys.current.has('arrowleft') ? b.hookX - 300 : undefined;
    stepBuild(b, dt, { aim: input.current.aim ?? ka, release: input.current.release });
    input.current.release = false;
    for (const e of b.events) {
      if (e === 'drop') sWhoosh(.3);
      if (e === 'land') { sThud(); sClink(); if (!b.done) say(b.k === b.pieces.length - 1 ? 'One more!' : 'Nice drop!'); }
      if (e === 'done') finish(choice!);
    }
  }, (c, w, h) => {
    if (!build.current || !choice || choice.kind === 'road') return;
    const v = drawBuild(c, build.current, w, h, choice.b, choice.kind === 'gold', { look: lookOf(yard, ownsMachine(yard, 'tower') ? 'tower' : 'crane'), tower: ownsMachine(yard, 'tower') });
    toWorld.current = (px, py) => { const r = canvas.current!.getBoundingClientRect(), dpr = w / r.width; return v.toWorld((px - r.left) * dpr, (py - r.top) * dpr); };
  });

  function finish(c: JobChoice) {
    setChoice(c);
    const ok = settleJob(player, c, found);
    setPaid(ok);
    if (c.kind !== 'fun' && c.kind !== 'road') justBuilt.value = c.b;
    setPhase('done');
    void (async () => {
      sFanfare(); confetti(46, voice.signal);
      await voice.say(...(c.kind === 'gold' ? ['It is gold now!'] as const : c.kind === 'road' ? (c.f ? ['You built', feature(c.f).name] as const : ['Just for fun!', 'The road is ready!'] as const) : ['You built', building(c.b).name] as const));
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
    if (phase === 'pave' || (phase === 'clear' && ownDump)) { drive.current = 1; return; }
    if (phase !== 'wreck' || !w) return;
    if (w.action === 'push') drive.current = 1;
    if (w.action === 'bite' || w.action === 'blast' || w.action === 'magnet') input.current.tap = p;
    if (w.action === 'hammer') { input.current.tap = p; input.current.hammering = true; }
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
    if (phase === 'pave' || phase === 'clear') { drive.current = 0; return; }
    if (phase !== 'wreck' || !w) return;
    if (w.action === 'push') drive.current = 0;
    if (w.action === 'hammer') input.current.hammering = false;
    if (w.action === 'swing') { if (pr && !pr.moved) input.current.tap = toWorld.current(e.clientX, e.clientY); input.current.hold = null; }
  }
  const hold = (dir: -1 | 1) => ({
    onPointerDown: (e: PointerEvent) => { e.preventDefault(); (e.currentTarget as Element).setPointerCapture(e.pointerId); drive.current = dir; },
    onPointerUp: () => { drive.current = 0; }, onPointerCancel: () => { drive.current = 0; }, onLostPointerCapture: () => { drive.current = 0; },
  });
  const hammerBtn = {
    onPointerDown: (e: PointerEvent) => { e.preventDefault(); (e.currentTarget as Element).setPointerCapture(e.pointerId); input.current.tap = { x: 0, y: 0 }; input.current.hammering = true; },
    onPointerUp: () => { input.current.hammering = false; }, onPointerCancel: () => { input.current.hammering = false; }, onLostPointerCapture: () => { input.current.hammering = false; },
  };
  const fire = (e: PointerEvent) => { e.preventDefault(); if (voice.active && phase === 'wreck' && !(wreck.current!.blast.fuse > 0)) input.current.fire = true; };

  const leave = () => {
    if (!voice.active) return;
    if (phase === 'done' || armed) { screen.value = phase === 'done' ? 'town' : 'yard'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const action = wreck.current!.action, after = player.state.value.yard;
  const drives = action === 'swing' || action === 'push' || action === 'bite';
  const title = phase === 'build' || (phase === 'done' && choice && choice.kind !== 'road') ? (choice && choice.kind !== 'road' ? building(choice.b).name : '') : phase === 'done' && choice?.kind === 'road' && choice.f ? feature(choice.f).name : machine(mach).name;

  return (
    <div class={`job-screen ${phase}`} data-phase={phase}>
      <canvas ref={canvas} class="job-canvas" aria-label="The Job" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      <header class="job-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        <span class="job-title">{title}</span>
        {(phase === 'wreck' || phase === 'clear' || phase === 'treasure') && <span class="job-count" aria-label={`${bolts} Bolts`}><CurrencyIcon kind={WRECKERS_CURRENCY} size={26} />{bolts}/{BOLTS_HIDDEN}</span>}
      </header>
      {(phase === 'wreck' || phase === 'pave') && <div class="job-progress" aria-hidden="true"><i ref={bar} /><span>{phase === 'pave' ? '🛣️' : '🚧'}</span></div>}
      {phase === 'wreck' && <div class="job-hint" aria-hidden="true">{HINT_TEXT[action]}</div>}
      {phase === 'pave' && <div class="job-hint" aria-hidden="true">{'👆 hold ▶ to drive'}</div>}
      {phase === 'build' && <div class="job-hint" aria-hidden="true">👆 move the hook, let go to drop</div>}
      {((phase === 'wreck' && drives) || phase === 'pave') && (
        <>
          <div class="job-ctl left"><button class="ctl back" aria-label="Back" {...hold(-1)}>◀</button></div>
          <div class="job-ctl right"><button class={`ctl fwd ${action === 'push' || phase === 'pave' ? 'teach' : ''}`} aria-label={phase === 'pave' ? 'Drive' : action === 'push' ? 'Push' : 'Forward'} {...hold(1)}>▶</button></div>
        </>
      )}
      {phase === 'clear' && ownDump && <div class="job-ctl right"><button class="ctl fwd teach" aria-label="Drive" {...hold(1)}>▶</button></div>}
      {phase === 'wreck' && action === 'hammer' && <div class="job-ctl right"><button class="ctl tool teach" aria-label="Hammer" {...hammerBtn}>🔨</button></div>}
      {phase === 'wreck' && action === 'blast' && <div class="job-ctl right"><button class={`ctl plunger ${(wreck.current?.blast.sticks.length ?? 0) > 0 ? 'teach' : ''}`} aria-label="Plunger" onPointerDown={fire}><span class="handle" aria-hidden="true" />💥</button></div>}
      {phase === 'intro' && (
        <div class="job-card-wrap" role="dialog" aria-label="A new Job">
          <div class="job-card">
            <h2>A new Job!</h2>
            <p class="job-line">{oldLine(job.tier, job.shape)}</p>
            <div class="pick-machines">
              {able.map(m => (
                <button key={m} class={`pick-machine ${m === mach ? 'on' : ''}`} aria-label={machine(m).name} onPointerDown={e => { e.preventDefault(); go(m); }}>
                  <MachineView id={m} yard={yard} label={null} /><span class="pm-name">{machine(m).name}</span>
                </button>
              ))}
            </div>
            {roadMachines.length > 0 && (
              <div class="pick-machines pavers" role="group" aria-label="Or pave a road!">
                <span class="or-road" aria-hidden="true">🛣️</span>
                {roadMachines.map(m => (
                  <button key={m} class="pick-machine paver" aria-label={machine(m).name} onPointerDown={e => { e.preventDefault(); go(m); }}>
                    <MachineView id={m} yard={yard} label={null} /><span class="pm-name">{machine(m).name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {phase === 'treasure' && job.treasure && (
        <div class="job-card-wrap" role="dialog" aria-label="A treasure chest!">
          <div class="job-card treasure-card">
            <h2>{opened ? treasure(job.treasure).name : 'A treasure chest!'}</h2>
            {!opened
              ? <button class="chest-btn pulse" aria-label="Open the chest" onPointerDown={e => { e.preventDefault(); openChest(); }}><span aria-hidden="true" class="chest-pic" dangerouslySetInnerHTML={{ __html: CHEST_SVG }} /></button>
              : <div class="found-treasure" aria-hidden="true">{treasure(job.treasure).icon}</div>}
            {opened && <button class={`big-btn go ${goOn ? 'pulse' : 'asleep'}`} aria-label="Haul it away" disabled={!goOn} onPointerDown={e => { e.preventDefault(); leaveChest(); }}><span class="e">🚚</span></button>}
          </div>
        </div>
      )}
      {phase === 'choose' && (
        <div class="job-card-wrap" role="dialog" aria-label={roadJob ? 'What goes on the road?' : 'What will you build?'}>
          <div class="job-card choose">
            <h2>{roadJob ? 'What goes on the road?' : cards[0]!.kind === 'gold' ? 'Make one gold!' : 'What will you build?'}</h2>
            <div class={`build-choices n${cards.length}`}>
              {cards.map((c, i) => (
                <button key={c.kind === 'road' ? c.f : c.b} class={`build-choice ${c.kind === 'road' ? 'feature-choice' : ''} ${lit === i ? 'speaking' : ''} ${chooseReady ? '' : 'waiting'}`} aria-label={nameOf(c)!} data-building={c.kind === 'road' ? c.f : c.b} onPointerDown={e => { e.preventDefault(); pick(c); }}>
                  {c.kind === 'road' ? <FeatureView id={c.f as FeatureId} label={null} /> : <BuildingView id={c.b} gold={c.kind === 'gold'} label={null} />}<span class="bc-name">{nameOf(c)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {phase === 'done' && choice && (
        <div class="job-card-wrap result" role="dialog" aria-label="You built it">
          <div class="job-card done">
            <h2>{choice.kind === 'gold' ? 'It is gold now!' : choice.kind === 'road' && !choice.f ? 'The road is ready!' : 'You built it!'}</h2>
            <div class="built">
              {choice.kind === 'road'
                ? (choice.f ? <FeatureView id={choice.f} label={feature(choice.f).name} /> : <span class="road-done" aria-hidden="true">🛣️</span>)
                : <BuildingView id={choice.b} gold={choice.kind === 'gold'} label={building(choice.b).name} />}
            </div>
            {found && <div class="result-treasure" aria-label={treasure(found).name}>{treasure(found).icon}</div>}
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
