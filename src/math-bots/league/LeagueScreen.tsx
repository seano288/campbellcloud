// The League: every rival in order, with the stars he's earned and what each one wins. He can fight the next rival or go back to any
// he's beaten for more stars. Rivals he hasn't reached are shown as a dark shape with their prize visible: something to want.
import { useEffect } from 'preact/hooks';
import { sNope } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { BotView, PartPic } from '../bot/BotView';
import { powerOf } from '../bot/build';
import { nameOf } from '../bot/parts';
import { player } from '../game';
import { fightTarget, screen } from '../nav';
import { beatLine } from '../phrases';
import { useVoice } from '../voice';
import { canFight, nextRival } from '../workshop/workshop';
import { RIVALS, type RivalId, type RivalName } from './rivals';

export function LeagueScreen() {
  const voice = useVoice(), w = player.state.value.workshop, next = nextRival(w);
  useEffect(() => { void voice.say('League', ...(next ? ['Next up', next.name as RivalName] as const : ['You beat them all!'] as const)); }, []);
  function tap(id: RivalId) {
    if (!voice.active) return;
    const r = RIVALS.find(x => x.id === id)!;
    if (!canFight(w, r)) { sNope(); void voice.say('Beat this robot first!'); return; }
    if (w.charges <= 0) { sNope(); void voice.say(r.name as RivalName, beatLine(r.prize), 'Play a Round to earn a fight!'); return; }
    fightTarget.value = id;
    screen.value = 'fight';
  }
  return (
    <div class="screen league-screen">
      <header class="work-head">
        <IconButton label="Workshop" class="my-bot" onClick={() => { if (voice.active) screen.value = 'reward'; }}><BotView build={w.build} label={null} /></IconButton>
        <h1>League</h1>
        <span class="charges" aria-label={`${w.charges} fights ready`}>🥊 {w.charges}</span>
      </header>
      <div class="league-grid">
        {RIVALS.map((r, i) => {
          const open = canFight(w, r), stars = w.rivals[r.id]?.stars ?? 0;
          return (
            <button key={r.id} class={`rival ${open ? '' : 'shut'} ${next?.id === r.id ? 'next' : ''}`} aria-label={r.name} onClick={() => tap(r.id)}>
              <span class="rival-no">{i + 1}</span>
              <BotView build={r.build} class={open ? '' : 'shade'} label={r.name} />
              <span class="rival-name">{r.name}</span>
              <span class="rival-power">⚡{powerOf(r.build)}</span>
              {stars > 0 ? <span class="rival-stars" aria-label={`${stars} stars`}>{'★'.repeat(stars)}<i>{'★'.repeat(3 - stars)}</i></span>
                : <span class="rival-prize"><PartPic k={r.prize} /><span class="sr">{nameOf(r.prize)}</span></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
