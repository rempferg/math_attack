window.MB = window.MB || {};

MB.Scenes = MB.Scenes || {};

MB.Scenes.Menu = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Menu() {
    Phaser.Scene.call(this, { key: "Menu" });
  },

  create: function () {
    const C = MB.config;
    this.stars = MB.ui.addStars(this, 90);
    MB.ui.addText(this, C.WIDTH / 2, 120, "MATH BLASTER", { fontSize: "44px", color: "#66c8ff" });
    MB.ui.addText(this, C.WIDTH / 2, 175, "Space Adventure", { fontSize: "18px", color: "#ffd24d" });
    MB.ui.addText(this, C.WIDTH / 2, 210, "Solve math. Build a fleet. Destroy the alien base.", { fontSize: "11px", color: "#aabbee" });

    const state = MB.save.load();
    const hasProgress = state.army.drone + state.army.fighter + state.army.cruiser + state.army.dreadnought > 0;

    MB.ui.addButton(this, C.WIDTH / 2, 300, 260, 64, "PLAY", {
      fill: 0x2a9d3f,
      fillOver: 0x3ac24f,
      fontSize: "24px",
      onClick: function () {
        MB.audio.unlock();
        MB.audio.click();
        MB.sceneGo(this, "Setup");
      }.bind(this)
    });

    let status = "Train ships by solving math problems!";
    if (hasProgress) {
      const total = state.army.drone + state.army.fighter + state.army.cruiser + state.army.dreadnought;
      status = "Your fleet: " + total + " ships   |   Battles won: " + state.battlesWon;
    }
    MB.ui.addText(this, C.WIDTH / 2, 395, status, { fontSize: "11px", color: "#88aadd" });

    if (hasProgress) {
      MB.ui.addButton(this, C.WIDTH / 2, 450, 200, 40, "RESET PROGRESS", {
        fill: 0x883333,
        fillOver: 0xaa4444,
        fontSize: "11px",
        onClick: function () {
          MB.save.clear();
          this.scene.restart();
        }.bind(this)
      });
    }

    MB.ui.addText(this, C.WIDTH / 2, 510, "For kids who love space and math \u2728", { fontSize: "9px", color: "#6677aa" });
  },

  update: function (_time, dt) {
    MB.ui.updateStars(this.stars, dt);
  }
});
