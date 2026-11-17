// The Cups: his trophy shelf and the way to every track. His car stands on the podium at the top, with "Watch it go" beside it (his
// car alone driving a lap of the last track he raced). Below, one shelf per Cup: its trophy (gold once he has won the Cup Final, an
// outline until then) and its four tracks, each a flag once he has beaten its Rival, open to race, or locked until the track before is
// beaten. Tapping an open track picks it for the next Race.
import { sChime, sClink, sNope } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { CurrencyPile } from '../../ui/currency';
import { CarView } from '../art/Art';
import { TALLY_CURRENCY } from '../branding';
import { isOpen, nextTrack, pickTrack, record } from '../garage/garage';
import { player, updateGarage } from '../game';
import { race, screen, watch } from '../nav';
import type { Phrase } from '../phrases';
import { featuredOn } from '../race/rivals';
import { CUPS, tracksIn } from '../race/tracks';
import { placeText } from '../tally/problems';
import { useVoice } from '../voice';
import { useEffect } from 'preact/hooks';

export function CupsScreen() {
  const voice = useVoice(), state = player.state.value, g = state.garage, to = nextTrack(g);
  useEffect(() => { void voice.say('Cups!', ...(g.cups.length === CUPS.length ? ['You won every Cup!' as const] : [])); }, []);
  return (
    <div class="screen cups-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Cups</h1>
        <IconButton label="Garage" class="garage-icon" onClick={() => { if (voice.active) screen.value = 'garage'; }}>🔧</IconButton>
        <CurrencyPile kind={TALLY_CURRENCY} count={state.currency.balance} />
      </header>
      <div class="cups-body">
        <section class="podium-side">
          <div class="podium">
            <CarView car={g.car} live label="Your race car on the podium" />
            <div class="podium-block"><span>1</span></div>
          </div>
          <div class="podium-go">
            {g.last && <button class="big-btn watch-btn" aria-label="Watch it go" onClick={() => { if (voice.active) watch(); }}><span aria-hidden="true">👀</span><span class="go-word">Watch</span></button>}
            <button class={`big-btn go race-btn ${g.races > 0 ? 'pulse' : 'short'}`} aria-label={`Race at ${to.name}`} onClick={() => {
              if (!voice.active) return;
              if (g.races <= 0) { sNope(); void voice.say('Play a Round to earn a Race!'); return; }
              race();
            }}><span class="race-flag" aria-hidden="true">🏁</span><span class="race-word">{to.name}</span><span class="race-count">{g.races}</span></button>
          </div>
        </section>
        <section class="shelves">
          {CUPS.map(cup => {
            const won = g.cups.includes(cup.id);
            return (
              <div key={cup.id} class={`cup-shelf c-${cup.id}`}>
                <button class={`cup-trophy ${won ? 'won' : ''}`} aria-label={cup.name} onClick={() => {
                  if (!voice.active) return;
                  if (won) { sChime(); void voice.say(cup.name, 'You won it!'); } else void voice.say(cup.name, 'Win the Cup Final to get it!');
                }}><span aria-hidden="true">🏆</span><span class="cup-name">{cup.name}</span></button>
                <div class="shelf-tracks">
                  {tracksIn(cup.id).map(t => {
                    const open = isOpen(g, t), rec = record(g, t), here = t.id === to.id;
                    return (
                      <button key={t.id} class={`track-btn ${open ? 'open' : 'locked'} ${rec.beaten ? 'beaten' : ''} ${here ? 'here' : ''}`} aria-label={t.name} onClick={() => {
                        if (!voice.active) return;
                        if (!open) { sNope(); void voice.say(t.name, 'Win the track before to open it!'); return; }
                        sClink();
                        updateGarage(x => pickTrack(x, t.id));
                        void voice.say(t.name, 'Next up', featuredOn(t).name as Phrase);
                      }}>
                        <span class="tb-icon" aria-hidden="true">{!open ? '🔒' : rec.beaten ? '🚩' : '🏁'}</span>
                        <span class="tb-name">{t.name}</span>
                        {rec.best > 0 && <span class="tb-best">{placeText(rec.best)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
