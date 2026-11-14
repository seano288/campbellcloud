// His ship from the side, drawn in code from the parts he has fitted: the hull sets the size and the number of masts (a rowing boat
// with one stick up to a three-masted galleon), the sails dress each mast, the cannons poke out of the side, the figurehead rides the
// bow and his flag flies from the top. The same ship sails the Voyage (from above, art/draw.ts) and waits outside the Hoard.
import type { JSX } from 'preact';
import { colourOf, rungOf, type EmblemId, type Ship } from '../fleet/parts';

const O = '#1d140c';
const ink = { stroke: O, 'stroke-width': 5, 'stroke-linejoin': 'round' as const, 'stroke-linecap': 'round' as const };

interface HullShape { half: number; deep: number; masts: number[]; mastH: number; wood: string; trim: string; stern: number }
const HULLS: HullShape[] = [
  { half: 78, deep: 34, masts: [0], mastH: 110, wood: '#a8743c', trim: '#7a4e22', stern: 0 },
  { half: 108, deep: 44, masts: [-6], mastH: 150, wood: '#9b5f2e', trim: '#f4f1e8', stern: 10 },
  { half: 130, deep: 52, masts: [-50, 40], mastH: 165, wood: '#7e4a24', trim: '#ffd23f', stern: 22 },
  { half: 150, deep: 62, masts: [-74, 4, 78], mastH: 185, wood: '#5e3218', trim: '#ffd23f', stern: 40 },
];

function Hull({ h, cannons }: { h: HullShape; cannons: number }) {
  const { half, deep, stern } = h;
  const body = `M${-half} ${-16 - stern} L${-half + 12} ${deep - 6} Q0 ${deep + 10} ${half - 22} ${deep - 6} L${half + 10} -22 L${half - 6} -12 L${-half + 30} -12 L${-half + 30} ${-16 - stern} Z`;
  const count = Math.min(4, cannons + 1), ports = cannons ? Array.from({ length: count }, (_, i) => -half * .55 + (i * half * 1.2) / Math.max(1, count - 1)) : [];
  const gold = cannons >= 3;
  return (
    <g>
      <path d={body} fill={h.wood} {...ink} />
      <path d={`M${-half + 10} 8 Q0 18 ${half - 4} 4`} fill="none" stroke={h.trim} stroke-width="6" />
      {[16, 30].map(y => y < deep && <path key={y} d={`M${-half + 14} ${y + 4} Q0 ${y + 14} ${half - 14} ${y}`} fill="none" stroke="#00000033" stroke-width="3" />)}
      {stern > 0 && <rect x={-half + 4} y={-16 - stern - 14} width={44} height={14} rx="4" fill={h.trim} {...ink} stroke-width="3" />}
      {ports.map((x, i) => (
        <g key={i} transform={`translate(${x} ${-2})`}>
          <rect x="-11" y="-9" width="22" height="18" rx="4" fill="#2a1a0e" />
          <rect x="-4" y="-5" width={cannons >= 2 ? 22 : 16} height="10" rx="4" fill={gold ? '#ffd23f' : '#3a3d44'} stroke={O} stroke-width="2.5" transform="rotate(-8)" />
        </g>
      ))}
    </g>
  );
}

function Sail({ x, top, h, rung, mast }: { x: number; top: number; h: number; rung: number; mast: number }) {
  const w = 34 + rung * 10 + (mast === 1 ? 8 : 0);
  if (rung === 0) { // a bedsheet on a stick: one floppy square with stripes
    return (
      <g>
        <path d={`M${x + 4} ${top + 10} Q${x + 46} ${top + 30} ${x + 50} ${top + 62} L${x + 4} ${top + 66} Z`} fill="#f4f6fa" {...ink} stroke-width="4" />
        <path d={`M${x + 10} ${top + 30} Q${x + 30} ${top + 36} ${x + 42} ${top + 44} M${x + 8} ${top + 48} Q${x + 28} ${top + 52} ${x + 46} ${top + 56}`} fill="none" stroke="#7fb3e6" stroke-width="5" />
      </g>
    );
  }
  const rows = rung === 1 ? 1 : rung === 2 ? 2 : 3, rowH = (h - 20) / rows;
  const cloth = rung === 3 ? '#fff6dc' : rung === 2 ? '#f4f1e8' : '#e8dcc0';
  return (
    <g>
      {Array.from({ length: rows }, (_, r) => {
        const y = top + 10 + r * rowH, ww = w * (1 - r * .12);
        return (
          <g key={r}>
            <path d={`M${x - ww} ${y} Q${x} ${y - 6} ${x + ww} ${y} Q${x + ww + 6} ${y + rowH / 2} ${x + ww} ${y + rowH - 6} Q${x} ${y + rowH + 4} ${x - ww} ${y + rowH - 6} Q${x - ww - 6} ${y + rowH / 2} ${x - ww} ${y} Z`} fill={cloth} {...ink} stroke-width="4" />
            {rung === 1 && <rect x={x - ww / 2} y={y + rowH / 3} width={ww / 2.4} height={rowH / 3} fill="#c9a06a" stroke={O} stroke-width="2" />}
            {rung === 3 && <path d={`M${x - ww + 4} ${y + rowH / 2} H${x + ww - 4}`} stroke="#c81d25" stroke-width="7" />}
          </g>
        );
      })}
    </g>
  );
}

function Emblem({ id, colour }: { id: EmblemId; colour: string }) {
  if (id === 'shark') return <path d="M-12 8 Q-2 -4 6 -14 Q8 -2 14 8 Z" fill={colour} stroke={O} stroke-width="2" />;
  if (id === 'dragon') return <path d="M-14 6 Q-10 -10 0 -8 Q4 -16 12 -12 Q8 -6 10 0 Q16 2 14 8 Q2 4 -14 6 Z" fill={colour} stroke={O} stroke-width="2" />;
  return (
    <g>
      <circle cy="-3" r="9" fill={colour} stroke={O} stroke-width="2" />
      <rect x="-5" y="4" width="10" height="5" fill={colour} stroke={O} stroke-width="2" />
      <circle cx="-3.5" cy="-4" r="2.5" fill={O} /><circle cx="3.5" cy="-4" r="2.5" fill={O} />
    </g>
  );
}

export function Flag({ ship, x = 0, y = 0, wave = true }: { ship: Pick<Ship, 'flag' | 'colour'>; x?: number; y?: number; wave?: boolean }) {
  const c = colourOf(ship.colour);
  return (
    <g transform={`translate(${x} ${y})`} class={wave ? 'flag-wave' : ''}>
      <path d="M0 0 Q20 -6 40 0 Q60 6 70 0 L70 40 Q60 46 40 40 Q20 34 0 40 Z" fill={c.cloth} {...ink} stroke-width="4" />
      <g transform="translate(35 20) scale(1.2)"><Emblem id={ship.flag} colour={c.mark} /></g>
    </g>
  );
}

function Figurehead({ rung, x }: { rung: number; x: number }) {
  const parts: Record<number, JSX.Element | null> = {
    0: null,
    1: <g transform={`translate(${x} -40)`}><ellipse rx="16" ry="10" fill="#fff" {...ink} stroke-width="3" /><circle cx="14" cy="-8" r="8" fill="#fff" {...ink} stroke-width="3" /><path d="M20 -8 L30 -5 L20 -3 Z" fill="#ffb02e" stroke={O} stroke-width="2" /><path d="M-6 -4 Q-20 -22 -30 -10" fill="#e6e9ef" {...ink} stroke-width="3" /></g>,
    2: <g transform={`translate(${x} -34)`}><path d="M-8 30 Q-14 4 0 -10 Q10 4 6 30 Z" fill="#3ec7b2" {...ink} stroke-width="3" /><circle cy="-18" r="10" fill="#f2c79b" {...ink} stroke-width="3" /><path d="M-10 -22 Q-16 0 -6 6 M10 -22 Q14 -6 8 4" stroke="#e8573a" stroke-width="6" fill="none" stroke-linecap="round" /></g>,
    3: <g transform={`translate(${x} -40)`}><path d="M-10 26 Q-18 0 4 -8 Q26 -16 30 -2 Q18 -2 14 6 Q8 14 6 26 Z" fill="#3fa34d" {...ink} stroke-width="3" /><circle cx="18" cy="-8" r="3" fill="#ffd23f" /><path d="M2 -10 L-4 -22 L8 -12 M14 -14 L14 -26 L20 -14" fill="#3fa34d" stroke={O} stroke-width="2.5" /></g>,
  };
  return parts[rung] ?? null;
}

/** The ship's art as an SVG group, standing on its waterline at y = 0, about 330 wide and 300 tall. */
export function ShipArt({ ship, bob = true }: { ship: Ship; bob?: boolean }) {
  const hull = HULLS[rungOf(ship, 'hull')]!, sails = rungOf(ship, 'sails'), cannons = rungOf(ship, 'cannons'), fig = rungOf(ship, 'figurehead');
  const deckY = -12, tallest = hull.masts.map((_, i) => hull.mastH * (i === Math.floor(hull.masts.length / 2) ? 1 : .82));
  return (
    <g class={bob ? 'ship-bob' : ''}>
      {hull.masts.map((x, i) => {
        const h = tallest[i]!, top = deckY - h;
        return (
          <g key={i}>
            <path d={`M${x} ${deckY} V${top}`} stroke={O} stroke-width="10" stroke-linecap="round" />
            <path d={`M${x} ${deckY} V${top}`} stroke="#8a5a2b" stroke-width="5" stroke-linecap="round" />
            <Sail x={x} top={top} h={h - 30} rung={sails} mast={i} />
            {i === Math.floor(hull.masts.length / 2) && <Flag ship={ship} x={x} y={top - 34} />}
          </g>
        );
      })}
      {hull === HULLS[0] && <path d="M-40 6 L-96 40 M40 6 L96 40" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round" />}
      <Hull h={hull} cannons={cannons} />
      <Figurehead rung={fig} x={hull.half + 4} />
    </g>
  );
}

/** The ship on a bit of sea, sized to its box. */
/** Each hull's box, so a rowing boat fills its picture as well as a galleon does. */
const BOXES = ['-125 -180 250 245', '-145 -215 290 280', '-160 -232 320 297', '-178 -252 356 317'] as const;

export function ShipView({ ship, class: cls = '', label = 'Your ship', sea = true }: { ship: Ship; class?: string; label?: string | null; sea?: boolean }) {
  return (
    <svg class={`ship-view ${cls}`} viewBox={BOXES[rungOf(ship, 'hull')]} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' })}>
      {sea && <path d="M-180 18 Q-135 6 -90 18 T0 18 T90 18 T180 18 V65 H-180 Z" class="ship-sea" />}
      <ShipArt ship={ship} />
      {sea && <path d="M-180 30 Q-135 20 -90 30 T0 30 T90 30 T180 30 V65 H-180 Z" class="ship-sea front" />}
    </svg>
  );
}
