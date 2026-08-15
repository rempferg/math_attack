window.MB = window.MB || {};

MB.math = (function () {
  "use strict";

  const C = MB.config;

  function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeOne(op, band) {
    const ranges = C.NUM_RANGES[op];
    const cap = ranges[band] || ranges.medium;
    let a, b, answer, text;
    switch (op) {
      case "add":
        a = rnd(1, cap - 1);
        b = rnd(1, cap - a);
        answer = a + b;
        text = a + " + " + b;
        break;
      case "sub":
        a = rnd(2, cap);
        b = rnd(1, a);
        answer = a - b;
        text = a + " - " + b;
        break;
      case "mul":
        a = rnd(2, cap);
        b = rnd(2, cap);
        answer = a * b;
        text = a + " \u00d7 " + b;
        break;
      case "div":
        b = rnd(2, cap);
        answer = rnd(2, cap);
        a = b * answer;
        text = a + " \u00f7 " + b;
        break;
      default:
        a = rnd(1, 10);
        b = rnd(1, 10);
        answer = a + b;
        text = a + " + " + b;
    }
    return { op: op, band: band, text: text, answer: answer };
  }

  function randomOp() {
    const ops = [];
    const s = MB.save;
    const state = s.load();
    const enabled = state.settings.ops;
    C.OPS.forEach(function (op) { if (enabled[op]) ops.push(op); });
    if (ops.length === 0) return C.OPS[rnd(0, C.OPS.length - 1)];
    return ops[rnd(0, ops.length - 1)];
  }

  function pickAnswer(correct) {
    let opts = [];
    let guard = 0;
    while (opts.length < 3 && guard < 200) {
      guard++;
      const delta = rnd(1, Math.max(2, Math.ceil(Math.abs(correct) / 3 + 2)));
      const val = Math.random() < 0.5 ? correct + delta : correct - delta;
      if (val >= 0 && val !== correct && opts.indexOf(val) === -1) opts.push(val);
    }
    while (opts.length < 3) {
      const val = correct + opts.length + 2;
      if (opts.indexOf(val) === -1) opts.push(val);
    }
    opts.push(correct);
    for (let i = opts.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      const tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
    }
    return opts;
  }

  function makeProblem(band, opHint) {
    const op = opHint || randomOp();
    const p = makeOne(op, band || "easy");
    p.options = pickAnswer(p.answer);
    return p;
  }

  return { makeProblem: makeProblem, randomOp: randomOp };
})();
