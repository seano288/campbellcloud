// A Delivery, the reward. A card says where to go ("Go to the Farm to pick up the milk!") and he taps Go. Then he drives his own
// train on his own Layout: the throttle he slides (at the right), the whistle and the bell (at the left), and points he taps on the
// table to switch. The station stops the train by itself; the cargo loads; he drives it back to Toy Town. Going fast round a bend
// only makes the train lean and squeal. Points set the wrong way only send it round again; after a while the ones it needs light
// up, and later they set themselves.
//
// The Delivery is used, and the Bolts paid, only when the cargo reaches Toy Town. Leaving halfway (🏠 twice) costs nothing and pays
// nothing. Controls stay clear of the bottom edge and the sides, which belong to iPadOS. On a computer: ↑ and ↓ for the throttle,
// space for the whistle.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { noise, sChime, sClink, sFanfare, sPop, tone } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { sceneryArt } from '../art/scenery';
import { engineOf, paintOf } from '../art/train';
import { TrainView } from '../art/TrainView';
import { EXPRESS_CURRENCY } from '../branding';
import { player, settleDelivery, updateTrains } from '../game';
import { useTable } from '../layout/canvas';
import { drawRing, fromScreen, toScreen } from '../layout/draw';
import { carsDo, createWorld, doTrick, drawScene, tapWorld, trickOf, type World } from '../layout/fx';
import { cellAt, hasPoints, xyOf } from '../layout/track';
import { goDeliver, screen } from '../nav';
import { goLine, openLine, type Phrase } from '../phrases';
import { startRound } from '../round';
import { LINE, station, TRICKS, type ItemName } from '../shed/catalogue';
import { ITEMS, planDelivery, type DeliveryPay } from '../shed/trainset';
import { useVoiceScope, type VoiceScope } from '../voice';
import { boostRun, createRun, stepRun, tapPoints, type Run } from './run';

type Phase = 'card' | 'drive' | 'done';

export const sWhistle = () => { tone(784, .5, 'square', 0, .05); tone(988, .5, 'square', 0, .045); tone(784, .3, 'square', .55, .05); tone(988, .3, 'square', .55, .045); };
export const sBell = () => { tone(1568, .5, 'triangle', 0, .12); tone(1568, .4, 'triangle', .28, .1); };
export const sSqueal = () => tone(2200, .35, 'sawtooth', 0, .025, 2600);
export const sChuff = (v: number) => noise({ dur: .08, vol: .05 + v * .05, type: 'bandpass', f: 600 });
export const sPoints = () => { tone(300, .06, 'square', 0, .06); tone(220, .08, 'square', .05, .06); };

/** Lines that don't matter are dropped while he's mid-sentence, so the voice never queues up behind the action. */
export function chatter(voice: VoiceScope) {
  let talking = false;
  return (...line: Phrase[]) => { if (talking) return; talking = true; void voice.say(...line).then(() => { talking = false; }); };
}

/** The trick button: his engine's trick (a boost, a puff of smoke, sparks...), and his cars' with it. Never more than one a second,
 *  however fast he taps. */
export function TrickButton({ world, run, train, say }: { world: World; run: () => Run | null; train: { engine: string; cars: readonly string[] }; say(...line: Phrase[]): void }) {
  const trick = trickOf(train.engine), last = useRef(-9);
  return (
    <button class="ctl trick" aria-label="Trick" onPointerDown={e => {
      e.preventDefault();
      if (world.t - last.current < 1) return;
      last.current = world.t;
      doTrick(world, train);
      const r = run();
      if (trick === 'boost' && r) boostRun(r);
      say(TRICKS[trick].word);
    }}>{TRICKS[trick].icon}</button>
  );
}

/** Shakes the table for a roar or a volcano. */
export function shakeCanvas(el: HTMLCanvasElement | null, w: World) {
  if (!el) return;
  const want = w.shake > 0 ? `translate(${(Math.random() - .5) * 10}px,${(Math.random() - .5) * 8}px)` : '';
  if (el.style.transform !== want) el.style.transform = want;
}

/** The throttle: a tall slider he drags up to go faster and down to slow. It stays where he leaves it, as a real one does. */
export function Throttle({ value, onChange }: { value: number; onChange(v: number): void }) {
  const ref = useRef<HTMLDivElement>(null), dragging = useRef(false);
  const set = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect(), k = 1 - (e.clientY - r.top - 34) / Math.max(1, r.height - 68);
    onChange(Math.max(0, Math.min(1, Math.round(k * 20) / 20)));
  };
  return (
    <div ref={ref} class="throttle" role="slider" aria-label="Throttle" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} tabIndex={0}
      onPointerDown={e => { e.preventDefault(); ref.current?.setPointerCapture?.(e.pointerId); dragging.current = true; set(e); }}
      onPointerMove={e => { if (dragging.current) set(e); }}
      onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
      <span class="th-fill" style={{ height: `${value * 100}%` }} />
      <span class="th-knob" style={{ bottom: `calc(${value} * (100% - 68px))` }} aria-hidden="true">{value > 0 ? '🚂' : '⏸'}</span>
      <span class="th-label" aria-hidden="true">{value > .05 ? '' : '⬆'}</span>
    </div>
  );
}

export function DeliveryScreen() {
  const voice = useVoiceScope(), say = useRef(chatter(voice)).current, start = player.state.peek().trains;
  const plan = useMemo(() => planDelivery(start), []);
  const pickup = LINE.find(s => s.id === plan.pickup)!, cargo = pickup.cargo!;
  const top = engineOf(start.engine).top;
  const run = useRef<Run | null>(createRun(plan.layout, plan.pickupCell, plan.townCell, start.cars.length, top));
  const [phase, setPhase] = useState<Phase>('card'), [armed, setArmed] = useState(false), [throttle, setThrottle] = useState(0);
  const [leg, setLeg] = useState<Run['leg']>('pickup'), [pay, setPay] = useState<DeliveryPay | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null), hinted = useRef(false), chuff = useRef(0), world = useRef(createWorld()).current;
  const paint = paintOf(start.paint);

  useEffect(() => {
    if (plan.layout !== start.layout) updateTrains(t => ({ ...t, layout: plan.layout }));
    void voice.say(...(plan.fixed ? ["Let's fix your track!" as const] : []), 'All aboard!', goLine(pickup));
  }, []);
  // the browser tour reads how far the Delivery has got and where the points are (tools/sentence-express/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __delivery(): unknown }).__delivery = () => {
    const r = run.current;
    return r && { phase, leg: r.leg, hint: r.hint, speed: r.speed, t: r.t, boost: r.boost, parts: world.parts.length, points: r.layout.cells.map((m, c) => (hasPoints(m) ? c : -1)).filter(c => c >= 0), w: r.layout.w, h: r.layout.h, xy: (cell: number) => screenOf(cell) };
  };
  /** Where a square's middle is on the screen, for the tour's taps. */
  function screenOf(cell: number) {
    const v = view.current, r = run.current, box = canvas.current?.getBoundingClientRect();
    if (!v || !r || !box) return null;
    const { x, y } = xyOf(r.layout, cell), p = toScreen(v, r.layout, x + .5, y + .5);
    return { x: box.left + p.x, y: box.top + p.y };
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.type !== 'keydown') return;
      if (e.key === 'ArrowUp') { setThrottle(v => Math.min(1, v + .1)); e.preventDefault(); }
      if (e.key === 'ArrowDown') { setThrottle(v => Math.max(0, v - .1)); e.preventDefault(); }
      if (e.key === ' ') { sWhistle(); e.preventDefault(); }
    };
    addEventListener('keydown', key);
    // Safari's own touch handling stays out of the way: no scroll, zoom or callout while he drives
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas,.throttle,.dl-ctl')) e.preventDefault(); };
    const root = document.querySelector('.delivery-screen');
    root?.addEventListener('touchstart', hold as EventListener, { passive: false });
    root?.addEventListener('touchmove', hold as EventListener, { passive: false });
    return () => { removeEventListener('keydown', key); root?.removeEventListener('touchstart', hold as EventListener); root?.removeEventListener('touchmove', hold as EventListener); };
  }, []);
  useEffect(() => { if (run.current) run.current.throttle = throttle; }, [throttle]);

  const view = useTable(canvas, () => run.current?.layout ?? plan.layout, ({ c, v, dt, t }) => {
    const r = run.current;
    if (!r) return;
    if (phase === 'drive') {
      stepRun(r, dt);
      for (const e of r.events) {
        if (e === 'clack') { chuff.current++; if (chuff.current % 2 === 0) sChuff(r.speed / r.top); }
        if (e === 'squeal') { sSqueal(); say('Whee!'); }
        if (e === 'points') sPoints();
        // "Loading!" matters (it says why the train stopped), so it's said even over a line in progress, not dropped like chatter
        if (e === 'arrive') { sChime(); setThrottle(0); setLeg(r.leg); if (r.leg === 'loading') void voice.say('Loading!'); else carsDo(world, start.cars); }
        if (e === 'loaded') { sPop(); setLeg(r.leg); void voice.say('Now take it to Toy Town!'); hinted.current = false; }
        if (e === 'helped') { sClink(); void voice.say('I switched the points for you!'); }
        if (e === 'delivered') finish();
      }
      if (r.hint !== null && !hinted.current) { hinted.current = true; say('Tap the points to switch them!'); }
    }
    const goal = r.leg === 'pickup' || r.leg === 'loading' ? r.pickup : r.town;
    drawScene(c, v, world, dt, {
      layout: r.layout, run: r, train: start, paint, cargo: r.leg === 'dropoff' || r.leg === 'unloading' ? cargo.icon : null, time: start.time, weather: start.weather, rails: start.rails,
      under: () => {
        if (phase !== 'done') drawRing(c, v, r.layout, goal, t, '#ff7a00');
        if (r.hint !== null) drawRing(c, v, r.layout, r.hint, t * 1.6);
      },
    });
    shakeCanvas(canvas.current, world);
  }, { key: () => `${run.current?.layout.points.join('')}`, rails: () => start.rails, snow: () => start.weather === 'snow' });

  function finish() {
    const r = run.current!;
    const paid = settleDelivery(player, { layout: r.layout, pickup: plan.pickup });
    setPay(paid);
    setPhase('done');
    sFanfare(); confetti(46, voice.signal);
    void (async () => {
      await voice.say('Delivered!');
      if (paid && paid.bolts > 0) await voice.say(earnedLine(EXPRESS_CURRENCY, paid.bolts));
      if (paid?.gift && voice.active) await voice.say('A gift for your table!', 'You got', giftName(paid.gift));
      if (paid?.opened && voice.active) await voice.say(openLine(LINE.find(s => s.id === paid.opened)!));
    })();
  }

  function go() {
    if (!voice.active || phase !== 'card') return;
    sWhistle();
    setPhase('drive');
    void voice.say('Slide to go!');
  }
  function tapTable(e: PointerEvent) {
    const r = run.current, v = view.current;
    if (!r || !v || phase !== 'drive') return;
    const box = canvas.current!.getBoundingClientRect(), p = fromScreen(v, r.layout, e.clientX - box.left, e.clientY - box.top);
    // the nearest points within a square of the tap: a finger on a small square still finds them
    let best = -1, bestD = 1.05;
    for (let c = 0; c < r.layout.cells.length; c++) {
      if (!hasPoints(r.layout.cells[c]!)) continue;
      const { x, y } = xyOf(r.layout, c), d = Math.hypot(x + .5 - p.x, y + .5 - p.y);
      if (d < bestD) { best = c; bestD = d; }
    }
    if (best >= 0 && tapPoints(r, best)) { sPoints(); if (r.hint === best) r.hint = null; return; }
    // no points there: a piece of scenery hops, a working one goes off
    tapWorld(world, r.layout, p.x, p.y);
    void cellAt;
  }
  const leave = () => {
    if (!voice.active) return;
    if (phase === 'done' || armed) { screen.value = 'layout'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const after = player.state.value.trains;
  const going = leg === 'pickup' || leg === 'loading' ? station(plan.pickup) : station('town');

  if (!run.current) return <div class="delivery-screen"><p>…</p></div>;
  return (
    <div class={`delivery-screen ${phase} sky-${start.time}`} data-phase={phase} data-leg={leg}>
      <canvas ref={canvas} class="dl-canvas" aria-label="Your train on your table" onPointerUp={tapTable} />
      <header class="dl-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        <span class="dl-to"><span class="pic emo">{going.icon}</span>{leg === 'dropoff' || leg === 'unloading' ? <><span class="pic emo">{cargo.icon}</span>→ Toy Town</> : <>{pickup.name.replace('the ', '')}</>}</span>
      </header>
      {phase === 'drive' && (
        <>
          <div class="dl-ctl left">
            <button class="ctl whistle" aria-label="Whistle" onPointerDown={e => { e.preventDefault(); sWhistle(); say('Toot toot!'); }}>📯</button>
            <button class="ctl bell" aria-label="Bell" onPointerDown={e => { e.preventDefault(); sBell(); say('Ding ding!'); }}>🔔</button>
            <TrickButton world={world} run={() => run.current} train={start} say={say} />
          </div>
          <div class="dl-ctl right"><Throttle value={throttle} onChange={v => { if (v > 0 && throttle === 0) sChuff(.5); setThrottle(v); }} /></div>
        </>
      )}
      {phase === 'card' && (
        <div class="dl-card" role="dialog" aria-label="A Delivery">
          <div class="card-inner">
            <div class="route" aria-hidden="true"><span class="pic emo">{station('town').icon}</span><span class="dots">• • •</span><span class="pic emo big">{pickup.icon}</span><span class="pic emo">{cargo.icon}</span></div>
            <p class="card-line">{goLine(pickup)}</p>
            <div class="card-train"><TrainView train={start} /></div>
            <button class="big-btn go go-btn pulse" aria-label="Go" onClick={go}><span class="e">🚂</span>Go!</button>
          </div>
        </div>
      )}
      {phase === 'done' && (
        <div class="dl-result" role="dialog"><div class="result-card">
          <h2>Delivered!</h2>
          <div class="delivered" aria-hidden="true"><span class="pic emo">{cargo.icon}</span><span>→</span><span class="pic emo">{station('town').icon}</span></div>
          {pay && <div class="result-bolts"><CurrencyIcon kind={EXPRESS_CURRENCY} size={40} />+{pay.bolts}</div>}
          {pay?.gift && <div class="result-gift"><GiftPic id={pay.gift} /> {giftName(pay.gift)}</div>}
          {pay?.opened && <div class="result-open"><span class="pic emo">{station(pay.opened).icon}</span> {openLine(LINE.find(s => s.id === pay.opened)!)}</div>}
          <div class="btns">
            <button class="big-btn garage" aria-label="Layout" onClick={() => { if (voice.active) screen.value = 'layout'; }}><span class="e">🛤️</span></button>
            <button class="big-btn garage my-train" aria-label="Shed" onClick={() => { if (voice.active) screen.value = 'shed'; }}><TrainView train={after} cars={1} label={null} /></button>
            {after.deliveries > 0
              ? <button class="big-btn go" aria-label="Deliver again" onClick={() => { if (voice.active) goDeliver(); }}><span class="e">🚂</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}

const giftName = (id: string) => ITEMS.find(i => i.tab === 'gift' && i.id === id)!.name as ItemName;
function GiftPic({ id }: { id: string }) {
  const a = sceneryArt(id);
  return 'emoji' in a ? <span class="pic emo">{a.emoji}</span> : <span class="item-svg" dangerouslySetInnerHTML={{ __html: a.svg }} />;
}
