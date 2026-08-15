window.MB = window.MB || {};

MB.Scenes.Result = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Result() {
    Phaser.Scene.call(this, { key: "Result" });
  },

  init: function (data) {
    this.data = data || { outcome: "defeat", playerRemaining: 0, playerTotal: 0, enemyDestroyed: 0, enemyTotal: 0, baseDestroyed: false };
  },

  create: function () {
    const C = MB.config;
    this.stars = MB.ui.addStars(this, 50);
    const d = this.data;
    const victory = d.outcome === "victory";

    MB.ui.addText(this, C.WIDTH / 2, 120, victory ? "VICTORY!" : "DEFEAT...", {
      fontSize: "46px",
      color: victory ? "#ffd24d" : "#ff6666"
    });

    if (victory) {
      MB.ui.addText(this, C.WIDTH / 2, 185, "The alien base is DESTROYED!", { fontSize: "14px", color: "#88ff88" });
    } else {
      MB.ui.addText(this, C.WIDTH / 2, 185, "Your fleet was wiped out.\nTrain more ships and try again!", { fontSize: "12px", color: "#aabbee" });
    }

    MB.ui.addPanel(this, C.WIDTH / 2, 285, 520, 130, { fill: 0x111144, alpha: 0.9, border: 0x8899ff });
    MB.ui.addText(this, C.WIDTH / 2, 245, "BATTLE REPORT", { fontSize: "13px", color: "#66c8ff" });
    MB.ui.addText(this, C.WIDTH / 2, 285, "Your ships: " + d.playerRemaining + " / " + d.playerTotal, { fontSize: "12px", color: "#88aadd" });
    MB.ui.addText(this, C.WIDTH / 2, 320, "Enemies destroyed: " + d.enemyDestroyed + " / " + d.enemyTotal, { fontSize: "12px", color: "#88aadd" });

    MB.ui.addButton(this, C.WIDTH / 2 - 130, 420, 230, 52, "RETURN TO BASE", {
      fill: 0x2a5ab0,
      fillOver: 0x3f7de0,
      fontSize: "12px",
      onClick: function () {
        MB.audio.click();
        MB.sceneGo(this, "Base");
      }.bind(this)
    });

    MB.ui.addButton(this, C.WIDTH / 2 + 130, 420, 230, 52, victory ? "NEW MISSION" : "CHANGE MATH", {
      fill: 0x884499,
      fillOver: 0xa55ab5,
      fontSize: "12px",
      onClick: function () {
        MB.audio.click();
        MB.sceneGo(this, "Setup");
      }.bind(this)
    });
  },

  update: function (_time, dt) {
    MB.ui.updateStars(this.stars, dt);
  }
});
