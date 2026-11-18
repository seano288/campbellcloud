// The Sticker Book, the screen he shows people: a sticker for every Regular he has met (their face, name and favourite order; the ones
// still to meet are a ❔ with their truck's food, so he knows where to find them), a postcard for every Spot (the ones still shut say
// how many stars they need, or that they need Lights), and his row of trucks, each wearing his parts.
import { useEffect, useState } from 'preact/hooks';
import { sClink, sNope } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { TruckPic } from '../art/TruckPic';
import { player } from '../game';
import { screen } from '../nav';
import { lovesLine, type Phrase } from '../phrases';
import { TRUCKS, truckOf } from '../truck/parts';
import { isOpen, ownsLights } from '../truck/state';
import { REGULARS, SPOTS } from '../truck/world';
import { useVoice } from '../voice';

type Page = 'regulars' | 'spots' | 'trucks';
const n = (x: number) => `${Math.min(100, x)}` as Phrase;

export function BookScreen() {
  const voice = useVoice(), t = player.state.value.truck;
  const [page, setPage] = useState<Page>('regulars');
  useEffect(() => { void voice.say('Sticker Book'); }, []);
  const turn = (p: Page) => { if (!voice.active) return; sClink(); setPage(p); void voice.say(p === 'regulars' ? 'Regulars' : p === 'spots' ? 'Spots' : 'Trucks'); };
  return (
    <div class="screen ft-book-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Sticker Book</h1>
        <IconButton label="Truck" onClick={() => { if (voice.active) screen.value = 'truck'; }}>🚚</IconButton>
      </header>
      <div class="ft-tabs book-tabs" role="tablist">
        {(['regulars', 'spots', 'trucks'] as const).map(p => (
          <button key={p} role="tab" aria-selected={p === page} aria-label={p === 'regulars' ? 'Regulars' : p === 'spots' ? 'Spots' : 'Trucks'} class={`ft-tab wide ${p === page ? 'on' : ''}`} onClick={() => turn(p)}>
            <span aria-hidden="true">{p === 'regulars' ? '😀' : p === 'spots' ? '🗺️' : '🚚'}</span>
            <span class="tab-count">{p === 'regulars' ? `${t.regulars.length}/${REGULARS.length}` : p === 'spots' ? `${SPOTS.filter(s => isOpen(t, s)).length}/${SPOTS.length}` : `${t.trucks.length}/${TRUCKS.length}`}</span>
          </button>
        ))}
      </div>
      <div class="book-page">
        {page === 'regulars' && <div class="sticker-grid">
          {REGULARS.map(r => {
            const met = t.regulars.includes(r.id), k = truckOf(r.truck);
            return (
              <button key={r.id} class={`sticker ${met ? 'met' : ''}`} aria-label={met ? r.name : 'Not met yet'} onClick={() => {
                if (!voice.active) return;
                if (met) { sClink(); void voice.say(r.name as Phrase, lovesLine(r.truck)); } else { sNope(); void voice.say('Drive the', k.name, 'to meet them!'); }
              }}>
                <span class="face" aria-hidden="true">{met ? r.face : '❔'}</span>
                <span class="nm">{met ? r.name : ''}</span>
                <span class="fav" aria-hidden="true">{k.food}{met && r.fav.map(id => k.toppings.find(x => x.id === id)!.emoji).join('')}</span>
              </button>
            );
          })}
        </div>}
        {page === 'spots' && <div class="spot-grid book">
          {SPOTS.map(p => {
            const open = isOpen(t, p);
            return (
              <button key={p.id} class={`spot-tile ${open ? '' : 'locked'} ${p.night ? 'night' : ''}`} style={{ '--sky1': p.sky[0], '--sky2': p.sky[1], '--ground': p.ground } as Record<string, string>} aria-label={p.name} onClick={() => {
                if (!voice.active) return;
                if (open) { sClink(); void voice.say(p.name); return; }
                sNope();
                if (p.stars > t.stars) void voice.say(n(p.stars - t.stars), 'more stars to open it!'); else if (p.night && !ownsLights(t)) void voice.say('Get Lights to open it!');
              }}>
                <span class="spot-props" aria-hidden="true">{p.props.join('')}</span>
                <span class="spot-name">{p.name.replace(/^The /, '')}</span>
                {!open && <span class="spot-lock" aria-hidden="true">{p.stars > t.stars ? `🔒 ⭐${p.stars}` : '🔒 💡'}</span>}
              </button>
            );
          })}
        </div>}
        {page === 'trucks' && <div class="truck-row">
          {TRUCKS.map(k => {
            const have = t.trucks.includes(k.id);
            return (
              <button key={k.id} class={`truck-card ${have ? 'have' : 'locked'}`} aria-label={k.name} onClick={() => { if (voice.active) { sClink(); void voice.say(k.name); } }}>
                <TruckPic look={{ truck: k.id, fit: t.fit }} label={k.name} />
                <span class="nm">{have ? k.name : '🔒'}</span>
              </button>
            );
          })}
        </div>}
      </div>
      <div class="book-foot" aria-hidden="true">⭐ {t.stars} · 🍽️ {t.best}</div>
    </div>
  );
}
