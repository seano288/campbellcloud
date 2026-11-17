// Home: one Play tile, the biggest thing on the screen (a fire-alarm call box whose big green button is ▶; every Round mixes the
// kinds he has opened), the Station tile (his truck in its bay, and his Calls), the Town tile (the buildings he has saved), and a
// board with his Level in each kind. Tapping a kind says its name, and a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { TruckArt } from './art/TruckArt';
import { SCENES } from './call/scenes';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { startRound } from './round';
import { lookOf } from './station/station';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { join: '🧩', opposite: '↔️', sort: '🧺', ending: '➕', strong: '💪' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, st = state.station;
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
  const town = SCENES.filter(s => st.answered.includes(s.id));
  return (
    <div class="screen home-screen">
      <header class="home-head"><h1>Hook and Ladder</h1>{status}</header>
      <div class="home hl-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="callbox" aria-hidden="true"><span class="callbox-top">FIRE</span><span class="spot"><span class="e">▶</span></span></span>
        </button>
        <button class="tile t-station" aria-label="Station" onClick={() => { if (voice.active) screen.value = 'station'; }}>
          <span class="nm">Station</span>
          <span class="bay-door" aria-hidden="true"><TruckArt look={lookOf(st)} /></span>
          {st.calls > 0 && <span class="call-badge" aria-hidden="true">🚒{st.calls}</span>}
        </button>
        <button class="tile t-town" aria-label="Town" onClick={() => { if (voice.active) screen.value = 'town'; }}>
          <span class="mini-town" aria-hidden="true">{town.length ? town.slice(-6).map(s => <span key={s.id}>{s.badge}</span>) : <span class="empty">🏗️</span>}</span>
          <span class="nm">Town</span>
        </button>
        <div class="tile t-kinds" role="group" aria-label="My Levels">
          <h2 class="kinds-head">My Levels</h2>
          {MODE_IDS.map(id => {
            const m = modes[id];
            return (
              <button key={id} class={`kind ${m.opened ? '' : 'locked'} ${m.opened && m.fresh ? 'fresh' : ''}`} aria-label={MODE_NAMES[id]} onClick={() => tap(id)}>
                <span class="ki" aria-hidden="true">{m.opened ? MODE_ICONS[id] : '🔒'}</span>
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
