// What goes on the quay for a go: whole words, their syllables one to a container, exactly as many as the ship takes. The words from his
// last Round come first (newest first), then words from the table to fill up. Seeded by the go's number, so a reload shows the same.
import { seeded, shuffle } from '../../game/rng';
import { WORDS } from '../words/words';

export function cargoFor(recent: readonly string[], capacity: number, n: number): string[][] {
  const rng = seeded(n * 7741 + 11), out: string[][] = [];
  let left = capacity;
  const table = (w: string) => WORDS.find(x => x.word === w);
  for (const w of [...recent].reverse()) {
    const t = table(w);
    if (!t || t.syls.length > left || out.some(o => o.join('') === w)) continue;
    out.push([...t.syls]);
    left -= t.syls.length;
    if (!left) return out;
  }
  // then two-beat words, and a one-beat word to finish an odd number
  const fill = shuffle(rng, WORDS.filter(w => w.syls.length >= 2 && w.syls.length <= 3));
  for (const t of fill) {
    if (left <= 1) break;
    if (t.syls.length > left || out.some(o => o.join('') === t.word)) continue;
    out.push([...t.syls]);
    left -= t.syls.length;
  }
  if (left > 0) for (const t of shuffle(rng, WORDS.filter(w => w.syls.length === 1))) { if (!left) break; out.push([...t.syls]); left--; }
  return out;
}
