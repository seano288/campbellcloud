// The Airfield: his plane big on the runway, and what Bolts buy, a tab per slot (Planes, Engines, Wings, Smoke Tanks, Propellers, Smoke
// Colors, Smoke Shapes, Paint, Pilots, Tricks, Gear, Wall), cheapest first. Tapping a thing he hasn't got tries it (it goes on the plane in
// the picture, the smoke puffs out behind it) and says its name and price, with Buy beside it when he can afford it; one he can't afford
// yet becomes his Goal. Tapping a thing he owns fits it (Gear switches on and off). Show! flies his plane; the Wall shows it off.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sChime, sEngine, sNope, sPop } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { drawPlane, EMOJI_FONT, type Look } from '../art/plane';
import { SKY_CURRENCY } from '../branding';
import { buy, player, updateAirfield } from '../game';
import { goShow, screen } from '../nav';
import type { Phrase } from '../phrases';
import { useVoiceScope } from '../voice';
import { FITTED_TABS, item, keyOf, SHAPES, SMOKES, TAB_ICONS, TAB_NAMES, TABLES, TABS, type FittedTab, type GearId, type Item, type ItemKey, type Tab } from './parts';
import { fit, goalOf, isOwned, nextShow, toggle, type AirfieldState } from './state';

const isFitted = (t: Tab): t is FittedTab => (FITTED_TABS as readonly Tab[]).includes(t);
const RUNG_LINES: Partial<Record<Tab, Phrase>> = { engine: 'It flies faster!', wings: 'It turns tighter!', tank: 'It makes more smoke!', prop: 'It speeds up quicker!' };

/** His plane on the runway with its smoke puffing behind, in what he's trying on. */
function Runway({ a, trying }: { a: AirfieldState; trying: ItemKey | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fitted = { ...a.fitted } as Record<string, string>;
  let pic: string | null = null;
  if (trying) { const [t, id] = trying.split(':') as [Tab, string]; if (isFitted(t) && t !== 'trick') fitted[t] = id; else pic = item(trying).pic; }
  const look: Look = { plane: fitted.plane as Look['plane'], paint: fitted.paint as Look['paint'], prop: fitted.prop!, pilot: fitted.pilot as Look['pilot'] };
  const smoke = SMOKES.find(s => s.id === fitted.smoke) ?? SMOKES[0], shape = SHAPES.find(s => s.id === fitted.shape) ?? SHAPES[0];
  const latest = useRef({ look, smoke, shape, pic });
  latest.current = { look, smoke, shape, pic };
  useEffect(() => {
    const cv = ref.current!, c = cv.getContext('2d')!;
    let raf = 0;
    const frame = (ms: number) => {
      raf = requestAnimationFrame(frame);
      const box = cv.getBoundingClientRect(), dpr = Math.min(1.5, devicePixelRatio || 1), w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
      if (!w || !h) return;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const { look, smoke, shape, pic } = latest.current, t = ms / 1000, px = Math.min(w / 260, h / 150);
      c.clearRect(0, 0, w, h);
      // smoke puffing out behind, in its colour and shape
      for (let i = 0; i < 14; i++) {
        const u = ((t * 0.6 + i / 14) % 1), x = w * 0.5 - (60 + u * 140) * px, y = h * 0.52 + Math.sin(u * 7 + i) * 10 * px;
        const col = smoke.color === 'rainbow' ? `hsl(${i * 26} 90% 62%)` : smoke.color === 'glow' ? '#fffbd0' : smoke.color;
        c.globalAlpha = 1 - u;
        if (shape.mark && shape.mark !== 'dot' && shape.mark !== 'bubble') { c.font = `${22 * px}px ${EMOJI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(shape.mark, x, y); }
        else { c.fillStyle = col; c.beginPath(); c.arc(x, y, (shape.mark === 'dot' ? 6 : 12 + u * 14) * px, 0, Math.PI * 2); if (shape.mark === 'bubble') { c.strokeStyle = col; c.lineWidth = 3 * px; c.stroke(); } else c.fill(); }
      }
      c.globalAlpha = 1;
      c.save(); c.translate(w * 0.55, h * 0.52 + Math.sin(t * 2) * 4 * px); drawPlane(c, look, px, t); c.restore();
      if (pic) { c.font = `${60 * px}px ${EMOJI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(pic, w * 0.85, h * 0.28); }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} class="af-runway" aria-hidden="true" />;
}

export function AirfieldScreen() {
  const voice = useVoiceScope(), state = player.state.value, a = state.airfield, balance = state.currency.balance;
  const [tab, setTab] = useState<Tab>('plane'), [trying, setTrying] = useState<ItemKey | null>(null);
  useEffect(() => { void voice.say('The Airfield!'); }, []);
  const items = [...(TABLES[tab] as readonly Item[])].sort((x, y) => x.price - y.price);
  const keyFor = (i: Item) => keyOf(tab, i.id as never);
  const goal = goalOf(a);

  function tapItem(i: Item) {
    if (!voice.active) return;
    const k = keyFor(i), owned = isOwned(a, k);
    if (tab === 'engine') sEngine(0.5);
    if (owned) {
      setTrying(null);
      if (tab === 'gear') {
        updateAirfield(s => toggle(s, i.id as GearId));
        const on = !player.state.peek().airfield.off.includes(i.id as GearId);
        sPop(); void voice.say(i.name as Phrase, on ? 'On!' : 'Off!');
        return;
      }
      if (tab === 'trick' && (i.id === 'loop' || i.id === 'roll')) { sPop(); void voice.say(i.name as Phrase, 'Pick a trick for your trick button!'); return; }
      updateAirfield(s => fit(s, k));
      sPop(); void voice.say(i.name as Phrase);
      return;
    }
    setTrying(k);
    const line = 'line' in i && i.line ? [i.line as Phrase] : RUNG_LINES[tab] ? [RUNG_LINES[tab]!] : [];
    if (balance >= i.price) void voice.say(i.name as Phrase, ...line, 'It costs', `${i.price}` as Phrase, 'Bolts.');
    else {
      updateAirfield(s => ({ ...s, goal: k }));
      void voice.say(i.name as Phrase, ...line, 'You need', `${i.price - balance}` as Phrase, 'more Bolts.');
    }
  }
  function buyIt() {
    if (!trying || !voice.active) return;
    if (buy(trying).kind !== 'accepted') { sNope(); return; }
    sChime(); confetti(20, voice.signal);
    void voice.say('You got', item(trying).name as Phrase);
    setTrying(null);
  }
  function show() {
    if (!voice.active) return;
    if (a.shows) goShow(nextShow(a)); else { sNope(); void voice.say('Play a Round to earn a Show!'); }
  }
  const affordable = trying && !isOwned(a, trying) && balance >= item(trying).price;
  const left = goal ? item(goal).price - balance : 0;
  return (
    <div class="screen af-screen">
      <header class="af-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Airfield</h1>
        <CurrencyPile kind={SKY_CURRENCY} count={balance} />
      </header>
      <div class="af-top">
        <div class="af-stage">
          <Runway a={a} trying={trying} />
          {affordable && <button class="big-btn go af-buy pulse" aria-label="Buy" onClick={buyIt}>Buy <CurrencyIcon kind={SKY_CURRENCY} size={30} />{item(trying!).price}</button>}
          <div class="af-actions">
            <button class={`big-btn go af-show ${a.shows ? 'pulse' : 'empty'}`} aria-label="Show" onClick={show}><span aria-hidden="true">🛩️</span> Show!{a.shows > 0 && <b>{a.shows}</b>}</button>
            <button class="big-btn garage af-wall" aria-label="Wall" onClick={() => { if (voice.active) screen.value = 'wall'; }}><span aria-hidden="true">🖼️</span></button>
          </div>
        </div>
        {goal && <div class="goal-chip" aria-label="Your goal"><span class="gi">{item(goal).pic}</span><span class="gn">{item(goal).name}</span><span class="gb"><i style={{ width: `${Math.min(100, (balance / Math.max(1, item(goal).price)) * 100)}%` }} /></span>{left > 0 ? <b>{left}</b> : <b>✓</b>}</div>}
      </div>
      <div class="af-tabs" role="tablist">
        {TABS.map(t => (
          <button key={t} role="tab" aria-selected={t === tab} class={`af-tab ${t === tab ? 'on' : ''}`} aria-label={TAB_NAMES[t]} onClick={() => { setTab(t); setTrying(null); void voice.say(TAB_NAMES[t]); }}>
            <span class="ti">{TAB_ICONS[t]}</span><span class="tn">{TAB_NAMES[t]}</span>
          </button>
        ))}
      </div>
      <div class="af-tray">
        {items.map(i => {
          const k = keyFor(i), owned = isOwned(a, k);
          const on = (isFitted(tab) && (a.fitted as Record<string, string>)[tab] === i.id) || (tab === 'gear' && owned && !a.off.includes(i.id as GearId)) || (tab === 'trick' && owned && (i.id === 'loop' || i.id === 'roll'));
          return (
            <button key={k} class={`af-tile ${owned ? 'owned' : balance >= i.price ? 'afford' : 'locked'} ${on ? 'worn' : ''} ${trying === k ? 'trying' : ''} ${goal === k ? 'goal' : ''}`}
              aria-label={i.name} data-key={k} onClick={() => tapItem(i)}>
              <span class="ico">{i.pic}</span>
              <span class="nm">{i.name}</span>
              {owned ? <span class="check">{tab === 'gear' ? (on ? 'On' : 'Off') : on ? '✓' : ''}</span> : <span class="cost"><CurrencyIcon kind={SKY_CURRENCY} size={18} />{i.price}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
