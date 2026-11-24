// Home: one Play tile, the biggest thing on the screen (every Round mixes the kinds he has opened), the Port tile with his port on it and
// his Ships to load, the Sea Chart tile with the next harbour, and a board with his Level in each kind. Tapping a kind says its name; a
// locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { BoxView } from './art/BoxView';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { PortView } from './port/PortView';
import { nextHarbour, rankOf } from './port/port';
import { startRound } from './round';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { count: '🔢', build: '🚢', split: '✂️', read: '👀', r: '🦜', addon: '🔩' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, p = state.port, next = nextHarbour(p), rank = rankOf(p.tonnes);
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
    <div class="screen home-screen cw-home-screen">
      <header class="home-head"><h1>Cargo Words</h1>{status}</header>
      <div class="home cw-home">
        {/* Play is a container on the grab, ready to lift */}
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="cw-play-grab" aria-hidden="true"><i class="cable" /><i class="spreader" /><BoxView text="play" hex="#c8452f" /></span>
          <span class="e">▶</span>
        </button>
        <button class="tile t-port" aria-label="Port" onClick={() => { if (voice.active) screen.value = 'port'; }}>
          <PortView p={p} class="mini" /><span class="nm">Port</span>
          {p.ships > 0 && <span class="race-badge" aria-hidden="true">🚢{p.ships}</span>}
        </button>
        <button class="tile t-chart" aria-label="Sea Chart" onClick={() => { if (voice.active) screen.value = 'chart'; }}>
          <span class="board-head" aria-hidden="true">🧭 Next</span>
          <span class="next-dest" aria-hidden="true"><span class="nd-icon">{next.icon}</span><span class="nd-name">{next.name}</span></span>
          <span class="nm">Sea Chart</span><span class="cup-count" aria-hidden="true">⚖️ {rank.name}{rank.number ? ` ${rank.number}` : ''}</span>
        </button>
        <div class="tile t-kinds" role="group" aria-label="My Levels">
          <h2 class="kinds-head">My Levels</h2>
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
