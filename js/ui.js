window.MB = window.MB || {};

MB.sceneGo = function (scene, key, data) {
  const sm = scene.scene.manager;
  if (!sm.isActive("Hud")) sm.launch("Hud");
  const all = sm.getScenes(true).slice();
  for (let i = 0; i < all.length; i++) {
    const s = all[i];
    if (s.scene.key !== key && s.scene.key !== "Hud") sm.stop(s.scene.key);
  }
  sm.start(key, data);
};

MB.ui = (function () {
  "use strict";

  function addButton(scene, x, y, w, h, label, opts) {
    opts = opts || {};
    const container = scene.add.container(x, y);
    const bg = scene.add.graphics();
    const fill = opts.fill != null ? opts.fill : 0x2a5ab0;
    const fillOver = opts.fillOver != null ? opts.fillOver : 0x3f7de0;
    const border = opts.border != null ? opts.border : 0xffffff;
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(3, border, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    const text = scene.add.text(0, 0, label, {
      fontFamily: MB.config.FONT,
      fontSize: opts.fontSize || "18px",
      color: opts.textColor || "#ffffff",
      align: "center",
      wordWrap: { width: w - 12 }
    }).setOrigin(0.5);
    const hit = scene.add.rectangle(0, 0, w, h, 0xffffff, 0.001);
    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerover", function () {
      bg.clear();
      bg.fillStyle(container._over, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(3, border, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    });
    hit.on("pointerout", function () {
      bg.clear();
      bg.fillStyle(container._fill, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(3, border, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    });
    hit.on("pointerdown", function () {
      if (opts.onClick) opts.onClick();
    });
    container.add([bg, text, hit]);
    container._w = w;
    container._h = h;
    container._fill = fill;
    container._over = fillOver;
    return container;
  }

  function addText(scene, x, y, label, opts) {
    opts = opts || {};
    const style = {
      fontFamily: MB.config.FONT,
      fontSize: opts.fontSize || "16px",
      color: opts.color || "#ffffff",
      align: opts.align || "center",
      wordWrap: opts.wordWrap ? { width: opts.wordWrap } : undefined
    };
    if (opts.fontStyle != null) style.fontStyle = opts.fontStyle;
    if (opts.stroke != null) style.stroke = opts.stroke;
    if (opts.strokeThickness != null) style.strokeThickness = opts.strokeThickness;
    if (opts.lineHeight != null) style.lineHeight = opts.lineHeight;
    if (opts.padding != null) style.padding = opts.padding;
    return scene.add.text(x, y, label, style).setOrigin(opts.origin != null ? opts.origin : 0.5);
  }

  function addStars(scene, count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const g = scene.add.graphics();
      const a = 0.3 + Math.random() * 0.7;
      const size = Math.random() < 0.15 ? 2 : 1;
      g.fillStyle(0xffffff, a);
      g.fillCircle(Math.random() * MB.config.WIDTH, Math.random() * MB.config.HEIGHT, size);
      stars.push({ g: g, x: g.x, y: g.y, speed: 0.1 + Math.random() * 0.5 });
    }
    return stars;
  }

  function updateStars(stars, dt) {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x += s.speed * dt * 0.02;
      if (s.x > MB.config.WIDTH + 5) s.x = -5;
      s.g.setPosition(s.x, s.y);
    }
  }

  function addHpBar(scene, x, y, w, h) {
    const bar = scene.add.container(x, y);
    const bg = scene.add.graphics();
    bg.fillStyle(0x330000, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 3);
    const fill = scene.add.graphics();
    bar.add([bg, fill]);
    bar.barW = w;
    bar.barH = h;
    bar.updateBar = function (ratio) {
      fill.clear();
      const clamped = Math.max(0, Math.min(1, ratio));
      fill.fillStyle(0x44ff55, 1);
      fill.fillRoundedRect(-w / 2, -h / 2, w * clamped, h, 3);
    };
    bar.updateBar(1);
    return bar;
  }

  function setPageDark(alpha) {
    var el = document.getElementById("page-overlay");
    if (!el) {
      el = document.createElement("div");
      el.id = "page-overlay";
      el.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:#000;pointer-events:none;z-index:0;";
      document.body.appendChild(el);
    }
    el.style.opacity = alpha;
  }

  function clearPageDark() {
    var el = document.getElementById("page-overlay");
    if (el) el.remove();
  }

  function addPanel(scene, x, y, w, h, opts) {
    opts = opts || {};
    const g = scene.add.graphics();
    g.fillStyle(opts.fill != null ? opts.fill : 0x111144, opts.alpha != null ? opts.alpha : 0.9);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.lineStyle(3, opts.border != null ? opts.border : 0x8899ff, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    return scene.add.container(x, y).add(g);
  }

  return {
    addButton: addButton,
    addText: addText,
    addStars: addStars,
    updateStars: updateStars,
    addHpBar: addHpBar,
    addPanel: addPanel,
    setPageDark: setPageDark,
    clearPageDark: clearPageDark
  };
})();
