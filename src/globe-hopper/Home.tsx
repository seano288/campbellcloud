// Home: one Play tile, the biggest thing on the screen: the Earth turning with his rocket in orbit round it (every Round mixes the kinds
// he has opened). The Rocket Base tile shows his base as he has built it, with his Launches waiting; the next photo mission sits on a
// little globe; and a board shows his Level in each kind. Tapping a kind says its name; a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { BaseCanvas } from './art/BaseCanvas';
import { sceneFor } from './art/base';
import { MiniGlobe } from './art/MiniGlobe';
import { PlayGlobe } from './art/PlayGlobe';
import { flyingKind, lookOf, rankOf } from './base/base';
import { mission, targetOf } from './base/missions';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { startRound } from './round';
import { targetLabel } from './base/labels';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { globe: '🌍', continent: '🗺️', ocean: '🌊', land: '⛰️', climate: '☀️', place: '🗽' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, b = state.base, next = mission(b.flown + 1), rank = rankOf(b.flown);
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
    <div class="screen home-screen gh-home-screen">
      <header class="home-head"><h1>Globe Hopper</h1>{status}</header>
      <div class="home gh-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <PlayGlobe look={lookOf(b, flyingKind(b))} />
          <span class="e">▶</span>
        </button>
        <button class="tile t-base" aria-label="Rocket Base" onClick={() => { if (voice.active) screen.value = 'base'; }}>
          <BaseCanvas scene={sceneFor(b)} opts={{ centerFlying: true, ground: .86, fit: true }} label="" class="gh-tile-base" />
          <span class="nm">Rocket Base</span>
          {b.launches > 0 && <span class="race-badge" aria-hidden="true">🚀 {b.launches}</span>}
        </button>
        <div class="tile t-next" aria-label="Next mission">
          <MiniGlobe at={targetOf(next.targets[0]!.id)} class="next-globe" />
          <span class="next-words">
            <span class="board-head" aria-hidden="true">📷 Next</span>
            <span class="next-dest" aria-hidden="true">{next.targets.map(t => <span key={t.id} class="nd-name">{targetLabel(t.id)}</span>)}</span>
            <span class="cup-count" aria-hidden="true">🎖️ {rank.name}{rank.number ? ` ${rank.number}` : ''}</span>
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
