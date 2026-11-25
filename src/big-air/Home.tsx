// Home: one Play tile, the biggest thing on the screen: his truck flying over a ruler (every Round mixes the kinds he has opened). The
// Arena tile shows his truck in the arena with his Jumps waiting; a card shows what the next Jump goes over and his record; and a board
// shows his Level in each kind. Tapping a kind says its name; a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { TruckPic } from './art/TruckPic';
import { courseOf, nextTarget, rankOf } from './arena/arena';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

export const MODE_ICONS: Record<ModeId, string> = { ruler: '📏', guess: '🤔', longer: '↔️', line: '🎯', story: '📖', units: '🔁' };

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), state = player.state.value, modes = state.learning.modes, a = state.arena, rank = rankOf(a.jumped);
  const course = courseOf(nextTarget(a)), best = a.records[0]?.feet ?? 0;
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
    <div class="screen home-screen ba-home-screen">
      <header class="home-head"><h1>Big Air</h1>{status}</header>
      <div class="home ba-home">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          <span class="play-art" aria-hidden="true"><TruckPic look={a.truck} pitch={14} class="play-truck" /><span class="play-ruler" /></span>
          <span class="e">▶</span>
        </button>
        <button class="tile t-arena" aria-label="Arena" onClick={() => { if (voice.active) screen.value = 'arena'; }}>
          <TruckPic look={a.truck} class="arena-truck" />
          <span class="nm">Arena</span>
          {a.jumps > 0 && <span class="race-badge" aria-hidden="true">🛻 {a.jumps}</span>}
        </button>
        <div class="tile t-next" aria-label="Next jump">
          <span class="board-head" aria-hidden="true">🎯 Next</span>
          <span class="next-dest" aria-hidden="true">{course.target.kind === 'show' ? `Show ${course.target.n}` : course.name}</span>
          <span class="next-feet" aria-hidden="true">{course.feet} ft</span>
          <span class="cup-count" aria-hidden="true">🏆 {best} ft · {rank.name}{rank.number ? ` ${rank.number}` : ''}</span>
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
