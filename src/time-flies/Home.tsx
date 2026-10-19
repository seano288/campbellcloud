// Home: the Hangar tile with his plane, one Play tile (every Round mixes all the kinds of question he has opened), and a
// board with his Level in each kind. Tapping a kind says its name; a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { ClockFace } from './clock/ClockFace';
import { player } from './game';
import { JET_NAMES } from './hangar/catalog';
import { JetArt } from './hangar/JetArt';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { MODE_ICONS } from './modes';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), s = player.state.value, modes = s.learning.modes, jet = s.hangar.jet ?? 'p51';
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
      <header class="home-head"><h1>Time Flies</h1>{status}</header>
      <div class="home flies">
        <button class="tile t-garage t-hangar" aria-label="Hangar" onClick={() => { if (voice.active) { screen.value = 'hangar'; void voice.say(JET_NAMES[jet]); } }}>
          <JetArt jet={jet} color="#e8edf2" class="home-jet" />
          <span class="nm">🛩️ Hangar</span>
        </button>
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="tile-clock"><ClockFace minutes={130} glide={false} /></span>
          <span class="e">▶</span>
        </button>
        <div class="tile t-kinds">
          {MODE_IDS.map(id => {
            const m = modes[id];
            return (
              <button key={id} class={`kind ${m.opened ? '' : 'locked'} ${m.opened && m.fresh ? 'fresh' : ''}`} aria-label={MODE_NAMES[id]} onClick={() => tap(id)}>
                <span class="ki">{m.opened ? MODE_ICONS[id] : '🔒'}</span>
                <span class="kn">{MODE_NAMES[id]}</span>
                <LevelDots level={m.opened ? m.level : 0} />
                {m.opened && m.starred && <span class="badge">⭐</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
