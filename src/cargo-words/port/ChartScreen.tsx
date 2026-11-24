// The Sea Chart: the harbours his ships sail to, in order (the named twenty-four, then the chart without end), each with its icon; the
// next one glows, one that waits for a piece shows 🔒 and the piece (tapping it says what to build). Beside it his flag wall (a flag from
// every harbour, made from parts), his bests (tallest stack, quickest loading of each size of ship), the tonnage and his Trophies.
import { sChime, sNope } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { CurrencyPile } from '../../ui/currency';
import { CUR } from '../branding';
import { player } from '../game';
import { screen } from '../nav';
import type { Phrase } from '../phrases';
import { useVoice } from '../voice';
import { itemOf } from './catalog';
import { flagsOf, has, nextHarbour, rankOf, TROPHIES } from './port';
import { chartHarbour, HARBOURS, type Flag } from './sea';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/** A flag made from parts: two or three colours in a pattern, and a symbol. */
export function FlagView({ f, size = 56 }: { f: Flag; size?: number }) {
  const w = size, h = size * 0.66;
  const body = (() => {
    switch (f.pattern) {
      case 'stripes': return <><rect width={w} height={h} fill={f.a} /><rect y={h / 3} width={w} height={h / 3} fill={f.b} /></>;
      case 'bars': return <><rect width={w} height={h} fill={f.a} /><rect x={w / 3} width={w / 3} height={h} fill={f.b} /></>;
      case 'cross': return <><rect width={w} height={h} fill={f.a} /><rect x={w * 0.3} width={w * 0.14} height={h} fill={f.b} /><rect y={h * 0.43} width={w} height={h * 0.14} fill={f.b} /></>;
      case 'diagonal': return <><rect width={w} height={h} fill={f.a} /><path d={`M0 ${h} L${w} 0 L${w} ${h} Z`} fill={f.b} /></>;
      case 'quarters': return <><rect width={w} height={h} fill={f.a} /><rect width={w / 2} height={h / 2} fill={f.b} /><rect x={w / 2} y={h / 2} width={w / 2} height={h / 2} fill={f.b} /></>;
      case 'border': return <><rect width={w} height={h} fill={f.b} /><rect x={w * 0.12} y={h * 0.15} width={w * 0.76} height={h * 0.7} fill={f.a} /></>;
      case 'circle': return <><rect width={w} height={h} fill={f.a} /><circle cx={w / 2} cy={h / 2} r={h * 0.3} fill={f.b} /></>;
      case 'triangle': return <><rect width={w} height={h} fill={f.a} /><path d={`M0 0 L${w * 0.45} ${h / 2} L0 ${h} Z`} fill={f.b} /><rect x={w * 0.6} y={h * 0.4} width={w * 0.4} height={h * 0.2} fill={f.c} /></>;
    }
  })();
  return (
    <svg class="cw-flag" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {body}
      {f.symbol && <text x={w / 2} y={h / 2 + h * 0.13} text-anchor="middle" font-size={h * 0.42}>{f.symbol}</text>}
      <rect width={w} height={h} fill="none" stroke="#141414" stroke-width="3" />
    </svg>
  );
}

export function ChartScreen() {
  const voice = useVoice(), state = player.state.value, p = state.port;
  const next = nextHarbour(p), flags = flagsOf(p), rank = rankOf(p.tonnes);
  const say = (...xs: Phrase[]) => { if (voice.active) void voice.say(...xs); };
  return (
    <div class="screen cw-chart-screen">
      <header class="cw-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Sea Chart</h1>
        <CurrencyPile kind={CUR} count={state.currency.balance} />
      </header>
      <div class="cw-chart-main">
        <section class="cw-chart" aria-label="Harbours">
          {HARBOURS.map(h => {
            const been = p.visited.includes(h.id), locked = !been && h.needs && !has(p, h.needs), isNext = next.id === h.id;
            return (
              <button key={h.id} class={cls('cw-harbour', been && 'been', locked && 'locked', isNext && 'next')} aria-label={h.name}
                onClick={() => { if (locked) { sNope(); say(h.name as Phrase, 'Build', itemOf(h.needs!).name as Phrase, 'to sail here!'); } else { sChime(); say(h.name as Phrase); } }}>
                <span class="hn">{h.n}</span><span class="hi" aria-hidden="true">{locked ? '🔒' : h.icon}</span><span class="hname">{h.name}</span>
                {been && <span class="hflag"><FlagView f={h.flag} size={30} /></span>}
                {locked && <span class="hneed" aria-hidden="true">{itemOf(h.needs!).icon}</span>}
              </button>
            );
          })}
          {next.n > HARBOURS.length && (
            <button class="cw-harbour next chart" aria-label={next.name} onClick={() => { sChime(); const c = chartHarbour(next.n); say('Sail to', c.first, c.second, ...(c.round && c.round + 1 <= 100 ? [`${c.round + 1}` as Phrase] : [])); }}>
              <span class="hn">{next.n}</span><span class="hi" aria-hidden="true">{next.icon}</span><span class="hname">{next.name}</span>
            </button>
          )}
        </section>
        <section class="cw-side-panel">
          <div class="cw-board">
            <h2>⚖️ {p.tonnes.toLocaleString('en-US')} tonnes</h2>
            <p>{rank.name}{rank.number ? ` ${rank.number}` : ''} · next at {rank.next.toLocaleString('en-US')}</p>
          </div>
          <div class="cw-board" aria-label="Bests">
            <h2>🏅 Bests</h2>
            <p>🧱 Tallest stack: {p.bests.stack}</p>
            <div class="cw-bests">{Object.entries(p.bests.quick).sort(([a], [b]) => Number(a) - Number(b)).map(([n, t]) => <span key={n}>📦{n} {t}s</span>)}</div>
          </div>
          <div class="cw-board" aria-label="Flags">
            <h2>🚩 Flags {flags.length}</h2>
            <div class="cw-flags">{flags.slice(0, 60).map(h => <span key={h.id} title={h.name}><FlagView f={h.flag} size={44} /></span>)}</div>
          </div>
          <div class="cw-board" aria-label="Trophies">
            <h2>🏆 {p.trophies.length}/{TROPHIES.length}</h2>
            <div class="cw-trophies">{TROPHIES.map(t => <span key={t.id} class={cls(p.trophies.includes(t.id) && 'won')} title={t.name}>{p.trophies.includes(t.id) ? t.icon : '❔'}</span>)}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
