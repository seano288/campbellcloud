// Home: one Play tile, the biggest thing on the screen (every Round mixes the kinds he has opened), the Carrier tile with his ship on it
// and his Missions, the Chart tile with where the Voyage is and his rank, and a board with his Level in each kind. Tapping a kind says its
// name; a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { CarrierView } from './ship/ShipScreen';
import { planMission, rankOf, voyageChart } from './ship/ship';
import { chart } from './ship/missions';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';
import { MODE_ICONS } from './views';

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, a = state.ship;
  const plan = planMission(a), here = chart(voyageChart(a)), rank = rankOf(a.minutes);
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
    <div class="screen home-screen cd-home-screen">
      <header class="home-head"><h1>Carrier Deck</h1>{status}</header>
      <div class="home cd-home">
        {/* Play is the catapult's green light on the flight deck */}
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="flight-deck" aria-hidden="true"><i class="track" /><i class="steam" /></span>
          <span class="e">▶</span>
        </button>
        <button class="tile t-ship" aria-label="Carrier" onClick={() => { if (voice.active) screen.value = 'ship'; }}>
          <CarrierView a={a} class="mini" /><span class="nm">Carrier</span>
          {a.missions > 0 && <span class="race-badge" aria-hidden="true">🛫{a.missions}</span>}
        </button>
        <button class="tile t-chart" aria-label="Chart" onClick={() => { if (voice.active) screen.value = 'chart'; }}>
          <span class="board-head" aria-hidden="true">🗺️ Voyage</span>
          <span class="next-dest" aria-hidden="true"><span class="nd-icon">{here.icon}</span><span class="nd-name">{here.name}</span></span>
          <span class="nm">Chart</span><span class="cup-count" aria-hidden="true">{plan.m.patch.glyph} {rank.name}{rank.number ? ` ${rank.number}` : ''}</span>
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
