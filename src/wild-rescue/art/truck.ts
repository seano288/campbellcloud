// The rescue truck from the side, facing right, built from the parts he has fitted: the paint, the tires (bigger and knobblier up
// the Rungs, tracks for snow), the winch on the front bumper, the lights on the roof and the carrier on the back. A string, so the
// same truck is drawn in the Garage and on the Rescue's canvas. The door has a paw print; an animal can ride in the carrier, and his
// buddy (an emoji) looks out of the cab window.
import { buddyIcon, paintOf, PARTS, type Truck } from '../park/shop';

const O = '#1d1d1f';
const L = (w = 4) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const rung = (slot: string, id: string) => PARTS.find(p => p.slot === slot && p.id === id)?.rung ?? 0;

/** Wheel radius by tire Rung: street, mud, sand, snow, big, monster, gold. */
export const WHEEL_R = [17, 18, 19, 18, 22, 26, 24] as const;
export const TRUCK_W = 250, TRUCK_H = 150;

function wheel(cx: number, cy: number, r: number, tires: string) {
  const knobs = tires === 'mud' || tires === 'monster' || tires === 'big'
    ? Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<rect x="${cx + Math.cos(a) * r - 3}" y="${cy + Math.sin(a) * r - 3}" width="6" height="6" fill="${O}" transform="rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r})"/>`; }).join('')
    : '';
  const tread = tires === 'sand' ? '#c9a46a' : '#2a2d33';
  const rim = tires === 'gold' ? '#ffd23f' : tires === 'sand' ? '#f2e2c0' : '#d6dde5';
  return `${knobs}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${tread}" ${L(3.5)}/><circle cx="${cx}" cy="${cy}" r="${r * .5}" fill="${rim}" ${L(3)}/><circle cx="${cx}" cy="${cy}" r="${r * .15}" fill="${O}"/>`;
}

function paintFill(paint: string) {
  const p = paintOf(paint), id = `wr-pat-${p.id}`;
  if (!p.pattern) return { fill: p.body, defs: '' };
  const bg = (n: number) => `<rect width="${n}" height="${n}" fill="${p.body}"/>`;
  const star = (x: number, y: number, r: number) => `<path d="M${x} ${y - r} L${x + r * .3} ${y - r * .3} L${x + r} ${y - r * .2} L${x + r * .45} ${y + r * .25} L${x + r * .6} ${y + r} L${x} ${y + r * .55} L${x - r * .6} ${y + r} L${x - r * .45} ${y + r * .25} L${x - r} ${y - r * .2} L${x - r * .3} ${y - r * .3} Z" fill="${p.trim}"/>`;
  const PATTERNS: Record<NonNullable<typeof p.pattern>, [number, string]> = {
    stripes: [24, `${bg(24)}<path d="M0 0 L10 0 L24 14 L24 24 Z" fill="${p.trim}"/>`],
    spots: [30, `${bg(30)}<path d="M4 6 L12 3 L16 10 L10 15 Z M18 18 L27 17 L26 26 L18 25 Z" fill="${p.trim}"/>`],
    camo: [34, `${bg(34)}<path d="M2 4 Q10 0 14 8 Q8 14 2 10 Z M18 16 Q28 12 30 22 Q22 28 16 24 Z" fill="${p.trim}"/><path d="M20 2 Q28 4 26 10 Q20 10 20 2 Z M4 22 Q12 20 12 28 Q6 32 4 22 Z" fill="#c9b27a"/>`],
    cow: [48, `${bg(48)}<path d="M4 6 Q14 0 22 8 Q24 18 12 20 Q2 18 4 6 Z M30 26 Q42 22 46 32 Q44 44 32 42 Q24 36 30 26 Z" fill="${p.trim}"/>`],
    dots: [20, `${bg(20)}<circle cx="6" cy="6" r="4" fill="${p.trim}"/><circle cx="16" cy="16" r="4" fill="${p.trim}"/>`],
    checks: [20, `${bg(20)}<rect width="10" height="10" fill="${p.trim}"/><rect x="10" y="10" width="10" height="10" fill="${p.trim}"/>`],
    flames: [40, `${bg(40)}<path d="M0 40 Q4 24 12 30 Q12 14 22 20 Q24 6 32 22 Q38 16 40 40 Z" fill="${p.trim}"/><path d="M8 40 Q12 32 16 34 Q18 24 24 30 Q28 24 32 40 Z" fill="#ffd23f"/>`],
    stars: [36, `${bg(36)}${star(9, 10, 5)}${star(27, 26, 4)}<circle cx="28" cy="8" r="1.5" fill="#fff"/><circle cx="8" cy="28" r="1.5" fill="#fff"/>`],
    rainbow: [60, ['#e63946', '#ff9a1f', '#ffd23f', '#2bb673', '#3d9be0', '#7a4fd8'].map((c, i) => `<rect y="${i * 10}" width="60" height="10" fill="${c}"/>`).join('')],
  };
  const [size, inner] = PATTERNS[p.pattern];
  return { fill: `url(#${id})`, defs: `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${inner}</pattern>` };
}

function lights(id: string, x: number, y: number) {
  if (id === 'plain') return '';
  if (id === 'roof') return `<path d="M${x - 9} ${y} Q${x} ${y - 16} ${x + 9} ${y} Z" fill="#ff9a1f" ${L(3)}/>`;
  const bar = (c1: string, c2: string, w = 44) => `<rect x="${x - w / 2}" y="${y - 10}" width="${w}" height="11" rx="4" fill="${c1}" ${L(3)}/><rect x="${x}" y="${y - 10}" width="${w / 2}" height="11" rx="4" fill="${c2}" ${L(3)}/>`;
  if (id === 'bar') return bar('#e63946', '#3d9be0');
  if (id === 'siren') return `${bar('#e63946', '#3d9be0', 52)}<path d="M${x - 8} ${y - 10} L${x - 14} ${y - 22} H${x + 14} L${x + 8} ${y - 10} Z" fill="#d6dde5" ${L(3)}/>`;
  if (id === 'spot') return `${bar('#e63946', '#3d9be0')}<circle cx="${x + 30}" cy="${y - 8}" r="8" fill="#fff6b0" ${L(3)}/><path d="M${x + 38} ${y - 12} L${x + 70} ${y - 22} L${x + 70} ${y + 6} Z" fill="#fff6b0" opacity=".45"/>`;
  if (id === 'rainbow') return ['#e63946', '#ff9a1f', '#ffd23f', '#2bb673', '#3d9be0', '#7a4fd8'].map((c, i) => `<rect x="${x - 27 + i * 9}" y="${y - 10}" width="9" height="11" fill="${c}"/>`).join('') + `<rect x="${x - 27}" y="${y - 10}" width="54" height="11" rx="4" fill="none" ${L(3)}/>`;
  return `${bar('#e63946', '#3d9be0', 48)}<path d="M${x} ${y - 34} l5 10 l11 1 l-8 7 l3 11 l-11 -6 l-11 6 l3 -11 l-8 -7 l11 -1 Z" fill="#ffd23f" ${L(3)}/>`;
}

function winch(id: string, x: number, y: number) {
  const r = rung('winch', id), big = 6 + r;
  const crane = r >= 3 ? `<path d="M${x - 10} ${y - 6} L${x + 18} ${y - 34 - r * 2}" stroke="#ffb000" stroke-width="${6 + r}" stroke-linecap="round"/><path d="M${x - 10} ${y - 6} L${x + 18} ${y - 34 - r * 2}" stroke="${O}" stroke-width="2" fill="none"/>` : '';
  const colour = ['#8a6a3a', '#a9b4bf', '#e63946', '#ffb000', '#3d9be0', '#7a4fd8', '#ffd23f'][r]!;
  return `${crane}<rect x="${x - big}" y="${y - big}" width="${big * 2}" height="${big * 2}" rx="3" fill="${colour}" ${L(3)}/><path d="M${x + big} ${y} h8 v6 a4 4 0 1 1 -6 2" fill="none" stroke="${O}" stroke-width="3"/>`;
}

function carrier(id: string, base: number, rider: string) {
  const y = base;
  if (id === 'little') return `<rect x="58" y="${y - 40}" width="56" height="40" fill="#c98a4a" ${L()}/><path d="M58 ${y - 20} H114 M72 ${y - 40} V${y} M100 ${y - 40} V${y}" stroke="#7a4f2a" stroke-width="3"/>${rider}`;
  if (id === 'big') return `<rect x="34" y="${y - 54}" width="84" height="54" fill="#c98a4a" ${L()}/><path d="M34 ${y - 27} H118 M54 ${y - 54} V${y} M98 ${y - 54} V${y}" stroke="#7a4f2a" stroke-width="3"/>${rider}`;
  if (id === 'boat') return `<path d="M24 ${y - 30} H124 L112 ${y - 4} H36 Z" fill="#f4f6f8" ${L()}/><path d="M28 ${y - 22} H120" stroke="#e63946" stroke-width="5"/><path d="M74 ${y - 30} V${y - 62} L100 ${y - 38} Z" fill="#ffd23f" ${L(3)}/>${rider}`;
  if (id === 'tank') return `<rect x="30" y="${y - 52}" width="92" height="52" rx="20" fill="#7cc4f5" ${L()}/><path d="M38 ${y - 30} Q50 ${y - 38} 62 ${y - 30} T86 ${y - 30} T112 ${y - 30} V${y - 8} H38 Z" fill="#3d9be0"/>${rider}<rect x="30" y="${y - 52}" width="92" height="52" rx="20" fill="none" ${L()}/>`;
  if (id === 'giant') return `<rect x="-10" y="${y - 10}" width="132" height="10" fill="#5a5a5a" ${L(3)}/><path d="M-6 ${y - 10} V${y - 50} M30 ${y - 10} V${y - 50} M70 ${y - 10} V${y - 50} M114 ${y - 10} V${y - 50} M-6 ${y - 50} H114 M-6 ${y - 30} H114" stroke="#ffb000" stroke-width="6" stroke-linecap="round"/>${rider}`;
  if (id === 'ambulance') return `<rect x="22" y="${y - 62}" width="98" height="62" rx="6" fill="#f4f6f8" ${L()}/><rect x="22" y="${y - 30}" width="98" height="8" fill="#2bb673"/><circle cx="58" cy="${y - 44}" r="10" fill="#2bb673"/><path d="M52 ${y - 44} h12 M58 ${y - 50} v12" stroke="#fff" stroke-width="4" stroke-linecap="round"/>${rider}`;
  return `<rect x="10" y="${y - 66}" width="112" height="66" rx="6" fill="#ffd23f" ${L()}/><path d="M10 ${y - 50} H122 M10 ${y - 16} H122" stroke="#e63946" stroke-width="6"/>${rider}`;
}

/** The inside of a TRUCK_W × TRUCK_H SVG. `rider`: an emoji or drawn animal riding in the carrier. */
export function truckInner(t: Truck, rider = ''): string {
  const tr = rung('tires', t.tires), r = (WHEEL_R as readonly number[])[tr] ?? WHEEL_R[0], axle = TRUCK_H - 6 - r, deck = axle - r * .35 - 6;
  const p = paintOf(t.paint), { fill, defs } = paintFill(t.paint);
  const cab = `<path d="M124 ${deck} V${deck - 58} Q124 ${deck - 66} 132 ${deck - 66} H188 Q198 ${deck - 66} 204 ${deck - 50} L214 ${deck - 30} Q236 ${deck - 28} 238 ${deck - 14} V${deck} Z" fill="${fill}" ${L()}/>`;
  const bed = `<rect x="20" y="${deck - 8}" width="108" height="16" rx="4" fill="${fill}" ${L()}/>`;
  const window = `<path d="M138 ${deck - 56} H186 Q192 ${deck - 56} 196 ${deck - 46} L204 ${deck - 32} H138 Z" fill="#bfe6f5" ${L(3)}/>`;
  const paw = `<g transform="translate(160 ${deck - 18})" fill="${p.pattern ? '#fff' : p.trim}" stroke="${O}" stroke-width="1.5"><ellipse cx="0" cy="3" rx="7" ry="6"/><circle cx="-8" cy="-5" r="3"/><circle cx="-3" cy="-9" r="3"/><circle cx="3" cy="-9" r="3"/><circle cx="8" cy="-5" r="3"/></g>`;
  const bumper = `<rect x="226" y="${deck - 8}" width="16" height="12" rx="3" fill="#a9b4bf" ${L(3)}/><circle cx="234" cy="${deck - 18}" r="5" fill="#fff6b0" ${L(2.5)}/>`;
  const wheels = t.tires === 'snow'
    ? `<rect x="${44 - r}" y="${axle - r - 4}" width="${42 + 2 * r}" height="${2 * r + 8}" rx="${r + 4}" fill="#2a2d33" ${L(3.5)}/><rect x="${164 - r}" y="${axle - r - 4}" width="${42 + 2 * r}" height="${2 * r + 8}" rx="${r + 4}" fill="#2a2d33" ${L(3.5)}/>${[65, 185].map(x => `<circle cx="${x - 14}" cy="${axle}" r="${r * .6}" fill="#d6dde5" ${L(2.5)}/><circle cx="${x + 14}" cy="${axle}" r="${r * .6}" fill="#d6dde5" ${L(2.5)}/>`).join('')}`
    : wheel(65, axle, r, t.tires) + wheel(185, axle, r, t.tires);
  const b = buddyIcon(t.buddy);
  const buddy = b ? `<text x="178" y="${deck - 33}" font-size="24" text-anchor="middle" font-family="system-ui, 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${b.icon}</text>` : '';
  const riderAt = rider ? `<g transform="translate(${t.carrier === 'giant' ? 52 : 86} ${deck - 30})">${rider}</g>` : '';
  return `<defs>${defs}</defs>${carrier(t.carrier, deck - 8, riderAt)}${bed}${cab}${window}${buddy}${paw}${bumper}${lights(t.lights, 160, deck - 66)}${winch(t.winch, 232, deck + 6)}${wheels}`;
}

export const truckSvg = (t: Truck, rider = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -40 ${TRUCK_W + 40} ${TRUCK_H + 44}">${truckInner(t, rider)}</svg>`;
export const TRUCK_BOX = { x: -14, y: -40, w: TRUCK_W + 40, h: TRUCK_H + 44 } as const;
