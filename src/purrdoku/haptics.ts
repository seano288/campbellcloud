// Purrdoku's buzzes. Android has navigator.vibrate; iOS Safari doesn't, but since iOS 18 flipping a switch checkbox
// gives a light tap, so there a hidden one is flipped through its label. That is one strength only, and only straight
// after a touch, so on iOS a pattern is just taps spaced out. Anywhere with neither, nothing happens.

/** Gaps between iOS taps; any closer and they run together into one. */
const GAP_MS = 110;

function tapIOS() {
  const label = document.createElement('label'), input = document.createElement('input');
  label.ariaHidden = 'true';
  label.style.display = 'none';
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.append(input);
  document.head.append(label);
  label.click();
  label.remove();
}

function buzz(pattern: number[], taps: number) {
  if (navigator.vibrate) { navigator.vibrate(pattern); return; }
  for (let i = 0; i < taps; i++) {
    if (i === 0) tapIOS();
    else setTimeout(tapIOS, i * GAP_MS);
  }
}

export const haptic = {
  /** a ✕ marked or cleared */
  mark: () => buzz([8], 1),
  /** a cat laid down in the right place */
  cat: () => buzz([20], 1),
  /** a wrong cat: a fish gone */
  wrong: () => buzz([60, 60, 60], 2),
  /** the board solved */
  won: () => buzz([30, 60, 30, 60, 90], 3),
};
