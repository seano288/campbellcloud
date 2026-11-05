import { botSvg } from './icon';

/** Torque, drawn flat: for the title, Home and the Workshop. Never on a question screen. */
export const BotArt = ({ class: cls = '' }: { class?: string }) =>
  <span class={`bot-art ${cls}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: botSvg() }} />;
