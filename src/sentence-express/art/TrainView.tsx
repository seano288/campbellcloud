// His train as a picture (the Shed, Home, the end of a Round): the side view from art/train.ts.
import { useMemo } from 'preact/hooks';
import { trainSvg } from './train';

export function TrainView({ train, cars, class: cls = '', label = 'Your train' }: { train: { engine: string; cars: readonly string[]; paint: string }; cars?: number; class?: string; label?: string | null }) {
  const svg = useMemo(() => trainSvg(train, { max: cars }).svg, [train.engine, train.paint, train.cars.join(), cars]);
  return <span class={`train-view ${cls}`} role={label ? 'img' : undefined} aria-label={label ?? undefined} aria-hidden={label ? undefined : 'true'} dangerouslySetInnerHTML={{ __html: svg }} />;
}
