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
    const p = { op: op, band: band };
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
        text = a + " \u00b7 " + b;
        break;
      case "div":
        b = rnd(2, cap);
        answer = rnd(2, cap);
        a = b * answer;
        text = a + " : " + b;
        break;
      case "divR":
        b = rnd(2, cap);
        p.b = b;
        p.q = rnd(2, cap);
        p.r = rnd(1, b - 1);
        a = b * p.q + p.r;
        answer = p.q + " R " + p.r;
        text = a + " : " + b;
        break;
      default:
        a = rnd(1, 10);
        b = rnd(1, 10);
        answer = a + b;
        text = a + " + " + b;
    }
    p.text = text;
    p.answer = answer;
    return p;
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

  function pickAnswer(p) {
    let opts = [];
    let guard = 0;
    if (p.op === "divR") {
      while (opts.length < 3 && guard < 200) {
        guard++;
        const dq = rnd(1, Math.max(2, Math.ceil(Math.abs(p.q) / 3 + 2)));
        const nq = p.q + (Math.random() < 0.5 ? -dq : dq);
        if (nq < 1) continue;
        const dr = rnd(1, Math.max(2, Math.ceil(p.b / 3 + 2)));
        let nr = p.r + (Math.random() < 0.5 ? -dr : dr);
        nr = ((nr % p.b) + p.b) % p.b;
        if (nq === p.q && nr === p.r) continue;
        const val = nq + " R " + nr;
        if (opts.indexOf(val) === -1) opts.push(val);
      }
      while (opts.length < 3) {
        const val = (p.q + opts.length + 2) + " R 0";
        if (opts.indexOf(val) === -1) opts.push(val);
      }
      opts.push(p.answer);
    } else {
      while (opts.length < 3 && guard < 200) {
        guard++;
        const delta = rnd(1, Math.max(2, Math.ceil(Math.abs(p.answer) / 3 + 2)));
        const val = Math.random() < 0.5 ? p.answer - delta : p.answer + delta;
        if (val >= 0 && val !== p.answer && opts.indexOf(val) === -1) opts.push(val);
      }
      while (opts.length < 3) {
        const val = p.answer + opts.length + 2;
        if (opts.indexOf(val) === -1) opts.push(val);
      }
      opts.push(p.answer);
    }
    for (let i = opts.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      const tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
    }
    return opts;
  }

  function makeProblem(band, opHint) {
    const op = opHint || randomOp();
    const p = makeOne(op, band || "easy");
    p.options = pickAnswer(p);
    return p;
  }

  return { makeProblem: makeProblem, randomOp: randomOp };
})();
