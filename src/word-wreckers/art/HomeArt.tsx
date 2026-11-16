// Home's Play tile: a building site seen from the street, the town's grey skyline far off, a wall of letter tiles (c a t, and u p
// above, its top corner already knocked out) standing on the dirt behind a hazard-striped fence, one tile flying off it. The crane's
// boom and the green ▶ wrecking ball hanging from it are drawn in the page (Home.tsx), so the ball stays where the tile puts it.
// The picture is anchored to the tile's bottom right (xMaxYMax slice): whatever shape the tile is, the wall and the fence stay in view
// to the right of the ball, and only sky and dirt are cut off on the left and at the top. Tiles are lowercase and never turned.
const O = '#1d1d1f';
const ink = { stroke: O, 'stroke-width': 5, 'stroke-linejoin': 'round' as const, 'stroke-linecap': 'round' as const };
/** The tiles: [x, y, letter, size]. The wall stands on the dirt at y 290; the last one is flying off its top. */
const TILES: [number, number, string, number][] = [
  [396, 226, 'c', 64], [464, 226, 'a', 64], [532, 226, 't', 64], [464, 158, 'u', 64], [532, 158, 'p', 64],
  [404, 108, 's', 48],
];
/** The skyline behind the site, as in a Job: plain grey blocks far off. */
const SKYLINE: [number, number][] = [[-20, 150], [70, 112], [150, 168], [232, 128], [318, 182], [404, 98], [488, 146], [560, 120]];

export function PlayScene() {
  return (
    <svg class="home-scene-art" viewBox="0 0 600 400" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <defs><linearGradient id="ww-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f4" /><stop offset="1" stop-color="#e3f4fb" /></linearGradient></defs>
      <rect x="-600" y="-400" width="1800" height="1200" fill="url(#ww-sky)" />
      {SKYLINE.map(([x, h]) => <rect key={x} x={x} y={290 - h} width="74" height={h} fill="#c9d3dc" />)}
      <path d="M-600 290 H1200 V800 H-600 Z" fill="#9a8a6a" {...ink} />
      {/* rubble at the foot of the wall, and dust where the ball hit */}
      <path d="M352 290 l10 -14 l14 6 l8 -10 l12 18 Z" fill="#c4553a" {...ink} stroke-width="4" />
      <g fill="#f3ead6" stroke={O} stroke-width="4"><circle cx="410" cy="196" r="15" /><circle cx="432" cy="210" r="11" /><circle cx="404" cy="216" r="9" /></g>
      <g fill="#fff6dc" stroke={O} stroke-width="3.5"><rect x="466" y="128" width="13" height="13" rx="3" /><rect x="380" y="164" width="10" height="10" rx="2" /></g>
      {TILES.map(([x, y, t, s]) => (
        <g key={t} transform={`translate(${x} ${y})`}>
          <rect x="0" y="0" width={s} height={s} rx={s * .16} fill="#fff6dc" {...ink} stroke-width="4.5" />
          <rect x="6" y={s - 12} width={s - 12} height="6" rx="3" fill="#00000014" />
          <text x={s / 2} y={s * .72} font-size={s * .66} text-anchor="middle" font-family="Andika, Nunito, sans-serif" font-weight="700" fill={O}>{t}</text>
        </g>
      ))}
      {/* the fence along the street: hazard stripes */}
      <path d="M-600 330 H1200 V370 H-600 Z" fill="#ffc61a" {...ink} />
      {Array.from({ length: 40 }, (_, i) => <path key={i} d={`M${-600 + i * 46} 370 L${-578 + i * 46} 330 H${-556 + i * 46} L${-578 + i * 46} 370 Z`} fill={O} />)}
      <path d="M-600 330 H1200 V370 H-600 Z" fill="none" {...ink} />
    </svg>
  );
}
