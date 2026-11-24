// The Crane, the reward he works with his hands. First the card: the ship at the quay (his own, or a visitor with its name), where it's
// bound, how many containers it takes, and his bests for that size of ship. Then he loads it: he drags the crane along its boom (it
// follows his finger), and taps to lower the grab (a tap on a container sends the crane there and lowers it; the ⬇ button lowers where it
// is). It locks on by itself, lifts, and he takes it to the ship. Each container says its syllable as it's picked up, and a row on the ship
// that reads a word says the word. It cannot be failed and has no clock (sim.ts). When the ship is full its horn sounds and it sails.
// Then the results: the harbour, the Bolts, the tonnes, his new bests, the crate it brought back, any special crate, rank and Trophy.
//
// Controls stay clear of the screen's bottom edge and sides, which belong to iPadOS. Keys work on a computer: left and right move the
// trolley, space or down lowers the grab.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sCheer, sChime, sFanfare } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { ShipArt } from '../art/Thumb';
import { CUR } from '../branding';
import { player, settleGo } from '../game';
import { load, screen } from '../nav';
import { syl, type Phrase } from '../phrases';
import { boxLookFor, craneLook, planGo, quickKey, rankOf, specOf, TROPHIES, type GoPay } from '../port/port';
import { FlagView } from '../port/ChartScreen';
import { HARBOURS, chartHarbour } from '../port/sea';
import { SHIP_NAMES } from '../port/catalog';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { cargoFor } from './cargo';
import { createCraneScene } from './render';
import { capacity, createCrane, held, loadingTime, STEP, stepCrane, takeEvents, type Input } from './sim';
import { bump, hornSound, lockSound, setDown, wordChime } from './sounds';

type Phase = 'card' | 'live' | 'end';
/** Lines that don't matter are dropped while the voice is mid-sentence, so it never queues up behind the action. */
function commentator(voice: VoiceScope) {
  let talking = false;
  return (line: readonly Phrase[], must = false) => {
    if (talking && !must) return;
    talking = true;
    void voice.say(...line).then(() => { talking = false; });
  };
}
const TAP_SLOP = 12;

export function CraneScreen() {
  const voice = useVoiceScope(), state = player.state.value, p = state.port;
  const plan = useMemo(() => planGo(p), []);
  const words = useMemo(() => cargoFor(state.words, capacity(plan.shape), plan.n), []);
  const harbourWords = (h = plan.harbour): Phrase[] => h.n <= HARBOURS.length ? [h.name as Phrase] : (() => { const c = chartHarbour(h.n); return [c.first, c.second, ...(c.round && c.round + 1 <= 100 ? [`${c.round + 1}` as Phrase] : [])]; })();
  const shipWords: Phrase[] = plan.visitor ? [plan.visitor.first, plan.visitor.second] : [SHIP_NAMES[p.fleet[plan.own!]?.name ?? 0]!];
  const best = p.bests.quick[quickKey(plan.shape)];
  const [phase, setPhase] = useState<Phase>('card'), [armed, setArmed] = useState(false), [pay, setPay] = useState<GoPay | null>(null);
  const [loaded, setLoaded] = useState(0), [carrying, setCarrying] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), pending = useRef<Input>({ to: null, lower: null }), finger = useRef<{ id: number; x: number; moved: boolean; worldX: number } | null>(null);
  const keys = useRef(new Set<string>()), tipEl = useRef<HTMLDivElement>(null), sceneRef = useRef<ReturnType<typeof createCraneScene> | null>(null);

  useEffect(() => {
    if (phase !== 'card') return;
    void voice.say('Here comes the', ...shipWords, 'Sail to', ...harbourWords());
  }, [phase]);

  useEffect(() => {
    if (phase !== 'live') return;
    const stop = new AbortController();
    // the containers' syllables are drawn on the canvas in Andika, which the page only fetches once something on it uses the font
    void document.fonts?.load('700 32px Andika').catch(() => {});
    const c = createCrane(specOf(p), plan.shape, words);
    const scene = createCraneScene(canvas.current!);
    sceneRef.current = scene;
    if (import.meta.env.DEV) Object.assign(window, { __crane: c, __scene: scene });
    const looks = Array.from({ length: c.boxes.length }, (_, i) => boxLookFor(p, plan.n, i)), look = craneLook(p);
    const say = commentator(voice), night = plan.harbour.weather === 'night';
    const tip = (t: string) => { if (tipEl.current) tipEl.current.textContent = t; };
    say(['Tap a container to pick it up!'], true); tip('👆 Tap a container');
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') { keys.current.add(k); if (k === ' ' || k === 'arrowdown') pending.current = { to: null, lower: true }; } else keys.current.delete(k);
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key, { signal: stop.signal }); addEventListener('keyup', key, { signal: stop.signal });
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas,.cw-lower')) e.preventDefault(); };
    const root = canvas.current!.closest('.crane-screen')!;
    for (const type of ['touchstart', 'touchmove'] as const) root.addEventListener(type, hold as EventListener, { passive: false, signal: stop.signal });
    addEventListener('resize', () => scene.resize(), { signal: stop.signal });
    let raf = 0, last = 0, spare = 0, done = false;
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const now = ms / 1000, dt = last ? Math.min(0.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      spare += dt;
      const f = finger.current;
      while (spare >= STEP) {
        spare -= STEP;
        let input = pending.current;
        pending.current = { to: null, lower: null };
        if (f?.moved) input = { ...input, to: f.worldX };
        if (keys.current.has('arrowleft')) input = { ...input, to: c.x - 6 };
        if (keys.current.has('arrowright')) input = { ...input, to: c.x + 6 };
        stepCrane(c, input);
      }
      for (const e of takeEvents(c)) {
        if (e.t === 'lock') { lockSound(); const top = held(c)[0]; if (top) say([syl(top.syl)], true); tip('👆 Now tap the ship'); setCarrying(true); }
        if (e.t === 'place') { setDown(); setLoaded(c.loaded); if (!held(c).length) { setCarrying(false); tip(c.loaded < capacity(c.ship) ? '👆 Tap a container' : ''); } }
        if (e.t === 'word') { wordChime(); say([words[e.word]!.join('') as Phrase], true); }
        if (e.t === 'water') { bump(); say(['That is the water. Bring it over the ship.']); }
        if (e.t === 'empty') { bump(); say(['Nothing there to pick up.']); }
        if (e.t === 'stackFull') { bump(); say(['That stack is full!']); }
        if (e.t === 'keep') { bump(); say(['Take it to the ship!']); }
        if (e.t === 'idle') say([held(c).length ? 'Now tap the ship!' : 'Tap a container to pick it up!']);
        if (e.t === 'full') { hornSound(p.horn); say(['The ship is full!'], true); tip(''); }
        if (e.t === 'sailed' && !done) {
          done = true;
          const res = { loaded: c.loaded, tallest: c.tallest, seconds: loadingTime(c) };
          setPay(settleGo(player, plan, res));
          setPhase('end');
        }
      }
      scene.frame(c, now, i => looks[i]!, plan.look, look, night, f?.moved ? f.worldX : null);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); stop.abort(); };
  }, [phase]);

  // the results, said aloud
  useEffect(() => {
    if (phase !== 'end') return;
    void (async () => {
      sCheer(); confetti(36, voice.signal);
      await voice.say('Welcome to', ...harbourWords());
      if (!pay) return;
      await voice.say(earnedLine(CUR, pay.bolts));
      if (pay.bestStack) { sChime(); await voice.say('Tallest stack!', 'New best!'); }
      if (pay.bestQuick) { sChime(); await voice.say('Quickest loading!', 'New best!'); }
      if (pay.crate) { sFanfare(); confetti(30, voice.signal); await voice.say('A crate from', ...harbourWords(pay.harbour), 'You got', pay.crate.name as Phrase); }
      if (pay.special) { sFanfare(); confetti(40, voice.signal); await voice.say('You won a special crate!', pay.special.name as Phrase); }
      if (pay.rank) { sFanfare(); await voice.say('Your port is now a', pay.rank.name); }
      for (const id of pay.trophies) { const tr = TROPHIES.find(x => x.id === id); if (tr) { sFanfare(); await voice.say('You won a Trophy!', tr.name); } }
      if (!pay.crate && !pay.special && !pay.rank) await voice.say('Great loading!');
    })();
  }, [phase]);

  const leave = () => {
    if (!voice.active) return;
    if (phase !== 'live' || armed) { screen.value = 'port'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const worldAt = (e: PointerEvent) => { const b = canvas.current!.getBoundingClientRect(); return sceneRef.current?.toWorld(e.clientX - b.left) ?? 0; };
  const down = (e: PointerEvent) => { if (finger.current) return; finger.current = { id: e.pointerId, x: e.clientX, moved: false, worldX: worldAt(e) }; canvas.current!.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { const f = finger.current; if (f?.id !== e.pointerId) return; if (Math.abs(e.clientX - f.x) > TAP_SLOP) f.moved = true; f.worldX = worldAt(e); };
  const up = (e: PointerEvent) => { const f = finger.current; if (f?.id !== e.pointerId) return; if (!f.moved) pending.current = { to: null, lower: worldAt(e) }; finger.current = null; };

  if (phase === 'card') {
    return (
      <div class="crane-screen fl-card cw-card" data-phase="card">
        <header class="fl-head"><IconButton label="Port" onClick={leave}>🏗️</IconButton><h1>{plan.look.name}</h1>
          <span class="fl-chip">{plan.harbour.weather === 'night' ? '🌙' : plan.harbour.weather === 'fog' ? '🌫️' : plan.harbour.weather === 'storm' ? '⛈️' : plan.harbour.weather === 'snow' ? '❄️' : '☀️'}</span></header>
        <div class="fl-route">
          <div class="fl-from"><ShipArt class="cw-card-ship" look={plan.look} cols={plan.shape.cols} /><strong>{plan.look.name}</strong>
            <span class="cw-card-size" aria-label={`${capacity(plan.shape)} containers`}>{Array.from({ length: Math.min(18, capacity(plan.shape)) }, (_, i) => <i key={i} class="cw-mini-box" />)}</span></div>
          <div class="cw-route" aria-hidden="true"><i /><b>⚓</b></div>
          <div class="fl-to"><span class="fl-icon" aria-hidden="true">{plan.harbour.icon}</span><strong>{plan.harbour.name}</strong><FlagView f={plan.harbour.flag} size={48} /></div>
        </div>
        <div class="fl-foot">
          {best !== undefined && <span class="fl-best" aria-label="Your best">🏅 {best}s</span>}
          {plan.special && <span class="fl-best">🎁 Special crate!</span>}
          <button class="big-btn go pulse" aria-label="Go" onClick={() => { if (voice.active) setPhase('live'); }}><span class="e">▶</span><span class="go-word">Go</span></button>
        </div>
      </div>
    );
  }

  const after = player.state.value.port, r = rankOf(after.tonnes);
  return (
    <div class="crane-screen" data-phase={phase} data-carrying={carrying ? 'yes' : 'no'}>
      <canvas ref={canvas} class="cw-canvas" aria-label={`Loading the ${plan.look.name}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { finger.current = null; }} />
      <div class="fl-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏗️</IconButton>
        <span class="hud-chip">📦 {loaded}/{capacity(plan.shape)}</span>
        <span class="hud-chip">{plan.harbour.icon} {plan.harbour.name}</span>
      </div>
      <div class="fl-tip" ref={tipEl} aria-live="polite" />
      {phase === 'live' && <div class="fl-acts"><button class="fl-act cw-lower" aria-label="Lower the grab" onPointerDown={e => { e.preventDefault(); pending.current = { to: null, lower: true }; }}>⬇<b>Lower</b></button></div>}
      {phase === 'end' && (
        <div class="fl-result" role="dialog"><div class="result-card">
          <h2>{plan.harbour.name}!</h2>
          <div class="fl-row"><FlagView f={plan.harbour.flag} size={64} />{pay && <span class="result-bolts"><CurrencyIcon kind={CUR} size={36} />+{pay.bolts}</span>}</div>
          {pay && <div class="fl-row pax">⚖️ +{pay.tonnes}t <small>{r.name}{r.number ? ` ${r.number}` : ''}</small></div>}
          {(pay?.bestStack || pay?.bestQuick) && <div class="won-line">🏅 New best!</div>}
          {pay?.crate && <div class="won-line prize">📦 {pay.crate.icon} {pay.crate.name}</div>}
          {pay?.special && <div class="won-line prize">🎁 {pay.special.icon} {pay.special.name}{pay.special.number ? ` ${pay.special.number}` : ''}</div>}
          {pay?.trophies.map(id => { const tr = TROPHIES.find(x => x.id === id)!; return <div key={id} class="won-line">🏆 {tr.icon} {tr.name}</div>; })}
          <div class="btns">
            <button class="big-btn garage" aria-label="Port" onClick={() => { if (voice.active) screen.value = 'port'; }}>🏗️</button>
            {after.ships > 0
              ? <button class="big-btn go" aria-label="Load again" onClick={() => { if (voice.active) load(); }}><span class="e">🚢</span><span class="race-count">{after.ships}</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}
