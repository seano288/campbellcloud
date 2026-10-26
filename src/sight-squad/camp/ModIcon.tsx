// A picture for each Mod, for its tile and the Goal bar.
import type { Rung, SlotId } from './catalog';

const ICONS: Record<SlotId, readonly string[]> = {
  helmet: ['🧢', '🪖', '⭐', '🪶', '🐂'],
  pack: ['➖', '🎒', '📻', '🚀', '🐉'],
  flag: ['➖', '🚩', '🏁', '🎌', '🦅'],
  finish: ['🧸', '💎', '✨', '🌟', '🏆'],
  mat: ['🏖️', '🌱', '❄️', '🌊', '🌙'],
  boom: ['🟠', '🎈', '🎨', '🎆', '🌈'],
};

export function ModIcon({ slot, rung }: { slot: SlotId; rung: Rung }) {
  return <span class="mod-emoji" aria-hidden="true">{ICONS[slot][rung]}</span>;
}
