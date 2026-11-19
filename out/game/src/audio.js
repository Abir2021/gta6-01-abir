// Sound with no files: every effect is a WebAudio oscillator / noise burst
// generated at play time, so the game loads nothing over the network.
// Engine hum, siren, punch thud, gunshot, coin chime, mission jingle.
export function createAudio() {
  let ctx = null; let muted = false; let engineOsc = null; let engineGain = null;
  function ensure() {
    if (ctx) return ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (muted || !ensure()) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = type || 'square'; osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      gain.gain.setValueAtTime(vol || 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(t); osc.stop(t + dur);
    } catch { /* audio is cosmetic; never break the game */ }
  }
  function noise(dur, vol) {
    if (muted || !ensure()) return;
    try {
      const t = ctx.currentTime; const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate); const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const gain = ctx.createGain(); gain.gain.value = vol || 0.15;
      src.connect(gain); gain.connect(ctx.destination); src.start(t);
    } catch { /* ignore */ }
  }
  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
    toggleMute() { muted = !muted; if (muted) this.stopEngine(); return muted; },
    isMuted() { return muted; },
    coin() { tone(880, 0.09, 'sine', 0.14); setTimeout(() => tone(1320, 0.12, 'sine', 0.12), 70); },
    punch() { noise(0.12, 0.2); tone(120, 0.1, 'sine', 0.2, 60); },
    shot() { noise(0.14, 0.28); tone(220, 0.08, 'sawtooth', 0.14, 70); },
    crash() { noise(0.3, 0.3); tone(90, 0.25, 'sine', 0.2, 40); },
    siren() { tone(700, 0.35, 'sine', 0.07, 950); setTimeout(() => tone(950, 0.35, 'sine', 0.07, 700), 360); },
    mission() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.14), i * 110)); },
    busted() { [400, 300, 200].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'sawtooth', 0.12), i * 180)); },
    startEngine(speed) {
      if (muted || !ensure()) return;
      if (!engineOsc) {
        try {
          engineOsc = ctx.createOscillator(); engineGain = ctx.createGain();
          engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 60;
          engineGain.gain.value = 0.03; engineOsc.connect(engineGain); engineGain.connect(ctx.destination); engineOsc.start();
        } catch { engineOsc = null; }
      }
      if (engineOsc) engineOsc.frequency.value = 55 + Math.abs(speed) * 0.16;
    },
    stopEngine() { try { if (engineOsc) engineOsc.stop(); } catch { /* ignore */ } engineOsc = null; engineGain = null; },
  };
}
