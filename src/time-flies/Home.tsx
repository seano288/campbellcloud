// Home: the Hangar tile with his plane, and a tile for each clock Game Mode with its Level. A locked mode says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { ClockFace } from './clock/ClockFace';
import { player } from './game';
import { JET_NAMES } from './hangar/catalog';
import { JetArt } from './hangar/JetArt';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { MODE_ICONS } from './modes';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

const TILE_TIME: Record<ModeId, number> = { find: 180, read: 555, set: 615 };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), s = player.state.value, modes = s.learning.modes, jet = s.hangar.jet ?? 'p51';
  useEffect(() => { // a newly opened mode says so again until he taps it
    const fresh = MODE_IDS.filter(m => modes[m].opened && modes[m].fresh);
    if (fresh.length) void voice.sayMore(...fresh.map(m => `You opened ${MODE_NAMES[m]}!` as const));
  }, []);
  function tap(id: ModeId) {
    if (!voice.active) return;
    if (!modes[id].opened) { sBad(); if (id !== 'find') void voice.say(LOCKED_HINTS[id]); return; }
    startRound(id);
  }
  return (
    <div class="screen home-screen">
      <header class="home-head"><h1>Time Flies</h1>{status}</header>
      <div class="home">
        <button class="tile t-garage t-hangar" aria-label="Hangar" onClick={() => { if (voice.active) { screen.value = 'hangar'; void voice.say(JET_NAMES[jet]); } }}>
          <JetArt jet={jet} color="#e8edf2" class="home-jet" />
          <span class="nm">🛩️ Hangar</span>
        </button>
        {MODE_IDS.map((id, i) => {
          const m = modes[id];
          return (
            <button key={id} class={`tile mode t-${['learn', 'count', 'pay'][i]} ${m.opened ? '' : 'locked'} ${m.opened && m.fresh ? 'fresh' : ''}`} aria-label={MODE_NAMES[id]}
              onClick={() => tap(id)}>
              <span class="tile-clock"><ClockFace minutes={TILE_TIME[id]} glide={false} /></span>
              <span><span class="nm">{MODE_ICONS[id]} {MODE_NAMES[id]}</span><br /><LevelDots level={m.level} /></span>
              {!m.opened ? <span class="lock">🔒</span> : m.starred && <span class="badge">⭐</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
