// Home: one Play tile, the biggest thing on the screen (a dark sea where a beam of light finds a glowing fish, and ▶ is the round
// window of a porthole; every Round mixes the kinds he has opened), the Dock tile with his submarine (and his Dives), the Logbook tile
// with the last animals he photographed and how many of the sixty he has, and a board with his Level in each kind. Tapping a kind
// says its name, and a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { AnimalPic, SubArt } from './art/Pics';
import { lookOf } from './dock/dock';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { startRound } from './round';
import { ANIMALS } from './sea/animals';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { see: '🔦', through: '🪟', sound: '🥁', shadow: '👤', mirror: '🪞', signal: '🗼' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, dock = state.dock;
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
      <header class="home-head"><h1>Deep Light</h1>{status}</header>
      <div class="home dl-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="play-sea" aria-hidden="true"><span class="play-beam" /><AnimalPic id="lanternfish" class="play-fish" /></span>
          <span class="spot porthole"><span class="e">▶</span></span>
        </button>
        <button class="tile t-dock" aria-label="Dock" onClick={() => { if (voice.active) screen.value = 'dock'; }}>
          <span class="dl-signrow"><span class="nm dl-sign">Dock</span>{dock.dives > 0 && <span class="call-badge" aria-hidden="true">🌊{dock.dives}</span>}</span>
          <span class="dock-water" aria-hidden="true"><SubArt look={lookOf(dock)} /></span>
        </button>
        <button class="tile t-logbook" aria-label="Logbook" onClick={() => { if (voice.active) screen.value = 'logbook'; }}>
          <span class="dl-signrow"><span class="nm dl-sign">Logbook</span><span class="log-count">{dock.photos.length}/{ANIMALS.length}</span></span>
          <span class="log-peek" aria-hidden="true">
            {dock.photos.slice(-3).map(id => <AnimalPic key={id} id={id} />)}
            {!dock.photos.length && <span class="emo">📷</span>}
          </span>
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
