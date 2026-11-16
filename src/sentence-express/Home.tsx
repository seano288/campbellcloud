// Home: one Play tile, the biggest thing on the screen (a railway signal whose big green lamp is ▶, with his train waiting at it on
// wooden toy track; every Round mixes the kinds he has opened), the Shed tile (the engine shed, his train in its doorway, and his
// Deliveries), the Layout tile with a little picture of his table, and a board with his Level in each kind. Tapping a kind says its
// name, and a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { TrainView } from './art/TrainView';
import { player } from './game';
import { LayoutThumb } from './layout/Thumb';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

const CLOUD = (c: string) => <svg class={`play-cloud ${c}`} viewBox="-4 -4 128 68" aria-hidden="true"><path d="M22 58 a18 18 0 0 1 2-34 a24 24 0 0 1 44-10 a20 20 0 0 1 32 16 a14 14 0 0 1 -2 28 z" fill="#fff" stroke="#1d1d1f" stroke-width="5" stroke-linejoin="round" /></svg>;

export const MODE_ICONS: Record<ModeId, string> = { order: '🚂', marks: '❗', mean: '🖼️', ask: '❓', fix: '🔧' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, t = state.trains;
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
      <header class="home-head"><h1>Sentence Express</h1>{status}</header>
      <div class="home se-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          {CLOUD('c1')}{CLOUD('c2')}
          <span class="play-rails" aria-hidden="true" />
          <span class="play-train" aria-hidden="true"><TrainView train={t} cars={2} label={null} /></span>
          <span class="signal" aria-hidden="true"><span class="signal-post" /><span class="spot"><span class="e">▶</span></span></span>
        </button>
        <button class="tile t-shed" aria-label="Shed" onClick={() => { if (voice.active) screen.value = 'shed'; }}>
          <span class="nm">Shed</span>
          <span class="shed-door" aria-hidden="true"><TrainView train={t} cars={1} label={null} /></span>
          {t.deliveries > 0 && <span class="call-badge" aria-hidden="true">📦{t.deliveries}</span>}
        </button>
        <button class="tile t-layout" aria-label="Layout" onClick={() => { if (voice.active) screen.value = 'layout'; }}>
          <LayoutThumb layout={t.layout} /><span class="nm">Layout</span>
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
