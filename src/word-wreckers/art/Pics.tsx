// The pictures the screens share: a machine as he has it (paint, driver, upgrades), a building (gold or not) and a paint swatch.
import { player } from '../game';
import { DRIVERS, ITEMS, paintOf, type BuildingId, type ItemKey, type MachineId } from '../yard/shop';
import { paintFor, type YardState } from '../yard/yard';
import { buildingSvg } from './buildings';
import { machineSvg, type Look } from './machines';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/** How this machine looks with what he owns; `trying`: an item he's trying on in the Yard, shown as if it were his. */
export function lookOf(yard: Pick<YardState, 'owned' | 'paints' | 'driver'>, id: MachineId, trying?: ItemKey | null): Look {
  const t = trying ? ITEMS.find(i => i.key === trying) : undefined;
  const paint = t?.tab === 'paint' ? t.id : paintFor(yard, id);
  const driver = DRIVERS.find(d => d.id === (t?.tab === 'driver' ? t.id : yard.driver))?.icon ?? '👷';
  return { paint, driver, ups: [...yard.owned.filter(k => k.startsWith(`up:${id}:`)), ...(t?.tab === 'up' && t.machine === id ? [t.key] : [])] };
}

export function MachineView({ id, yard = player.state.value.yard, trying, class: c, label = 'Your machine' }: {
  id: MachineId; yard?: Pick<YardState, 'owned' | 'paints' | 'driver'>; trying?: ItemKey | null; class?: string; label?: string | null;
}) {
  const svg = machineSvg(id, lookOf(yard, id, trying));
  return <span class={cls('machine-view', `m-${id}`, c)} role={label ? 'img' : undefined} aria-label={label ?? undefined} aria-hidden={label ? undefined : true} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function BuildingView({ id, gold = false, class: c, label }: { id: BuildingId; gold?: boolean; class?: string; label?: string | null }) {
  const { svg } = buildingSvg(id, gold);
  return <span class={cls('building-view', gold && 'gold', c)} role={label ? 'img' : undefined} aria-label={label ?? undefined} aria-hidden={label ? undefined : true} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Swatch({ paint }: { paint: string }) {
  const p = paintOf(paint);
  return <span class={`swatch-pic ${p.pattern ?? ''}`} style={{ background: p.body, '--trim': p.trim }} aria-hidden="true" />;
}
