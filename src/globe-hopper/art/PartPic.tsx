// A part tile's picture: his own rocket with that part fitted, drawn straight onto a small canvas (no picture to encode, so the Parts
// tab redraws all its tiles in a few milliseconds when he fits a part), showing the end of the rocket where the part is.
import { useEffect, useRef } from 'preact/hooks';
import { drawRocket, rocketSize, type RocketLook } from './rocket';

export function PartPic({ look, crop }: { look: RocketLook; crop: 'top' | 'mid' | 'end' }) {
  const ref = useRef<HTMLCanvasElement>(null), key = JSON.stringify(look);
  useEffect(() => {
    const c = ref.current!, b = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), ctx = c.getContext('2d');
    if (!b.width || !b.height || !ctx) return;
    c.width = Math.round(b.width * dpr); c.height = Math.round(b.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = rocketSize(look), tall = b.height * 2, s = Math.min(tall / size.h, (b.width * .9) / size.w), h = size.h * s;
    const bottom = crop === 'top' ? h + 6 : crop === 'end' ? b.height - 4 : b.height / 2 + h / 2;
    drawRocket(ctx, look, b.width / 2, bottom, s);
  }, [key, crop]);
  return <canvas ref={ref} class={`part-pic ${crop}`} aria-hidden="true" />;
}
