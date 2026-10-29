// One AudioContext for the voice and every sound effect. iPad Safari only lets it play after a tap,
// so unlockAudio() is called from the tap-to-start button.
let ctx: AudioContext | null = null;

export function audio(): AudioContext {
  ctx ??= new AudioContext();
  // iPad Safari parks the context as 'interrupted', not 'suspended', when the screen locks, the app goes
  // to the background or a call comes in, so wake it from anything that isn't running
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

export function unlockAudio() {
  const c = audio();
  const src = c.createBufferSource(); // a silent buffer, played inside the tap
  src.buffer = c.createBuffer(1, 1, 22050);
  src.connect(c.destination);
  src.start();
}

/** Unlocks the sound again if the device has paused it since. Call it inside any tap. */
export function wakeAudio() {
  if (ctx?.state !== 'running') unlockAudio();
}

/** Tries to wake the sound without a tap, as when the page comes back on screen. */
export function resumeAudio() {
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
}
