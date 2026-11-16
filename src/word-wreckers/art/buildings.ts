// The buildings he puts up, drawn in code as a stack of pieces, bottom to top: a floor, another floor, the roof. The crane lowers them
// one at a time in a Job, and the whole stack stands in his Town, so the building he built is the one he sees. A gold building has
// gold trim and a star on top.
//
// A piece is drawn in its own box (0 to w across, 0 to h down); a building is centred on a lot LOT_W wide.
import { building, type BuildingId, type Look } from '../yard/shop';

export const LOT_W = 200;
const O = '#1d1d1f', GOLD = '#ffd23f', GLASS = '#bfe6f5';
const L = (w = 4) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

export interface Piece { w: number; h: number; svg: string }
type Paint = { body: string; trim: string; roof: string; sign: string; gold: boolean };

const box = (x: number, y: number, w: number, h: number, fill: string, rx = 4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${L()}/>`;
const windows = (x: number, y: number, w: number, h: number, cols: number, rows: number, fill = GLASS) => {
  const gw = w / cols, gh = h / rows, out: string[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(`<rect x="${x + c * gw + gw * .18}" y="${y + r * gh + gh * .18}" width="${gw * .64}" height="${gh * .64}" rx="3" fill="${fill}" ${L(3)}/>`);
  return out.join('');
};
const door = (cx: number, bottom: number, w: number, h: number, fill: string) => `<path d="M${cx - w / 2} ${bottom} V${bottom - h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${cx + w / 2} ${bottom - h + w / 2} V${bottom} Z" fill="${fill}" ${L(3.5)}/><circle cx="${cx + w * .25}" cy="${bottom - h * .4}" r="2.5" fill="${O}"/>`;
const sign = (cx: number, cy: number, e: string, r = 15) => (e ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" ${L(3)}/><text x="${cx}" y="${cy + r * .4}" font-size="${r * 1.15}" text-anchor="middle" class="emo-svg">${e}</text>` : '');
const gable = (w: number, h: number, fill: string, over = 10) => `<path d="M${-over + 4} ${h} L${w / 2} 4 L${w + over - 4} ${h} Z" fill="${fill}" ${L()}/>`;
const star = (cx: number, cy: number, r: number) => `<path d="M${cx} ${cy - r} L${cx + r * .3} ${cy - r * .3} L${cx + r} ${cy - r * .2} L${cx + r * .45} ${cy + r * .25} L${cx + r * .6} ${cy + r} L${cx} ${cy + r * .55} L${cx - r * .6} ${cy + r} L${cx - r * .45} ${cy + r * .25} L${cx - r} ${cy - r * .2} L${cx - r * .3} ${cy - r * .3} Z" fill="${GOLD}" ${L(3)}/>`;
const stripes = (x: number, y: number, w: number, h: number, a: string, b: string, n = 6) => Array.from({ length: n }, (_, i) => `<rect x="${x + (i * w) / n}" y="${y}" width="${w / n}" height="${h}" fill="${i % 2 ? b : a}"/>`).join('') + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" ${L(3)}/>`;

/** The pieces of each look, bottom first. */
const LOOKS: Record<Look, (p: Paint) => Piece[]> = {
  house: p => [
    { w: 150, h: 70, svg: `${box(0, 0, 150, 70, p.body)}${door(40, 70, 26, 48, p.trim)}${windows(70, 10, 70, 40, 2, 1)}` },
    { w: 150, h: 56, svg: `${gable(150, 56, p.roof)}${windows(60, 22, 30, 24, 1, 1)}` },
  ],
  stand: p => [
    { w: 130, h: 56, svg: `${box(0, 10, 130, 46, p.body)}${stripes(0, 10, 130, 12, '#fff', p.trim, 8)}${sign(65, 38, p.sign, 13)}` },
    { w: 150, h: 50, svg: `<path d="M20 50 V6 M130 50 V6" stroke="${O}" stroke-width="6"/>${stripes(4, 4, 142, 24, '#fff', '#e63946', 7)}` },
  ],
  treehouse: p => [
    { w: 60, h: 70, svg: `<path d="M18 70 Q24 40 22 0 H38 Q36 40 42 70 Z" fill="#8a5a2a" ${L()}/>` },
    { w: 150, h: 54, svg: `<ellipse cx="75" cy="30" rx="74" ry="24" fill="#4f9a3a" ${L()}/>${box(30, 6, 90, 46, p.body)}${windows(44, 14, 62, 28, 2, 1)}` },
    { w: 120, h: 40, svg: `${gable(120, 40, p.roof)}` },
  ],
  barn: p => [
    { w: 160, h: 80, svg: `${box(0, 0, 160, 80, p.body)}<path d="M55 80 V30 H105 V80 M55 30 L105 80 M105 30 L55 80" fill="none" stroke="#fff" stroke-width="5"/><rect x="55" y="30" width="50" height="50" fill="none" ${L(3)}/>` },
    { w: 170, h: 56, svg: `<path d="M2 56 L20 18 L85 4 L150 18 L168 56 Z" fill="${p.roof}" ${L()}/><circle cx="85" cy="32" r="10" fill="#fff" ${L(3)}/>` },
  ],
  shop: p => [
    { w: 150, h: 70, svg: `${box(0, 0, 150, 70, p.body)}${door(112, 70, 26, 50, p.trim)}<rect x="12" y="20" width="76" height="40" rx="4" fill="${GLASS}" ${L(3)}/>${sign(50, 40, p.sign, 14)}` },
    { w: 160, h: 40, svg: `${stripes(0, 0, 160, 20, '#fff', p.trim, 8)}<path d="M0 20 Q10 30 20 20 Q30 30 40 20 Q50 30 60 20 Q70 30 80 20 Q90 30 100 20 Q110 30 120 20 Q130 30 140 20 Q150 30 160 20" fill="#fff" ${L(3)}/>` },
  ],
  cabin: p => [
    { w: 150, h: 64, svg: `${box(0, 0, 150, 64, p.body)}${Array.from({ length: 4 }, (_, i) => `<path d="M0 ${14 + i * 14} H150" stroke="#5a3a1a" stroke-width="3"/>`).join('')}${door(110, 64, 26, 46, '#5a3a1a')}${windows(16, 12, 60, 30, 2, 1)}` },
    { w: 160, h: 50, svg: `<rect x="112" y="0" width="18" height="34" fill="#8a929b" ${L(3)}/>${gable(160, 50, p.roof)}` },
  ],
  station: p => [
    { w: 170, h: 70, svg: `${box(0, 0, 170, 70, p.body)}${[14, 66, 118].map(x => `<rect x="${x}" y="16" width="40" height="54" rx="3" fill="#d9d9d9" ${L(3)}/><path d="M${x} 30 h40 M${x} 44 h40 M${x} 58 h40" stroke="#8a929b" stroke-width="3"/>`).join('')}` },
    { w: 170, h: 54, svg: `${box(0, 0, 170, 54, p.body)}${windows(10, 6, 150, 42, 4, 1)}` },
    { w: 176, h: 36, svg: `${box(0, 18, 176, 18, p.trim)}${sign(88, 18, p.sign, 17)}` },
  ],
  school: p => [
    { w: 170, h: 64, svg: `${box(0, 0, 170, 64, p.body)}${door(85, 64, 34, 48, p.trim)}${windows(6, 10, 56, 36, 2, 1)}${windows(108, 10, 56, 36, 2, 1)}` },
    { w: 170, h: 54, svg: `${box(0, 0, 170, 54, p.body)}${windows(6, 6, 158, 42, 5, 1)}` },
    { w: 176, h: 64, svg: `<rect x="66" y="10" width="44" height="40" fill="${p.trim}" ${L()}/><path d="M60 14 L88 0 L116 14 Z" fill="${p.roof}" ${L(3)}/>${sign(88, 32, p.sign, 13)}${box(0, 48, 176, 16, p.roof)}` },
  ],
  columns: p => [
    { w: 170, h: 80, svg: `${box(0, 64, 170, 16, '#d9d9d9')}${box(4, 0, 162, 66, p.body)}${[18, 54, 104, 140].map(x => `<rect x="${x}" y="6" width="14" height="58" fill="#fff" ${L(3)}/>`).join('')}${door(85, 66, 24, 46, p.trim)}` },
    { w: 180, h: 54, svg: `${box(0, 38, 180, 16, '#fff')}<path d="M4 40 L90 2 L176 40 Z" fill="${p.roof}" ${L()}/>${sign(90, 26, p.sign, 12)}` },
  ],
  office: p => [
    { w: 150, h: 56, svg: `${box(0, 0, 150, 56, p.body)}${door(75, 56, 30, 42, GLASS)}${windows(4, 8, 44, 34, 1, 1)}${windows(102, 8, 44, 34, 1, 1)}` },
    { w: 150, h: 50, svg: `${box(0, 0, 150, 50, p.body)}${windows(6, 4, 138, 42, 4, 1)}` },
    { w: 150, h: 50, svg: `${box(0, 0, 150, 50, p.body)}${windows(6, 4, 138, 42, 4, 1)}` },
    { w: 160, h: 40, svg: `${box(0, 24, 160, 16, p.trim)}${sign(80, 20, p.sign, 18)}` },
  ],
  diner: p => [
    { w: 170, h: 60, svg: `<rect x="0" y="0" width="170" height="60" rx="26" fill="${p.body}" ${L()}/>${stripes(10, 40, 150, 10, '#e63946', '#fff', 10)}${windows(14, 6, 110, 30, 4, 1)}${door(146, 60, 22, 46, '#c9d1d9')}` },
    { w: 120, h: 44, svg: `<rect x="10" y="0" width="100" height="36" rx="10" fill="#e63946" ${L()}/>${sign(60, 18, p.sign, 14)}<path d="M40 36 V44 M80 36 V44" stroke="${O}" stroke-width="5"/>` },
  ],
  watertower: p => [
    { w: 120, h: 90, svg: `<path d="M24 90 L42 0 M96 90 L78 0 M30 60 L90 30 M90 60 L30 30" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M24 90 L42 0 M96 90 L78 0" stroke="#8a929b" stroke-width="3"/>` },
    { w: 130, h: 60, svg: `<rect x="0" y="0" width="130" height="60" rx="20" fill="${p.body}" ${L()}/>${sign(65, 30, p.sign, 15)}` },
    { w: 120, h: 32, svg: `<path d="M8 32 Q60 -18 112 32 Z" fill="${p.roof}" ${L()}/>` },
  ],
  lighthouse: p => [
    { w: 90, h: 60, svg: `<path d="M0 60 L8 0 H82 L90 60 Z" fill="${p.body}" ${L()}/><path d="M4 30 H86" stroke="#e63946" stroke-width="16"/>${door(45, 60, 20, 34, p.trim)}` },
    { w: 76, h: 60, svg: `<path d="M0 60 L6 0 H70 L76 60 Z" fill="#e63946" ${L()}/><path d="M3 30 H73" stroke="${p.body}" stroke-width="14"/>` },
    { w: 64, h: 56, svg: `<path d="M0 56 L4 0 H60 L64 56 Z" fill="${p.body}" ${L()}/><path d="M2 28 H62" stroke="#e63946" stroke-width="12"/>` },
    { w: 80, h: 56, svg: `<rect x="4" y="38" width="72" height="12" fill="${O}"/><rect x="14" y="14" width="52" height="28" fill="#fff6a0" ${L(3)}/><path d="M10 16 L40 0 L70 16 Z" fill="${p.roof}" ${L(3)}/>` },
  ],
  castle: p => [
    { w: 180, h: 64, svg: `${box(0, 0, 180, 64, p.body)}${door(90, 64, 34, 52, '#7a4a2a')}${windows(10, 12, 40, 30, 1, 1, O)}${windows(130, 12, 40, 30, 1, 1, O)}` },
    { w: 100, h: 60, svg: `${box(0, 0, 100, 60, p.body)}${windows(30, 10, 40, 40, 1, 1, O)}` },
    { w: 110, h: 52, svg: `<path d="M5 52 V30 H20 V40 H35 V30 H50 V40 H65 V30 H80 V40 H95 V30 H105 V52 Z" fill="${p.body}" ${L()}/><path d="M55 30 V2" stroke="${O}" stroke-width="4"/><path d="M55 2 L80 10 L55 18 Z" fill="#e63946" ${L(3)}/>` },
  ],
  dome: p => [
    { w: 170, h: 60, svg: `${box(0, 0, 170, 60, p.body)}${door(85, 60, 30, 44, GLASS)}${windows(6, 10, 50, 36, 2, 1)}${windows(114, 10, 50, 36, 2, 1)}` },
    { w: 150, h: 46, svg: `${box(0, 0, 150, 46, p.body)}${windows(6, 4, 138, 38, 5, 1)}` },
    { w: 130, h: 60, svg: `<path d="M2 60 A63 58 0 0 1 128 60 Z" fill="${p.roof}" ${L()}/>${sign(65, 38, p.sign, 15)}` },
  ],
  clock: p => [
    { w: 120, h: 60, svg: `${box(0, 0, 120, 60, p.body)}${door(60, 60, 28, 44, p.trim)}` },
    { w: 80, h: 60, svg: `${box(0, 0, 80, 60, p.body)}${windows(16, 8, 48, 44, 2, 2)}` },
    { w: 90, h: 70, svg: `${box(0, 0, 90, 70, p.body)}<circle cx="45" cy="35" r="27" fill="#fff" ${L()}/><path d="M45 35 V16 M45 35 H60" stroke="${O}" stroke-width="5" stroke-linecap="round"/>` },
    { w: 90, h: 50, svg: `<path d="M2 50 L45 0 L88 50 Z" fill="${p.roof}" ${L()}/>` },
  ],
  bridge: p => [
    { w: 190, h: 64, svg: `<path d="M20 64 V0 H44 V64 M146 64 V0 H170 V64" fill="#8a929b" ${L()}/><path d="M0 64 Q95 34 190 64" fill="none" stroke="#3d9be0" stroke-width="10"/>` },
    { w: 196, h: 22, svg: `${box(0, 0, 196, 22, p.body)}<path d="M0 11 H196" stroke="#fff" stroke-width="3" stroke-dasharray="10 8"/>` },
    { w: 190, h: 64, svg: `<path d="M8 64 Q95 -10 182 64" fill="none" stroke="${O}" stroke-width="12"/><path d="M8 64 Q95 -10 182 64" fill="none" stroke="${p.body}" stroke-width="6"/>${[40, 70, 95, 120, 150].map(x => `<path d="M${x} 64 V${x === 95 ? 26 : x === 70 || x === 120 ? 32 : 46}" stroke="${O}" stroke-width="3"/>`).join('')}` },
  ],
  tower: p => [
    { w: 130, h: 50, svg: `${box(0, 0, 130, 50, p.body)}${door(65, 50, 34, 40, GLASS)}${sign(20, 22, p.sign, 13)}` },
    ...Array.from({ length: 4 }, () => ({ w: 130, h: 44, svg: `${box(0, 0, 130, 44, p.body)}${windows(4, 4, 122, 36, 4, 1)}` })),
    { w: 110, h: 46, svg: `<path d="M8 46 L20 14 H90 L102 46 Z" fill="${p.roof}" ${L()}/><path d="M55 14 V0" stroke="${O}" stroke-width="5"/><circle cx="55" cy="2" r="4" fill="#ff3b3b" ${L(2)}/>` },
  ],
  stadium: p => [
    { w: 196, h: 54, svg: `<path d="M0 54 L14 0 H182 L196 54 Z" fill="${p.body}" ${L()}/>${[30, 70, 110, 150].map(x => door(x + 10, 54, 18, 30, '#5a5f66')).join('')}` },
    { w: 196, h: 46, svg: `<path d="M0 46 L18 0 H178 L196 46 Z" fill="${p.trim}" ${L()}/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${30 + i * 17}" cy="${18 + (i % 2) * 10}" r="5" fill="${['#e63946', '#3d9be0', '#ffd23f', '#2bb673'][i % 4]}"/>`).join('')}${sign(98, 22, p.sign, 13)}` },
    { w: 196, h: 54, svg: `<path d="M20 54 V8 M176 54 V8" stroke="${O}" stroke-width="6"/>${[20, 176].map(x => `<rect x="${x - 16}" y="0" width="32" height="16" rx="3" fill="#fff6a0" ${L(3)}/>`).join('')}<path d="M10 54 Q98 22 186 54" fill="none" stroke="${p.roof}" stroke-width="10"/>` },
  ],
  rocket: p => [
    { w: 180, h: 34, svg: `${box(0, 6, 180, 28, '#8a929b')}${stripes(10, 14, 160, 10, '#ffd23f', O, 10)}` },
    { w: 120, h: 76, svg: `<path d="M10 76 V0 M30 76 V0 M10 10 L30 30 M30 10 L10 30 M10 40 L30 60" stroke="${O}" stroke-width="5"/><path d="M58 76 L44 76 L58 50 Z M96 76 L110 76 L96 50 Z" fill="#e63946" ${L(3)}/><rect x="56" y="0" width="42" height="76" fill="${p.body}" ${L()}/>` },
    { w: 120, h: 56, svg: `<rect x="56" y="0" width="42" height="56" fill="${p.body}" ${L()}/><circle cx="77" cy="24" r="10" fill="${GLASS}" ${L(3)}/><path d="M56 46 H98" stroke="#e63946" stroke-width="7"/>` },
    { w: 120, h: 50, svg: `<path d="M56 50 Q60 14 77 0 Q94 14 98 50 Z" fill="#e63946" ${L()}/>` },
  ],
  airport: p => [
    { w: 180, h: 50, svg: `${box(0, 0, 180, 50, p.body)}${windows(6, 6, 168, 38, 6, 1)}${sign(90, 25, p.sign, 13)}` },
    { w: 50, h: 80, svg: `${box(0, 0, 50, 80, p.body)}<path d="M25 6 V74" stroke="#8a929b" stroke-width="4"/>` },
    { w: 100, h: 46, svg: `<path d="M0 46 L12 0 H88 L100 46 Z" fill="${p.trim}" ${L()}/>${windows(14, 8, 72, 30, 3, 1)}` },
    { w: 60, h: 34, svg: `<path d="M30 34 V4" stroke="${O}" stroke-width="5"/><path d="M14 34 H46" stroke="${O}" stroke-width="7"/><circle cx="30" cy="4" r="5" fill="#ff3b3b" ${L(2)}/>` },
  ],
  needle: p => [
    { w: 120, h: 34, svg: `<path d="M0 34 L40 0 H80 L120 34 Z" fill="#8a929b" ${L()}/>` },
    { w: 30, h: 96, svg: `${box(0, 0, 30, 96, p.body, 2)}<path d="M0 32 H30 M0 64 H30" stroke="#fff" stroke-width="4"/>` },
    { w: 120, h: 44, svg: `<path d="M0 22 Q60 -14 120 22 Q60 58 0 22 Z" fill="${p.body}" ${L()}/>${windows(22, 12, 76, 18, 4, 1)}` },
    { w: 30, h: 50, svg: `<path d="M15 50 V4" stroke="${O}" stroke-width="5"/><circle cx="15" cy="4" r="5" fill="#ff3b3b" ${L(2)}/>` },
  ],
  factory: p => [
    { w: 180, h: 64, svg: `${box(0, 0, 180, 64, p.body)}<rect x="110" y="16" width="56" height="48" rx="3" fill="#d9d9d9" ${L(3)}/>${windows(8, 10, 90, 34, 3, 1)}${sign(138, 36, p.sign, 15)}` },
    { w: 180, h: 46, svg: `<path d="M0 46 V16 L30 0 V16 L60 0 V16 L90 0 V16 L120 0 V16 L150 0 V16 L180 0 V46 Z" fill="${p.trim}" ${L()}/>` },
    { w: 180, h: 54, svg: `${[22, 70].map(x => `<rect x="${x}" y="4" width="22" height="50" fill="#8a929b" ${L(3)}/><path d="M${x} 14 h22" stroke="#e63946" stroke-width="6"/>`).join('')}<path d="M33 0 q-8 -10 2 -16" stroke="#c9d1d9" stroke-width="6" fill="none" stroke-linecap="round"/>` },
  ],
};

const paintFor = (id: BuildingId, gold: boolean): Paint => {
  const b = building(id);
  return { body: b.color, trim: gold ? GOLD : '#5a5f66', roof: gold ? GOLD : '#7a4a2a', sign: b.sign, gold };
};

/** The building's pieces, bottom first. A gold one gets a star on its top piece. */
export function piecesOf(id: BuildingId, gold = false): Piece[] {
  const pieces = LOOKS[building(id).look](paintFor(id, gold));
  if (!gold) return pieces;
  const top = pieces.at(-1)!;
  return [...pieces.slice(0, -1), { ...top, svg: `${top.svg}${star(top.w / 2, 4, 12)}` }];
}

/** The whole building, standing on its lot: an SVG document LOT_W wide. */
export function buildingSvg(id: BuildingId, gold = false): { svg: string; h: number } {
  const pieces = piecesOf(id, gold), h = pieces.reduce((s, p) => s + p.h, 0);
  let y = h, out = '';
  for (const p of pieces) { y -= p.h; out += `<g transform="translate(${(LOT_W - p.w) / 2} ${y})">${p.svg}</g>`; }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -16 ${LOT_W + 20} ${h + 16}">${out}</svg>`, h };
}
/** One piece as an SVG document, for the Job's canvas. */
export const pieceSvg = (p: Piece) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -16 ${p.w + 24} ${p.h + 20}">${p.svg}</svg>`;
export const PIECE_PAD = { x: 12, top: 16, h: 20 };
