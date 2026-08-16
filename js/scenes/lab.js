window.MB = window.MB || {};

MB.Scenes.Lab = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Lab() {
    Phaser.Scene.call(this, { key: "Lab" });
  },

  create: function () {
    const C = MB.config;
    this.state = MB.save.load();
    this.starsBg = MB.ui.addStars(this, 70);

    this.titleText = MB.ui.addText(this, C.WIDTH / 2, 36, "WEAPONS LAB", { fontSize: "24px", color: "#66c8ff" });
    MB.ui.addText(this, C.WIDTH / 2, 66, "Permanent fleet upgrades \u2014 elite math, get 4-6 in a row!", { fontSize: "9px", color: "#88aadd" });

    this.viewportY = 92;
    this.viewportH = 350;

    this.scrollContainer = this.add.container(0, this.viewportY);
    this.buildPanels();

    this.scrollY = 0;
    this.scrollTarget = 0;
    this.maxScroll = Math.max(0, this.totalH - this.viewportH);
    this.dragging = false;
    this.dragStartY = 0;
    this.dragStartScroll = 0;

    var maskGfx = this.add.graphics();
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(0, this.viewportY, C.WIDTH, this.viewportH);
    maskGfx.setAlpha(0);
    this.scrollContainer.setMask(maskGfx.createGeometryMask());

    this.scrollbarBg = this.add.graphics();
    this.scrollbarBg.fillStyle(0x222244, 0.5);
    this.scrollbarBg.fillRoundedRect(C.WIDTH - 12, this.viewportY, 6, this.viewportH, 3);

    this.scrollbar = this.add.graphics();
    this.updateScrollbar();

    this.fadeTop = this.add.graphics();
    this.fadeBot = this.add.graphics();

    var self = this;
    var canvas = this.game.canvas;
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      self.scrollTarget = Phaser.Math.Clamp(self.scrollTarget + e.deltaY * 0.5, 0, self.maxScroll);
    }, { passive: false });

    this.input.on("pointerdown", function (pointer) {
      if (pointer.y >= this.viewportY && pointer.y <= this.viewportY + this.viewportH && this.maxScroll > 0) {
        this.dragging = true;
        this.dragStartY = pointer.y;
        this.dragStartScroll = this.scrollTarget;
      }
    }, this);

    this.input.on("pointermove", function (pointer) {
      if (!this.dragging) return;
      if (pointer.y < this.viewportY || pointer.y > this.viewportY + this.viewportH) {
        this.dragging = false;
        return;
      }
      var delta = this.dragStartY - pointer.y;
      this.scrollTarget = Phaser.Math.Clamp(this.dragStartScroll + delta, 0, this.maxScroll);
    }, this);

    this.input.on("pointerup", function () {
      this.dragging = false;
    }, this);

    this.updateFades();

    MB.ui.addText(this, C.WIDTH / 2, 456, "Upgrades stay with you forever and apply to every ship.", { fontSize: "8px", color: "#6677aa" });
    MB.ui.addButton(this, C.WIDTH / 2, 496, 220, 44, "BACK", {
      fill: 0x883333,
      fillOver: 0xaa4444,
      fontSize: "13px",
      onClick: function () {
        MB.audio.click();
        MB.sceneGo(this, "Base");
      }.bind(this)
    });
  },

  refresh: function () {
    this.state = MB.save.load();
    this.buildPanels();
    this.maxScroll = Math.max(0, this.totalH - this.viewportH);
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
    this.scrollTarget = this.scrollY;
    this.updateScrollbar();
    this.updateFades();
  },

  buildPanels: function () {
    const C = MB.config;
    this.scrollContainer.removeAll(true);
    var y = 48;

    C.UPGRADE_ORDER.forEach(function (track) {
      this.addStandardPanel(track, y);
      y += 92;
    }, this);

    if (C.STAR_UPGRADE_ORDER && C.STAR_UPGRADE_ORDER.length > 0) {
      y += 6;
      this.scrollContainer.add(MB.ui.addText(this, C.WIDTH / 2, y, "\u2605 STAR UNLOCKS \u2605", { fontSize: "11px", color: "#ffd24d" }));
      y += 22;

      C.STAR_UPGRADE_ORDER.forEach(function (track) {
        this.addStarPanel(track, y);
        y += 100;
      }, this);
    }

    this.totalH = y + 10;
  },

  addStandardPanel: function (track, y) {
    const C = MB.config;
    const up = C.UPGRADES[track];
    const level = this.state.upgrades[track] || 0;
    const maxed = level >= C.UPGRADE_LEVELS;
    const panel = MB.ui.addPanel(this, C.WIDTH / 2, y, 560, 82, { fill: 0x0d0d30, alpha: 0.96, border: 0x5566bb });
    this.scrollContainer.add(panel);

    var icon = this.add.graphics();
    MB.sprites.drawUpgradeIcon(icon, track);
    icon.setPosition(C.WIDTH / 2 - 235, y);
    this.scrollContainer.add(icon);

    this.scrollContainer.add(MB.ui.addText(this, C.WIDTH / 2 - 195, y - 20, up.name.toUpperCase(), { fontSize: "13px", color: "#ffd24d", origin: 0, align: "left" }));
    this.scrollContainer.add(MB.ui.addText(this, C.WIDTH / 2 - 195, y + 2, up.desc, { fontSize: "8px", color: "#aabbee", origin: 0, align: "left", wordWrap: 260 }));
    this.scrollContainer.add(MB.ui.addText(this, C.WIDTH / 2 - 195, y + 18, maxed ? "MAX LEVEL" : "Next: " + this.effectLabel(track, level + 1) + "  \u00b7  " + up.chains[level] + " in a row", { fontSize: "8px", color: maxed ? "#ffd24d" : "#88ff88", origin: 0, align: "left", wordWrap: 260 }));

    for (var p = 0; p < C.UPGRADE_LEVELS; p++) {
      var pg = this.add.graphics();
      var px = C.WIDTH / 2 + 95 + p * 26;
      if (p < level) {
        pg.fillStyle(0xffd24d, 1);
        pg.fillCircle(0, 0, 7);
        pg.fillStyle(0xffffff, 1);
        pg.fillCircle(0, 0, 3);
      } else {
        pg.lineStyle(2, maxed ? 0xffd24d : 0x4455aa, 1);
        pg.strokeCircle(0, 0, 6);
      }
      pg.setPosition(px, y);
      this.scrollContainer.add(pg);
    }

    var btnLabel = maxed ? "MAX" : "TRAIN";
    this.scrollContainer.add(MB.ui.addButton(this, C.WIDTH / 2 + 210, y, 90, 44, btnLabel, {
      fill: maxed ? 0x555577 : 0x2a9d3f,
      fillOver: maxed ? 0x555577 : 0x3ac24f,
      fontSize: maxed ? "13px" : "11px",
      onClick: (function () {
        if (maxed) return;
        MB.audio.click();
        MB.audio.unlock();
        this.scene.run("Math", { subject: "upg:" + track, mode: "upg", chain: up.chains[level] });
        this.scene.pause();
      }).bind(this)
    }));
  },

  addStarPanel: function (track, y) {
    const C = MB.config;
    const up = C.UPGRADES[track];
    const level = this.state.upgrades[track] || 0;
    const maxed = level >= C.UPGRADE_LEVELS;
    const stars = MB.save.scoreLoad();
    const unlocked = stars >= up.unlockStars;

    var border = unlocked ? 0x5566bb : 0x333344;
    var fill = unlocked ? 0x0d0d30 : 0x080818;
    var panel = MB.ui.addPanel(this, C.WIDTH / 2, y, 560, 92, { fill: fill, alpha: 0.96, border: border });
    this.scrollContainer.add(panel);

    var icon = this.add.graphics();
    if (unlocked) {
      MB.sprites.drawSniperIcon(icon);
    } else {
      MB.sprites.drawLockIcon(icon);
    }
    icon.setPosition(C.WIDTH / 2 - 235, y);
    this.scrollContainer.add(icon);

    var nameColor = unlocked ? "#ffd24d" : "#556677";
    this.scrollContainer.add(MB.ui.addText(this, C.WIDTH / 2 - 195, y - 26, up.name.toUpperCase() + (unlocked ? "" : " \u2014 LOCKED"), { fontSize: "13px", color: nameColor, origin: 0, align: "left" }));
    this.scrollContainer.add(MB.ui.addText(this, C.WIDTH / 2 - 195, y - 6, up.desc, { fontSize: "8px", color: unlocked ? "#aabbee" : "#445566", origin: 0, align: "left", wordWrap: 280 }));

    if (!unlocked) {
      var pre = "Unlocks at " + up.unlockStars.toLocaleString() + " ";
      var suf = " (you have " + stars.toLocaleString() + ")";
      var statusColor = "#cc8833";
      var preObj = MB.ui.addText(this, C.WIDTH / 2 - 195, y + 14, pre, { fontSize: "8px", color: statusColor, origin: 0, align: "left" });
      this.scrollContainer.add(preObj);
      var starObj = MB.ui.addText(this, 0, 0, "\u2605", { fontSize: "20px", color: "#ffd24d", origin: 0, align: "left" });
      starObj.setScale(1, 1);
      starObj.setPosition(preObj.x + preObj.width, y + 2);
      this.scrollContainer.add(starObj);
      var sufObj = MB.ui.addText(this, starObj.x + 12, y + 14, suf, { fontSize: "8px", color: statusColor, origin: 0, align: "left" });
      this.scrollContainer.add(sufObj);
    } else if (maxed) {
      this.scrollContainer.add(MB.ui.addText(this, C.WIDTH / 2 - 195, y + 14, "MAX LEVEL", { fontSize: "8px", color: "#ffd24d", origin: 0, align: "left" }));
    } else {
      this.scrollContainer.add(MB.ui.addText(this, C.WIDTH / 2 - 195, y + 14, "Next: " + this.effectLabel(track, level + 1) + "  \u00b7  " + up.chains[level] + " in a row", { fontSize: "8px", color: "#88ff88", origin: 0, align: "left", wordWrap: 280 }));
    }

    for (var p = 0; p < C.UPGRADE_LEVELS; p++) {
      var pg = this.add.graphics();
      var px = C.WIDTH / 2 + 95 + p * 26;
      if (p < level) {
        pg.fillStyle(0xffd24d, 1);
        pg.fillCircle(0, 0, 7);
        pg.fillStyle(0xffffff, 1);
        pg.fillCircle(0, 0, 3);
      } else {
        pg.lineStyle(2, !unlocked ? 0x333344 : (maxed ? 0xffd24d : 0x4455aa), 1);
        pg.strokeCircle(0, 0, 6);
      }
      pg.setPosition(px, y);
      this.scrollContainer.add(pg);
    }

    if (!unlocked) {
      this.scrollContainer.add(MB.ui.addButton(this, C.WIDTH / 2 + 210, y, 90, 44, "LOCKED", {
        fill: 0x333344,
        fillOver: 0x333344,
        fontSize: "11px",
        onClick: function () {}
      }));
    } else {
      var btnLabel = maxed ? "MAX" : "TRAIN";
      this.scrollContainer.add(MB.ui.addButton(this, C.WIDTH / 2 + 210, y, 90, 44, btnLabel, {
        fill: maxed ? 0x555577 : 0x2a9d3f,
        fillOver: maxed ? 0x555577 : 0x3ac24f,
        fontSize: maxed ? "13px" : "11px",
        onClick: (function () {
          if (maxed) return;
          MB.audio.click();
          MB.audio.unlock();
          this.scene.run("Math", { subject: "upg:" + track, mode: "upg", chain: up.chains[level] });
          this.scene.pause();
        }).bind(this)
      }));
    }
  },

  effectLabel: function (track, level) {
    if (track === "damage") return "+" + Math.round(level * 20) + "% dmg";
    if (track === "fireRate") return "+" + Math.round(level * 10) + "% fire speed";
    if (track === "range") return "+" + Math.round(level * 12) + "% range";
    if (track === "sniperLaser") {
      var lv = MB.config.UPGRADES.sniperLaser.levels[level - 1];
      return lv.damage + " dmg/tick \u00b7 range " + lv.range;
    }
    return "";
  },

  updateScrollbar: function () {
    const C = MB.config;
    this.scrollbar.clear();
    if (this.maxScroll <= 0) {
      this.scrollbarBg.setVisible(false);
      return;
    }
    this.scrollbarBg.setVisible(true);
    var barH = Math.max(30, (this.viewportH / this.totalH) * this.viewportH);
    var barY = this.viewportY + (this.scrollY / this.maxScroll) * (this.viewportH - barH);
    this.scrollbar.fillStyle(0x6688bb, 0.6);
    this.scrollbar.fillRoundedRect(C.WIDTH - 12, barY, 6, barH, 3);
  },

  updateFades: function () {
    const C = MB.config;
    this.fadeTop.clear();
    this.fadeBot.clear();
    if (this.scrollY > 5) {
      for (var i = 0; i < 20; i++) {
        this.fadeTop.fillStyle(0x0a0a1e, (1 - i / 20) * 0.95);
        this.fadeTop.fillRect(0, this.viewportY + i, C.WIDTH, 1);
      }
    }
    if (this.scrollY < this.maxScroll - 5) {
      for (var j = 0; j < 20; j++) {
        this.fadeBot.fillStyle(0x0a0a1e, (j / 20) * 0.95);
        this.fadeBot.fillRect(0, this.viewportY + this.viewportH - 20 + j, C.WIDTH, 1);
      }
    }
  },

  update: function (time, dt) {
    MB.ui.updateStars(this.starsBg, dt);
    var hue = (time * 0.05) % 360;
    this.titleText.setColor(this.hslHex(hue, 0.9, 0.65));
    this.titleText.setScale(1 + Math.sin(time * 0.003) * 0.04);

    this.scrollY += (this.scrollTarget - this.scrollY) * 0.18;
    if (Math.abs(this.scrollY - this.scrollTarget) < 0.5) this.scrollY = this.scrollTarget;
    this.scrollContainer.y = this.viewportY - this.scrollY;
    this.updateScrollbar();
    this.updateFades();
  },

  hslHex: function (h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    var to = function (v) {
      var n = Math.round((v + m) * 255).toString(16);
      return n.length === 1 ? "0" + n : n;
    };
    return "#" + to(r) + to(g) + to(b);
  }
});
