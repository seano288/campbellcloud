// Home: the cockpit of his plane. A windshield of sky with the title and his Bolts, and below it the instrument panel:
// the big clock gauge is Play (every Round mixes all the kinds of question he has opened), a porthole shows his plane
// and opens the Hangar, and the Levels panel has a row of lamps for each kind. Tapping a kind says its name, and a
// locked one says what opens it. Tapping the clock spins its hands forward (time flies!) before the Round starts.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sBad, sWhoosh } from '../audio/sfx';
import { ClockFace } from './clock/ClockFace';
import { player } from './game';
import { JET_NAMES } from './hangar/catalog';
import { JetArt } from './hangar/JetArt';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeId } from './learning';
import { MODE_ICONS } from './modes';
import { screen } from './nav';
import { reducedMotion } from './motion';
import { startRound } from './round';
import { useVoice } from './voice';

const SHOWN = 610; // 10:10, the hands apart like a smile and clear of the 12

export function Home({ status }: { status: ComponentChildren }) {
  const voice = useVoice(), s = player.state.value, modes = s.learning.modes, jet = s.hangar.jet ?? 'p51';
  const [minutes, setMinutes] = useState(SHOWN);
  const [going, setGoing] = useState(false);
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
  function play() {
    if (!voice.active || going) return;
    if (reducedMotion()) { startRound(); return; }
    setGoing(true);
    setMinutes(SHOWN + 150); // two and a half turns of the long hand
    sWhoosh(0.6);
    setTimeout(() => { if (voice.active) startRound(); }, 650);
  }
  return (
    <div class="screen home-screen cockpit">
      <header class="windshield">
        {['a', 'b'].map(k => (
          <svg key={k} class={`cloud ${k}`} viewBox="44 42 90 56" aria-hidden="true">
            <g fill="#fff"><circle cx="62" cy="80" r="16" /><circle cx="86" cy="68" r="24" /><circle cx="114" cy="76" r="18" /><rect x="46" y="76" width="86" height="20" rx="10" /></g>
          </svg>
        ))}
        <h1>Time Flies</h1>
        <div class="status">{status}</div>
      </header>
      <div class="panel">
        <button class={`gauge play ${going ? 'going' : ''}`} aria-label="Play" onClick={play}>
          <span class="gauge-clock"><ClockFace minutes={minutes} glide={going} /></span>
          <span class="placard go inner" aria-hidden="true"><span>▶</span> Play</span>
        </button>
        <button class="placard go" aria-hidden="true" tabIndex={-1} onClick={play}><span>▶</span> Play</button>
        <button class="gauge hangar" aria-label="Hangar" onClick={() => { if (voice.active) { screen.value = 'hangar'; void voice.say(JET_NAMES[jet]); } }}>
          <span class="porthole"><JetArt jet={jet} color="#e8edf2" class="home-jet" /></span>
          <span class="placard">Hangar</span>
        </button>
        <section class="levels" aria-labelledby="levels-head">
          <h2 id="levels-head" class="placard small">My Levels</h2>
          <div class="lamp-rows">
            {MODE_IDS.map(id => {
              const m = modes[id], name = MODE_NAMES[id];
              return (
                <button key={id} class={`lamp-row ${m.opened ? '' : 'locked'} ${m.opened && m.fresh ? 'fresh' : ''}`}
                  aria-label={m.opened ? `${name}, Level ${m.level}${m.starred ? ', star' : ''}` : `${name}, locked`} onClick={() => tap(id)}>
                  <span class="ki" aria-hidden="true">{m.opened ? MODE_ICONS[id] : '🔒'}</span>
                  <span class="kb">
                    <span class="kn">{name}</span>
                    <span class="lamps" aria-hidden="true">{[1, 2, 3].map(l => <i key={l} class={m.opened && l <= m.level ? 'on' : ''} />)}</span>
                  </span>
                  {m.opened && m.starred && <span class="badge" aria-hidden="true">⭐</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
