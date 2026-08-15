window.MB = window.MB || {};

MB.Scenes.Math = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Math() {
    Phaser.Scene.call(this, { key: "Math" });
  },

  init: function (data) {
    this.tier = data.tier || "drone";
  },

  create: function () {
    const C = MB.config;
    this.state = MB.save.load();
    this.unit = C.UNITS[this.tier];
    this.streak = 0;
    this.lock = false;

    this.add.rectangle(C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH, C.HEIGHT, 0x000000, 0.72);

    MB.ui.addPanel(this, C.WIDTH / 2, C.HEIGHT / 2, 620, 420, { fill: 0x111144, alpha: 0.97, border: 0x8899ff });

    this.titleText = MB.ui.addText(this, C.WIDTH / 2, 70, "TRAIN " + this.unit.name.toUpperCase(), { fontSize: "16px", color: "#ffd24d" });
    this.countText = MB.ui.addText(this, 200, 106, "Fleet: \u00d7" + (this.state.army[this.tier] || 0), { fontSize: "11px", color: "#88aadd", origin: 0 });
    this.streakText = MB.ui.addText(this, 760, 106, "Streak: 0", { fontSize: "11px", color: "#66c8ff", origin: 1 });

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

    this.newProblem();
  },

  newProblem: function () {
    this.lock = false;
    const problem = MB.math.makeProblem(this.unit.band);
    this.problem = problem;
    this.problemText.setText(problem.text + " = ?");
    this.answers.forEach(function (btn, i) {
      btn.list[1].setText(String(problem.options[i]));
    }, this);
    this.feedbackText.setText("");
  },

  answer: function (btn) {
    if (this.lock) return;
    this.lock = true;
    const idx = this.answers.indexOf(btn);
    const chosen = this.problem.options[idx];
    if (chosen === this.problem.answer) {
      MB.audio.correct();
      this.state = MB.save.load();
      this.state.army[this.tier] = (this.state.army[this.tier] || 0) + 1;
      MB.save.save(this.state);
      this.streak++;
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
    } else {
      MB.audio.wrong();
      this.streak = 0;
      this.streakText.setText("Streak: 0");
      this.streakText.setColor("#66c8ff");
      this.feedbackText.setColor("#ff6666");
      this.feedbackText.setText("Oops! The answer was " + this.problem.answer);
      this.time.delayedCall(900, this.newProblem, [], this);
    }
  },

  close: function () {
    this.scene.stop();
    this.scene.resume("Base");
  }
});
