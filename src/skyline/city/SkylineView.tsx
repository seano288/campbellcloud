// The Skyline: his buildings side by side from the street, at their real heights, every floor a row of windows he can count. At night
// the windows light up. The tallest tower flies the flag. Drawn once into an image when it opens.
import { useEffect, useRef } from 'preact/hooks';
import { drawBuilding, faceHeight, O } from '../art/draw';
import { designOf, type CityState } from './city';
import { flagPlot } from './paint';
import { plotById } from './grid';

/** At most this many buildings in one Skyline: the nearest to where he was looking. */
export const SKYLINE_MOST = 40;

export function SkylineView({ city, night, near }: { city: CityState; night: boolean; near: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const placed = Object.entries(city.plots).map(([id, p]) => ({ id, p, plot: plotById(id)!, d: designOf(city, p.d)! })).filter(x => x.plot && x.d && x.d.look.floors > 0); // parks and ponds lie flat: nothing to see from the street
    placed.sort((a, b) => Math.abs(a.plot.rect.x - near) - Math.abs(b.plot.rect.x - near));
    const shown = placed.slice(0, SKYLINE_MOST).sort((a, b) => a.plot.block - b.plot.block || a.plot.rect.x - b.plot.rect.x);
    const widthOf = (x: (typeof shown)[number]) => (x.plot.size === 's' ? 58 : 110);
    const tallest = Math.max(160, ...shown.map(x => faceHeight(x.p.floors) + 80));
    const W = Math.max(300, shown.reduce((a, x) => a + widthOf(x) + 10, 30)), H = tallest + 60, k = Math.min(1.5, 4000 / W);
    c.width = Math.round(W * k); c.height = Math.round(H * k);
    c.style.aspectRatio = `${W} / ${H}`;
    const g = c.getContext('2d')!;
    g.scale(k, k);
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, night ? '#0b1430' : '#8fd3ff'); sky.addColorStop(1, night ? '#2a2f5a' : '#e4f6ff');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    if (night) { g.fillStyle = '#fff'; for (let i = 0; i < 60; i++) g.fillRect((i * 97) % W, (i * 53) % (H * .5), 2, 2); g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(W - 60, 50, 24, 0, Math.PI * 2); g.fill(); }
    else { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(W - 70, 56, 30, 0, Math.PI * 2); g.fill(); g.strokeStyle = O; g.lineWidth = 3; g.stroke(); }
    const ground = H - 40, flag = flagPlot(city);
    g.fillStyle = night ? '#2a2e38' : '#5b6170'; g.fillRect(0, ground, W, 40);
    g.strokeStyle = '#ffd23f'; g.setLineDash([16, 12]); g.lineWidth = 3; g.beginPath(); g.moveTo(0, ground + 22); g.lineTo(W, ground + 22); g.stroke(); g.setLineDash([]);
    let x = 20;
    for (const b of shown) {
      const w = widthOf(b);
      drawBuilding(g, b.d.look, b.p.floors, x, ground - 40, w, 40, { night, seed: b.id.length * 17 + b.plot.index, front: true, flag: b.id === flag });
      x += w + 10;
    }
  }, [city, night, near]);
  return <div class="skyline-scroll"><canvas ref={ref} class="skyline-canvas" role="img" aria-label="Your skyline, from the street" /></div>;
}
