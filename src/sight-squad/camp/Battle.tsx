// The Battle: a troop of wind-up toy robots clanks across the mat and lines up facing his army. When they're ready, a big
// "go" (the word, to read) appears; tapping it sends his army forward throwing its Boom. Robots that are hit topple over
// and bounce back up dented, and go poof in confetti the second time; his soldiers that are hit fall over and spring right
// back up. It always ends with all the robots gone and his army jumping for joy. ✕ goes back to the Camp at any time.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sCheer, sFanfare } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { useVoiceScope } from '../voice';
import { sBounce, sHit, sPoof, sThrow, sTopple, sWindUp } from './sounds';
import type { CampStage } from './three/stage';

export function Battle({ stage, boom, onClose }: { stage: CampStage; boom: number; onClose(): void }) {
  const voice = useVoiceScope();
  const [phase, setPhase] = useState<'lining-up' | 'ready' | 'fight' | 'won'>('lining-up');
  const lastThrow = useRef(0);
  useEffect(() => {
    stage.onEvent = e => {
      if (!voice.active) return;
      const now = performance.now();
      if (e === 'ready') { setPhase('ready'); void voice.say('Tap go to start!'); }
      else if (e === 'throw') { if (now - lastThrow.current > 90) { lastThrow.current = now; sThrow(boom); } } // a big army doesn't deafen him
      else if (e === 'hit') sHit(boom);
      else if (e === 'topple') sTopple();
      else if (e === 'poof') sPoof();
      else if (e === 'bounce') sBounce();
      else if (e === 'won') { setPhase('won'); sFanfare(); sCheer(); confetti(50, voice.signal); void voice.say('You won!', 'Hooray!'); }
    };
    stage.battleOn(true);
    sWindUp();
    void voice.say('Battle!', 'Here come the robots!');
    return () => { stage.onEvent = null; stage.battleOn(false); };
  }, []);
  function go() {
    if (!voice.active || phase !== 'ready') return;
    setPhase('fight');
    stage.charge();
    void voice.say('go', 'Charge!');
  }
  return (
    <div class={`show-overlay battle ${phase}`}>
      <div class="showname">{phase === 'won' ? '🏆' : '💥'}</div>
      <button class="show-x" aria-label="Back to Camp" onClick={onClose}>✕</button>
      {phase === 'ready' && <button class="word-btn order go-word pulse" aria-label="go" onClick={go}><span class="sw">go</span></button>}
    </div>
  );
}
