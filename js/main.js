window.MB = window.MB || {};

(function () {
  "use strict";
  const C = MB.config;

  // Spelling is kept in the codebase but is no longer activatable.
  // MB.spelling.init();

  const config = {
    type: Phaser.AUTO,
    width: C.WIDTH,
    height: C.HEIGHT,
    parent: "game",
    backgroundColor: "#050518",
    fps: {
      // Phaser clamps each frame's delta to the target frame time for the first
      // `panicMax` frames after the page (re)gains focus. On a slow device that
      // makes the whole simulation run in slow motion until the cooldown ends,
      // then snap back to normal speed. Disabling the cooldown keeps game speed
      // tied to real time; single deltas are still capped at 1/min fps, so
      // returning from the background cannot make units jump.
      min: 5,
      target: 60,
      panicMax: 0
    },
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

    var el = document.documentElement;
    var canFullscreen = !!(el.requestFullscreen || el.webkitRequestFullscreen);

    if (canFullscreen) {
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
      fsBtn.addEventListener("click", function () {
        MB.audio.click();
        showWebAppInstructions();
      });
    }
  });

  function showWebAppInstructions() {
    var existing = document.getElementById("webapp-help");
    if (existing) {
      existing.remove();
      return;
    }

    var overlay = document.createElement("div");
    overlay.id = "webapp-help";
    overlay.innerHTML =
      '<div class="webapp-help-card">' +
      "<h2>Play in fullscreen</h2>" +
      "<p>Your browser can't go fullscreen from a button.</p>" +
      "<ol>" +
      "<li>Tap the <b>Share</b> button in Safari.</li>" +
      "<li>Choose <b>Add to Home Screen</b>.</li>" +
      "<li>Turn on <b>Open as Web App</b> and tap <b>Add</b>.</li>" +
      "<li>Launch the game from your Home Screen — it opens fullscreen.</li>" +
      "</ol>" +
      "<button type=\"button\" id=\"webapp-help-close\">OK</button>" +
      "</div>";

    overlay.addEventListener("click", function () {
      overlay.remove();
    });
    overlay.querySelector("#webapp-help-close").addEventListener("click", function (event) {
      event.stopPropagation();
      overlay.remove();
    });

    document.body.appendChild(overlay);
  }
})();
