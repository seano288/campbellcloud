// Watch it go: his train runs round his Layout by itself, with nowhere it has to be, so he can show off what he has built. The
// throttle starts a little open (he can slide it), the whistle, the bell and his engine's trick are at the left, and at the top the
// time of day and the weather he owns, to switch between. Tapping points switches them; tapping a piece of scenery makes it hop, and
// a working piece goes off (the volcano erupts, the drawbridge lifts for a boat, the rocket launches). Free: it uses no Delivery.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sClink, sPop } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { engineOf, paintOf } from '../art/train';
import { player, saveLayout, updateTrains } from '../game';
import { useTable } from '../layout/canvas';
import { fromScreen, toScreen } from '../layout/draw';
import { createWorld, drawScene, tapWorld } from '../layout/fx';
import { hasPoints, xyOf } from '../layout/track';
import { screen } from '../nav';
import type { Phrase } from '../phrases';
import { SKY, type ItemName, type SkyId } from '../shed/catalogue';
import { planShow, timesOwned, weathersOwned } from '../shed/trainset';
import { useVoiceScope } from '../voice';
import { chatter, sBell, sChuff, shakeCanvas, sPoints, sSqueal, sWhistle, Throttle, TrickButton } from './DeliveryScreen';
import { createFreeRun, stepRun, tapPoints, type Run } from './run';

const skyName = (id: SkyId) => SKY.find(s => s.id === id)!.name as ItemName;
const skyIcon = (id: SkyId | null) => (id ? SKY.find(s => s.id === id)!.icon : '🚫');

export function ShowScreen() {
  const voice = useVoiceScope(), say = useRef(chatter(voice)).current, start = player.state.peek().trains;
  const plan = useMemo(() => planShow(start), []);
  const run = useRef<Run | null>(createFreeRun(plan.layout, plan.start, start.cars.length, engineOf(start.engine).top));
  const [throttle, setThrottle] = useState(.4);
  const canvas = useRef<HTMLCanvasElement>(null), world = useRef(createWorld()).current, chuff = useRef(0), tapped = useRef(false);
  const t = player.state.value.trains, times = timesOwned(t), weathers = weathersOwned(t);

  useEffect(() => {
    if (plan.fixed) saveLayout(plan.layout);
    void voice.say(...(plan.fixed ? ["Let's fix your track!" as const] : []), 'Watch your train go!');
    // after a while, a nudge to try tapping his table (once)
    const nudge = setTimeout(() => { if (!tapped.current) say('Tap things on your table!'); }, 9000);
    return () => clearTimeout(nudge);
  }, []);
  useEffect(() => { if (run.current) run.current.throttle = throttle; }, [throttle]);
  useEffect(() => {
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas,.throttle,.dl-ctl')) e.preventDefault(); };
    const root = document.querySelector('.show-screen');
    root?.addEventListener('touchstart', hold as EventListener, { passive: false });
    root?.addEventListener('touchmove', hold as EventListener, { passive: false });
    return () => { root?.removeEventListener('touchstart', hold as EventListener); root?.removeEventListener('touchmove', hold as EventListener); };
  }, []);
  // the browser tour reads where the train is and where things are (tools/sentence-express/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __show(): unknown }).__show = () => {
    const r = run.current, v = view.current, box = canvas.current?.getBoundingClientRect();
    if (!r || !v || !box) return null;
    const xy = (cell: number) => { const { x, y } = xyOf(r.layout, cell), p = toScreen(v, r.layout, x + .5, y + .5); return { x: box.left + p.x, y: box.top + p.y }; };
    return { t: r.t, speed: r.speed, boost: r.boost, scenery: r.layout.scenery, parts: world.parts.length, sky: world.sky.length, state: [...world.state.entries()], raise: [...world.raise], xy };
  };

  const view = useTable(canvas, () => run.current?.layout ?? plan.layout, ({ c, v, dt }) => {
    const r = run.current;
    if (!r) return;
    stepRun(r, dt);
    for (const e of r.events) {
      if (e === 'clack') { chuff.current++; if (chuff.current % 2 === 0) sChuff(r.speed / r.top); }
      if (e === 'squeal') { sSqueal(); say('Whee!'); }
      if (e === 'points') sPoints();
    }
    const now = player.state.peek().trains;
    drawScene(c, v, world, dt, { layout: r.layout, run: r, train: now, paint: paintOf(now.paint), time: now.time, weather: now.weather, rails: now.rails });
    shakeCanvas(canvas.current, world);
  }, { key: () => `${run.current?.layout.points.join('')}`, rails: () => player.state.peek().trains.rails, snow: () => player.state.peek().trains.weather === 'snow' });

  function tapTable(e: PointerEvent) {
    const r = run.current, v = view.current;
    if (!r || !v) return;
    tapped.current = true;
    const box = canvas.current!.getBoundingClientRect(), p = fromScreen(v, r.layout, e.clientX - box.left, e.clientY - box.top);
    // a piece of scenery right under the finger first, then the nearest points within a square
    if (tapWorld(world, r.layout, p.x, p.y)) return;
    let best = -1, bestD = 1.05;
    for (let c = 0; c < r.layout.cells.length; c++) {
      if (!hasPoints(r.layout.cells[c]!)) continue;
      const { x, y } = xyOf(r.layout, c), d = Math.hypot(x + .5 - p.x, y + .5 - p.y);
      if (d < bestD) { best = c; bestD = d; }
    }
    if (best >= 0 && tapPoints(r, best)) sPoints();
  }
  function nextTime() {
    if (!voice.active || times.length < 2) return;
    const next = times[(times.indexOf(t.time) + 1) % times.length]!;
    sClink();
    updateTrains(x => ({ ...x, time: next }));
    void voice.say(skyName(next));
  }
  function nextWeather() {
    if (!voice.active || !weathers.length) return;
    const all: (SkyId | null)[] = [null, ...weathers], next = all[(all.indexOf(t.weather) + 1) % all.length]!;
    sPop();
    updateTrains(x => ({ ...x, weather: next }));
    void voice.say(next ? skyName(next) : 'Clear sky!');
  }
  function leave() {
    if (!voice.active) return;
    // what the points were set to stays on his Layout
    const r = run.current;
    if (r) saveLayout(r.layout);
    screen.value = 'layout';
  }

  if (!run.current) return <div class="delivery-screen"><p>…</p></div>;
  return (
    <div class={`delivery-screen show-screen drive sky-${t.time}`}>
      <canvas ref={canvas} class="dl-canvas" aria-label="Your train running on your table" onPointerUp={tapTable} />
      <header class="dl-hud">
        <IconButton label="Layout" onClick={leave}>🛤️</IconButton>
        <span class="dl-to show-title"><span class="pic emo">🚂</span><span class="pic emo">💨</span></span>
        {times.length > 1 && <button class="sky-btn" aria-label="Time of day" onClick={nextTime}>{skyIcon(t.time)}</button>}
        {weathers.length > 0 && <button class="sky-btn" aria-label="Weather" onClick={nextWeather}>{skyIcon(t.weather)}</button>}
      </header>
      <div class="dl-ctl left">
        <button class="ctl whistle" aria-label="Whistle" onPointerDown={e => { e.preventDefault(); sWhistle(); say('Toot toot!'); }}>📯</button>
        <button class="ctl bell" aria-label="Bell" onPointerDown={e => { e.preventDefault(); sBell(); say('Ding ding!'); }}>🔔</button>
        <TrickButton world={world} run={() => run.current} train={t} say={(...line: Phrase[]) => say(...line)} />
      </div>
      <div class="dl-ctl right"><Throttle value={throttle} onChange={v => setThrottle(v)} /></div>
    </div>
  );
}
