// His food truck from the side, drawn in code: the body in its Paint (with a pattern for the fancy ones), the hatch open under the
// Awning, the Lights along it, the Sign on top with the truck's food, the Mascot on the roof, the Speaker by the cab, and the Wheels.
// Everything he has fitted shows, so the Truck screen, Home and the Sticker Book show off the same truck.
import { partOf, truckOf, type Fitted, type TruckId } from '../truck/parts';

const INK = '#1d1d1f';
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

function pattern(id: string, kind: string, a: string, b: string) {
  if (kind === 'stripes') return <pattern id={id} width="200" height="40" patternUnits="userSpaceOnUse"><rect width="200" height="40" fill={a} /><rect y="14" width="200" height="12" fill={b} /></pattern>;
  if (kind === 'dots') return <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill={a} /><circle cx="11" cy="11" r="5" fill={b} /></pattern>;
  if (kind === 'checks') return <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill={a} /><rect width="12" height="12" fill={b} /><rect x="12" y="12" width="12" height="12" fill={b} /></pattern>;
  if (kind === 'flames') return <pattern id={id} width="60" height="120" patternUnits="userSpaceOnUse"><rect width="60" height="120" fill={a} /><path d="M0 120 Q10 70 20 95 Q28 50 38 90 Q48 60 60 120 Z" fill={b} /><path d="M8 120 Q16 90 24 105 Q30 82 38 108 Q46 92 52 120 Z" fill="#ffd23f" /></pattern>;
  if (kind === 'stars') return <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill={a} /><path d="M20 8 L23 17 L32 17 L25 22 L28 31 L20 26 L12 31 L15 22 L8 17 L17 17 Z" fill={b} /></pattern>;
  if (kind === 'rainbow') return <linearGradient id={id} x1="0" x2="1">{['#e63946', '#ff8a1f', '#ffd23f', '#2fa84f', '#2f6fd6', '#8e5bd8'].map((c, i) => <stop key={i} offset={i / 5} stop-color={c} />)}</linearGradient>;
  return null;
}

export interface TruckLook { truck: TruckId; fit: Fitted }

let uid = 0;
export function TruckPic({ look, class: c = '', bounce = false, label }: { look: TruckLook; class?: string; bounce?: boolean; label?: string }) {
  const id = `ftp${uid++}`, k = truckOf(look.truck), paint = partOf(look.fit.paint), awning = partOf(look.fit.awning), lights = partOf(look.fit.lights);
  const sign = partOf(look.fit.sign), mascot = partOf(look.fit.mascot), wheels = partOf(look.fit.wheels), speaker = partOf(look.fit.speaker), grill = partOf(look.fit.grill);
  const [body, trim, kind] = paint.look as readonly string[];
  const fill = kind ? `url(#${id})` : body!;
  const rim = wheels.look[0]!, monster = wheels.id === 'monster', wr = monster ? 34 : 26, wy = monster ? 214 : 222;
  const stripes = awning.look as readonly string[];
  return (
    <svg class={cls('ft-truck', bounce && 'bounce', c)} viewBox="0 0 400 270" role="img" aria-label={label ?? k.name}>
      <defs>{kind && pattern(id, kind, body!, trim!)}</defs>
      {/* the mascot on the roof */}
      {mascot.look[0] && <text x="300" y="44" font-size="58" text-anchor="middle" class="ft-mascot">{mascot.look[0]}</text>}
      {/* the sign on the roof: the food, framed in the sign's style */}
      <g class="ft-sign">
        <rect x="70" y="18" width="150" height="50" rx="14" fill="#fffbe9" stroke={INK} stroke-width="5" />
        <text x="118" y="56" font-size="34" text-anchor="middle">{k.food}</text>
        <text x="174" y="56" font-size="30" text-anchor="middle">{sign.look[0] === '▭' ? k.food : sign.look[0]}</text>
        <rect x="88" y="66" width="10" height="16" fill={INK} /><rect x="192" y="66" width="10" height="16" fill={INK} />
      </g>
      {/* the body and the cab */}
      <path d="M28 80 H300 Q318 80 322 98 L330 120 H362 Q384 120 388 146 L390 206 Q390 214 382 214 H20 Q12 214 12 206 V96 Q12 80 28 80 Z" fill={fill} stroke={INK} stroke-width="6" stroke-linejoin="round" />
      <path d="M332 128 H358 Q374 128 376 148 V160 H332 Z" fill="#bfe3ff" stroke={INK} stroke-width="5" />
      <rect x="12" y="186" width="378" height="10" fill={trim} opacity=".85" />
      {/* the hatch, open, with the counter and a peek at the grill */}
      <rect x="44" y="104" width="230" height="74" rx="6" fill="#2b2f36" stroke={INK} stroke-width="5" />
      <rect x="54" y="150" width="210" height="10" fill="#c9d1dc" />
      <text x="100" y="146" font-size="28" text-anchor="middle">{k.food}</text>
      {Array.from({ length: grill.power ?? 1 }, (_, i) => <rect key={i} x={150 + i * 36} y="134" width="28" height="14" rx="3" fill="#555c66" stroke="#ff8a1f" stroke-width="3" />)}
      <rect x="40" y="176" width="238" height="12" rx="4" fill="#dfe6ee" stroke={INK} stroke-width="4" />
      {/* the awning over the hatch, scalloped */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = 34 + i * 31.25;
        return <path key={i} d={`M${x} 88 H${x + 31.25} V108 A15.6 12 0 0 1 ${x} 108 Z`} fill={awning.id === 'dots' ? stripes[0] : stripes[i % stripes.length]} stroke={INK} stroke-width="3" />;
      })}
      {awning.id === 'dots' && Array.from({ length: 8 }, (_, i) => <circle key={i} cx={50 + i * 31.25} cy="100" r="5" fill={stripes[1]} />)}
      {/* lights along the awning */}
      {lights.look.length > 0 && Array.from({ length: 9 }, (_, i) => <circle key={i} class="ft-bulb" cx={36 + i * 30} cy="124" r="6" fill={lights.look[i % lights.look.length]} stroke={INK} stroke-width="2" style={{ animationDelay: `${(i % 3) * .3}s` }} />)}
      {/* the speaker by the cab */}
      {speaker.look[0] && <text x="304" y="112" font-size="30" text-anchor="middle">{speaker.look[0]}</text>}
      {/* wheels */}
      {[86, 318].map(x => (
        <g key={x} class="ft-wheel">
          <circle cx={x} cy={wy} r={wr} fill="#1a1a1a" stroke={INK} stroke-width="4" />
          <circle cx={x} cy={wy} r={wr * .48} fill={rim === 'rainbow' ? `url(#${id}r)` : rim} stroke={INK} stroke-width="3" />
          {rim === 'rainbow' && <defs><linearGradient id={`${id}r`}>{['#e63946', '#ffd23f', '#2fa84f', '#2f6fd6'].map((c, i) => <stop key={i} offset={i / 3} stop-color={c} />)}</linearGradient></defs>}
          <circle cx={x} cy={wy} r={wr * .14} fill={INK} />
        </g>
      ))}
    </svg>
  );
}
