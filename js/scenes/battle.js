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

    this.add.rectangle(C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH, C.HEIGHT, 0x0a0a1e, 1);
    this.stars = MB.ui.addStars(this, 50);

    MB.ui.addText(this, C.WIDTH / 2, 25, "FLEET vs ALIENS", { fontSize: "20px", color: "#ffffff" });

    this.playerUnits = [];
    this.enemyUnits = [];
    this.projectiles = [];
    this.damageTexts = [];
    this.shotCounter = 0;
    this.playerLost = { drone: 0, fighter: 0, cruiser: 0, dreadnought: 0 };
    this.enemyKilled = { grunt: 0, brute: 0, queen: 0 };
    this.baseDamageDealt = 0;

    this.spawnPlayers();
    this.spawnEnemies();

    this.base = this.spawnBase();

    MB.ui.addText(this, 60, 55, "Your fleet: " + this.playerUnits.length, { fontSize: "10px", color: "#66c8ff", origin: 0 });
    MB.ui.addText(this, C.WIDTH - 60, 55, "Alien defenders: " + (this.enemyUnits.length + 1), { fontSize: "10px", color: "#ff7ad9", origin: 1 });
  },

  spawnPlayers: function () {
    const C = MB.config;
    const MAX = 120;
    let idx = 0;
    C.TIER_ORDER.forEach(function (id) {
      let count = this.state.army[id] || 0;
      count = Math.min(count, MAX - idx);
      for (let i = 0; i < count; i++) {
        const def = C.UNITS[id];
        const g = this.add.graphics();
        MB.sprites.drawShip(g, def, true);
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
          damage: def.damage,
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
    const color = u.side === "player" ? 0x66e0ff : 0xff6d6d;
    g.fillStyle(color, 1);
    g.fillCircle(0, 0, 3);
    g.setPosition(u.x, u.y);
    this.projectiles.push({ g: g, x: u.x, y: u.y, target: target, speed: 300, damage: u.damage, side: u.side });
    if (this.shotCounter % 4 === 1) {
      if (u.side === "player") MB.audio.laser(); else MB.audio.alienShot();
    }
  },

  update: function (time, dt) {
    if (this.ended) return;
    const dtSec = dt / 1000;

    this.updateUnits(time, dtSec);
    this.updateProjectiles(dtSec);
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

      if (nt.distance <= u.range) {
        if (u.cooldown <= 0) {
          this.fire(u, nt.target);
          u.cooldown = u.cooldownMax;
        }
      } else {
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
    if (unit === this.base) {
      MB.audio.boom();
      this.explosion(unit.x, unit.y, true);
      return;
    }
    if (unit.side === "player") {
      this.playerLost[unit.kind] = (this.playerLost[unit.kind] || 0) + 1;
    } else {
      this.enemyKilled[unit.kind] = (this.enemyKilled[unit.kind] || 0) + 1;
    }
    MB.audio.explode();
    this.explosion(unit.x, unit.y, unit.kind === "queen" || unit.kind === "dreadnought");
    unit.g.destroy();
    unit.bar.destroy();
  },

  checkEnd: function () {
    if (this.ended) return;
    const playerAlive = this.playerUnits.filter(function (u) { return !u.dead; }).length;
    const enemyAlive = this.enemyUnits.filter(function (u) { return !u.dead; }).length;
    if (enemyAlive === 0 && this.base.hp <= 0) {
      this.endBattle(true);
    } else if (playerAlive === 0) {
      this.endBattle(false);
    }
  },

  endBattle: function (victory) {
    if (this.ended) return;
    this.ended = true;
    const C = MB.config;
    const state = this.state;

    const survivors = this.playerUnits.filter(function (u) { return !u.dead; }).length;
    const enemyDead = this.enemyUnits.filter(function (u) { return u.dead; }).length;

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

    if (victory) {
      state.battlesWon = (state.battlesWon || 0) + 1;
      if (state.enemyBaseHp <= 0) state.baseDestroyed = true;
      MB.audio.victory();
    } else {
      state.battlesLost = (state.battlesLost || 0) + 1;
      MB.audio.defeat();
    }
    MB.save.save(state);

    const summary = {
      outcome: victory ? "victory" : "defeat",
      playerRemaining: survivors,
      playerTotal: this.playerUnits.length,
      enemyDestroyed: enemyDead,
      enemyTotal: this.enemyUnits.length,
      baseDestroyed: state.baseDestroyed
    };

    this.time.delayedCall(victory ? 1600 : 1400, function () {
      MB.sceneGo(this, "Result", summary);
    }, [], this);
  }
});
