// Home: the Helipad tile with his helicopter, one Play tile (every Round mixes all the kinds of question he has opened), and a
// board with his Level in each kind. The board is drawn flat, as a chart rather than more buttons, so it doesn't read as
// something to press; tapping a kind still says its name, and a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { equalPicture, leftOf, Picture } from './fractions/Picture';
import { player } from './game';
import { HELI_NAMES } from './hangar/catalog';
import { HeliArt } from './hangar/HeliArt';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { MODE_ICONS } from './modes';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), s = player.state.value, modes = s.learning.modes, heli = s.helipad.heli ?? 'uh60';
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
      <header class="home-head"><h1>Chop Chop</h1>{status}</header>
      <div class="home flies">
        <button class="tile t-garage t-hangar" aria-label="Helipad" onClick={() => { if (voice.active) { screen.value = 'helipad'; void voice.say(HELI_NAMES[heli]); } }}>
          <HeliArt heli={heli} color="#e8edf2" class="home-jet" />
          <span class="nm">🚁 Helipad</span>
        </button>
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="tile-clock"><Picture picture={equalPicture('pizza', 4)} left={leftOf(3)} /></span>
          <span class="e">▶</span>
        </button>
        <div class="tile t-kinds" role="list" aria-label="My Levels">
          <h2 class="kinds-head">🏆 My Levels</h2>
          {MODE_IDS.map(id => {
            const m = modes[id];
            return (
              <div key={id} role="listitem" class={`kind ${m.opened ? '' : 'locked'} ${m.opened && m.fresh ? 'fresh' : ''}`} aria-label={MODE_NAMES[id]} onClick={() => tap(id)}>
                <span class="ki">{m.opened ? MODE_ICONS[id] : '🔒'}</span>
                <span class="kb">
                  <span class="kn">{MODE_NAMES[id]}</span>
                  <LevelDots level={m.opened ? m.level : 0} />
                </span>
                {m.opened && m.starred && <span class="badge">⭐</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
