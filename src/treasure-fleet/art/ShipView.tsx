// His ship from the side, drawn in code from the parts he has fitted: the hull sets the size and the number of masts (a rowing boat
// with one stick up to a three-masted galleon), the sails dress each mast, the cannons poke out of the side, the figurehead rides the
// bow and his flag flies from the top. The same ship sails the Voyage (from above, art/draw.ts) and waits outside the Hoard.
import type { JSX } from 'preact';
import { colourOf, GUN_METAL, rungOf, type EmblemId, type Ship } from '../fleet/parts';

const O = '#1d140c';
const ink = { stroke: O, 'stroke-width': 5, 'stroke-linejoin': 'round' as const, 'stroke-linecap': 'round' as const };

interface HullShape { half: number; deep: number; masts: number[]; mastH: number; wood: string; trim: string; stern: number; ghost?: boolean }
const HULLS: HullShape[] = [
  { half: 78, deep: 34, masts: [0], mastH: 110, wood: '#a8743c', trim: '#7a4e22', stern: 0 },
  { half: 108, deep: 44, masts: [-6], mastH: 150, wood: '#9b5f2e', trim: '#f4f1e8', stern: 10 },
  { half: 130, deep: 52, masts: [-50, 40], mastH: 165, wood: '#7e4a24', trim: '#ffd23f', stern: 22 },
  { half: 150, deep: 62, masts: [-74, 4, 78], mastH: 185, wood: '#5e3218', trim: '#ffd23f', stern: 40 },
  // Rungs 4 to 6: a blue-painted frigate, a battleship with two rows of guns, and a glowing ghost ship
  { half: 160, deep: 64, masts: [-80, 4, 84], mastH: 195, wood: '#2f4f7a', trim: '#ffd23f', stern: 44 },
  { half: 170, deep: 74, masts: [-88, 0, 90], mastH: 205, wood: '#3a1f12', trim: '#d62828', stern: 50 },
  { half: 170, deep: 70, masts: [-88, 0, 90], mastH: 205, wood: '#5f8f88', trim: '#b8ffe6', stern: 50, ghost: true },
];

function Hull({ h, cannons }: { h: HullShape; cannons: number }) {
  const { half, deep, stern } = h;
  const body = `M${-half} ${-16 - stern} L${-half + 12} ${deep - 6} Q0 ${deep + 10} ${half - 22} ${deep - 6} L${half + 10} -22 L${half - 6} -12 L${-half + 30} -12 L${-half + 30} ${-16 - stern} Z`;
  const count = Math.min(5, cannons + 1), ports = cannons ? Array.from({ length: count }, (_, i) => -half * .55 + (i * half * 1.2) / Math.max(1, count - 1)) : [];
  const metal = GUN_METAL[cannons] ?? GUN_METAL[0], rows = deep >= 70 ? [-2, 30] : [-2];
  return (
    <g>
      {h.ghost && <path d={body} fill="none" stroke="#b8ffe6" stroke-width="22" stroke-linejoin="round" opacity=".45" />}
      <path d={body} fill={h.wood} {...ink} />
      <path d={`M${-half + 10} 8 Q0 18 ${half - 4} 4`} fill="none" stroke={h.trim} stroke-width="6" />
      {[16, 30].map(y => y < deep && <path key={y} d={`M${-half + 14} ${y + 4} Q0 ${y + 14} ${half - 14} ${y}`} fill="none" stroke="#00000033" stroke-width="3" />)}
      {stern > 0 && <rect x={-half + 4} y={-16 - stern - 14} width={44} height={14} rx="4" fill={h.trim} {...ink} stroke-width="3" />}
      {rows.flatMap(y => ports.map((x, i) => (
        <g key={`${y}:${i}`} transform={`translate(${x} ${y})`}>
          <rect x="-11" y="-9" width="22" height="18" rx="4" fill="#2a1a0e" />
          <rect x="-4" y="-5" width={cannons >= 2 ? 22 : 16} height="10" rx="4" fill={metal} stroke={O} stroke-width="2.5" transform="rotate(-8)" />
          {cannons === 5 && <path d="M18 -6 Q26 -2 22 4 Q30 0 28 -8" fill="#ffb02e" stroke={O} stroke-width="1.5" />}
          {cannons === 6 && <path d="M8 -4 L4 0 L9 0 L5 5" fill="none" stroke="#ffe066" stroke-width="2.5" />}
        </g>
      )))}
      {h.ghost && <path d={`M${-half * .3} ${deep - 14} l8 -12 l6 10 l8 -14 l6 12 M${half * .25} ${deep - 18} l6 -10 l8 12`} fill="none" stroke="#1d140c" stroke-width="3" />}
    </g>
  );
}

const RAINBOW = ['#ff5a5a', '#ffb02e', '#ffe14d', '#4cd07a', '#4aa8ff', '#9a6bff'] as const;

function Sail({ x, top, h, rung, mast }: { x: number; top: number; h: number; rung: number; mast: number }) {
  const w = 34 + Math.min(rung, 3) * 10 + (rung > 3 ? 6 : 0) + (mast === 1 ? 8 : 0);
  if (rung === 6) { // dragon wings: a bat wing of dark red cloth on bony ribs
    const ww = w + 6, y0 = top + 6, y1 = top + h;
    return (
      <g>
        <path d={`M${x - ww} ${y0 + 10} Q${x} ${y0 - 12} ${x + ww} ${y0 + 10} L${x + ww - 8} ${y1 - 10} Q${x + ww * .5} ${y1 - 30} ${x + ww * .3} ${y1} Q${x} ${y1 - 24} ${x - ww * .3} ${y1} Q${x - ww * .5} ${y1 - 30} ${x - ww + 8} ${y1 - 10} Z`} fill="#8a1c2b" {...ink} stroke-width="4" />
        <path d={`M${x} ${y0} L${x + ww * .3} ${y1} M${x} ${y0} L${x - ww * .3} ${y1} M${x} ${y0} L${x + ww - 8} ${y1 - 10} M${x} ${y0} L${x - ww + 8} ${y1 - 10}`} stroke="#f2c79b" stroke-width="3" fill="none" />
      </g>
    );
  }
  if (rung === 0) { // a bedsheet on a stick: one floppy square with stripes
    return (
      <g>
        <path d={`M${x + 4} ${top + 10} Q${x + 46} ${top + 30} ${x + 50} ${top + 62} L${x + 4} ${top + 66} Z`} fill="#f4f6fa" {...ink} stroke-width="4" />
        <path d={`M${x + 10} ${top + 30} Q${x + 30} ${top + 36} ${x + 42} ${top + 44} M${x + 8} ${top + 48} Q${x + 28} ${top + 52} ${x + 46} ${top + 56}`} fill="none" stroke="#7fb3e6" stroke-width="5" />
      </g>
    );
  }
  const rows = rung === 1 ? 1 : rung === 2 ? 2 : 3, rowH = (h - 20) / rows;
  const cloth = rung === 5 ? null : rung >= 3 ? '#fff6dc' : rung === 2 ? '#f4f1e8' : '#e8dcc0';
  return (
    <g>
      {Array.from({ length: rows }, (_, r) => {
        const y = top + 10 + r * rowH, ww = w * (1 - r * .12);
        const fill = cloth ?? RAINBOW[(r * 2 + mast) % RAINBOW.length]!;
        return (
          <g key={r}>
            <path d={`M${x - ww} ${y} Q${x} ${y - 6} ${x + ww} ${y} Q${x + ww + 6} ${y + rowH / 2} ${x + ww} ${y + rowH - 6} Q${x} ${y + rowH + 4} ${x - ww} ${y + rowH - 6} Q${x - ww - 6} ${y + rowH / 2} ${x - ww} ${y} Z`} fill={fill} {...ink} stroke-width="4" />
            {rung === 4 && [-.5, 0, .5].map(k => <rect key={k} x={x + ww * k - ww * .14} y={y + 2} width={ww * .28} height={rowH - 8} fill="#d62828" />)}
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
  if (id === 'anchor') return <g fill="none" stroke={colour} stroke-width="3.5" stroke-linecap="round"><circle cy="-11" r="3" /><path d="M0 -8 V10 M-7 -3 H7 M-11 2 Q-10 11 0 11 Q10 11 11 2" /></g>;
  if (id === 'swords') return <g stroke={colour} stroke-width="3.5" stroke-linecap="round"><path d="M-11 -11 L11 11 M11 -11 L-11 11" /><path d="M-13 5 L-5 13 M13 5 L5 13" stroke-width="4.5" /></g>;
  if (id === 'octopus') return <g fill={colour} stroke={O} stroke-width="1.5"><ellipse cy="-5" rx="9" ry="8" />{[-8, -3, 3, 8].map(x => <path key={x} d={`M${x * .7} 1 Q${x} 8 ${x * 1.3} 12`} fill="none" stroke={colour} stroke-width="3.5" />)}<circle cx="-3" cy="-5" r="1.6" fill={O} /><circle cx="3" cy="-5" r="1.6" fill={O} /></g>;
  if (id === 'star') return <path d="M0 -13 L3.8 -4.2 L13 -4 L5.8 2.2 L8 12 L0 6.6 L-8 12 L-5.8 2.2 L-13 -4 L-3.8 -4.2 Z" fill={colour} stroke={O} stroke-width="1.5" />;
  if (id === 'crown') return <path d="M-12 8 L-12 -8 L-6 0 L0 -12 L6 0 L12 -8 L12 8 Z" fill={colour} stroke={O} stroke-width="2" stroke-linejoin="round" />;
  if (id === 'parrot') return <g fill={colour} stroke={O} stroke-width="1.5"><path d="M-6 12 Q-12 0 -4 -8 Q4 -14 9 -7 Q6 -3 2 -2 Q4 6 -6 12 Z" /><path d="M9 -7 L13 -4 L8 -3 Z" /><circle cx="3" cy="-8" r="1.6" fill={O} /></g>;
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
    // the wave is a CSS transform, so it goes on an inner group: on the outer one it would replace the translate
    <g transform={`translate(${x} ${y})`}>
      <g class={wave ? 'flag-wave' : ''}>
        <path d="M0 0 Q20 -6 40 0 Q60 6 70 0 L70 40 Q60 46 40 40 Q20 34 0 40 Z" fill={c.cloth} {...ink} stroke-width="4" />
        <g transform="translate(35 20) scale(1.2)"><Emblem id={ship.flag} colour={c.mark} /></g>
      </g>
    </g>
  );
}

function Figurehead({ rung, x }: { rung: number; x: number }) {
  const parts: Record<number, JSX.Element | null> = {
    0: null,
    1: <g transform={`translate(${x} -40)`}><ellipse rx="16" ry="10" fill="#fff" {...ink} stroke-width="3" /><circle cx="14" cy="-8" r="8" fill="#fff" {...ink} stroke-width="3" /><path d="M20 -8 L30 -5 L20 -3 Z" fill="#ffb02e" stroke={O} stroke-width="2" /><path d="M-6 -4 Q-20 -22 -30 -10" fill="#e6e9ef" {...ink} stroke-width="3" /></g>,
    2: <g transform={`translate(${x} -34)`}><path d="M-8 30 Q-14 4 0 -10 Q10 4 6 30 Z" fill="#3ec7b2" {...ink} stroke-width="3" /><circle cy="-18" r="10" fill="#f2c79b" {...ink} stroke-width="3" /><path d="M-10 -22 Q-16 0 -6 6 M10 -22 Q14 -6 8 4" stroke="#e8573a" stroke-width="6" fill="none" stroke-linecap="round" /></g>,
    3: <g transform={`translate(${x} -40)`}><path d="M-10 26 Q-18 0 4 -8 Q26 -16 30 -2 Q18 -2 14 6 Q8 14 6 26 Z" fill="#3fa34d" {...ink} stroke-width="3" /><circle cx="18" cy="-8" r="3" fill="#ffd23f" /><path d="M2 -10 L-4 -22 L8 -12 M14 -14 L14 -26 L20 -14" fill="#3fa34d" stroke={O} stroke-width="2.5" /></g>,
    // a great shark, jaws open
    4: <g transform={`translate(${x} -38)`}><path d="M-12 28 Q-18 4 0 -6 L-4 -24 L10 -8 Q30 -6 40 6 Q26 6 22 12 Q30 14 36 20 Q14 24 6 28 Z" fill="#8a9aa8" {...ink} stroke-width="3" /><path d="M22 12 L25 9 L27 13 L30 10 L32 15" fill="#fff" stroke={O} stroke-width="1.5" /><circle cx="22" cy="0" r="3" fill={O} /><path d="M-6 22 Q6 18 20 20" stroke="#e8eef2" stroke-width="5" fill="none" /></g>,
    // a white unicorn with a golden horn and a rainbow mane
    5: <g transform={`translate(${x} -40)`}><path d="M-10 28 Q-16 4 2 -6 Q20 -14 32 -2 Q34 6 26 8 Q16 8 12 14 Q8 22 6 28 Z" fill="#fbf7ff" {...ink} stroke-width="3" /><path d="M12 -10 L22 -36 L20 -8 Z" fill="#ffd23f" stroke={O} stroke-width="2.5" stroke-linejoin="round" /><circle cx="20" cy="-2" r="3" fill={O} />{['#ff5a5a', '#ffb02e', '#4aa8ff', '#9a6bff'].map((c, i) => <path key={c} d={`M${2 - i * 3} ${-8 + i * 6} Q${-12 - i * 2} ${-2 + i * 6} ${-10 - i * 2} ${8 + i * 6}`} stroke={c} stroke-width="5" fill="none" stroke-linecap="round" />)}</g>,
    // a phoenix with its wings up in flames
    6: <g transform={`translate(${x} -42)`}><path d="M-14 -4 Q-34 -40 -8 -30 Q-12 -46 6 -30 Q10 -10 -2 0 Z" fill="#ffb02e" {...ink} stroke-width="3" /><path d="M-8 30 Q-14 6 2 -6 Q16 -16 28 -6 L38 -2 L28 4 Q18 6 14 12 Q8 22 6 30 Z" fill="#e8573a" {...ink} stroke-width="3" /><path d="M-6 -10 Q-22 -32 -8 -26" stroke="#ffe14d" stroke-width="4" fill="none" /><circle cx="22" cy="-6" r="3" fill={O} /><path d="M6 -14 Q4 -26 12 -30 Q12 -20 16 -14" fill="#ffe14d" stroke={O} stroke-width="2" /></g>,
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
          </g>
        );
      })}
      {/* the flag last, so a big sail on the next mast never hides it */}
      {(() => { const i = Math.floor(hull.masts.length / 2); return <Flag ship={ship} x={hull.masts[i]!} y={deckY - tallest[i]! - 34} />; })()}
      {hull === HULLS[0] && <path d="M-40 6 L-96 40 M40 6 L96 40" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round" />}
      <Hull h={hull} cannons={cannons} />
      <Figurehead rung={fig} x={hull.half + 4} />
    </g>
  );
}

/** The ship on a bit of sea, sized to its box. */
/** Each hull's box, so a rowing boat fills its picture as well as a galleon does. */
const BOXES = ['-125 -180 250 245', '-145 -215 290 280', '-160 -232 320 297', '-178 -252 356 317', '-186 -262 382 327', '-196 -272 412 347', '-196 -272 412 347'] as const;

/** A patch of sea under the ship: a wavy top that tapers into a rounded belly, so it reads as water wherever it sits, not a box. */
const SEA_BACK = 'M-180 22 Q-158 10 -135 16 T-90 18 T0 18 T90 18 T135 16 Q158 10 180 22 Q150 62 0 64 Q-150 62 -180 22 Z';
const SEA_LINE = 'M-170 18 Q-150 8 -135 16 T-90 18 T0 18 T90 18 T135 16 Q150 8 170 18';
const SEA_FRONT = 'M-150 34 Q-120 24 -90 30 T0 30 T90 30 Q120 24 150 34 Q120 58 0 60 Q-120 58 -150 34 Z';

export function ShipView({ ship, class: cls = '', label = 'Your ship', sea = true }: { ship: Ship; class?: string; label?: string | null; sea?: boolean }) {
  return (
    <svg class={`ship-view ${cls}`} viewBox={BOXES[rungOf(ship, 'hull')]} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' })}>
      {sea && <path d={SEA_BACK} class="ship-sea" />}
      {sea && <path d={SEA_LINE} class="ship-sea-line" />}
      <ShipArt ship={ship} />
      {sea && <path d={SEA_FRONT} class="ship-sea front" />}
    </svg>
  );
}
