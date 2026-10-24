// First launch: he picks his first plane from the three starters. Tapping one says its name and a fact; ✓ takes it.
import { useState } from 'preact/hooks';
import { sClink } from '../audio/sfx';
import { setupJet } from './game';
import { nextFact } from './hangar/HangarScreen';
import { JET_NAMES, STARTER_JETS, type StarterJet } from './hangar/catalog';
import { JetArt } from './hangar/JetArt';
import { useVoiceScope } from './voice';
import { useEffect } from 'preact/hooks';

export function JetPicker({ onDone }: { onDone(): void }) {
  const voice = useVoiceScope();
  const [chosen, setChosen] = useState<StarterJet | null>(null);
  useEffect(() => { void voice.say('Pick your first plane!'); }, []);
  return (
    <div class="screen picker-screen">
      <h1 class="picker-title">Pick your plane</h1>
      <div class="bodies">
        {STARTER_JETS.map(j => (
          <button key={j} class={`body-card ${chosen === j ? 'on' : ''}`} aria-label={JET_NAMES[j]} onClick={() => { sClink(); setChosen(j); void voice.say(JET_NAMES[j], nextFact(j)); }}>
            <JetArt jet={j} class="body-art" color="#c9d1d9" />
            <span class="nm">{JET_NAMES[j]}</span>
          </button>
        ))}
      </div>
      <button class={`big-btn go ${chosen ? 'pulse' : 'asleep'}`} aria-label="That one" onClick={() => { if (chosen && setupJet(chosen).kind === 'accepted') onDone(); }}>
        <span class="e">✓</span>
      </button>
    </div>
  );
}
