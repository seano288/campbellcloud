// The Service on screen. First the Spot card: "Where to?", the Spots he has opened (the rest show how many stars they need, or that
// they need Lights), and Open!. Then the Service itself on a canvas (service.ts plays it, render.ts draws it): his finger drags, holds
// and taps; the screen says what's happening ("Hold to cook!", "Yum!"), points at the next step when he stops, and cheers each
// customer. Then the end card: everyone he fed, a new Regular's sticker, his stars, and a new Spot if one opened.
//
// Controls stay clear of the screen's bottom edge and sides, which belong to iPadOS. The canvas is drawn at no more than 1.5 device
// pixels per CSS pixel, as Dino Dig found the iPad's software compositing needs.
import { useEffect, useRef, useState } from 'preact/hooks';
import { HORNS, sBoing, sChime, sClink, sFanfare, sPop } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { TruckPic } from '../art/TruckPic';
import { player, settleService } from '../game';
import { goService, screen } from '../nav';
import { dragLine, lovesLine, type Phrase } from '../phrases';
import { pick } from '../../game/rng';
import { startRound } from '../round';
import { COOK_LINES, partOf, truckOf } from '../truck/parts';
import { isOpen, nextSpot, ownsLights, pickSpot, setupOf, type ServicePay } from '../truck/state';
import { regularOf, SPOTS, spotOf, type SpotId } from '../truck/world';
import { updateTruck } from '../game';
import { useVoiceScope, type VoiceScope } from '../voice';
import { drawService } from './render';
import { createService, nextStep, pointerDown, pointerMove, pointerUp, release, resize, SERVICE_S, STEP, stepService, takeEvents, whereFor, type Service } from './service';

type Phase = 'card' | 'live' | 'end';
const THANKS = ['Yum!', 'Thank you!', 'Delicious!'] as const;
const n = (x: number) => `${Math.min(100, x)}` as Phrase;

/** Lines that don't matter are dropped while the voice is mid-sentence, so it never queues up behind the action. */
function commentator(voice: VoiceScope) {
  let talking = false;
  return (line: readonly Phrase[], must = false) => {
    if (talking && !must) return;
    talking = true;
    void voice.say(...line).then(() => { talking = false; });
  };
}

function jingle(speaker: string) {
  const i = ['tin', 'bell', 'disco', 'party', 'mega'].indexOf(speaker);
  if (i >= 0) HORNS[i % HORNS.length]!(); else sChime();
}

export function ServiceScreen() {
  const voice = useVoiceScope(), state = player.state.value, t = state.truck;
  const [phase, setPhase] = useState<Phase>('card'), [armed, setArmed] = useState(false), [pay, setPay] = useState<ServicePay | null>(null), [fed, setFed] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null), fedEl = useRef<HTMLSpanElement>(null), sunEl = useRef<HTMLSpanElement>(null);
  const sim = useRef<Service | null>(null);
  const kind = truckOf(t.truck);

  // the Spot card
  useEffect(() => {
    if (phase !== 'card') return;
    if (t.services <= 0) { void voice.say('Play a Round to earn a Service!'); return; }
    void voice.say('Where to?');
  }, [phase]);

  // the Service
  useEffect(() => {
    if (phase !== 'live') return;
    const el = canvas.current!, g = el.getContext('2d')!;
    const box = () => el.getBoundingClientRect();
    const fit = () => {
      const b = box(), dpr = Math.min(1.5, devicePixelRatio || 1);
      el.width = Math.round(b.width * dpr); el.height = Math.round(b.height * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      return b;
    };
    const b = fit();
    const s = createService(setupOf(player.state.peek().truck), b.width, b.height);
    sim.current = s;
    if (import.meta.env.DEV) Object.assign(window, { __service: s, __next: () => { const step = nextStep(s); return step && { step, ...whereFor(s, step) }; } });
    const onResize = () => { const nb = fit(); resize(s, nb.width, nb.height); };
    addEventListener('resize', onResize);
    // leaving the tab or the app mid-drag may never send a lift: let go for him, so nothing stays stuck to a finger that's gone
    const letGo = () => release(s);
    addEventListener('blur', letGo);
    document.addEventListener('visibilitychange', letGo);
    // Safari's own touch handling stays out of it: no scroll, zoom or callout while he drags
    const stop = new AbortController();
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas')) e.preventDefault(); };
    for (const type of ['touchstart', 'touchmove'] as const) el.parentElement!.addEventListener(type, hold as EventListener, { passive: false, signal: stop.signal });
    const say = commentator(voice);
    const speaker = partOf(player.state.peek().truck.fit.speaker).id;
    let raf = 0, last = 0, spare = 0, ended = false, hint: { x: number; y: number } | null = null, lastFed = -1, cooking = false;
    say([dragLine(kind)], true);
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const now = ms / 1000, dt = last ? Math.min(.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      spare += dt;
      while (spare >= STEP && s.phase !== 'done') { spare -= STEP; stepService(s, STEP); }
      for (const e of takeEvents(s)) {
        if (e.t === 'arrive') { jingle(speaker); if (e.regular) say(['A new Regular!', e.regular as Phrase], true); }
        if (e.t === 'place' || e.t === 'topping') { sClink(); hint = null; }
        if (e.t === 'wrong') { sBoing(); say([e.why === 'cookFirst' ? 'Cook it first!' : e.why === 'toppingsFirst' ? 'Add the toppings first!' : 'Look at the order!']); }
        if (e.t === 'cooking' && !cooking) { cooking = true; say([COOK_LINES[kind.cook]]); }
        if (e.t === 'cooked') { sChime(); cooking = false; hint = null; }
        if (e.t === 'served') { sPop(); hint = null; say(e.regular ? ['You met', e.regular as Phrase] : [pick(Math.random, THANKS)], !!e.regular); if (e.regular) confetti(30, voice.signal); }
        if (e.t === 'hint' || e.t === 'auto') {
          const w = whereFor(s, e.step);
          hint = e.t === 'hint' ? w.from : null;
          const step = e.step;
          if (e.t === 'hint') say(step.kind === 'base' ? [dragLine(kind)] : step.kind === 'topping' ? ['Add the', (kind.toppings as readonly { id: string; name: Phrase }[]).find(x => x.id === step.topping)!.name] : step.kind === 'cook' ? [COOK_LINES[kind.cook]] : ['Give it to the customer!'], true);
        }
        if (e.t === 'closing') say(['Closing time!'], true);
      }
      drawService(g, s, now, { fit: player.state.peek().truck.fit, hint });
      if (s.fed !== lastFed && fedEl.current) { lastFed = s.fed; fedEl.current.textContent = String(s.fed); }
      if (sunEl.current) sunEl.current.style.setProperty('--sun', String(Math.min(1, s.t / SERVICE_S)));
      if (s.phase === 'done' && !ended) {
        ended = true;
        const p = settleService(player, s.fed, (s.metRegular as never) ?? null);
        setFed(s.fed); setPay(p); setPhase('end');
      }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', onResize); removeEventListener('blur', letGo); document.removeEventListener('visibilitychange', letGo); stop.abort(); };
  }, [phase]);

  // the end card, said aloud
  useEffect(() => {
    if (phase !== 'end') return;
    void (async () => {
      sFanfare(); confetti(40, voice.signal);
      await voice.say('Great service!');
      await voice.say(...(fed === 1 ? ['You fed 1 person!' as const] : ['You fed' as const, n(fed), 'people!' as const]));
      if (pay?.regular) { const r = regularOf(pay.regular)!; sChime(); await voice.say('You met', r.name as Phrase); await voice.say(r.name as Phrase, lovesLine(r.truck)); }
      for (const id of pay?.opened ?? []) { sChime(); await voice.say('A new spot is open!', spotOf(id).name); }
    })();
  }, [phase]);

  const leave = () => {
    if (!voice.active) return;
    if (phase !== 'live' || armed) { screen.value = 'truck'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const at = (e: PointerEvent) => { const b = canvas.current!.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  const down = (e: PointerEvent) => { const s = sim.current; if (!s) return; canvas.current!.setPointerCapture(e.pointerId); const p = at(e); pointerDown(s, e.pointerId, p.x, p.y); };
  const move = (e: PointerEvent) => { const s = sim.current; if (!s) return; const p = at(e); pointerMove(s, e.pointerId, p.x, p.y); };
  const up = (e: PointerEvent) => { const s = sim.current; if (!s) return; const p = at(e); pointerUp(s, e.pointerId, p.x, p.y); };

  if (phase === 'card') {
    const choose = (id: SpotId) => { if (voice.active && updateTruck(x => pickSpot(x, id)).kind === 'accepted') void voice.say(spotOf(id).name); };
    const tapLocked = (id: SpotId) => {
      if (!voice.active) return;
      const p = spotOf(id), need = p.stars - t.stars;
      if (need > 0) void voice.say(n(need), 'more stars to open it!'); else if (p.night && !ownsLights(t)) void voice.say('Get Lights to open it!');
    };
    return (
      <div class="service-screen spot-card" data-phase="card">
        <header class="ft-head"><IconButton label="Truck" onClick={leave}>🏠</IconButton><h1>Where to?</h1><span class="ft-chip" aria-label={`${t.stars} stars`}>⭐ {t.stars}</span></header>
        <div class="spot-grid">
          {SPOTS.map(p => {
            const open = isOpen(t, p), on = t.spot === p.id;
            return (
              <button key={p.id} class={`spot-tile ${open ? '' : 'locked'} ${on ? 'on' : ''} ${p.night ? 'night' : ''}`} style={{ '--sky1': p.sky[0], '--sky2': p.sky[1], '--ground': p.ground } as Record<string, string>}
                aria-label={p.name} aria-pressed={on} onClick={() => (open ? choose(p.id) : tapLocked(p.id))}>
                <span class="spot-props" aria-hidden="true">{p.props.slice(0, 2).join('')}</span>
                <span class="spot-name">{p.name.replace(/^The /, '')}</span>
                {!open && <span class="spot-lock" aria-hidden="true">{p.stars > t.stars ? `🔒 ⭐${p.stars}` : '🔒 💡'}</span>}
              </button>
            );
          })}
        </div>
        <div class="spot-foot">
          <TruckPic look={t} />
          {t.services > 0
            ? <button class="big-btn go pulse open-go" aria-label="Open" onClick={() => { if (voice.active) { void voice.say('Open!'); setPhase('live'); } }}><span class="open-word">Open!</span><span class="service-count">🍽️{t.services}</span></button>
            : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
        </div>
      </div>
    );
  }

  const after = player.state.value.truck, regular = pay?.regular ? regularOf(pay.regular) : null, next = nextSpot(after);
  return (
    <div class="service-screen" data-phase={phase}>
      <canvas ref={canvas} class="service-canvas" aria-label={`Serving at ${spotOf(t.spot).name}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      <div class="service-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        <span class="hud-chip fed" aria-label="People fed">🍽️ <span ref={fedEl}>0</span></span>
        <span class="hud-chip sun" aria-hidden="true"><span class="sun-track"><span ref={sunEl} class="sun-dot">{spotOf(t.spot).night ? '🌙' : '☀️'}</span></span></span>
      </div>
      {phase === 'end' && (
        <div class="service-result" role="dialog"><div class="result-card">
          <h2>Great service!</h2>
          <div class="fed-big"><span aria-hidden="true">🍽️</span>{fed}</div>
          {regular && <div class="new-sticker"><span class="face" aria-hidden="true">{regular.face}</span><span class="nm">{regular.name}</span><span class="fav" aria-hidden="true">{truckOf(regular.truck).food}</span></div>}
          <div class="stars-line">⭐ {after.stars}{next && <span class="next"> / {next.stars} {next.props[0]}</span>}</div>
          {pay?.opened.map(id => <div key={id} class="opened-spot">🎉 {spotOf(id).name}</div>)}
          <div class="btns">
            <button class="big-btn garage my-truck" aria-label="Truck" onClick={() => { if (voice.active) screen.value = 'truck'; }}><TruckPic look={after} /></button>
            <button class="big-btn book-btn" aria-label="Sticker Book" onClick={() => { if (voice.active) screen.value = 'book'; }}>📒</button>
            {after.services > 0
              ? <button class="big-btn go" aria-label="Open again" onClick={() => { if (voice.active) goService(); }}><span class="open-word">Open!</span><span class="service-count">🍽️{after.services}</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}
