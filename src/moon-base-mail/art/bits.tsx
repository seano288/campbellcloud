// Small pictures the screens share: the mail's stamp (a crescent moon on a night-blue stamp with a perforated edge), the Earth as it
// hangs over the Moon, the supply ship (for the Landing buttons, in place of an aeroplane emoji), the base's modules and its people as
// images, and a row of the base's modules standing on the moon (the Home tile and the Start screen).
import { domeHex, flagIcon, HOME, suitHex, type BaseState } from '../base/base';
import { itemOf, isItemId } from '../base/catalog';
import { moduleFor } from '../base/gen';
import { genLook, homeLook, moduleUrl, namedLook, type Look } from './modules';
import { astronautSvg, svgUrl } from './people';

/** The stamp in the corner of every letter: a moon on night blue, its edge cut in little bites like a real stamp. */
export function Stamp({ size = 40 }: { size?: number }) {
  const bites = [];
  for (let i = 0; i < 6; i++) bites.push(<circle key={`t${i}`} cx={5 + i * 6} cy="1" r="1.9" />, <circle key={`b${i}`} cx={5 + i * 6} cy="43" r="1.9" />);
  for (let i = 0; i < 7; i++) bites.push(<circle key={`l${i}`} cx="1" cy={4 + i * 6} r="1.9" />, <circle key={`r${i}`} cx="35" cy={4 + i * 6} r="1.9" />);
  return (
    <svg class="mb-stamp" viewBox="0 0 36 44" width={size} height={(size * 44) / 36} aria-hidden="true">
      <mask id="mb-stamp-bites"><rect width="36" height="44" fill="#fff" /><g fill="#000">{bites}</g></mask>
      <g mask="url(#mb-stamp-bites)">
        <rect width="36" height="44" fill="#fff" />
        <rect x="5" y="5" width="26" height="34" rx="2" fill="#1d2b6e" />
        <circle cx="17" cy="20" r="9" fill="#ffd23f" /><circle cx="21" cy="17" r="8" fill="#1d2b6e" />
        <circle cx="25" cy="29" r="1.4" fill="#fff" /><circle cx="11" cy="10" r="1.1" fill="#fff" /><circle cx="26" cy="10" r="1" fill="#fff" />
        <path d="M5 33 Q18 29 31 33 V39 H5 Z" fill="#9aa0ab" />
      </g>
    </svg>
  );
}

/** The Earth over the Moon: blue sea, green land, white cloud, and the night side in shadow. */
export function Earth({ size = 64, cls = 'mb-earth' }: { size?: number; cls?: string }) {
  return (
    <svg class={cls} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs><clipPath id="mb-earth-clip"><circle cx="32" cy="32" r="28" /></clipPath></defs>
      <circle cx="32" cy="32" r="31" fill="#3a86ff" fill-opacity=".25" />
      <g clip-path="url(#mb-earth-clip)">
        <rect width="64" height="64" fill="#3a86ff" />
        <path d="M12 18 Q22 8 32 14 Q30 26 20 28 Q14 34 8 30 Z M34 34 Q46 30 50 40 Q44 52 36 48 Q32 42 34 34 Z M44 10 Q52 12 54 20 Q48 20 44 16 Z" fill="#2ec45a" />
        <path d="M8 22 Q20 18 28 22 M30 30 Q44 26 58 30 M14 44 Q24 40 32 44" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".85" />
        <circle cx="46" cy="40" r="30" fill="#0b1022" opacity=".32" />
      </g>
      <circle cx="32" cy="32" r="28" fill="none" stroke="#14161b" stroke-width="3" />
    </svg>
  );
}

/** The supply ship, small: on the Landing buttons and badges. */
export function Lander({ size = 32 }: { size?: number }) {
  return (
    <svg class="mb-lander" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <g stroke="#14161b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
        <path d="M18 36 L8 56 M46 36 L56 56 M4 56 H13 M51 56 H60" fill="none" />
        <path d="M18 8 H46 L52 36 H12 Z" fill="#f2f2f2" />
        <circle cx="32" cy="21" r="7" fill="#9fd3ff" />
        <path d="M24 36 H40 L36 46 H28 Z" fill="#5b6270" />
        <path d="M28 46 L32 58 L36 46" fill="#ff8c1a" />
      </g>
    </svg>
  );
}

/** How a plot's module is drawn, and its emoji badge (none for the home dome and the made modules, whose shape and colour tell them). */
export function lookOf(id: string, b: Pick<BaseState, 'domePaint'>): Look {
  if (id === HOME) return homeLook(domeHex(b));
  if (id.startsWith('gen:')) return genLook(moduleFor(Number(id.slice(4))));
  return isItemId(id) ? namedLook(id.slice(id.indexOf(':') + 1), domeHex(b), itemOf(id).icon) : homeLook(domeHex(b));
}

/** A module, drawn, with its badge. */
export function ModuleArt({ id, b, size = 44 }: { id: string; b: Pick<BaseState, 'domePaint'>; size?: number }) {
  const look = lookOf(id, b);
  return (
    <span class="mb-mod" style={{ width: `${size}px`, height: `${size}px` }}>
      <img src={moduleUrl(look)} alt="" width={size} height={size} draggable={false} />
      {look.icon && <span class="mb-badge" style={{ fontSize: `${Math.max(10, Math.round(size * 0.2))}px` }} aria-hidden="true">{look.icon}</span>}
    </span>
  );
}

/** His astronaut, in the suit and helmet he picked, as an image URL (`step` swings the legs). */
export const meSvg = (b: Pick<BaseState, 'suit' | 'helmet'>, step = 0) =>
  astronautSvg(suitHex(b), b.helmet.replace('helmet:', ''), step, b.suit === 'suit:stripe' ? 'stripe' : b.suit === 'suit:star' ? 'star' : null);
export const meUrl = (b: Pick<BaseState, 'suit' | 'helmet'>, step = 0) => svgUrl(meSvg(b, step));

/** The plots in reading order (top row first), the home dome first. */
export function modulesInOrder(b: Pick<BaseState, 'placed'>): string[] {
  return Object.entries(b.placed)
    .sort(([a], [c]) => { const [ax, ay] = a.split(',').map(Number), [cx, cy] = c.split(',').map(Number); return ay! - cy! || ax! - cx!; })
    .map(([, id]) => id).sort((a, c) => (a === HOME ? -1 : c === HOME ? 1 : 0));
}

/** His base seen from the side, standing on the moon under the Earth, with his astronaut by the door: the Home tile and Start. Up to
 *  seven modules stand in the row (the rest are on the map); a new base is its one dome, drawn large. */
export function BaseSkyline({ b, max = 7 }: { b: BaseState; max?: number }) {
  const ids = modulesInOrder(b).slice(0, max);
  return (
    <span class="mb-skyline" aria-hidden="true" style={{ '--n': ids.length } as Record<string, number>}>
      <Earth cls="mb-earth sky-earth" />
      <span class="mb-skyline-row">
        <span class="mb-skyline-flag">{flagIcon(b)}</span>
        {ids.map((id, i) => {
          const look = lookOf(id, b);
          return (
            <span key={`${id}${i}`} class="mb-skyline-mod">
              <img src={moduleUrl(look)} alt="" draggable={false} />
              {look.icon && <span class="mb-badge">{look.icon}</span>}
            </span>
          );
        })}
        <img class="mb-skyline-me" src={meUrl(b)} alt="" draggable={false} />
      </span>
    </span>
  );
}
