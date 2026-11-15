// Home's drawn tiles. Play is a view out over the wild: grassland with an acacia, a pond and a pine forest, with animals in each, and
// the green ▶ is the big pad of a paw print, so "follow the tracks" and "tap to play" are the same thing. The Garage tile is the
// ranger station's open roll-up door with his truck parked in front; the Park tile is a meadow behind a wooden fence, with his
// animals standing in it. All three are cut to their tile (slice), so they reach every edge and keep their middle in the middle.
const O = '#1d1d1f';
const ink = { stroke: O, 'stroke-width': 5, 'stroke-linejoin': 'round' as const, 'stroke-linecap': 'round' as const };
/** An emoji animal standing in the scene, its feet at (x, y). */
const Critter = ({ e, x, y, s = 54 }: { e: string; x: number; y: number; s?: number }) =>
  <text x={x} y={y} font-size={s} text-anchor="middle" class="emo-svg">{e}</text>;

export function PlayScene() {
  return (
    <svg class="home-scene-art" viewBox="-300 -200 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="wr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f4" /><stop offset="1" stop-color="#e3f4fb" /></linearGradient>
      </defs>
      <rect x="-600" y="-400" width="1200" height="800" fill="url(#wr-sky)" />
      <circle cx="196" cy="-112" r="30" fill="#ffd23f" {...ink} />
      <path d="M-600 -10 Q-420 -90 -250 -40 Q-120 -110 20 -46 Q150 -104 290 -40 Q430 -90 600 -20 V400 H-600 Z" fill="#a9d68a" />
      {/* the grassland, left: tall grass and an acacia */}
      <path d="M-600 10 Q-380 -10 -120 20 Q60 40 600 10 V400 H-600 Z" fill="#d9c35e" {...ink} />
      <path d="M-176 24 V-60" stroke={O} stroke-width="17" stroke-linecap="round" />
      <path d="M-176 24 V-60 M-176 -24 L-204 -54 M-176 -36 L-150 -62" stroke="#7a4f2a" stroke-width="9" stroke-linecap="round" />
      <path d="M-246 -66 Q-226 -100 -176 -96 Q-126 -102 -106 -68 Q-126 -52 -176 -56 Q-226 -52 -246 -66 Z" fill="#6f9a3a" {...ink} />
      <Critter e="🦒" x={-206} y={34} s={76} />
      {/* the pond, middle: water and reeds, under the paw */}
      <path d="M-600 56 Q-300 40 0 60 Q300 80 600 52 V400 H-600 Z" fill="#8cc152" {...ink} />
      <ellipse cx="10" cy="112" rx="140" ry="28" fill="#5aa9d6" {...ink} />
      <path d="M-56 108 Q-26 100 4 108 M40 120 Q70 112 98 120" fill="none" stroke="#bfe6f5" stroke-width="5" stroke-linecap="round" />
      <path d="M-140 112 V70 M-126 114 V58 M146 112 V66 M160 114 V80" stroke="#4f7a2a" stroke-width="6" stroke-linecap="round" />
      <g fill="#7a4f2a" {...ink} stroke-width="3"><ellipse cx="-126" cy="56" rx="7" ry="15" /><ellipse cx="146" cy="64" rx="7" ry="15" /></g>
      <Critter e="🐸" x={-82} y={134} s={46} />
      {/* the forest, right: pines and a deer */}
      {([[168, 30], [214, 20], [262, 34], [310, 24]] as const).map(([x, y]) => (
        <g key={x}>
          <path d={`M${x - 5} ${y} V${y + 22}`} stroke="#7a4f2a" stroke-width="12" />
          <path d={`M${x} ${y - 110} L${x - 40} ${y} H${x + 40} Z`} fill="#2f6a2a" {...ink} />
        </g>
      ))}
      <Critter e="🦌" x={206} y={84} s={64} />
      <Critter e="🐇" x={112} y={140} s={40} />
    </svg>
  );
}

/** The four toe pads above the ▶: the button is the paw's big pad. */
export function PawToes() {
  return (
    <svg class="paw-toes" viewBox="-130 -130 260 260" aria-hidden="true">
      {[[-96, -18, -28], [-40, -80, -10], [40, -80, 10], [96, -18, 28]].map(([x, y, r]) => (
        <ellipse key={x} cx={x} cy={y} rx="27" ry="34" transform={`rotate(${r} ${x} ${y})`} fill="#6b4423" stroke={O} stroke-width="5" />
      ))}
    </svg>
  );
}

/** The ranger station's garage: a green wall, the roll-up door open on a dark bay, a concrete floor with a stop line. */
export function GarageScene() {
  return (
    <svg class="home-scene-art" viewBox="-200 -120 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect x="-500" y="-300" width="1000" height="600" fill="#4f8a3a" />
      <path d="M-500 -96 H500" stroke="#3f7a32" stroke-width="10" />
      <path d="M-500 -60 H500 M-500 -24 H500 M-500 12 H500" stroke="#46803a" stroke-width="4" />
      <rect x="-150" y="-86" width="300" height="160" fill="#26302a" {...ink} />
      <path d="M-130 -60 H130 M-130 -34 H130 M-130 -8 H130" stroke="#323d35" stroke-width="5" />
      <rect x="-162" y="-104" width="324" height="30" rx="14" fill="#c9cfd4" {...ink} />
      <path d="M-150 -89 H150" stroke="#9aa3ad" stroke-width="4" />
      <rect x="-500" y="64" width="1000" height="300" fill="#bdb5a1" />
      <path d="M-500 64 H500" stroke={O} stroke-width="5" />
    </svg>
  );
}

/** The Park: a meadow and trees behind a wooden fence, with grass in front for his animals to stand on. */
export function ParkScene() {
  return (
    <svg class="home-scene-art" viewBox="-200 -120 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect x="-500" y="-300" width="1000" height="600" fill="#a5dcf3" />
      <path d="M-500 0 Q-300 -60 -120 -24 Q40 -70 200 -20 Q360 -60 500 -10 V300 H-500 Z" fill="#7cbf5a" />
      {[[-150, -10, 40], [-96, -20, 32], [126, -16, 38], [176, -6, 30]].map(([x, y, r]) => (
        <g key={x}><path d={`M${x} ${y} V${y! + 30}`} stroke="#7a4f2a" stroke-width="10" /><circle cx={x} cy={y! - r! * .4} r={r} fill="#3f8a32" {...ink} /></g>
      ))}
      <path d="M-500 40 Q0 20 500 40 V300 H-500 Z" fill="#8cc152" {...ink} />
      <g fill="#c98a4a" {...ink} stroke-width="4">
        <rect x="-500" y="20" width="1000" height="11" />
        <rect x="-500" y="42" width="1000" height="11" />
        {[-260, -190, -120, -50, 20, 90, 160, 230].map(x => <path key={x} d={`M${x - 8} 66 V14 L${x} 4 L${x + 8} 14 V66 Z`} />)}
      </g>
    </svg>
  );
}
