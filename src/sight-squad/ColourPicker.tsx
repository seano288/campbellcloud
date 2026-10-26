// First launch: he picks his army's colour from the three classic army-men plastics. Tapping one says its name; ✓ takes it.
import { useEffect, useState } from 'preact/hooks';
import { sClink } from '../audio/sfx';
import { colourById, STARTER_COLOURS, type StarterColour } from './camp/catalog';
import { UnitArt } from './camp/UnitArt';
import { setupColour } from './game';
import { useVoiceScope } from './voice';

export function ColourPicker({ onDone }: { onDone(): void }) {
  const voice = useVoiceScope();
  const [chosen, setChosen] = useState<StarterColour | null>(null);
  useEffect(() => { void voice.say("Pick your army's color!"); }, []);
  return (
    <div class="screen picker-screen">
      <h1 class="picker-title">🪖</h1>
      <div class="bodies">
        {STARTER_COLOURS.map(c => (
          <button key={c} class={`body-card ${chosen === c ? 'on' : ''}`} aria-label={colourById(c).name} onClick={() => { sClink(); setChosen(c); void voice.say(colourById(c).name); }}>
            <span class="trio">{[0, 1, 2].map(i => <UnitArt key={i} unit="rifleman" color={colourById(c).hex} class="body-art" />)}</span>
            <span class="nm">{colourById(c).name}</span>
          </button>
        ))}
      </div>
      <button class={`big-btn go ${chosen ? 'pulse' : 'asleep'}`} aria-label="That one" onClick={() => { if (chosen && setupColour(chosen).kind === 'accepted') onDone(); }}>
        <span class="e">✓</span>
      </button>
    </div>
  );
}
