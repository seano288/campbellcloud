// The Parade: a bugle, and his army marches round the mat in a column behind the flag and the drums, the drum keeping the
// step. Along the bottom are the orders he can give: the command words he has met (go, stop, run, jump, look, come, down,
// up, play), written only, with no pictures, because reading them is the point. Tapping one reads it aloud and the army
// does it. It never earns or costs anything. ✕ marches them back into their rows ("Halt!" is said by the Camp, which outlives this).
import { useEffect } from 'preact/hooks';
import { sCheer } from '../../audio/sfx';
import { player } from '../game';
import { useVoiceScope } from '../voice';
import { sBugle, sStep } from './sounds';
import { COMMANDS, type CampStage, type Command } from './three/stage';

export function Parade({ stage, onClose }: { stage: CampStage; onClose(): void }) {
  const voice = useVoiceScope(), known = player.state.value.learning.words;
  const orders = COMMANDS.filter(c => (known as readonly string[]).includes(c));
  useEffect(() => {
    let left = true;
    stage.onEvent = e => { if (e === 'step' && voice.active) { sStep(left); left = !left; } };
    stage.parade(true);
    sBugle();
    void voice.say('Parade!', 'Forward, march!', ...(orders.length ? ['Tap a word to give an order!' as const] : []));
    return () => { stage.onEvent = null; stage.parade(false); };
  }, []);
  function order(c: Command) {
    if (!voice.active) return;
    stage.command(c);
    if (c === 'up' || c === 'play') sCheer();
    void voice.say(c);
  }
  return (
    <div class="show-overlay parade">
      <div class="showname">🎺</div>
      <button class="show-x" aria-label="Halt" onClick={onClose}>✕</button>
      {orders.length > 0 && (
        <div class="orders">
          {orders.map(c => <button key={c} class="word-btn order" onClick={() => order(c)}><span class="sw">{c}</span></button>)}
        </div>
      )}
    </div>
  );
}
