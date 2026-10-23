// The picture on each Mod tile: a little top view in the scheme's colour for Paint, and an emoji for the rest.
import type { HeliId, Rung, SlotId } from './catalog';
import { HeliArt } from './HeliArt';
import { HELIS } from './helis';
import { GOLD } from '../../time-flies/hangar/three/livery';

const ICONS: Record<Exclude<SlotId, 'paint'>, readonly [string, string, string, string, string]> = {
  nose: ['✖️', '⚡', '🦈', '🐯', '🐉'],
  tail: ['✖️', '🎏', '⭐', '🏁', '🦅'],
  weapons: ['✖️', '🚀', '🎯', '💥', '🎆'],
  rotor: ['🌀', '🎗️', '💠', '🔥', '🌈'],
  smoke: ['✖️', '☁️', '🇺🇸', '🌈', '✨'],
  canopy: ['🫧', '🕶️', '🟡', '🔵', '💎'],
  lights: ['🚥', '⚪', '🔦', '🟣', '🌟'],
  number: ['✖️', '7️⃣', '🔢', '🔥', '🌟'],
};

export function ModIcon({ slot, rung, heli }: { slot: SlotId; rung: Rung; heli: HeliId }) {
  if (slot === 'paint') {
    const l = HELIS[heli].livery, scheme = [l.factory, l.camo, l.squadron, l.airshow, GOLD][rung]!;
    return <HeliArt heli={heli} color={scheme.base} class="mod-heli" />;
  }
  return <span class="mod-emoji">{ICONS[slot][rung]}</span>;
}
