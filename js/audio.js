window.MB = window.MB || {};

MB.audio = (function () {
  "use strict";

  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function unlock() {
    ensure();
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, vol) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const len = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol || 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t);
  }

  return {
    unlock: unlock,
    toggleMute: function () { muted = !muted; return muted; },
    isMuted: function () { return muted; },
    click: function () { tone(600, 0.08, "square", 0.12); },
    correct: function () { tone(660, 0.1, "square", 0.15); setTimeout(function () { tone(880, 0.12, "square", 0.15); }, 90); setTimeout(function () { tone(1320, 0.18, "square", 0.15); }, 190); },
    wrong: function () { tone(220, 0.25, "sawtooth", 0.15, 140); },
    streak: function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tone(f, 0.09, "square", 0.15); }, i * 80); }); },
    laser: function () { tone(880, 0.09, "square", 0.08, 220); },
    powerLaser: function (level) {
      level = level || 1;
      const base = 900 + level * 200;
      tone(base, 0.1, "square", 0.1, base * 3);
      if (level >= 2) tone(base * 1.5, 0.08, "square", 0.07, base * 4);
      if (level >= 3) tone(base * 2, 0.12, "sawtooth", 0.06, base * 3);
    },
    alienShot: function () { tone(160, 0.12, "sawtooth", 0.1, 90); },
    explode: function () { noise(0.35, 0.35); tone(120, 0.3, "sawtooth", 0.15, 40); },
    powerBoom: function () { noise(0.5, 0.5); tone(90, 0.45, "sawtooth", 0.18, 30); tone(140, 0.3, "square", 0.1, 60); },
    boom: function () { noise(0.7, 0.5); tone(80, 0.6, "sawtooth", 0.2, 30); },
    milestone: function (n, m) {
      const f = 523 + Math.min(9, n) * 66;
      tone(f, 0.12, "square", 0.15, f * 1.5);
      if (n === m) setTimeout(function () { tone(f * 1.25, 0.18, "square", 0.15); }, 90);
    },
    upgradeComplete: function () {
      [523, 659, 784, 1046, 1318].forEach(function (f, i) {
        setTimeout(function () { tone(f, 0.16, "square", 0.16); }, i * 110);
      });
      setTimeout(function () { tone(1046, 0.5, "square", 0.14, 1568); }, 560);
      setTimeout(function () { noise(0.4, 0.18); }, 560);
    },
    victory: function () { [392, 523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tone(f, 0.15, "square", 0.15); }, i * 130); }); },
    score: function () {
      [880, 1174, 1568, 2093].forEach(function (f, i) { setTimeout(function () { tone(f, 0.08, "square", 0.13); }, i * 75); });
      setTimeout(function () { noise(0.25, 0.12); }, 300);
    },
    defeat: function () { [330, 262, 196, 131].forEach(function (f, i) { setTimeout(function () { tone(f, 0.3, "sawtooth", 0.12); }, i * 200); }); }
  };
})();
