// TORQUE in the Workshop, side on and flat, wearing what he has fitted. Drawn from the same Look as the 3D robot in the fight, so what
// he buys here is what he sees there. The 3D robot itself stays in the fight's chunk: this screen must not pay for three.js.
import { lookOf, type Gear } from './catalog';

const O = 'stroke="#10151f" stroke-width="7" stroke-linejoin="round"';
const WHEELS = [150, 372];

export function TorqueArt({ gear, class: cls = '' }: { gear: Gear; class?: string }) {
  const look = lookOf(gear), { armour } = look;
  const flames = [0, 1, 2, 3, 4].map(i => {
    const x = 330 - i * 42, l = i % 2 ? 76 : 52;
    return `<path d="M${x} ${138 + (330 - x) * .06} q-${l * .6} -6 -${l} 16 q${l * .4} -2 ${l} 18 z" fill="#ff5a10"/><path d="M${x} ${144 + (330 - x) * .06} q-${l * .4} -3 -${l * .7} 10 q${l * .3} 0 ${l * .7} 12 z" fill="#ffc21a"/>`;
  }).join('');
  const spikes = [70, 118, 166, 214, 262, 310].map(x => `<path d="M${x - 14} ${178} L${x} ${146} L${x + 14} ${178} Z" fill="#cfd3d6" ${O}/>`).join('');
  const glow = look.hub.kind === 'glow' ? ` style="filter:drop-shadow(0 0 10px ${look.hub.hex})"` : '';
  const drumGlow = look.drum.glow ? ` style="filter:drop-shadow(0 0 12px ${look.drum.hex})"` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 300">
    <path d="M26 288 H534" stroke="#0007" stroke-width="10" stroke-linecap="round"/>
    <path d="M36 196 L40 120 L150 96 L350 132 L446 196 L470 236 H36 Z" fill="${look.paint.hex}" ${O}/>
    <path d="M60 150 L150 124 L330 156 L330 170 L60 170 Z" fill="#fff2"/>
    ${armour === 1 ? '<path d="M44 136 L350 150 L370 164 L44 150 Z M44 158 L392 174 L402 184 L44 172 Z" fill="#f4f1e6"/>' : ''}
    ${armour >= 2 ? flames : ''}
    ${armour === 3 ? spikes : ''}
    <path d="M36 196 H470 L470 236 H36 Z" fill="#00000030"/>
    <g fill="#e8e4d8" font-family="Arial Black,Arial,sans-serif" font-weight="900"><text x="205" y="226" font-size="22">TORQUE</text></g>
    <path d="M420 200 L500 150 L548 164 L500 232 L430 236 Z" fill="#ff6508" ${O}/>
    <g${drumGlow}><circle cx="462" cy="180" r="56" fill="${look.drum.hex}" ${O}/><circle cx="462" cy="180" r="30" fill="#0003"/>
    ${[0, 60, 120, 180, 240, 300].map(a => `<path d="M462 112 l13 16 h-26 z" transform="rotate(${a} 462 180)" fill="#d9dcdf" ${O}/>`).join('')}
    <circle cx="462" cy="180" r="10" fill="#10151f"/></g>
    ${WHEELS.map(x => `<circle cx="${x}" cy="238" r="50" fill="#16181b" ${O}/><circle cx="${x}" cy="238" r="24" fill="${look.hub.hex}" stroke="#10151f" stroke-width="5"${glow}/><circle cx="${x}" cy="238" r="6" fill="#10151f"/>`).join('')}
  </svg>`;
  return <span class={`bot-art ${cls}`} role="img" aria-label="Torque" dangerouslySetInnerHTML={{ __html: svg }} />;
}
