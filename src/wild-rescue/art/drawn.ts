// The animals Apple's emoji don't show clearly (or at all), drawn in code: each is the inside of a 100×100 SVG, facing right, in the
// family look (thick dark outlines, flat friendly colours). Kept as strings so the same drawing goes on the page and onto the Rescue's
// canvas (as an image). Also the baby stages the Babies lessons grow through.
const O = '#1d1d1f';
const line = (w = 4) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const eye = (x: number, y: number, r = 4.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${O}"/><circle cx="${x + r * .35}" cy="${y - r * .35}" r="${r * .35}" fill="#fff"/>`;

/** A hare sitting, facing right: the desert's jackrabbit (with its very long ears) and the arctic hare (shorter ears, white). */
function hare(fur: string, belly: string, short = false) {
  const ear = short ? 22 : 36;
  return `
    <circle cx="16" cy="70" r="9" fill="${belly}" ${line(3.5)}/>
    <path d="M18 84 Q12 50 44 46 Q72 44 74 70 Q72 88 46 88 Q24 90 18 84 Z" fill="${fur}" ${line()}/>
    <path d="M30 88 Q24 78 34 74 Q52 80 56 90 Z" fill="${fur}" ${line(3.5)}/>
    <path d="M64 84 L66 94 H76" fill="none" ${line(3.5)}/>
    <path d="M66 40 Q58 ${40 - ear} 66 ${36 - ear} Q76 ${40 - ear} 74 40 Z" fill="${fur}" ${line(3.5)}/>
    <path d="M76 40 Q76 ${42 - ear} 86 ${40 - ear} Q92 ${46 - ear} 82 42 Z" fill="${fur}" ${line(3.5)}/>
    <path d="M68 36 Q66 ${48 - ear} 70 ${44 - ear}" stroke="#f7b7a3" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M58 58 Q58 38 76 38 Q94 40 94 56 Q90 68 76 68 Q62 68 58 58 Z" fill="${fur}" ${line()}/>
    <path d="M44 66 Q50 78 62 80" stroke="${belly}" stroke-width="6" stroke-linecap="round" fill="none"/>
    ${eye(80, 50, 3.6)}<ellipse cx="93" cy="57" rx="3" ry="2.5" fill="#e88a9a"/><path d="M90 62 l8 2 M90 64 l7 4" stroke="${O}" stroke-width="1.5"/>`;
}

export const DRAWN: Record<string, string> = {
  seaturtle: `
    <path d="M18 66 Q6 74 4 86 Q18 84 30 72 Z" fill="#5fae6a" ${line(3.5)}/>
    <path d="M66 70 Q74 84 88 88 Q86 74 74 64 Z" fill="#5fae6a" ${line(3.5)}/>
    <path d="M30 44 Q20 30 8 30 Q10 42 24 50 Z" fill="#5fae6a" ${line(3.5)}/>
    <path d="M18 60 Q20 30 52 28 Q80 28 84 58 Q80 74 50 76 Q22 76 18 60 Z" fill="#8a5a2b" ${line()}/>
    <path d="M40 34 L50 46 L62 34 M50 46 L50 72 M30 52 L50 46 L74 54" fill="none" stroke="#5a3a18" stroke-width="3"/>
    <path d="M82 48 Q96 44 96 56 Q96 66 84 64 Z" fill="#5fae6a" ${line(3.5)}/>${eye(89, 53, 3.5)}`,
  dragonfly: `
    <ellipse cx="38" cy="34" rx="30" ry="10" fill="#cfefff" fill-opacity=".85" ${line(3)} transform="rotate(-12 38 34)"/>
    <ellipse cx="38" cy="58" rx="30" ry="10" fill="#cfefff" fill-opacity=".85" ${line(3)} transform="rotate(12 38 58)"/>
    <ellipse cx="62" cy="34" rx="26" ry="9" fill="#cfefff" fill-opacity=".85" ${line(3)} transform="rotate(14 62 34)"/>
    <ellipse cx="62" cy="58" rx="26" ry="9" fill="#cfefff" fill-opacity=".85" ${line(3)} transform="rotate(-14 62 58)"/>
    <path d="M6 46 H62" stroke="${O}" stroke-width="11" stroke-linecap="round"/><path d="M6 46 H62" stroke="#2b7fd8" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="68" cy="46" rx="10" ry="8" fill="#2b7fd8" ${line(3.5)}/>
    <circle cx="82" cy="40" r="9" fill="#2bb673" ${line(3.5)}/><circle cx="82" cy="52" r="9" fill="#2bb673" ${line(3.5)}/>${eye(85, 40, 3)}${eye(85, 52, 3)}`,
  woodpecker: `
    <path d="M10 90 L12 6" stroke="#7a4f2a" stroke-width="16" stroke-linecap="round"/><path d="M10 90 L12 6" stroke="${O}" stroke-width="3" fill="none" opacity=".4"/>
    <path d="M30 86 L22 98 L34 92 Z" fill="#2a2d33" ${line(3)}/>
    <path d="M28 88 Q20 60 34 38 Q46 24 60 30 Q70 40 62 60 Q56 80 36 90 Z" fill="#2a2d33" ${line()}/>
    <path d="M40 46 Q48 52 50 66 Q42 74 36 70 Q34 56 40 46 Z" fill="#f4f6f8"/>
    <path d="M44 40 Q52 44 54 52" stroke="#f4f6f8" stroke-width="4" fill="none"/>
    <circle cx="60" cy="30" r="15" fill="#f4f6f8" ${line()}/>
    <path d="M48 22 Q58 8 72 20 Q66 16 60 18 Z" fill="#e63946" ${line(3)}/>
    <path d="M72 30 L96 28 L72 36 Z" fill="#5a5a5a" ${line(3)}/>${eye(64, 28, 3.5)}
    <path d="M30 70 L22 72 M32 78 L24 82" stroke="${O}" stroke-width="3"/>`,
  ostrich: `
    <path d="M44 66 L40 96 M58 66 L62 96" stroke="#e8a0a0" stroke-width="7" stroke-linecap="round"/><path d="M44 66 L40 96 M58 66 L62 96" stroke="${O}" stroke-width="2" fill="none"/>
    <path d="M36 96 H46 M58 96 H68" stroke="${O}" stroke-width="4" stroke-linecap="round"/>
    <path d="M14 52 Q12 30 40 32 Q70 30 76 50 Q74 70 46 70 Q20 70 14 52 Z" fill="#2a2d33" ${line()}/>
    <path d="M14 46 Q4 40 6 30 Q16 36 22 42 Z" fill="#f4f6f8" ${line(3)}/>
    <path d="M70 40 Q74 26 72 12" stroke="${O}" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M70 40 Q74 26 72 12" stroke="#e8a0a0" stroke-width="6" stroke-linecap="round" fill="none"/>
    <ellipse cx="76" cy="10" rx="9" ry="7" fill="#e8a0a0" ${line(3)}/><path d="M84 10 L94 12 L84 14 Z" fill="#d9822b" ${line(2.5)}/>${eye(78, 8, 2.8)}`,
  fennec: `
    <path d="M22 50 L8 6 L42 34 Z" fill="#f2d6a0" ${line()}/><path d="M24 40 L15 16 L34 34 Z" fill="#f7b7a3"/>
    <path d="M78 50 L92 6 L58 34 Z" fill="#f2d6a0" ${line()}/><path d="M76 40 L85 16 L66 34 Z" fill="#f7b7a3"/>
    <path d="M22 50 Q20 30 50 30 Q80 30 78 50 Q76 72 50 80 Q24 72 22 50 Z" fill="#f2d6a0" ${line()}/>
    <path d="M36 62 Q50 70 64 62 Q60 80 50 82 Q40 80 36 62 Z" fill="#fff4e0"/>
    ${eye(38, 52, 5)}${eye(62, 52, 5)}<ellipse cx="50" cy="70" rx="5" ry="4" fill="${O}"/>`,
  roadrunner: `
    <path d="M10 44 L2 22 L22 40 Z" fill="#6b4a2a" ${line(3)}/>
    <path d="M8 46 Q30 30 56 40 Q72 50 62 64 Q46 72 26 60 Z" fill="#a07a4a" ${line()}/>
    <path d="M30 46 l6 4 M40 44 l6 5 M50 46 l5 5 M36 56 l6 3" stroke="#5a3a18" stroke-width="3"/>
    <path d="M44 66 L36 92 M54 64 L66 90" stroke="${O}" stroke-width="4" stroke-linecap="round"/>
    <path d="M30 92 H42 M62 90 L72 84" stroke="${O}" stroke-width="4" stroke-linecap="round"/>
    <path d="M58 42 Q60 24 72 22 Q84 22 84 32 Q80 42 66 46 Z" fill="#a07a4a" ${line()}/>
    <path d="M64 22 L60 8 L70 18 L72 6 L76 20 Z" fill="#5a3a18" ${line(2.5)}/>
    <path d="M82 28 L98 30 L82 34 Z" fill="#5a5a5a" ${line(2.5)}/>${eye(74, 28, 3.2)}<path d="M78 32 Q80 36 76 38" stroke="#3d9be0" stroke-width="3" fill="none"/>`,
  meerkat: `
    <path d="M62 90 Q86 92 84 70" stroke="${O}" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M62 90 Q86 92 84 70" stroke="#c9a46a" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M36 94 Q30 60 38 40 Q50 30 62 40 Q70 60 64 94 Z" fill="#c9a46a" ${line()}/>
    <path d="M42 94 Q40 70 50 56 Q58 70 58 94 Z" fill="#e8d2a6"/>
    <path d="M38 58 Q30 66 34 72 M62 58 Q70 66 66 72" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="26" rx="15" ry="14" fill="#c9a46a" ${line()}/>
    <circle cx="35" cy="20" r="4" fill="#5a3a18" ${line(2.5)}/><circle cx="65" cy="20" r="4" fill="#5a3a18" ${line(2.5)}/>
    <ellipse cx="43" cy="25" rx="5" ry="6" fill="#3a2a18"/><ellipse cx="57" cy="25" rx="5" ry="6" fill="#3a2a18"/>
    <circle cx="43" cy="25" r="2.4" fill="#fff"/><circle cx="57" cy="25" r="2.4" fill="#fff"/><ellipse cx="50" cy="36" rx="4" ry="3" fill="${O}"/>`,
  rattlesnake: `
    <path d="M14 76 Q14 92 50 92 Q86 92 86 76 Q86 62 50 62 Q20 62 22 74 Q24 84 50 84 Q74 84 74 74" fill="none" stroke="${O}" stroke-width="17" stroke-linecap="round"/>
    <path d="M14 76 Q14 92 50 92 Q86 92 86 76 Q86 62 50 62 Q20 62 22 74 Q24 84 50 84 Q74 84 74 74" fill="none" stroke="#c9a46a" stroke-width="10" stroke-linecap="round"/>
    <path d="M30 89 l5 -4 l5 4 l-5 4 Z M50 92 l5 -4 l5 4 l-5 4 Z M70 88 l5 -4 l5 4 l-5 4 Z M40 62 l5 -4 l5 4 l-5 4 Z M62 63 l5 -4 l5 4 l-5 4 Z" fill="#7a4f2a"/>
    <path d="M14 76 Q8 66 10 56" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/>
    <path d="M8 56 L6 46 M12 56 L14 46" stroke="${O}" stroke-width="0"/>
    <ellipse cx="10" cy="50" rx="5" ry="4" fill="#e8d2a6" ${line(2.5)}/><ellipse cx="10" cy="42" rx="4.5" ry="3.5" fill="#e8d2a6" ${line(2.5)}/><ellipse cx="10" cy="35" rx="4" ry="3" fill="#e8d2a6" ${line(2.5)}/>
    <path d="M74 74 Q72 50 84 40" fill="none" stroke="${O}" stroke-width="14" stroke-linecap="round"/><path d="M74 74 Q72 50 84 40" fill="none" stroke="#c9a46a" stroke-width="8" stroke-linecap="round"/>
    <path d="M76 42 Q80 26 92 30 Q100 36 92 46 Q84 50 76 42 Z" fill="#c9a46a" ${line(3.5)}/>${eye(89, 35, 3)}
    <path d="M98 40 L104 38 M98 40 L104 44" stroke="#e63946" stroke-width="2"/>`,
  tortoise: `
    <path d="M22 70 L18 88 H32 L34 74 M66 74 L68 88 H82 L78 70" fill="#8a7a50" ${line()}/>
    <path d="M12 70 Q14 28 50 26 Q86 28 88 70 Z" fill="#9a6a30" ${line()}/>
    <path d="M30 40 L40 54 L60 54 L70 40 M40 54 L34 70 M60 54 L66 70 M40 54 L50 38 L60 54" fill="none" stroke="#5a3a18" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M10 70 H90" stroke="${O}" stroke-width="5" stroke-linecap="round"/>
    <path d="M86 62 Q96 54 100 62 Q100 72 90 72 Z" fill="#8a7a50" ${line(3.5)}/>${eye(93, 62, 2.8)}`,
  walrus: `
    <path d="M8 84 Q2 72 16 70 L20 80 Z" fill="#9a6a4a" ${line(3.5)}/>
    <path d="M12 82 Q10 44 50 34 Q84 30 90 60 Q92 86 60 88 Q30 90 12 82 Z" fill="#b07a58" ${line()}/>
    <path d="M58 86 Q66 94 76 92 Q74 84 66 82 Z" fill="#9a6a4a" ${line(3.5)}/>
    <ellipse cx="74" cy="58" rx="14" ry="10" fill="#d6a080" ${line(3.5)}/>
    <path d="M68 64 L66 92 L72 66 Z M80 64 L84 92 L84 64 Z" fill="#fffaf0" ${line(3)}/>
    <path d="M64 56 l-6 -2 M64 60 l-7 1 M84 56 l6 -2 M84 60 l7 1" stroke="${O}" stroke-width="2"/>${eye(68, 44, 3.2)}${eye(82, 44, 3.2)}`,
  arcticfox: `
    <path d="M10 74 Q0 50 22 44 Q30 60 24 76 Z" fill="#f4f8fb" ${line()}/>
    <path d="M22 76 Q20 50 50 48 Q74 48 74 70 Q72 84 46 84 Q26 84 22 76 Z" fill="#f4f8fb" ${line()}/>
    <path d="M34 82 L32 94 H40 M60 82 L62 94 H70" fill="#f4f8fb" ${line(3.5)}/>
    <path d="M66 38 L70 22 L78 34 M80 34 L88 22 L90 38" fill="#f4f8fb" ${line(3.5)}/>
    <path d="M60 52 Q60 32 78 32 Q94 32 96 48 Q92 60 78 62 Q64 62 60 52 Z" fill="#f4f8fb" ${line()}/>
    ${eye(74, 44, 3.4)}${eye(86, 44, 3.4)}<ellipse cx="94" cy="50" rx="3.5" ry="3" fill="${O}"/>`,
  snowyowl: `
    <path d="M20 86 Q16 46 30 26 Q50 10 70 26 Q84 46 80 86 Z" fill="#fbfdff" ${line()}/>
    <path d="M30 56 l4 3 M44 62 l4 3 M58 56 l4 3 M38 72 l4 3 M54 74 l4 3 M66 68 l4 3" stroke="${O}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="40" cy="36" r="10" fill="#ffd23f" ${line(3.5)}/><circle cx="60" cy="36" r="10" fill="#ffd23f" ${line(3.5)}/>
    <circle cx="40" cy="36" r="5" fill="${O}"/><circle cx="60" cy="36" r="5" fill="${O}"/><path d="M47 44 L50 52 L53 44 Z" fill="#3a3a3a"/>
    <path d="M30 86 Q34 96 42 88 Q46 96 50 88 M50 88 Q54 96 58 88 Q66 96 70 86" fill="#fbfdff" ${line(3.5)}/>`,

  toucan: `
    <path d="M6 90 Q40 84 94 90" stroke="#7a4f2a" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M26 84 L16 98 L34 90 Z" fill="#1d1d1f" ${line(3)}/>
    <path d="M24 86 Q14 56 26 34 Q38 22 52 30 Q60 46 54 66 Q48 82 24 86 Z" fill="#1d1d1f" ${line()}/>
    <path d="M38 40 Q50 38 54 48 Q52 60 42 60 Q34 52 38 40 Z" fill="#ffd23f"/>
    <path d="M38 86 L36 92 M46 84 L48 92" stroke="#3d9be0" stroke-width="4" stroke-linecap="round"/>
    <path d="M50 30 Q70 18 94 34 Q86 46 54 44 Z" fill="#ff9a1f" ${line(3.5)}/>
    <path d="M54 44 Q76 46 92 36 L94 34 Q80 40 54 38" fill="#e63946" ${line(2.5)}/>
    <path d="M86 32 Q92 32 94 34" stroke="${O}" stroke-width="3" fill="none"/>
    <circle cx="46" cy="34" r="6" fill="#7cd0f5" ${line(2.5)}/>${eye(47, 34, 3)}`,
  jackrabbit: hare('#b89870', '#e8d6b6'),
  arctichare: hare('#f4f8fb', '#ffffff', true),
  narwhal: `
    <path d="M10 60 Q2 46 6 38 Q14 48 20 54 Q20 44 28 38 Q28 54 22 64 Z" fill="#8fa3b8" ${line(3.5)}/>
    <path d="M18 60 Q30 36 62 36 Q86 38 88 56 Q86 72 62 74 Q34 76 18 60 Z" fill="#a9bccf" ${line()}/>
    <path d="M30 52 l4 -2 M42 46 l5 -1 M40 60 l5 0 M54 44 l4 1 M56 66 l4 -1" stroke="#6f839a" stroke-width="3" stroke-linecap="round"/>
    <path d="M34 66 Q60 74 82 62 Q76 72 60 74 Q44 74 34 66 Z" fill="#e8eef4"/>
    <path d="M58 70 Q60 82 70 84 Q70 76 66 70 Z" fill="#8fa3b8" ${line(3)}/>
    <path d="M86 50 L100 22" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M86 50 L100 22" stroke="#fffaf0" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M89 44 l3 1 M92 38 l3 1 M95 32 l3 1" stroke="#c9b27a" stroke-width="2"/>${eye(76, 52, 3.2)}<path d="M80 62 Q84 64 86 60" stroke="${O}" stroke-width="2.5" fill="none"/>`,

  // ---------- baby stages ----------
  tadpole: `
    <path d="M44 50 Q70 30 96 54 Q72 48 60 58 Z" fill="#3a3a3a" ${line(3)}/>
    <ellipse cx="34" cy="52" rx="24" ry="18" fill="#3a3a3a" ${line()}/>${eye(24, 46, 4)}`,
  froglet: `
    <path d="M60 64 Q82 56 98 70 Q80 66 66 74 Z" fill="#5fae6a" ${line(3)}/>
    <path d="M14 70 Q12 44 38 40 Q64 40 66 66 Q62 80 40 80 Q18 80 14 70 Z" fill="#7cc46a" ${line()}/>
    <path d="M22 78 L14 90 H26 M54 78 L60 90 H48" fill="#7cc46a" ${line(3.5)}/>
    <circle cx="28" cy="40" r="9" fill="#7cc46a" ${line(3.5)}/><circle cx="50" cy="40" r="9" fill="#7cc46a" ${line(3.5)}/>${eye(28, 40, 4)}${eye(50, 40, 4)}`,
  caterpillar: `
    ${[16, 30, 44, 58, 72].map((x, i) => `<circle cx="${x}" cy="${62 - (i % 2) * 6}" r="11" fill="${i % 2 ? '#8fd16a' : '#5fae4a'}" ${line(3.5)}/>`).join('')}
    <circle cx="84" cy="50" r="13" fill="#5fae4a" ${line()}/>${eye(88, 46, 3.5)}<path d="M80 38 L76 26 M88 38 L92 26" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`,
  chrysalis: `
    <path d="M50 4 V16" stroke="#7a4f2a" stroke-width="5" stroke-linecap="round"/>
    <path d="M50 16 Q74 30 70 60 Q66 86 50 94 Q34 86 30 60 Q26 30 50 16 Z" fill="#7cc46a" ${line()}/>
    <path d="M40 34 Q50 40 60 34 M38 52 Q50 58 62 52 M40 70 Q50 76 60 70" stroke="#4f8a3a" stroke-width="3" fill="none"/>
    <circle cx="50" cy="26" r="3" fill="#ffd23f"/>`,
  chick: `
    <ellipse cx="50" cy="62" rx="30" ry="26" fill="#ffe14d" ${line()}/><circle cx="58" cy="34" r="18" fill="#ffe14d" ${line()}/>
    <path d="M74 34 L88 38 L74 42 Z" fill="#ff9a1f" ${line(3)}/>${eye(64, 30, 3.5)}<path d="M30 58 Q40 50 50 60" stroke="#e8b800" stroke-width="4" fill="none"/>
    <path d="M42 88 L38 96 M58 88 L62 96" stroke="#ff9a1f" stroke-width="4" stroke-linecap="round"/>`,
  pullet: `
    <path d="M14 46 Q8 30 22 28 Q24 40 28 46 Z" fill="#e8d2a6" ${line(3)}/>
    <ellipse cx="46" cy="60" rx="32" ry="24" fill="#f4e4c0" ${line()}/><circle cx="68" cy="34" r="15" fill="#f4e4c0" ${line()}/>
    <path d="M62 20 Q66 14 70 20 Q74 14 76 22" fill="#e63946" ${line(2.5)}/><path d="M82 34 L94 38 L82 42 Z" fill="#ff9a1f" ${line(3)}/>${eye(72, 32, 3.2)}
    <path d="M40 84 L36 96 M54 84 L58 96" stroke="#ff9a1f" stroke-width="4" stroke-linecap="round"/>`,
  cygnet: `
    <path d="M6 72 Q20 96 60 92 Q90 88 92 70 Z" fill="#7fc4e8" opacity=".6"/>
    <path d="M14 70 Q12 46 40 44 Q66 44 72 64 Q70 80 42 80 Q18 80 14 70 Z" fill="#b9bec6" ${line()}/>
    <path d="M62 52 Q66 32 74 28" stroke="${O}" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M62 52 Q66 32 74 28" stroke="#b9bec6" stroke-width="7" stroke-linecap="round" fill="none"/>
    <circle cx="76" cy="26" r="11" fill="#b9bec6" ${line(3.5)}/><path d="M86 26 L96 30 L86 32 Z" fill="#3a3a3a" ${line(2.5)}/>${eye(78, 23, 2.8)}`,
  youngswan: `
    <path d="M4 74 Q20 98 60 94 Q94 90 96 72 Z" fill="#7fc4e8" opacity=".6"/>
    <path d="M10 70 Q6 40 38 38 Q66 38 74 62 Q72 82 40 82 Q14 82 10 70 Z" fill="#e6e8ec" ${line()}/>
    <path d="M64 50 Q70 22 80 18" stroke="${O}" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M64 50 Q70 22 80 18" stroke="#e6e8ec" stroke-width="7" stroke-linecap="round" fill="none"/>
    <circle cx="82" cy="16" r="10" fill="#e6e8ec" ${line(3.5)}/><path d="M91 16 L100 20 L90 22 Z" fill="#e89a5a" ${line(2.5)}/>${eye(84, 13, 2.6)}`,
};

/** A whole SVG document for a drawn picture, for an <img> or the canvas. */
export const drawnSvg = (id: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 108 108">${DRAWN[id] ?? ''}</svg>`;
