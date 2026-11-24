// A mission patch: a round cloth badge with a picture, a coloured rim and its number.
import type { Patch } from './missions';

export function PatchBadge({ patch, size }: { patch: Patch; size: number }) {
  return (
    <span class="gh-patch" style={{ width: `${size}px`, height: `${size}px`, background: patch.bg, borderColor: patch.rim, fontSize: `${size * .48}px` } as Record<string, string>} aria-label={`Patch ${patch.n / 5}`}>
      <span aria-hidden="true">{patch.glyph}</span>
    </span>
  );
}
