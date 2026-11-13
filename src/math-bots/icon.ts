// The Home Screen icon: TORQUE as he starts out, seen from above the way every screen in the game draws him (bot/draw.ts): the blue
// Scrap Box on small wheels, happy eyes, with a Giant Saw on the front so it says robot combat. Nose up and to the right, sparks off the
// saw, on an orange sunburst like the sibling icons. Same numbers as draw.ts in the robot's own units, then scaled up. One 512×512 SVG
// made in code; tools/icons.ts rasterises it at build time.
const BG = '#ff8a1f';
const O = '#10151f';

const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 520;
  return `<path d="M256 256 L${(256 + r * Math.cos(a0)).toFixed(1)} ${(256 + r * Math.sin(a0)).toFixed(1)} L${(256 + r * Math.cos(a1)).toFixed(1)} ${(256 + r * Math.sin(a1)).toFixed(1)} Z" fill="#ffa94d"/>`;
}).join('');

const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const f = (n: number) => n.toFixed(2);

/** The saw's teeth, as draw.ts cuts them: n teeth sticking out depth past radius r. */
function teeth(r: number, n: number, depth: number, turn: number) {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * Math.PI * 2, b = turn + ((i + .55) / n) * Math.PI * 2;
    pts.push(`${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`, `${f(Math.cos(a + .02) * (r + depth))} ${f(Math.sin(a + .02) * (r + depth))}`, `${f(Math.cos(b) * r)} ${f(Math.sin(b) * r)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/** TORQUE in robot units: middle at 0,0, front along +x. */
function torque() {
  const r = 44, h = r * .84, side = r * .9;
  const tyre = (x: number, y: number) => `<rect x="${f(x - 17)}" y="${f(y - 8)}" width="34" height="16" rx="6" fill="#16181b" ${line(4)}/>
    <rect x="${f(x - 5.4)}" y="${f(y - 3.5)}" width="10.9" height="7" rx="3" fill="#ff6508"/>`;
  const wheels = [-1, 1].flatMap(s => [-.56, .56].map(x => tyre(x * r, s * side))).join('');
  const sawAt = r * .96, reach = 48, sr = 22 * 1.45, cx = sawAt + reach - sr * .2;
  const saw = `<rect x="${f(sawAt - 6)}" y="-7" width="${f(reach - sr * .3)}" height="14" rx="4" fill="#6d7278" ${line(4)}/>
    <g transform="translate(${f(cx)} 0)"><path d="${teeth(sr, 12, 8, .2)}" fill="#f6f8fa" ${line(4)}/><circle r="${f(sr * .36)}" fill="#3a3f46" ${line(3)}/></g>`;
  const sparks = `<g stroke-linecap="round">${[[-.7, 24], [-.25, 30], [.2, 22]].map(([a, len]) => {
    const x0 = cx + Math.cos(a!) * (sr + 14), y0 = Math.sin(a!) * (sr + 14), x1 = cx + Math.cos(a!) * (sr + 14 + len!), y1 = Math.sin(a!) * (sr + 14 + len!);
    return `<path d="M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)}" stroke="${O}" stroke-width="9"/><path d="M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)}" stroke="#fff36b" stroke-width="4"/>`;
  }).join('')}</g>`;
  const ex = r * .22 + r * .34, ey = r * .34, er = r * .2;
  const eye = (y: number) => `<circle cx="${f(ex)}" cy="${f(y)}" r="${f(er)}" fill="#fff" ${line(3)}/><circle cx="${f(ex + er * .35)}" cy="${f(y)}" r="${f(er * .5)}" fill="${O}"/>`;
  const shell = `<rect x="${-r}" y="${f(-h)}" width="${r * 2}" height="${f(h * 2)}" rx="12"/>`;
  return `
    <ellipse cx="7" cy="12" rx="${f(r * 1.2)}" ry="${f(r * 1.08)}" fill="#00000040"/>
    ${wheels}${saw}
    <clipPath id="shell">${shell}</clipPath>
    <rect x="${-r}" y="${f(-h)}" width="${r * 2}" height="${f(h * 2)}" rx="12" fill="#1f6fe0" ${line(6)}/>
    <g clip-path="url(#shell)"><ellipse cx="${f(-r * .15)}" cy="${f(-r * .4)}" rx="${f(r * .95)}" ry="${f(r * .4)}" fill="#ffffff30"/><rect x="${f(-r * 1.3)}" y="${f(r * .56)}" width="${f(r * 2.6)}" height="${r}" fill="#00000022"/></g>
    <rect x="${-r}" y="${f(-h)}" width="${r * 2}" height="${f(h * 2)}" rx="12" fill="none" ${line(6)}/>
    ${[-.5, .5].map(y => `<circle cx="${f(-.72 * r)}" cy="${f(y * r)}" r="4.5" fill="#0006"/>`).join('')}
    ${eye(-ey)}${eye(ey)}${sparks}`;
}

/** The robot alone, nose up and right, filling a 512 square. */
const art = () => `<g transform="translate(262 250) rotate(-36) scale(1.92) translate(-40 0)">${torque()}</g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
