// The Routes board, like an airport's departures board: every Route with its icon and his bests there (🔒 waiting, ✈️ next, ✔ flown), the
// Charter card with its number and the next prize, his passengers and rank, and his Trophies. Tapping a Route he can fly picks it for the
// next Flight; tapping one that needs a piece says which.
import { useEffect } from 'preact/hooks';
import { sChime, sNope } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { player, updateAirport } from '../game';
import { fly, screen } from '../nav';
import { sayNum, type Phrase } from '../phrases';
import { useVoice } from '../voice';
import { chartersOpen, has, pick, planFlight, rankOf, routeFlown, routeOpen, TROPHIES } from './airport';
import { itemOf } from './catalog';
import { CHARTER_OPENS, prizeFor, PRIZE_EVERY } from './charter';
import { ROUTES } from './routes';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

export function RoutesScreen() {
  const voice = useVoice(), a = player.state.value.airport, plan = planFlight(a), rank = rankOf(a.passengers);
  useEffect(() => { void voice.say('Routes'); }, []);
  const say = (...xs: Phrase[]) => { if (voice.active) void voice.say(...xs); };
  function tapRoute(i: number) {
    if (!voice.active) return;
    const r = ROUTES[i]!;
    if (r.needs && !has(a, r.needs)) { sNope(); say(r.name as Phrase, 'Build', itemOf(r.needs).name as Phrase, 'to fly here!'); return; }
    const next = pick(a, r.id);
    if (!next) { sNope(); say(r.name as Phrase); return; }
    updateAirport(() => next); sChime(); say('Fly to', r.name as Phrase);
  }
  function tapCharter() {
    if (!voice.active) return;
    const next = pick(a, 'charter');
    if (!next) { sNope(); return; }
    updateAirport(() => next); sChime(); say('Charter Flight!', ...(a.charter <= 100 ? ['Charter' as const, ...sayNum(a.charter)] : []));
  }
  const nextPrize = Math.ceil(a.charter / PRIZE_EVERY) * PRIZE_EVERY, prize = prizeFor(nextPrize);
  return (
    <div class="screen routes-screen">
      <header class="jw-head">
        <IconButton label="Airport" onClick={() => { if (voice.active) screen.value = 'airport'; }}>🏗️</IconButton>
        <h1>Routes</h1>
        <span class="pax-board">🧍 {a.passengers.toLocaleString('en-US')} <small>{rank.name}{rank.number ? ` ${rank.number}` : ''}</small></span>
        {a.flights > 0 && <button class="big-btn go fly-mini" aria-label="Fly" onClick={() => { if (voice.active) fly(); }}>✈️ {a.flights}</button>}
      </header>
      <div class="routes-body">
        <button class={cls('charter-card', !chartersOpen(a) && 'locked', plan.mode === 'charter' && 'next')} aria-label="Charter Flights" onClick={tapCharter}>
          <span class="cc-icon" aria-hidden="true">🧭</span>
          <span class="cc-text"><b>Charter {a.charter}</b>{chartersOpen(a) ? <small>🎁 {nextPrize}: {prize?.name}{prize && 'glyph' in prize ? ` ${prize.glyph}` : ''}</small> : <small>✈️ × {CHARTER_OPENS}</small>}</span>
        </button>
        <div class="board" role="list">
          {ROUTES.map((r, i) => {
            const flown = routeFlown(a, r.id), open = routeOpen(a, i), needs = r.needs && !has(a, r.needs), rec = a.routes[r.id];
            return (
              <button key={r.id} role="listitem" class={cls('board-row', flown && 'flown', open && !flown && 'open', needs && 'locked', plan.dest.id === r.id && 'next')} aria-label={r.name} onClick={() => tapRoute(i)}>
                <span class="br-icon" aria-hidden="true">{r.icon}</span>
                <span class="br-name">{r.name}</span>
                <span class="br-state">{needs ? `🔒 ${itemOf(r.needs!).icon}` : flown ? `⭐${rec!.bestStars} ${'🛬'.repeat(rec!.bestLanding)}` : open ? '✈️' : '·'}</span>
              </button>
            );
          })}
        </div>
        <div class="trophy-shelf" aria-label="Trophies">
          {TROPHIES.map(t => <span key={t.id} class={cls('trophy', a.trophies.includes(t.id) && 'won')} title={t.name} aria-label={t.name}>{a.trophies.includes(t.id) ? t.icon : '🏆'}</span>)}
        </div>
      </div>
    </div>
  );
}
