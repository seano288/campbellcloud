// Home: one Play tile, the biggest thing on the screen: his dragon flying over the mountain at dawn (every Round mixes the kinds he has
// opened). The Roost tile shows his eggs and his Flights waiting; the next place to fly sits beside it; and a board shows his Level in
// each kind. Tapping a kind says its name; a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { DragonCanvas } from './art/DragonCanvas';
import { eggPic } from './art/dragon';
import { course } from './flight/course';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { openedLine } from './phrases';
import { lookOfEgg, shownName } from './roost/dragons';
import { hatchNeed, lookOf, rankOf, riding } from './roost/roost';
import { startRound } from './round';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { noun: '🏷️', verb: '🏃', adj: '🎨', plural: '🐭', past: '📅', squeeze: '🤏', capital: '🔠' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, a = state.roost, d = riding(a), next = course(a.reached + 1), rank = rankOf(a.flown);
  useEffect(() => { // a newly opened kind says so again until he plays a Round
    const fresh = MODE_IDS.filter(m => modes[m].opened && modes[m].fresh);
    if (fresh.length) void voice.sayMore(...fresh.map(openedLine));
  }, []);
  function tap(id: ModeId) {
    if (!voice.active) return;
    if (modes[id].opened) { void voice.say(MODE_NAMES[id]); return; }
    sBad();
    if (id in LOCKED_HINTS) void voice.say(LOCKED_HINTS[id as keyof typeof LOCKED_HINTS]);
  }
  return (
    <div class="screen home-screen dr-home-screen">
      <header class="home-head"><h1>Dragon Roost</h1>{status}</header>
      <div class="home dr-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <DragonCanvas look={lookOf(d)} opts={{ act: 'fly', flap: 2.4, stage: 2 }} class="dr-play-dragon" label={shownName(d.name)} />
          <span class="e">▶</span>
        </button>
        <button class="tile t-roost" aria-label="Roost" onClick={() => { if (voice.active) screen.value = 'roost'; }}>
          <span class="dr-tile-eggs" aria-hidden="true">
            {a.eggs.slice(0, 4).map((e, i) => <img key={i} src={eggPic(lookOfEgg(e.egg), 64, Math.min(1, e.warmth / hatchNeed(a, e.egg)))} alt="" />)}
            {!a.eggs.length && <span class="dr-tile-mtn">🏔️</span>}
          </span>
          <span class="nm">Roost</span>
          {a.flights > 0 && <span class="race-badge" aria-hidden="true">🐉 {a.flights}</span>}
        </button>
        <div class="tile t-next" aria-label="Next Flight">
          <span class="board-head" aria-hidden="true">🗺️ Next</span>
          <span class="nd-name" aria-hidden="true">{next.name ?? `Flight ${next.n}`}</span>
          <span class="cup-count" aria-hidden="true">🎖️ {rank.name}{rank.number ? ` ${rank.number}` : ''}</span>
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
