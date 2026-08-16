window.MB = window.MB || {};

MB.sprites = (function () {
  "use strict";

  function drawShip(g, unit, facingRight, power) {
    const size = unit.size;
    const color = unit.color;
    power = power || 0;
    g.clear();
    if (power > 0) {
      g.fillStyle(color, 0.1 + power * 0.05);
      g.fillCircle(0, 0, size * (1.6 + power * 0.4));
      g.fillStyle(color, 0.16 + power * 0.06);
      g.fillCircle(0, 0, size * (1.1 + power * 0.3));
    }
    const s = size;
    if (facingRight) {
      g.fillStyle(0x222244, 1);
      g.fillTriangle(-s, 0, s, -s, s, s);
      g.fillStyle(color, 1);
      g.fillTriangle(-s * 0.5, 0, s * 0.85, -s * 0.65, s * 0.85, s * 0.65);
      g.fillStyle(power >= 3 ? 0xffffff : (power >= 2 ? 0xffaa44 : (power >= 1 ? 0xffcc55 : 0xffdd44)), 1);
      g.fillTriangle(-s * (0.9 + power * 0.12), -s * 0.3, -s * (0.9 + power * 0.12), s * 0.3, -s * 0.2, 0);
      if (power >= 2) {
        g.fillStyle(0xffffff, 0.85);
        g.fillCircle(-s * 0.85, 0, s * 0.1);
      }
      g.fillStyle(0xffffff, 1);
      g.fillCircle(s * 0.4, 0, s * 0.18);
    } else {
      g.fillStyle(0x222244, 1);
      g.fillTriangle(s, 0, -s, -s, -s, s);
      g.fillStyle(color, 1);
      g.fillTriangle(s * 0.5, 0, -s * 0.85, -s * 0.65, -s * 0.85, s * 0.65);
      g.fillStyle(power >= 3 ? 0xffffff : (power >= 2 ? 0xffaa44 : (power >= 1 ? 0xffcc55 : 0xffdd44)), 1);
      g.fillTriangle(s * (0.9 + power * 0.12), -s * 0.3, s * (0.9 + power * 0.12), s * 0.3, s * 0.2, 0);
      if (power >= 2) {
        g.fillStyle(0xffffff, 0.85);
        g.fillCircle(s * 0.85, 0, s * 0.1);
      }
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-s * 0.4, 0, s * 0.18);
    }
  }

  function drawBolt(g, level) {
    g.clear();
    level = level || 0;
    if (level <= 0) {
      g.fillStyle(0x66e0ff, 1);
      g.fillCircle(0, 0, 3);
      return;
    }
    const core = level >= 3 ? 0xffffff : 0x66e0ff;
    const glow = level >= 3 ? 0x88ddff : 0x66e0ff;
    g.fillStyle(glow, 0.12 + level * 0.04);
    g.fillCircle(0, 0, 5 + level * 2.5);
    g.fillStyle(core, 1);
    g.fillCircle(0, 0, 3 + level * 0.8);
    const L = 4 + level * 3;
    g.fillTriangle(-L, -2 - level * 0.5, 2 + level, 0, -L, 2 + level * 0.5);
    if (level >= 2) {
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(level * 1.5, 0, 2 + level * 0.4);
      g.fillTriangle(-L * 0.7, -1, 2, 0, -L * 0.7, 1);
    }
    if (level >= 3) {
      g.lineStyle(1.5, 0xffffff, 0.5);
      g.strokeCircle(0, 0, 6 + level * 2);
    }
  }

  function drawUpgradeIcon(g, track) {
    g.clear();
    if (track === "damage") {
      g.fillStyle(0xffd24d, 1);
      g.fillPoints([
        { x: 6, y: -14 }, { x: -5, y: 2 }, { x: 1, y: 2 },
        { x: -6, y: 14 }, { x: 4, y: -4 }, { x: -2, y: -4 }
      ], true);
    } else if (track === "fireRate") {
      g.fillStyle(0x66e0ff, 1);
      g.fillTriangle(-8, -6, 8, 0, -8, 6);
      g.fillTriangle(-3, -10, 11, 0, -3, 10);
    } else {
      g.fillStyle(0x88ff88, 1);
      g.fillCircle(0, 0, 3);
      g.lineStyle(2, 0x88ff88, 0.8);
      g.lineBetween(-13, 0, 13, 0);
      g.lineBetween(0, -13, 0, 13);
      g.lineStyle(1, 0x88ff88, 0.4);
      g.strokeCircle(0, 0, 9);
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

  function drawSniperBeam(g, level, fromX, fromY, toX, toY) {
    g.clear();
    var dx = toX - fromX;
    var dy = toY - fromY;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len;
    var ny = dx / len;

    if (level >= 2) {
      g.lineStyle(5, 0xff3333, 0.9);
      g.lineBetween(fromX, fromY, toX, toY);
    } else {
      g.lineStyle(2, 0xff3333, 0.9);
      g.lineBetween(fromX, fromY, toX, toY);
    }

    if (level >= 3) {
      var off = 6;
      g.lineStyle(1, 0xffaa33, 0.6);
      g.lineBetween(fromX + nx * off, fromY + ny * off, toX + nx * off, toY + ny * off);
      g.lineBetween(fromX - nx * off, fromY - ny * off, toX - nx * off, toY - ny * off);
    }

    g.fillStyle(0xff6666, 0.7);
    g.fillCircle(toX, toY, 4 + level);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(toX, toY, 2);
  }

  function drawSniperIcon(g) {
    g.clear();
    g.lineStyle(2, 0xff4444, 1);
    g.lineBetween(-12, 8, 12, -8);
    g.fillStyle(0xff6666, 1);
    g.fillCircle(12, -8, 3);
    g.fillStyle(0xffaa33, 0.6);
    g.fillCircle(12, -8, 6);
  }

  function drawLockIcon(g) {
    g.clear();
    g.fillStyle(0x666688, 1);
    g.fillRoundedRect(-8, -2, 16, 12, 2);
    g.lineStyle(2, 0x666688, 1);
    g.strokeCircle(0, -6, 6);
    g.fillStyle(0x888899, 1);
    g.fillCircle(0, 3, 2);
  }

  return { drawShip: drawShip, drawBolt: drawBolt, drawUpgradeIcon: drawUpgradeIcon, drawAlien: drawAlien, drawBase: drawBase, drawHomeBase: drawHomeBase, drawSniperBeam: drawSniperBeam, drawSniperIcon: drawSniperIcon, drawLockIcon: drawLockIcon };
})();
