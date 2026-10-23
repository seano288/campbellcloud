// First launch: he picks his first helicopter from the three starters. Tapping one says its name and a fact; ✓ takes it.
import { useState } from 'preact/hooks';
import { sClink } from '../audio/sfx';
import { setupHeli } from './game';
import { nextFact } from './hangar/HelipadScreen';
import { HELI_NAMES, STARTER_HELIS, type StarterHeli } from './hangar/catalog';
import { HeliArt } from './hangar/HeliArt';
import { HELIS } from './hangar/helis';
import { useVoiceScope } from './voice';
import { useEffect } from 'preact/hooks';

export function HeliPicker({ onDone }: { onDone(): void }) {
  const voice = useVoiceScope();
  const [chosen, setChosen] = useState<StarterHeli | null>(null);
  useEffect(() => { void voice.say('Pick your first helicopter!'); }, []);
  return (
    <div class="screen picker-screen">
      <h1 class="picker-title">🚁</h1>
      <div class="bodies">
        {STARTER_HELIS.map(j => (
          <button key={j} class={`body-card ${chosen === j ? 'on' : ''}`} aria-label={HELI_NAMES[j]} onClick={() => { sClink(); setChosen(j); void voice.say(HELI_NAMES[j], nextFact(j)); }}>
            <HeliArt heli={j} class="body-art" color={HELIS[j].livery.factory.base} />
            <span class="nm">{HELI_NAMES[j]}</span>
          </button>
        ))}
      </div>
      <button class={`big-btn go ${chosen ? 'pulse' : 'asleep'}`} aria-label="That one" onClick={() => { if (chosen && setupHeli(chosen).kind === 'accepted') onDone(); }}>
        <span class="e">✓</span>
      </button>
    </div>
  );
}
