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
    transparent: true,
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

    function refreshScale() {
      window.game.scale.refresh();
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refreshScale, 150);
    });
    window.addEventListener("orientationchange", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refreshScale, 300);
    });

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
