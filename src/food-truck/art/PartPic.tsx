// A part on its own, drawn big for its tile in the Truck shop, so he sees what he's buying at tile size: the grill plates (one, two or
// three), the awning's stripes, the speaker, the string of lights, the sign with its picture, the mascot, a wheel with its rim, a
// Helper. Trucks and Paint show the whole truck instead (TruckPic), because the truck is the thing.
import { partOf, type PartKey } from '../truck/parts';

const INK = '#1d1d1f';

export function PartPic({ k }: { k: PartKey }) {
  const p = partOf(k), look = p.look as readonly string[];
  switch (p.slot) {
    case 'grill': {
      const n = p.power ?? 1, w = 26, gap = 6, x0 = 50 - (n * w + (n - 1) * gap) / 2;
      return (
        <svg class="part-pic" viewBox="0 0 100 64" aria-hidden="true">
          <rect x="8" y="36" width="84" height="18" rx="5" fill="#9aa3ad" stroke={INK} stroke-width="3" />
          {Array.from({ length: n }, (_, i) => (
            <g key={i} transform={`translate(${x0 + i * (w + gap)} 0)`}>
              <path d={`M${w * .2} 30 Q${w * .1} 18 ${w * .35} 12 Q${w * .4} 22 ${w * .5} 16 Q${w * .6} 6 ${w * .75} 14 Q${w * .95} 22 ${w * .8} 30 Z`} fill="#ff8a1f" stroke={INK} stroke-width="2" />
              <rect x="0" y="28" width={w} height="14" rx="3" fill="#3b424c" stroke={INK} stroke-width="3" />
              {[.25, .5, .75].map(f => <path key={f} d={`M${w * f} 31 V39`} stroke="#ff8a1f" stroke-width="2.5" stroke-linecap="round" />)}
            </g>
          ))}
        </svg>
      );
    }
    case 'awning': {
      const cols = look, dots = p.id === 'dots';
      return (
        <svg class="part-pic" viewBox="0 0 100 64" aria-hidden="true">
          <path d="M8 14 H92" stroke={INK} stroke-width="4" stroke-linecap="round" />
          {Array.from({ length: 4 }, (_, i) => {
            const x = 10 + i * 20;
            return <path key={i} d={`M${x} 14 H${x + 20} V40 A10 9 0 0 1 ${x} 40 Z`} fill={dots ? cols[0] : cols[i % cols.length]} stroke={INK} stroke-width="3" stroke-linejoin="round" />;
          })}
          {dots && [20, 40, 60, 80].map(x => <circle key={x} cx={x} cy="28" r="4" fill={cols[1]} />)}
        </svg>
      );
    }
    case 'lights': {
      const bulbs = [14, 32, 50, 68, 86], y = (x: number) => 18 + 12 * Math.sin(Math.PI * (x - 4) / 92);
      return (
        <svg class="part-pic" viewBox="0 0 100 64" aria-hidden="true">
          <path d="M4 18 Q50 42 96 18" fill="none" stroke={INK} stroke-width="3" />
          {bulbs.map((x, i) => {
            const c = look.length ? look[i % look.length]! : '#c9d1dc';
            return <g key={x}>{look.length > 0 && <circle cx={x} cy={y(x) + 12} r="11" fill={c} opacity=".35" />}<circle cx={x} cy={y(x) + 12} r="7" fill={c} stroke={INK} stroke-width="2.5" /></g>;
          })}
        </svg>
      );
    }
    case 'wheels': {
      const rim = look[0]!, big = p.id === 'monster', r = big ? 28 : 24;
      return (
        <svg class="part-pic" viewBox="0 0 100 64" aria-hidden="true">
          {rim === 'rainbow' && <defs><linearGradient id="ft-rim-rainbow">{['#e63946', '#ffd23f', '#2fa84f', '#2f6fd6'].map((c, i) => <stop key={i} offset={i / 3} stop-color={c} />)}</linearGradient></defs>}
          {big && Array.from({ length: 12 }, (_, i) => <rect key={i} x="47" y="1" width="6" height="8" fill={INK} transform={`rotate(${i * 30} 50 32)`} />)}
          <circle cx="50" cy="32" r={r} fill="#1a1a1a" stroke={INK} stroke-width="3" />
          {p.id === 'white' && <circle cx="50" cy="32" r={r * .72} fill="none" stroke="#f4f6fa" stroke-width="4" />}
          <circle cx="50" cy="32" r={r * .48} fill={rim === 'rainbow' ? 'url(#ft-rim-rainbow)' : rim} stroke={INK} stroke-width="3" />
          {p.id === 'glow' && <circle cx="50" cy="32" r={r + 4} fill="none" stroke="#00e5ff" stroke-width="3" opacity=".6" />}
          <circle cx="50" cy="32" r={r * .14} fill={INK} />
        </svg>
      );
    }
    case 'sign':
      return (
        <svg class="part-pic" viewBox="0 0 100 64" aria-hidden="true">
          <path d="M34 50 V60 M66 50 V60" stroke={INK} stroke-width="5" />
          <rect x="18" y="6" width="64" height="46" rx="12" fill="#fffbe9" stroke={INK} stroke-width="4" />
          {look[0] !== '▭' && <text x="50" y="40" font-size="30" text-anchor="middle">{look[0]}</text>}
        </svg>
      );
    default: {
      // a speaker, a mascot or a Helper: its picture, big; the free "none" is an empty dashed spot
      const e = look[0];
      return e
        ? <span class="part-pic emoji" aria-hidden="true">{e}</span>
        : <svg class="part-pic" viewBox="0 0 100 64" aria-hidden="true"><circle cx="50" cy="32" r="22" fill="none" stroke="#1d1d1f66" stroke-width="3" stroke-dasharray="6 5" /></svg>;
    }
  }
}
