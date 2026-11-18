// The Logbook: a page for each place he can dive, with a photo frame for each animal that lives there. One he has photographed shows
// in colour, and tapping it says its name and its one true fact (the way Time Flies and Chop Chop say an aircraft's), with the photo
// shown big. One he hasn't found yet is a dark shape, and says so. He reads nothing here: the names are said.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sNope } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { CurrencyPile } from '../../ui/currency';
import { AnimalPic } from '../art/Pics';
import { DEEP_CURRENCY } from '../branding';
import { player } from '../game';
import { screen } from '../nav';
import type { Phrase } from '../phrases';
import { animal, animalsIn, ANIMALS, type AnimalId } from '../sea/animals';
import { ZONES } from '../sea/zones';
import { useVoice } from '../voice';

export function LogbookScreen() {
  const voice = useVoice(), state = player.state.value, photos = state.dock.photos;
  const [open, setOpen] = useState<AnimalId | null>(null);
  useEffect(() => { void voice.say('The Logbook!', ...(photos.length ? [] : ['Take pictures on a Dive to fill it!' as const])); }, []);
  function tap(id: AnimalId) {
    if (!voice.active) return;
    if (!photos.includes(id)) { sNope(); void voice.say('Not found yet!'); return; }
    sChime();
    setOpen(id);
    const a = animal(id);
    void voice.say(a.name as Phrase, a.fact as Phrase);
  }
  const shown = open ? animal(open) : null;
  return (
    <div class="screen logbook-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Logbook <span class="log-count">{photos.length}/{ANIMALS.length}</span></h1>
        <IconButton label="Dock" onClick={() => { if (voice.active) screen.value = 'dock'; }}>⚓</IconButton>
        <CurrencyPile kind={DEEP_CURRENCY} count={state.currency.balance} />
      </header>
      <div class="log-pages">
        {ZONES.map(z => (
          <section key={z.id} class="log-page" style={{ background: `linear-gradient(${z.top}, ${z.bottom})` }} aria-label={z.name}>
            <h2><span aria-hidden="true">{z.icon}</span> {z.name}</h2>
            <div class="log-grid">
              {animalsIn(z.id).map(a => {
                const got = photos.includes(a.id as AnimalId);
                return (
                  <button key={a.id} class={`log-photo ${got ? 'got' : 'missing'} ${open === a.id ? 'open' : ''}`} aria-label={got ? a.name : 'Not found yet'} onClick={() => tap(a.id as AnimalId)}>
                    <AnimalPic id={a.id} silhouette={!got} />
                    {got && <span class="log-name">{a.name}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {shown && (
        <div class="log-card" role="dialog" aria-label={shown.name} onClick={() => setOpen(null)}>
          <div class="log-card-inner">
            <AnimalPic id={shown.id} class="big" label={shown.name} />
            <h2>{shown.name}</h2>
            <p>{shown.fact}</p>
            <div class="log-card-btns">
              <button class="big-btn go" aria-label="Say it again" onClick={e => { e.stopPropagation(); void voice.say(shown.name as Phrase, shown.fact as Phrase); }}>🔊</button>
              <button class="big-btn" aria-label="Close" onClick={() => setOpen(null)}>✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
