// Home: one Play tile, the biggest thing on the screen (a view over the wild, with ▶ as the big pad of a paw print; every Round mixes
// the kinds he has opened), the Garage tile with his truck parked at the ranger station (and his rescue calls), the Park tile with his
// animals standing in the meadow and how many are home, and a board with his Level in each kind. Tapping a kind says its name, and a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { GarageScene, ParkScene, PawToes, PlayScene } from './art/HomeArt';
import { AnimalPic, TruckView } from './art/Pics';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { RESCUE_TOTAL } from './park/rescue';
import { startRound } from './round';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { home: '🏞️', parts: '🦒', alive: '🌱', baby: '🐣', sky: '🌤️' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, rescue = state.rescue;
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
      <header class="home-head"><h1>Wild Rescue</h1>{status}</header>
      <div class="home wr-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <PlayScene />
          <span class="spot"><PawToes /><span class="e">▶</span></span>
        </button>
        <button class="tile t-garage" aria-label="Garage" onClick={() => { if (voice.active) screen.value = 'garage'; }}>
          <GarageScene />
          <TruckView truck={rescue.truck} label={null} /><span class="nm">Garage</span>
          {rescue.calls > 0 && <span class="call-badge" aria-hidden="true">📻{rescue.calls}</span>}
        </button>
        <button class="tile t-park" aria-label="Park" onClick={() => { if (voice.active) screen.value = 'park'; }}>
          <ParkScene />
          <span class="park-peek" aria-hidden="true">
            {rescue.park.slice(-4).map(id => <AnimalPic key={id} id={id} />)}
            {rescue.holding && <AnimalPic id={rescue.holding} class="held" />}
            {!rescue.park.length && !rescue.holding && <span class="pic emo">🌳</span>}
          </span>
          <span class="nm">Park {rescue.park.length}/{RESCUE_TOTAL}</span>
          {rescue.holding && <span class="call-badge" aria-hidden="true">🐾!</span>}
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
