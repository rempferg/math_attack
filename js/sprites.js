window.MB = window.MB || {};

MB.sprites = (function () {
  "use strict";

  function drawShip(g, unit, facingRight) {
    const size = unit.size;
    const color = unit.color;
    g.clear();
    const s = size;
    if (facingRight) {
      g.fillStyle(0x222244, 1);
      g.fillTriangle(-s, 0, s, -s, s, s);
      g.fillStyle(color, 1);
      g.fillTriangle(-s * 0.5, 0, s * 0.85, -s * 0.65, s * 0.85, s * 0.65);
      g.fillStyle(0xffdd44, 1);
      g.fillTriangle(-s * 0.9, -s * 0.3, -s * 0.9, s * 0.3, -s * 0.2, 0);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(s * 0.4, 0, s * 0.18);
    } else {
      g.fillStyle(0x222244, 1);
      g.fillTriangle(s, 0, -s, -s, -s, s);
      g.fillStyle(color, 1);
      g.fillTriangle(s * 0.5, 0, -s * 0.85, -s * 0.65, -s * 0.85, s * 0.65);
      g.fillStyle(0xffdd44, 1);
      g.fillTriangle(s * 0.9, -s * 0.3, s * 0.9, s * 0.3, s * 0.2, 0);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-s * 0.4, 0, s * 0.18);
    }
  }

  function drawAlien(g, type) {
    const u = MB.config.ENEMY_UNITS[type];
    const size = u.size;
    const color = u.color;
    g.clear();
    g.fillStyle(0x103310, 1);
    g.fillCircle(0, 0, size);
    g.fillStyle(color, 1);
    g.fillCircle(0, -size * 0.15, size * 0.85);
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      g.fillStyle(0x000000, 0.5);
      g.fillCircle(Math.cos(ang) * size * 0.7, Math.sin(ang) * size * 0.7, size * 0.18);
    }
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-size * 0.3, -size * 0.25, size * 0.22);
    g.fillCircle(size * 0.3, -size * 0.25, size * 0.22);
    g.fillStyle(0x111111, 1);
    g.fillCircle(-size * 0.3, -size * 0.22, size * 0.1);
    g.fillCircle(size * 0.3, -size * 0.22, size * 0.1);
  }

  function drawBase(g, w, h) {
    g.clear();
    g.fillStyle(0x551133, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.fillStyle(0xaa3366, 1);
    g.fillRoundedRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 8);
    for (let i = 0; i < 4; i++) {
      const x = -w / 2 + 14 + i * ((w - 28) / 3);
      g.fillStyle(0x3a0a1e, 1);
      g.fillCircle(x, 0, 8);
    }
    g.fillStyle(0xdd5599, 1);
    g.fillTriangle(0, -h / 2 - 4, -12, -h / 2 + 8, 12, -h / 2 + 8);
    g.fillStyle(0x44ff88, 1);
    g.fillCircle(0, -h / 2 - 8, 4);
  }

  function drawHomeBase(g, r) {
    g.clear();
    g.fillStyle(0x1a2a5a, 1);
    g.fillCircle(0, 0, r);
    g.fillStyle(0x2a4a8a, 1);
    g.fillCircle(0, 0, r * 0.7);
    g.fillStyle(0x66c8ff, 1);
    g.fillCircle(0, 0, r * 0.25);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(0, 0, r * 0.1);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      g.fillStyle(0x88ccff, 1);
      g.fillCircle(Math.cos(ang) * r * 0.85, Math.sin(ang) * r * 0.85, 4);
    }
  }

  return { drawShip: drawShip, drawAlien: drawAlien, drawBase: drawBase, drawHomeBase: drawHomeBase };
})();
