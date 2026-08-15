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

    this.enemyIntel = MB.ui.addText(this, C.WIDTH / 2, 60, "", { fontSize: "10px", color: "#ff7ad9" });
    this.buildArmory();
    this.buildFleet();

    this.attackBtn = null;
    this.buildAttack();

    this.events.on("resume", this.refresh, this);
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
    container.add(MB.ui.addText(this, 0, -112, "ARMORY", { fontSize: "18px", color: "#ffd24d" }));

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

    container.add(MB.ui.addText(this, 0, 0 + tiers.length * 86 + 26, "Solve problems to train ships.\nHarder problems = stronger ships.", { fontSize: "9px", color: "#6677aa" }));

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

    const order = C.TIER_ORDER;
    let idx = 0;
    const maxDisplay = 18;
    order.forEach(function (id) {
      const count = this.state.army[id] || 0;
      const shown = Math.min(count, maxDisplay - idx);
      for (let s = 0; s < shown; s++) {
        const g = this.add.graphics();
        MB.sprites.drawShip(g, C.UNITS[id], true);
        const baseY = 300 + (idx % 3) * 56;
        const x = 250 + Math.floor(idx / 3) * 36;
        g.setPosition(x, baseY);
        container.add(g);
        this.fleetShips.push({ g: g, baseY: baseY, phase: Math.random() * Math.PI * 2, freq: 0.8 + Math.random() * 0.6 });
        idx++;
      }
    }, this);

    if (idx === 0) {
      container.add(MB.ui.addText(this, 250, 300, "No ships yet!\nTrain some in the armory.", { fontSize: "10px", color: "#6677aa" }));
    } else if (idx >= maxDisplay) {
      container.add(MB.ui.addText(this, 430, 470, "\u2026 and more", { fontSize: "10px", color: "#6677aa" }));
    }

    this.fleetContainer = container;
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
      this.attackMsg = MB.ui.addText(this, C.WIDTH / 2, 480, "You destroyed the alien base!\nGo to SETUP to start a new mission.", { fontSize: "11px", color: "#ffd24d" });
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
