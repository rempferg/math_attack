window.MB = window.MB || {};

MB.hud = (function () {
  "use strict";

  function fmt(n) {
    return String(Math.round(n));
  }

  return {
    fmt: fmt,
    setScore: function (value) {
      const sm = window.game ? game.scene : null;
      const e = sm ? sm.getScene("Hud") : null;
      if (e) e.target = value;
    }
  };
})();

MB.Scenes = MB.Scenes || {};

MB.Scenes.Hud = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Hud() {
    Phaser.Scene.call(this, { key: "Hud" });
  },

  create: function () {
    this.current = MB.save.scoreLoad();
    this.target = this.current;
    this.box = this.add.container(10, 16);
    this.star = this.add.text(0, -8.4, "\u2605", {
      fontFamily: MB.config.FONT,
      fontSize: "32px",
      color: "#ffd24d",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0, 0.5);
    this.num = this.add.text(42, 0, MB.hud.fmt(this.current), {
      fontFamily: MB.config.FONT,
      fontSize: "13px",
      color: "#ffd24d",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0, 0.5);
    this.box.add([this.star, this.num]);
    this.box.setDepth(1000);
  },

  update: function (_time, dt) {
    if (this.target === this.current) return;
    const diff = this.target - this.current;
    const rate = 800;
    const step = Math.min(Math.abs(diff), rate * dt / 1000);
    this.current += diff > 0 ? step : -step;
    if (Math.abs(this.target - this.current) < 1) {
      this.current = this.target;
      this.box.setScale(1.35);
      this.tweens.add({ targets: this.box, scaleX: 1, scaleY: 1, duration: 250, ease: "Cubic.easeOut" });
    }
    this.num.setText(MB.hud.fmt(this.current));
  }
});
