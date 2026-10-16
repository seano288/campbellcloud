import { signal } from '@preact/signals';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'jet' | 'home' | 'round' | 'hangar';
export const screen = signal<Screen>('start');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
