// A dragon, alive: drawn on a canvas that breathes and flaps, and does a doing word when asked (flies about, roars, spins, loops, dives,
// hops, glides, sleeps) or changes as a describing word is said (grows, shrinks, turns a colour, smiles, frowns, gets muddy). Used by
// the lessons, the Meetings, the Roost and Visit. Still when the device asks for less motion.
import { useEffect, useRef } from 'preact/hooks';
import { DRAGON_COLOURS, drawDragon, type DragonLook, type DrawOpts } from './dragon';
import { LOOK_COLOURS } from '../words/frames';

export interface DragonShowOpts extends DrawOpts {
  /** A doing word to act out, or null. */
  readonly act?: string | null;
  /** A describing word to show, or null. */
  readonly look?: string | null;
}

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

/** How a describing word changes the dragon, and how big it is drawn. */
export function lookFor(word: string | null | undefined, base: DrawOpts): { o: { -readonly [K in keyof DrawOpts]: DrawOpts[K] }; scale: number } {
  const o: { -readonly [K in keyof DrawOpts]: DrawOpts[K] } = { ...base };
  let scale = 1;
  switch (word) {
    case 'big': case 'thick': scale = 1.3; break;
    case 'little': case 'tiny': scale = .65; break;
    case 'happy': case 'jolly': case 'funny': case 'silly': case 'playful': o.mood = 'happy'; o.open = true; break;
    case 'unhappy': o.mood = 'unhappy'; break;
    case 'muddy': o.muddy = true; break;
    case 'clean': case 'spotless': o.muddy = false; break;
    case 'long': o.wingSize = 1.35; break;
    case 'short': o.wingSize = .6; break;
    case 'silent': case 'soft': o.mood = 'sleepy'; break;
    default: if (word && LOOK_COLOURS[word]) o.paint = LOOK_COLOURS[word];
  }
  return { o, scale };
}

export function DragonCanvas({ look, opts = {}, class: cls = '', label }: { look: DragonLook; opts?: DragonShowOpts; class?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null), o = useRef(opts);
  o.current = opts;
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d');
    if (!ctx) return;
    let raf = 0, t0 = performance.now(), lastAct: string | null | undefined = null;
    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width) return;
      if (c.width !== Math.round(r.width * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      const cur = o.current;
      if (cur.act !== lastAct) { lastAct = cur.act; t0 = ms; }
      const t = still() ? 0 : (ms - t0) / 1000, { o: drawn, scale } = lookFor(cur.look, cur);
      const size = Math.min(r.width * .56, r.height * .72) * scale;
      let x = r.width * .48, y = r.height * .55, rot = 0, flap = cur.flap ?? 1.2, open = drawn.open ?? false;
      const k = Math.min(1, t / 1.6);
      switch (cur.act) {
        case 'fly': y -= Math.sin(t * 3) * r.height * .08; x += Math.sin(t * 1.5) * r.width * .08; flap = 3; break;
        case 'roar': open = Math.sin(t * 5) > -.3; x += Math.sin(t * 40) * 1.5; break;
        case 'spin': rot = k * Math.PI * 2; break;
        case 'loop': rot = -k * Math.PI * 2; y -= Math.sin(k * Math.PI) * r.height * .12; flap = 3; break;
        case 'dive': y += Math.sin(k * Math.PI) * r.height * .15; rot = Math.cos(k * Math.PI) * .5; break;
        case 'hop': y -= Math.abs(Math.sin(t * 4)) * r.height * .12; break;
        case 'glide': flap = .2; x += Math.sin(t) * r.width * .1; rot = -.1; break;
        case 'flap': flap = 4; y -= Math.sin(t * 8) * 4; break;
        case 'sleep': flap = 0; drawn.mood = 'sleepy'; break;
        case 'grow': break;
        case 'look': x += Math.sin(t * 2) * 6; break;
        default: y -= Math.sin(t * 2) * 3;
      }
      if (still()) { rot = 0; flap = 0; }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      if (cur.act === 'grow') ctx.scale(.7 + k * .3, .7 + k * .3);
      drawDragon(ctx, look, size, { ...drawn, t, flap, open });
      ctx.restore();
      if (cur.act === 'roar' && open && !still()) { // a happy roar: little lines and a puff
        ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + size * .85, y - size * .1, size * (.15 + i * .1 + (t % .5) * .2), -.6, .6); ctx.stroke(); }
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [look]);
  return <canvas ref={ref} class={`dr-dragon ${cls}`} role="img" aria-label={label ?? 'A dragon'} />;
}
export { DRAGON_COLOURS };
