// The device's "Reduce Motion" setting. Effects that only decorate are skipped; moves that tell him something
// happen at once instead of travelling.
const query = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export const reducedMotion = () => !!query?.matches;
