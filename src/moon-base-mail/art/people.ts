// The people (and the robot and the cat) of the base, drawn from the side as SVG strings, so the Home tile (an <img>) and the walk's
// canvas (drawImage) show the same astronaut. His astronaut wears the suit colour and the helmet he picked; the crew wear the base's
// orange suits.
const O = '#14161b';
const st = (w = 3) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
/** Every picture here is 2 wide to 3 high, with the feet on its bottom edge. */
export const PERSON_ASPECT = 1.5;
const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -8 48 72">${body}</svg>`;

/** What each helmet adds on top of the round one (by the part of its id after "helmet:"). */
function helmetBits(h: string): { back: string; front: string; visor: string } {
  const visor = h === 'visor' || h === 'crown' ? '#e8b923' : h === 'robot' ? '#5af0ff' : '#3b4a6b';
  switch (h) {
    case 'bubble': return { back: `<circle cx="24" cy="15" r="14" fill="#c4f1ff" fill-opacity=".55" ${st(2.5)}/>`, front: `<circle cx="18" cy="9" r="2.5" fill="#fff"/>`, visor };
    case 'lamp': return { back: '', front: `<rect x="20" y="0" width="8" height="5" rx="2" fill="#ffd23f" ${st(2)}/><path d="M28 2 L40 -2 V8 Z" fill="#ffd23f" fill-opacity=".45"/>`, visor };
    case 'antenna': return { back: `<path d="M24 4 L30 -6" ${st(2)}/><circle cx="30.5" cy="-7" r="2.5" fill="#e63946" ${st(1.5)}/>`, front: '', visor };
    case 'cat': return { back: `<path d="M13 8 L13 -2 L20 4 Z M35 8 L35 -2 L28 4 Z" fill="#ff8c1a" ${st(2)}/>`, front: '', visor };
    case 'star': return { back: `<path d="M24 -6 L26.4 -1 L32 -0.6 L27.7 3 L29 8.4 L24 5.6 L19 8.4 L20.3 3 L16 -0.6 L21.6 -1 Z" fill="#ffd23f" ${st(2)}/>`, front: '', visor };
    case 'fin': return { back: `<path d="M16 6 Q22 -8 34 -4 Q28 0 30 6 Z" fill="#5b9dff" ${st(2)}/>`, front: '', visor };
    case 'horn': return { back: `<path d="M21 4 L24 -10 L27 4 Z" fill="#ff9ccc" ${st(2)}/>`, front: '', visor };
    case 'crown': return { back: `<path d="M14 6 L14 -3 L19 2 L24 -5 L29 2 L34 -3 L34 6 Z" fill="#ffd23f" ${st(2)}/>`, front: '', visor };
    case 'robot': return { back: `<path d="M24 3 V-4" ${st(2)}/><circle cx="24" cy="-5" r="2.5" fill="#ffd23f" ${st(1.5)}/>`, front: `<path d="M10 15 H6 M38 15 H42" ${st(3)}/>`, visor };
    case 'rocket': return { back: `<path d="M24 -10 Q30 -4 28 4 H20 Q18 -4 24 -10 Z" fill="#e63946" ${st(2)}/>`, front: '', visor };
    default: return { back: '', front: '', visor };
  }
}

/** An astronaut from the side, facing right, in a 48 by 72 picture (2 wide to 3 high) with the feet at the bottom. `step` swings the legs (-1 to 1). */
export function astronautSvg(suit: string, helmet = 'round', step = 0, pattern: 'stripe' | 'star' | null = null): string {
  const h = helmetBits(helmet), sw = step * 5;
  const deco = pattern === 'stripe' ? `<path d="M14 32 H34 M14 38 H34 M14 44 H34" stroke="#e63946" stroke-width="3"/>`
    : pattern === 'star' ? `<circle cx="20" cy="34" r="1.6" fill="#fff"/><circle cx="29" cy="39" r="1.6" fill="#fff"/><circle cx="22" cy="44" r="1.4" fill="#ffd23f"/>` : '';
  return svg(`<g transform="translate(0 6)">
    ${h.back}
    <rect x="5" y="26" width="10" height="20" rx="3" fill="#c0c7d0" ${st(2.5)}/>
    <path d="M${19 - sw} 46 L${19 - sw} 55 M${29 + sw} 46 L${31 + sw} 55" fill="none" stroke="${O}" stroke-width="11" stroke-linecap="round"/>
    <path d="M${19 - sw} 46 L${19 - sw} 55 M${29 + sw} 46 L${31 + sw} 55" fill="none" stroke="${suit}" stroke-width="6" stroke-linecap="round"/>
    <rect x="${14 - sw}" y="53" width="11" height="5" rx="2" fill="#3b424c" ${st(2)}/><rect x="${26 + sw}" y="53" width="11" height="5" rx="2" fill="#3b424c" ${st(2)}/>
    <rect x="12" y="26" width="24" height="24" rx="7" fill="${suit}" ${st()}/>${deco}
    <path d="M30 32 Q40 34 40 42" fill="none" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M30 32 Q40 34 40 42" fill="none" stroke="${suit}" stroke-width="5" stroke-linecap="round"/><circle cx="40" cy="43" r="3.4" fill="#f2f2f2" ${st(2)}/>
    <rect x="18" y="34" width="10" height="6" rx="1.5" fill="#ffd23f" ${st(1.5)}/>
    <circle cx="24" cy="15" r="12" fill="#f2f2f2" ${st()}/>
    <path d="M24 8 H32 Q36 8 36 14 V18 Q36 22 32 22 H24 Q20 22 20 18 V12 Q20 8 24 8 Z" fill="${h.visor}" ${st(2.5)}/>
    <path d="M26 11 Q30 10 32 13" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>
    ${h.front}
  </g>`);
}

/** Dot, the base's robot. */
export const robotSvg = () => svg(`<g transform="translate(0 6)">
  <path d="M24 10 V2" ${st(2.5)}/><circle cx="24" cy="1" r="3" fill="#e63946" ${st(2)}/>
  <rect x="11" y="10" width="26" height="18" rx="6" fill="#c0c7d0" ${st()}/><circle cx="19" cy="19" r="3.4" fill="#5af0ff" ${st(2)}/><circle cx="29" cy="19" r="3.4" fill="#5af0ff" ${st(2)}/>
  <rect x="14" y="30" width="20" height="16" rx="4" fill="#9aa5b1" ${st()}/><rect x="20" y="34" width="8" height="5" rx="1.5" fill="#ffd23f" ${st(1.5)}/>
  <path d="M14 36 L7 42 M34 36 L41 42" ${st(3)}/><rect x="12" y="48" width="24" height="9" rx="4.5" fill="#3b424c" ${st(2.5)}/></g>`);

/** Pip, the base's cat, in a bubble helmet. */
export const catSvg = () => svg(`<g transform="translate(0 6)">
  <path d="M40 46 Q48 36 42 28" fill="none" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M40 46 Q48 36 42 28" fill="none" stroke="#ff9d3a" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="26" cy="47" rx="15" ry="9" fill="#ff9d3a" ${st()}/><path d="M16 50 V57 M22 52 V57 M30 52 V57 M36 50 V57" ${st(4)}/>
  <path d="M10 30 L11 19 L17 25 Z M28 30 L27 19 L21 25 Z" fill="#ff9d3a" ${st(2)}/>
  <circle cx="19" cy="33" r="10" fill="#ff9d3a" ${st()}/><circle cx="16" cy="32" r="1.8" fill="${O}"/><circle cx="23" cy="32" r="1.8" fill="${O}"/><path d="M18 36 Q19.5 37.5 21 36" fill="none" ${st(1.5)}/>
  <circle cx="19" cy="30" r="15" fill="#c4f1ff" fill-opacity=".35" ${st(2.5)}/><circle cx="13" cy="23" r="2.4" fill="#fff"/></g>`);

export const svgUrl = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
