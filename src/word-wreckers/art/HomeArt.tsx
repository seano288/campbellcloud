// Home's Play tile: a building site seen from the street. A crane swings its wrecking ball into a wall of letter tiles, a few tiles
// tumbling, behind a hazard-striped fence; the green ▶ sits where the ball hits. Cut to its tile (slice), so it reaches every edge.
const O = '#1d1d1f';
const ink = { stroke: O, 'stroke-width': 5, 'stroke-linejoin': 'round' as const, 'stroke-linecap': 'round' as const };
const TILES = ['c', 'a', 't', 's', 'h', 'i', 'p', 'b', 'u', 'g', 'd', 'o', 'f', 'r', 'e', 'm'];

export function PlayScene() {
  return (
    <svg class="home-scene-art" viewBox="-300 -200 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="ww-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f4" /><stop offset="1" stop-color="#e3f4fb" /></linearGradient></defs>
      <rect x="-600" y="-400" width="1200" height="800" fill="url(#ww-sky)" />
      <path d="M-600 40 H600 V400 H-600 Z" fill="#9a8a6a" {...ink} />
      {/* the crane, left */}
      <path d="M-250 40 V-150 M-250 -150 L60 -170" stroke={O} stroke-width="16" stroke-linecap="round" />
      <path d="M-250 40 V-150 M-250 -150 L60 -170" stroke="#ffc61a" stroke-width="8" stroke-linecap="round" />
      <path d="M60 -170 L12 -14" stroke={O} stroke-width="5" stroke-dasharray="10 5" />
      {/* the wall of letter tiles, right, a few flying off */}
      {TILES.map((t, i) => {
        const col = i % 4, row = Math.floor(i / 4), x = 60 + col * 52, y = -170 + 52 * 4 - row * 52 + 4;
        const flying = i === 4 || i === 8 || i === 9;
        const dx = flying ? 30 + i * 6 : 0, dy = flying ? -60 - i * 4 : 0, rot = 0;
        return (
          <g key={i} transform={`translate(${x + dx} ${y + dy}) rotate(${rot})`}>
            <rect x="0" y="0" width="48" height="48" rx="8" fill="#fff6dc" {...ink} stroke-width="4" />
            <text x="24" y="35" font-size="32" text-anchor="middle" font-family="Andika, Nunito, sans-serif" font-weight="700" fill={O}>{t}</text>
          </g>
        );
      })}
      {/* the fence, hazard stripes */}
      <path d="M-600 96 H600 V140 H-600 Z" fill="#ffc61a" {...ink} />
      {Array.from({ length: 30 }, (_, i) => <path key={i} d={`M${-600 + i * 44} 140 L${-578 + i * 44} 96 H${-556 + i * 44} L${-578 + i * 44} 140 Z`} fill={O} />)}
    </svg>
  );
}
