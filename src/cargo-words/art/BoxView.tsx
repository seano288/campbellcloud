// The container in HTML, for the questions and the Port's lists: the same shape the Crane draws on its canvas (container.ts), with the
// syllable on a white plate in Andika. The colour cycles through the port colours by default (rust red, bright blue, green, orange).
import type { ComponentChildren } from 'preact';

export const BOX_HEXES = ['#c8452f', '#2f6fe0', '#2f9a55', '#f07c1f', '#7b4bd1', '#1a9a9a'] as const;

export function BoxView({ text, hex, small, lit, pulse, faded, onClick, label, class: cls = '', children }: {
  text: string; hex?: string; small?: boolean; lit?: boolean; pulse?: boolean; faded?: boolean; onClick?: () => void; label?: string; class?: string; children?: ComponentChildren;
}) {
  const style = { '--box': hex ?? BOX_HEXES[[...text].reduce((s, c) => s + c.charCodeAt(0), 0) % BOX_HEXES.length] } as Record<string, string>;
  const body = <><span class="cw-ribs" aria-hidden="true" /><span class="cw-plate">{text}</span>{children}</>;
  const classes = ['cw-box', small && 'small', lit && 'lit', pulse && 'pulse', faded && 'faded', cls].filter(Boolean).join(' ');
  return onClick
    ? <button class={classes} style={style} aria-label={label ?? text} onClick={onClick}>{body}</button>
    : <span class={classes} style={style}>{body}</span>;
}
