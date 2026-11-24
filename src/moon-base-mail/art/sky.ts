// The sky drawn on a canvas, for the Landing and the walk: the Earth as it hangs over the Moon (blue sea, green land, white cloud, its
// night side in shadow, a soft blue glow round it).
export function drawEarth(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const glow = ctx.createRadialGradient(x, y, r, x, y, r * 1.6);
  glow.addColorStop(0, 'rgba(58,134,255,.35)'); glow.addColorStop(1, 'rgba(58,134,255,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
  ctx.fillStyle = '#3a86ff'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = '#2ec45a';
  ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.3, r * 0.42, r * 0.26, 0.5, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.35, r * 0.3, r * 0.4, -0.3, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = r * 0.11; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - r * 0.8, y - r * 0.05); ctx.quadraticCurveTo(x - r * 0.2, y - r * 0.25, x + r * 0.5, y - r * 0.05); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - r * 0.4, y + r * 0.55); ctx.quadraticCurveTo(x, y + r * 0.4, x + r * 0.2, y + r * 0.6); ctx.stroke();
  ctx.fillStyle = 'rgba(5,7,15,.38)'; ctx.beginPath(); ctx.arc(x + r * 0.55, y + r * 0.4, r * 1.05, 0, 7); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#14161b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
}
