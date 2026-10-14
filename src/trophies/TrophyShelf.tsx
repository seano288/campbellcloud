// The 🏆 shelf in the Garage: one plank each for Learning, Skill and Sticking with it. Earned trophies shine;
// the rest are grey silhouettes. Tapping one reads its name, or the hint for what earns it (or its next step).
import { useEffect } from 'preact/hooks';
import { game } from '../game/store';
import { trophyHint, trophyName } from '../voice/phrases';
import { say, speaking, type Part } from '../voice/say';
import { earnedCount, TROPHIES, type Trophy } from './trophies';
import { cupColor, TrophyArt } from './TrophyArt';

const KINDS = ['learning', 'skill', 'sticking'] as const;

function lines(t: Trophy, n: number): Part[] {
  const next = t.steps[n];
  if (n === 0) return [trophyHint(next!)];
  return next ? [trophyName(t.steps[n - 1]!), trophyHint(next)] : [trophyName(t.steps[n - 1]!)];
}

export function TrophyShelf({ onClose }: { onClose: () => void }) {
  useEffect(() => { void say('Trophies!'); }, []);
  return (
    <div class="shelf">
      <div class="shelfhead"><span>🏆</span><button class="x" aria-label="Close" onClick={onClose}>✕</button></div>
      <div class="planks">
        {KINDS.map(kind => (
          <div key={kind} class="plank">
            {TROPHIES.filter(t => t.kind === kind).map(t => {
              const n = earnedCount(t, game.value.trophies), shown = t.steps[Math.max(n - 1, 0)]!;
              return (
                <button key={t.id} class={`shelf-trophy ${n ? 'earned' : ''} ${speaking.value === t.id ? 'speaking' : ''}`}
                  aria-label={n ? trophyName(shown) : trophyHint(shown)} onClick={() => void say({ parts: lines(t, n), light: t.id })}>
                  <TrophyArt color={cupColor(t, n)} step={shown} size={72} />
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
