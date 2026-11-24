// The sea chart: the Voyage from port to port (the six hand-made places, then new waters drawn ahead of him without end), the Missions
// at the place he has reached (a flown one can be picked to fly again, with his best landing on it), his wall of patches, his logbook
// with his rank and the stripes on his jersey, and his medals.
import { useEffect } from 'preact/hooks';
import { sChime, sNope } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { CurrencyPile } from '../../ui/currency';
import { DECK_CURRENCY } from '../branding';
import { player, updateShip } from '../game';
import { fly, screen } from '../nav';
import { portLine, type Phrase } from '../phrases';
import { useVoice } from '../voice';
import { CALLS, chart, FIXED, FIXED_COUNT, mission, PER_PLACE, prizeById, type Patch } from './missions';
import { fixedOpen, has, pickMission, planMission, rankOf, TROPHIES, voyageChart } from './ship';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const GRADE = ['', '🛬', '🛬🛬', '🛬🛬🛬'];

export function PatchBadge({ patch, size = 44, dim = false }: { patch: Patch; size?: number; dim?: boolean }) {
  return <span class={cls('cd-patch', dim && 'dim')} style={{ width: `${size}px`, height: `${size}px`, background: patch.bg, borderColor: patch.rim, fontSize: `${size * .5}px` }} aria-hidden="true">{dim ? '?' : patch.glyph}</span>;
}

export function ChartScreen() {
  const voice = useVoice(), state = player.state.value, a = state.ship;
  const here = voyageChart(a), plan = planMission(a), rank = rankOf(a.minutes);
  useEffect(() => { void voice.say(...portLine(chart(here))); }, []);
  const say = (...p: Phrase[]) => { if (voice.active) void voice.say(...p); };
  // the charts drawn so far: every one reached, and two ahead
  const charts = Array.from({ length: here + 2 }, (_, i) => chart(i + 1));
  // the Missions of the place he's at
  const first = (here - 1) * PER_PLACE + 1, missions = Array.from({ length: PER_PLACE }, (_, i) => mission(first + i));
  const prizePatches = a.owned.map(prizeById).filter(p => p?.kind === 'patch');
  function tapMission(n: number) {
    if (!voice.active) return;
    const m = mission(n);
    if (n <= FIXED_COUNT && a.records[n]) {
      updateShip(x => pickMission(x, a.picked === n ? null : n));
      sChime(); say(m.name!); return;
    }
    if (m.needs && !has(a, m.needs)) { sNope(); say(m.name ?? 'Mission', 'Build this first:', 'Deck Lights'); return; }
    say(m.name ?? CALLS[m.job]);
  }
  return (
    <div class="screen chart-screen">
      <header class="cd-head">
        <IconButton label="Carrier" onClick={() => { if (voice.active) screen.value = 'ship'; }}>🚢</IconButton>
        <h1>Chart</h1>
        <CurrencyPile kind={DECK_CURRENCY} count={state.currency.balance} />
      </header>
      <div class="chart-body">
        <section class="voyage" aria-label="The Voyage">
          {charts.map(c => (
            <button key={c.n} class={cls('port', c.n === here && 'here', c.n > here && 'ahead')} style={{ '--sea': c.sea, '--sky': c.sky } as Record<string, string>} aria-label={c.name} onClick={() => say(...portLine(c))}>
              <span class="port-icon">{c.n > here ? '❔' : c.icon}</span><span class="port-name">{c.n > here + 1 ? '…' : c.name}</span>
            </button>
          ))}
        </section>
        <section class="place-missions" aria-label="Missions here">
          {missions.map(m => {
            const rec = m.n <= FIXED_COUNT ? a.records[m.n] : undefined, flown = !!rec || (m.n > FIXED_COUNT && m.n <= a.gen), next = plan.m.n === m.n;
            const waiting = m.n <= FIXED_COUNT && !rec && !fixedOpen(a, m.n) && !!m.needs && !has(a, m.needs);
            return (
              <button key={m.n} class={cls('mission-row', flown && 'flown', next && 'next', a.picked === m.n && 'picked', waiting && 'waiting')} aria-label={m.name ?? `Radio call ${m.n}`} onClick={() => tapMission(m.n)}>
                <PatchBadge patch={m.patch} dim={!flown} size={40} />
                <span class="mr-name">{m.name ?? `📻 ${CALLS[m.job]}`}{m.night ? ' 🌙' : ''}</span>
                <span class="mr-best">{waiting ? '💡🔒' : rec ? GRADE[rec.bestGrade] : next ? '▶' : ''}</span>
              </button>
            );
          })}
          <button class={cls('big-btn', 'go', 'fly-btn', a.missions > 0 && 'pulse')} aria-label="Fly" onClick={() => { if (!voice.active) return; if (a.missions > 0) fly(); else { sNope(); say('Play a Round to earn a Mission!'); } }}>
            <span class="fly-word">Fly</span><span class="race-count">{a.missions}</span>
          </button>
        </section>
        <section class="logbook" aria-label="Logbook">
          <div class="jersey" aria-hidden="true">{'▬'.repeat(Math.min(12, rank.index + 1))}</div>
          <div class="log-line"><b>{rank.name}{rank.number ? ` ${rank.number}` : ''}</b> · ⏱️ {Math.floor(a.minutes / 60)} h · 🛫 {a.flown} · 🛬🛬🛬 {a.perfect}</div>
          <button class="chip-btn" aria-label={rank.name} onClick={() => say(rank.name)}>🎖️ {rank.name}</button>
        </section>
        <section class="patches" aria-label="Patches">
          <h2>Patches</h2>
          <div class="patch-wall">
            {FIXED.map((f, i) => <PatchBadge key={f.name} patch={mission(i + 1).patch} dim={!a.records[i + 1]} />)}
            {prizePatches.map(p => p && p.kind === 'patch' && <PatchBadge key={p.id} patch={p.patch} />)}
          </div>
        </section>
        <section class="medals" aria-label="Medals">
          <h2>Medals</h2>
          <div class="medal-wall">
            {TROPHIES.map(t => {
              const won = a.trophies.includes(t.id);
              return <button key={t.id} class={cls('medal', won && 'won')} aria-label={t.name} onClick={() => say(t.name)}><span>{won ? t.icon : '🔒'}</span><small>{t.name}</small></button>;
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
