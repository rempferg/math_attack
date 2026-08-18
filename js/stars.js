window.MB = window.MB || {};

MB.starBg = (function () {
  "use strict";

  var canvas = document.getElementById("stars-bg");
  var ctx = canvas.getContext("2d");
  var stars = [];
  var COUNT = 140;
  var lastTime = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    stars = [];
    for (var i = 0; i < COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() < 0.15 ? 2 : 1,
        a: 0.3 + Math.random() * 0.7,
        speed: 0.1 + Math.random() * 0.5
      });
    }
    lastTime = performance.now();
    requestAnimationFrame(tick);
  }

  function tick(now) {
    var dt = now - lastTime;
    lastTime = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x += s.speed * dt * 0.02;
      if (s.x > canvas.width + 5) s.x = -5;
      ctx.globalAlpha = s.a;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);

  return { init: init };
})();

MB.starBg.init();
