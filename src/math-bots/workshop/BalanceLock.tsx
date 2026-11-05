// The Balance Lock, where every Legendary waits. It opens when he makes both pans the same: a Weigh-In as hard as his own. A wrong number
// tips the pans to show what it weighs; after two the lock counts it out for him and lights the right number. Trying costs nothing and he
// can walk away; a new puzzle waits next time. Then the Legendary is his, and fitted. No Bolts, no Level and no Mastery change here.
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad, sClink } from '../../audio/sfx';
import { player } from '../game';
import { said } from '../numbers/say';
import type { Level } from '../numbers/problems';
import type { Phrase } from '../phrases';
import { speaking, useVoiceScope, type Item } from '../voice';
import { Scale, cls } from '../visuals/Pictures';
import { unlockLegendary } from './actions';
import { LEGENDARY, modName, type SlotId } from './catalog';
import { lockTotal, makeLock } from './lock';

export function BalanceLock({ slot, swatch, onOpen, onClose }: { slot: SlotId; swatch: ComponentChildren; onOpen(): void; onClose(): void }) {
  const voice = useVoiceScope(), scale = player.state.value.learning.modes.scale, met = player.state.value.learning.met.includes('same');
  const p = useMemo(() => makeLock(scale.opened ? scale.level as Level : null, Math.random), []);
  const total = lockTotal(p), leftText = p.b ? `${p.a} + ${p.b}` : String(p.a);
  const [tried, setTried] = useState<number | null>(null), [wrong, setWrong] = useState<number[]>([]), [busy, setBusy] = useState(false), [lit, setLit] = useState<number | null>(null), [open, setOpen] = useState(false);
  const sum: Phrase[] = [said(p.a), ...(p.b ? ['plus' as const, said(p.b)] : []), 'is the same as', said(p.c), 'plus what number?'];
  const speech: Item[] = [...sum, ...p.choices.map((n, i) => ({ parts: [said(n)], light: `c${i}` }))];
  const ask = () => voice.say(modName(slot, LEGENDARY), 'This one is in the Balance Lock!', 'Make both sides the same!', ...speech);
  useEffect(() => { void ask(); }, []);

  async function tap(n: number) {
    if (!voice.active || busy || open || wrong.includes(n)) return;
    setBusy(true);
    setTried(n);
    if (n === p.x) {
      sClink();
      setOpen(true);
      if (unlockLegendary(slot).kind === 'accepted') { await voice.say(said(n), 'The lock is open!'); if (voice.active) onOpen(); }
      else { setOpen(false); setBusy(false); } // the save didn't take: let him try again
      return;
    }
    sBad();
    const misses = wrong.length + 1;
    setWrong([...wrong, n]);
    await voice.say('This side has', said(total), 'This side has', said(p.c + n), 'Try again!');
    if (misses >= 2 && voice.active) { setLit(p.x); await voice.say(said(p.c), 'and', said(p.x), 'make', said(total)); }
    if (voice.active) { setTried(null); setBusy(false); }
  }
  const right = tried ?? 0;
  return (
    <div class="modal vault-modal">
      <div class={cls('modal-card', 'vault-card', 'lock-card', busy && 'busy')}>
        <button class="x" aria-label="Close" onClick={() => { voice.cancel(); onClose(); }}>✕</button>
        <div class="lock-head">
          <span class="lock-door" aria-hidden="true">{open ? '🔓' : '🔐'}</span>
          <span class="lock-prize">{swatch}</span>
          <button class="say-btn" aria-label="Say it again" onClick={() => void ask()}>🔊</button>
        </div>
        {met && <div class="lock-eq">{leftText} = {p.c} + {tried ?? '?'}</div>}
        <Scale left={total} right={p.c + right} leftText={leftText} rightText={`${p.c} + ${tried ?? '?'}`} />
        <div class="choices three">
          {p.choices.map((n, i) => (
            <button key={n} class={cls('choice', wrong.includes(n) && 'wrong', open && n === p.x && 'right', lit === n && 'lit', speaking.value === `c${i}` && 'reading')}
              disabled={wrong.includes(n)} aria-label={String(n)} onClick={() => void tap(n)}>{n}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
