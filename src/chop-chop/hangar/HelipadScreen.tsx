// The Helipad: "Tap the helicopter". Time Flies' Hangar screen for helicopters: the 3D Helicopter stands in a real hangar
// with a hotspot on each Slot's part; tapping one swings the camera there and opens that Slot's sheet of 5 Mods (bottom
// sheet in portrait, side panel in landscape). Along the bottom, the strip shows every Helicopter, the locked ones with
// their Bolt price. 🚁 Lift Off flies it off the helipad into the sky, to fire its gun and rockets and land again; 🏆
// opens the Trophy Shelf. Legendaries wait in the Fuel Lock, opened by filling the tank to the right part.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope, sChime, sFanfare } from '../../audio/sfx';
import { confetti, sparks } from '../../celebrate/effects';
import { digits, turnWheel, type Wheel } from '../../garage/doorNumber';
import { Bolt, BoltPile, IconButton } from '../../ui/bits';
import { player } from '../game';
import { screen } from '../nav';
import { FACTS, numberLine, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope } from '../voice';
import {
  canAfford, canAffordColour, canAffordHeli, currentFit, currentHeli, goal, gotLine, isUnlocked, needLines, owns, ownsColour, setTailNumber, slotHasAffordable,
  stepHeli, tapColour, tapHeli, tapMod, vaultLine, waitingFor, waitLine,
} from './actions';
import { colourItem, COLOURS, FREE_COLOUR, HELI_IDS, HELI_NAMES, heliItem, isStarter, LEGENDARY, modId, modName, RUNGS, SLOTS, slotById, TOP, type BoughtHeli, type ColourId, type HeliId, type Rung, type SlotId } from './catalog';
import { FuelLock } from './FuelLock';
import { HeliArt } from './HeliArt';
import { HELIS } from './helis';
import { PRICES } from './helipad';
import { LiftOff } from './LiftOff';
import { ModIcon } from './ModIcon';
import { rotorSound } from './sounds';
import { HelipadStage, spreadHotspots } from './three/stage';

/** One fact about the Helicopter each time it's chosen, round and round. */
const factTurn: Partial<Record<HeliId, number>> = {};
export const nextFact = (h: HeliId) => { const i = factTurn[h] ?? 0; factTurn[h] = i + 1; return FACTS[h][i % FACTS[h].length] as Phrase; };

export function HelipadScreen({ goal: goalView, onShelf }: { goal: ComponentChildren; onShelf(): void }) {
  const voice = useVoiceScope(), { say } = voice;
  const canvas = useRef<HTMLCanvasElement>(null), stageEl = useRef<HTMLDivElement>(null), strip = useRef<HTMLDivElement>(null);
  const hots = useRef<Partial<Record<SlotId, HTMLButtonElement | null>>>({});
  const [stage, setStage] = useState<HelipadStage | null>(null);
  const [sheet, setSheet] = useState<SlotId | null>(null);
  const [picking, setPicking] = useState(false);
  const [flying, setFlying] = useState(false);
  const [vault, setVault] = useState<SlotId | null>(null);
  const [wiggle, setWiggle] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const heli = currentHeli(), f = currentFit(), bolts = player.state.value.currency.balance;

  useEffect(() => {
    // three.js is in the main bundle, not a lazy chunk: an update can't leave the Helipad pointing at a chunk that's gone
    const st = new HelipadStage(canvas.current!, stageEl.current!);
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
    void say('Helipad!');
    return () => st.dispose();
  }, []);
  useEffect(() => { stage?.setHeli(HELIS[heli], f); }, [stage, heli, JSON.stringify(f)]);
  useEffect(() => { strip.current?.querySelector('.on')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, [heli, flying]);

  const nope = (key: string) => { sNope(); setWiggle(key); setTimeout(() => setWiggle(null), 450); };
  function celebrate(line: Phrase) {
    setBlocked(true);
    sFanfare();
    confetti(40, voice.signal);
    if (stage && stageEl.current) { const r = stageEl.current.getBoundingClientRect(); sparks(stage.heliPoint(), { w: r.width, h: r.height }, voice.signal); }
    void say(line, 'Wow!').then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 2500);
  }

  function openSheet(slot: SlotId) {
    if (!voice.active) return;
    setSheet(slot); setPicking(false);
    stage?.focus(slot);
    if (slot === 'rotor') { rotorSound(f.rotor); stage?.rev(); }
    if (slot === 'smoke') stage?.puff();
    void say(slotById(slot).name);
  }
  function closeSheet() { if (voice.active) { setSheet(null); setPicking(false); stage?.focus(null); } }

  function tap(slot: SlotId, rung: Rung) {
    if (!voice.active) return;
    const result = tapMod(slot, rung);
    if (result.kind === 'rejected') return;
    if (slot === 'rotor' && result.kind !== 'need' && result.kind !== 'waiting' && result.kind !== 'vault') { rotorSound(rung); stage?.rev(); }
    if (slot === 'smoke' && rung) stage?.puff();
    if (result.kind === 'fitted') { sClink(); void say(modName(slot, rung)); }
    else if (result.kind === 'unlocked') celebrate(gotLine(modId(slot, rung as 1 | 2 | 3)));
    else if (result.kind === 'vault') { setVault(slot); }
    else if (result.kind === 'waiting') { nope(`${slot}:${rung}`); void say(modName(slot, LEGENDARY), waitLine(slot)); }
    else { nope(`${slot}:${rung}`); void say(...needLines(modId(slot, rung as 1 | 2 | 3))); }
  }
  function tapSwatch(c: ColourId) {
    if (!voice.active) return;
    const result = tapColour(c), name = COLOURS.find(x => x.id === c)!.name;
    if (result.kind === 'rejected') return;
    if (result.kind === 'fitted') { sClink(); void say(name); }
    else if (result.kind === 'unlocked') celebrate(gotLine(colourItem(c as Exclude<ColourId, 'factory'>)));
    else { nope(`colour:${c}`); void say(...needLines(colourItem(c as Exclude<ColourId, 'factory'>))); }
  }
  function tapChip(h: HeliId) {
    if (!voice.active) return;
    const result = tapHeli(h);
    if (result.kind === 'switched') { sClink(); void say(HELI_NAMES[h], nextFact(h)); }
    else if (result.kind === 'bought') celebrate(gotLine(heliItem(h as BoughtHeli)));
    else if (result.kind === 'need') { nope(`heli:${h}`); if (!isStarter(h)) void say(...needLines(heliItem(h as BoughtHeli)), nextFact(h)); }
    else if (h === heli) void say(HELI_NAMES[h], nextFact(h));
  }
  const step = (d: 1 | -1) => { if (voice.active) { const h = stepHeli(d); void say(HELI_NAMES[h]); } };
  function turn(wheel: Wheel, dir: 1 | -1) {
    if (!voice.active) return;
    const n = turnWheel(f.tailNumber, wheel, dir);
    setTailNumber(n); sClink(); void say(numberLine(n));
  }
  function takeOff() { if (voice.active) { closeSheet(); setFlying(true); } }
  function vaultOpened(slot: SlotId) {
    setVault(null);
    sChime();
    celebrate(vaultLine(slot));
  }

  const canPick = sheet === 'number' && f.number > 0, picker = picking && canPick;
  return (
    <div class={`screen garage-screen hangar-screen helipad-screen ${sheet ? 'open' : ''} ${flying ? 'showing' : ''}`}>
      <header class="garage-hud">
        <BoltPile count={bolts} />
        {goalView}
        <div class="spacer" />
        <IconButton label="Trophies" class="trophies" onClick={() => { if (voice.active) { closeSheet(); onShelf(); } }}>🏆</IconButton>
        <IconButton label="Lift Off" class="show" onClick={takeOff}>🚁</IconButton>
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
      </header>
      <div class="garage-stage" ref={stageEl}>
        <canvas ref={canvas} />
        {flying && stage ? <LiftOff stage={stage} canvas={canvas.current!} heli={heli} fit={f} onClose={() => setFlying(false)} /> : (
          <div class="garage-overlay">
            <button class="bodyname jetname" onClick={() => void say(HELI_NAMES[heli], nextFact(heli))}>{HELI_NAMES[heli]}</button>
            <button class="arrow l" aria-label="Previous helicopter" onClick={() => step(-1)}>◀</button>
            <button class="arrow r" aria-label="Next helicopter" onClick={() => step(1)}>▶</button>
            {SLOTS.map(s => (
              <button key={s.id} ref={el => { hots.current[s.id] = el; }} class={`hot hidden ${picker || (sheet === s.id && s.id === 'number') ? 'away' : sheet === s.id ? 'on' : ''} ${slotHasAffordable(s.id) ? 'aff' : ''}`} aria-label={s.name} onClick={() => openSheet(s.id)}>{s.icon}</button>
            ))}
            <div class="bodystrip" ref={strip}>
              {HELI_IDS.map(h => {
                const mine = owns(h), cls = h === heli ? 'on' : mine ? 'owned' : canAffordHeli(h) ? 'afford' : 'locked';
                return (
                  <button key={h} class={`body-chip jet-chip heli-chip ${cls} ${wiggle === `heli:${h}` ? 'wiggle' : ''}`} aria-label={HELI_NAMES[h]} onClick={() => tapChip(h)}>
                    <HeliArt heli={h} color={mine ? '#d6dde4' : '#98a1b0'} />
                    {!mine && <span class="cost"><Bolt size={18} />{PRICES.heli}</span>}
                    {cls === 'locked' && <span class="lock">🔒</span>}
                    {!isStarter(h) && goal() === heliItem(h as BoughtHeli) && <span class="flag">🎯</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {sheet && !flying && (
        <div class={`sheet ${sheet === 'paint' ? 'paint' : ''}`}>
          <div class="sheethead">
            <span>{slotById(sheet).icon}</span>{slotById(sheet).name}
            {canPick && (picker
              ? <button class="numpick done" aria-label="Done" onClick={() => setPicking(false)}>✓</button>
              : <button class="numpick" aria-label="Pick your number" onClick={() => { setPicking(true); void say(numberLine(f.tailNumber)); }}>{f.tailNumber}</button>)}
            <button class="x" aria-label="Close" onClick={closeSheet}>✕</button>
          </div>
          {picker ? (
            <div class="numwheels">
              {([['tens', digits(f.tailNumber)[0]], ['ones', digits(f.tailNumber)[1]]] as const).map(([w, d]) => (
                <div key={w} class="numwheel">
                  <button aria-label={`${w} up`} onClick={() => turn(w, 1)}>▲</button>
                  <div class="digit">{d}</div>
                  <button aria-label={`${w} down`} onClick={() => turn(w, -1)}>▼</button>
                </div>
              ))}
            </div>
          ) : <div class="sheettiles">
            {([0, ...RUNGS] as const).map(r => {
              const un = isUnlocked(sheet, r), fitted = f[sheet] === r;
              if (r === LEGENDARY) {
                const wait = waitingFor(sheet), cls = fitted ? 'fitted' : un ? 'owned' : wait ? 'locked' : 'open';
                return (
                  <button key={r} class={`mod-tile legend ${cls} ${wiggle === `${sheet}:${r}` ? 'wiggle' : ''}`} aria-label={modName(sheet, r)} onClick={() => tap(sheet, r)}>
                    <div class="ico"><ModIcon slot={sheet} rung={r} heli={heli} /></div>
                    <div class="nm">{modName(sheet, r)}</div>
                    {!un && <div class="cost vault">⏰</div>}
                    {fitted && <div class="check">✓</div>}
                    {wait && <><div class="lock">🔒</div><div class="wait" aria-label={`Needs ${modName(sheet, TOP)}`}><ModIcon slot={sheet} rung={TOP} heli={heli} /></div></>}
                  </button>
                );
              }
              const aff = canAfford(sheet, r), price = r ? PRICES.rungs[r as 1 | 2 | 3] : 0;
              const cls = fitted ? 'fitted' : un ? 'owned' : aff ? 'afford' : 'locked';
              return (
                <button key={r} class={`mod-tile ${cls} ${wiggle === `${sheet}:${r}` ? 'wiggle' : ''}`} aria-label={modName(sheet, r)} onClick={() => tap(sheet, r)}>
                  <div class="ico"><ModIcon slot={sheet} rung={r} heli={heli} /></div>
                  <div class="nm">{modName(sheet, r)}</div>
                  {!un && <div class="cost"><Bolt size={20} />{price}</div>}
                  {fitted && <div class="check">✓</div>}
                  {cls === 'locked' && <><div class="lock">🔒</div><div class="prog"><i style={{ width: `${Math.min(100, (bolts / price) * 100)}%` }} /></div></>}
                  {r !== 0 && goal() === modId(sheet, r as 1 | 2 | 3) && <div class="flag">🎯</div>}
                </button>
              );
            })}
          </div>}
          {sheet === 'paint' && (
            <div class="swatches">
              {COLOURS.map(c => {
                const mine = ownsColour(c.id), cls = f.colour === c.id && f.paint === 0 ? 'fitted' : mine ? 'owned' : canAffordColour(c.id) ? 'afford' : 'locked';
                const bg = c.id === FREE_COLOUR ? HELIS[heli].livery.factory.base : c.hex;
                return (
                  <button key={c.id} class={`swatch ${cls} ${wiggle === `colour:${c.id}` ? 'wiggle' : ''}`} style={{ background: bg }} aria-label={c.name} onClick={() => tapSwatch(c.id)}>
                    {c.id === FREE_COLOUR && <span class="factory">🏭</span>}
                    {!mine && <span class="cost"><Bolt size={16} />{PRICES.colour}</span>}
                    {cls === 'fitted' && <span class="check">✓</span>}
                    {cls === 'locked' && <span class="lock">🔒</span>}
                    {c.id !== FREE_COLOUR && goal() === colourItem(c.id) && <span class="flag">🎯</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {vault && <FuelLock slot={vault} onOpen={() => vaultOpened(vault)} onClose={() => setVault(null)} />}
      {blocked && <div class="blocker" />}
    </div>
  );
}
