// A dragon hatches and he names it: the egg wobbles and cracks, the dragon pops out, and he picks one describing word and one noun from
// two short rows (Spiky Storm, Tiny Comet). The words are said as he taps them; he isn't tested on them. Then it says hello by name.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sFanfare, sPop } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { DragonCanvas } from '../art/DragonCanvas';
import { eggPic } from '../art/dragon';
import { updateRoost } from '../game';
import { useVoice } from '../voice';
import { cap, lookOfEgg, nameChoices } from './dragons';
import { name, type Dragon } from './roost';

export function NameDragon({ dragon, onDone }: { dragon: Dragon; onDone(): void }) {
  const voice = useVoice(), choices = nameChoices(dragon.id), look = lookOfEgg(dragon.egg);
  const [hatched, setHatched] = useState(false), [adj, setAdj] = useState<string | null>(null), [noun, setNoun] = useState<string | null>(null), [named, setNamed] = useState(false);
  useEffect(() => {
    void (async () => {
      await voice.say('Hatch!');
      await voice.wait(700);
      sPop(); setHatched(true); sFanfare(); confetti(24, voice.signal);
      if (voice.active) await voice.say('Name your dragon!', 'Pick one word. Then pick another!');
    })();
  }, []);
  function pick(row: 'adj' | 'noun', w: string) {
    if (!voice.active || !hatched || named) return;
    sChime();
    if (row === 'adj') setAdj(w); else setNoun(w);
    void voice.say(w);
    const a = row === 'adj' ? w : adj, n = row === 'noun' ? w : noun;
    if (a && n) {
      updateRoost(r => name(r, dragon.id, [a, n]));
      setNamed(true);
      void voice.say('Hello,', a, n).then(() => { if (voice.active) setTimeout(onDone, 600); });
    }
  }
  return (
    <div class="dr-name" role="dialog" aria-label="Name your dragon">
      <div class="dr-name-art">
        {hatched ? <DragonCanvas look={look} opts={{ stage: 0, act: named ? 'flap' : 'hop', flap: 1.5 }} label="Your new dragon" />
          : <img class="dr-hatching" src={eggPic(look, 160, 1)} alt="An egg hatching" />}
      </div>
      <b class="dr-name-shown tablet big">{adj ? cap(adj) : '…'} {noun ? cap(noun) : '…'}</b>
      <div class="dr-name-rows" aria-hidden={!hatched}>
        <div class={`dr-name-row ${adj ? 'done' : ''}`}>{choices.adj.map(w => <button key={w} class={`tablet dr-name-word ${adj === w ? 'right' : ''}`} aria-label={w} onClick={() => pick('adj', w)}>{cap(w)}</button>)}</div>
        <div class={`dr-name-row ${noun ? 'done' : ''}`}>{choices.noun.map(w => <button key={w} class={`tablet dr-name-word ${noun === w ? 'right' : ''}`} aria-label={w} onClick={() => pick('noun', w)}>{cap(w)}</button>)}</div>
      </div>
    </div>
  );
}
