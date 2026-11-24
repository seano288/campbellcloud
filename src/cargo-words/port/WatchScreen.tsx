// "Watch it run": his port working by itself, to show off. His ships (up to six, and a visitor) come in to their berths one after
// another, his cranes' trolleys run to and fro unloading them, the ships go out again, and the train and the lorries carry containers
// away. Nothing is paid or used. More berths, ships, cranes and rail mean more going on.
import { useEffect, useMemo } from 'preact/hooks';
import { IconButton } from '../../ui/bits';
import type { Moving } from '../art/port';
import { player } from '../game';
import { screen } from '../nav';
import { useVoice } from '../voice';
import { berths, fleetKinds, has, planGo, shipLook, type PortState } from './port';
import { BERTH_X, DRAW_MOST } from './plot';
import { PortView } from './PortView';

const CYCLE = 24;
/** Where everything is at time t: each ship has its own turn, offset so they don't all move at once. */
export function movingAt(p: PortState, t: number): Moving {
  const visitor = planGo(p).look;
  const looks = [...fleetKinds(p).slice(0, 6).map(k => shipLook(p, k)), visitor];
  const slots = Math.min(BERTH_X.length, Math.max(1, berths(p)), looks.length);
  const ships = looks.slice(0, slots).map((look, i) => {
    const phase = ((t / CYCLE + i / slots) % 1 + 1) % 1;
    // in (0 to .15), moored and unloading (.15 to .7), out (.7 to .85), away (.85 to 1)
    const out = phase < 0.15 ? 1 - phase / 0.15 : phase < 0.7 ? 0 : phase < 0.85 ? (phase - 0.7) / 0.15 : 1;
    const boxes = phase < 0.15 ? 9 : phase < 0.7 ? Math.round(9 * (1 - (phase - 0.15) / 0.55)) : 0;
    return { berth: i, out, look, boxes };
  });
  const cranes = 1 + Math.min(DRAW_MOST.crane, p.more.crane);
  return {
    ships, train: has(p, 'piece:engine') ? ((t / 16) % 1.4) / 1.4 : null,
    lorries: [0, 1].map(i => ((t / 9 + i * 0.5) % 1)),
    trolleys: Array.from({ length: cranes }, (_, i) => 0.5 + 0.45 * Math.sin(t * 0.9 + i * 1.7)),
  };
}

export function WatchScreen() {
  const voice = useVoice(), p = player.state.value.port;
  const moving = useMemo(() => (t: number) => movingAt(p, t), [p]);
  useEffect(() => { void voice.say('Watch it run!'); }, []);
  return (
    <div class="screen cw-watch-screen">
      <div class="cw-watch-view"><PortView p={p} moving={moving} /></div>
      <div class="cw-watch-hud"><IconButton label="Port" onClick={() => { if (voice.active) screen.value = 'port'; }}>🏗️</IconButton></div>
    </div>
  );
}
