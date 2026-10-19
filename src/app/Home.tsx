import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { game } from '../game/store';
import type { MODES } from '../modes/modes';
import { startRound } from '../round/round';
import { LevelDots } from '../ui/bits';
import { TOP_LEVEL } from '../modes/progress';
import type { RewardPresentation } from '../rewards/presentation';
import { useVoice } from '../voice/context';
import type { VoiceScope } from '../voice/say';
import { screen } from './nav';

function tapMode(mode: (typeof MODES)[number], voice: VoiceScope) {
  if (!voice.active) return;
  const m = game.value.modes[mode.id];
  if (!m.opened) { sBad(); if (mode.lockedHint) void voice.say(mode.lockedHint); return; }
  startRound(mode.id);
}

export function Home({ reward, status, modes, title }: { reward: RewardPresentation; status: ComponentChildren; modes: typeof MODES; title: string }) {
  const voice = useVoice(), { sayMore } = voice;
  const s = game.value;
  useEffect(() => { // a newly opened mode says so again until he taps it
    const fresh = modes.filter(m => s.modes[m.id].opened && s.modes[m.id].fresh);
    if (fresh.length) void sayMore(...fresh.map(m => `You opened ${m.name}!` as const));
  }, []);
  return (
    <div class="screen home-screen">
      <header class="home-head">
        <h1>{title}</h1>
        {status}
      </header>
      <div class="home">
        <reward.Entry onOpen={() => { screen.value = 'garage'; }} />
        {modes.map(mode => {
          const { id, name, icon } = mode;
          const m = s.modes[id];
          return (
            <button key={id} class={`tile mode t-${id} ${m.opened ? '' : 'locked'} ${m.opened && m.fresh ? 'fresh' : ''}`} aria-label={name} onClick={() => tapMode(mode, voice)}>
              <span class="e">{icon}</span>
              <span><span class="nm">{name}</span><br /><LevelDots level={m.level} of={TOP_LEVEL} /></span>
              {!m.opened ? <span class="lock">🔒</span> : m.starred && <span class="badge">⭐</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
