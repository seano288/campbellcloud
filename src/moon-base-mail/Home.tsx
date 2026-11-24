// Home: one Play tile, the biggest thing on the screen (every Round mixes the kinds he has opened): a letter from the base, sealed with
// a green ▶, under the Earth. The Moon Base tile shows his base standing on the moon, with his Landings waiting, and a board holds his
// Level in each kind. Tapping a kind says its name; a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { BaseSkyline, Lander, Stamp } from './art/bits';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { ask: '✉️', order: '🔢', main: '💡', infer: '🔍', fact: '📋' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, b = state.base;
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
    <div class="screen home-screen mb-home-screen">
      <header class="home-head"><h1>Moon Base Mail</h1>{status}</header>
      <div class="home mb-home">
        {/* Play is a letter from the base, sealed with ▶ */}
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="mb-envelope" aria-hidden="true">
            <i class="flap"><i /></i><Stamp size={44} /><i class="addr" />
            <span class="e">▶</span>
          </span>
        </button>
        <button class="tile t-base" aria-label="Moon Base" onClick={() => { if (voice.active) screen.value = 'base'; }}>
          <BaseSkyline b={b} />
          <span class="nm">Moon Base</span>
          {b.landings > 0 && <span class="mb-landings" aria-hidden="true"><Lander size={26} />{b.landings}</span>}
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
