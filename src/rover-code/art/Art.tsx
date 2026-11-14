// The reward's pictures as components: a canvas that fits its box and redraws when the box changes. `live` keeps it moving (a
// flame flickering, wheels turning), unless Reduce Motion is on. The parts tray shows many rockets at once, so those are drawn once
// to an image and kept.
import { useEffect, useRef } from 'preact/hooks';
import type { Rocket } from '../base/parts';
import type { GadgetId, Planet } from '../base/planets';
import { drawGlobe, drawRocket, drawRover, ROCKET_SPAN, ROVER_SPAN } from './draw';

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
type Draw = (c: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

function CanvasArt({ draw, live = false, class: cls = '', label, deps }: { draw: Draw; live?: boolean; class?: string; label: string | null; deps: readonly unknown[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!, c = canvas.getContext('2d');
    if (!c) return;
    let raf = 0, gone = false;
    const frame = (ms: number) => {
      const box = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
      if (w && h) {
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, w, h);
        draw(c, w, h, ms / 1000);
      }
      if (live && !gone && !still()) raf = requestAnimationFrame(frame);
    };
    frame(600);
    const ro = new ResizeObserver(() => frame(performance.now()));
    ro.observe(canvas);
    return () => { gone = true; cancelAnimationFrame(raf); ro.disconnect(); };
  }, deps);
  return label === null ? <canvas ref={ref} class={`art ${cls}`} aria-hidden="true" /> : <canvas ref={ref} class={`art ${cls}`} role="img" aria-label={label} />;
}

/** Fits the rocket to a box, with room under it for a flame only when it has one. */
const fitRocket = (c: CanvasRenderingContext2D, w: number, h: number, pad = .92, flame = false) => {
  const bottom = ROCKET_SPAN.bottom + (flame ? 70 : 0), tall = bottom - ROCKET_SPAN.top, k = Math.min(h / tall, w / (ROCKET_SPAN.half * 2.1)) * pad;
  c.translate(w / 2, h / 2 - ((bottom + ROCKET_SPAN.top) / 2) * k);
  c.scale(k, k);
};

export function RocketView({ rocket, live = false, flame = 0, class: cls = '', label = 'Your rocket' }: { rocket: Rocket; live?: boolean; flame?: number; class?: string; label?: string | null }) {
  return <CanvasArt class={`rocket-view ${cls}`} live={live} label={label} deps={[JSON.stringify(rocket), live, flame]}
    draw={(c, w, h, t) => { fitRocket(c, w, h, .92, flame > 0); drawRocket(c, rocket, { flame: live ? flame : flame * .8, t }); }} />;
}

export function RoverView({ gadgets, live = false, class: cls = '', label = 'Your rover' }: { gadgets: readonly GadgetId[]; live?: boolean; class?: string; label?: string | null }) {
  return <CanvasArt class={`rover-view ${cls}`} live={live} label={label} deps={[gadgets.join(), live]}
    draw={(c, w, h, t) => {
      const k = Math.min(w / (ROVER_SPAN.right - ROVER_SPAN.left), h / (ROVER_SPAN.bottom - ROVER_SPAN.top)) * .92;
      c.translate(w / 2, h / 2 + ((ROVER_SPAN.top + ROVER_SPAN.bottom) / -2) * k); c.scale(k, k);
      drawRover(c, gadgets, { spin: t * 2, t });
    }} />;
}

export function GlobeView({ planet, class: cls = '', label }: { planet: Pick<Planet, 'globe' | 'feature' | 'id'>; class?: string; label?: string | null }) {
  return <CanvasArt class={`globe-view ${cls}`} label={label ?? null} deps={[planet.id]}
    draw={(c, w, h) => { c.translate(w / 2, h / 2); drawGlobe(c, planet, Math.min(w, h) * (planet.feature === 'rings' ? .27 : .42)); }} />;
}

const pics = new Map<string, string>();
/** Where a tray picture looks: the nose at the top, fins and engine at the bottom, or the whole rocket for a body or paint. */
export type Focus = 'whole' | 'top' | 'bottom';
/** A rocket drawn once to a picture, for the parts tray, zoomed on the part that changes. */
export function rocketPic(rocket: Rocket, focus: Focus = 'whole') {
  const key = `${JSON.stringify(rocket)}|${focus}`;
  let url = pics.get(key);
  if (!url) {
    const canvas = document.createElement('canvas');
    canvas.width = 150; canvas.height = 190;
    const c = canvas.getContext('2d');
    if (c) {
      if (focus === 'whole') fitRocket(c, 150, 190, .96);
      else { c.translate(75, focus === 'top' ? 125 : 22); c.scale(.62, .62); }
      drawRocket(c, rocket, { flame: focus === 'bottom' ? .6 : 0 });
    }
    url = canvas.toDataURL('image/png');
    pics.set(key, url);
  }
  return url;
}
