// Each Squad drawn flat in 2D, for the Squad cards, Home and the end of a Round: a green plastic army man (or his dog, jeep,
// cannon or tank) standing on his little base, all one colour of plastic with the family's thick black outline.
import type { ComponentChildren } from 'preact';
import type { UnitId } from './catalog';

const O = { stroke: '#000', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const;

/** The plain soldier every figure starts from: base, legs, body, head and helmet. `arms` draws what his arms hold. */
function Soldier({ c, arms, lean = 0 }: { c: string; arms: ComponentChildren; lean?: number }) {
  return (
    <g>
      <ellipse cx="50" cy="93" rx="24" ry="5" fill={c} {...O} />
      <g transform={`rotate(${lean} 50 90)`}>
        <path d="M42 62 L39 90 H47 L50 70 L53 90 H61 L58 62 Z" fill={c} {...O} />
        <path d="M38 36 Q50 31 62 36 L60 64 H40 Z" fill={c} {...O} />
        <circle cx="50" cy="25" r="9" fill={c} {...O} />
        <path d="M38 24 Q38 10 50 10 Q62 10 62 24 Q50 21 38 24 Z" fill={c} {...O} />
        {arms}
      </g>
    </g>
  );
}

function Figure({ unit, c }: { unit: UnitId; c: string }) {
  switch (unit) {
    case 'rifleman': return <Soldier c={c} arms={<>
      <path d="M30 41 L86 33" stroke="#000" stroke-width="9" stroke-linecap="round" /><path d="M30 41 L86 33" stroke={c} stroke-width="4" stroke-linecap="round" />
      <path d="M40 40 L58 37 L66 36" fill="none" stroke="#000" stroke-width="9" stroke-linecap="round" /><path d="M40 40 L58 37 L66 36" fill="none" stroke={c} stroke-width="4" stroke-linecap="round" />
    </>} />;
    case 'scout': return <Soldier c={c} arms={<>
      <path d="M40 40 L44 28 M60 40 L56 28" stroke="#000" stroke-width="9" stroke-linecap="round" /><path d="M40 40 L44 28 M60 40 L56 28" stroke={c} stroke-width="4" stroke-linecap="round" />
      <rect x="41" y="20" width="8" height="9" rx="2" fill={c} {...O} /><rect x="51" y="20" width="8" height="9" rx="2" fill={c} {...O} />
    </>} />;
    case 'drummer': return <Soldier c={c} arms={<>
      <rect x="36" y="44" width="28" height="18" rx="4" fill={c} {...O} /><path d="M38 50 L50 58 L62 50" fill="none" stroke="#000" stroke-width="2" />
      <path d="M40 40 L33 30 M60 40 L68 30" stroke="#000" stroke-width="5" stroke-linecap="round" />
    </>} />;
    case 'medic': return <Soldier c={c} arms={<>
      <rect x="54" y="46" width="20" height="16" rx="3" fill={c} {...O} /><path d="M64 49 V59 M59 54 H69" stroke="#fff" stroke-width="3.5" />
      <path d="M42 40 L36 56 M60 40 L62 48" stroke="#000" stroke-width="8" stroke-linecap="round" /><path d="M42 40 L36 56 M60 40 L62 48" stroke={c} stroke-width="3.5" stroke-linecap="round" />
    </>} />;
    case 'rocket': return <Soldier c={c} arms={<>
      <rect x="24" y="24" width="56" height="10" rx="5" transform="rotate(-8 52 29)" fill={c} {...O} />
      <circle cx="80" cy="25" r="5" fill={c} {...O} />
    </>} />;
    case 'para': return (
      <g>
        <path d="M14 34 Q50 -6 86 34 Q74 28 62 34 Q50 28 38 34 Q26 28 14 34 Z" fill={c} {...O} />
        <path d="M16 34 L42 60 M38 34 L45 58 M62 34 L55 58 M84 34 L58 60" stroke="#000" stroke-width="1.5" />
        <g transform="translate(25 40) scale(.5)"><Soldier c={c} arms={<path d="M40 40 L44 28 M60 40 L56 28" stroke="#000" stroke-width="6" stroke-linecap="round" />} /></g>
      </g>
    );
    case 'dog': return (
      <g>
        <ellipse cx="50" cy="93" rx="30" ry="5" fill={c} {...O} />
        <path d="M24 60 Q22 46 34 46 H64 Q72 46 72 56 V62 L70 88 H63 L61 66 H38 L36 88 H29 L27 64 Z" fill={c} {...O} />
        <path d="M64 50 L70 30 Q74 24 82 28 L88 36 Q90 42 84 44 L76 46 Z" fill={c} {...O} />
        <path d="M71 31 L66 20 L76 26" fill={c} {...O} /><circle cx="80" cy="34" r="1.8" fill="#000" />
        <path d="M24 56 Q14 50 16 40" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round" /><path d="M24 56 Q14 50 16 40" fill="none" stroke={c} stroke-width="3" stroke-linecap="round" />
      </g>
    );
    case 'jeep': return (
      <g>
        <path d="M8 66 L12 50 H34 L42 34 H58 L62 50 H90 L92 66 Z" fill={c} {...O} />
        <path d="M44 38 L40 50" stroke="#000" stroke-width="3" />
        <circle cx="28" cy="70" r="12" fill={c} {...O} /><circle cx="28" cy="70" r="4" fill="#000" />
        <circle cx="74" cy="70" r="12" fill={c} {...O} /><circle cx="74" cy="70" r="4" fill="#000" />
        <rect x="80" y="40" width="10" height="12" rx="2" fill={c} {...O} />
      </g>
    );
    case 'cannon': return (
      <g>
        <path d="M22 66 L52 44 L60 52 L36 74 Z" fill={c} {...O} />
        <rect x="40" y="26" width="52" height="16" rx="8" transform="rotate(-22 50 46)" fill={c} {...O} />
        <circle cx="46" cy="66" r="18" fill={c} {...O} />
        <path d="M46 48 V84 M28 66 H64 M34 54 L58 78 M58 54 L34 78" stroke="#000" stroke-width="2" /><circle cx="46" cy="66" r="4" fill="#000" />
      </g>
    );
    case 'tank': return (
      <g>
        <path d="M6 64 Q6 82 22 82 H80 Q94 82 94 64 Z" fill={c} {...O} />
        {[22, 38, 54, 70, 84].map(x => <circle key={x} cx={x} cy="72" r="6" fill={c} stroke="#000" stroke-width="2" />)}
        <path d="M12 64 L18 50 H84 L90 64 Z" fill={c} {...O} />
        <path d="M32 50 Q34 34 52 34 Q68 34 70 50 Z" fill={c} {...O} />
        <rect x="64" y="37" width="34" height="7" rx="3" fill={c} {...O} />
      </g>
    );
  }
}

export function UnitArt({ unit, color, class: cls = '' }: { unit: UnitId; color: string; class?: string }) {
  return <svg class={`unit-art ${cls}`} viewBox="0 0 100 100" aria-hidden="true"><Figure unit={unit} c={color} /></svg>;
}

/** A few riflemen marching in a row, for the end of a Round. */
export function Squad({ colour, count }: { colour: string; count: number }) {
  return <div class="squad-row">{Array.from({ length: count }, (_, i) => <UnitArt key={i} unit="rifleman" color={colour} class="marching" />)}</div>;
}
