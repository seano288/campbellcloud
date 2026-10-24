/** The device's Reduce Motion setting: spins, swings and fly-ins happen at once instead. */
export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
