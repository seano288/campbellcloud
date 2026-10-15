// First launch only: he chooses his Truck's Body from the starters. Each is spoken when tapped; ▶ keeps it.
import { useState } from 'preact/hooks';
import { useVoice } from '../voice/context';
import { BodyArt } from './BodyArt';
import { BODY_NAMES, STARTER_BODIES, type BodyId } from './catalog';

export function BodyPicker({ onConfirm }: { onConfirm(body: BodyId): unknown }) {
  const voice = useVoice(), { say } = voice;
  const [pick, setPick] = useState<BodyId | null>(null);
  return (
    <div class="screen picker-screen">
      <div class="bodies">
        {STARTER_BODIES.map(b => (
          <button key={b} class={`body-card ${pick === b ? 'on' : ''}`} aria-label={BODY_NAMES[b]} onClick={() => { if (voice.active) { setPick(b); void say(BODY_NAMES[b]); } }}>
            <BodyArt body={b} />
            <span class="nm">{BODY_NAMES[b]}</span>
          </button>
        ))}
      </div>
      <button class={`big-btn go ${pick ? 'pulse' : 'asleep'}`} aria-label="Choose" disabled={!pick}
        onClick={() => { if (pick && voice.active) onConfirm(pick); }}>
        <span class="e">▶</span>
      </button>
    </div>
  );
}
