// The Camp: "Tap a soldier". His army stands in rows on its play-mat in 3D, and he orbits it with a finger; tapping a
// soldier says what it is and a true fact, and its whole Squad jumps. Along the bottom, a strip of tabs opens a sheet
// (bottom sheet in portrait, side panel in landscape): Squads (unlock one, or recruit one more soldier; new recruits march
// in from the corner), a sheet of five Mods for each Gear Slot, and the Team Colours. 🎺 Parade marches the army round the
// mat to his orders, 💥 Battle sends it against the wind-up robots, 🏆 opens the Trophy Shelf. Legendaries wait in the
// Password Lock, opened by building a word.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti, sparks } from '../../celebrate/effects';
import { Bolt, BoltPile, IconButton } from '../../ui/bits';
import { player } from '../game';
import { screen } from '../nav';
import { armyLine, FACTS, fullLine, newSoldier, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope } from '../voice';
import {
  canAfford, canAffordColour, canAffordRecruit, canAffordUnit, colourHex, coloursAffordable, goal, gotLine, hasUnit, isUnlocked, needLines, ownsColour,
  slotHasAffordable, squadsAffordable, tapColour, tapMod, tapUnit, vaultLine, waitingFor, waitLine,
} from './actions';
import { armySize, PRICES } from './camp';
import { colourItem, COLOURS, isStarterColour, LEGENDARY, modId, modName, RUNGS, SLOTS, slotById, TOP, UNIT_IDS, UNITS, unitItem, type BoughtColour, type BoughtUnit, type ColourId, type Rung, type SlotId, type UnitId } from './catalog';
import { Battle } from './Battle';
import { ModIcon } from './ModIcon';
import { Parade } from './Parade';
import { PasswordLock } from './PasswordLock';
import { sRecruit } from './sounds';
import { CampStage } from './three/stage';
import { UnitArt } from './UnitArt';

/** One fact about the Squad each time it's tapped, round and round. */
const factTurn: Partial<Record<UnitId, number>> = {};
export const nextFact = (u: UnitId) => { const i = factTurn[u] ?? 0; factTurn[u] = i + 1; return FACTS[u][i % FACTS[u].length] as Phrase; };

type Sheet = 'squads' | 'colour' | SlotId;
const TAP_PX = 12;

export function CampScreen({ goal: goalView, onShelf }: { goal: ComponentChildren; onShelf(): void }) {
  const voice = useVoiceScope(), { say } = voice;
  const canvas = useRef<HTMLCanvasElement>(null), stageEl = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<CampStage | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [show, setShow] = useState<'parade' | 'battle' | null>(null);
  const [vault, setVault] = useState<SlotId | null>(null);
  const [wiggle, setWiggle] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const camp = player.state.value.camp, bolts = player.state.value.currency.balance, team = colourHex(camp), size = armySize(camp);

  useEffect(() => {
    // three.js is in the main bundle, not a lazy chunk: an update can't leave the Camp pointing at a chunk that's gone
    const st = new CampStage(canvas.current!, stageEl.current!);
    setStage(st);
    void say('Camp!', armyLine(armySize(player.state.peek().camp)));
    return () => st.dispose();
  }, []);
  useEffect(() => { stage?.setArmy(camp); }, [stage, JSON.stringify(camp)]);
  useEffect(() => { // tapping a soldier on the mat
    const el = canvas.current;
    if (!el || !stage || show) return;
    let down: { x: number; y: number } | null = null;
    const press = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const release = (e: PointerEvent) => {
      if (!down || !voice.active) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      const u = moved < TAP_PX ? stage.pick(e.clientX, e.clientY) : null;
      if (u && u.kind !== 'robot') { stage.cheer(u.kind); sClink(); void say(UNITS[u.kind].name, nextFact(u.kind)); }
    };
    el.addEventListener('pointerdown', press); el.addEventListener('pointerup', release);
    return () => { el.removeEventListener('pointerdown', press); el.removeEventListener('pointerup', release); };
  }, [stage, show]);

  const nope = (key: string) => { sNope(); setWiggle(key); setTimeout(() => setWiggle(null), 450); };
  function celebrate(...lines: Phrase[]) {
    setBlocked(true);
    sFanfare();
    confetti(40, voice.signal);
    if (stage && stageEl.current) { const r = stageEl.current.getBoundingClientRect(); sparks(stage.armyPoint(), { w: r.width, h: r.height }, voice.signal); }
    void say(...lines, 'Wow!').then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 2500);
  }

  function openSheet(s: Sheet) {
    if (!voice.active) return;
    setSheet(sheet === s ? null : s);
    void say(s === 'squads' ? 'Squads!' : s === 'colour' ? (COLOURS.find(c => c.id === camp.colour)?.name ?? 'Army Green') : slotById(s).name);
  }
  function tapSquad(u: UnitId) {
    if (!voice.active) return;
    const result = tapUnit(u), name = UNITS[u].name;
    if (result.kind === 'rejected') return;
    if (result.kind === 'unlocked') { stage?.cheer(u); celebrate(gotLine(unitItem(u as BoughtUnit)), nextFact(u)); }
    else if (result.kind === 'recruited') { sRecruit(); stage?.cheer(u); void say(newSoldier(u), armyLine(armySize(result.state.camp))); }
    else if (result.kind === 'full') { nope(`unit:${u}`); void say(fullLine(u)); }
    else if (result.kind === 'need') { nope(`unit:${u}`); void say(...needLines(result.item, name)); }
  }
  function tap(slot: SlotId, rung: Rung) {
    if (!voice.active) return;
    const result = tapMod(slot, rung);
    if (result.kind === 'rejected') return;
    if (result.kind === 'fitted') { sClink(); void say(modName(slot, rung)); }
    else if (result.kind === 'unlocked') celebrate(gotLine(modId(slot, rung as 1 | 2 | 3)));
    else if (result.kind === 'vault') setVault(slot);
    else if (result.kind === 'waiting') { nope(`${slot}:${rung}`); void say(modName(slot, LEGENDARY), waitLine(slot)); }
    else { nope(`${slot}:${rung}`); const item = modId(slot, rung as 1 | 2 | 3); void say(...needLines(item, modName(slot, rung))); }
  }
  function tapSwatch(c: ColourId) {
    if (!voice.active) return;
    const result = tapColour(c), name = COLOURS.find(x => x.id === c)!.name;
    if (result.kind === 'rejected') return;
    if (result.kind === 'fitted') { sClink(); void say(name); }
    else if (result.kind === 'unlocked') celebrate(gotLine(colourItem(c as BoughtColour)));
    else { nope(`colour:${c}`); void say(...needLines(colourItem(c as BoughtColour), name)); }
  }
  function startShow(s: 'parade' | 'battle') { if (voice.active && stage) { setSheet(null); setShow(s); } }
  function vaultOpened(slot: SlotId) { setVault(null); sChime(); celebrate(vaultLine(slot)); }

  const tabs: { id: Sheet; label: string; icon: ComponentChildren; aff: boolean }[] = [
    { id: 'squads', label: 'Squads', icon: <UnitArt unit="rifleman" color={team} />, aff: squadsAffordable() },
    ...SLOTS.map(s => ({ id: s.id as Sheet, label: s.name, icon: <span class="tab-emoji">{s.icon}</span>, aff: slotHasAffordable(s.id) })),
    { id: 'colour', label: 'Colours', icon: <i class="dab" style={{ background: team }} />, aff: coloursAffordable() },
  ];
  return (
    <div class={`screen garage-screen hangar-screen camp-screen ${sheet ? 'open' : ''} ${show ? 'showing' : ''}`}>
      <header class="garage-hud">
        <BoltPile count={bolts} />
        {goalView}
        <div class="spacer" />
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
      </header>
      <div class="garage-stage" ref={stageEl}>
        <canvas ref={canvas} />
        {show === 'parade' && stage ? <Parade stage={stage} onClose={() => { setShow(null); void say('Halt!'); }} />
          : show === 'battle' && stage ? <Battle stage={stage} boom={camp.gear.boom} onClose={() => setShow(null)} />
            : (
              <div class="garage-overlay">
                <IconButton label="Trophies" class="trophies stage-btn tl" onClick={() => { if (voice.active) { setSheet(null); onShelf(); } }}>🏆</IconButton>
                <div class="stage-btn tr show-btns">
                  <IconButton label="Parade" class="show" onClick={() => startShow('parade')}>🎺</IconButton>
                  <IconButton label="Battle" class="show" onClick={() => startShow('battle')}>💥</IconButton>
                </div>
                <button class="bodyname jetname armyname" onClick={() => void say(armyLine(size))}>🪖 {size}</button>
                <div class="bodystrip tabstrip">
                  {tabs.map(t => (
                    <button key={t.id} class={`body-chip tab-chip ${sheet === t.id ? 'on' : ''} ${t.aff ? 'aff' : ''}`} aria-label={t.label} onClick={() => openSheet(t.id)}>
                      {t.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
      </div>
      {sheet && !show && (
        <div class={`sheet ${sheet === 'squads' ? 'squads' : ''}`}>
          <div class="sheethead">
            <span>{sheet === 'squads' ? '🪖' : sheet === 'colour' ? '🎨' : slotById(sheet).icon}</span>
            {sheet === 'squads' ? 'Squads' : sheet === 'colour' ? 'Colours' : slotById(sheet).name}
            <button class="x" aria-label="Close" onClick={() => setSheet(null)}>✕</button>
          </div>
          {sheet === 'squads' ? (
            <div class="sheettiles squad-tiles">
              {UNIT_IDS.map(u => {
                const mine = hasUnit(u), n = camp.army[u], full = n >= UNITS[u].max;
                const price = mine ? UNITS[u].recruit : UNITS[u].unlock, aff = mine ? canAffordRecruit(u) : canAffordUnit(u);
                const cls = !mine ? (aff ? 'afford' : 'locked') : full ? 'fitted' : aff ? 'owned afford' : 'owned';
                return (
                  <button key={u} class={`mod-tile squad-tile ${cls} ${wiggle === `unit:${u}` ? 'wiggle' : ''}`} aria-label={UNITS[u].name} onClick={() => tapSquad(u)}>
                    <div class="ico"><UnitArt unit={u} color={mine ? team : '#5b6270'} /></div>
                    <div class="nm">{UNITS[u].name}</div>
                    {mine && <div class="count">{n}<small>/{UNITS[u].max}</small></div>}
                    {!full && <div class="cost">{mine ? '+' : ''}<Bolt size={20} />{price}</div>}
                    {!mine && !aff && <div class="lock">🔒</div>}
                    {!mine && goal() === unitItem(u as BoughtUnit) && <div class="flag">🎯</div>}
                  </button>
                );
              })}
            </div>
          ) : sheet === 'colour' ? (
            <div class="swatches big">
              {COLOURS.map(c => {
                const mine = ownsColour(c.id), cls = camp.colour === c.id ? 'fitted' : mine ? 'owned' : canAffordColour(c.id) ? 'afford' : 'locked';
                return (
                  <button key={c.id} class={`swatch ${cls} ${wiggle === `colour:${c.id}` ? 'wiggle' : ''}`} style={{ background: c.hex }} aria-label={c.name} onClick={() => tapSwatch(c.id)}>
                    {!mine && <span class="cost"><Bolt size={16} />{PRICES.colour}</span>}
                    {cls === 'fitted' && <span class="check">✓</span>}
                    {cls === 'locked' && <span class="lock">🔒</span>}
                    {!isStarterColour(c.id) && goal() === colourItem(c.id as BoughtColour) && <span class="flag">🎯</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div class="sheettiles">
              {([0, ...RUNGS] as const).map(r => {
                const s = sheet, un = isUnlocked(s, r), fitted = camp.gear[s] === r;
                if (r === LEGENDARY) {
                  const wait = waitingFor(s), cls = fitted ? 'fitted' : un ? 'owned' : wait ? 'locked' : 'open';
                  return (
                    <button key={r} class={`mod-tile legend ${cls} ${wiggle === `${s}:${r}` ? 'wiggle' : ''}`} aria-label={modName(s, r)} onClick={() => tap(s, r)}>
                      <div class="ico"><ModIcon slot={s} rung={r} /></div>
                      <div class="nm">{modName(s, r)}</div>
                      {!un && <div class="cost vault">🔐</div>}
                      {fitted && <div class="check">✓</div>}
                      {wait && <><div class="lock">🔒</div><div class="wait" aria-label={`Needs ${modName(s, TOP)}`}><ModIcon slot={s} rung={TOP} /></div></>}
                    </button>
                  );
                }
                const aff = canAfford(s, r), price = r ? PRICES.rungs[r as 1 | 2 | 3] : 0;
                const cls = fitted ? 'fitted' : un ? 'owned' : aff ? 'afford' : 'locked';
                return (
                  <button key={r} class={`mod-tile ${cls} ${wiggle === `${s}:${r}` ? 'wiggle' : ''}`} aria-label={modName(s, r)} onClick={() => tap(s, r)}>
                    <div class="ico"><ModIcon slot={s} rung={r} /></div>
                    <div class="nm">{modName(s, r)}</div>
                    {!un && <div class="cost"><Bolt size={20} />{price}</div>}
                    {fitted && <div class="check">✓</div>}
                    {cls === 'locked' && <><div class="lock">🔒</div><div class="prog"><i style={{ width: `${Math.min(100, (bolts / price) * 100)}%` }} /></div></>}
                    {r !== 0 && goal() === modId(s, r as 1 | 2 | 3) && <div class="flag">🎯</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {vault && <PasswordLock slot={vault} onOpen={() => vaultOpened(vault)} onClose={() => setVault(null)} />}
      {blocked && <div class="blocker" />}
    </div>
  );
}
