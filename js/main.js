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
      autoCenter: Phaser.Scale.CENTER_BOTH,
      fullscreenTarget: "#game"
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

  document.fonts.ready.then(function () {
    return document.fonts.load("16px \"Press Start 2P\"");
  }).then(function () {
    var probe = document.createElement("canvas").getContext("2d");
    probe.font = "16px \"Press Start 2P\"";
    probe.fillText(".", 0, 0);

    window.game = new Phaser.Game(config);

    var fsBtn = document.getElementById("fs-btn");
    if (!fsBtn) return;

    if (document.fullscreenEnabled) {
      fsBtn.addEventListener("click", function () {
        MB.audio.click();
        window.game.scale.toggleFullscreen();
      });
      window.game.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, function () {
        fsBtn.title = "Exit fullscreen";
      });
      window.game.scale.on(Phaser.Scale.Events.EXIT_FULLSCREEN, function () {
        fsBtn.title = "Fullscreen";
      });
    } else {
      fsBtn.style.display = "none";
    }
  });
})();
