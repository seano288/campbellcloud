// The Time Lock vault, where every Legendary waits. It opens when he sets the clock to the time it shows: the Legendary is
// his and fitted. A miss says what his clock says; after two, the hands move to the right time while it's explained.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sBad } from '../../audio/sfx';
import { ClockFace } from '../clock/ClockFace';
import { timePhrase } from '../clock/speech';
import { clearLesson, lessonFor, teachTime } from '../clock/teach';
import { digital, fromMinutes, minutesOf, randomTime, sameTime, snap, startingTime, STEP } from '../clock/time';
import { player } from '../game';
import { useVoiceScope } from '../voice';
import { unlockLegendary } from './actions';
import { modName, LEGENDARY, type SlotId } from './catalog';
import { ModIcon } from './ModIcon';

export function TimeLock({ slot, onOpen, onClose }: { slot: SlotId; onOpen(): void; onClose(): void }) {
  const voice = useVoiceScope(), lesson = lessonFor(voice.signal);
  const level = player.state.value.learning.modes.find.level;
  const target = useMemo(() => randomTime(level, Math.random), []);
  const [minutes, setMinutes] = useState(() => minutesOf(startingTime(target, level, Math.random)));
  const [misses, setMisses] = useState(0);
  const [busy, setBusy] = useState(false);
  const jet = player.state.value.hangar.jet ?? 'p51';
  const ask = () => voice.say(modName(slot, LEGENDARY), 'This one is in the Time Lock vault!', 'Set the clock to open it!', timePhrase(target));
  useEffect(() => { void ask(); }, []);
  async function check() {
    if (!voice.active || busy) return;
    const shown = fromMinutes(snap(minutes, level));
    if (sameTime(shown, target)) {
      setBusy(true);
      const r = unlockLegendary(slot);
      if (r.kind === 'accepted') { await voice.say('The vault is open!'); if (voice.active) onOpen(); }
      return;
    }
    sBad();
    setBusy(true);
    const n = misses + 1;
    setMisses(n);
    await voice.say('Your clock says', timePhrase(shown), 'Try again!');
    if (n >= 2 && voice.active) {
      const now = snap(minutes, level), want = minutesOf(target);
      setMinutes(now + ((((want - now) % 720) + 720) % 720));
      await teachTime(target, lesson, voice);
      clearLesson(lesson);
    }
    if (voice.active) setBusy(false);
  }
  return (
    <div class="modal vault-modal">
      <div class="modal-card vault-card">
        <button class="x" aria-label="Close" onClick={() => { voice.cancel(); onClose(); }}>✕</button>
        <div class="vault-head">
          <span class="vault-door">🔐</span>
          <span class="vault-prize"><ModIcon slot={slot} rung={LEGENDARY} jet={jet} /></span>
          <button class="say-btn" aria-label="Say it again" onClick={() => void ask()}>🔊</button>
          <h2>{digital(target)}</h2>
        </div>
        <div class="big-clock vault-clock">
          <ClockFace minutes={minutes} lesson={lesson} step={STEP[level]} onTurn={(m, end) => { if (!busy) setMinutes(end ? snap(m, level) : m); }} />
        </div>
        <button class="big-btn go check-btn" aria-label="Open the vault" onClick={() => void check()}>✓</button>
      </div>
    </div>
  );
}
