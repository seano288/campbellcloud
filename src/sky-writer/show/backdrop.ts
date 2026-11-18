// Each Show's scenery, painted once for the screen's size onto its own canvas, then drawn whole each frame (fill rate, not detail, is
// the iPad 9's limit). The sky's gradient, a far line of hills, buildings or waves, the ground, and a few things standing on it.
import { EMOJI_FONT } from '../art/plane';
import type { Show } from './places';

const SCENERY: Record<string, string[]> = {
  beach: ['🏖️', '🌴', '⛱️', '🌴'], city: ['🏢', '🏬', '🏙️', '🏢', '🏦'], canyon: ['🌵', '🪨', '🌵'], mountains: ['🏔️', '🌲', '🏔️', '🌲'],
  stadium: ['🏟️', '🚩', '🏟️'], farm: ['🚜', '🌾', '🐄', '🏡', '🌻'], jungle: ['🌴', '🦜', '🌳', '🐒', '🌴'], island: ['🏝️', '⛵', '🐬', '🏝️'],
  desert: ['🐪', '🌵', '🏜️', '🌵'], volcano: ['🌋', '🪨', '🌋'], lake: ['🛶', '🌲', '🦆', '🌲'], castle: ['🏰', '🌳', '🚩', '🌳'],
  rainbow: ['🌈', '🌷', '🦄', '🌼'], sunset: ['🌅', '🌲', '🏡', '🌲'], night: ['🎡', '🏙️', '🎪', '🏙️'], space: ['🌍', '🛰️', '🌕'],
};

export function paintBackdrop(show: Show, w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h));
  const c = cv.getContext('2d')!, ground = h * 0.86;
  const sky = c.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, show.sky[0]); sky.addColorStop(1, show.sky[1]);
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  if (show.scenery === 'night' || show.scenery === 'space' || show.scenery === 'sunset') {
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) { const x = (i * 137.5) % w, y = ((i * 89.3) % (ground * 0.75)); c.globalAlpha = 0.3 + ((i * 7) % 10) / 14; c.beginPath(); c.arc(x, y, 1 + (i % 3), 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  } else {
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.55;
    for (let i = 0; i < 5; i++) { const x = ((i * 0.23 + 0.08) % 1) * w, y = h * (0.12 + (i % 3) * 0.1); c.beginPath(); c.ellipse(x, y, h * 0.09, h * 0.03, 0, 0, Math.PI * 2); c.ellipse(x + h * 0.05, y - h * 0.02, h * 0.06, h * 0.03, 0, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }
  // far hills, skyline or waves
  c.fillStyle = show.far;
  c.beginPath(); c.moveTo(0, ground);
  for (let x = 0; x <= w + 40; x += 40) {
    const k = x / w, y = show.scenery === 'city' || show.scenery === 'night'
      ? ground - h * (0.06 + (Math.floor(k * 13) % 4) * 0.035)
      : ground - h * (0.05 + Math.abs(Math.sin(k * 7.3)) * (show.scenery === 'mountains' || show.scenery === 'volcano' || show.scenery === 'canyon' ? 0.16 : 0.06));
    c.lineTo(x, y);
  }
  c.lineTo(w, ground); c.closePath(); c.fill();
  c.fillStyle = show.ground; c.fillRect(0, ground, w, h - ground);
  c.strokeStyle = '#00000033'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, ground); c.lineTo(w, ground); c.stroke();
  // things standing on the ground
  const things = SCENERY[show.scenery] ?? [], size = h * 0.09;
  c.font = `${size}px ${EMOJI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'bottom';
  const n = Math.max(3, Math.round(w / (size * 2.6)));
  for (let i = 0; i < n; i++) c.fillText(things[i % things.length]!, ((i + 0.5) / n) * w, ground + size * 0.12);
  return cv;
}
