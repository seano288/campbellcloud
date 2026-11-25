// The Jump, the reward he drives. First the card: his truck, what the Jump goes over and how long it is in feet. Then the lights, the
// run-up (he holds the pedal), the air (a finger left of the truck lifts its nose, right of it dips it; Boost pushes once), the landing,
// and the tape: it rolls out from the ramp's lip to the truck, the feet ticking up, and the distance is said. Then the results: Bolts, a
// new record, the Row or Show cleared, a trophy, a Show Cup, a rank. It cannot be failed (jump/sim.ts): falling short only crunches the
// Row, and the same Row waits for the next Jump with a little more tail wind.
//
// "Watch it" (replay) plays his best jump again from its recorded inputs, the same to the foot, and pays nothing.
//
// Controls stay clear of the screen's bottom edge and sides, which belong to iPadOS. Keys work on a computer: space is the pedal, the
// arrows tilt, B boosts.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sCrunch, sFanfare, sThud, sBoing, sCheer, HORNS } from '../../audio/sfx';
import { confetti, firework } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { CUR } from '../branding';
import { courseOf, crowdOf, doesArena, planJump, rankOf, type ArenaState, type Course, type JumpPay } from '../arena/arena';
import { itemOf, type HornItem, type RampItem } from '../arena/catalog';
import { TruckPic } from '../art/TruckPic';
import { player, settleJump } from '../game';
import { jump as jumpAgain, screen } from '../nav';
import { unitSaid, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { createScene, layRow } from './render';
import { createSim, fromTape, recorder, STEP, stepSim, takeEvents, type Input, type Setup, type Sim } from './sim';
import { boostSound, engineSound, tapeTick, type Engine } from './sounds';

type Phase = 'card' | 'jump' | 'end';
/** How many Jumps the card tells him how to tilt before. */
const TILT_TOLD = 5;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const say = (x: string) => x as Phrase;

/** Lines that don't matter are dropped while the voice is mid-sentence, so it never queues up behind the action. */
function commentator(voice: VoiceScope) {
  let talking = 0, n = 0;
  return (line: readonly Phrase[], must = false) => {
    if (talking && !must) return;
    const mine = ++n;
    talking = mine;
    void voice.say(...line).then(() => { if (talking === mine) talking = 0; });
  };
}
function courseLine(c: Course): Phrase[] {
  return ['Next up:', c.target.kind === 'show' ? 'A Show!' : say(c.name), 'It is', ...unitSaid(c.feet, 'ft'), 'long.'];
}

interface Result { feet: number; clean: boolean; pay: JumpPay | null }

export function JumpScreen({ replay = false }: { replay?: boolean }) {
  const voice = useVoiceScope(), start = useRef({ arena: player.state.value.arena }).current, a: ArenaState = start.arena;
  // the replay is his best jump: its own setup, Row and inputs
  const plan = useMemo(() => {
    if (replay && a.best) { const course = courseOf(a.best.row); return { course, setup: a.best.setup, night: course.night || a.night }; }
    return planJump(a);
  }, []);
  const [phase, setPhase] = useState<Phase>(replay ? 'jump' : 'card'), [armed, setArmed] = useState(false), [result, setResult] = useState<Result | null>(null);
  const [air, setAir] = useState(false), [ground, setGround] = useState(true), [boostOn, setBoostOn] = useState(false), [pedalHint, setPedalHint] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), feetEl = useRef<HTMLSpanElement>(null), speedEl = useRef<HTMLElement>(null);
  const pedal = useRef(false), finger = useRef<{ id: number; x: number } | null>(null), boostTap = useRef(false), keys = useRef(new Set<string>());
  const engine = useRef<Engine | null>(null);
  const course = plan.course;
  const hornOf = () => HORNS[(itemOf(a.truck.horn) as HornItem).sound % HORNS.length]!;

  // the card
  useEffect(() => {
    if (phase !== 'card') return;
    void voice.say(...courseLine(course), ...(plan.night ? ['Night show!' as const] : []),
      ...(course.wind < 0 && !plan.setup.help ? ['A head wind!' as const] : course.wind > 0 ? ['A tail wind!' as const] : []),
      ...(plan.setup.help > 0 ? ['The wind is with you!' as const] : []),
      // how to tilt is said before his first few Jumps: in the air there's no time to say it
      ...(a.jumped < TILT_TOLD ? ['Hold left or right of the truck to tilt it!' as const] : []), 'Tap Jump!');
  }, [phase]);

  // the jump
  useEffect(() => {
    if (phase !== 'jump') return;
    const stop = new AbortController(), s: Sim = createSim(plan.setup), rec = recorder();
    const landing = (itemOf(a.ramp.landing) as RampItem).feet;
    const scene = createScene(canvas.current!, {
      look: a.truck, night: plan.night, crowd: crowdOf(a), arena: a.owned.filter(id => id.startsWith('arena:')), parts: course.parts, rowFeet: course.feet, landing, reduced: reduced(),
    });
    const row = layRow(course.parts);
    if (import.meta.env.DEV) Object.assign(window, { __jump: s });
    const sayIt = commentator(voice);
    engine.current = engineSound();
    const root = canvas.current!.closest('.jump-screen')!;
    for (const type of ['touchstart', 'touchmove'] as const) root.addEventListener(type, (e => { if ((e.target as Element).closest('canvas,.js-act')) e.preventDefault(); }) as EventListener, { passive: false, signal: stop.signal });
    addEventListener('resize', () => scene.resize(), { signal: stop.signal });
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') keys.current.add(k); else keys.current.delete(k);
      if (e.type === 'keydown' && k === 'b') boostTap.current = true;
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key, { signal: stop.signal }); addEventListener('keyup', key, { signal: stop.signal });
    let raf = 0, last = 0, spare = 0, crunched: number | null = null, squash = 0, tape: number | null = null, tapeT = 0, done = false, idle = 0;
    const tapeLen = () => s.feet;
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const now = ms / 1000, dt = last ? Math.min(.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      spare += dt;
      while (spare >= STEP && s.phase !== 'done') {
        spare -= STEP;
        let input: Input;
        if (replay) input = fromTape(a.best!.tape, s.steps + 1);
        else {
          const f = finger.current, kb = keys.current, tx = f ? f.x - truckScreenX() : 0;
          input = {
            // the pedal, the space bar, or a finger held anywhere on the run-up (a small hand may just press the picture)
            pedal: pedal.current || kb.has(' ') || (s.phase !== 'air' && !!f),
            tilt: s.phase === 'air' ? (f ? (tx < 0 ? 1 : -1) : kb.has('arrowleft') ? 1 : kb.has('arrowright') ? -1 : 0) : 0,
            boost: boostTap.current,
          };
          rec.note(s.steps + 1, input);
        }
        boostTap.current = false;
        stepSim(s, input);
        if (s.phase === 'run' && !input.pedal) idle += STEP; else idle = 0;
      }
      for (const e of takeEvents(s)) {
        if (e.t === 'light') sayIt([e.n === 3 ? 'Three!' : e.n === 2 ? 'Two!' : 'One!'], true);
        if (e.t === 'go') { sayIt(['Go!', ...(replay ? [] : ['Hold the pedal!' as const])], true); setPedalHint(!replay); }
        if (e.t === 'pedal' && e.on) setPedalHint(false);
        if (e.t === 'lip') { setAir(true); setGround(false); setBoostOn(plan.setup.boost > 0 && !replay); sayIt(['Off the ramp!', ...(plan.setup.boost > 0 && !replay ? ['Tap Boost!' as const] : [])], true); }
        if (e.t === 'boost') { setBoostOn(false); boostSound(); sayIt(['Boost!'], true); }
        if (e.t === 'land') {
          setAir(false); setBoostOn(false); squash = 1;
          engine.current?.stop();
          if (e.onRow) { crunched = row.findIndex(r => s.landed!.x >= r.from - 1 && s.landed!.x <= r.to + 1); if (crunched < 0) crunched = row.length - 1; sCrunch(); }
          else sThud();
          if (!e.clean) sBoing();
          sayIt([e.onRow ? 'Crunch!' : e.clean ? 'Clean landing!' : 'Bounce!'], true);
        }
        if (e.t === 'stop' && !done) {
          done = true;
          tape = 0; tapeT = now;
          void voice.say("Let's see how far!");
        }
      }
      // the tape rolls out, a foot at a time, quicker for a long jump
      if (tape !== null && tape < tapeLen()) {
        const before = Math.floor(tape);
        tape = Math.min(tapeLen(), (now - tapeT) * Math.max(14, tapeLen() / 2.2));
        if (Math.floor(tape) !== before && Math.floor(tape) % 5 === 0) tapeTick();
        if (feetEl.current) feetEl.current.textContent = `${Math.floor(tape)}`;
        if (tape >= tapeLen()) finish();
      }
      squash = Math.max(0, squash - dt * 2.5);
      if (speedEl.current) speedEl.current.style.width = `${Math.min(100, (s.v / plan.setup.top) * 100)}%`;
      if (!replay && idle > 3 && s.phase === 'run') { idle = 0; sayIt(['Hold the pedal to go fast!']); }
      scene.frame(s, now, { tape, crunched, squash, flashes: tape !== null });
      engine.current?.set(s.phase === 'run' ? (pedal.current || keys.current.has(' ') || replay ? .5 + s.v / plan.setup.top / 2 : .15) : s.phase === 'lights' ? .08 : s.phase === 'air' ? .2 : 0);
    };
    function truckScreenX() {
      const r = canvas.current!.getBoundingClientRect();
      return r.width * .35 + 7 * scene.scale();
    }
    let finished = false;
    async function finish() {
      if (finished) return;
      finished = true;
      if (feetEl.current) feetEl.current.textContent = `${s.feet}`;
      hornOf()();
      await voice.say(...unitSaid(s.feet, 'ft'));
      if (replay) { if (voice.active) setTimeout(() => { if (voice.active) screen.value = 'arena'; }, 1200); return; }
      const pay = settleJump(player, plan, { feet: s.feet, clean: !!s.landed?.clean, tape: rec.tape(), setup: plan.setup });
      if (voice.active) { setResult({ feet: s.feet, clean: !!s.landed?.clean, pay }); setPhase('end'); }
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); stop.abort(); engine.current?.stop(); };
  }, [phase]);

  // the results, said aloud
  useEffect(() => {
    if (phase !== 'end' || !result) return;
    const { pay } = result, after = player.state.peek().arena;
    void (async () => {
      sFanfare(); confetti(pay?.record ? 50 : 20, voice.signal);
      if (!pay) return;
      if (pay.record) {
        sCheer();
        if (doesArena(after, 'fireworks')) for (let i = 0; i < 5; i++) setTimeout(() => firework(undefined, undefined, voice.signal), i * 300);
        await voice.say('New record!');
      }
      if (pay.cleared) { sChime(); if (doesArena(after, 'confetti')) confetti(60, voice.signal); await voice.say('You cleared it!'); }
      else if (pay.help > 0) await voice.say('So close! The wind will help next time.');
      await voice.say(earnedLine(CUR, pay.bolts));
      for (const t of pay.trophies) { sFanfare(); await voice.say('You won a trophy for', ...unitSaid(t, 'ft')); }
      if (pay.cup) { sFanfare(); confetti(40, voice.signal); await voice.say('You won a Show Cup!'); }
      if (pay.rank) { sFanfare(); await voice.say(pay.rank.name === 'Legend' ? 'You are now' : 'You are now a', say(pay.rank.name), ...(pay.rank.number && pay.rank.number <= 100 ? [say(String(pay.rank.number))] : [])); }
      if (!pay.cup && !pay.rank && !pay.trophies.length) await voice.say('Great jumping!');
    })();
  }, [phase, result]);

  const leave = () => {
    if (!voice.active) return;
    if (phase === 'card' || phase === 'end' || armed || replay) { screen.value = 'arena'; return; }
    setArmed(true);
    void voice.say('Tap again to go home.');
    setTimeout(() => setArmed(false), 3000);
  };
  const down = (e: PointerEvent) => {
    if (finger.current) return;
    finger.current = { id: e.pointerId, x: e.clientX - canvas.current!.getBoundingClientRect().left };
    try { canvas.current!.setPointerCapture(e.pointerId); } catch { /* the pointer has already gone: nothing to hold */ }
  };
  const move = (e: PointerEvent) => { if (finger.current?.id === e.pointerId) finger.current = { id: e.pointerId, x: e.clientX - canvas.current!.getBoundingClientRect().left }; };
  const up = (e: PointerEvent) => { if (finger.current?.id === e.pointerId) finger.current = null; };

  if (phase === 'card') {
    const best = a.records[0]?.feet ?? 0;
    return (
      <div class="jump-screen js-card" data-phase="card">
        <header class="js-head"><IconButton label="Arena" onClick={leave}>🏟️</IconButton><h1>{course.target.kind === 'show' ? `Show ${course.target.n}` : course.name}</h1>{plan.night && <span class="ms-chip" aria-label="Night">🌙</span>}</header>
        <div class="js-brief">
          <TruckPic look={a.truck} size={260} class="js-truck" />
          <div class="js-row">
            <span class="js-row-things" aria-hidden="true">{course.parts.map(([k, n]) => `${n}× ${k === 'cone' ? '🔺' : k === 'ring' ? '🔥' : k === 'pool' ? '🏊' : k === 'mud' ? '🟫' : k === 'plane' ? '✈️' : k === 'heli' ? '🚁' : k.includes('bus') ? '🚌' : k === 'dino' ? '🦖' : '🚗'}`).join('  ')}</span>
            <span class="js-feet"><b>{course.feet}</b> ft</span>
            {course.show?.cup && <span class="js-cup" style={{ background: course.show.cup.bg, borderColor: course.show.cup.rim }}>{course.show.cup.glyph} 🎁</span>}
            {plan.setup.help > 0 && <span class="js-wind">💨 {'→'.repeat(Math.min(5, plan.setup.help))}</span>}
          </div>
        </div>
        <div class="js-foot">
          <span class="ms-best" aria-label="Your record">🏆 {best} ft</span>
          <button class="big-btn go pulse" aria-label="Jump" onClick={() => { if (voice.active) setPhase('jump'); }}><span class="e">🛻</span><span class="go-word">Jump!</span></button>
        </div>
      </div>
    );
  }

  const after = player.state.value.arena, rank = rankOf(after.jumped);
  return (
    <div class={`jump-screen ${air ? 'in-air' : ''}`} data-phase={phase}>
      <canvas ref={canvas} class="js-canvas" aria-label={air ? 'In the air: touch left or right of the truck to tilt it' : 'The jump'}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} />
      <div class="js-hud">
        <IconButton label={armed ? 'Tap again to go home' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏟️</IconButton>
        <span class="hud-chip feet-chip"><span ref={feetEl}>0</span> ft</span>
        {(doesArena(a, 'speed') || replay) && <span class="hud-chip speed-chip" aria-hidden="true"><i ref={speedEl} /></span>}
        {replay && <span class="hud-chip">🎥</span>}
      </div>
      {phase === 'jump' && !replay && ground && (
        <div class="js-acts">
          <button class={`js-act pedal ${pedalHint ? 'pulse' : ''}`} aria-label="Pedal" onPointerDown={e => { e.preventDefault(); pedal.current = true; try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* already gone */ } }}
            onPointerUp={() => { pedal.current = false; }} onPointerCancel={() => { pedal.current = false; }} onLostPointerCapture={() => { pedal.current = false; }}>
            <span aria-hidden="true">🦶</span><b>Go!</b>
          </button>
        </div>
      )}
      {phase === 'jump' && air && boostOn && (
        <div class="js-acts"><button class="js-act boost pulse" aria-label="Boost" onPointerDown={e => { e.preventDefault(); boostTap.current = true; }}><span aria-hidden="true">🔥</span><b>Boost</b></button></div>
      )}
      {phase === 'jump' && air && !replay && <div class="js-tilt" aria-hidden="true"><span>↺</span><span>↻</span></div>}
      {phase === 'end' && result && (
        <div class="ms-result" role="dialog"><div class="result-card">
          <h2><b>{result.feet}</b> feet!</h2>
          {result.pay && <div class="ms-row"><span class="result-bolts"><CurrencyIcon kind={CUR} size={36} />+{result.pay.bolts}</span></div>}
          {result.pay?.record && <div class="won-line">🏆 New record!</div>}
          {result.clean && <div class="won-line">✨ Clean landing!</div>}
          {result.pay?.cleared && <div class="won-line">✅ {course.target.kind === 'show' ? `Show ${course.target.n}` : course.name}</div>}
          {result.pay && !result.pay.cleared && result.pay.help > 0 && <div class="won-line">💨 {'→'.repeat(Math.min(5, result.pay.help))}</div>}
          {result.pay?.trophies.map(t => <div key={t} class="won-line">🏆 {t} ft</div>)}
          {result.pay?.cup && <div class="won-line"><span class="js-cup" style={{ background: result.pay.cup.bg, borderColor: result.pay.cup.rim }}>{result.pay.cup.glyph}</span> Show Cup {result.pay.cup.n}</div>}
          {result.pay?.rank && <div class="won-line">🎖️ {result.pay.rank.name}{result.pay.rank.number ? ` ${result.pay.rank.number}` : ''}</div>}
          <div class="ms-row log">🛻 {after.jumped} <small>{rank.name}{rank.number ? ` ${rank.number}` : ''}</small></div>
          <div class="btns">
            <button class="big-btn garage" aria-label="Arena" onClick={() => { if (voice.active) screen.value = 'arena'; }}>🏟️</button>
            {after.jumps > 0
              ? <button class="big-btn go" aria-label="Jump again" onClick={() => { if (voice.active) jumpAgain(); }}><span class="e">🛻</span><span class="race-count">{after.jumps}</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}
export type { Setup };
