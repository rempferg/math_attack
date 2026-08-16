window.MB = window.MB || {};

MB.Scenes.Math = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Math() {
    Phaser.Scene.call(this, { key: "Math" });
  },

  init: function (data) {
    data = data || {};
    this.mode = data.mode || "tier";
    this.onExit = data.onExit || null;
    if (this.mode === "upg") {
      this.track = data.subject ? data.subject.replace("upg:", "") : (data.track || "damage");
      this.subject = "upg:" + this.track;
      this.band = "elite";
      this.chain = data.chain || 4;
      this.unit = null;
    } else {
      this.tier = data.subject || data.tier || "drone";
      this.subject = this.tier;
      this.band = MB.config.UNITS[this.tier].band;
      this.chain = 0;
      this.unit = MB.config.UNITS[this.tier];
    }
  },

  create: function () {
    const C = MB.config;
    this.state = MB.save.load();
    this.streak = 0;
    this.lock = false;
    this.particles = [];
    this.flash = null;

    this.add.rectangle(C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH, C.HEIGHT, 0x000000, 0.72);

    MB.ui.addPanel(this, C.WIDTH / 2, C.HEIGHT / 2, 620, 420, { fill: 0x111144, alpha: 0.97, border: 0x8899ff });

    if (this.mode === "upg") {
      const up = C.UPGRADES[this.track];
      const level = this.state.upgrades[this.track] || 0;
      const next = Math.round(up.perLevel * (level + 1) * 100);
      this.titleText = MB.ui.addText(this, C.WIDTH / 2, 70, "UPGRADE: " + up.name.toUpperCase(), { fontSize: "16px", color: "#ffd24d" });
      this.countText = MB.ui.addText(this, 200, 106, "Level " + (level + 1) + " of " + C.UPGRADE_LEVELS + " (next: +" + next + "%)", { fontSize: "10px", color: "#88aadd", origin: 0 });
      this.streakText = MB.ui.addText(this, 760, 106, "Chain: 0/" + this.chain, { fontSize: "11px", color: "#66c8ff", origin: 1 });
    } else {
      this.titleText = MB.ui.addText(this, C.WIDTH / 2, 70, "TRAIN " + this.unit.name.toUpperCase(), { fontSize: "16px", color: "#ffd24d" });
      this.countText = MB.ui.addText(this, 200, 106, "Fleet: \u00d7" + (this.state.army[this.tier] || 0), { fontSize: "11px", color: "#88aadd", origin: 0 });
      this.streakText = MB.ui.addText(this, 760, 106, "Streak: 0", { fontSize: "11px", color: "#66c8ff", origin: 1 });
    }

    this.problemText = MB.ui.addText(this, C.WIDTH / 2, 195, "", { fontSize: "38px", color: "#ffffff" });
    this.feedbackText = MB.ui.addText(this, C.WIDTH / 2, 452, "", { fontSize: "13px", color: "#88ff88" });

    MB.ui.addButton(this, C.WIDTH - 60, 30, 100, 34, "EXIT", {
      fill: 0x883333,
      fillOver: 0xaa4444,
      fontSize: "11px",
      onClick: function () {
        MB.audio.click();
        this.close();
      }.bind(this)
    });

    const answers = [];
    const aW = 210;
    const aH = 70;
    const positions = [[330, 265], [630, 265], [330, 355], [630, 355]];
    const colors = [0x2a5ab0, 0x2a7ab0, 0x2a5ab0, 0x2a7ab0];
    positions.forEach(function (pos, i) {
      const btn = MB.ui.addButton(this, pos[0], pos[1], aW, aH, "", {
        fill: colors[i],
        fillOver: 0x3f7de0,
        fontSize: "26px",
        onClick: (function () {
          this.answer(btn);
        }).bind(this)
      });
      answers.push(btn);
    }, this);
    this.answers = answers;

    this.loadProblem();
  },

  loadProblem: function () {
    const rec = this.state.pendingProblems[this.subject];
    if (rec && rec.text && rec.band === this.band && (this.state.settings.ops[rec.op] || false)) {
      this.problem = rec;
      if (this.mode === "upg") this.streak = rec.streak || 0;
    } else {
      this.problem = MB.math.makeProblem(this.band);
      this.problem.streak = this.streak;
      this.bufferProblem();
    }
    this.lock = false;
    this.renderProblem();
  },

  renderProblem: function () {
    this.problemText.setText(this.problem.text + " = ?");
    this.answers.forEach(function (btn, i) {
      btn.list[1].setText(String(this.problem.options[i]));
    }, this);
    this.feedbackText.setText("");
    if (this.mode === "upg") {
      this.streakText.setText("Chain: " + this.streak + "/" + this.chain);
    } else {
      this.streakText.setText("Streak: " + this.streak);
    }
  },

  bufferProblem: function () {
    const state = MB.save.load();
    const rec = {
      op: this.problem.op,
      band: this.problem.band,
      text: this.problem.text,
      answer: this.problem.answer,
      options: this.problem.options
    };
    if (this.mode === "upg") rec.streak = this.streak;
    state.pendingProblems[this.subject] = rec;
    MB.save.save(state);
    this.state = state;
  },

  clearPending: function () {
    const state = MB.save.load();
    delete state.pendingProblems[this.subject];
    MB.save.save(state);
    this.state = state;
  },

  answer: function (btn) {
    if (this.lock) return;
    this.lock = true;
    const idx = this.answers.indexOf(btn);
    const chosen = this.problem.options[idx];
    if (chosen === this.problem.answer) {
      this.clearPending();
      if (this.mode === "upg") {
        this.streak++;
        MB.audio.milestone(this.streak, this.chain);
        if (this.streak >= this.chain) {
          const state = MB.save.load();
          state.upgrades[this.track] = Math.min(MB.config.UPGRADE_LEVELS, (state.upgrades[this.track] || 0) + 1);
          MB.save.save(state);
          this.state = state;
          this.feedbackText.setColor("#ffd24d");
          this.feedbackText.setText("UPGRADE COMPLETE! " + MB.config.UPGRADES[this.track].name.toUpperCase() + "!");
          MB.audio.upgradeComplete();
          this.celebrate();
          this.time.delayedCall(1900, function () { this.close(); }, [], this);
          return;
        }
        this.feedbackText.setColor("#88ff88");
        this.feedbackText.setText(this.streak + "/" + this.chain + "! Keep going!");
        this.streakText.setText("Chain: " + this.streak + "/" + this.chain);
        this.streakText.setColor(this.streak >= 2 ? "#ffd24d" : "#66c8ff");
        this.time.delayedCall(450, this.newProblem, [], this);
      } else {
        MB.audio.correct();
        this.streak++;
        this.state = MB.save.load();
        this.state.army[this.tier] = (this.state.army[this.tier] || 0) + 1;
        MB.save.save(this.state);
        this.countText.setText("Fleet: \u00d7" + this.state.army[this.tier]);
        this.feedbackText.setColor("#88ff88");
        if (this.streak > 0 && this.streak % 5 === 0) {
          MB.audio.streak();
          this.feedbackText.setText("STREAK BONUS! " + this.streak + " in a row! +1 " + this.unit.name);
        } else {
          this.feedbackText.setText("Correct! +1 " + this.unit.name + "!");
        }
        this.streakText.setText("Streak: " + this.streak);
        this.streakText.setColor(this.streak >= 3 ? "#ffd24d" : "#66c8ff");
        this.time.delayedCall(450, this.newProblem, [], this);
      }
    } else {
      MB.audio.wrong();
      this.streak = 0;
      this.clearPending();
      this.feedbackText.setColor("#ff6666");
      this.feedbackText.setText("Oops! The answer was " + this.problem.answer + ". Chain reset!");
      this.streakText.setText(this.mode === "upg" ? "Chain: 0/" + this.chain : "Streak: 0");
      this.streakText.setColor("#66c8ff");
      this.time.delayedCall(900, this.newProblem, [], this);
    }
  },

  newProblem: function () {
    this.problem = MB.math.makeProblem(this.band);
    this.problem.streak = this.streak;
    this.bufferProblem();
    this.lock = false;
    this.renderProblem();
  },

  celebrate: function () {
    const C = MB.config;
    const cx = C.WIDTH / 2;
    const cy = 195;
    const colors = [0xffd24d, 0x66e0ff, 0xff6666, 0x88ff88];
    for (let i = 0; i < 24; i++) {
      const g = this.add.graphics();
      const ang = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
      const sp = 90 + Math.random() * 160;
      g.fillStyle(colors[i % 4], 1);
      g.fillCircle(0, 0, 2 + Math.random() * 2);
      g.setPosition(cx, cy);
      this.particles.push({ g: g, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1 });
    }
    this.flash = this.add.rectangle(cx, C.HEIGHT / 2, C.WIDTH, C.HEIGHT, 0xffffff, 0.35);
  },

  update: function (_time, dt) {
    const dtSec = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dtSec * 1.6;
      if (p.life <= 0) {
        p.g.destroy();
        this.particles.splice(i, 1);
        continue;
      }
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.g.setPosition(p.g.x + p.vx * dtSec, p.g.y + p.vy * dtSec);
      p.g.setAlpha(p.life);
    }
    if (this.flash) {
      this.flash.alpha -= dtSec * 1.2;
      if (this.flash.alpha <= 0) {
        this.flash.destroy();
        this.flash = null;
      }
    }
  },

  close: function () {
    if (this.mode === "upg") {
      this.scene.stop();
      this.scene.resume("Lab");
    } else {
      this.scene.stop();
      this.scene.resume("Base");
    }
    if (this.onExit) this.onExit();
  }
});
