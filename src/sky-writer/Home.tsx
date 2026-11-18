// Home: one Play tile, the biggest thing on the screen (a strip of sky with the three writing lines as contrails and his biplane
// finishing a smoke "a" on the left, the ▶ on the right; every Round mixes the kinds he has opened), the Airfield tile with his plane, the Show tile with
// how many Shows he has, the Wall, and his Level in each kind. Tapping a kind says its name, and a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { PlanePic } from './art/PlanePic';
import { nextShow } from './airfield/state';
import { player } from './game';
import { playArt } from './icon';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { goShow, screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { trace: '✏️', start: '🟢', flip: '🔄', size: '📏', write: '✍️', word: '🔤' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, a = state.airfield;
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
      <header class="home-head"><h1>Sky Writer</h1>{status}</header>
      <div class="home sw-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="sw-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: playArt() }} />
          <span class="spot"><span class="e">▶</span></span>
        </button>
        <button class="tile t-airfield" aria-label="Airfield" onClick={() => { if (voice.active) screen.value = 'airfield'; }}>
          <PlanePic a={a} /><span class="nm">Airfield</span>
        </button>
        <button class={`tile t-show ${a.shows ? '' : 'empty'}`} aria-label="Show" onClick={() => { if (!voice.active) return; if (a.shows) goShow(nextShow(a)); else void voice.say('Play a Round to earn a Show!'); }}>
          <span class="e" aria-hidden="true">🛩️</span><span class="nm">Show</span>
          {a.shows > 0 && <span class="show-badge" aria-hidden="true">✈️{a.shows}</span>}
        </button>
        <button class="tile t-wall" aria-label="Wall" onClick={() => { if (voice.active) screen.value = 'wall'; }}>
          <span class="e" aria-hidden="true">🖼️</span><span class="nm">Wall</span>
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
