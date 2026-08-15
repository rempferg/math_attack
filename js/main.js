window.MB = window.MB || {};

(function () {
  "use strict";
  const C = MB.config;

  const config = {
    type: Phaser.AUTO,
    width: C.WIDTH,
    height: C.HEIGHT,
    parent: "game",
    backgroundColor: "#050518",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
      MB.Scenes.Menu,
      MB.Scenes.Setup,
      MB.Scenes.Base,
      MB.Scenes.Lab,
      MB.Scenes.Math,
      MB.Scenes.Battle,
      MB.Scenes.Result,
      MB.Scenes.Hud
    ]
  };

  window.game = new Phaser.Game(config);

  const gameEl = document.getElementById("game");

  function fit() {
    if (!gameEl) return;
    const h = window.innerHeight;
    if (gameEl.style.height === h + "px") return;
    gameEl.style.height = h + "px";
    if (window.game && window.game.scale) {
      try {
        window.game.scale.refresh();
      } catch (e) { /* not booted yet */ }
    }
  }

  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", function () {
    window.setTimeout(fit, 200);
  });
  fit();
})();
