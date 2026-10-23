// The Fuel Lock, where every Legendary waits. It opens when he fills the fuel tank to the part he hears ("Fill the tank
// three quarters full!"): tapping a part of the tank fills it up to there. A miss says how much he filled; after two, the
// tank fills to the right level while it's explained. Then the Legendary is his, and fitted.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sBad, sCount } from '../../audio/sfx';
import { fillLine, filledLine, fracWord, means, partsOfTank } from '../fractions/fraction';
import { makeFuel, piecesFor, type Level } from '../fractions/problems';
import { player } from '../game';
import { useVoiceScope } from '../voice';
import { unlockLegendary } from './actions';
import { LEGENDARY, modName, type SlotId } from './catalog';
import { ModIcon } from './ModIcon';

export function FuelLock({ slot, onOpen, onClose }: { slot: SlotId; onOpen(): void; onClose(): void }) {
  const voice = useVoiceScope(), learning = player.state.value.learning.modes;
  // as hard as his Color the Part (or Find the Part, until that opens)
  const level = (learning.color.opened ? learning.color.level : learning.find.level) as Level;
  const p = useMemo(() => makeFuel(level, Math.random, player.state.value.learning.words), []);
  const [filled, setFilled] = useState(0);
  const [misses, setMisses] = useState(0);
  const [busy, setBusy] = useState(false);
  const heli = player.state.value.helipad.heli ?? 'uh60', want = piecesFor(p);
  const ask = () => voice.say(modName(slot, LEGENDARY), 'This one is in the Fuel Lock!', fillLine(p.target), 'Tap the tank to fill it.');
  useEffect(() => { void ask(); }, []);
  function tap(k: number) { // tapping the part that's the top of the fuel takes it back down one
    if (!voice.active || busy) return;
    const n = filled === k + 1 ? k : k + 1;
    setFilled(n);
    sCount(n);
  }
  async function check() {
    if (!voice.active || busy) return;
    if (filled === want) {
      setBusy(true);
      const r = unlockLegendary(slot);
      if (r.kind === 'accepted') { await voice.say('The tank is full!'); if (voice.active) onOpen(); }
      return;
    }
    sBad();
    setBusy(true);
    const n = misses + 1;
    setMisses(n);
    await voice.say(filledLine(filled, p.d), 'Try again!');
    if (n >= 2 && voice.active) {
      await voice.say(means(p.target), partsOfTank(p.target, p.d));
      for (let k = 1; k <= want && voice.active; k++) { setFilled(k); sCount(k); await voice.wait(450); }
    }
    if (voice.active) setBusy(false);
  }
  return (
    <div class="modal vault-modal">
      <div class="modal-card vault-card fuel-card">
        <button class="x" aria-label="Close" onClick={() => { voice.cancel(); onClose(); }}>✕</button>
        <div class="vault-head">
          <span class="vault-door">⛽</span>
          <span class="vault-prize"><ModIcon slot={slot} rung={LEGENDARY} heli={heli} /></span>
          <button class="say-btn" aria-label="Say it again" onClick={() => void ask()}>🔊</button>
          <h2>{fracWord(p.target)}</h2>
        </div>
        <div class="tank" role="group" aria-label="Fuel tank">
          {Array.from({ length: p.d }, (_, i) => p.d - 1 - i).map(k => (
            <button key={k} class={`tank-part ${k < filled ? 'full' : ''}`} aria-label={`Part ${k + 1}`} onClick={() => tap(k)} />
          ))}
        </div>
        <button class="big-btn go check-btn" aria-label="Fill it" onClick={() => void check()}>✓</button>
      </div>
    </div>
  );
}
