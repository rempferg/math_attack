window.MB = window.MB || {};

MB.Scenes.Base = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Base() {
    Phaser.Scene.call(this, { key: "Base" });
  },

  create: function () {
    const C = MB.config;
    this.state = MB.save.load();
    this.stars = MB.ui.addStars(this, 70);

    const baseG = this.add.graphics();
    MB.sprites.drawHomeBase(baseG, 55);
    baseG.setPosition(140, 400);
    MB.ui.addText(this, 140, 468, "HOME BASE", { fontSize: "10px", color: "#88aadd" });

    MB.ui.addText(this, C.WIDTH / 2, 30, "YOUR BASE", { fontSize: "24px", color: "#66c8ff" });

    MB.ui.addButton(this, 880, 30, 130, 36, "SETUP", {
      fill: 0x883333,
      fillOver: 0xaa4444,
      fontSize: "11px",
      onClick: function () {
        MB.audio.click();
        MB.sceneGo(this, "Setup");
      }.bind(this)
    });

    if ((this.state.battlesWon || 0) >= 1) {
      MB.ui.addButton(this, 735, 30, 130, 36, "WEAPONS LAB", {
        fill: 0x334488,
        fillOver: 0x5566cc,
        fontSize: "9px",
        onClick: function () {
          MB.audio.click();
          MB.audio.unlock();
          MB.sceneGo(this, "Lab");
        }.bind(this)
      });
    }

    this.enemyIntel = MB.ui.addText(this, C.WIDTH / 2, 60, "", { fontSize: "10px", color: "#ff7ad9" });
    this.buildArmory();
    this.buildFleet();

    this.attackBtn = null;
    this.buildAttack();
  },

  refresh: function () {
    this.state = MB.save.load();
    this.buildArmory();
    this.buildFleet();
    this.buildAttack();
  },

  buildEnemyIntel: function () {
    const e = this.state.enemyArmy;
    let parts = [];
    if (e) {
      if (e.grunt > 0) parts.push(e.grunt + " grunts");
      if (e.brute > 0) parts.push(e.brute + " brutes");
      if (e.queen > 0) parts.push(e.queen + " queens");
    }
    if (this.state.baseDestroyed) {
      this.enemyIntel.setText("ENEMY BASE DESTROYED!");
    } else {
      this.enemyIntel.setText("Mission " + (this.state.mission || 1) + " | Enemy intel: " + (parts.length ? parts.join(", ") : "clear") + (this.state.enemyBaseHp > 0 ? " | base: " + Math.max(0, Math.round(this.state.enemyBaseHp)) + " hp" : ""));
    }
  },

  buildArmory: function () {
    const C = MB.config;
    if (this.armoryContainer) {
      this.armoryContainer.destroy(true);
      this.armoryContainer = null;
    }
    this.buildEnemyIntel();

    const container = this.add.container(680, 120);

    const BAND_COLOR = { easy: "#88ff88", medium: "#ffd24d", hard: "#ff9466", veryHard: "#ff6666" };
    const tiers = C.CAP_TIERS[this.state.settings.difficulty] || ["drone"];
    tiers.forEach(function (id, i) {
      const unit = C.UNITS[id];
      const y = 0 + i * 86;
      const panel = MB.ui.addPanel(this, 0, y, 420, 76, { fill: 0x0d0d30, alpha: 0.96, border: 0x5566bb });
      container.add(panel);
      container.add(MB.ui.addText(this, -190, y - 20, unit.name + " (" + C.BAND_NAMES[unit.band] + ")", { fontSize: "11px", color: BAND_COLOR[unit.band], origin: 0, align: "left" }));
      container.add(MB.ui.addText(this, -190, y + 2, unit.desc + "  HP " + unit.hp + "  DMG " + unit.damage, { fontSize: "8px", color: "#aabbee", origin: 0, align: "left" }));
      container.add(MB.ui.addButton(this, 145, y, 108, 38, "TRAIN \u00d7" + (this.state.army[id] || 0), {
        fill: 0x2a9d3f,
        fillOver: 0x3ac24f,
        fontSize: "9px",
        onClick: (function () {
          MB.audio.click();
          this.scene.run("Math", { tier: id });
          this.scene.pause();
        }).bind(this)
      }));
    }, this);

    this.armoryContainer = container;
  },

  buildFleet: function () {
    const C = MB.config;
    if (this.fleetContainer) {
      this.fleetContainer.destroy(true);
      this.fleetContainer = null;
    }
    const container = this.add.container(0, 0);
    this.fleetShips = [];
    container.add(MB.ui.addText(this, 15, 72, "Solve problems to train ships.\nHarder problems = stronger ships.", { fontSize: "9px", color: "#6677aa", origin: 0, align: "left" }));

    const counts = {};
    let total = 0;
    C.TIER_ORDER.forEach(function (id) {
      counts[id] = this.state.army[id] || 0;
      total += counts[id];
    }, this);

    const prev = this.fleetCounts || null;
    let rNeeded = 0;
    while (total > 1 && 1 + 4 * rNeeded * (rNeeded + 1) < total) rNeeded++;
    const spacing = total <= 1 ? 0 : Math.min(24, 160 / Math.max(1, rNeeded));
    const pts = this.fleetPositions(total, 250, 275, spacing);

    const oldShips = [];
    const newShips = [];
    let g = 0;
    C.TIER_ORDER.forEach(function (id) {
      const count = counts[id];
      const prevCount = prev ? (prev[id] || 0) : 0;
      for (let j = 0; j < count; j++) {
        const p = pts[g];
        const rec = { id: id, x: p[0], y: p[1], isNew: j >= prevCount };
        (rec.isNew ? newShips : oldShips).push(rec);
        g++;
      }
    }, this);

    oldShips.forEach(function (rec) {
      this.addFleetShip(container, rec, false, 0);
    }, this);
    newShips.forEach(function (rec, i) {
      this.addFleetShip(container, rec, true, i);
    }, this);

    this.fleetCounts = {
      drone: counts.drone,
      fighter: counts.fighter,
      cruiser: counts.cruiser,
      dreadnought: counts.dreadnought
    };

    if (total === 0) {
      container.add(MB.ui.addText(this, 250, 300, "No ships yet!\nTrain some in the armory.", { fontSize: "10px", color: "#6677aa" }));
    }

    this.fleetContainer = container;
  },

  fleetPositions: function (n, cx, cy, spacing) {
    const pts = [];
    for (let r = 0; pts.length < n; r++) {
      if (r === 0) {
        pts.push([cx, cy]);
        continue;
      }
      const side = 2 * r;
      const per = 8 * r;
      for (let i = 0; i < per && pts.length < n; i++) {
        const s = Math.floor(i / side);
        const t = i % side;
        let px, py;
        if (s === 0) { px = t - r; py = -r; }
        else if (s === 1) { px = r; py = t - r; }
        else if (s === 2) { px = (side - 1 - t) - r; py = r; }
        else { px = -r; py = (side - 1 - t) - r; }
        pts.push([cx + px * spacing, cy + py * spacing]);
      }
    }
    return pts;
  },

  addFleetShip: function (container, rec, animate, i) {
    const C = MB.config;
    const g = this.add.graphics();
    MB.sprites.drawShip(g, C.UNITS[rec.id], true);
    if (animate) {
      g.setPosition(-80, rec.y);
      this.tweens.add({ targets: g, x: rec.x, duration: Math.min(3800, 2000 + i * 300), ease: "Cubic.easeOut" });
    } else {
      g.setPosition(rec.x, rec.y);
    }
    container.add(g);
    this.fleetShips.push({ g: g, baseY: rec.y, phase: Math.random() * Math.PI * 2, freq: 0.8 + Math.random() * 0.6 });
  },

  buildAttack: function () {
    const C = MB.config;
    if (this.attackBtn) {
      this.attackBtn.destroy(true);
      this.attackBtn = null;
    }
    if (this.attackMsg) {
      this.attackMsg.destroy(true);
      this.attackMsg = null;
    }
    const total = this.state.army.drone + this.state.army.fighter + this.state.army.cruiser + this.state.army.dreadnought;
    const baseDestroyed = this.state.baseDestroyed;

    if (baseDestroyed) {
      this.attackMsg = MB.ui.addText(this, C.WIDTH / 2, 448, "Enemy base destroyed!\nThe aliens regrouped \u2014 attack their new base!", { fontSize: "11px", color: "#ffd24d" });
      this.attackBtn = MB.ui.addButton(this, C.WIDTH / 2, 495, 240, 60, "ATTACK!", {
        fill: 0xbb3333,
        fillOver: 0xee4444,
        fontSize: "20px",
        onClick: function () {
          MB.audio.click();
          MB.audio.unlock();
          const state = MB.save.load();
          MB.save.newMission(state);
          MB.save.save(state);
          MB.sceneGo(this, "Battle");
        }.bind(this)
      });
      this.attackPulse = true;
      return;
    }
    if (total === 0) {
      this.attackMsg = MB.ui.addText(this, C.WIDTH / 2, 470, "Train ships first!", { fontSize: "13px", color: "#ff6666" });
      this.attackBtn = MB.ui.addButton(this, C.WIDTH / 2, 510, 220, 52, "ATTACK", {
        fill: 0x555577,
        fillOver: 0x555577,
        fontSize: "16px",
        onClick: function () {}
      });
      return;
    }
    this.attackBtn = MB.ui.addButton(this, C.WIDTH / 2, 495, 240, 60, "ATTACK!", {
      fill: 0xbb3333,
      fillOver: 0xee4444,
      fontSize: "20px",
      onClick: function () {
        MB.audio.click();
        MB.audio.unlock();
        MB.sceneGo(this, "Battle");
      }.bind(this)
    });
    this.attackPulse = true;
  },

  update: function (time, dt) {
    MB.ui.updateStars(this.stars, dt);
    for (let i = 0; i < this.fleetShips.length; i++) {
      const s = this.fleetShips[i];
      const y = s.baseY + Math.sin(time * 0.001 * s.freq * 10 + s.phase) * 4;
      s.g.setPosition(s.g.x, y);
    }
    if (this.attackBtn && this.attackPulse) {
      const scale = 1 + Math.sin(time * 0.006) * 0.04;
      this.attackBtn.setScale(scale);
    }
  }
});
