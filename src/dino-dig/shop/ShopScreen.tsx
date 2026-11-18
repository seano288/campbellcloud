// The shop: what Bolts buy. Nine tabs (Tools, Gadgets, Colors, Markings, Hats, Roars, Gear, Lands, Museum), cheapest first. Tapping a
// thing he hasn't got tries it (a look goes on his dinosaur in the picture, a roar plays) and says its name and price, with Buy beside
// it when he can afford it; one he can't afford yet becomes his Goal. Tapping a thing he owns wears it (a look on the dinosaur he's
// dressing, a land for the run) or switches it on and off (Gadgets and Gear). Looks belong to one dinosaur at a time: the row of his
// living dinosaurs picks which.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sChime, sNope, sPop } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { bounds, drawDino } from '../art/dino';
import { DinoCanvas } from '../art/DinoCanvas';
import { EMOJI_FONT } from '../art/loop';
import { DINO_CURRENCY } from '../branding';
import { buy, player, updateMuseum } from '../game';
import { screen } from '../nav';
import type { Phrase } from '../phrases';
import { playRoar } from '../sounds';
import { useVoiceScope } from '../voice';
import { dino, type DinoId } from '../museum/dinos';
import { goalOf, isOwned, lookOf, toggle, wear, type Look } from '../museum/state';
import { item, keyOf, LANDS, TAB_ICONS, TAB_NAMES, TABLES, TABS, type Item, type ItemKey, type RoarId, type Tab } from './shop';

const LOOK_TABS: readonly Tab[] = ['color', 'marking', 'hat', 'roar'];

/** The picture's backdrop: the sky and ground of his land for the run (or the one he's trying on). */
function stageLand(id: string) {
  const l = LANDS.find(x => x.id === id) ?? LANDS[0]!;
  return { '--sky1': l.sky[0], '--sky2': l.sky[1], '--ground': l.ground, '--ground2': l.ground2 };
}

function Preview({ id, look, pic }: { id: DinoId | null; look: Look; pic: string | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const box = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(box.width * dpr)); cv.height = Math.max(1, Math.round(box.height * dpr));
    const c = cv.getContext('2d')!;
    c.clearRect(0, 0, cv.width, cv.height);
    if (pic || !id) {
      c.font = `${Math.min(cv.height * .7, cv.width * .5)}px ${EMOJI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(pic ?? '🦴', cv.width / 2, cv.height / 2);
      return;
    }
    const d = dino(id), b = bounds(d), px = Math.min((cv.width * .9) / b.width, (cv.height * .85) / b.height);
    c.save(); c.translate((cv.width - b.width * px) / 2 - b.left * px, cv.height * .94);
    drawDino(c, d, { mode: 'skin', px, look, t: 1 });
    c.restore();
  }, [id, look.color, look.marking, look.hat, pic]);
  return <canvas ref={ref} class="shop-preview" aria-hidden="true" />;
}

export function ShopScreen() {
  const voice = useVoiceScope(), state = player.state.value, m = state.museum, balance = state.currency.balance;
  const [tab, setTab] = useState<Tab>(m.alive.length ? 'color' : 'tool'), [trying, setTrying] = useState<ItemKey | null>(null);
  useEffect(() => { void voice.say('The Shop!'); }, []);
  const pet = m.pet && m.alive.includes(m.pet) ? m.pet : m.alive.at(-1) ?? null;
  const items = [...(TABLES[tab] as readonly Item[])].sort((a, b) => a.price - b.price);
  const keyFor = (i: Item) => keyOf(tab, i.id as never);
  const goal = goalOf(m);
  // what the picture shows: the dinosaur he's dressing, in the look he's trying; anything else, its picture
  const base = pet ? lookOf(m, pet) : lookOf(m, 'compy');
  const tryLook: Look = trying && LOOK_TABS.includes(trying.split(':')[0] as Tab) ? { ...base, [trying.split(':')[0]!]: trying.split(':')[1] } : base;
  const pic = LOOK_TABS.includes(tab) && pet ? null : (trying ? item(trying).pic : TAB_ICONS[tab]);

  function tapItem(i: Item) {
    if (!voice.active) return;
    const k = keyFor(i), owned = isOwned(m, k);
    if (tab === 'roar') playRoar(i.id as RoarId, pet ? dino(pet).size : 200);
    if (owned) {
      setTrying(null);
      if (tab === 'gadget' || tab === 'gear') {
        const id = i.id as Parameters<typeof toggle>[1];
        updateMuseum(s => toggle(s, id));
        const on = !player.state.peek().museum.off.includes(id);
        sPop(); void voice.say(i.name as Phrase, on ? 'On!' : 'Off!');
        return;
      }
      if (LOOK_TABS.includes(tab) && !pet) { sNope(); void voice.say('Bring a dinosaur to life first!'); return; }
      updateMuseum(s => wear(s, k));
      sPop(); void voice.say(i.name as Phrase);
      return;
    }
    setTrying(k);
    const line = 'line' in i && i.line ? [i.line as Phrase] : tab === 'tool' ? ['It digs bigger and cracks rocks faster!' as const] : [];
    if (balance >= i.price) void voice.say(i.name as Phrase, ...line, 'It costs', `${i.price}` as Phrase, 'Bolts.');
    else {
      updateMuseum(s => ({ ...s, goal: k }));
      void voice.say(i.name as Phrase, ...line, 'You need', `${i.price - balance}` as Phrase, 'more Bolts.');
    }
  }
  function buyIt() {
    if (!trying || !voice.active) return;
    const before = player.state.peek().museum;
    if (buy(trying).kind !== 'accepted') { sNope(); return; }
    sChime(); confetti(20, voice.signal);
    void voice.say('You got', item(trying).name as Phrase);
    if (LOOK_TABS.includes(tab) && !before.pet && !player.state.peek().museum.alive.length) void voice.say('Bring a dinosaur to life first!');
    setTrying(null);
  }
  const affordable = trying && !isOwned(m, trying) && balance >= item(trying).price;
  const left = goal ? item(goal).price - balance : 0;
  return (
    <div class="screen shop-screen">
      <header class="museum-head">
        <IconButton label="Museum" onClick={() => { if (voice.active) screen.value = 'museum'; }}>🏛️</IconButton>
        <h1>Shop</h1>
        <CurrencyPile kind={DINO_CURRENCY} count={balance} />
      </header>
      <div class="shop-top">
        <div class="shop-stage" style={stageLand(trying && trying.startsWith('land:') ? trying.slice(5) : m.land)}>
          <Preview id={pet} look={tryLook} pic={pic} />
          {affordable && <button class="big-btn go shop-buy pulse" aria-label="Buy" onClick={buyIt}>Buy <CurrencyIcon kind={DINO_CURRENCY} size={30} />{item(trying!).price}</button>}
        </div>
        {LOOK_TABS.includes(tab) && (
          <div class="shop-pets" role="group" aria-label="Your dinosaurs">
            {m.alive.length ? m.alive.map(id => (
              <button key={id} class={`shop-pet ${id === pet ? 'on' : ''}`} aria-label={dino(id).name} onClick={() => { updateMuseum(s => ({ ...s, pet: id })); setTrying(null); void voice.say(dino(id).name as Phrase); }}>
                <DinoCanvas id={id} look={lookOf(m, id)} />
              </button>
            )) : <p class="shop-none">🦴 Bring a dinosaur to life first!</p>}
          </div>
        )}
        {goal && <div class="goal-chip" aria-label="Your goal"><span class="gi">{item(goal).pic}</span><span class="gn">{item(goal).name}</span><span class="gb"><i style={{ width: `${Math.min(100, (balance / Math.max(1, item(goal).price)) * 100)}%` }} /></span>{left > 0 ? <b>{left}</b> : <b>✓</b>}</div>}
      </div>
      <div class="shop-tabs" role="tablist">
        {TABS.map(t => (
          <button key={t} role="tab" aria-selected={t === tab} class={`shop-tab ${t === tab ? 'on' : ''}`} aria-label={TAB_NAMES[t]} onClick={() => { setTab(t); setTrying(null); void voice.say(TAB_NAMES[t]); }}>
            <span class="ti">{TAB_ICONS[t]}</span><span class="tn">{TAB_NAMES[t]}</span>
          </button>
        ))}
      </div>
      <div class="shop-tray">
        {items.map(i => {
          const k = keyFor(i), owned = isOwned(m, k);
          const worn = (tab === 'land' && m.land === i.id) || (LOOK_TABS.includes(tab) && pet && (lookOf(m, pet) as unknown as Record<string, string>)[tab] === i.id)
            || ((tab === 'gadget' || tab === 'gear') && owned && !m.off.includes(i.id as never));
          return (
            <button key={k} class={`shop-tile ${owned ? 'owned' : balance >= i.price ? 'afford' : 'locked'} ${worn ? 'worn' : ''} ${trying === k ? 'trying' : ''} ${goal === k ? 'goal' : ''}`}
              aria-label={i.name} data-key={k} onClick={() => tapItem(i)}>
              <span class="ico">{i.pic}</span>
              <span class="nm">{i.name}</span>
              {owned ? <span class="check">{(tab === 'gadget' || tab === 'gear') ? (worn ? 'On' : 'Off') : '✓'}</span> : <span class="cost"><CurrencyIcon kind={DINO_CURRENCY} size={18} />{i.price}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
