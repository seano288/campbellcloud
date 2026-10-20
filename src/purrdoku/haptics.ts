// Purrdoku's buzzes. Android has navigator.vibrate; iOS Safari doesn't, but since iOS 18 flipping a switch checkbox
// gives a light tap, so there a hidden one is flipped through its label. That is one strength only, and iOS only
// allows it while it's handling a finger lifting off the screen, so on iOS a buzz waits for the touchend of the tap
// that caused it (a drag's ticks come as one on letting go), and a pattern is taps spaced out.

/** Gaps between iOS taps; any closer and they run together into one. */
const GAP_MS = 110;

const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

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

/** iOS taps waiting for the finger to lift: the biggest buzz asked for during this touch. */
let pending = 0;
if (iOS) {
  addEventListener('touchend', () => {
    const taps = pending;
    pending = 0;
    for (let i = 0; i < taps; i++) {
      if (i === 0) tapIOS();
      else setTimeout(tapIOS, i * GAP_MS);
    }
  }, true);
}

function buzz(pattern: number[], taps: number) {
  if (iOS) pending = Math.max(pending, taps);
  else navigator.vibrate?.(pattern);
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
