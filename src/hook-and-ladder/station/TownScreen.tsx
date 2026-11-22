// The Town at night: a lot for each of the thirty-two Calls, in streets, then the Mystery Call's lot. A Call he has answered stands
// there as its building, drawn in code as he saw it at the Call with its windows lit, a thank-you sign and the stars he has won there;
// the rest are building sites behind a wooden fence. Tapping a building says its thank-you and makes it his next Call, as a Star Call
// one star hotter than he has won there. The Mystery Call's lot opens once he has answered sixteen and shows his Level. The things he
// bought for the Town stand in the park along the bottom.
import { useEffect } from 'preact/hooks';
import { sChime, sNope } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { CurrencyPile } from '../../ui/currency';
import { CanvasArt } from '../art/CanvasArt';
import { drawLot, lotScale } from '../art/town';
import { LADDER_CURRENCY } from '../branding';
import { MAX_HEAT, MYSTERY_ID, SCENES } from '../call/scenes';
import { player, updateStation } from '../game';
import { goCall, screen } from '../nav';
import type { Phrase } from '../phrases';
import { useVoice } from '../voice';
import { TOWN_THINGS, keyOf } from './parts';
import { callOf, isOwned, mysteryOpen, pickCall, starsOf } from './station';

export function TownScreen() {
  const voice = useVoice(), state = player.state.value, st = state.station, next = callOf(st);
  useEffect(() => { void voice.say('The Town!', ...(st.answered.length ? ['Tap a building for a Star Call!' as const] : ['Answer a Call to build here!' as const])); }, []);
  const n = (x: number) => `${Math.min(100, x)}` as Phrase;
  function tap(id: string) {
    if (!voice.active) return;
    if (id === MYSTERY_ID) {
      if (!mysteryOpen(st)) { sNope(); void voice.say('Answer more Calls to open the Mystery Call!'); return; }
      sChime();
      updateStation(x => pickCall(x, id));
      void voice.say('Mystery Call!', 'Level', n(st.mystery + 1), 'Every fifth Level wins a prize!');
      return;
    }
    const s = SCENES.find(x => x.id === id)!;
    if (!st.answered.includes(id)) { sNope(); void voice.say('Answer a Call to build here!'); return; }
    sChime();
    updateStation(x => pickCall(x, id));
    void voice.say(s.name as Phrase, 'says thank you!', 'Next call:', s.name as Phrase, 'Star Call!', ...(starsOf(st, id) < MAX_HEAT ? ['More fires this time!' as const] : []));
  }
  const open = mysteryOpen(st), mysteryNext = next.id === MYSTERY_ID;
  const park = TOWN_THINGS.filter(t => isOwned(st, keyOf('town', t.id)));
  return (
    <div class="screen town-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Town</h1>
        <CurrencyPile kind={LADDER_CURRENCY} count={state.currency.balance} />
      </header>
      <div class="town-map" role="group" aria-label="Town">
        {SCENES.map(s => {
          const got = st.answered.includes(s.id);
          return (
            <button key={s.id} class={`lot ${got ? 'built' : 'site'} ${got && next.id === s.id ? 'next' : ''}`} aria-label={got ? s.name : 'Building site'} onClick={() => tap(s.id)}>
              <CanvasArt class="lot-art" k={`${s.id}${got}`} paint={(ctx, w, h) => drawLot(ctx, s, got, 0, w, h, lotScale(h))} />
              {got && <span class="thanks-sign">Thank you!</span>}
              {got && <span class={`lot-stars ${starsOf(st, s.id) ? '' : 'none'}`} aria-hidden="true">{Array.from({ length: MAX_HEAT }, (_, i) => <i key={i} class={i < starsOf(st, s.id) ? 'won' : ''}>⭐</i>)}</span>}
              {got && next.id === s.id && <span class="next-flag" aria-hidden="true">🚒</span>}
            </button>
          );
        })}
        <button class={`lot mystery-lot ${open ? 'built' : 'site'} ${mysteryNext ? 'next' : ''}`} aria-label={open ? 'Mystery Call' : 'Mystery Call, locked'} onClick={() => tap(MYSTERY_ID)}>
          <span class="mystery-q" aria-hidden="true">{open ? '❓' : '🔒'}</span>
          {open && <span class="thanks-sign">Level {st.mystery + 1}</span>}
          {mysteryNext && <span class="next-flag" aria-hidden="true">🚒</span>}
        </button>
      </div>
      <div class="town-park" aria-label="Park">{park.length ? park.map(t => <span key={t.id} role="img" aria-label={t.name}>{t.emoji}</span>) : <span class="park-empty" aria-hidden="true">🌱</span>}</div>
      <div class="town-go">
        <IconButton label="Station" onClick={() => { if (voice.active) screen.value = 'station'; }}>🚒</IconButton>
        <button class={`big-btn go call-btn ${st.calls > 0 ? 'pulse' : 'short'}`} aria-label="Call" onClick={() => {
          if (!voice.active) return;
          if (st.calls <= 0) { sNope(); void voice.say('Play a Round to earn a Call!'); return; }
          goCall();
        }}><span class="call-badge-next" aria-hidden="true">{next.badge}</span><span class="call-word">Call!</span><span class="call-count">🚒{st.calls}</span></button>
      </div>
    </div>
  );
}
