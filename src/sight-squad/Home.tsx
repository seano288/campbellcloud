// Home: one Play tile, the biggest thing on the screen (every Round mixes all the kinds of question he has opened), with
// the newest word he has met on it; the Camp tile with one row of his army on the ground; and a board with his Level in
// each kind and how many words he has met. The board is
// drawn flat, as a chart rather than more buttons, so it doesn't read as something to press; tapping a kind still says its
// name, and a locked one says what opens it.
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad } from '../audio/sfx';
import { LevelDots } from '../ui/bits';
import { colourHex } from './camp/actions';
import { armySize } from './camp/camp';
import { UNIT_IDS, type UnitId } from './camp/catalog';
import { UnitArt } from './camp/UnitArt';
import { player } from './game';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { MODE_ICONS } from './modes';
import { screen } from './nav';
import { startRound } from './round';
import { useVoice } from './voice';

const ARMY_ROW = 7;

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), s = player.state.value, modes = s.learning.modes, camp = s.camp, team = colourHex(camp);
  const newest = s.learning.words.at(-1);
  // his army on the Camp tile: one row of up to seven, one of each Squad first
  const squads = UNIT_IDS.filter(u => camp.army[u] > 0).slice(0, ARMY_ROW);
  const shown: UnitId[] = [...squads];
  for (let k = 1; shown.length < ARMY_ROW && k < 24; k++) for (const u of squads) if (camp.army[u] > k && shown.length < ARMY_ROW) shown.splice(shown.lastIndexOf(u) + 1, 0, u);
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
      <header class="home-head"><h1>Sight Squad</h1>{status}</header>
      <div class="home squad">
        <button class="tile t-play" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}>
          {newest && <span class="tile-word"><span class="sw">{newest}</span></span>}
          <span class="e">▶</span>
        </button>
        <button class="tile t-garage t-hangar t-camp" aria-label="Camp" onClick={() => { if (voice.active) { screen.value = 'camp'; void voice.say('Camp!'); } }}>
          <span class="home-army">{shown.map((u, i) => <UnitArt key={i} unit={u} color={team} />)}</span>
          <span class="nm">⛺ Camp · 🪖 {armySize(camp)}</span>
        </button>
        <div class="tile t-kinds" role="group" aria-label="My Levels">
          <h2 class="kinds-head">🏆 My Levels</h2>
          <div class="kind words-met" aria-label={`${s.learning.words.length} words`}>
            <span class="ki">📖</span><span class="kb"><span class="kn">{s.learning.words.length} words</span></span>
          </div>
          {MODE_IDS.map(id => {
            const m = modes[id];
            return (
              <button key={id} class={`kind ${m.opened ? '' : 'locked'} ${m.opened && m.fresh ? 'fresh' : ''}`} aria-label={MODE_NAMES[id]} onClick={() => tap(id)}>
                <span class="ki">{m.opened ? MODE_ICONS[id] : '🔒'}</span>
                <span class="kb">
                  <span class="kn">{MODE_NAMES[id]}</span>
                  <LevelDots level={m.opened ? m.level : 0} />
                </span>
                {m.opened && m.starred && <span class="badge">⭐</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
