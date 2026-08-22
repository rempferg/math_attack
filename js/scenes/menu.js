window.MB = window.MB || {};

MB.Scenes = MB.Scenes || {};

MB.Scenes.Menu = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Menu() {
    Phaser.Scene.call(this, { key: "Menu" });
  },

  create: function () {
    const C = MB.config;
    if (!this.scene.isActive("Hud")) this.scene.launch("Hud");
    this.stars = MB.ui.addStars(this, 90);
    MB.ui.addText(this, C.WIDTH / 2, 120, "MATH ATTACK", { fontSize: "44px", color: "#66c8ff", fontStyle: "bold", stroke: "#66c8ff", strokeThickness: 2 });
    MB.ui.addText(this, C.WIDTH / 2, 175, "Space Adventure", { fontSize: "18px", color: "#ffd24d" });
    MB.ui.addText(this, C.WIDTH / 2, 210, "Solve math. Build a fleet. Destroy the alien base.", { fontSize: "11px", color: "#aabbee" });
    MB.ui.addText(this, C.WIDTH - 12, 16, "V23", { fontSize: "13px", color: "#6677aa", origin: 1 });

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

    MB.ui.addButton(this, C.WIDTH / 2, 450, 200, 40, "RESET PROGRESS", {
      fill: 0x883333,
      fillOver: 0xaa4444,
      fontSize: "11px",
      onClick: function () {
        MB.audio.click();
        this.showResetConfirm();
      }.bind(this)
    });

    MB.ui.addText(this, C.WIDTH / 2, 510, "For kids who love space and math \u2728", { fontSize: "9px", color: "#6677aa" });
  },

  showResetConfirm: function () {
    if (this.confirmModal) return;
    const C = MB.config;
    MB.ui.setPageDark(0.78);
    const overlay = this.add.rectangle(C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH, C.HEIGHT, 0x000000, 0.78);
    overlay.setInteractive();
    const panel = MB.ui.addPanel(this, C.WIDTH / 2, 270, 500, 260, { fill: 0x111144, alpha: 0.98, border: 0xff6666 });
    const title = MB.ui.addText(this, C.WIDTH / 2, 184, "RESET PROGRESS?", { fontSize: "18px", color: "#ff6666" });
    const body = MB.ui.addText(this, C.WIDTH / 2, 239, "This will start the game from scratch.\nYou will lose all progress.\nThis cannot be reverted!", { fontSize: "11px", color: "#dde3ff" });
    const note = MB.ui.addText(this, C.WIDTH / 2, 307, "(Your lifetime score \u2605 is kept.)", { fontSize: "9px", color: "#8899cc" });
    const cancel = MB.ui.addButton(this, C.WIDTH / 2 - 120, 357, 200, 44, "CANCEL", {
      fill: 0x2a5ab0,
      fillOver: 0x3f7de0,
      fontSize: "13px",
      onClick: function () {
        MB.audio.click();
        MB.ui.clearPageDark();
        this.confirmModal.destroy(true);
        this.confirmModal = null;
      }.bind(this)
    });
    const reset = MB.ui.addButton(this, C.WIDTH / 2 + 120, 357, 200, 44, "YES, RESET", {
      fill: 0x883333,
      fillOver: 0xaa4444,
      fontSize: "13px",
      onClick: function () {
        MB.audio.click();
        MB.ui.clearPageDark();
        this.confirmModal.destroy(true);
        this.confirmModal = null;
        MB.save.clear();
        this.scene.restart();
      }.bind(this)
    });
    this.confirmModal = this.add.container(0, 0);
    this.confirmModal.add([overlay, panel, title, body, note, cancel, reset]);
  },

  update: function (_time, dt) {
    MB.ui.updateStars(this.stars, dt);
  }
});
