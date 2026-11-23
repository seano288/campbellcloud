// Home: one Play tile, the biggest thing on the screen (every Round mixes the kinds he has opened), the Airport tile with his airport on
// it and his Flights, the Routes tile with the next place he flies to, and a board with his Level in each kind. Tapping a kind says its
// name; a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { AirportView } from './airport/AirportScreen';
import { liveryOf, planFlight, rankOf } from './airport/airport';
import { lookOf } from './art/plane';

const RAINBOW = 'linear-gradient(90deg,#e63946,#ff7a00,#ffd23f,#2fa84f,#2f8fe8,#7b4bd1)';
const css = (hex: string) => (hex === 'rainbow' ? RAINBOW : hex);
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { add: '🧍', hundreds: '💺', take: '🧳', hop: '🦘', gap: '🛒' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, a = state.airport, next = planFlight(a).dest, rank = rankOf(a.passengers);
  const look = lookOf(a.flying, liveryOf(a, a.flying), a.airline.mark);
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
    <div class="screen home-screen jw-home-screen">
      <header class="home-head"><h1>Jetway</h1>{status}</header>
      <div class="home jw-home">
        {/* Play is the door of his own plane, where the jet bridge meets it */}
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="apron" aria-hidden="true" />
          <span class="fuselage" aria-hidden="true" style={{ '--body': css(look.base), '--cheat': css(look.trim === look.base ? '#ff7a00' : look.trim) } as Record<string, string>}><i class="cockpit" /><i class="windows" /><i class="cheat" /></span>
          <span class="jet-bridge" aria-hidden="true"><i /></span>
          <span class="e">▶</span>
        </button>
        <button class="tile t-airport" aria-label="Airport" onClick={() => { if (voice.active) screen.value = 'airport'; }}>
          <AirportView a={a} class="mini" /><span class="nm">Airport</span>
          {a.flights > 0 && <span class="race-badge" aria-hidden="true">✈️{a.flights}</span>}
        </button>
        <button class="tile t-routes" aria-label="Routes" onClick={() => { if (voice.active) screen.value = 'routes'; }}>
          {/* a departures board: where his next Flight goes */}
          <span class="board-head" aria-hidden="true">✈ Departures</span>
          <span class="next-dest" aria-hidden="true"><span class="nd-icon">{next.icon}</span><span class="nd-name">{next.name}</span></span>
          <span class="nm">Routes</span><span class="cup-count" aria-hidden="true">🧍 {rank.name}</span>
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
