// The Race, the reward he drives. First the grid card: the track, the Rival it features and what beating that Rival wins (its part,
// or the Cup's trophy at a Cup Final), with his car beside it. Then he races: three laps, from above, the camera following his car.
// The car drives forward by itself; he holds a finger where he wants it to go and it turns toward the finger, as Math Bots' robot
// heads for a finger on the arena (that pattern is copied here, not imported). One big Boost button. Walls and cars only bounce him.
// Then the results board, which says every place aloud, cheers whatever happened, and gives what he won.
//
// "Watch it go" is the same screen with his car alone, driving itself one lap, for show: no Race used, nothing paid.
//
// Controls stay clear of the screen's bottom edge and sides, which belong to iPadOS (a swipe that starts there opens the Dock or the
// app switcher, and a page can't stop it). Keys work on a computer: the arrows steer, space boosts, H honks.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { CarView, carPic } from '../art/Art';
import type { Look } from '../art/car';
import { TALLY_CURRENCY } from '../branding';
import { record, type RacePay } from '../garage/garage';
import { nameOf, partOf, statsOf, type EnginePart, type HornPart } from '../garage/parts';
import { player, settleRace } from '../game';
import { race, raceShow, raceTrack, screen } from '../nav';
import { cupLine, gotLine, ordinalSaid, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { createStage, type Stage } from './render';
import { featuredOn, gridFor, isFinal } from './rivals';
import { COUNT_S, createRace, LAPS, placeOf, STEP, standings, stepRace, takeEvents, topSpeedOf, type Race } from './sim';
import { boostSound, carBump, countBeep, engineSound, finishCheer, honk, passPing, wallBump, type Engine } from './sounds';
import { cupOf, pointAhead, trackBy, type Pt } from './tracks';
import { placeText } from '../tally/problems';

type Phase = 'grid' | 'live' | 'end';
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const CAME = ['You came first!', 'You came second!', 'You came third!', 'You came fourth!'] as const;

/** Lines that don't matter are dropped while the voice is mid-sentence, so it never queues up behind the action. */
function commentator(voice: VoiceScope) {
  let talking = false;
  return (line: readonly Phrase[], must = false) => {
    if (talking && !must) return;
    talking = true;
    void voice.say(...line).then(() => { talking = false; });
  };
}

interface Result { order: number[]; place: number; pay: RacePay | null }

export function RaceScreen() {
  const voice = useVoiceScope(), state = player.state.value, g = state.garage, show = raceShow.value;
  const track = trackBy(raceTrack.value), cup = cupOf(track.cup);
  const start = useRef({ losses: record(g, track).losses, car: g.car, first: g.raced === 0, beaten: record(g, track).beaten }).current;
  const grid = useMemo(() => (show ? [] : gridFor(track, start.losses)), []);
  const featured = featuredOn(track), final = isFinal(track);
  const looks: Look[] = useMemo(() => [start.car, ...grid.map(s => ({ ...s.rival.look, number: s.rival.number }))], []);
  const names: Phrase[] = ['You!', ...grid.map(s => s.rival.name)];
  const [phase, setPhase] = useState<Phase>(show ? 'live' : 'grid'), [armed, setArmed] = useState(false), [result, setResult] = useState<Result | null>(null);
  const [prizeOpen, setPrizeOpen] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), lapEl = useRef<HTMLSpanElement>(null), placeEl = useRef<HTMLSpanElement>(null), boostEl = useRef<HTMLSpanElement>(null), countEl = useRef<HTMLDivElement>(null);
  const finger = useRef<{ id: number; x: number; y: number } | null>(null), boostPress = useRef(false), keys = useRef(new Set<string>());
  const engine = useRef<Engine | null>(null), raceRef = useRef<Race | null>(null);

  // the grid card
  useEffect(() => {
    if (phase !== 'grid') return;
    const win: Phrase[] = start.beaten ? [] : final ? ['Beat', featured.name, 'to win the', cup.name] : ['Beat', featured.name, 'to win', nameOf(featured.prize)];
    void voice.say(...(final ? ['Cup Final!' as const] : []), track.name, 'Next up', featured.name, ...win);
  }, [phase]);

  // the Race
  useEffect(() => {
    if (phase !== 'live') return;
    const stop = new AbortController();
    const r = createRace(track, { stats: statsOf(start.car) }, grid.map(s => ({ stats: s.stats, pace: s.pace })), show ? 1 : LAPS);
    raceRef.current = r;
    const stage: Stage = createStage(canvas.current!, track, looks, reduced());
    // the browser tour steers as a finger would, toward a spot ahead on the track (tools/turbo-tally/tour.ts)
    if (import.meta.env.DEV) Object.assign(window, { __race: r, __ahead: (d: number) => { const you = r.cars[0]!; return stage.toScreen(pointAhead(r.track, you.i, d)); } });
    const say = commentator(voice);
    const engineRung = (partOf(start.car.engine) as EnginePart).speed;
    engine.current = engineSound(Math.max(0, Math.min(1, (engineRung - 40) / 48)));
    const top = topSpeedOf(99) * 1.4;
    // keys on a computer
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') { keys.current.add(k); if (k === ' ' && !e.repeat) boostPress.current = true; if (k === 'h' && !e.repeat) honk((partOf(start.car.horn) as HornPart).sound); }
      else keys.current.delete(k);
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    // Safari's own touch handling stays out of it: no scroll, zoom or callout while he steers
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas,.race-act')) e.preventDefault(); };
    const root = canvas.current!.closest('.race-screen')!;
    for (const type of ['touchstart', 'touchmove'] as const) root.addEventListener(type, hold as EventListener, { passive: false, signal: stop.signal });

    let raf = 0, last = 0, spare = 0, done = false, lastLap = -2, lastPlace = 0, beeps = 0, lastBoosts = -1, hinted = false;
    const steerTarget = (): Pt | null => {
      const you = r.cars[0]!;
      if (show) return pointAhead(r.track, you.i, 260);
      const kx = +keys.current.has('arrowright') - +keys.current.has('arrowleft'), ky = +keys.current.has('arrowdown') - +keys.current.has('arrowup');
      if (kx || ky) return { x: you.x + kx * 220, y: you.y + ky * 220 };
      const f = finger.current;
      return f ? stage.toWorld(f.x, f.y) : null;
    };
    const heard = () => {
      const events = takeEvents(r);
      stage.take(r, events);
      for (const e of events) {
        if (e.t === 'go') { countBeep(true); if (countEl.current) countEl.current.textContent = 'GO!'; say(['Go!'], true); setTimeout(() => { if (countEl.current) countEl.current.textContent = ''; }, 700); }
        if (e.t === 'wall' && e.car === 0) wallBump(e.hard);
        if (e.t === 'bump') { carBump(); if (!show) say(['Bump!']); }
        if (e.t === 'boost' && e.car === 0) { boostSound(); say(['Boost!']); }
        if (e.t === 'pass' && !show) { passPing(); say(['You passed a car!']); }
        if (e.t === 'lap' && e.car === 0 && !show && e.lap < r.laps) say([e.lap === r.laps - 1 ? 'Last lap!' : 'Lap 2!'], true);
        if (e.t === 'finish' && e.car === 0) { finishCheer(); say(['Finish!'], true); }
      }
    };
    const ended = () => {
      if (done) return;
      done = true;
      engine.current?.stop();
      const place = placeOf(r, 0), order = standings(r);
      if (show) { setResult({ order, place, pay: null }); setPhase('end'); return; }
      const beat = placeOf(r, 0) < placeOf(r, 1);
      const pay = settleRace(player, track, place, beat);
      setResult({ order, place, pay });
      setPhase('end');
    };
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const now = ms / 1000, dt = last ? Math.min(.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      spare += dt;
      const target = steerTarget();
      while (spare >= STEP && !r.over) {
        spare -= STEP;
        const you = r.cars[0]!;
        const autoBoost = show && you.boosts > 0 && you.boosting <= 0 && r.t > COUNT_S + 2 && (you.along / r.track.length) % .34 < .01;
        stepRace(r, { target, boost: boostPress.current || autoBoost });
        boostPress.current = false; // a press is one press
      }
      // the countdown, before Go
      if (!show) while (beeps < 3 && r.t >= .2 + beeps) { countBeep(false); const n = 3 - beeps; if (countEl.current) countEl.current.textContent = String(n); say([`${n}` as Phrase], true); beeps++; }
      heard();
      stage.frame(r, now, finger.current && !show ? stage.toWorld(finger.current.x, finger.current.y) : null);
      const you = r.cars[0]!;
      engine.current?.set(r.t < COUNT_S ? .05 : Math.hypot(you.vx, you.vy) / top);
      const lap = Math.min(r.laps, Math.max(1, you.lap + 1));
      if (lap !== lastLap && lapEl.current) { lastLap = lap; lapEl.current.textContent = `${lap}/${r.laps}`; }
      if (r.place !== lastPlace && placeEl.current) { lastPlace = r.place; placeEl.current.textContent = placeText(r.place); }
      if (you.boosts !== lastBoosts && boostEl.current) { lastBoosts = you.boosts; boostEl.current.textContent = String(you.boosts); }
      if (!hinted && start.first && r.t > COUNT_S + .8) { hinted = true; say(['Hold your finger where you want to go!', 'Tap Boost to go fast!'], true); }
      if (r.over) ended();
    };
    raf = requestAnimationFrame(loop);
    if (show) void voice.say('Watch it go!');
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('keyup', key); stop.abort(); engine.current?.stop(); };
  }, [phase]);

  // the results board, said aloud
  useEffect(() => {
    if (phase !== 'end' || !result) return;
    if (show) { void voice.say('Great race!'); return; }
    const { order, place, pay } = result;
    void (async () => {
      sFanfare(); confetti(place === 1 ? 50 : 24, voice.signal);
      await voice.say(CAME[place - 1]!);
      for (const [i, k] of order.entries()) { if (!voice.active) return; await voice.say(ordinalSaid(i + 1), names[k]!); }
      if (!pay) return;
      await voice.say(earnedLine(TALLY_CURRENCY, pay.bolts));
      if (pay.beat && !start.beaten) { sChime(); await voice.say('You beat', featured.name); }
      if (pay.cup) { sFanfare(); confetti(60, voice.signal); await voice.say(cupLine(cupOf(pay.cup).name)); }
      if (pay.prize) await voice.say('Open your prize!');
      if (pay.opened) { sChime(); await voice.say('A new track is open!'); }
      if (!pay.beat) await voice.say(featured.name, 'is getting tired!', 'Great race!');
      else if (!pay.prize && !pay.cup) await voice.say('What a race!');
    })();
  }, [phase, result]);

  const leave = () => {
    if (!voice.active) return;
    if (phase !== 'live' || show || armed) { screen.value = 'garage'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };

  // the arena steers: the canvas alone, so the controls beside it stay where they are
  const down = (e: PointerEvent) => { if (finger.current) return; finger.current = { id: e.pointerId, ...at(e) }; canvas.current!.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { if (finger.current?.id === e.pointerId) finger.current = { id: e.pointerId, ...at(e) }; };
  const up = (e: PointerEvent) => { if (finger.current?.id === e.pointerId) finger.current = null; };
  const at = (e: PointerEvent) => { const b = canvas.current!.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };

  if (phase === 'grid') {
    return (
      <div class="race-screen grid-card" data-phase="grid">
        <header class="race-head"><IconButton label="Garage" onClick={leave}>🏠</IconButton><h1>{track.name}</h1><span class="cup-chip">{cup.icon} {cup.name}</span></header>
        <div class="vs-row">
          <div class="vs-car you"><CarView car={start.car} live /><strong>You</strong></div>
          <div class="vs-mid">VS</div>
          <div class="vs-car foe"><CarView car={{ ...featured.look, number: featured.number }} live label={featured.name} /><strong>{featured.name}</strong></div>
        </div>
        <div class="vs-foot">
          {!start.beaten && (final
            ? <span class="vs-prize"><span class="trophy-big" aria-hidden="true">🏆</span><span>{cup.name}</span></span>
            : <span class="vs-prize"><img src={carPic({ ...start.car, [partOf(featured.prize).slot]: featured.prize })} alt="" /><span>{nameOf(featured.prize)}</span></span>)}
          <button class="big-btn go pulse" aria-label="Go" onClick={() => { if (voice.active) setPhase('live'); }}><span class="e">▶</span><span class="go-word">Go</span></button>
        </div>
      </div>
    );
  }

  const after = player.state.value.garage;
  return (
    <div class={`race-screen ${show ? 'show' : ''}`} data-phase={phase}>
      <canvas ref={canvas} class="race-canvas" aria-label={show ? 'Your car driving round the track' : `Racing at ${track.name}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} />
      <div class="race-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        {!show && <span class="hud-chip lap" aria-label="Lap">🏁 <span ref={lapEl}>1/{LAPS}</span></span>}
        {!show && <span class="hud-chip place" aria-label="Place"><span ref={placeEl}>4th</span></span>}
        {show && <span class="hud-chip">👀 {track.name}</span>}
      </div>
      <div class="count" ref={countEl} aria-live="polite" />
      {!show && phase === 'live' && (
        <div class="race-acts">
          <button class="race-act horn" aria-label="Horn" onPointerDown={e => { e.preventDefault(); honk((partOf(start.car.horn) as HornPart).sound); }}>📯</button>
          <button class={`race-act boost ${start.first ? 'teach' : ''}`} aria-label="Boost" onPointerDown={e => { e.preventDefault(); boostPress.current = true; }}><span>🔥</span><b ref={boostEl}>{0}</b></button>
        </div>
      )}
      {phase === 'end' && result && (
        <div class="race-result" role="dialog"><div class="result-card">
          <h2>{show ? 'Great race!' : `${placeText(result.place)}!`}</h2>
          {!show && <ol class="board">{result.order.map((k, i) => (
            <li key={k} class={k === 0 ? 'me' : ''}><span class="pl">{placeText(i + 1)}</span><img src={carPic(looks[k]!)} alt="" /><span class="nm">{k === 0 ? 'You' : grid[k - 1]!.rival.name}</span></li>
          ))}</ol>}
          {result.pay && <div class="result-bolts"><CurrencyIcon kind={TALLY_CURRENCY} size={40} />+{result.pay.bolts}</div>}
          {result.pay?.cup && <div class="won-cup"><span aria-hidden="true">🏆</span>{cupOf(result.pay.cup).name}</div>}
          {result.pay?.prize && (
            <button class={`crate ${prizeOpen ? 'open' : ''}`} aria-label={prizeOpen ? nameOf(result.pay.prize) : 'Open the prize'} onClick={() => {
              if (prizeOpen || !result.pay?.prize) return;
              setPrizeOpen(true); sFanfare(); confetti(40, voice.signal); void voice.say(gotLine(nameOf(result.pay.prize)));
            }}>{prizeOpen ? <><img src={carPic(after.car)} alt="" /><span>{nameOf(result.pay.prize)}</span></> : <span class="crate-box" aria-hidden="true">🎁</span>}</button>
          )}
          <div class="btns">
            <button class="big-btn garage my-car" aria-label="Garage" onClick={() => { if (voice.active) screen.value = 'garage'; }}><img src={carPic(after.car)} alt="" /></button>
            <button class="big-btn cups-btn" aria-label="Cups" onClick={() => { if (voice.active) screen.value = 'cups'; }}>🏆</button>
            {after.races > 0
              ? <button class="big-btn go" aria-label="Race again" onClick={() => { if (voice.active) race(); }}><span class="e">🏁</span><span class="race-count">{after.races}</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}

