// A part written with numbers: the top number over the bottom number, with a line between. While teaching, the number
// being talked about glows.
import { fracWord, type Frac } from './fraction';
import type { Mark } from './teach';

export function Written({ f, mark = null, class: cls = '' }: { f: Frac; mark?: Mark; class?: string }) {
  const on = (part: 'top' | 'bottom') => (mark === part || mark === 'both' ? 'marked' : '');
  return (
    <span class={`written ${cls}`} role="img" aria-label={fracWord(f)}>
      <span class={`num ${on('top')}`}>{f.n}</span>
      <span class="bar" />
      <span class={`num ${on('bottom')}`}>{f.d}</span>
    </span>
  );
}
