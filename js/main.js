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
      MB.Scenes.Math,
      MB.Scenes.Battle,
      MB.Scenes.Result
    ]
  };

  window.game = new Phaser.Game(config);
})();
