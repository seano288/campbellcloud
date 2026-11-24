// "Watch the deck", for show: his carrier working by itself. His aircraft (up to six, more with more hangar bays) come up on the lift,
// launch from the catapult, fly off, come back onto a wire and go below; his Fleet sails alongside. Nothing is paid or used.
import { useEffect, useRef } from 'preact/hooks';
import { IconButton } from '../../ui/bits';
import { airLook, drawAircraft } from '../art/aircraft';
import { drawCarrierSide, drawFleetShip } from '../art/ship';
import { player } from '../game';
import { screen } from '../nav';
import { useVoice } from '../voice';
import { FLEET } from '../ship/catalog';
import { yardShip } from '../ship/fleet';
import { airWing, deckLen, has, lookOf, targetWire, wires } from '../ship/ship';
import { offsets, pose } from './traffic';

export function WatchScreen() {
  const voice = useVoice(), a = player.state.value.ship;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { void voice.say('Watch the deck!'); }, []);
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!;
    const len = deckLen(a), planes = airWing(a).slice(0, 6 + Math.min(4, a.more.bay)), looks = planes.map(m => airLook(m, lookOf(a, m)));
    const lift = len * .44, wire = targetWire(wires(a)), offs = offsets(planes.length);
    const fleet = [...FLEET.filter(f => has(a, f.id)).map(f => f.ship), ...a.yard.slice(-8).map(n => yardShip(n).look)];
    let raf = 0;
    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width) return;
      if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
      const t = ms / 1000, W = r.width, H = r.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sea = H * .7, k = Math.min((W * .8) / (len + 60), (H * .5) / 220);
      const g = ctx.createLinearGradient(0, 0, 0, sea); g.addColorStop(0, '#5fb0f0'); g.addColorStop(1, '#cdeaff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, sea);
      ctx.fillStyle = '#1f4f8a'; ctx.fillRect(0, sea, W, H - sea);
      // the Fleet sails alongside, nearer to him than the carrier
      const x0 = (W - (len + 34) * k) / 2;
      drawCarrierSide(ctx, a, x0, sea, k, t, { parked: false });
      fleet.forEach((s, i) => drawFleetShip(ctx, s, ((i * 230 + t * 18) % (W + 300)) - 150, sea + (40 + (i % 2) * 30) * k, k * .5, t));
      looks.forEach((l, i) => {
        const p = pose(t + offs[i]!, len, lift, wire);
        if (!p.seen) return;
        drawAircraft(ctx, l, x0 + p.x * k, sea - p.y * k, k * .9, t, { gear: p.gear, hook: p.hook, tilt: p.tilt });
      });
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      for (let x = (t * 20) % 60 - 60; x < W; x += 60) ctx.fillRect(x, sea + 6, 30, 2);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [a]);
  return (
    <div class="watch-screen cd-watch">
      <canvas ref={ref} class="watch-canvas" role="img" aria-label="Your carrier at work" />
      <div class="watch-hud"><IconButton label="Carrier" onClick={() => { if (voice.active) screen.value = 'ship'; }}>🚢</IconButton></div>
    </div>
  );
}
