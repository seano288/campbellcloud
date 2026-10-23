// The Garage: "Tap the truck". The 3D Truck fills the stage with a hotspot on each Slot's part; tapping one
// swings the camera there and opens that Slot's sheet of 5 Mods (bottom sheet in portrait, side panel in landscape).
// Along the bottom, the Body switcher shows every Body, the locked ones with their Bolt price; it scrolls, and keeps
// the Body he's driving in view. On a phone it waits behind a 🚚 button so the Truck has room. Hotspots on Slots with
// nothing he can buy yet stay quieter, so the ones he can spend on stand out. 📸 Show Off puts the Truck on stage, and 🏆 opens the Trophy Shelf. Once a Door
// Number style is fitted, its sheet has a button that swaps the Mods for two wheels to pick the number with. Its
// hotspot steps away while the sheet is open, and every hotspot does while he picks, so none covers the number.
// The Paint sheet has a row of Colour swatches under its Mods.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren, ComponentType } from 'preact';
import type { LegendaryCheckout } from '../app/checkout';
import { screen } from '../app/nav';
import { ENGINES, HORNS, sClink, sNope } from '../audio/sfx';
import { celebrateBody, celebrateUnlock } from '../celebrate/garageShow';
import { game } from '../game/store';
import type { Commit } from '../save/store';
import type { MoneyState } from '../app/save';
import { fmt } from '../money/money';
import { Bolt, BoltPile, IconButton } from '../ui/bits';
import { numberLine } from './phrases';
import { useVoiceScope } from '../voice/context';
import { createVoiceScope, type VoiceScope } from '../voice/say';
import { BodyArt } from './BodyArt';
import { bodyItem, BODY_IDS, BODY_NAMES, colourById, colourItem, COLOURS, FREE_COLOUR, isStarter, LEGENDARY, modId, modName, RUNGS, SLOTS, slotById, TOP, type BodyId, type BoughtColour, type ColourId, type Rung, type SlotId } from './catalog';
import { Checkout } from './Checkout';
import { digits, turnWheel, type Wheel } from './doorNumber';
import { PRICES } from './economy';
import {
  canAfford, canAffordBody, canAffordColour, currentBody, currentFit, goal, gotLine, isUnlocked, legendaryCheckout, legendaryPrice, needLines, owns, ownsColour, setDoorNumber, slotHasAffordable,
  stepBody, tapBody, tapColour, tapMod, waitingFor, waitLines,
} from './garage';
import { PartIcon } from './icons';
import { ShowOff } from './show/ShowOff';
import { GarageStage, spreadHotspots } from './three/stage';

export function GarageScreen({ goal: goalView, Shelf }: { goal: ComponentChildren; Shelf: ComponentType<{ onClose(): void }> }) {
  const voice = useVoiceScope(), { say } = voice;
  const celebration = useRef<VoiceScope | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null), stageEl = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const hots = useRef<Partial<Record<SlotId, HTMLButtonElement | null>>>({});
  const [stage, setStage] = useState<GarageStage | null>(null);
  const [sheet, setSheet] = useState<SlotId | null>(null);
  const [picking, setPicking] = useState(false);
  const [checkout, setCheckout] = useState<LegendaryCheckout | null>(null);
  const [showing, setShowing] = useState(false);
  const [shelf, setShelf] = useState(false);
  const [trucks, setTrucks] = useState(false); // the Body switcher, on a phone
  const [wiggle, setWiggle] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false); // only for the length of an unlock jump
  const body = currentBody(), f = currentFit();
  const canPick = sheet === 'number' && f.number > 0, picker = picking && canPick;

  useEffect(() => {
    // three.js is in the main bundle, not a lazy chunk: an update can't leave the Garage pointing at a chunk that's gone
    const st = new GarageStage(canvas.current!, stageEl.current!);
    st.onHotspots = places => {
      spreadHotspots(places, (Object.values(hots.current).find(Boolean)?.offsetWidth ?? 66) + 8);
      for (const [slot, p] of Object.entries(places) as [SlotId, (typeof places)[SlotId]][]) {
        const el = hots.current[slot];
        if (!el) continue;
        el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-50%)`;
        el.classList.toggle('hidden', !p.visible);
      }
    };
    setStage(st);
    void say('Garage!');
    return () => st.dispose();
  }, []);

  useEffect(() => { stage?.setTruck(body, f); }, [stage, body, JSON.stringify(f)]);
  useEffect(() => { strip.current?.querySelector('.on')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, [body, showing, trucks]);
  useEffect(() => () => checkout?.close(), [checkout]);

  function openSheet(slot: SlotId) {
    if (!voice.active) return;
    setSheet(slot); setPicking(false); setTrucks(false);
    stage?.focus(slot);
    if (slot === 'horn') HORNS[f.horn]!();
    if (slot === 'engine') { ENGINES[f.engine]!(); stage?.puff(); } // he revs it
    if (slot === 'exhaust') stage?.puff();
    void say(slotById(slot).name);
  }
  function closeSheet() { if (voice.active) { celebration.current?.cancel(); setSheet(null); setPicking(false); stage?.focus(null); } }

  function openPicker() { if (voice.active) { setPicking(true); void say(numberLine(f.doorNumber)); } }
  function turn(wheel: Wheel, dir: 1 | -1) {
    if (!voice.active) return;
    const n = turnWheel(f.doorNumber, wheel, dir);
    setDoorNumber(n);
    sClink();
    void say(numberLine(n));
  }

  function block(ms: number) {
    const show = celebration.current!;
    setBlocked(true);
    void show.wait(ms).then(() => { if (voice.active && celebration.current === show) setBlocked(false); });
  }
  function showVoice() {
    celebration.current?.cancel();
    return celebration.current = createVoiceScope(voice.signal);
  }
  function nope(key: string) {
    sNope();
    setWiggle(key);
    setTimeout(() => setWiggle(null), 450);
  }

  function tap(slot: SlotId, rung: Rung) {
    if (!voice.active) return;
    const result = tapMod(slot, rung);
    if (result.kind === 'rejected') return;
    if (slot === 'engine' && result.kind !== 'unlocked') { ENGINES[rung]!(); stage?.puff(); } // he hears an Engine before he buys it
    if (result.kind === 'fitted') {
      if (slot === 'horn') HORNS[rung]!();
      else if (slot !== 'engine') { sClink(); void say(modName(slot, rung)); }
    } else if (result.kind === 'unlocked') {
      const r = rung as 1 | 2 | 3;
      if (stage) block(celebrateUnlock(stage, stageEl.current!, slot, r, currentFit(result.state), gotLine(modId(slot, r)), showVoice()));
    } else if (result.kind === 'checkout') {
      const opened = legendaryCheckout.open(modId(slot, LEGENDARY), voice.signal, result => paid(slot, result));
      if (opened.kind === 'ready') { celebration.current?.cancel(); setCheckout(opened.checkout); }
    } else if (result.kind === 'waiting') {
      nope(`${slot}:${rung}`);
      void say(...waitLines(slot, waitingFor(slot)!));
    } else {
      nope(`${slot}:${rung}`);
      void say(...needLines(modId(slot, rung as 1 | 2 | 3)));
    }
  }

  function tapSwatch(c: ColourId) {
    if (!voice.active) return;
    const result = tapColour(c), name = colourById(c).name;
    if (result.kind === 'rejected') return;
    if (result.kind === 'fitted') { sClink(); void say(name); return; }
    const item = colourItem(c as BoughtColour);
    if (result.kind === 'unlocked') { if (stage) block(celebrateUnlock(stage, stageEl.current!, 'paint', 1, currentFit(result.state), gotLine(item), showVoice())); return; }
    nope(item);
    void say(...needLines(item));
  }

  function paid(slot: SlotId, result: Extract<Commit<MoneyState>, { kind: 'accepted' }>) {
    if (!voice.active) return;
    setCheckout(null);
    if (stage) block(celebrateUnlock(stage, stageEl.current!, slot, LEGENDARY, currentFit(result.state), gotLine(modId(slot, LEGENDARY)), showVoice()));
  }

  function tapBodyChip(b: BodyId) {
    if (!voice.active) return;
    const result = tapBody(b);
    if (result.kind === 'rejected') return;
    if (result.kind === 'switched') void say(BODY_NAMES[b]);
    else if (result.kind === 'bought') { if (!isStarter(b) && stage) block(celebrateBody(stage, stageEl.current!, currentFit(result.state), gotLine(bodyItem(b)), showVoice())); }
    else { nope(`body:${b}`); if (!isStarter(b)) void say(...needLines(bodyItem(b))); }
  }

  function startShow() {
    if (!voice.active) return;
    closeSheet();
    setShowing(true);
    stage?.show(true);
  }
  function endShow() {
    if (!voice.active) return;
    setShowing(false);
    stage?.show(false);
  }

  const bodyStep = (d: 1 | -1) => { if (voice.active) { stepBody(d); void say(BODY_NAMES[currentBody()]); } };
  const bodyCanBuy = BODY_IDS.some(b => !owns(b) && canAffordBody(b));
  const state = (fitted: boolean, mine: boolean, price: string, locked: boolean) =>
    fitted ? 'on your truck' : mine ? 'yours' : locked ? `${price}, locked` : price;

  return (
    <div class={`screen garage-screen ${sheet ? 'open' : ''} ${showing ? 'showing' : ''} ${trucks ? 'trucks' : ''}`}>
      <header class="garage-hud">
        <BoltPile count={game.value.bolts} />
        {goalView}
        <div class="spacer" />
        <IconButton label="Trophies" class="trophies" onClick={() => { if (voice.active) { closeSheet(); setShelf(true); } }}>🏆</IconButton>
        <IconButton label="Show Off" class="show" onClick={startShow}>📸</IconButton>
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
      </header>
      <div class="garage-stage" ref={stageEl}>
        <canvas ref={canvas} />
        {showing && stage ? <ShowOff stage={stage} canvas={canvas.current!} stageEl={stageEl.current!} body={body} horn={f.horn} engine={f.engine} topper={f.topper} onClose={endShow} /> : (
          <div class="garage-overlay">
            <div class="bodyname">{BODY_NAMES[body]}</div>
            <button class="arrow l" aria-label="Previous truck" onClick={() => bodyStep(-1)}>◀</button>
            <button class="arrow r" aria-label="Next truck" onClick={() => bodyStep(1)}>▶</button>
            {SLOTS.map(s => (
              <button key={s.id} ref={el => { hots.current[s.id] = el; }} class={`hot hidden ${picker || (sheet === s.id && s.id === 'number') ? 'away' : sheet === s.id ? 'on' : ''} ${slotHasAffordable(s.id) ? 'aff' : 'quiet'}`} aria-label={s.name} onClick={() => openSheet(s.id)}>{s.icon}</button>
            ))}
            <button class={`trucks-btn ${trucks ? 'on' : bodyCanBuy ? 'afford' : ''}`} aria-label={trucks ? 'Close trucks' : 'Trucks'} aria-expanded={trucks}
              onClick={() => { if (voice.active) setTrucks(t => !t); }}>{trucks ? '✕' : '🚚'}</button>
            <div class="bodystrip" ref={strip}>
              {BODY_IDS.map(b => {
                const mine = owns(b), price = isStarter(b) ? 0 : PRICES.body;
                const cls = b === body ? 'on' : mine ? 'owned' : canAffordBody(b) ? 'afford' : 'locked';
                return (
                  <button key={b} class={`body-chip ${cls} ${wiggle === `body:${b}` ? 'wiggle' : ''}`} aria-label={BODY_NAMES[b]} aria-description={state(b === body, mine, `${price} Bolts`, cls === 'locked')} onClick={() => tapBodyChip(b)}>
                    <BodyArt body={b} color={mine ? '#e63946' : '#6b7385'} />
                    {!mine && <span class="cost"><Bolt size={18} />{price}</span>}
                    {cls === 'locked' && <span class="lock">🔒</span>}
                    {!isStarter(b) && goal() === bodyItem(b) && <span class="flag">🎯</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {sheet && !showing && (
        <div class={`sheet ${sheet === 'paint' ? 'paint' : ''}`}>
          <div class="sheethead">
            <span>{slotById(sheet).icon}</span>{slotById(sheet).name}
            {canPick && (picker
              ? <button class="numpick done" aria-label="Done" onClick={() => setPicking(false)}>✓</button>
              : <button class="numpick" aria-label="Pick your number" onClick={openPicker}>{f.doorNumber}</button>)}
            <button class="x" aria-label="Close" onClick={closeSheet}>✕</button>
          </div>
          {picker ? (
            <div class="numwheels">
              {([['tens', digits(f.doorNumber)[0]], ['ones', digits(f.doorNumber)[1]]] as const).map(([w, d]) => (
                <div key={w} class="numwheel">
                  <button aria-label={`${w} up`} onClick={() => turn(w, 1)}>▲</button>
                  <div class="digit">{d}</div>
                  <button aria-label={`${w} down`} onClick={() => turn(w, -1)}>▼</button>
                </div>
              ))}
            </div>
          ) : <div class="sheettiles">
            {([0, ...RUNGS] as const).map(r => {
              const un = isUnlocked(sheet, r), fitted = f[sheet] === r, legend = r === LEGENDARY;
              if (legend) {
                const wait = waitingFor(sheet), cls = fitted ? 'fitted' : un ? 'owned' : wait ? 'locked' : 'open';
                return (
                  <button key={r} class={`mod-tile legend ${cls} ${wiggle === `${sheet}:${r}` ? 'wiggle' : ''}`} aria-label={modName(sheet, r)} aria-description={`${state(fitted, un, fmt(legendaryPrice(sheet)), false)}${wait ? `, needs ${modName(sheet, TOP)} first` : ''}`} onClick={() => tap(sheet, r)}>
                    <div class="ico"><PartIcon slot={sheet} rung={r} /></div>
                    <div class="nm">{modName(sheet, r)}</div>
                    {!un && <div class="cost money">{fmt(legendaryPrice(sheet))}</div>}
                    {fitted && <div class="check">✓</div>}
                    {wait && <div class="wait"><PartIcon slot={sheet} rung={TOP} /><span class="lock">🔒</span></div>}
                  </button>
                );
              }
              const aff = canAfford(sheet, r), price = r ? PRICES.rungs[r] : 0;
              const cls = fitted ? 'fitted' : un ? 'owned' : aff ? 'afford' : 'locked';
              return (
                <button key={r} class={`mod-tile ${cls} ${wiggle === `${sheet}:${r}` ? 'wiggle' : ''}`} aria-label={modName(sheet, r)} aria-description={state(fitted, un, `${price} Bolts`, cls === 'locked')} onClick={() => tap(sheet, r)}>
                  <div class="ico"><PartIcon slot={sheet} rung={r} /></div>
                  <div class="nm">{modName(sheet, r)}</div>
                  {!un && <div class="cost"><Bolt size={20} />{price}</div>}
                  {fitted && <div class="check">✓</div>}
                  {cls === 'locked' && <><div class="lock">🔒</div><div class="prog"><i style={{ width: `${(game.value.bolts / price) * 100}%` }} /></div></>}
                  {r !== 0 && goal() === modId(sheet, r) && <div class="flag">🎯</div>}
                </button>
              );
            })}
          </div>}
          {sheet === 'paint' && (
            <div class="swatches">
              {COLOURS.map(c => {
                const mine = ownsColour(c.id), item = c.id === FREE_COLOUR ? null : colourItem(c.id);
                const cls = f.colour === c.id ? 'fitted' : mine ? 'owned' : canAffordColour(c.id) ? 'afford' : 'locked';
                return (
                  <button key={c.id} class={`swatch ${cls} ${item && wiggle === item ? 'wiggle' : ''}`} style={{ background: c.hex }} aria-label={c.name} aria-description={state(cls === 'fitted', mine, `${PRICES.colour} Bolts`, cls === 'locked')} onClick={() => tapSwatch(c.id)}>
                    {!mine && <span class="cost"><Bolt size={16} />{PRICES.colour}</span>}
                    {cls === 'fitted' && <span class="check">✓</span>}
                    {cls === 'locked' && <span class="lock">🔒</span>}
                    {item && goal() === item && <span class="flag">🎯</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {shelf && <Shelf onClose={() => setShelf(false)} />}
      {checkout && <Checkout key={checkout.id} checkout={checkout} onClose={() => setCheckout(current => current === checkout ? null : current)} />}
      {blocked && <div class="blocker" />}
    </div>
  );
}
