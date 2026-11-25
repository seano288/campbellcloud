// Home: one Play tile, the biggest thing on the screen: his coaster on a summer evening with the big green go in front of it (every Round
// mixes the kinds he has opened). The Coaster Yard tile shows his park with his Rides waiting; the next Guest Coaster and his rank sit on a
// ticket; and a board shows his Level in each kind. Tapping a kind says its name; a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { guest, WEATHER_NAMES } from './coaster/guest';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { coasterOf, rankOf } from './park/yard';
import { CoasterThumb } from './ride/RideScreen';
import { startRound } from './round';
import { useVoice } from './voice';
import { guestLabel } from './yard/names';

export const MODE_ICONS: Record<ModeId, string> = { push: '👐', hill: '⛰️', heavy: '🏋️', rough: '🧊', bump: '🎱', magnet: '🧲' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, y = state.yard, g = guest(y.guest), rank = rankOf(y.riders);
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
    <div class="screen home-screen cc-home-screen">
      <header class="home-head"><h1>Coaster Crew</h1>{status}</header>
      <div class="home cc-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <CoasterThumb pieces={coasterOf(y).pieces} style={y.style} weather={y.night ? 'night' : 'sunset'} theme={y.theme} />
          <span class="e">▶</span>
        </button>
        <button class="tile t-base" aria-label="Coaster Yard" onClick={() => { if (voice.active) screen.value = 'yard'; }}>
          <span class="cc-awning" aria-hidden="true" /><span class="cc-yard-art" aria-hidden="true">🎡🎠🎢</span>
          <span class="nm">Coaster Yard</span>
          {y.rides > 0 && <span class="race-badge" aria-hidden="true">🎢 {y.rides}</span>}
        </button>
        <div class="tile t-next" aria-label="Next Guest Coaster">
          <span class="cc-next-pic" aria-hidden="true"><CoasterThumb pieces={g.pieces} style={g.style} weather={g.weather} /></span>
          <span class="next-words">
            <span class="board-head" aria-hidden="true">🎟️ Next</span>
            <span class="nd-name" aria-hidden="true">{guestLabel(g.n)}</span>
            <span class="cup-count" aria-hidden="true">{WEATHER_NAMES[g.weather]} · 🎖️ {rank.name}{rank.number ? ` ${rank.number}` : ''}</span>
          </span>
        </div>
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
