// A Body's side profile with two wheels, flat, for the first-launch picker, the Body switcher and the Goal bar.
import { colourById, type BodyId, type Fit } from './catalog';
import { BODIES, parsePath } from './three/bodies';

export const truckColor = (fit: Fit) => fit.paint === 0 ? colourById(fit.colour).hex : ['', '#1e7bff', '#ff6a00', '#c04dff', '#d4a017'][fit.paint]!;

export function BodyArt({ body, color = '#e63946' }: { body: BodyId; color?: string }) {
  const B = BODIES[body], d = parsePath(B.path).map(p => 'M' + p.map(q => q.join(',')).join(' L') + ' Z').join(' ');
  return (
    <svg viewBox="10 -130 360 190" class="body-art" aria-hidden="true">
      <path d={d} fill={color} stroke="#000" stroke-width="5" stroke-linejoin="round" transform="translate(0,6)" />
      <path d={B.win} fill="#bfe3ff" stroke="#000" stroke-width="3" transform="translate(0,6)" />
      {B.wheels.map(x => <g key={x}><circle cx={x} cy="18" r="40" fill="#1a1a1a" /><circle cx={x} cy="18" r="16" fill="#bbb" /></g>)}
    </svg>
  );
}
