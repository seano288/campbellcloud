// A dinosaur as a small still picture, for Home, the start screen and the end of a Round: his newest living one with its skin, or else
// the skeleton he's building, or else a bare bone to find.
import { useEffect, useRef } from 'preact/hooks';
import { bounds, drawDino } from './dino';
import { dino, DINOS, type DinoId } from '../museum/dinos';
import { bonesOf, lookOf, type MuseumState } from '../museum/state';

/** Which dinosaur to show: his pet, else the one he's digging up, else the first. */
export function showcase(m: MuseumState): { id: DinoId; alive: boolean; have: number } {
  const pet = m.pet && m.alive.includes(m.pet) ? m.pet : m.alive.at(-1);
  if (pet) return { id: pet, alive: true, have: dino(pet).bones.length };
  const building = DINOS.find(d => bonesOf(m, d.id) > 0 && !m.alive.includes(d.id));
  const id = (building?.id ?? DINOS[0].id) as DinoId;
  return { id, alive: false, have: bonesOf(m, id) };
}

export function DinoPic({ m, class: cls = '', flip = false }: { m: MuseumState; class?: string; flip?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null), s = showcase(m);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const draw = () => {
      const box = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!box.width || !box.height) return;
      cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr);
      const c = cv.getContext('2d')!, d = dino(s.id), b = bounds(d), px = Math.min((cv.width * .92) / b.width, (cv.height * .9) / b.height);
      c.clearRect(0, 0, cv.width, cv.height);
      c.save(); c.translate(cv.width / 2, cv.height * .96); if (flip) c.scale(-1, 1); c.translate(-(b.width * px) / 2 - b.left * px, 0);
      drawDino(c, d, s.alive ? { mode: 'skin', px, look: lookOf(m, s.id), pose: { phase: .8, stride: .4 } } : { mode: 'bones', px, have: d.bones.slice(0, s.have) });
      c.restore();
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [s.id, s.alive, s.have, m.looks[s.id]]);
  return <canvas ref={ref} class={`dino-pic ${cls}`} aria-hidden="true" />;
}
