// The ten landforms drawn in code, each two ways: from the side (a little picture of the place) and from above (the sign a map uses).
// One landform alone in each picture, nothing else in it that could be one of the others: a hill card has no mountain behind it, a coast
// card has no island off it. SVG, thick dark outlines like the family's art.
import type { LandformId } from '../world/land';

const O = '#14161b', SKY = '#bfe6ff', GRASS = '#6fbf4a', DARK = '#3f8f2a', SEA = '#2f7fd6', SAND = '#f2d38a', ROCK = '#9aa3ad', SNOW = '#ffffff', BROWN = '#a86b3c';
const s = { stroke: O, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const;

function Side({ id }: { id: LandformId }) {
  switch (id) {
    case 'mountain': return <>
      <rect width="120" height="90" fill={SKY} /><rect y="70" width="120" height="20" fill={GRASS} />
      <path d="M14 72 L60 10 L106 72 Z" fill={ROCK} {...s} /><path d="M46 29 L60 10 L74 29 L67 25 L60 31 L53 25 Z" fill={SNOW} {...s} />
    </>;
    case 'hill': return <>
      <rect width="120" height="90" fill={SKY} /><rect y="70" width="120" height="20" fill={GRASS} />
      <path d="M8 72 Q60 30 112 72 Z" fill={GRASS} {...s} /><path d="M40 52 l3 -6 l3 6 M70 50 l3 -6 l3 6" stroke={DARK} stroke-width="2.5" fill="none" />
    </>;
    case 'valley': return <>
      <rect width="120" height="90" fill={SKY} />
      <path d="M0 18 L34 70 L86 70 L120 18 L120 90 L0 90 Z" fill={DARK} {...s} /><path d="M34 70 L86 70 L120 90 L0 90 Z" fill={GRASS} {...s} />
      <path d="M50 78 l3 -6 l3 6 M66 80 l3 -6 l3 6" stroke={DARK} stroke-width="2.5" fill="none" />
    </>;
    case 'river': return <>
      <rect width="120" height="90" fill={SKY} /><rect y="34" width="120" height="56" fill={GRASS} {...s} />
      <path d="M56 34 Q70 46 50 58 T64 90 L92 90 Q76 72 90 58 T66 34 Z" fill={SEA} {...s} />
      <path d="M68 70 q4 -3 8 0" stroke="#fff" stroke-width="2.5" fill="none" />
    </>;
    case 'lake': return <>
      <rect width="120" height="90" fill={SKY} /><rect y="30" width="120" height="60" fill={GRASS} {...s} />
      <ellipse cx="60" cy="62" rx="38" ry="16" fill={SEA} {...s} /><path d="M46 60 q5 -3 10 0 M66 66 q5 -3 10 0" stroke="#fff" stroke-width="2.5" fill="none" />
    </>;
    case 'island': return <>
      <rect width="120" height="90" fill={SKY} /><rect y="46" width="120" height="44" fill={SEA} {...s} />
      <path d="M30 62 Q60 38 90 62 Q60 70 30 62 Z" fill={SAND} {...s} />
      <path d="M60 52 L62 30" stroke={BROWN} stroke-width="4" /><path d="M62 30 q-12 -2 -18 6 M62 30 q12 -2 18 6 M62 30 q-4 -10 -12 -12 M62 30 q6 -10 14 -10" stroke={DARK} stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M14 76 q5 -3 10 0 M92 80 q5 -3 10 0" stroke="#fff" stroke-width="2.5" fill="none" />
    </>;
    case 'desert': return <>
      <rect width="120" height="90" fill="#ffe7a8" /><circle cx="94" cy="20" r="11" fill="#ffd23f" {...s} />
      <path d="M0 62 Q30 44 60 62 T120 58 L120 90 L0 90 Z" fill={SAND} {...s} /><path d="M0 78 Q40 66 80 78 T120 76 L120 90 L0 90 Z" fill="#e9bf6a" {...s} />
    </>;
    case 'plain': return <>
      <rect width="120" height="90" fill={SKY} /><rect y="52" width="120" height="38" fill={GRASS} {...s} />
      <path d="M16 66 l3 -6 l3 6 M44 74 l3 -6 l3 6 M74 64 l3 -6 l3 6 M98 78 l3 -6 l3 6 M30 84 l3 -6 l3 6" stroke={DARK} stroke-width="2.5" fill="none" />
    </>;
    case 'volcano': return <>
      <rect width="120" height="90" fill={SKY} /><rect y="72" width="120" height="18" fill={GRASS} />
      <path d="M48 18 q-6 -10 4 -14 q8 -6 14 2 q10 -2 8 8" fill="#c9cdd2" {...s} />
      <path d="M14 74 L48 22 L72 22 L106 74 Z" fill={BROWN} {...s} /><path d="M48 22 L72 22 L66 36 L60 30 L54 40 Z" fill="#ff5a1f" {...s} />
    </>;
    case 'coast': return <>
      <rect width="120" height="90" fill={SKY} /><rect y="40" width="120" height="50" fill={SEA} {...s} />
      <path d="M0 40 L56 40 Q62 58 52 70 Q46 80 58 90 L0 90 Z" fill={GRASS} {...s} /><path d="M56 40 Q62 58 52 70 Q46 80 58 90 L66 90 Q54 80 60 70 Q70 58 64 40 Z" fill={SAND} {...s} />
      <path d="M84 60 q5 -3 10 0 M96 76 q5 -3 10 0" stroke="#fff" stroke-width="2.5" fill="none" />
    </>;
  }
}

function Above({ id }: { id: LandformId }) {
  const land = <rect width="120" height="90" fill="#f3e6c4" />;
  switch (id) {
    case 'mountain': return <>{land}<path d="M22 66 L42 30 L62 66 Z M58 66 L78 24 L98 66 Z" fill={BROWN} {...s} /></>;
    case 'hill': return <>{land}<path d="M18 64 Q34 36 50 64 Z M54 64 Q70 40 86 64 Z M70 76 Q84 56 98 76 Z" fill={GRASS} {...s} /></>;
    case 'valley': return <>{land}<path d="M10 20 L40 45 L10 70 M110 20 L80 45 L110 70" stroke={BROWN} stroke-width="6" fill="none" /></>;
    case 'river': return <>{land}<path d="M-4 30 Q24 14 40 40 T80 52 T124 40" stroke={SEA} stroke-width="9" fill="none" /><path d="M-4 30 Q24 14 40 40 T80 52 T124 40" stroke={O} stroke-width="2" fill="none" opacity=".5" /></>;
    case 'lake': return <><rect width="120" height="90" fill="#bfe3a0" /><path d="M30 46 Q30 20 60 24 Q92 22 90 48 Q90 72 58 68 Q30 70 30 46 Z" fill={SEA} {...s} /></>;
    case 'island': return <><rect width="120" height="90" fill={SEA} /><path d="M36 46 Q38 26 62 28 Q88 30 84 50 Q80 68 58 64 Q34 64 36 46 Z" fill="#bfe3a0" {...s} /></>;
    case 'desert': return <><rect width="120" height="90" fill={SAND} />{Array.from({ length: 24 }, (_, i) => <circle key={i} cx={10 + (i % 6) * 20 + (Math.floor(i / 6) % 2) * 10} cy={12 + Math.floor(i / 6) * 22} r="2.5" fill="#b8862f" />)}</>;
    case 'plain': return <><rect width="120" height="90" fill="#bfe3a0" />{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${12 + (i % 4) * 28} ${18 + Math.floor(i / 4) * 26} l4 -7 l4 7`} stroke={DARK} stroke-width="2.5" fill="none" />)}</>;
    case 'volcano': return <>{land}<path d="M30 70 L56 26 L64 26 L90 70 Z" fill={BROWN} {...s} /><path d="M54 30 L66 30 L60 40 Z" fill="#ff5a1f" {...s} /><path d="M60 22 q-6 -8 2 -14 q8 -4 10 4" fill="#c9cdd2" {...s} /></>;
    case 'coast': return <><rect width="120" height="90" fill={SEA} /><path d="M0 0 L58 0 Q48 22 60 44 Q70 66 54 90 L0 90 Z" fill="#bfe3a0" {...s} /></>;
  }
}

/** A landform card's picture. */
export function LandformArt({ id, style, class: k = '' }: { id: LandformId; style: 'side' | 'above'; class?: string }) {
  return (
    <svg class={`gh-landform ${k}`} viewBox="0 0 120 90" aria-hidden="true">
      <clipPath id={`lf-${id}-${style}`}><rect width="120" height="90" rx="10" /></clipPath>
      <g clip-path={`url(#lf-${id}-${style})`}>{style === 'side' ? <Side id={id} /> : <Above id={id} />}</g>
      <rect width="120" height="90" rx="10" fill="none" stroke={O} stroke-width="4" />
    </svg>
  );
}

/** Hot and Cold Level 2: a snowy, icy place or a hot, steamy rainforest. */
export function SceneArt({ scene }: { scene: 'snow' | 'steam' }) {
  return (
    <svg class="gh-scene" viewBox="0 0 160 100" aria-hidden="true">
      {scene === 'snow' ? <>
        <rect width="160" height="100" fill="#dbeeff" /><path d="M0 70 Q40 56 80 66 T160 62 L160 100 L0 100 Z" fill="#ffffff" {...s} />
        <path d="M20 72 L42 34 L64 72 Z M96 68 L122 26 L148 68 Z" fill="#eef6ff" {...s} />
        {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={(i * 37) % 160} cy={(i * 23) % 60 + 6} r="2.5" fill="#fff" stroke="#9fc4e8" />)}
      </> : <>
        <rect width="160" height="100" fill="#cdeec0" /><circle cx="134" cy="16" r="12" fill="#ffd23f" {...s} />
        {[18, 52, 88, 122].map((x, i) => <g key={i}><path d={`M${x} 100 L${x + 3} 46`} stroke={BROWN} stroke-width="6" /><circle cx={x + 3} cy={44 - (i % 2) * 6} r="20" fill={i % 2 ? DARK : GRASS} {...s} /></g>)}
        <path d="M0 86 Q40 78 80 86 T160 84 L160 100 L0 100 Z" fill={DARK} {...s} />
        {[30, 70, 110].map((x, i) => <path key={i} d={`M${x} 70 q-6 -8 0 -16 q6 -8 0 -16`} stroke="#fff" stroke-width="3" fill="none" opacity=".8" />)}
      </>}
      <rect width="160" height="100" fill="none" stroke={O} stroke-width="4" rx="10" />
    </svg>
  );
}
