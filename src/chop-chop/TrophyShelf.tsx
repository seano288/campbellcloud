// The 🏆 shelf on the Helipad: one plank each for Learning, Skill and Sticking with it. Earned trophies shine; the rest
// are empty dashed outlines, spots on the shelf waiting to be filled. Tapping one reads its name, or the hint for what earns it (or its next step).
import { useEffect } from 'preact/hooks';
import { player } from './game';
import type { Phrase } from './phrases';
import { MODE_ICONS } from './modes';
import { earnedCount, TROPHIES, trophyHint, trophyName, type Trophy, type TrophyStep } from './trophies';
import { speaking, useVoiceScope } from './voice';

const KINDS = ['learning', 'skill', 'sticking'] as const;
const METALS = ['#cd7f32', '#d4dae3', '#ffd23f', '#7fe0d6', '#c9a4ff'], GOLD = METALS[2]!, GREY = '#4b5160';
const cupColor = (t: Trophy, n: number) => (n === 0 ? GREY : t.steps.length === 1 ? GOLD : METALS[n - 1]!);
function emblem(s: TrophyStep): [string, string] {
  switch (s.kind) {
    case 'level': return [MODE_ICONS[s.mode], String(s.level)];
    case 'star': return [MODE_ICONS[s.mode], '⭐'];
    case 'streak': return ['🔥', String(s.n)];
    case 'perfect': return ['💯', ''];
    case 'rounds': return ['🏁', String(s.n)];
    case 'days': return ['📅', String(s.n)];
  }
}
function Cup({ color, step }: { color: string; step: TrophyStep }) {
  const [icon, text] = emblem(step), empty = color === GREY;
  const line = empty ? { stroke: '#ffffff70', 'stroke-dasharray': '7 6' } : { stroke: '#000' }, fill = empty ? '#ffffff12' : color;
  return (
    <div class="trophy" style={{ width: 'calc(72px*var(--u))', height: 'calc(86px*var(--u))' }} aria-hidden="true">
      <svg viewBox="0 0 100 120">
        <path d="M22 18 H8 Q6 46 30 50 M78 18 H92 Q94 46 70 50" fill="none" stroke={empty ? '#ffffff40' : color} stroke-width="7" />
        <path d="M20 8 H80 V36 Q80 70 50 72 Q20 70 20 36 Z" fill={fill} stroke-width="4" {...line} />
        <rect x="43" y="72" width="14" height="18" fill={fill} stroke-width="4" {...line} />
        <rect x="24" y="90" width="52" height="22" rx="4" fill={fill} stroke-width="4" {...line} />
      </svg>
      <span class="ti">{icon}</span>
      {text && <span class="tt">{text}</span>}
    </div>
  );
}
function lines(t: Trophy, n: number): Phrase[] {
  const next = t.steps[n];
  if (n === 0) return [trophyHint(next!)];
  return next ? [trophyName(t.steps[n - 1]!), trophyHint(next)] : [trophyName(t.steps[n - 1]!)];
}

export function TrophyShelf({ onClose }: { onClose(): void }) {
  const voice = useVoiceScope(), earned = player.state.value.trophies.earned;
  useEffect(() => { void voice.say('Trophies!'); }, []);
  return (
    <div class="shelf">
      <div class="shelfhead"><span>🏆</span><button class="x" aria-label="Close" onClick={() => { voice.cancel(); onClose(); }}>✕</button></div>
      <div class="planks">
        {KINDS.map(kind => (
          <div key={kind} class="plank">
            {TROPHIES.filter(t => t.kind === kind).map(t => {
              const n = earnedCount(t, earned), shown = t.steps[Math.max(n - 1, 0)]!;
              return (
                <button key={t.id} class={`shelf-trophy ${n ? 'earned' : ''} ${speaking.value === t.id ? 'speaking' : ''}`}
                  aria-label={n ? trophyName(shown) : trophyHint(shown)} onClick={() => void voice.say({ parts: lines(t, n), light: t.id })}>
                  <Cup color={cupColor(t, n)} step={shown} />
                  {t.steps.length > 1 && <span class="pips">{t.steps.map((_, i) => <i key={i} class={i < n ? 'on' : ''} />)}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
