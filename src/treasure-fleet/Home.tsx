// Home: one Play tile, the biggest thing on the screen (every Round mixes the kinds he has opened), the Shipyard tile with his ship on
// it, the Hoard tile with his treasure count, and a board with his Level in each kind. Tapping a kind says its name, and a locked one
// says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { ShipView } from './art/ShipView';
import { ISLANDS } from './fleet/islands';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { where: '📍', key: '🗝️', grid: '🔢', clue: '👣', above: '🦅' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, fleet = state.fleet;
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
      <header class="home-head"><h1>Treasure Fleet</h1>{status}</header>
      <div class="home tf-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>
        <button class="tile t-yard" aria-label="Shipyard" onClick={() => { if (voice.active) screen.value = 'shipyard'; }}>
          <ShipView ship={fleet.ship} label={null} /><span class="nm">Shipyard</span>
          {fleet.voyages > 0 && <span class="voyage-badge" aria-hidden="true">⛵{fleet.voyages}</span>}
        </button>
        <button class="tile t-hoard" aria-label="Hoard" onClick={() => { if (voice.active) screen.value = 'hoard'; }}>
          <span class="hoard-pile" aria-hidden="true">{fleet.hoard.length ? fleet.hoard.slice(-3).map(id => ISLANDS.find(i => i.id === id)!.art).join('') : '🗝️'}</span>
          <span class="nm">Hoard {fleet.hoard.length}/{ISLANDS.length}</span>
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
