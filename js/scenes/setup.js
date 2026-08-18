window.MB = window.MB || {};

MB.Scenes.Setup = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Setup() {
    Phaser.Scene.call(this, { key: "Setup" });
  },

  create: function () {
    const C = MB.config;
    this.state = MB.save.load();

    MB.ui.addText(this, C.WIDTH / 2, 40, "SETUP YOUR MISSION", { fontSize: "26px", color: "#66c8ff" });

    MB.ui.addText(this, C.WIDTH / 2, 88, "Choose your math:", { fontSize: "14px", color: "#ffd24d" });

    this.opButtons = {};
    const opW = 178;
    const gap = 16;
    const startX = C.WIDTH / 2 - (opW + gap) / 2;
    C.OPS.forEach(function (op, i) {
      const x = startX + (i % 2) * (opW + gap);
      const y = 136 + Math.floor(i / 2) * 58;
      this.opButtons[op] = MB.ui.addButton(this, x, y, opW, 46, C.OP_NAMES[op], {
        fill: this.state.settings.ops[op] ? 0x2a9d3f : 0x333366,
        fillOver: this.state.settings.ops[op] ? 0x3ac24f : 0x444488,
        fontSize: "10px",
        onClick: function () {
          this.toggleOp(op);
        }.bind(this)
      });
    }, this);

    this.mixedButton = MB.ui.addButton(this, C.WIDTH / 2, 248, 260, 42, "ALL / MIXED", {
      fill: 0x884499,
      fillOver: 0xa55ab5,
      fontSize: "13px",
      onClick: function () {
        this.toggleOp("all");
      }.bind(this)
    });

    MB.ui.addText(this, C.WIDTH / 2, 292, "How hard can the problems get?", { fontSize: "14px", color: "#ffd24d" });

    this.diffButtons = {};
    const diffW = 130;
    const dStartX = C.WIDTH / 2 - (diffW + 10);
    C.DIFFICULTIES.forEach(function (d, i) {
      const x = dStartX + i * (diffW + 10);
      this.diffButtons[d] = MB.ui.addButton(this, x, 330, diffW, 44, C.DIFFICULTY_NAMES[d], {
        fill: this.state.settings.difficulty === d ? 0x2a9d3f : 0x333366,
        fillOver: this.state.settings.difficulty === d ? 0x3ac24f : 0x444488,
        fontSize: "12px",
        onClick: function () {
          this.state.settings.difficulty = d;
          this.refreshDiff();
        }.bind(this)
      });
    }, this);

    this.diffInfo = MB.ui.addText(this, C.WIDTH / 2, 384, C.DIFFICULTY_INFO[this.state.settings.difficulty], { fontSize: "10px", color: "#88aadd" });

    const total = this.state.army.drone + this.state.army.fighter + this.state.army.cruiser + this.state.army.dreadnought;
    this.fleetInfo = MB.ui.addText(this, C.WIDTH / 2, 428, "Mission " + (this.state.mission || 1) + "   |   Fleet: " + total + " ships   |   Battles won: " + this.state.battlesWon + "   |   Base destroyed: " + (this.state.baseDestroyed ? "YES" : "not yet"), { fontSize: "10px", color: "#88aadd" });

    MB.ui.addButton(this, C.WIDTH / 2, 488, 260, 48, "CONTINUE", {
      fill: 0x2a9d3f,
      fillOver: 0x3ac24f,
      fontSize: "15px",
      onClick: function () {
        this.startMission();
      }.bind(this)
    });
  },

  toggleOp: function (op) {
    const C = MB.config;
    if (op === "all") {
      const allOn = C.OPS.every(function (o) { return this.state.settings.ops[o]; }, this);
      C.OPS.forEach(function (o) { this.state.settings.ops[o] = !allOn; }, this);
    } else {
      this.state.settings.ops[op] = !this.state.settings.ops[op];
    }
    C.OPS.forEach(function (o) {
      const btn = this.opButtons[o];
      this.refreshButtonColor(btn, this.state.settings.ops[o] ? 0x2a9d3f : 0x333366, this.state.settings.ops[o] ? 0x3ac24f : 0x444488);
    }, this);
    MB.audio.click();
  },

  refreshButtonColor: function (container, fill, over) {
    const g = container.list[0];
    const w = container._w;
    const h = container._h;
    g.clear();
    g.fillStyle(fill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.lineStyle(3, 0xffffff, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    container._fill = fill;
    container._over = over;
  },

  refreshDiff: function () {
    const C = MB.config;
    this.diffInfo.setText(C.DIFFICULTY_INFO[this.state.settings.difficulty]);
    C.DIFFICULTIES.forEach(function (d) {
      const on = this.state.settings.difficulty === d;
      this.refreshButtonColor(this.diffButtons[d], on ? 0x2a9d3f : 0x333366, on ? 0x3ac24f : 0x444488);
    }, this);
    MB.audio.click();
  },

  startMission: function () {
    const C = MB.config;
    const state = this.state;
    const anyOp = C.OPS.some(function (o) { return state.settings.ops[o]; });
    if (!anyOp) {
      C.OPS.forEach(function (o) { state.settings.ops[o] = true; });
    }
    state.pendingProblems = {};
    if (!state.enemyArmy || state.baseDestroyed) {
      MB.save.newMission(state);
    }
    MB.save.save(state);
    MB.audio.unlock();
    MB.audio.click();
    MB.sceneGo(this, "Base");
  },

  update: function () {}
});
