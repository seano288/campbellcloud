// The pictures as components: his car on a canvas that fits its box (from the side or from above), the tray's car pictures drawn once
// and kept, and the little cars on the question screens, drawn in SVG from a colour and a roof symbol. `live` keeps the wheels turning
// and the flame flickering, unless Reduce Motion is on.
import { useEffect, useRef } from 'preact/hooks';
import { COLOUR_ART, type CarColour } from '../tally/problems';
import { drawCarSide, drawCarTop, SIDE_SPAN, type Look } from './car';

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
type Draw = (c: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

export function CanvasArt({ draw, live = false, class: cls = '', label, deps }: { draw: Draw; live?: boolean; class?: string; label: string | null; deps: readonly unknown[] }) {
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

const fitSide = (c: CanvasRenderingContext2D, w: number, h: number, pad = .92) => {
  const k = Math.min(w / (SIDE_SPAN.right - SIDE_SPAN.left), h / (SIDE_SPAN.bottom - SIDE_SPAN.top)) * pad;
  c.translate(w / 2, h / 2 - ((SIDE_SPAN.top + SIDE_SPAN.bottom) / 2) * k);
  c.scale(k, k);
};
const fitTop = (c: CanvasRenderingContext2D, w: number, h: number, pad = .8, turn = 0) => {
  const k = Math.min(w / (turn ? 70 : 110), h / (turn ? 110 : 70)) * pad;
  c.translate(w / 2, h / 2); c.scale(k, k); c.rotate(turn);
};

export function CarView({ car, view = 'side', live = false, boosting = false, class: cls = '', label = 'Your race car' }: { car: Look; view?: 'side' | 'top'; live?: boolean; boosting?: boolean; class?: string; label?: string | null }) {
  return <CanvasArt class={`car-view ${cls}`} live={live} label={label} deps={[JSON.stringify(car), view, live, boosting]}
    draw={(c, w, h, t) => {
      if (view === 'side') { fitSide(c, w, h); drawCarSide(c, car, { t: live ? t : .3, boosting }); }
      else { fitTop(c, w, h, .8, w < h ? -Math.PI / 2 : 0); drawCarTop(c, car, { t, boosting }); }
    }} />;
}

/** The drawing trimmed to the car itself (and a little round it), so a picture in a small tile is all car and no empty sky. */
function cropped(canvas: HTMLCanvasElement, c: CanvasRenderingContext2D) {
  const { width: w, height: h } = canvas, px = c.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3]! > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  // kept inside the drawing: Safari draws nothing for a source box that pokes outside it
  const pad = 6, sx = Math.max(0, x0 - pad), sy = Math.max(0, y0 - pad), cw = Math.min(w, x1 + 1 + pad) - sx, ch = Math.min(h, y1 + 1 + pad) - sy, out = document.createElement('canvas');
  out.width = cw; out.height = ch;
  out.getContext('2d')?.drawImage(canvas, sx, sy, cw, ch, 0, 0, cw, ch);
  return out.toDataURL('image/png');
}

const pics = new Map<string, string>();
/** A car drawn once to a picture, for the parts tray. */
export function carPic(car: Look, view: 'side' | 'top' = 'side') {
  const key = `${JSON.stringify(car)}|${view}`;
  let url = pics.get(key);
  if (!url) {
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 180;
    const c = canvas.getContext('2d');
    if (c) { if (view === 'side') fitSide(c, 300, 180, .98); else fitTop(c, 300, 180, .9); (view === 'side' ? drawCarSide : drawCarTop)(c, car, { t: .3 }); }
    url = (c && cropped(canvas, c)) ?? canvas.toDataURL('image/png');
    pics.set(key, url);
    if (pics.size > 400) pics.delete(pics.keys().next().value!); // the tray never needs this many at once
  }
  return url;
}

// ---------- the little cars on question screens ----------

/** A roof symbol, drawn round 0,0 about 1 unit across. */
function Symbol({ kind, ink }: { kind: (typeof COLOUR_ART)[CarColour]['symbol']; ink: string }) {
  const p = { fill: ink, stroke: 'none' };
  switch (kind) {
    case 'star': return <path {...p} d="M0 -1 L.24 -.33 L.95 -.31 L.39 .12 L.59 .81 L0 .4 L-.59 .81 L-.39 .12 L-.95 -.31 L-.24 -.33 Z" />;
    case 'bolt': return <path {...p} d="M.2 -1 L-.55 .1 L-.05 .1 L-.25 1 L.55 -.15 L.05 -.15 Z" />;
    case 'leaf': return <path {...p} d="M-.8 .8 Q-.9 -.9 .9 -.9 Q.9 .9 -.8 .8 Z" />;
    case 'sun': return <g fill={ink}><circle r=".5" />{[0, 1, 2, 3, 4, 5, 6, 7].map(i => <rect key={i} x="-.09" y="-1" width=".18" height=".32" transform={`rotate(${i * 45})`} />)}</g>;
    case 'flame': return <path {...p} d="M0 -1 Q.8 -.2 .55 .45 Q.35 1 0 1 Q-.35 1 -.55 .45 Q-.7 0 -.2 -.4 Q-.1 0 .05 .1 Q.15 -.5 0 -1 Z" />;
    case 'moon': return <path {...p} d="M.3 -.95 A.95 .95 0 1 0 .3 .95 A.75 .75 0 1 1 .3 -.95 Z" />;
    case 'heart': return <path {...p} d="M0 .85 C-1.3 -.1 -.6 -1.2 0 -.45 C.6 -1.2 1.3 -.1 0 .85 Z" />;
    case 'diamond': return <path {...p} d="M0 -1 L.75 0 L0 1 L-.75 0 Z" />;
    case 'crown': return <path {...p} d="M-.9 .6 L-.9 -.6 L-.45 -.1 L0 -.8 L.45 -.1 L.9 -.6 L.9 .6 Z" />;
    case 'ring': return <circle r=".62" fill="none" stroke={ink} stroke-width=".32" />;
  }
}

/** A car from above, facing right (the way they race on every question screen), with its colour and roof symbol. Never a number. */
export function QuizCar({ colour, class: cls = '' }: { colour: CarColour; class?: string }) {
  const art = COLOUR_ART[colour];
  return (
    <svg class={`quiz-car ${cls}`} viewBox="-58 -32 116 64" aria-hidden="true">
      {[[-28, -24], [-28, 24], [26, -24], [26, 24]].map(([x, y], i) => <rect key={i} x={x! - 11} y={y! - 7} width="22" height="14" rx="4" fill="#1d1f24" stroke="#000" stroke-width="3" />)}
      <path d="M-50 -22 L30 -22 Q52 -22 52 0 Q52 22 30 22 L-50 22 Q-54 22 -54 18 L-54 -18 Q-54 -22 -50 -22 Z" fill={art.fill} stroke="#000" stroke-width="4" />
      <rect x="-52" y="-26" width="9" height="52" rx="3" fill={art.fill} stroke="#000" stroke-width="3" />
      <ellipse cx="22" cy="0" rx="9" ry="14" fill="#9fd8ff" stroke="#000" stroke-width="3" />
      <g transform="translate(-12 0) scale(13)"><Symbol kind={art.symbol} ink={art.ink} /></g>
    </svg>
  );
}
