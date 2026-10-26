// The Password Lock, where every Legendary waits. It opens when he builds the password: a word he has met, from letter
// tiles, as hard as his Build It (at Level 1 the letters show faintly in the slots). A wrong letter says which letter it
// was; after two, the password is spelled out for him letter by letter. Then the Legendary is his, and fitted.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sBad, sClink, sCount } from '../../audio/sfx';
import { pick } from '../../game/rng';
import { player } from '../game';
import { makeLine } from '../phrases';
import { useVoiceScope } from '../voice';
import { letterLine, type Word } from '../words/list';
import { canSpell, makeSpell, type Level } from '../words/problems';
import { Letters } from '../words/views';
import { unlockLegendary } from './actions';
import { LEGENDARY, modName, type SlotId } from './catalog';
import { ModIcon } from './ModIcon';

/** A short word he knows well enough to build. */
function password(words: readonly Word[]): Word {
  const ok = words.filter(w => canSpell(w) && w.length <= 5);
  return ok.length ? pick(Math.random, ok.slice(-12)) : 'go';
}

export function PasswordLock({ slot, onOpen, onClose }: { slot: SlotId; onOpen(): void; onClose(): void }) {
  const voice = useVoiceScope(), learning = player.state.value.learning;
  const p = useMemo(() => makeSpell(learning.modes.spell.level as Level, Math.random, password(learning.words))!, []);
  const word = p.target.toLowerCase();
  const [typed, setTyped] = useState('');
  const [used, setUsed] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [busy, setBusy] = useState(false);
  const [lit, setLit] = useState<number | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const ask = () => voice.say(modName(slot, LEGENDARY), 'This one is in the Password Lock!', 'Build the password!', makeLine(p.target));
  useEffect(() => { void ask(); }, []);

  async function spellIt() {
    await voice.say('Say it, spell it, say it!', p.target);
    for (const [i, c] of [...word].entries()) { if (!voice.active) return; setLit(i); sCount(i + 1); await voice.say(letterLine(c)); }
    setLit(null);
    await voice.say(p.target);
  }
  async function tap(i: number) {
    if (!voice.active || busy || used.includes(i)) return;
    const next = typed + p.tiles[i]!;
    if (word.startsWith(next)) {
      setTyped(next); setUsed([...used, i]); sClink();
      if (next !== word) { void voice.say(letterLine(p.tiles[i]!)); return; }
      setBusy(true);
      if (unlockLegendary(slot).kind === 'accepted') { await voice.say(letterLine(p.tiles[i]!), p.target, 'The lock is open!'); if (voice.active) onOpen(); }
      else setBusy(false); // the save didn't take: let him try again
      return;
    }
    sBad(); setShake(i); setTimeout(() => setShake(null), 450);
    setBusy(true);
    const n = misses + 1;
    setMisses(n);
    await voice.say(letterLine(p.tiles[i]!), 'Not that letter.', 'Try again!');
    if (n >= 2 && voice.active) await spellIt();
    if (voice.active) setBusy(false);
  }
  return (
    <div class="modal vault-modal">
      <div class="modal-card vault-card password-card">
        <button class="x" aria-label="Close" onClick={() => { voice.cancel(); onClose(); }}>✕</button>
        <div class="vault-head">
          <span class="vault-door">🔐</span>
          <span class="vault-prize"><ModIcon slot={slot} rung={LEGENDARY} /></span>
          <button class="say-btn" aria-label="Say it again" onClick={() => void ask()}>🔊</button>
        </div>
        <div class="slots" aria-label="The password so far">
          {[...word].map((c, i) => (
            <span key={i} class={`slot ${i < typed.length ? 'filled' : ''} ${lit === i ? 'lit' : ''}`}>
              <span class="sw">{i < typed.length ? typed[i] : lit !== null || p.ghost ? <span class="ghost">{c}</span> : ''}</span>
            </span>
          ))}
        </div>
        {lit !== null && <div class="teach-panel inline"><Letters word={p.target} lit={lit} /></div>}
        <div class="tiles">
          {p.tiles.map((c, i) => (
            <button key={i} class={`tile-btn ${used.includes(i) ? 'used' : ''} ${shake === i ? 'wiggle' : ''}`} aria-label={c} disabled={used.includes(i)} onClick={() => void tap(i)}>
              <span class="sw">{c}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
