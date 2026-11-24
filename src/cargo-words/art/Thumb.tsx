// Small pictures drawn in code for the screens around the Crane: a ship (the shop's Ships tab, the Load button, the go's card and the
// "next at the quay" panel) and a crane (the shop's Cranes tab). Each is drawn once to fit its box, and again only when the box changes
// size, so a tray full of them costs nothing while he scrolls.
import { useEffect, useRef } from 'preact/hooks';
import { drawCraneFitted, type CraneKind } from './crane';
import { drawShipFitted, type ShipLook } from './ship';

function CanvasArt({ draw, deps, class: c = '' }: { draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; deps: readonly unknown[]; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!;
    let size = '';
    const paint = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), key = `${r.width}x${r.height}@${dpr}`;
      if (key === size || r.width < 2 || r.height < 2) return;
      size = key;
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
      draw(ctx, r.width, r.height);
    };
    paint();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(paint);
    ro?.observe(canvas);
    return () => ro?.disconnect();
  }, deps);
  return <canvas ref={ref} class={`cw-art ${c}`} aria-hidden="true" />;
}

/** A ship of `cols` container stacks, in its paint, on a strip of water (or without it). */
export function ShipArt({ look, cols, water = true, class: c = '' }: { look: ShipLook; cols: number; water?: boolean; class?: string }) {
  return <CanvasArt class={c} deps={[look.kind, look.hull, look.funnel, look.mark, look.trim, cols, water]} draw={(ctx, w, h) => drawShipFitted(ctx, look, 6 + cols * 4, w, h, water)} />;
}

/** One of the five cranes, in his crane paint. */
export function CraneArt({ kind, paint, lights = null, class: c = '' }: { kind: CraneKind; paint: string; lights?: string | null; class?: string }) {
  return <CanvasArt class={c} deps={[kind, paint, lights]} draw={(ctx, w, h) => drawCraneFitted(ctx, kind, paint, w, h, lights)} />;
}
