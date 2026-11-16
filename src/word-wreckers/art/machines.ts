// His machines from the side, facing right, drawn in code from what he owns: the paint, the driver in the cab, and the upgrades (a
// bigger or spiky ball, a wider blade, a claw). One SVG string per machine, so the same machine is drawn in the Yard, on the Job's
// canvas (as an image, with the moving part drawn on top: the crane's ball, the excavator's arm) and on the Town's street.
//
// The drawing is 240 wide and 160 tall; the ground is at y = 150. RIGS gives each machine's moving part in those units.
import { paintOf, upKey, type MachineId } from '../yard/shop';

export const MACHINE_W = 240, MACHINE_H = 160, GROUND = 150;
const O = '#1d1d1f';
const L = (w = 4) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** What a machine looks like: its paint, its driver's emoji, and the upgrades he owns for it. */
export interface Look { paint: string; driver: string; ups: readonly string[] }
const has = (look: Look, m: MachineId, id: string) => look.ups.includes(upKey(m, id));

/** The moving part of each machine, in drawing units: where the ball's rope hangs from, where the arm turns, where the blade is. */
export const RIGS = {
  crane: { kind: 'swing', tip: { x: 206, y: 14 }, rope: 116, ball: 17 },
  mega: { kind: 'swing', tip: { x: 214, y: 4 }, rope: 120, ball: 23 },
  skid: { kind: 'push', front: 214, top: 104 },
  dozer: { kind: 'push', front: 224, top: 92 },
  monster: { kind: 'push', front: 230, top: 74 },
  digger: { kind: 'bite', base: { x: 118, y: 84 }, reach: 150, bucket: 22 },
  robot: { kind: 'bite', base: { x: 132, y: 70 }, reach: 140, bucket: 22 },
  giant: { kind: 'bite', base: { x: 116, y: 72 }, reach: 180, bucket: 30 },
  dump: { kind: 'haul' },
  tower: { kind: 'lift' },
  minidig: { kind: 'bite', base: { x: 122, y: 96 }, reach: 116, bucket: 16 },
  jackhammer: { kind: 'hammer', tip: { x: 214, y: 150 } },
  breaker: { kind: 'hammer', tip: { x: 216, y: 150 } },
  dynamite: { kind: 'blast' },
  blaster: { kind: 'blast' },
  magnet: { kind: 'magnet', tip: { x: 210, y: 10 }, base: { x: 104, y: 98 } },
  supermag: { kind: 'magnet', tip: { x: 220, y: 0 }, base: { x: 116, y: 90 } },
  roller: { kind: 'pave', at: 186 },
  mixer: { kind: 'pave', at: 22 },
} as const satisfies Record<MachineId, { kind: string; [k: string]: unknown }>;
/** A magnet crane's magnet with its upgrades: wider with the Big Magnet or Giant Magnet. */
export function magnetOf(m: 'magnet' | 'supermag', look: Look) {
  const w = (m === 'supermag' ? 64 : 48) + (has(look, 'magnet', 'big') ? 12 : 0) + (has(look, 'supermag', 'giant') ? 16 : 0);
  return { w, h: m === 'supermag' ? 20 : 16, coil: has(look, 'magnet', 'coil') || m === 'supermag', rope: m === 'supermag' ? 96 : 84 };
}
/** A magnet: a flat disc on its cable, centred on x, its top at y. */
export function magnetSvg(x: number, y: number, mg: ReturnType<typeof magnetOf>) {
  return `<rect x="${x - mg.w / 2}" y="${y}" width="${mg.w}" height="${mg.h}" rx="5" fill="#5a5f66" ${L()}/><rect x="${x - mg.w / 2 + 4}" y="${y + 3}" width="${mg.w - 8}" height="${mg.h * .35}" rx="2" fill="${mg.coil ? '#e63946' : '#8a929b'}"/>` +
    `<path d="M${x - 10} ${y} L${x} ${y - 10} L${x + 10} ${y}" fill="none" stroke="${O}" stroke-width="3"/>`;
}
/** A crane's ball with its upgrades: bigger with the Big Ball, and so on. */
export function ballOf(m: 'crane' | 'mega', look: Look) {
  const r = RIGS[m].ball + (m === 'crane' && has(look, 'crane', 'bigball') ? 4 : 0) + (m === 'crane' && has(look, 'crane', 'steelball') ? 2 : 0);
  return {
    r, rope: RIGS[m].rope + (m === 'crane' && has(look, 'crane', 'boom') ? 8 : 0),
    fill: m === 'mega' ? (has(look, 'mega', 'lightning') ? '#ffd23f' : '#3a3f47') : has(look, 'crane', 'spiky') ? '#4a4f57' : has(look, 'crane', 'steelball') ? '#9aa6b2' : '#2a2d33',
    spiky: m === 'crane' && has(look, 'crane', 'spiky'), chain: m === 'mega' && has(look, 'mega', 'chain') ? 'rainbow' : '#5a5f66',
  };
}

// ---------- paint ----------

function paintFill(paint: string, uid: string) {
  const p = paintOf(paint), id = `ww-pat-${p.id}-${uid}`;
  if (!p.pattern) return { fill: p.body, trim: p.trim, defs: '' };
  const bg = (n: number) => `<rect width="${n}" height="${n}" fill="${p.body}"/>`;
  const star = (x: number, y: number, r: number) => `<path d="M${x} ${y - r} L${x + r * .3} ${y - r * .3} L${x + r} ${y - r * .2} L${x + r * .45} ${y + r * .25} L${x + r * .6} ${y + r} L${x} ${y + r * .55} L${x - r * .6} ${y + r} L${x - r * .45} ${y + r * .25} L${x - r} ${y - r * .2} L${x - r * .3} ${y - r * .3} Z" fill="${p.trim}"/>`;
  const PATTERNS: Record<NonNullable<typeof p.pattern>, [number, string]> = {
    stripes: [24, `${bg(24)}<path d="M0 0 L10 0 L24 14 L24 24 Z" fill="${p.trim}"/>`],
    camo: [34, `${bg(34)}<path d="M2 4 Q10 0 14 8 Q8 14 2 10 Z M18 16 Q28 12 30 22 Q22 28 16 24 Z" fill="${p.trim}"/><path d="M20 2 Q28 4 26 10 Q20 10 20 2 Z M4 22 Q12 20 12 28 Q6 32 4 22 Z" fill="#c9b27a"/>`],
    dots: [20, `${bg(20)}<circle cx="6" cy="6" r="4" fill="${p.trim}"/><circle cx="16" cy="16" r="4" fill="${p.trim}"/>`],
    checks: [20, `${bg(20)}<rect width="10" height="10" fill="${p.trim}"/><rect x="10" y="10" width="10" height="10" fill="${p.trim}"/>`],
    flames: [40, `${bg(40)}<path d="M0 40 Q4 24 12 30 Q12 14 22 20 Q24 6 32 22 Q38 16 40 40 Z" fill="${p.trim}"/><path d="M8 40 Q12 32 16 34 Q18 24 24 30 Q28 24 32 40 Z" fill="#ffd23f"/>`],
    stars: [36, `${bg(36)}${star(9, 10, 5)}${star(27, 26, 4)}<circle cx="28" cy="8" r="1.5" fill="#fff"/><circle cx="8" cy="28" r="1.5" fill="#fff"/>`],
    lightning: [36, `${bg(36)}<path d="M14 2 L6 18 H14 L10 34 L26 12 H17 L22 2 Z" fill="${p.trim}"/>`],
    rainbow: [60, ['#e63946', '#ff9a1f', '#ffd23f', '#2bb673', '#3d9be0', '#7a4fd8'].map((c, i) => `<rect y="${i * 10}" width="60" height="10" fill="${c}"/>`).join('')],
    spots: [36, `${bg(36)}<path d="M4 6 Q12 0 16 8 Q12 16 4 12 Z M22 20 Q32 16 33 26 Q26 33 20 28 Z M26 2 Q31 4 29 9 Q24 9 26 2 Z M6 26 Q12 24 11 31 Q5 33 6 26 Z" fill="${p.trim}"/>`],
    zigzag: [24, `${bg(24)}<path d="M0 8 L6 2 L12 8 L18 2 L24 8 V14 L18 8 L12 14 L6 8 L0 14 Z" fill="${p.trim}"/>`],
    hearts: [30, `${bg(30)}<path d="M15 24 C4 16 4 6 10 6 C13 6 15 9 15 11 C15 9 17 6 20 6 C26 6 26 16 15 24 Z" fill="${p.trim}"/>`],
    waves: [32, `${bg(32)}<path d="M0 12 Q8 4 16 12 T32 12 V18 Q24 10 16 18 T0 18 Z M0 28 Q8 20 16 28 T32 28 V32 H0 Z" fill="${p.trim}"/>`],
  };
  const [size, inner] = PATTERNS[p.pattern];
  return { fill: `url(#${id})`, trim: p.trim, defs: `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${inner}</pattern>` };
}

// ---------- parts ----------

const tracks = (x: number, w: number, h = 22, y = GROUND - 22) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#2a2d33" ${L()}/>` +
  ((n: number) => Array.from({ length: n }, (_, i) => `<circle cx="${x + h / 2 + (i * (w - h)) / (n - 1)}" cy="${y + h / 2}" r="${h * .3}" fill="#8a929b" ${L(2.5)}/>`).join(''))(Math.max(2, Math.round(w / 26)));
const wheel = (cx: number, r: number, gold = false) => `<circle cx="${cx}" cy="${GROUND - r}" r="${r}" fill="#2a2d33" ${L()}/><circle cx="${cx}" cy="${GROUND - r}" r="${r * .45}" fill="${gold ? '#ffd23f' : '#c9d1d9'}" ${L(3)}/>`;
const cab = (x: number, y: number, w: number, h: number, fill: string, driver: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" ${L()}/><rect x="${x + 7}" y="${y + 7}" width="${w - 14}" height="${h * .5}" rx="5" fill="#bfe6f5" ${L(3)}/>` +
  `<text x="${x + w / 2}" y="${y + 7 + h * .5 - 4}" font-size="${h * .42}" text-anchor="middle" class="emo-svg">${driver}</text>`;
const beacon = (x: number, y: number) => `<path d="M${x - 6} ${y} Q${x} ${y - 13} ${x + 6} ${y} Z" fill="#ff9a1f" ${L(3)}/>`;
const hazard = (x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffd23f"/>${Array.from({ length: Math.floor(w / 12) }, (_, i) => `<path d="M${x + i * 12} ${y + h} L${x + i * 12 + 6} ${y} H${x + i * 12 + 11} L${x + i * 12 + 5} ${y + h} Z" fill="${O}"/>`).join('')}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" ${L(3)}/>`;
const lattice = (x1: number, y1: number, x2: number, y2: number, w: number, fill: string) => {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), nx = (-dy / len) * w / 2, ny = (dx / len) * w / 2, n = Math.max(3, Math.round(len / 18));
  const zig = Array.from({ length: n }, (_, i) => { const t0 = i / n, t1 = (i + 1) / n, s = i % 2 ? 1 : -1; return `M${x1 + dx * t0 + nx * s} ${y1 + dy * t0 + ny * s} L${x1 + dx * t1 - nx * s} ${y1 + dy * t1 - ny * s}`; }).join(' ');
  return `<path d="M${x1 + nx} ${y1 + ny} L${x2 + nx} ${y2 + ny} L${x2 - nx} ${y2 - ny} L${x1 - nx} ${y1 - ny} Z" fill="none" stroke="${O}" stroke-width="9" stroke-linejoin="round"/>` +
    `<path d="M${x1 + nx} ${y1 + ny} L${x2 + nx} ${y2 + ny} M${x1 - nx} ${y1 - ny} L${x2 - nx} ${y2 - ny} ${zig}" fill="none" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>`;
};

/** Extras bolted on by upgrades, drawn the same on any machine: at its roof (flags, lights) or its back (exhausts, jets). */
type Part = 'checker' | 'redflag' | 'beacons' | 'disco' | 'spot' | 'stack' | 'jets' | 'flames' | 'spark';
const PARTS: Partial<Record<string, Part>> = {
  'up:dump:flag': 'checker', 'up:minidig:flag': 'checker', 'up:dynamite:flag': 'redflag', 'up:jackhammer:lights': 'beacons', 'up:supermag:lights': 'disco',
  'up:tower:spot': 'spot', 'up:dozer:stack': 'stack', 'up:crane:rocket': 'jets', 'up:robot:jet': 'jets', 'up:breaker:jets': 'jets', 'up:mega:swing': 'jets',
  'up:roller:turbo': 'jets', 'up:monster:flames': 'flames', 'up:dynamite:fuse': 'spark', 'up:blaster:fuse': 'spark',
};
function parts(look: Look, roof: { x: number; y: number }, back: { x: number; y: number }) {
  let out = '';
  for (const k of look.ups) {
    const part = PARTS[k], { x, y } = roof, b = back;
    if (part === 'checker' || part === 'redflag') {
      const flag = part === 'checker'
        ? `<rect x="${x}" y="${y - 40}" width="24" height="16" fill="#fff" ${L(2.5)}/><path d="M${x} ${y - 40} h6 v4 h-6 Z M${x + 12} ${y - 40} h6 v4 h-6 Z M${x + 6} ${y - 36} h6 v4 h-6 Z M${x + 18} ${y - 36} h6 v4 h-6 Z M${x} ${y - 32} h6 v4 h-6 Z M${x + 12} ${y - 32} h6 v4 h-6 Z M${x + 6} ${y - 28} h6 v4 h-6 Z M${x + 18} ${y - 28} h6 v4 h-6 Z" fill="${O}"/>`
        : `<path d="M${x} ${y - 40} L${x + 26} ${y - 33} L${x} ${y - 25} Z" fill="#e63946" ${L(2.5)}/>`;
      out += `<path d="M${x} ${y} V${y - 42}" stroke="${O}" stroke-width="3.5"/>${flag}`;
    } else if (part === 'beacons' || part === 'disco') {
      const cs = part === 'beacons' ? ['#3d7be0', '#e63946'] : ['#e63946', '#ffd23f', '#2bb673', '#7a4fd8'];
      out += cs.map((c, i) => `<circle cx="${x - (cs.length - 1) * 6 + i * 12}" cy="${y - 6}" r="6" fill="${c}" ${L(2.5)}/>`).join('');
    } else if (part === 'spot') {
      out += `<path d="M${x + 8} ${y - 8} L${x + 60} ${y - 26} L${x + 60} ${y + 12} Z" fill="#fff6a0" opacity=".7"/><rect x="${x - 8}" y="${y - 16}" width="18" height="14" rx="3" fill="#c9d1d9" ${L(2.5)}/>`;
    } else if (part === 'stack') {
      out += `<rect x="${b.x - 4}" y="${b.y - 34}" width="10" height="36" rx="3" fill="#c9d1d9" ${L(2.5)}/><circle cx="${b.x + 2}" cy="${b.y - 44}" r="7" fill="#bfc6cc" opacity=".8"/><circle cx="${b.x + 10}" cy="${b.y - 56}" r="9" fill="#d9dde1" opacity=".7"/>`;
    } else if (part === 'jets') {
      out += `<rect x="${b.x - 4}" y="${b.y - 8}" width="22" height="16" rx="6" fill="#c9d1d9" ${L(2.5)}/><path d="M${b.x - 4} ${b.y - 6} L${b.x - 26} ${b.y} L${b.x - 4} ${b.y + 6} Z" fill="#ff9a1f" ${L(2)}/><path d="M${b.x - 4} ${b.y - 3} L${b.x - 15} ${b.y} L${b.x - 4} ${b.y + 3} Z" fill="#ffd23f"/>`;
    } else if (part === 'flames') {
      out += [0, 14].map(d => `<path d="M${b.x + d} ${b.y} V${b.y - 22}" stroke="#c9d1d9" stroke-width="7"/><path d="M${b.x + d - 7} ${b.y - 22} Q${b.x + d} ${b.y - 50} ${b.x + d + 7} ${b.y - 22} Z" fill="#ff7a1a" ${L(2)}/>`).join('');
    } else if (part === 'spark') {
      out += `<path d="M${x} ${y - 14} l3 7 l7 1 l-5 5 l2 7 l-7 -4 l-7 4 l2 -7 l-5 -5 l7 -1 Z" fill="#ffd23f" ${L(2)}/>`;
    }
  }
  return out;
}

/** A wrecking ball (or the Mega Wrecker's), centred at (x, y). */
export function ballSvg(x: number, y: number, b: ReturnType<typeof ballOf>) {
  const spikes = b.spiky ? Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return `<path d="M${x + c * (b.r - 2) - s * 5} ${y + s * (b.r - 2) + c * 5} L${x + c * (b.r + 9)} ${y + s * (b.r + 9)} L${x + c * (b.r - 2) + s * 5} ${y + s * (b.r - 2) - c * 5} Z" fill="#c9d1d9" ${L(2.5)}/>`; }).join('') : '';
  return `${spikes}<circle cx="${x}" cy="${y}" r="${b.r}" fill="${b.fill}" ${L()}/><circle cx="${x - b.r * .35}" cy="${y - b.r * .35}" r="${b.r * .22}" fill="#fff" opacity=".55"/>`;
}

/** An excavator's arm from its base to the bucket at (bx, by), the elbow bent upward. */
export type Biter = 'digger' | 'robot' | 'giant' | 'minidig';
/** How big a biter's bucket is with its upgrades. */
export const bucketOf = (m: Biter, look: Look) => RIGS[m].bucket + (m === 'digger' && has(look, 'digger', 'bucket') ? 6 : 0) + (m === 'minidig' && has(look, 'minidig', 'scoop') ? 5 : 0);
/** The bucket's colour: the machine's paint, or gold with the Gold Bucket. */
export const bucketFill = (m: Biter, look: Look, fill: string) => (m === 'giant' && has(look, 'giant', 'gold') ? '#ffd23f' : fill);
export function armSvg(m: Biter, base: { x: number; y: number }, bx: number, by: number, fill: string, look: Look) {
  const dx = bx - base.x, dy = by - base.y, d = Math.hypot(dx, dy), seg = RIGS[m].reach * .55;
  const lift = Math.sqrt(Math.max(0, seg * seg - (d / 2) ** 2));
  const ex = base.x + dx / 2 + (dy / d) * lift * (dx >= 0 ? 1 : -1), ey = base.y + dy / 2 - (Math.abs(dx) / d) * lift;
  const w = m === 'giant' ? 18 : m === 'minidig' ? 11 : 14, bk = bucketOf(m, look);
  const claw = m === 'robot' || (m === 'digger' && has(look, 'digger', 'claw'));
  const teeth = m === 'giant' && has(look, 'giant', 'diamond') ? '#9fe8ff' : '#c9d1d9';
  const tool = claw
    ? `<path d="M${bx - bk * .7} ${by - bk * .5} L${bx - bk * .2} ${by + bk * .7} L${bx} ${by + bk * .1} L${bx + bk * .2} ${by + bk * .7} L${bx + bk * .7} ${by - bk * .5} Z" fill="#8a929b" ${L(3.5)}/>`
    : `<path d="M${bx - bk * .6} ${by - bk * .6} L${bx + bk * .7} ${by - bk * .5} L${bx + bk * .6} ${by + bk * .6} Q${bx - bk * .2} ${by + bk * .8} ${bx - bk * .6} ${by - bk * .6} Z" fill="${bucketFill(m, look, fill)}" ${L(3.5)}/><path d="M${bx + bk * .6} ${by + bk * .6} l-6 7 m-6 -9 l-5 8" stroke="${teeth}" stroke-width="5" stroke-linecap="round"/>`;
  return `<path d="M${base.x} ${base.y} L${ex} ${ey} L${bx} ${by - bk * .3}" fill="none" stroke="${O}" stroke-width="${w + 8}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M${base.x} ${base.y} L${ex} ${ey} L${bx} ${by - bk * .3}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${ex}" cy="${ey}" r="5" fill="#c9d1d9" ${L(2.5)}/>${tool}`;
}

// ---------- each machine ----------

/**
 * The machine's drawing (inner SVG, no wrapper). `tool: false` leaves off the moving part (the ball and rope, the arm), which the Job's
 * canvas draws itself.
 */
export function machineInner(m: MachineId, look: Look, tool = true, uid = 'a'): string {
  const { fill, trim, defs } = paintFill(look.paint, `${m}${uid}`), d = look.driver;
  const pre = defs ? `<defs>${defs}</defs>` : '';
  switch (m) {
    case 'crane': case 'mega': {
      const big = m === 'mega', tip = RIGS[m].tip, b = ballOf(m, look), boom = m === 'crane' && has(look, 'crane', 'boom');
      const tx = tip.x + (boom ? 8 : 0), ty = tip.y - (boom ? 8 : 0);
      const rope = tool ? `<path d="M${tx} ${ty} V${ty + b.rope - b.r}" stroke="${b.chain === 'rainbow' ? '#e63946' : b.chain}" stroke-width="4" stroke-dasharray="${big ? '7 3' : 'none'}"/>${ballSvg(tx, ty + b.rope, b)}` : '';
      return `${pre}${tracks(big ? 14 : 26, big ? 150 : 128, big ? 28 : 22, GROUND - (big ? 28 : 22))}<rect x="${big ? 22 : 34}" y="${big ? 84 : 92}" width="${big ? 140 : 110}" height="${big ? 40 : 34}" rx="8" fill="${fill}" ${L()}/>` +
        `<rect x="${big ? 24 : 36}" y="${big ? 72 : 82}" width="36" height="20" rx="4" fill="${trim}" ${L(3)}/>` +
        `${lattice(big ? 120 : 108, big ? 92 : 98, tx, ty, big ? 18 : 14, fill)}${cab(big ? 126 : 110, big ? 50 : 58, big ? 50 : 44, big ? 50 : 42, fill, d)}${beacon(big ? 151 : 132, big ? 50 : 58)}${rope}` +
        parts(look, { x: big ? 140 : 122, y: big ? 50 : 58 }, { x: big ? 6 : 18, y: big ? 104 : 110 });
    }
    case 'magnet': case 'supermag': {
      const big = m === 'supermag', tip = RIGS[m].tip, mg = magnetOf(m, look), winch = has(look, 'magnet', 'winch') || has(look, 'supermag', 'winch');
      const hang = tool ? `<path d="M${tip.x} ${tip.y} V${tip.y + mg.rope - 10}" stroke="${O}" stroke-width="4"/>${magnetSvg(tip.x, tip.y + mg.rope, mg)}` : '';
      return `${pre}${tracks(big ? 12 : 24, big ? 156 : 132, big ? 28 : 24, GROUND - (big ? 28 : 24))}<rect x="${big ? 20 : 32}" y="${big ? 82 : 92}" width="${big ? 146 : 116}" height="${big ? 42 : 34}" rx="8" fill="${fill}" ${L()}/>` +
        `<rect x="${big ? 22 : 34}" y="${big ? 66 : 76}" width="40" height="22" rx="4" fill="${trim}" ${L(3)}/>${winch ? `<circle cx="${big ? 42 : 54}" cy="${big ? 77 : 87}" r="9" fill="#c9d1d9" ${L(3)}/><circle cx="${big ? 42 : 54}" cy="${big ? 77 : 87}" r="3" fill="${O}"/>` : ''}` +
        `${tool ? lattice(RIGS[m].base.x, RIGS[m].base.y, tip.x, tip.y, big ? 18 : 14, trim) : ''}${cab(big ? 122 : 108, big ? 46 : 56, big ? 50 : 44, big ? 50 : 42, fill, d)}${beacon(big ? 147 : 130, big ? 46 : 56)}${hang}` +
        parts(look, { x: big ? 136 : 120, y: big ? 46 : 56 }, { x: 10, y: 108 });
    }
    case 'jackhammer': {
      const sharp = has(look, 'jackhammer', 'bit'), diamond = has(look, 'jackhammer', 'diamond'), turbo = has(look, 'jackhammer', 'turbo');
      const tip = RIGS.jackhammer.tip, hw = turbo ? 30 : 24, bit = diamond ? '#9fe8ff' : sharp ? '#e4ebf2' : '#8a929b';
      return `${pre}${wheel(70, 19)}${wheel(136, 19)}<rect x="46" y="74" width="112" height="52" rx="10" fill="${fill}" ${L()}/>${cab(66, 46, 62, 56, fill, d)}` +
        `<path d="M150 90 L${tip.x - 6} 78" stroke="${O}" stroke-width="12" stroke-linecap="round"/><path d="M150 90 L${tip.x - 6} 78" stroke="${trim}" stroke-width="6" stroke-linecap="round"/>` +
        `<rect x="${tip.x - hw / 2}" y="70" width="${hw}" height="${turbo ? 54 : 48}" rx="6" fill="${trim}" ${L()}/>${hazard(tip.x - hw / 2 + 2, 92, hw - 4, 8)}` +
        `<path d="M${tip.x - 5} ${turbo ? 124 : 118} L${tip.x + 5} ${turbo ? 124 : 118} L${tip.x + 2} ${tip.y - 2} L${tip.x - 2} ${tip.y - 2} Z" fill="${bit}" ${L(3)}/>${beacon(97, 46)}` +
        parts(look, { x: 97, y: 46 }, { x: 40, y: 100 });
    }
    case 'breaker': {
      const steel = has(look, 'breaker', 'chisel'), mega = has(look, 'breaker', 'mega'), tip = RIGS.breaker.tip, hw = mega ? 32 : 24;
      const base = { x: 118, y: 84 }, ex = 176, ey = 46, hx = tip.x, hy = mega ? 96 : 102;
      return `${pre}${tracks(24, 130, 24, GROUND - 24)}<rect x="30" y="88" width="120" height="36" rx="8" fill="${fill}" ${L()}/>${cab(104, 44, 48, 48, fill, d)}<rect x="32" y="80" width="44" height="18" rx="4" fill="${trim}" ${L(3)}/>${beacon(128, 44)}` +
        `<path d="M${base.x} ${base.y} L${ex} ${ey} L${hx} ${hy}" fill="none" stroke="${O}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="M${base.x} ${base.y} L${ex} ${ey} L${hx} ${hy}" fill="none" stroke="${fill}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<rect x="${hx - hw / 2}" y="${hy - 4}" width="${hw}" height="${128 - hy}" rx="5" fill="${trim}" ${L()}/><path d="M${hx - 6} 124 L${hx + 6} 124 L${hx + 2} ${tip.y - 2} L${hx - 2} ${tip.y - 2} Z" fill="${steel ? '#e4ebf2' : '#8a929b'}" ${L(3)}/>` +
        parts(look, { x: 128, y: 44 }, { x: 26, y: 100 });
    }
    case 'dynamite': case 'blaster': {
      const big = m === 'blaster', more = has(look, 'dynamite', 'tnt') || big, mega = has(look, 'dynamite', 'mega') || has(look, 'blaster', 'mega');
      const confetti = has(look, 'blaster', 'confetti'), r = big ? 24 : 20, crateW = mega ? 104 : 86, crateH = mega ? 46 : 38, top = GROUND - r - 40 - crateH;
      const sticks = Array.from({ length: more ? (mega ? 7 : 5) : 3 }, (_, i) => `<rect x="${30 + i * 13}" y="${top - 16}" width="10" height="22" rx="3" fill="${confetti ? ['#e63946', '#ffd23f', '#2bb673', '#3d9be0', '#7a4fd8'][i % 5] : '#e63946'}" ${L(2.5)}/><path d="M${35 + i * 13} ${top - 16} q4 -8 -2 -12" fill="none" stroke="${O}" stroke-width="2"/>`).join('');
      return `${pre}${wheel(54, r)}${wheel(108, r)}${wheel(186, r)}<rect x="22" y="${GROUND - r - 40}" width="196" height="26" rx="6" fill="${trim}" ${L()}/>${hazard(30, GROUND - r - 34, 120, 10)}` +
        `${sticks}<rect x="24" y="${top}" width="${crateW}" height="${crateH}" rx="4" fill="#c8955a" ${L()}/><text x="${24 + crateW / 2}" y="${top + crateH * .68}" font-size="${crateH * .5}" font-weight="900" font-family="Nunito,sans-serif" text-anchor="middle" fill="#e63946">TNT</text>` +
        `${cab(156, GROUND - r - 96, 62, 58, fill, d)}${beacon(187, GROUND - r - 96)}` + parts(look, { x: 172, y: GROUND - r - 96 }, { x: 20, y: GROUND - r - 30 });
    }
    case 'roller': {
      const wide = has(look, 'roller', 'wide'), smile = has(look, 'roller', 'smile'), dr = wide ? 32 : 27, cx = RIGS.roller.at, cy = GROUND - dr;
      const face = smile ? `<circle cx="${cx - 8}" cy="${cy - 6}" r="3.5" fill="${O}"/><circle cx="${cx + 8}" cy="${cy - 6}" r="3.5" fill="${O}"/><path d="M${cx - 11} ${cy + 5} Q${cx} ${cy + 15} ${cx + 11} ${cy + 5}" fill="none" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>` : `<circle cx="${cx}" cy="${cy}" r="${dr * .35}" fill="#c9d1d9" ${L(3)}/>`;
      return `${pre}${wheel(62, 26)}<path d="M36 ${GROUND - 40} L36 92 Q36 80 50 80 L150 80 L${cx - 8} ${cy - dr - 4} L${cx + dr - 4} ${cy - dr - 4} L${cx + dr - 4} ${cy - 6}" fill="${fill}" ${L()}/>` +
        `<rect x="34" y="96" width="122" height="30" rx="6" fill="${fill}" ${L()}/>${cab(66, 34, 56, 52, fill, d)}<rect x="${cx - dr - 6}" y="${cy - dr}" width="${dr * 2 + 6}" height="${dr * 2}" rx="${dr}" fill="#8a929b" ${L()}/>` +
        `<circle cx="${cx}" cy="${cy}" r="${dr}" fill="#c9d1d9" ${L()}/>${face}${hazard(40, 106, 60, 9)}${beacon(94, 34)}` + parts(look, { x: 94, y: 34 }, { x: 30, y: 98 });
    }
    case 'mixer': {
      const big = has(look, 'mixer', 'drum'), swirl = has(look, 'mixer', 'swirl'), gold = has(look, 'mixer', 'wheels'), r = 20;
      const rx = big ? 72 : 62, ry = big ? 38 : 32, cx = 92, cy = GROUND - r - 40 - ry + 6;
      const stripes = Array.from({ length: 5 }, (_, i) => `<path d="M${cx - rx + 14 + i * 26} ${cy - ry + 6} q14 ${ry} 0 ${ry * 2 - 10}" fill="none" stroke="${swirl ? '#ff4f8a' : trim}" stroke-width="${swirl ? 9 : 5}"/>`).join('');
      return `${pre}${wheel(54, r, gold)}${wheel(108, r, gold)}${wheel(186, r, gold)}<rect x="22" y="${GROUND - r - 40}" width="196" height="26" rx="6" fill="${trim}" ${L()}/>` +
        `<path d="M${RIGS.mixer.at + 8} ${cy + 6} L${RIGS.mixer.at - 4} ${GROUND - r - 30} L${RIGS.mixer.at + 6} ${GROUND - r - 30}" fill="#8a929b" ${L(3)}/>` +
        `<g transform="rotate(-10 ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${swirl ? '#fff' : fill}" ${L()}/>${stripes}<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" ${L()}/></g>` +
        `${cab(156, GROUND - r - 96, 62, 58, fill, d)}${beacon(187, GROUND - r - 96)}` + parts(look, { x: 172, y: GROUND - r - 96 }, { x: 20, y: GROUND - r - 30 });
    }
    case 'skid': {
      const big = has(look, 'skid', 'bucket') || has(look, 'skid', 'giantbucket'), giant = has(look, 'skid', 'giantbucket'), fast = has(look, 'skid', 'wheels');
      const top = giant ? 74 : big ? 88 : 96, front = giant ? 232 : big ? 224 : 214;
      return `${pre}${wheel(86, fast ? 22 : 19, fast)}${wheel(150, fast ? 22 : 19, fast)}<rect x="62" y="74" width="112" height="52" rx="10" fill="${fill}" ${L()}/>${cab(84, 46, 62, 56, fill, d)}` +
        `<path d="M174 92 L196 ${top} L${front} ${top + 16} L${front - 2} ${GROUND - 2} L184 ${GROUND - 2} Z" fill="${trim}" ${L()}/>${beacon(115, 46)}`;
    }
    case 'dozer': case 'monster': {
      const big = m === 'monster', wide = has(look, 'dozer', 'wide'), ripper = has(look, 'dozer', 'ripper'), teeth = has(look, 'monster', 'teeth'), rocket = has(look, 'monster', 'rocket');
      const top = big ? 70 : wide ? 86 : 96;
      const under = big ? `${wheel(70, 34)}${wheel(160, 34)}` : tracks(30, has(look, 'dozer', 'tracks') ? 170 : 160, has(look, 'dozer', 'tracks') ? 28 : 24, GROUND - (has(look, 'dozer', 'tracks') ? 28 : 24));
      const bladeTeeth = teeth ? Array.from({ length: 5 }, (_, i) => `<path d="M${226} ${top + 12 + i * 15} l12 5 l-12 5 Z" fill="#fff" ${L(2.5)}/>`).join('') : '';
      return `${pre}${under}<rect x="${big ? 34 : 40}" y="${big ? 66 : 84}" width="${big ? 166 : 150}" height="${big ? 50 : 44}" rx="8" fill="${fill}" ${L()}/>${cab(big ? 70 : 64, big ? 18 : 40, big ? 60 : 54, big ? 52 : 48, fill, d)}` +
        `<path d="M196 ${big ? 92 : 104} L214 ${big ? 92 : 104}" stroke="${O}" stroke-width="12"/><path d="M${big ? 210 : 206} ${top} Q${big ? 236 : 228} ${(top + GROUND) / 2} ${big ? 212 : 208} ${GROUND - 2} L${big ? 222 : 218} ${GROUND - 2} Q${big ? 246 : 238} ${(top + GROUND) / 2} ${big ? 222 : 218} ${top} Z" fill="${trim}" ${L()}/>${bladeTeeth}` +
        `${ripper ? `<path d="M40 112 L18 122 L24 ${GROUND - 4}" fill="none" stroke="${O}" stroke-width="9" stroke-linejoin="round"/>` : ''}` +
        `${rocket ? `<rect x="10" y="74" width="30" height="16" rx="6" fill="#c9d1d9" ${L(3)}/><path d="M10 78 L-8 82 L10 86 Z" fill="#ff9a1f"/>` : ''}${hazard(big ? 34 : 40, big ? 104 : 116, 50, 9)}${beacon(big ? 100 : 91, big ? 18 : 40)}` +
        parts(look, { x: big ? 100 : 91, y: big ? 18 : 40 }, { x: big ? 50 : 52, y: big ? 66 : 84 });
    }
    case 'minidig': {
      const rig = RIGS.minidig, zoom = has(look, 'minidig', 'zoom');
      const arm = tool ? armSvg(m, rig.base, rig.base.x + rig.reach * .62, GROUND - 20, fill, look) : '';
      return `${pre}${tracks(40, 100, 20, GROUND - 20)}${zoom ? `<path d="M30 ${GROUND - 14} h-18 M32 ${GROUND - 6} h-24" stroke="${O}" stroke-width="4" stroke-linecap="round"/>` : ''}` +
        `<rect x="44" y="102" width="84" height="30" rx="8" fill="${fill}" ${L()}/>${cab(84, 62, 42, 44, fill, d)}<rect x="46" y="94" width="34" height="14" rx="4" fill="${trim}" ${L(3)}/>${beacon(105, 62)}${arm}` +
        parts(look, { x: 96, y: 62 }, { x: 40, y: 112 });
    }
    case 'digger': case 'robot': case 'giant': {
      const rig = RIGS[m], big = m === 'giant', robot = m === 'robot';
      const arm = tool ? armSvg(m, rig.base, rig.base.x + rig.reach * .62, GROUND - 24, fill, look) : '';
      const eyes = robot ? `<circle cx="160" cy="76" r="7" fill="${has(look, 'robot', 'eyes') ? '#ff3b3b' : '#9fe8ff'}" ${L(3)}/><circle cx="182" cy="76" r="7" fill="${has(look, 'robot', 'eyes') ? '#ff3b3b' : '#9fe8ff'}" ${L(3)}/>` : '';
      const body = robot
        ? `<rect x="122" y="54" width="80" height="62" rx="12" fill="${fill}" ${L()}/>${eyes}<rect x="150" y="94" width="40" height="8" rx="4" fill="${O}"/><path d="M162 54 V40" stroke="${O}" stroke-width="4"/><circle cx="162" cy="38" r="5" fill="#ff3b3b" ${L(2.5)}/>`
        : `<rect x="${big ? 18 : 30}" y="${big ? 78 : 88}" width="${big ? 150 : 120}" height="${big ? 44 : 36}" rx="8" fill="${fill}" ${L()}/>${cab(big ? 112 : 104, big ? 32 : 44, big ? 58 : 48, big ? 54 : 48, fill, d)}<rect x="${big ? 20 : 32}" y="${big ? 70 : 80}" width="44" height="18" rx="4" fill="${trim}" ${L(3)}/>${beacon(big ? 141 : 128, big ? 32 : 44)}`;
      const turboTracks = m === 'digger' && has(look, 'digger', 'tracks');
      const under = big ? `${tracks(8, 172, 30, GROUND - 30)}` : tracks(robot ? 110 : turboTracks ? 16 : 24, robot ? 104 : turboTracks ? 146 : 130, turboTracks ? 28 : 24, GROUND - (turboTracks ? 28 : 24));
      const extra = big && has(look, 'giant', 'turbo') ? `<rect x="30" y="54" width="12" height="26" fill="#8a929b" ${L(3)}/><path d="M36 50 q-6 -10 2 -16 q8 -6 2 -14" stroke="#c9d1d9" stroke-width="5" fill="none" stroke-linecap="round"/>` : '';
      const saw = robot && has(look, 'robot', 'saw') ? `<circle cx="210" cy="96" r="18" fill="#c9d1d9" ${L(3)}/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${210 + Math.cos(a) * 18} ${96 + Math.sin(a) * 18} l${Math.cos(a + 1) * 7} ${Math.sin(a + 1) * 7}" stroke="${O}" stroke-width="4"/>`; }).join('')}<circle cx="210" cy="96" r="5" fill="${O}"/><path d="M200 96 H178" stroke="${O}" stroke-width="8"/>` : '';
      return `${pre}${under}${extra}${body}${saw}${arm}` + parts(look, { x: robot ? 162 : big ? 141 : 128, y: robot ? 34 : big ? 32 : 44 }, { x: robot ? 118 : 28, y: robot ? 80 : 96 });
    }
    case 'dump': {
      const big = has(look, 'dump', 'bed'), gw = has(look, 'dump', 'wheels'), r = gw ? 26 : 20;
      return `${pre}${wheel(54, r)}${wheel(108, r)}${wheel(186, r)}<rect x="22" y="${GROUND - r - 40}" width="196" height="26" rx="6" fill="${trim}" ${L()}/>` +
        `<path d="M18 ${GROUND - r - 40} L${big ? 12 : 22} ${big ? 30 : 46} L150 ${big ? 30 : 46} L150 ${GROUND - r - 40} Z" fill="${fill}" ${L()}/>${hazard(30, GROUND - r - 34, 116, 10)}` +
        `${cab(156, GROUND - r - 96, 62, 58, fill, d)}${beacon(187, GROUND - r - 96)}${has(look, 'dump', 'horn') ? `<path d="M206 ${GROUND - r - 100} l18 -8 v14 Z" fill="#c9d1d9" ${L(2.5)}/>` : ''}` +
        parts(look, { x: 166, y: GROUND - r - 96 }, { x: 20, y: GROUND - r - 30 });
    }
    case 'tower': {
      const tall = has(look, 'tower', 'mast'), top = tall ? 2 : 14, lights = has(look, 'tower', 'lights');
      const hook = tool ? `<path d="M190 ${top + 14} V96" stroke="${O}" stroke-width="3"/><path d="M184 96 h12 v6 a6 6 0 1 1 -6 6" fill="none" stroke="${O}" stroke-width="4"/>` : '';
      return `${pre}<rect x="70" y="${GROUND - 14}" width="80" height="14" fill="#8a929b" ${L(3)}/>${lattice(110, GROUND - 14, 110, top + 10, 22, fill)}${lattice(30, top + 10, 232, top + 10, 14, fill)}` +
        `<rect x="22" y="${top + 16}" width="34" height="22" fill="#8a929b" ${L(3)}/>${cab(118, top + 18, 34, 32, fill, d)}${lights ? `<circle cx="232" cy="${top + 10}" r="6" fill="#ff3b3b" ${L(2.5)}/><circle cx="30" cy="${top + 10}" r="6" fill="#ffd23f" ${L(2.5)}/>` : ''}` +
        `<rect x="${has(look, 'tower', 'hook') ? 176 : 182}" y="${top + 6}" width="${has(look, 'tower', 'hook') ? 28 : 16}" height="10" fill="${trim}" ${L(2.5)}/>${hook}` +
        parts(look, { x: 132, y: top + 18 }, { x: 30, y: top + 30 });
    }
  }
}

/** The machine as an SVG document. */
export const machineSvg = (m: MachineId, look: Look, tool = true) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -24 ${MACHINE_W + 24} ${MACHINE_H + 30}">${machineInner(m, look, tool)}</svg>`;
/** The drawing's box inside its viewBox, for placing it on a canvas: the SVG's viewBox starts at (-12, -24). */
export const VIEW = { x: -12, y: -24, w: MACHINE_W + 24, h: MACHINE_H + 30 };
