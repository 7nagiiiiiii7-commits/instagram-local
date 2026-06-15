// 決定的なシード値から、毎回同じ色のグラデ画像(PNG Blob)を生成する。
export function gradientBlob(seed, w = 600, h = 750) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const h1 = (seed * 47) % 360;
    const h2 = (h1 + 40 + (seed * 13) % 120) % 360;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${h1} 65% 55%)`);
    g.addColorStop(1, `hsl(${h2} 60% 42%)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const x = (seed * (i + 3) * 97) % w;
      const y = (seed * (i + 5) * 53) % h;
      const r = 40 + (seed * (i + 1) * 31) % 140;
      ctx.fillStyle = `hsla(${(h2 + i * 35) % 360} 80% 62% / .22)`;
      ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    canvas.toBlob((b) => resolve(b), 'image/png');
  });
}
