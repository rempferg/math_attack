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

    this.enemyIntel = MB.ui.addText(this, C.WIDTH / 2, 68, "", { fontSize: "10px", color: "#ff7ad9" });

    this.armoryViewportY = 92;
    this.armoryViewportH = 334;
    this.armoryScrollContainer = this.add.container(680, this.armoryViewportY);
    this.buildArmory();

    this.armoryScrollY = 0;
    this.armoryScrollTarget = 0;
    this.setupArmoryScrollInput();
    this.updateArmoryScrollbar();
    this.updateArmoryFades();

    this.buildFleet();

    this.attackBtn = null;
    this.buildAttack();
  },

  refresh: function () {
    this.state = MB.save.load();
    this.buildArmory();
    this.buildFleet();
    this.buildAttack();
    this.armoryScrollY = Phaser.Math.Clamp(this.armoryScrollY, 0, this.armoryMaxScroll());
    this.armoryScrollTarget = this.armoryScrollY;
    this.updateArmoryScrollbar();
    this.updateArmoryFades();
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
    this.buildEnemyIntel();
    if (!this.armoryScrollContainer) return;
    this.armoryScrollContainer.removeAll(true);
    const stars = MB.save.scoreLoad();
    const BAND_COLOR = { easy: "#88ff88", medium: "#ffd24d", hard: "#ff9466", veryHard: "#ff6666", elite: "#ff9ac2" };
    const tiers = C.CAP_TIERS[this.state.settings.difficulty] || ["drone"];
    var y = 44;
    tiers.forEach(function (id) {
      this.addArmoryPanel(id, y, BAND_COLOR[id] || "#ffffff", stars);
      y += 86;
    }, this);
    this.armoryTotalH = y + 10;
  },

  armoryMaxScroll: function () {
    return Math.max(0, this.armoryTotalH - this.armoryViewportH);
  },

  addArmoryPanel: function (id, y, bandColor, stars) {
    const C = MB.config;
    const unit = C.UNITS[id];
    const count = this.state.army[id] || 0;
    const locked = id === "carrier" && stars < C.CARRIER.unlockStars;

    var border = locked ? 0x333344 : 0x5566bb;
    var fill = locked ? 0x080818 : 0x0d0d30;
    const panel = MB.ui.addPanel(this, 0, y, 420, 76, { fill: fill, alpha: 0.96, border: border });
    this.armoryScrollContainer.add(panel);

    var nameColor = locked ? "#556677" : bandColor;
    this.armoryScrollContainer.add(MB.ui.addText(this, -190, y - 20, unit.name + " (" + C.BAND_NAMES[unit.band] + ")" + (locked ? " \u2014 LOCKED" : ""), { fontSize: "11px", color: nameColor, origin: 0, align: "left" }));
    this.armoryScrollContainer.add(MB.ui.addText(this, -190, y + 2, unit.desc + "  HP " + unit.hp + (locked ? "" : "  DMG " + unit.damage), { fontSize: "8px", color: locked ? "#445566" : "#aabbee", origin: 0, align: "left" }));

    if (locked) {
      var icon = this.add.graphics();
      MB.sprites.drawLockIcon(icon);
      icon.setPosition(60, y);
      icon.setScale(1.3);
      this.armoryScrollContainer.add(icon);
      var pre = "Unlocks at " + C.CARRIER.unlockStars.toLocaleString() + " ";
      var suf = "(you have " + stars.toLocaleString() + ")";
      var preObj = MB.ui.addText(this, -190, y + 22, pre, { fontSize: "8px", color: "#cc8833", origin: 0, align: "left" });
      this.armoryScrollContainer.add(preObj);
      var starObj = MB.ui.addText(this, 0, 0, "\u2605", { fontSize: "18px", color: "#ffd24d", origin: 0, align: "left" });
      starObj.setPosition(preObj.x + preObj.width + 2, y + 12);
      this.armoryScrollContainer.add(starObj);
      var sufObj = MB.ui.addText(this, starObj.x + starObj.width + 4, y + 22, suf, { fontSize: "8px", color: "#cc8833", origin: 0, align: "left" });
      this.armoryScrollContainer.add(sufObj);
      this.armoryScrollContainer.add(MB.ui.addButton(this, 145, y, 108, 38, "LOCKED", {
        fill: 0x333344,
        fillOver: 0x333344,
        fontSize: "9px",
        onClick: function () {}
      }));
      return;
    }

    this.armoryScrollContainer.add(MB.ui.addButton(this, 145, y, 108, 38, "TRAIN \u00d7" + count, {
      fill: 0x2a9d3f,
      fillOver: 0x3ac24f,
      fontSize: "9px",
      onClick: (function () {
        MB.audio.click();
        MB.audio.unlock();
        this.scene.run("Math", { tier: id });
      }).bind(this)
    }));
  },

  setupArmoryScrollInput: function () {
    const C = MB.config;
    var self = this;
    var canvas = this.game.canvas;

    var maskGfx = this.add.graphics();
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(458, this.armoryViewportY, 444, this.armoryViewportH);
    maskGfx.setAlpha(0);
    this.armoryScrollContainer.setMask(maskGfx.createGeometryMask());

    this._armoryWheelHandler = function (e) {
      e.preventDefault();
      self.armoryScrollTarget = Phaser.Math.Clamp(self.armoryScrollTarget + e.deltaY * 0.5, 0, self.armoryMaxScroll());
    };
    canvas.addEventListener("wheel", this._armoryWheelHandler, { passive: false });
    if (!this._armoryCleanupHooked) {
      this._armoryCleanupHooked = true;
      this.events.on("shutdown", function () {
        canvas.removeEventListener("wheel", self._armoryWheelHandler);
      });
    }

    this.input.on("pointerdown", function (pointer) {
      if (pointer.y >= self.armoryViewportY && pointer.y <= self.armoryViewportY + self.armoryViewportH && self.armoryMaxScroll() > 0) {
        self.armoryDragging = true;
        self.armoryDragStartY = pointer.y;
        self.armoryDragStartScroll = self.armoryScrollTarget;
      }
    });
    this.input.on("pointermove", function (pointer) {
      if (!self.armoryDragging) return;
      if (pointer.y < self.armoryViewportY || pointer.y > self.armoryViewportY + self.armoryViewportH) {
        self.armoryDragging = false;
        return;
      }
      var delta = self.armoryDragStartY - pointer.y;
      self.armoryScrollTarget = Phaser.Math.Clamp(self.armoryDragStartScroll + delta, 0, self.armoryMaxScroll());
    });
    this.input.on("pointerup", function () {
      self.armoryDragging = false;
    });
  },

  updateArmoryScrollbar: function () {
    const C = MB.config;
    if (!this.armoryScrollbarBg) {
      this.armoryScrollbarBg = this.add.graphics();
      this.armoryScrollbar = this.add.graphics();
    }
    this.armoryScrollbar.clear();
    var max = this.armoryMaxScroll();
    if (max <= 0) {
      this.armoryScrollbarBg.setVisible(false);
      return;
    }
    this.armoryScrollbarBg.setVisible(true);
    this.armoryScrollbarBg.clear();
    this.armoryScrollbarBg.fillStyle(0x222244, 0.5);
    this.armoryScrollbarBg.fillRoundedRect(C.WIDTH - 12, this.armoryViewportY, 6, this.armoryViewportH, 3);
    var barH = Math.max(30, (this.armoryViewportH / this.armoryTotalH) * this.armoryViewportH);
    var barY = this.armoryViewportY + (this.armoryScrollY / max) * (this.armoryViewportH - barH);
    this.armoryScrollbar.fillStyle(0x6688bb, 0.6);
    this.armoryScrollbar.fillRoundedRect(C.WIDTH - 12, barY, 6, barH, 3);
  },

  updateArmoryFades: function () {
    if (!this.armoryFadeTop) {
      this.armoryFadeTop = this.add.graphics();
      this.armoryFadeBot = this.add.graphics();
    }
    this.armoryFadeTop.clear();
    this.armoryFadeBot.clear();
    var fx = 458;
    var fw = 444;
    if (this.armoryScrollY > 5) {
      for (var i = 0; i < 20; i++) {
        this.armoryFadeTop.fillStyle(0x0a0a1e, (1 - i / 20) * 0.95);
        this.armoryFadeTop.fillRect(fx, this.armoryViewportY + i, fw, 1);
      }
    }
    if (this.armoryScrollY < this.armoryMaxScroll() - 5) {
      for (var j = 0; j < 20; j++) {
        this.armoryFadeBot.fillStyle(0x0a0a1e, (j / 20) * 0.95);
        this.armoryFadeBot.fillRect(fx, this.armoryViewportY + this.armoryViewportH - 20 + j, fw, 1);
      }
    }
  },

  buildFleet: function () {
    const C = MB.config;
    if (this.fleetContainer) {
      this.fleetContainer.destroy(true);
      this.fleetContainer = null;
    }
    const container = this.add.container(0, 0);
    this.fleetShips = [];
    container.add(MB.ui.addText(this, 15, 110, "Solve problems to train ships.\nHarder problems = stronger ships.", { fontSize: "9px", color: "#6677aa", origin: 0, align: "left" }));

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

    this.fleetCounts = {};
    C.TIER_ORDER.forEach(function (id) {
      this.fleetCounts[id] = counts[id];
    }, this);

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
    let total = 0;
    C.TIER_ORDER.forEach(function (id) {
      total += this.state.army[id] || 0;
    }, this);
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
    this.attackBtn = MB.ui.addButton(this, C.WIDTH / 2, 502, 240, 60, "ATTACK!", {
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
    if (this.armoryScrollContainer) {
      this.armoryScrollY += (this.armoryScrollTarget - this.armoryScrollY) * 0.18;
      if (Math.abs(this.armoryScrollY - this.armoryScrollTarget) < 0.5) this.armoryScrollY = this.armoryScrollTarget;
      this.armoryScrollContainer.y = this.armoryViewportY - this.armoryScrollY;
      this.updateArmoryScrollbar();
      this.updateArmoryFades();
    }
  }
});
