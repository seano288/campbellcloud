// The Hoard: a cave where every treasure he has dug up sits on its own ledge, lit, where he can see it, and his ship is moored at the
// cave mouth. The ledges still empty show which island holds them. Tapping a treasure says its name. Nothing here can be lost.
import { useEffect } from 'preact/hooks';
import { sChime, sClink } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { CurrencyPile } from '../../ui/currency';
import { IslandBadge } from '../art/IslandBadge';
import { ShipView } from '../art/ShipView';
import { FLEET_CURRENCY } from '../branding';
import { player } from '../game';
import { screen, setSail } from '../nav';
import { useVoice } from '../voice';
import { ISLANDS, type IslandDef } from './islands';

export function Hoard() {
  const voice = useVoice(), state = player.state.value, fleet = state.fleet;
  useEffect(() => { void voice.say('The Hoard!'); }, []);
  function tap(i: IslandDef) {
    if (!voice.active) return;
    if (fleet.hoard.includes(i.id)) { sChime(); void voice.say(i.treasure); }
    else { sClink(); void voice.say(i.name, 'Sail further to find this one!'); }
  }
  return (
    <div class="screen hoard-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>The Hoard</h1>
        <span class="hoard-count" aria-label={`${fleet.hoard.length} of ${ISLANDS.length} treasures`}>💎 {fleet.hoard.length}/{ISLANDS.length}</span>
        <CurrencyPile kind={FLEET_CURRENCY} count={state.currency.balance} />
      </header>
      <div class="cave">
        <div class="ledges" role="group" aria-label="Treasures">
          {ISLANDS.map(i => {
            const got = fleet.hoard.includes(i.id);
            return (
              <button key={i.id} class={`ledge ${got ? 'got' : 'empty'}`} aria-label={got ? i.treasure : `${i.name}: not found yet`} style={{ '--glow': i.glow }} onClick={() => tap(i)}>
                {got ? <span class="treasure" aria-hidden="true">{i.art}</span> : <IslandBadge island={i} class="ledge-isle" />}
                <span class="ledge-name">{got ? i.treasure.replace(/^the /, '') : i.name}</span>
              </button>
            );
          })}
        </div>
        <div class="cave-mouth">
          <button class="moored" aria-label="Your ship" onClick={() => { if (voice.active) void voice.say('Your ship is waiting outside.'); }}><ShipView ship={fleet.ship} label={null} /></button>
          {fleet.voyages > 0 && <button class="big-btn go sail-small" aria-label="Set sail" onClick={() => { if (voice.active) setSail(); }}>⛵{fleet.voyages}</button>}
        </div>
      </div>
    </div>
  );
}
