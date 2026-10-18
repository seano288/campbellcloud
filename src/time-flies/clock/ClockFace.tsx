// The analog clock, styled like a cockpit instrument: a gunmetal bezel with four screws around a white dial. The short
// hour hand is red and the long minute hand is blue, so "the short hand" and "the long hand" are easy to find. A Lesson
// lights up the hand and numbers being talked about and counts the fives round the bezel. When `onTurn` is given, he can
// drag either hand; they are geared together like a real clock.
import { useRef } from 'preact/hooks';
import { tone } from '../../audio/sfx';
import type { Lesson } from './teach';

const R = 92;
const polar = (deg: number, r: number) => { const a = ((deg - 90) * Math.PI) / 180; return [Math.cos(a) * r, Math.sin(a) * r] as const; };

export interface ClockFaceProps {
  /** Minutes past 12, unwrapped (it can go past 720 so the hands never spin backwards to get somewhere). */
  minutes: number;
  lesson?: Lesson | undefined;
  /** Show every minute label (5, 10, 15...) round the bezel. */
  minuteLabels?: boolean;
  /** The hands glide to a new time rather than jumping. */
  glide?: boolean;
  /** Drag the hands: called with the new unwrapped minutes as they move, and once more with `done` when let go. */
  onTurn?: ((minutes: number, done: boolean) => void) | undefined;
  /** At this many minutes the long hand clicks as it passes (5, 15 or 60). */
  step?: number;
  label?: string;
}

export function ClockFace({ minutes, lesson, minuteLabels, glide = true, onTurn, step = 5, label }: ClockFaceProps) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ hand: 'hour' | 'minute'; last: number; total: number } | null>(null);
  const hand = lesson?.hand.value ?? null, lit = lesson?.lit.value ?? [], fives = lesson?.fives.value ?? 0;
  const hourDeg = minutes * 0.5, minuteDeg = minutes * 6;

  function angleAt(e: PointerEvent) {
    const r = svg.current!.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    return { deg: ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360, dist: Math.hypot(x, y) / (r.width / 2) * 110 };
  }
  const gap = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

  function down(e: PointerEvent) {
    if (!onTurn) return;
    const { deg, dist } = angleAt(e);
    const nearHour = gap(deg, hourDeg % 360) < 35, nearMinute = gap(deg, minuteDeg % 360) < 35;
    // the short hand only reaches so far; a grab further out (or on the long hand) moves the minutes
    const which = dist < 58 && nearHour && !(nearMinute && dist > 40) ? 'hour' : 'minute';
    drag.current = { hand: which, last: deg, total: minutes };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function move(e: PointerEvent) {
    const d = drag.current;
    if (!d || !onTurn) return;
    const { deg } = angleAt(e);
    const delta = ((((deg - d.last) % 360) + 540) % 360) - 180;
    d.last = deg;
    const before = d.total;
    d.total += d.hand === 'minute' ? delta / 6 : delta * 2;
    if (Math.floor(before / step) !== Math.floor(d.total / step)) tone(1500, 0.03, 'square', 0, 0.04);
    onTurn(d.total, false);
  }
  function up() {
    const d = drag.current;
    if (!d || !onTurn) return;
    drag.current = null;
    onTurn(d.total, true);
  }

  const dragging = !!drag.current;
  const handStyle = (deg: number) => ({ transform: `rotate(${deg}deg)`, transition: glide && !dragging ? 'transform .6s cubic-bezier(.3,1.4,.5,1)' : 'none' });
  return (
    <svg ref={svg} class={`clock ${onTurn ? 'turnable' : ''}`} viewBox="-110 -110 220 220" role="img" aria-label={label}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <defs>
        <radialGradient id="cf-bezel" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#7d8794" /><stop offset=".55" stop-color="#3b424c" /><stop offset="1" stop-color="#1c2027" /></radialGradient>
        <radialGradient id="cf-face" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#ffffff" /><stop offset=".8" stop-color="#f4f1e8" /><stop offset="1" stop-color="#d9d4c5" /></radialGradient>
        <filter id="cf-glow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ffd23f" flood-opacity="1" /></filter>
        <filter id="cf-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="2" dy="3" stdDeviation="2" flood-color="#000" flood-opacity=".35" /></filter>
      </defs>
      <circle r="108" fill="url(#cf-bezel)" stroke="#0b0d10" stroke-width="3" />
      {[45, 135, 225, 315].map(a => { const [x, y] = polar(a, 101); return <g key={a}><circle cx={x} cy={y} r="4.2" fill="#9aa3ad" stroke="#20252c" stroke-width="1.2" /><line x1={x - 2.6} y1={y - 2.6} x2={x + 2.6} y2={y + 2.6} stroke="#20252c" stroke-width="1.4" /></g>; })}
      <circle r={R} fill="url(#cf-face)" stroke="#11151a" stroke-width="2.5" />
      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0, [x1, y1] = polar(i * 6, R - 2), [x2, y2] = polar(i * 6, R - (major ? 11 : 6));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1d1d1f" stroke-width={major ? 3 : 1.2} stroke-linecap="round" />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1, [x, y] = polar(n * 30, 70), on = lit.includes(n);
        return (
          <g key={n}>
            {on && <circle cx={x} cy={y} r="15" fill="#ffd23f" filter="url(#cf-glow)" />}
            <text x={x} y={y} dy="7.5" text-anchor="middle" class="cf-num" fill={on ? '#000' : '#1d1d1f'}>{n}</text>
          </g>
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const k = i + 1, shown = minuteLabels || (fives > 0 && k <= fives);
        if (!shown) return null;
        const [x, y] = polar(k * 30, 100), on = fives === k;
        return <text key={k} x={x} y={y} dy="3.6" text-anchor="middle" class={`cf-min ${on ? 'on' : ''}`}>{k === 12 ? '00' : k * 5}</text>;
      })}
      <path d="M-9 30 L0 25 L9 30 L1.5 27.5 L1.5 34 L4 36 L-4 36 L-1.5 34 L-1.5 27.5 Z" fill="#9aa3ad" opacity=".7" />
      <g style={handStyle(hourDeg)} filter={hand === 'hour' ? 'url(#cf-glow)' : 'url(#cf-shadow)'}>
        <path d="M-6.5 12 L-6 -38 Q0 -52 6 -38 L6.5 12 Z" fill="#e2352b" stroke={hand === 'hour' ? '#ffd23f' : '#6e120c'} stroke-width={hand === 'hour' ? 4 : 2} stroke-linejoin="round" />
      </g>
      <g style={handStyle(minuteDeg)} filter={hand === 'minute' ? 'url(#cf-glow)' : 'url(#cf-shadow)'}>
        <path d="M-4 16 L-3.2 -70 L0 -82 L3.2 -70 L4 16 Z" fill="#1f5fd1" stroke={hand === 'minute' ? '#ffd23f' : '#0b2a66'} stroke-width={hand === 'minute' ? 4 : 1.6} stroke-linejoin="round" />
      </g>
      <circle r="8" fill="#2a2f36" stroke="#000" stroke-width="2" />
      <circle r="3" fill="#c9ced6" />
      {onTurn && <circle r="108" fill="transparent" />}
    </svg>
  );
}
