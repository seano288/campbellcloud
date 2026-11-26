// The Jump's scene held still (jump/render.ts): `card` is the plan of the next jump (his ramp, the Row and a tape under it, his truck
// waiting at the start), `arena` is his truck big in front of the arena he has built. Only the camera flashes move, a dozen times a second,
// and nothing moves when Reduce Motion is on.
import { useEffect, useRef } from 'preact/hooks';
import { crowdOf, planJump, type ArenaState } from '../arena/arena';
import { itemOf, type RampItem } from '../arena/catalog';
import { createScene, type View } from './render';
import { createSim } from './sim';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

export function ScenePic({ a, view, class: c = '', label }: { a: ArenaState; view: Exclude<View, 'jump'>; class?: string; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // what it shows: redrawn whenever his truck, ramp, Row, seats or arena pieces change
  const key = JSON.stringify([a.truck, a.ramp, a.owned.filter(id => id.startsWith('arena:')), a.more.seats, a.rowsCleared, a.shows, a.night, view]);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const plan = planJump(a), still = reduced();
    const scene = createScene(el, {
      look: a.truck, night: plan.night, crowd: crowdOf(a), arena: a.owned.filter(id => id.startsWith('arena:')),
      parts: view === 'card' ? plan.course.parts : [], rowFeet: view === 'card' ? plan.course.feet : 0,
      landing: (itemOf(a.ramp.landing) as RampItem).feet, reduced: still,
    });
    const sim = createSim(plan.setup);
    let raf = 0, last = -1;
    const draw = (ms: number) => scene.frame(sim, ms / 1000, { tape: null, crunched: null, squash: 0, flashes: false, view });
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || ms - last < 80) return;
      last = ms; draw(ms);
    };
    const ro = new ResizeObserver(() => { scene.resize(); draw(performance.now()); });
    ro.observe(el);
    if (still) draw(0); else raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [key]);
  return <canvas ref={canvas} class={`scene-pic ${c}`} role="img" aria-label={label} />;
}
