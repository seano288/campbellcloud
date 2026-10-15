// A short line shown at the top and spoken at the same time.
import { signal } from '@preact/signals';
import type { Item, VoiceScope } from '../voice/say';

const shown = signal<{ text: string } | null>(null);
let dismiss = () => {};

export function toast(voice: VoiceScope, text: string, ...speech: Item[]): Promise<void> {
  if (!voice.active) return Promise.resolve();
  dismiss();
  const message = { text };
  const clear = () => {
    clearTimeout(timer);
    voice.signal.removeEventListener('abort', clear);
    if (shown.peek() === message) shown.value = null;
  };
  const timer = setTimeout(clear, 1800);
  dismiss = clear;
  voice.signal.addEventListener('abort', clear, { once: true });
  shown.value = message;
  return voice.say(...speech);
}

export function Toast() {
  const t = shown.value;
  return <div class={`toast${t ? ' show' : ''}`} aria-live="polite">{t?.text}</div>;
}
