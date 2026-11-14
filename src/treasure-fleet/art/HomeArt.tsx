// Home's two drawn tiles. Play is a treasure map: an island in a pale sea, a dotted trail from the little boat to the middle, and a
// red X there with the green ▶ sitting on it, so "X marks the spot" and "tap to play" are the same thing. The Hoard is a treasure
// chest: shut while it's empty, open and shining with his latest treasures once he has dug some up.
const O = '#1d140c';

/** The map behind the Play button. It's cut to the tile's shape (slice), so it always reaches the edges and its middle stays in the middle. */
export function PlayMap() {
  return (
    <svg class="play-map" viewBox="-300 -200 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="-600" y="-400" width="1200" height="800" fill="#b9dcec" />
      <path d="M-600 -120 Q-450 -150 -300 -120 T0 -120 T300 -120 T600 -120 M-600 150 Q-450 120 -300 150 T0 150 T300 150 T600 150" fill="none" stroke="#9cc8de" stroke-width="5" stroke-linecap="round" />
      <path d="M-236 -60 Q-226 -150 -120 -160 Q-30 -186 60 -158 Q190 -166 236 -88 Q276 -6 230 70 Q196 150 70 150 Q-30 172 -130 146 Q-250 130 -252 40 Q-262 -10 -236 -60 Z" fill="#f1dda4" stroke="#a88a4a" stroke-width="8" stroke-linejoin="round" />
      <path d="M-218 -56 Q-208 -134 -118 -142 Q-30 -166 58 -140 Q174 -148 216 -82 Q252 -8 212 62 Q180 132 68 132 Q-28 152 -126 128 Q-232 114 -234 38 Q-242 -6 -218 -56 Z" fill="none" stroke="#e4c98a" stroke-width="5" stroke-dasharray="14 12" />
      <g fill="#3fa34d" stroke={O} stroke-width="5" stroke-linejoin="round">
        <path d="M-196 -40 Q-170 -84 -128 -70 Q-120 -40 -150 -26 Q-176 -14 -196 -40 Z" />
        <path d="M150 -110 Q186 -128 206 -96 Q196 -66 166 -70 Q140 -80 150 -110 Z" />
        <path d="M120 70 Q150 50 182 66 Q178 100 146 104 Q118 100 120 70 Z" />
      </g>
      <path d="M-40 -150 L-14 -110 L-66 -110 Z M-6 -144 L22 -110 L-30 -110 Z" fill="#a39a8c" stroke={O} stroke-width="5" stroke-linejoin="round" />
      <path d="M-204 132 Q-176 116 -150 84 Q-110 34 -66 60 Q-30 82 -10 30" fill="none" stroke="#c81d25" stroke-width="9" stroke-dasharray="2 20" stroke-linecap="round" />
      <g transform="translate(-222 140) rotate(-8)">
        <path d="M-26 -4 L26 -4 L18 12 L-18 12 Z" fill="#9b5f2e" stroke={O} stroke-width="5" stroke-linejoin="round" />
        <path d="M0 -4 V-40" stroke={O} stroke-width="5" />
        <path d="M2 -38 Q22 -26 20 -10 L2 -10 Z" fill="#f4f1e8" stroke={O} stroke-width="4" stroke-linejoin="round" />
      </g>
    </svg>
  );
}

/** The red X the Play button sits on. Sized by CSS to stick out past the button on every side. */
export function SpotX() {
  return (
    <svg class="spot-x" viewBox="-100 -100 200 200" aria-hidden="true">
      <path d="M-70 -70 L70 70 M70 -70 L-70 70" stroke={O} stroke-width="48" stroke-linecap="round" />
      <path d="M-70 -70 L70 70 M70 -70 L-70 70" stroke="#d62828" stroke-width="30" stroke-linecap="round" />
    </svg>
  );
}

/** The Hoard's chest: shut while it's empty, open (with a gold glow inside) once he has found something. */
export function Chest({ open }: { open: boolean }) {
  const ink = { stroke: O, 'stroke-width': 6, 'stroke-linejoin': 'round' as const };
  return (
    <svg class={`chest ${open ? 'open' : ''}`} viewBox="-90 -100 180 160" aria-hidden="true">
      {open
        ? <>
            <path d="M-74 -18 L-66 -86 Q0 -104 66 -86 L74 -18 Z" fill="#7e4a24" {...ink} />
            <path d="M-56 -26 L-50 -74 Q0 -88 50 -74 L56 -26 Z" fill="#3a2010" />
            <ellipse cy="-14" rx="70" ry="16" fill="#ffd23f" {...ink} stroke-width="5" />
            {[[-40, -20], [-12, -26], [18, -22], [44, -18], [-26, -10], [30, -8]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="11" fill="#ffe680" stroke="#b8860b" stroke-width="3" />)}
          </>
        : <path d="M-76 -10 L-76 -44 Q-76 -78 0 -78 Q76 -78 76 -44 L76 -10 Z" fill="#9b5f2e" {...ink} />}
      <path d="M-80 -12 H80 V50 H-80 Z" fill="#9b5f2e" {...ink} />
      <path d="M-80 10 H80" stroke="#7e4a24" stroke-width="5" />
      <path d="M-54 -12 V50 M54 -12 V50" stroke="#c9a227" stroke-width="12" />
      <rect x="-14" y="-18" width="28" height="30" rx="5" fill="#ffd23f" {...ink} stroke-width="4" />
      <circle cy="-6" r="4" fill={O} /><path d="M0 -4 V4" stroke={O} stroke-width="4" stroke-linecap="round" />
    </svg>
  );
}
