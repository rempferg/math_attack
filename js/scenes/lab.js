window.MB = window.MB || {};

MB.Scenes.Lab = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Lab() {
    Phaser.Scene.call(this, { key: "Lab" });
  },

  create: function () {
    const C = MB.config;
    this.state = MB.save.load();
    this.stars = MB.ui.addStars(this, 70);

    this.titleText = MB.ui.addText(this, C.WIDTH / 2, 40, "WEAPONS LAB", { fontSize: "26px", color: "#66c8ff" });
    MB.ui.addText(this, C.WIDTH / 2, 78, "Permanent fleet upgrades \u2014 elite math, get 4-6 in a row!", { fontSize: "10px", color: "#88aadd" });

    this.buildPanels();

    MB.ui.addText(this, C.WIDTH / 2, 452, "Upgrades stay with you forever and apply to every ship.", { fontSize: "9px", color: "#6677aa" });
    MB.ui.addButton(this, C.WIDTH / 2, 490, 220, 48, "BACK", {
      fill: 0x883333,
      fillOver: 0xaa4444,
      fontSize: "13px",
      onClick: function () {
        MB.audio.click();
        MB.sceneGo(this, "Base");
      }.bind(this)
    });

    this.events.on("resume", this.refresh, this);
  },

  refresh: function () {
    this.state = MB.save.load();
    this.buildPanels();
  },

  buildPanels: function () {
    const C = MB.config;
    if (this.panelContainer) {
      this.panelContainer.destroy(true);
      this.panelContainer = null;
    }
    const container = this.add.container(0, 0);
    const y0 = 130;
    C.UPGRADE_ORDER.forEach(function (track, i) {
      const up = C.UPGRADES[track];
      const level = this.state.upgrades[track] || 0;
      const maxed = level >= C.UPGRADE_LEVELS;
      const y = y0 + i * 100;
      const panel = MB.ui.addPanel(this, C.WIDTH / 2, y, 560, 86, { fill: 0x0d0d30, alpha: 0.96, border: 0x5566bb });
      container.add(panel);

      const icon = this.add.graphics();
      MB.sprites.drawUpgradeIcon(icon, track);
      icon.setPosition(C.WIDTH / 2 - 235, y);
      container.add(icon);

      container.add(MB.ui.addText(this, C.WIDTH / 2 - 195, y - 22, up.name.toUpperCase(), { fontSize: "13px", color: "#ffd24d", origin: 0, align: "left" }));
      container.add(MB.ui.addText(this, C.WIDTH / 2 - 195, y + 2, up.desc, { fontSize: "8px", color: "#aabbee", origin: 0, align: "left" }));
      container.add(MB.ui.addText(this, C.WIDTH / 2 - 195, y + 18, maxed ? "MAX LEVEL" : "Next: " + this.effectLabel(track, level + 1) + "  \u00b7  " + up.chains[level] + " in a row", { fontSize: "8px", color: maxed ? "#ffd24d" : "#88ff88", origin: 0, align: "left" }));

      for (let p = 0; p < C.UPGRADE_LEVELS; p++) {
        const pg = this.add.graphics();
        const px = C.WIDTH / 2 + 95 + p * 26;
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
        container.add(pg);
      }

      const btnLabel = maxed ? "MAX" : "TRAIN";
      container.add(MB.ui.addButton(this, C.WIDTH / 2 + 210, y, 90, 44, btnLabel, {
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
    }, this);

    this.panelContainer = container;
  },

  effectLabel: function (track, level) {
    if (track === "damage") return "+" + Math.round(level * 20) + "% dmg";
    if (track === "fireRate") return "+" + Math.round(level * 10) + "% fire speed";
    return "+" + Math.round(level * 12) + "% range";
  },

  update: function (time, dt) {
    MB.ui.updateStars(this.stars, dt);
    const hue = (time * 0.05) % 360;
    this.titleText.setColor(this.hslHex(hue, 0.9, 0.65));
    this.titleText.setScale(1 + Math.sin(time * 0.003) * 0.04);
  },

  hslHex: function (h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const to = function (v) {
      const n = Math.round((v + m) * 255).toString(16);
      return n.length === 1 ? "0" + n : n;
    };
    return "#" + to(r) + to(g) + to(b);
  }
});
