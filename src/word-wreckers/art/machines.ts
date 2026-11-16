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
} as const satisfies Record<MachineId, { kind: string; [k: string]: unknown }>;
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

/** A wrecking ball (or the Mega Wrecker's), centred at (x, y). */
export function ballSvg(x: number, y: number, b: ReturnType<typeof ballOf>) {
  const spikes = b.spiky ? Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return `<path d="M${x + c * (b.r - 2) - s * 5} ${y + s * (b.r - 2) + c * 5} L${x + c * (b.r + 9)} ${y + s * (b.r + 9)} L${x + c * (b.r - 2) + s * 5} ${y + s * (b.r - 2) - c * 5} Z" fill="#c9d1d9" ${L(2.5)}/>`; }).join('') : '';
  return `${spikes}<circle cx="${x}" cy="${y}" r="${b.r}" fill="${b.fill}" ${L()}/><circle cx="${x - b.r * .35}" cy="${y - b.r * .35}" r="${b.r * .22}" fill="#fff" opacity=".55"/>`;
}

/** An excavator's arm from its base to the bucket at (bx, by), the elbow bent upward. */
export function armSvg(m: 'digger' | 'robot' | 'giant', base: { x: number; y: number }, bx: number, by: number, fill: string, look: Look) {
  const dx = bx - base.x, dy = by - base.y, d = Math.hypot(dx, dy), seg = RIGS[m].reach * .55;
  const lift = Math.sqrt(Math.max(0, seg * seg - (d / 2) ** 2));
  const ex = base.x + dx / 2 + (dy / d) * lift * (dx >= 0 ? 1 : -1), ey = base.y + dy / 2 - (Math.abs(dx) / d) * lift;
  const w = m === 'giant' ? 18 : 14, bk = RIGS[m].bucket + (m === 'digger' && has(look, 'digger', 'bucket') ? 6 : 0);
  const claw = m === 'robot' || (m === 'digger' && has(look, 'digger', 'claw'));
  const teeth = m === 'giant' && has(look, 'giant', 'diamond') ? '#9fe8ff' : '#c9d1d9';
  const tool = claw
    ? `<path d="M${bx - bk * .7} ${by - bk * .5} L${bx - bk * .2} ${by + bk * .7} L${bx} ${by + bk * .1} L${bx + bk * .2} ${by + bk * .7} L${bx + bk * .7} ${by - bk * .5} Z" fill="#8a929b" ${L(3.5)}/>`
    : `<path d="M${bx - bk * .6} ${by - bk * .6} L${bx + bk * .7} ${by - bk * .5} L${bx + bk * .6} ${by + bk * .6} Q${bx - bk * .2} ${by + bk * .8} ${bx - bk * .6} ${by - bk * .6} Z" fill="${fill}" ${L(3.5)}/><path d="M${bx + bk * .6} ${by + bk * .6} l-6 7 m-6 -9 l-5 8" stroke="${teeth}" stroke-width="5" stroke-linecap="round"/>`;
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
        `${lattice(big ? 120 : 108, big ? 92 : 98, tx, ty, big ? 18 : 14, fill)}${cab(big ? 126 : 110, big ? 50 : 58, big ? 50 : 44, big ? 50 : 42, fill, d)}${beacon(big ? 151 : 132, big ? 50 : 58)}${rope}`;
    }
    case 'skid': {
      const big = has(look, 'skid', 'bucket'), fast = has(look, 'skid', 'wheels');
      return `${pre}${wheel(86, fast ? 22 : 19, fast)}${wheel(150, fast ? 22 : 19, fast)}<rect x="62" y="74" width="112" height="52" rx="10" fill="${fill}" ${L()}/>${cab(84, 46, 62, 56, fill, d)}` +
        `<path d="M174 92 L196 ${big ? 88 : 96} L${big ? 224 : 214} ${big ? 104 : 108} L${big ? 222 : 212} ${GROUND - 2} L184 ${GROUND - 2} Z" fill="${trim}" ${L()}/>${beacon(115, 46)}`;
    }
    case 'dozer': case 'monster': {
      const big = m === 'monster', wide = has(look, 'dozer', 'wide'), ripper = has(look, 'dozer', 'ripper'), teeth = has(look, 'monster', 'teeth'), rocket = has(look, 'monster', 'rocket');
      const top = big ? 70 : wide ? 86 : 96;
      const under = big ? `${wheel(70, 34)}${wheel(160, 34)}` : tracks(30, has(look, 'dozer', 'tracks') ? 170 : 160, has(look, 'dozer', 'tracks') ? 28 : 24, GROUND - (has(look, 'dozer', 'tracks') ? 28 : 24));
      const bladeTeeth = teeth ? Array.from({ length: 5 }, (_, i) => `<path d="M${226} ${top + 12 + i * 15} l12 5 l-12 5 Z" fill="#fff" ${L(2.5)}/>`).join('') : '';
      return `${pre}${under}<rect x="${big ? 34 : 40}" y="${big ? 66 : 84}" width="${big ? 166 : 150}" height="${big ? 50 : 44}" rx="8" fill="${fill}" ${L()}/>${cab(big ? 70 : 64, big ? 18 : 40, big ? 60 : 54, big ? 52 : 48, fill, d)}` +
        `<path d="M196 ${big ? 92 : 104} L214 ${big ? 92 : 104}" stroke="${O}" stroke-width="12"/><path d="M${big ? 210 : 206} ${top} Q${big ? 236 : 228} ${(top + GROUND) / 2} ${big ? 212 : 208} ${GROUND - 2} L${big ? 222 : 218} ${GROUND - 2} Q${big ? 246 : 238} ${(top + GROUND) / 2} ${big ? 222 : 218} ${top} Z" fill="${trim}" ${L()}/>${bladeTeeth}` +
        `${ripper ? `<path d="M40 112 L18 122 L24 ${GROUND - 4}" fill="none" stroke="${O}" stroke-width="9" stroke-linejoin="round"/>` : ''}` +
        `${rocket ? `<rect x="10" y="74" width="30" height="16" rx="6" fill="#c9d1d9" ${L(3)}/><path d="M10 78 L-8 82 L10 86 Z" fill="#ff9a1f"/>` : ''}${hazard(big ? 34 : 40, big ? 104 : 116, 50, 9)}${beacon(big ? 100 : 91, big ? 18 : 40)}`;
    }
    case 'digger': case 'robot': case 'giant': {
      const rig = RIGS[m], big = m === 'giant', robot = m === 'robot';
      const arm = tool ? armSvg(m, rig.base, rig.base.x + rig.reach * .62, GROUND - 24, fill, look) : '';
      const eyes = robot ? `<circle cx="160" cy="76" r="7" fill="${has(look, 'robot', 'eyes') ? '#ff3b3b' : '#9fe8ff'}" ${L(3)}/><circle cx="182" cy="76" r="7" fill="${has(look, 'robot', 'eyes') ? '#ff3b3b' : '#9fe8ff'}" ${L(3)}/>` : '';
      const body = robot
        ? `<rect x="122" y="54" width="80" height="62" rx="12" fill="${fill}" ${L()}/>${eyes}<rect x="150" y="94" width="40" height="8" rx="4" fill="${O}"/><path d="M162 54 V40" stroke="${O}" stroke-width="4"/><circle cx="162" cy="38" r="5" fill="#ff3b3b" ${L(2.5)}/>`
        : `<rect x="${big ? 18 : 30}" y="${big ? 78 : 88}" width="${big ? 150 : 120}" height="${big ? 44 : 36}" rx="8" fill="${fill}" ${L()}/>${cab(big ? 112 : 104, big ? 32 : 44, big ? 58 : 48, big ? 54 : 48, fill, d)}<rect x="${big ? 20 : 32}" y="${big ? 70 : 80}" width="44" height="18" rx="4" fill="${trim}" ${L(3)}/>${beacon(big ? 141 : 128, big ? 32 : 44)}`;
      const under = big ? `${tracks(8, 172, 30, GROUND - 30)}` : tracks(robot ? 110 : 24, robot ? 104 : 130, 24, GROUND - 24);
      const extra = big && has(look, 'giant', 'turbo') ? `<rect x="30" y="54" width="12" height="26" fill="#8a929b" ${L(3)}/><path d="M36 50 q-6 -10 2 -16 q8 -6 2 -14" stroke="#c9d1d9" stroke-width="5" fill="none" stroke-linecap="round"/>` : '';
      return `${pre}${under}${extra}${body}${arm}`;
    }
    case 'dump': {
      const big = has(look, 'dump', 'bed'), gw = has(look, 'dump', 'wheels'), r = gw ? 26 : 20;
      return `${pre}${wheel(54, r)}${wheel(108, r)}${wheel(186, r)}<rect x="22" y="${GROUND - r - 40}" width="196" height="26" rx="6" fill="${trim}" ${L()}/>` +
        `<path d="M18 ${GROUND - r - 40} L${big ? 12 : 22} ${big ? 30 : 46} L150 ${big ? 30 : 46} L150 ${GROUND - r - 40} Z" fill="${fill}" ${L()}/>${hazard(30, GROUND - r - 34, 116, 10)}` +
        `${cab(156, GROUND - r - 96, 62, 58, fill, d)}${beacon(187, GROUND - r - 96)}${has(look, 'dump', 'horn') ? `<path d="M206 ${GROUND - r - 100} l18 -8 v14 Z" fill="#c9d1d9" ${L(2.5)}/>` : ''}`;
    }
    case 'tower': {
      const tall = has(look, 'tower', 'mast'), top = tall ? 2 : 14, lights = has(look, 'tower', 'lights');
      const hook = tool ? `<path d="M190 ${top + 14} V96" stroke="${O}" stroke-width="3"/><path d="M184 96 h12 v6 a6 6 0 1 1 -6 6" fill="none" stroke="${O}" stroke-width="4"/>` : '';
      return `${pre}<rect x="70" y="${GROUND - 14}" width="80" height="14" fill="#8a929b" ${L(3)}/>${lattice(110, GROUND - 14, 110, top + 10, 22, fill)}${lattice(30, top + 10, 232, top + 10, 14, fill)}` +
        `<rect x="22" y="${top + 16}" width="34" height="22" fill="#8a929b" ${L(3)}/>${cab(118, top + 18, 34, 32, fill, d)}${lights ? `<circle cx="232" cy="${top + 10}" r="6" fill="#ff3b3b" ${L(2.5)}/><circle cx="30" cy="${top + 10}" r="6" fill="#ffd23f" ${L(2.5)}/>` : ''}` +
        `<rect x="${has(look, 'tower', 'hook') ? 176 : 182}" y="${top + 6}" width="${has(look, 'tower', 'hook') ? 28 : 16}" height="10" fill="${trim}" ${L(2.5)}/>${hook}`;
    }
  }
}

/** The machine as an SVG document. */
export const machineSvg = (m: MachineId, look: Look, tool = true) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -24 ${MACHINE_W + 24} ${MACHINE_H + 30}">${machineInner(m, look, tool)}</svg>`;
/** The drawing's box inside its viewBox, for placing it on a canvas: the SVG's viewBox starts at (-12, -24). */
export const VIEW = { x: -12, y: -24, w: MACHINE_W + 24, h: MACHINE_H + 30 };
