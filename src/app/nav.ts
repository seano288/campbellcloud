import { signal } from '@preact/signals';
import { createVoiceScope } from '../voice/say';

export type Screen = 'start' | 'body' | 'home' | 'round' | 'garage';
export const screen = signal<Screen>('start');
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
