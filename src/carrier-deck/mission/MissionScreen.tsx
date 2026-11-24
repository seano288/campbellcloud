// The Mission, the reward he flies. First the card: the Mission's name and patch, the place, the job, the aircraft that goes (and whether
// it suits the job), his best landing on it, or the radio call's prize. Then he flies: the catapult held and let go, the job with one
// finger, and the landing lights down to a wire on his carrier. It cannot be failed (sim.ts). Then the results: the wire he caught, the
// stars, the Bolts, his best, the patch, a prize, a new port, his rank, any medal.
//
// Controls stay clear of the screen's bottom edge and sides, which belong to iPadOS. Keys work on a computer: up and down fly, space is
// the catapult, D drops.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { airLook, aircraftPic } from '../art/aircraft';
import { DECK_CURRENCY } from '../branding';
import { player, settleMission } from '../game';
import { fly, screen } from '../nav';
import { portLine, said, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { AIRCRAFT, FLEET } from '../ship/catalog';
import { yardShip } from '../ship/fleet';
import { CALLS, chart } from '../ship/missions';
import { airWing, catapults, has, lookOf, planMission, rankOf, TROPHIES, wires, type MissionPay } from '../ship/ship';
import { PatchBadge } from '../ship/ChartScreen';
import { createScene } from './render';
import { setupFor } from './setup';
import { createSim, jobResult, STEP, stepSim, takeEvents, targetWire, TUNING, type Sim } from './sim';
import { catapultSound, cheer, engineSound, gustSound, lightPing, ping, splash, winchSound, wireCatch, type Engine } from './sounds';

type Phase = 'card' | 'live' | 'end';
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const JOB_ICON = { drop: '📦', winch: '🛟', rings: '⭕', follow: '📸', search: '🔭', storm: '⛈️' } as const;
const GRADE: Record<1 | 2 | 3, Phrase> = { 1: 'Safe landing!', 2: 'Good landing!', 3: 'Perfect landing!' };
const JOB_LINE = {
  drop: 'Tap Drop over the island!', winch: 'Hold your finger low to lower the winch!', rings: 'Fly through the rings!', search: 'Find the lost boats! Fly low!', storm: 'Fly into the storm clouds!',
} as const satisfies Partial<Record<string, Phrase>>;
const FOLLOW_LINE = { whale: 'Follow the whale!', dolphins: 'Follow the dolphins!', turtle: 'Follow the turtle!', ferry: 'Follow the ferry!' } as const satisfies Partial<Record<string, Phrase>>;

/** Lines that don't matter are dropped while the voice is mid-sentence, so it never queues up behind the action. */
function commentator(voice: VoiceScope) {
  let talking = false;
  return (line: readonly Phrase[], must = false) => {
    if (talking && !must) return;
    talking = true;
    void voice.say(...line).then(() => { talking = false; });
  };
}

interface Result { pay: MissionPay | null; stars: 1 | 2 | 3; wire: number; grade: 1 | 2 | 3; of: number; got: number }

export function MissionScreen() {
  const voice = useVoiceScope(), a = player.state.value.ship;
  const plan = useMemo(() => planMission(a), []);
  const start = useRef({ ship: a }).current;
  const m = plan.m, model = plan.model, spec = AIRCRAFT[model], place = chart(m.chart);
  const look = useMemo(() => airLook(model, lookOf(a, model)), []);
  const rec = m.n <= 36 ? a.records[m.n] : undefined;
  const [phase, setPhase] = useState<Phase>('card'), [armed, setArmed] = useState(false), [result, setResult] = useState<Result | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null), gotEl = useRef<HTMLSpanElement>(null), tipEl = useRef<HTMLDivElement>(null), gaugeEl = useRef<HTMLElement>(null);
  const finger = useRef<{ id: number; y: number } | null>(null), hold = useRef(false), drop = useRef(false), keys = useRef(new Set<string>());
  const [hud, setHud] = useState<'deck' | 'air' | 'drop' | 'home'>('deck');
  const engine = useRef<Engine | null>(null);

  // the card
  useEffect(() => {
    if (phase !== 'card') return;
    const name: Phrase[] = m.name ? [m.name] : ['Radio call!', CALLS[m.job]];
    void voice.say(...name, ...(plan.night ? ['Night Mission!' as const] : []), ...(plan.suited ? ['This aircraft suits the job!' as const] : []));
  }, [phase]);

  // the Mission
  useEffect(() => {
    if (phase !== 'live') return;
    const stop = new AbortController();
    const s: Sim = createSim(setupFor(m, model, start.ship));
    const others = airWing(start.ship).filter(x => x !== model).slice(0, catapults(start.ship) - 1);
    const fleet = [...FLEET.filter(f => has(start.ship, f.id)).map(f => f.ship), ...start.ship.yard.slice(-3).map(n => yardShip(n).look)];
    const scene = createScene(canvas.current!, {
      place, night: plan.night, waves: m.waves, subject: m.subject, look, model, ship: start.ship, reduced: reduced(),
      wingmen: others.map(o => airLook(o, lookOf(start.ship, o))), fleet,
    });
    if (import.meta.env.DEV) Object.assign(window, { __mission: s, __scene: scene });
    const say = commentator(voice);
    engine.current = engineSound(spec.look === 'jet');
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') keys.current.add(k); else keys.current.delete(k);
      if (k === 'd' && e.type === 'keydown') drop.current = true;
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    const still = (e: TouchEvent) => { if ((e.target as Element).closest('canvas,.ms-act')) e.preventDefault(); };
    const root = canvas.current!.closest('.mission-screen')!;
    for (const type of ['touchstart', 'touchmove'] as const) root.addEventListener(type, still as EventListener, { passive: false, signal: stop.signal });
    addEventListener('resize', () => scene.resize(), { signal: stop.signal });

    let raf = 0, last = 0, spare = 0, done = false, lastHud = '', lastGot = -1, keyAlt: number | null = null;
    const tip = (text: string) => { if (tipEl.current) tipEl.current.textContent = text; };
    say(['Hold the button to fill the catapult!', 'Let go to launch!'], true);
    tip(spec.hover ? '👆 Hold, then let go to lift off' : '👆 Hold, then let go to launch');
    const ended = () => {
      if (done) return;
      done = true;
      engine.current?.stop();
      const job = jobResult(s), grade = (s.grade || 1) as 1 | 2 | 3;
      const pay = settleMission(player, plan, { stars: job.stars, wire: s.wire, grade });
      setResult({ pay, stars: pay?.stars ?? job.stars, wire: s.wire, grade, of: job.of, got: job.got });
      setPhase('end');
    };
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const now = ms / 1000, dt = last ? Math.min(.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      spare += dt;
      const fg = finger.current;
      if (keys.current.has('arrowup')) keyAlt = (keyAlt ?? s.alt) + 6; else if (keys.current.has('arrowdown')) keyAlt = (keyAlt ?? s.alt) - 6;
      while (spare >= STEP && s.phase !== 'done') {
        spare -= STEP;
        stepSim(s, { alt: fg ? scene.toAlt(fg.y) : keyAlt, hold: hold.current || keys.current.has(' '), drop: drop.current });
        drop.current = false;
      }
      for (const e of takeEvents(s)) {
        if (e.t === 'launch') { catapultSound(e.power); say([e.auto ? 'The catapult fires!' : e.power >= .95 ? 'Great launch!' : spec.hover ? 'Lift off!' : 'Launch!'], true); tip(''); }
        if (e.t === 'job') {
          const line: Phrase = m.job === 'follow' ? (FOLLOW_LINE as Record<string, Phrase>)[m.subject] ?? 'Follow the whale!' : (JOB_LINE as Record<string, Phrase>)[s.setup.job] ?? 'Hold your finger where you want to fly!';
          say(['Hold your finger where you want to fly!', line], true);
          tip(`👆 ${JOB_ICON[s.setup.job]}`);
        }
        if (e.t === 'target') { ping(e.i); say([s.setup.job === 'search' ? 'Found one!' : s.setup.job === 'follow' ? 'Photo!' : 'Great job!']); }
        if (e.t === 'drop') splash();
        if (e.t === 'crate') say([e.score === 2 ? 'Bullseye!' : e.score === 1 ? 'On the island!' : 'Splash! A boat will pick it up.'], e.score === 2);
        if (e.t === 'hover') { say(['Hold your finger low to lower the winch!'], true); tip('👇 Lower the winch'); }
        if (e.t === 'lowering') say(['The winch is coming down.']);
        if (e.t === 'rescued') { winchSound(); say(['Hold on!', 'Got them!'], true); tip(''); }
        if (e.t === 'return') { say(['Head home!'], true); tip('🛳️'); }
        if (e.t === 'approach') { say(['Follow the landing lights down!'], true); tip('👆 Follow the lights down'); }
        if (e.t === 'light') lightPing();
        if (e.t === 'bolter') { say(['Too high! Go round!'], true); tip(''); }
        if (e.t === 'auto') say(['The deck crew will bring you in.'], true);
        if (e.t === 'gust') gustSound();
        if (e.t === 'trap') { wireCatch(e.grade); say(['You caught wire', said(e.wire), GRADE[e.grade]], true); tip(''); }
        if (e.t === 'done') ended();
      }
      const kind = s.phase === 'deck' ? 'deck' : s.phase === 'return' || s.phase === 'approach' || s.phase === 'around' || s.phase === 'trap' || s.phase === 'done' ? 'home'
        : s.islands.some(i => !i.dropped && s.x >= i.x - TUNING.dropWindow) ? 'drop' : 'air';
      if (kind !== lastHud) { lastHud = kind; setHud(kind); }
      const job = jobResult(s);
      if (job.got !== lastGot && gotEl.current) { lastGot = job.got; gotEl.current.textContent = `${job.got}/${job.of}`; }
      if (gaugeEl.current) gaugeEl.current.style.width = `${Math.round(s.gauge * 100)}%`;
      scene.frame(s, now);
      engine.current?.set(s.phase === 'deck' ? .1 + s.gauge * .6 : s.phase === 'catapult' ? 1 : s.phase === 'trap' || s.phase === 'done' ? .05 : .55);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('keyup', key); stop.abort(); engine.current?.stop(); };
  }, [phase]);

  // the results, said aloud
  useEffect(() => {
    if (phase !== 'end' || !result) return;
    const { pay } = result;
    void (async () => {
      cheer(); confetti(result.grade === 3 ? 50 : 24, voice.signal);
      await voice.say('Welcome back!');
      if (!pay) return;
      await voice.say(earnedLine(DECK_CURRENCY, pay.bolts));
      if (pay.best) { sChime(); await voice.say('New best!'); }
      if (pay.isNew && m.name) { sChime(); await voice.say('A new patch for your wall!'); }
      if (pay.prize) { sFanfare(); confetti(40, voice.signal); await voice.say('You won a prize!', pay.prize.kind === 'patch' ? 'A new patch for your wall!' : 'A new deck marking!'); }
      if (pay.port) { sFanfare(); await voice.say('You reached a new port!', ...portLine(chart(pay.port))); }
      if (pay.rank) { sFanfare(); confetti(40, voice.signal); await voice.say('You are now a', pay.rank.name); }
      for (const id of pay.trophies) { const tr = TROPHIES.find(x => x.id === id); if (tr) { sFanfare(); await voice.say('You won a medal!', tr.name); } }
      if (!pay.prize && !pay.rank && !pay.port) await voice.say('Great flying!');
    })();
  }, [phase, result]);

  const leave = () => {
    if (!voice.active) return;
    if (phase !== 'live' || armed) { screen.value = 'ship'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const at = (e: PointerEvent) => e.clientY - canvas.current!.getBoundingClientRect().top;
  const down = (e: PointerEvent) => {
    if (finger.current) return;
    finger.current = { id: e.pointerId, y: at(e) }; canvas.current!.setPointerCapture(e.pointerId);
    if (hud === 'deck') hold.current = true; // on the deck, a finger anywhere holds the catapult too
  };
  const move = (e: PointerEvent) => { if (finger.current?.id === e.pointerId) finger.current = { id: e.pointerId, y: at(e) }; };
  const up = (e: PointerEvent) => { if (finger.current?.id === e.pointerId) { finger.current = null; if (hud === 'deck') hold.current = false; } };

  if (phase === 'card') {
    return (
      <div class="mission-screen ms-card" data-phase="card" style={{ '--sea': place.sea, '--sky': place.sky } as Record<string, string>}>
        <header class="ms-head"><IconButton label="Carrier" onClick={leave}>🚢</IconButton>
          <h1>{m.name ?? `📻 ${CALLS[m.job]}`}</h1>
          <span class="ms-chip">{place.icon} {place.name}{plan.night ? ' 🌙' : ''}</span></header>
        <div class="ms-route">
          <PatchBadge patch={m.patch} size={96} />
          <div class="ms-job"><span class="ms-job-icon" aria-hidden="true">{JOB_ICON[m.job === 'winch' && !spec.hover ? 'drop' : m.job]}</span></div>
          <div class="ms-plane"><img src={aircraftPic(look, 200, 100)} alt="" /><strong>{spec.name}</strong>{plan.suited && <span class="ms-suits">👍</span>}</div>
        </div>
        <div class="ms-foot">
          {rec && <span class="ms-best" aria-label="Your best">🏅 {'🛬'.repeat(rec.bestGrade)} {'⭐'.repeat(rec.bestStars)}</span>}
          {m.prize && <span class="ms-best">🎁 Prize!</span>}
          {plan.mode === 'new' && m.name && <span class="ms-best">🆕 New Mission!</span>}
          <button class="big-btn go pulse" aria-label="Go" onClick={() => { if (voice.active) setPhase('live'); }}><span class="e">▶</span><span class="go-word">Go</span></button>
        </div>
      </div>
    );
  }

  const after = player.state.value.ship, rank = rankOf(after.minutes);
  return (
    <div class="mission-screen" data-phase={phase} data-hud={hud}>
      <canvas ref={canvas} class="ms-canvas" aria-label={`Mission: ${m.name ?? CALLS[m.job]}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} />
      <div class="ms-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        <span class="hud-chip">{JOB_ICON[m.job === 'winch' && !spec.hover ? 'drop' : m.job]} <span ref={gotEl}>0</span></span>
        <span class="hud-chip" aria-label={`Aim for wire ${targetWire(wires(start.ship))}`}>🎯 {targetWire(wires(start.ship))}</span>
      </div>
      <div class="ms-tip" ref={tipEl} aria-live="polite" />
      {phase === 'live' && hud === 'deck' && (
        <div class="ms-acts">
          <button class="ms-act launch pulse" aria-label="Launch" onPointerDown={e => { e.preventDefault(); hold.current = true; }} onPointerUp={() => { hold.current = false; }} onPointerCancel={() => { hold.current = false; }} onPointerLeave={() => { hold.current = false; }}>
            <span class="gauge"><i ref={gaugeEl} /></span><b>{spec.hover ? '🚁' : '🛫'}</b>
          </button>
        </div>
      )}
      {phase === 'live' && hud === 'drop' && (
        <div class="ms-acts"><button class="ms-act drop pulse" aria-label="Drop" onPointerDown={e => { e.preventDefault(); drop.current = true; }}>📦<b>Drop</b></button></div>
      )}
      {phase === 'end' && result && (
        <div class="ms-result" role="dialog"><div class="result-card">
          <h2>{m.name ?? CALLS[m.job]}!</h2>
          <div class="ms-grade" aria-label={`Landing ${result.grade} of 3`}>{'🛬'.repeat(result.grade)}<span>Wire {result.wire}</span></div>
          <div class="ms-row"><span>{'⭐'.repeat(result.stars)}</span>{result.pay && <span class="result-bolts"><CurrencyIcon kind={DECK_CURRENCY} size={36} />+{result.pay.bolts}</span>}</div>
          {result.pay && <div class="ms-row log">⏱️ +{result.pay.minutes} min <small>{rank.name}{rank.number ? ` ${rank.number}` : ''}</small></div>}
          {result.pay?.best && <div class="won-line">🏅 New best!</div>}
          <div class="ms-row best">🏅 {rec ? `${'🛬'.repeat(Math.max(rec.bestGrade, result.grade))}` : `🛬🛬🛬 × ${after.perfect}`}</div>
          {result.pay?.isNew && m.name && <div class="won-line"><PatchBadge patch={m.patch} size={34} /> {m.name}</div>}
          {result.pay?.prize && <div class="won-line prize">🎁 {result.pay.prize.kind === 'patch' ? <PatchBadge patch={result.pay.prize.patch} size={34} /> : '★'} {result.pay.prize.number}</div>}
          {result.pay?.port && <div class="won-line">🗺️ {chart(result.pay.port).icon} {chart(result.pay.port).name}</div>}
          {result.pay?.trophies.map(id => { const tr = TROPHIES.find(x => x.id === id)!; return <div key={id} class="won-line">🎖️ {tr.icon} {tr.name}</div>; })}
          <div class="btns">
            <button class="big-btn garage" aria-label="Carrier" onClick={() => { if (voice.active) screen.value = 'ship'; }}>🚢</button>
            {after.missions > 0
              ? <button class="big-btn go" aria-label="Fly again" onClick={() => { if (voice.active) fly(); }}><span class="e">🛫</span><span class="race-count">{after.missions}</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}
