window.MB = window.MB || {};

MB.Scenes.Battle = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Battle() {
    Phaser.Scene.call(this, { key: "Battle" });
  },

  init: function () {
    this.ended = false;
  },

  create: function () {
    const C = MB.config;
    this.state = MB.save.load();
    this.upg = this.state.upgrades || {};
    this.power = Math.max(this.upg.damage || 0, this.upg.fireRate || 0, this.upg.range || 0);

    this.add.rectangle(C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH, C.HEIGHT, 0x050518, 1);
    this.stars = MB.ui.addStars(this, 50);
    MB.ui.addText(this, C.WIDTH / 2, 25, "FLEET vs ALIENS", { fontSize: "20px", color: "#ffffff" });

    this.playerUnits = [];
    this.enemyUnits = [];
    this.projectiles = [];
    this.torpedoes = [];
    this.damageTexts = [];
    this.shotCounter = 0;
    this.playerLost = { drone: 0, fighter: 0, cruiser: 0, dreadnought: 0 };
    this.enemyKilled = { grunt: 0, brute: 0, queen: 0 };
    this.baseDamageDealt = 0;

    this.spawnPlayers();
    this.spawnEnemies();

    this.base = this.spawnBase();
    this.battleBaseHp = this.base.hp;
    this.battleEnemyCounts = {
      grunt: this.state.enemyArmy ? (this.state.enemyArmy.grunt || 0) : 0,
      brute: this.state.enemyArmy ? (this.state.enemyArmy.brute || 0) : 0,
      queen: this.state.enemyArmy ? (this.state.enemyArmy.queen || 0) : 0
    };

    MB.ui.addText(this, 60, 55, "Your fleet: " + this.playerUnits.length, { fontSize: "10px", color: "#66c8ff", origin: 0 });
    MB.ui.addText(this, C.WIDTH - 60, 55, "Alien defenders: " + (this.enemyUnits.length + 1), { fontSize: "10px", color: "#ff7ad9", origin: 1 });
  },

  spawnPlayers: function () {
    const C = MB.config;
    const MAX = 120;
    const dmgMul = 1 + (this.upg.damage || 0) * C.UPGRADES.damage.perLevel;
    const rateMul = 1 + (this.upg.fireRate || 0) * C.UPGRADES.fireRate.perLevel;
    const rangeMul = 1 + (this.upg.range || 0) * C.UPGRADES.range.perLevel;
    let idx = 0;
    C.TIER_ORDER.forEach(function (id) {
      let count = this.state.army[id] || 0;
      count = Math.min(count, MAX - idx);
      for (let i = 0; i < count; i++) {
        const def = C.UNITS[id];
        const g = this.add.graphics();
        MB.sprites.drawShip(g, def, true, this.power);
        const x = 70 + (idx % 5) * 48;
        const y = 150 + Math.floor(idx / 5) * 62;
        g.setPosition(x, y);
        const bar = MB.ui.addHpBar(this, x, y - def.size - 10, 34, 5);
        this.playerUnits.push({
          side: "player",
          kind: id,
          def: def,
          g: g,
          bar: bar,
          x: x, y: y,
          hp: def.hp, maxHp: def.hp,
          damage: Math.round(def.damage * dmgMul),
          range: Math.round(def.range * rangeMul),
          speed: def.speed,
          cooldown: 0,
          cooldownMax: Math.round(def.fireRate / rateMul),
          dead: false,
          beam: id === "dreadnought" && (this.upg.sniperLaser || 0) > 0 ? {
            active: false,
            target: null,
            remaining: 0,
            tickTimer: 0,
            cooldown: 0,
            gfx: null,
            soundHandle: null
          } : null,
          torpedo: id === "cruiser" && (this.upg.torpedoLauncher || 0) > 0 ? {
            cooldown: Math.random() * C.UPGRADES.torpedoLauncher.initialDelay * 1000
          } : null
        });
        idx++;
      }
    }, this);
  },

  spawnEnemies: function () {
    const C = MB.config;
    const e = this.state.enemyArmy || { grunt: 0, brute: 0, queen: 0 };
    const boost = this.state.enemyBoost || 1;
    let idx = 0;
    ["grunt", "brute", "queen"].forEach(function (type) {
      let count = e[type] || 0;
      for (let i = 0; i < count; i++) {
        const def = C.ENEMY_UNITS[type];
        const hp = Math.round(def.hp * boost);
        const g = this.add.graphics();
        MB.sprites.drawAlien(g, type);
        const x = 900 - (idx % 5) * 44;
        const y = 170 + Math.floor(idx / 5) * 58;
        g.setPosition(x, y);
        const bar = MB.ui.addHpBar(this, x, y - def.size - 10, 34, 5);
        this.enemyUnits.push({
          side: "enemy",
          kind: type,
          def: def,
          g: g,
          bar: bar,
          x: x, y: y,
          hp: hp, maxHp: hp,
          damage: Math.max(1, Math.round(def.damage * boost)),
          range: def.range,
          speed: def.speed,
          cooldown: 0,
          cooldownMax: def.fireRate,
          dead: false
        });
        idx++;
      }
    }, this);
  },

  spawnBase: function () {
    const C = MB.config;
    const g = this.add.graphics();
    MB.sprites.drawBase(g, 84, 64);
    const x = 918;
    const y = C.HEIGHT / 2;
    g.setPosition(x, y);
    const bar = MB.ui.addHpBar(this, x, y - 50, 90, 8);
    const defaultHp = C.ENEMY_ARMIES[this.state.settings.difficulty].baseHp;
    const maxHp = Math.round(defaultHp * (this.state.enemyBoost || 1));
    const storedHp = this.state.enemyBaseHp;
    const hp = (storedHp === null || storedHp === undefined) ? maxHp : Math.max(0, storedHp);
    bar.updateBar(hp / maxHp);
    MB.ui.addText(this, x, y - 62, "ALIEN BASE", { fontSize: "9px", color: "#ff7ad9" });
    return {
      x: x, y: y,
      hp: hp, maxHp: maxHp,
      g: g, bar: bar
    };
  },

  dist: function (ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  },

  selectSniperTarget: function (u) {
    const C = MB.config;
    const lvl = C.UPGRADES.sniperLaser.levels[(this.upg.sniperLaser || 1) - 1];
    const totalTicks = Math.round(C.UPGRADES.sniperLaser.beamDuration / C.UPGRADES.sniperLaser.beamTick);
    const totalDmg = lvl.damage * totalTicks;
    let bestKill = null;
    let bestKillVal = -1;
    let bestHp = null;
    let bestHpVal = -1;
    for (let i = 0; i < this.enemyUnits.length; i++) {
      const e = this.enemyUnits[i];
      if (e.dead || e.hp <= 0) continue;
      const d = this.dist(u.x, u.y, e.x, e.y);
      if (d > lvl.range) continue;
      const val = C.SCORE_WEIGHTS[e.kind] || 0;
      if (e.hp <= totalDmg && val > bestKillVal) {
        bestKill = e;
        bestKillVal = val;
      }
      if (e.hp > bestHpVal) {
        bestHp = e;
        bestHpVal = e.hp;
      }
    }
    return bestKill || bestHp;
  },

  startBeam: function (u, target) {
    const C = MB.config;
    const lvl = C.UPGRADES.sniperLaser.levels[(this.upg.sniperLaser || 1) - 1];
    u.beam.active = true;
    u.beam.target = target;
    u.beam.remaining = C.UPGRADES.sniperLaser.beamDuration;
    u.beam.tickTimer = 0;
    u.beam.gfx = this.add.graphics();
    MB.audio.sniperCharge();
    u.beam.soundHandle = MB.audio.sniperBeamStart();
  },

  stopBeam: function (u) {
    u.beam.active = false;
    u.beam.target = null;
    if (u.beam.gfx) {
      u.beam.gfx.destroy();
      u.beam.gfx = null;
    }
    if (u.beam.soundHandle) {
      u.beam.soundHandle.stop();
      u.beam.soundHandle = null;
    }
    const C = MB.config;
    const lvl = C.UPGRADES.sniperLaser.levels[(this.upg.sniperLaser || 1) - 1];
    u.beam.cooldown = lvl.cooldown;
  },

  updateSniperBeams: function (dtSec) {
    const C = MB.config;
    const snLevel = this.upg.sniperLaser || 0;
    if (snLevel <= 0) return;
    const lvl = C.UPGRADES.sniperLaser.levels[snLevel - 1];
    const dtMs = dtSec * 1000;
    for (let i = 0; i < this.playerUnits.length; i++) {
      const u = this.playerUnits[i];
      if (u.dead || !u.beam) continue;
      if (u.beam.active) {
        const target = u.beam.target;
        if (!target || target.dead || target.hp <= 0) {
          this.stopBeam(u);
          continue;
        }
        u.beam.remaining -= dtMs;
        u.beam.tickTimer += dtMs;
        if (u.beam.tickTimer >= C.UPGRADES.sniperLaser.beamTick) {
          u.beam.tickTimer -= C.UPGRADES.sniperLaser.beamTick;
          this.hit(target, lvl.damage);
        }
        if (u.beam.gfx) {
          MB.sprites.drawSniperBeam(u.beam.gfx, snLevel, u.x, u.y, target.x, target.y);
        }
        if (u.beam.remaining <= 0) {
          this.stopBeam(u);
        }
      } else {
        u.beam.cooldown -= dtMs;
        if (u.beam.cooldown <= 0) {
          const target = this.selectSniperTarget(u);
          if (target) {
            this.startBeam(u, target);
          }
        }
      }
    }
  },

  findEnemyClusters: function (count) {
    var C = MB.config;
    var tpLevel = this.upg.torpedoLauncher || 0;
    var lvl = C.UPGRADES.torpedoLauncher.levels[tpLevel - 1];
    var clusterR = lvl.clusterRadius;
    var living = [];
    for (var i = 0; i < this.enemyUnits.length; i++) {
      var e = this.enemyUnits[i];
      if (!e.dead && e.hp > 0) living.push(e);
    }
    if (living.length === 0) return [];
    var density = [];
    for (var i = 0; i < living.length; i++) {
      var count = 0;
      var sx = 0, sy = 0;
      for (var j = 0; j < living.length; j++) {
        if (i === j) continue;
        var d = this.dist(living[i].x, living[i].y, living[j].x, living[j].y);
        if (d <= clusterR) {
          count++;
          sx += living[j].x;
          sy += living[j].y;
        }
      }
      density.push({
        x: (sx + living[i].x) / (count + 1),
        y: (sy + living[i].y) / (count + 1),
        count: count
      });
    }
    density.sort(function (a, b) { return b.count - a.count; });
    var result = [];
    for (var i = 0; i < density.length && result.length < count; i++) {
      var tooClose = false;
      for (var j = 0; j < result.length; j++) {
        if (this.dist(density[i].x, density[i].y, result[j].x, result[j].y) < clusterR * 0.5) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) result.push({ x: density[i].x, y: density[i].y });
    }
    while (result.length < count && living.length > 0) {
      result.push({ x: living[0].x, y: living[0].y });
    }
    return result;
  },

  fireTorpedoes: function (u) {
    var C = MB.config;
    var tpLevel = this.upg.torpedoLauncher || 0;
    var lvl = C.UPGRADES.torpedoLauncher.levels[tpLevel - 1];
    var clusters = this.findEnemyClusters(3);
    if (clusters.length === 0) {
      u.torpedo.cooldown = 2000;
      return false;
    }
    MB.audio.torpedoLaunch();
    var target = clusters[0];
    var g = this.add.graphics();
    MB.sprites.drawTorpedo(g, tpLevel);
    g.setPosition(u.x, u.y);
    this.torpedoes.push({
      g: g,
      x: u.x, y: u.y,
      startX: u.x, startY: u.y,
      offsetMag: 60,
      offsetSign: 1,
      targetX: target.x, targetY: target.y,
      delay: 0,
      progress: 0,
      speed: 0.6,
      damage: lvl.damage,
      aoeRadius: lvl.aoeRadius,
      side: "player"
    });
    u.torpedo.cooldown = lvl.cooldown;
    return true;
  },

  updateTorpedoes: function (dtSec) {
    var survivors = [];
    for (var i = 0; i < this.torpedoes.length; i++) {
      var t = this.torpedoes[i];
      if (t.delay > 0) {
        t.delay -= dtSec;
        survivors.push(t);
        continue;
      }
      var nearE = null;
      var nearD = Infinity;
      for (var j = 0; j < this.enemyUnits.length; j++) {
        var e = this.enemyUnits[j];
        if (e.dead || e.hp <= 0) continue;
        var d = this.dist(t.targetX, t.targetY, e.x, e.y);
        if (d < nearD) { nearD = d; nearE = e; }
      }
      if (nearE) {
        t.targetX = nearE.x;
        t.targetY = nearE.y;
      }
      var mx = (t.startX + t.targetX) / 2;
      var my = (t.startY + t.targetY) / 2;
      var ddx = t.targetX - t.startX;
      var ddy = t.targetY - t.startY;
      var len = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      var nnx = -ddy / len;
      var nny = ddx / len;
      var controlX = mx + nnx * t.offsetMag * t.offsetSign;
      var controlY = my + nny * t.offsetMag * t.offsetSign;
      t.progress += t.speed * dtSec;
      if (t.progress >= 1) {
        var tx = t.targetX;
        var ty = t.targetY;
        for (var j = 0; j < this.enemyUnits.length; j++) {
          var e = this.enemyUnits[j];
          if (e.dead || e.hp <= 0) continue;
          var d = this.dist(tx, ty, e.x, e.y);
          if (d <= t.aoeRadius) {
            this.hit(e, t.damage);
          }
        }
        if (this.base.hp > 0 && this.dist(tx, ty, this.base.x, this.base.y) <= t.aoeRadius) {
          this.hit(this.base, t.damage);
        }
        var expG = this.add.graphics();
        MB.sprites.drawTorpedoExplosion(expG, this.upg.torpedoLauncher || 1, t.aoeRadius);
        expG.setPosition(tx, ty);
        this.tweens.add({
          targets: expG,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 400,
          onComplete: function () { expG.destroy(); }
        });
        MB.audio.torpedoExplode();
        t.g.destroy();
      } else {
        var p = t.progress;
        var oneMinusT = 1 - p;
        t.x = oneMinusT * oneMinusT * t.startX + 2 * oneMinusT * p * controlX + p * p * t.targetX;
        t.y = oneMinusT * oneMinusT * t.startY + 2 * oneMinusT * p * controlY + p * p * t.targetY;
        t.g.setPosition(t.x, t.y);
        var future = Math.min(1, p + 0.05);
        var fm = 1 - future;
        var fx = fm * fm * t.startX + 2 * fm * future * controlX + future * future * t.targetX;
        var fy = fm * fm * t.startY + 2 * fm * future * controlY + future * future * t.targetY;
        t.g.setRotation(Math.atan2(fy - t.y, fx - t.x));
        survivors.push(t);
      }
    }
    this.torpedoes = survivors;
  },

  nearestTarget: function (u) {
    const C = MB.config;
    const enemies = u.side === "player" ? this.enemyUnits : this.playerUnits;
    let best = null;
    let bd = Infinity;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      const d = this.dist(u.x, u.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (u.side === "player" && !best && this.base.hp > 0) {
      best = this.base;
      bd = this.dist(u.x, u.y, this.base.x, this.base.y);
    }
    return { target: best, distance: bd };
  },

  fire: function (u, target) {
    this.shotCounter++;
    const g = this.add.graphics();
    const boltLevel = this.upg.damage || 0;
    MB.sprites.drawBolt(g, boltLevel);
    g.setPosition(u.x, u.y);
    this.projectiles.push({ g: g, x: u.x, y: u.y, target: target, speed: 300, damage: u.damage, side: u.side });
    if (this.shotCounter % 4 === 1) {
      if (u.side === "player") {
        if (boltLevel > 0) MB.audio.powerLaser(boltLevel); else MB.audio.laser();
      } else {
        MB.audio.alienShot();
      }
    }
  },

  update: function (time, dt) {
    if (this.ended) return;
    const dtSec = dt / 1000;

    this.updateUnits(time, dtSec);
    this.updateProjectiles(dtSec);
    this.updateTorpedoes(dtSec);
    this.updateSniperBeams(dtSec);
    this.checkEnd();
  },

  updateUnits: function (_time, dtSec) {
    const C = MB.config;
    const all = this.playerUnits.concat(this.enemyUnits);
    for (let i = 0; i < all.length; i++) {
      const u = all[i];
      if (u.dead) continue;
      const nt = this.nearestTarget(u);
      if (!nt.target) continue;
      u.cooldown = Math.max(0, u.cooldown - dtSec * 1000);
      if (u.torpedo) {
        u.torpedo.cooldown = Math.max(0, u.torpedo.cooldown - dtSec * 1000);
      }

      if (u.torpedo && u.torpedo.cooldown <= 0) {
        this.fireTorpedoes(u);
      }

      if (nt.distance <= u.range && u.cooldown <= 0) {
        this.fire(u, nt.target);
        u.cooldown = u.cooldownMax;
      }
      if (nt.distance > u.range) {
        let nx = u.x;
        let ny = u.y;
        const dx = nt.target.x - u.x;
        const dy = nt.target.y - u.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const step = u.speed * dtSec;
        nx += (dx / d) * step;
        ny += (dy / d) * step;
        if (u.side === "player") {
          nx = Math.max(40, Math.min(905, nx));
        } else {
          nx = Math.max(60, Math.min(940, nx));
        }
        ny = Math.max(80, Math.min(480, ny));
        u.x = nx;
        u.y = ny;
      }
      u.g.setPosition(u.x, u.y);
      u.bar.setPosition(u.x, u.y - u.def.size - 10);
    }
  },

  updateProjectiles: function (dtSec) {
    const C = MB.config;
    const survivors = [];
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.target || p.target.dead || p.target.hp <= 0) {
        p.g.destroy();
        continue;
      }
      const dx = p.target.x - p.x;
      const dy = p.target.y - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const step = p.speed * dtSec;
      if (d <= step + 4) {
        this.hit(p.target, p.damage);
        p.g.destroy();
      } else {
        p.x += (dx / d) * step;
        p.y += (dy / d) * step;
        p.g.setPosition(p.x, p.y);
        survivors.push(p);
      }
    }
    this.projectiles = survivors;
  },

  hit: function (target, damage) {
    if (target.hp <= 0) return;
    target.hp -= damage;
    this.spawnDamage(target.x, target.y - 14, damage, target.side);
    if (target === this.base) {
      this.baseDamageDealt += damage;
      this.base.bar.updateBar(Math.max(0, target.hp) / target.maxHp);
    } else {
      target.bar.updateBar(Math.max(0, target.hp) / target.maxHp);
    }
    if (target.hp <= 0) {
      this.kill(target);
    }
  },

  spawnDamage: function (x, y, amount, side) {
    const t = this.add.text(x + (Math.random() * 16 - 8), y, String(amount), {
      fontFamily: MB.config.FONT,
      fontSize: "10px",
      color: side === "enemy" ? "#ffffff" : "#ff8888"
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: y - 28,
      alpha: 0,
      duration: 600,
      onComplete: function () { t.destroy(); }
    });
  },

  explosion: function (x, y, big) {
    const C = MB.config;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0xffcc33, 1);
    g.fillCircle(0, 0, 22);
    g.fillStyle(0xff6600, 0.9);
    g.fillCircle(0, 0, 14);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(0, 0, 8);
    c.add(g);
    this.tweens.add({
      targets: c,
      scaleX: big ? 3 : 2,
      scaleY: big ? 3 : 2,
      alpha: 0,
      duration: big ? 550 : 350,
      onComplete: function () { c.destroy(); }
    });
  },

  kill: function (unit) {
    unit.dead = true;
    if (unit.beam) {
      this.stopBeam(unit);
    }
    if (unit === this.base) {
      MB.audio.boom();
      this.explosion(unit.x, unit.y, true);
      return;
    }
    if (unit.side === "player") {
      this.playerLost[unit.kind] = (this.playerLost[unit.kind] || 0) + 1;
      MB.audio.explode();
      this.explosion(unit.x, unit.y, unit.kind === "queen" || unit.kind === "dreadnought");
    } else {
      this.enemyKilled[unit.kind] = (this.enemyKilled[unit.kind] || 0) + 1;
      if (this.power > 0) {
        MB.audio.powerBoom();
        this.explosion(unit.x, unit.y, true);
      } else {
        MB.audio.explode();
        this.explosion(unit.x, unit.y, unit.kind === "queen" || unit.kind === "dreadnought");
      }
    }
    unit.g.destroy();
    unit.bar.destroy();
  },

  checkEnd: function () {
    if (this.ended) return;
    const playerAlive = this.playerUnits.filter(function (u) { return !u.dead; }).length;
    const enemyAlive = this.enemyUnits.filter(function (u) { return !u.dead; }).length;
    if (enemyAlive === 0 && this.base.hp <= 0) {
      this.endBattle(true);
    } else if (playerAlive === 0 && this.projectiles.length === 0 && this.torpedoes.length === 0) {
      this.endBattle(false);
    }
  },

  computePoints: function () {
    const C = MB.config;
    const boost = this.state.enemyBoost || 1;
    let pts = Math.round(this.battleBaseHp || 0);
    ["grunt", "brute", "queen"].forEach(function (type) {
      pts += Math.round((this.battleEnemyCounts[type] || 0) * C.SCORE_WEIGHTS[type] * boost);
    }, this);
    return Math.max(0, pts);
  },

  spawnScoreBurst: function (points, x, y) {
    for (let i = 0; i < 16; i++) {
      const g = this.add.graphics();
      const ang = -Math.PI / 2 + (Math.random() * 1.9 - 0.95);
      const sp = 120 + Math.random() * 200;
      g.fillStyle(0xffd24d, 1);
      g.fillCircle(0, 0, 2 + Math.random() * 2.5);
      g.setPosition(x, y);
      (function (gg, a, dd) {
        this.tweens.add({
          targets: gg,
          x: x + Math.cos(a) * dd,
          y: y + Math.sin(a) * dd - 60,
          alpha: 0,
          duration: 800 + Math.random() * 600,
          ease: "Cubic.easeOut",
          onComplete: function () { gg.destroy(); }
        });
      }).call(this, g, ang, sp);
    }
    const t = this.add.text(x, y, "+" + points, {
      fontFamily: MB.config.FONT,
      fontSize: "26px",
      color: "#ffd24d",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: y - 130,
      scale: 1.35,
      alpha: 0,
      duration: 1400,
      ease: "Cubic.easeOut",
      onComplete: function () { t.destroy(); }
    });
  },

  endBattle: function (victory) {
    if (this.ended) return;
    this.ended = true;
    const C = MB.config;
    const state = this.state;

    for (let i = 0; i < this.playerUnits.length; i++) {
      if (this.playerUnits[i].beam) this.stopBeam(this.playerUnits[i]);
    }

    const survivors = this.playerUnits.filter(function (u) { return !u.dead; }).length;
    const enemyDead = this.enemyUnits.filter(function (u) { return u.dead; }).length;
    let playerLostTotal = 0;
    C.TIER_ORDER.forEach(function (id) {
      playerLostTotal += this.playerLost[id] || 0;
    }, this);

    C.TIER_ORDER.forEach(function (id) {
      state.army[id] = Math.max(0, (state.army[id] || 0) - (this.playerLost[id] || 0));
    }, this);
    ["grunt", "brute", "queen"].forEach(function (type) {
      const e = state.enemyArmy || { grunt: 0, brute: 0, queen: 0 };
      e[type] = Math.max(0, (e[type] || 0) - (this.enemyKilled[type] || 0));
      state.enemyArmy = e;
    }, this);
    state.enemyBaseHp = Math.max(0, (state.enemyBaseHp || 0) - this.baseDamageDealt);
    state.enemiesDestroyed = (state.enemiesDestroyed || 0) + enemyDead;

    let pts = 0;
    if (victory) {
      state.battlesWon = (state.battlesWon || 0) + 1;
      if (state.enemyBaseHp <= 0) state.baseDestroyed = true;
      MB.audio.victory();
      pts = this.computePoints();
      if (pts > 0) {
        const newTotal = MB.save.scoreAdd(pts);
        MB.audio.score();
        this.spawnScoreBurst(pts, this.base.x, this.base.y - 20);
        MB.hud.setScore(newTotal);
      }
    } else {
      state.battlesLost = (state.battlesLost || 0) + 1;
      MB.audio.defeat();
    }
    MB.save.save(state);

    const summary = {
      outcome: victory ? "victory" : "defeat",
      playerRemaining: survivors,
      playerTotal: this.playerUnits.length,
      playerLost: playerLostTotal,
      enemyDestroyed: enemyDead,
      enemyTotal: this.enemyUnits.length,
      baseDestroyed: state.baseDestroyed,
      pointsEarned: victory ? pts : 0
    };

    this.time.delayedCall(victory ? 1600 : 1400, function () {
      MB.sceneGo(this, "Result", summary);
    }, [], this);
  }
});
