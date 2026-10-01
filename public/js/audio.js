let ctx;
export function sfx(name) {
  try {
    ctx ||= new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    const f = { click: 500, pop: 700, tick: 300, good: 880, bad: 120, whoosh: 200 }[name] || 440;
    o.frequency.value = f; o.type = name === 'bad' ? 'sawtooth' : 'sine';
    g.gain.setValueAtTime(0.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.16);
  } catch {}
}
