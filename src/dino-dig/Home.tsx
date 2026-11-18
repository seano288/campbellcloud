// Home: one Play tile, the biggest thing on the screen (a dig site in the sun, like the icon: the T. rex skull half out of the dirt, a
// letter tile beside it and the ▶ over them; every Round mixes the kinds he has opened), the Museum tile with his newest dinosaur (alive, or the skeleton so far), the Dig tile with how many Digs he has, the
// Shop, and his Level in each kind. Tapping a kind says its name, and a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { DinoPic } from './art/DinoPic';
import { skullSvg } from './icon';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { goDig, screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { read: '📖', hear: '👂', swap: '🔁', real: '🤔', sentence: '🖼️' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, m = state.museum;
  useEffect(() => { // a newly opened kind says so again until he plays a Round
    const fresh = MODE_IDS.filter(id => modes[id].opened && modes[id].fresh);
    if (fresh.length) void voice.sayMore(...fresh.map(id => `You opened ${MODE_NAMES[id]}!` as const));
  }, []);
  function tap(id: ModeId) {
    if (!voice.active) return;
    if (modes[id].opened) { void voice.say(MODE_NAMES[id]); return; }
    sBad();
    if (id in LOCKED_HINTS) void voice.say(LOCKED_HINTS[id as keyof typeof LOCKED_HINTS]);
  }
  return (
    <div class="screen home-screen">
      <header class="home-head"><h1>Dino Dig</h1>{status}</header>
      <div class="home dd-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="dd-site" aria-hidden="true">
            <span class="dd-skull" dangerouslySetInnerHTML={{ __html: skullSvg() }} />
            <span class="dd-strata" />
            <span class="dd-tile-a">a</span>
            <span class="dd-fern">🌿</span>
          </span>
          <span class="spot"><span class="e">▶</span></span>
        </button>
        <button class="tile t-museum" aria-label="Museum" onClick={() => { if (voice.active) screen.value = 'museum'; }}>
          <DinoPic m={m} /><span class="nm">Museum</span>
        </button>
        <button class={`tile t-dig ${m.digs ? '' : 'empty'}`} aria-label="Dig" onClick={() => { if (!voice.active) return; if (m.digs) goDig(); else void voice.say('Play a Round to earn a Dig!'); }}>
          <span class="e" aria-hidden="true">⛏️</span><span class="nm">Dig</span>
          {m.digs > 0 && <span class="dig-badge" aria-hidden="true">🦴{m.digs}</span>}
        </button>
        <button class="tile t-shop" aria-label="Shop" onClick={() => { if (voice.active) screen.value = 'shop'; }}>
          <span class="e" aria-hidden="true">🛒</span><span class="nm">Shop</span>
        </button>
        <div class="tile t-kinds" role="group" aria-label="My Levels">
          <h2 class="kinds-head">My Levels</h2>
          {MODE_IDS.map(id => {
            const md = modes[id];
            return (
              <button key={id} class={`kind ${md.opened ? '' : 'locked'} ${md.opened && md.fresh ? 'fresh' : ''}`} aria-label={MODE_NAMES[id]} onClick={() => tap(id)}>
                <span class="ki">{md.opened ? MODE_ICONS[id] : '🔒'}</span>
                <span class="kb"><span class="kn">{MODE_NAMES[id]}</span><LevelDots level={md.opened ? md.level : 0} /></span>
                {md.opened && md.starred && <span class="badge">⭐</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
