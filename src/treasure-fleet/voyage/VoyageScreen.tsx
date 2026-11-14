// A Voyage, the reward: he taps Set sail, steers his ship with his finger across the sea (picking up barrels, bumping off rocks, firing
// the cannon to splash the sea monster's tentacles), lands on the island, walks his pirate along the beach (hopping the crabs), and digs
// at the X. The chest opens on the island's treasure the first time, and gold every time. The Voyage is used, and what he found paid,
// only when the chest opens: leaving halfway (🏠 twice) costs nothing and pays nothing.
//
// Controls stay clear of the screen's bottom edge and sides, which belong to iPadOS, as in Math Bots' fight. Keys work on a computer:
// arrows to steer or walk, space to fire or jump.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sBoing, sChime, sClink, sCrunch, sFanfare, sPop, sThud, sWhoosh } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { seeded } from '../../game/rng';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { IslandBadge } from '../art/IslandBadge';
import { ShipView } from '../art/ShipView';
import { FLEET_CURRENCY } from '../branding';
import { BARRELS, type VoyagePay } from '../fleet/fleet';
import { island as islandBy } from '../fleet/islands';
import { rungOf } from '../fleet/parts';
import { player, settleVoyage } from '../game';
import { screen, setSail, voyageTo } from '../nav';
import { backLine, foundLine, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { drawIsland, drawSail } from './draw';
import { createWalk, dig, progress, stepWalk, type Walk } from './island';
import { createSail, fire, resizeSail, stepSail, widthFor, type Sail } from './sail';

type Phase = 'sail' | 'island' | 'end';
/** Shots per tap of the cannon, by the cannons he has fitted. */
const GUNS = [1, 2, 2, 3] as const;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

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

export function VoyageScreen() {
  const voice = useVoiceScope(), state = player.state.value, fleet = state.fleet, isle = islandBy(voyageTo.value), ship = fleet.ship;
  const first = fleet.trips === 0;
  const [phase, setPhase] = useState<Phase>('sail'), [armed, setArmed] = useState(false), [pay, setPay] = useState<VoyagePay | null>(null);
  const [started, setStarted] = useState(false), [barrels, setBarrels] = useState(0), [atX, setAtX] = useState(false), [opened, setOpened] = useState(false), [tentacle, setTentacle] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), bar = useRef<HTMLElement>(null);
  const sea = useRef<Sail>(createSail(1, GUNS[rungOf(ship, 'cannons')]!, seeded(Date.now() >>> 0)));
  const walk = useRef<Walk>(createWalk());
  const finger = useRef<{ x: number; y: number } | null>(null), keys = useRef(new Set<string>()), steer = useRef(0), holding = useRef(false), jump = useRef(false);
  const digAt = useRef(0), openAt = useRef(0), frames = useRef(0);
  const say = useRef(chatter(voice)).current;

  useEffect(() => { void voice.say('Set sail!'); }, []);
  // the browser tour reads how far the Voyage has got (tools/treasure-fleet/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __voyage(): unknown }).__voyage = () => ({ t: sea.current.t, frames: frames.current, walkX: walk.current.x });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') { keys.current.add(k); if (k === ' ' && !e.repeat) jump.current = true; } else keys.current.delete(k);
      steer.current = +(keys.current.has('arrowright') || keys.current.has('d')) - +(keys.current.has('arrowleft') || keys.current.has('a'));
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    // Safari's own touch handling stays out of the way: no scroll, zoom or callout while he steers
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas,.voy-ctl')) e.preventDefault(); };
    const root = document.querySelector('.voyage-screen');
    root?.addEventListener('touchstart', hold as EventListener, { passive: false });
    root?.addEventListener('touchmove', hold as EventListener, { passive: false });
    return () => { removeEventListener('keydown', key); removeEventListener('keyup', key); root?.removeEventListener('touchstart', hold as EventListener); root?.removeEventListener('touchmove', hold as EventListener); };
  }, []);

  function start() {
    if (started || !voice.active) return;
    setStarted(true);
    sea.current.started = true;
    sWhoosh(1.2); sChime();
    void voice.say('Touch where you want to go!');
  }
  function shoot() {
    if (!voice.active || phase !== 'sail') return;
    if (fire(sea.current)) sPop();
  }

  // at sea
  useCanvasLoop(canvas, phase === 'sail', dt => {
    const s = sea.current, c = canvas.current!;
    frames.current++;
    if (c.clientHeight) { const aspect = c.clientWidth / c.clientHeight; if (Math.abs(widthFor(aspect) - s.width) > 1) resizeSail(s, aspect); }
    if (keys.current.has(' ') && jump.current) { jump.current = false; shoot(); }
    stepSail(s, dt, finger.current, steer.current);
    for (const e of s.events) {
      if (e === 'barrel') { sChime(); setBarrels(s.barrels); if (s.barrels === 1) say('A barrel!'); }
      if (e === 'first-barrel') say('Grab the barrels!');
      if (e === 'bonk') sThud();
      if (e === 'tentacle') { setTentacle(true); sCrunch(); say('Look out! A sea monster!', ...(s.sentTentacles === 1 ? ['Tap the cannon!' as const] : [])); }
      if (e === 'splash') { sWhoosh(.6); say('Splash!'); }
      if (e === 'land-ho') { sFanfare(); say('Land ho!'); }
      if (e === 'done') { setPhase('island'); }
    }
    if (tentacle && !s.tentacles.some(t => t.splashed === null)) setTentacle(false);
  }, (c, w, h) => drawSail(c, sea.current, w, h, ship, isle, reduced(), finger.current));

  // on the island
  useEffect(() => {
    if (phase !== 'island') return;
    void voice.say('Find the X!', ...(first ? ['Hold to walk!', 'Tap the button to jump!'] as const : []));
  }, [phase]);
  useCanvasLoop(canvas, phase === 'island', dt => {
    const w = walk.current, walking = holding.current || keys.current.has('arrowright') || keys.current.has('d');
    stepWalk(w, dt, walking, jump.current);
    jump.current = false;
    for (const e of w.events) {
      if (e === 'jump') sBoing();
      if (e === 'nip') { sThud(); }
      if (e === 'hop-over') sClink();
      if (e === 'at-x') { setAtX(true); sFanfare(); holding.current = false; void voice.say('Tap to dig!'); }
    }
    if (bar.current) bar.current.style.transform = `scaleX(${progress(w)})`;
  }, (c, w, h) => drawIsland(c, walk.current, w, h, ship, isle,
    digAt.current ? Math.min(1, (performance.now() - digAt.current) / 450) : 0,
    openAt.current ? (performance.now() - openAt.current) / 1000 : 0));

  function digHere() {
    const w = walk.current;
    if (!voice.active || !w.atX || w.open) return;
    if (!dig(w)) return;
    digAt.current = performance.now();
    sCrunch();
    if (!w.open) { if (w.dug === 1) void voice.say('Keep digging!'); return; }
    openAt.current = performance.now() + 200;
    setOpened(true);
    const paid = settleVoyage(player, isle.id, sea.current.barrels);
    setPay(paid);
    void (async () => {
      await voice.wait(900);
      sFanfare(); confetti(60, voice.signal);
      await voice.say('Treasure!');
      await voice.wait(800);
      if (!voice.active) return;
      setPhase('end');
      if (!paid) return;
      const lines: Phrase[] = paid.treasure ? [foundLine(isle.treasure)] : [backLine(isle.name), 'You found gold!'];
      lines.push(earnedLine(FLEET_CURRENCY, paid.bolts));
      await voice.say(...lines);
    })();
  }

  const leave = () => {
    if (!voice.active) return;
    if (phase === 'end' || armed) { screen.value = 'shipyard'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const aim = (e: PointerEvent) => {
    const c = canvas.current;
    if (!c?.clientWidth || phase !== 'sail') return;
    const box = c.getBoundingClientRect();
    finger.current = { x: ((e.clientX - box.left) / box.width) * sea.current.width, y: ((e.clientY - box.top) / box.height) * 1000 };
  };
  const down = (e: PointerEvent) => {
    canvas.current?.setPointerCapture(e.pointerId);
    if (phase === 'sail') aim(e);
    if (phase === 'island' && !walk.current.atX) holding.current = true;
  };
  const up = () => { finger.current = null; holding.current = false; };
  const after = player.state.value.fleet;

  return (
    <div class={`voyage-screen ${phase}`} data-phase={phase}>
      <canvas ref={canvas} class="voy-canvas" aria-label={phase === 'sail' ? 'Your ship at sea' : `Your pirate on ${isle.name}`}
        onPointerDown={down} onPointerMove={e => { if (phase === 'sail' && (e.buttons || e.pointerType === 'touch')) aim(e); }}
        onPointerUp={up} onPointerCancel={up} />
      <header class="voy-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        <span class="voy-to"><IslandBadge island={isle} />{isle.name}</span>
        {phase === 'sail' && <span class="voy-count" aria-label={`${barrels} barrels`}><span aria-hidden="true">🛢️</span>{barrels}/{BARRELS}</span>}
      </header>
      {phase === 'island' && <div class="voy-progress" aria-hidden="true"><i ref={bar} /><span>❌</span></div>}
      {phase === 'sail' && !started && (
        <div class="voy-ready"><button class="big-btn go set-sail pulse" aria-label="Set sail" onClick={start}><span class="e">⛵</span></button></div>
      )}
      {phase === 'sail' && started && (
        <div class="voy-ctl right"><button class={`ctl cannon ${tentacle ? 'pulse' : ''}`} aria-label="Fire the cannon" onPointerDown={e => { e.preventDefault(); shoot(); }}>💥</button></div>
      )}
      {phase === 'island' && !atX && (
        <div class="voy-ctl right"><button class={`ctl jump ${first ? 'teach' : ''}`} aria-label="Jump" onPointerDown={e => { e.preventDefault(); jump.current = true; }}>⤴</button></div>
      )}
      {phase === 'island' && !atX && <div class="walk-hint" aria-hidden="true">👆 hold to walk</div>}
      {phase === 'island' && atX && !opened && (
        <div class="voy-ctl right"><button class="big-btn go dig-btn pulse" aria-label="Dig" onClick={digHere}><span class="e">⛏️</span></button></div>
      )}
      {phase === 'end' && (
        <div class="voy-result" role="dialog"><div class="result-card">
          <h2>{isle.name}</h2>
          {pay?.treasure
            ? <div class="prize"><span class="prize-art" style={{ '--glow': isle.glow }} aria-hidden="true">{isle.art}</span><span class="prize-name">{isle.treasure.replace(/^the /, 'The ')}</span></div>
            : <IslandBadge island={isle} class="result-isle" dug />}
          {pay && <div class="result-bolts"><CurrencyIcon kind={FLEET_CURRENCY} size={40} />+{pay.bolts}</div>}
          <div class="btns">
            <button class="big-btn garage hoard-btn" aria-label="Hoard" onClick={() => { if (voice.active) screen.value = 'hoard'; }}><span class="e">💎</span></button>
            <button class="big-btn garage my-ship" aria-label="Shipyard" onClick={() => { if (voice.active) screen.value = 'shipyard'; }}><ShipView ship={after.ship} label={null} sea={false} /></button>
            {after.voyages > 0
              ? <button class="big-btn go" aria-label="Set sail again" onClick={() => { if (voice.active) setSail(); }}><span class="e">⛵</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}
