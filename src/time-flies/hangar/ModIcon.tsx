// The picture on each Mod tile: a little top view in the scheme's colour for Paint, and an emoji for the rest.
import type { JetId, Rung, SlotId } from './catalog';
import { JetArt } from './JetArt';
import { JETS } from './jets';
import { GOLD } from './three/livery';

const ICONS: Record<Exclude<SlotId, 'paint'>, readonly [string, string, string, string, string]> = {
  nose: ['✖️', '⚡', '🦈', '🐯', '🐉'],
  tail: ['✖️', '🎏', '⭐', '🏁', '🦅'],
  weapons: ['✖️', '🚀', '💣', '💥', '🎆'],
  engine: ['⚙️', '💨', '🔥', '☄️', '🌈'],
  smoke: ['✖️', '☁️', '🇺🇸', '🌈', '✨'],
  canopy: ['🫧', '🕶️', '🟡', '🔵', '💎'],
  lights: ['🚥', '⚪', '🔦', '🟣', '🌟'],
  number: ['✖️', '7️⃣', '🔢', '🔥', '🌟'],
};

export function ModIcon({ slot, rung, jet }: { slot: SlotId; rung: Rung; jet: JetId }) {
  if (slot === 'paint') {
    const l = JETS[jet].livery, scheme = [l.factory, l.camo, l.squadron, l.airshow, GOLD][rung]!;
    return <JetArt jet={jet} color={scheme.base} class="mod-jet" />;
  }
  return <span class="mod-emoji">{ICONS[slot][rung]}</span>;
}
