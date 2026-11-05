// Home: one Play tile, the biggest thing on the screen (every Round mixes the kinds he has opened), the Workshop tile, and a
// board with his Level in each kind. The board is drawn flat, as a chart rather than more buttons; tapping a kind still says
// its name, and a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { BotView } from './bot/BotView';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { MODE_ICONS } from './modes';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), modes = player.state.value.learning.modes;
  useEffect(() => { // a newly opened kind says so again until he plays a Round
    const fresh = MODE_IDS.filter(m => modes[m].opened && modes[m].fresh);
    if (fresh.length) void voice.sayMore(...fresh.map(m => `You opened ${MODE_NAMES[m]}!` as const));
  }, []);
  function tap(id: ModeId) {
    if (!voice.active) return;
    if (modes[id].opened) { void voice.say(MODE_NAMES[id]); return; }
    sBad();
    if (id in LOCKED_HINTS) void voice.say(LOCKED_HINTS[id as keyof typeof LOCKED_HINTS]);
  }
  return (
    <div class="screen home-screen">
      <header class="home-head"><h1>Math Bots</h1>{status}</header>
      <div class="home bots">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>
        <button class="tile t-workshop" aria-label="Workshop" onClick={() => { if (voice.active) { screen.value = 'reward'; } }}>
          <BotView build={player.state.value.workshop.build} /><span class="nm">Workshop</span>
          {player.state.value.workshop.charges > 0 && <span class="fights-badge" aria-hidden="true">⚡{player.state.value.workshop.charges}</span>}
        </button>
        <div class="tile t-kinds" role="group" aria-label="My Levels">
          <h2 class="kinds-head">🏆 My Levels</h2>
          {MODE_IDS.map(id => {
            const m = modes[id];
            return (
              <button key={id} class={`kind ${m.opened ? '' : 'locked'} ${m.opened && m.fresh ? 'fresh' : ''}`} aria-label={MODE_NAMES[id]} onClick={() => tap(id)}>
                <span class="ki">{m.opened ? MODE_ICONS[id] : '🔒'}</span>
                <span class="kb"><span class="kn">{MODE_NAMES[id]}</span><LevelDots level={m.opened ? m.level : 0} /></span>
                {m.opened && m.starred && <span class="badge">⭐</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
