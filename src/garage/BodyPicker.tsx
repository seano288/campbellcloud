// First launch only: he chooses his Truck's Body from the starters. Each is spoken when tapped; ▶ keeps it.
import { useState } from 'preact/hooks';
import { screen } from '../app/nav';
import { useVoice } from '../voice/context';
import { BodyArt } from './BodyArt';
import { BODY_NAMES, STARTER_BODIES, type BodyId } from './catalog';
import { chooseBody } from './garage';

export function BodyPicker() {
  const { say } = useVoice();
  const [pick, setPick] = useState<BodyId | null>(null);
  return (
    <div class="screen picker-screen">
      <div class="bodies">
        {STARTER_BODIES.map(b => (
          <button key={b} class={`body-card ${pick === b ? 'on' : ''}`} aria-label={BODY_NAMES[b]} onClick={() => { setPick(b); void say(BODY_NAMES[b]); }}>
            <BodyArt body={b} />
            <span class="nm">{BODY_NAMES[b]}</span>
          </button>
        ))}
      </div>
      <button class={`big-btn go ${pick ? 'pulse' : 'asleep'}`} aria-label="Choose" disabled={!pick}
        onClick={() => { if (pick) { chooseBody(pick); screen.value = 'home'; } }}>
        <span class="e">▶</span>
      </button>
    </div>
  );
}
