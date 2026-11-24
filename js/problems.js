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

  function orderRanges(band) {
    return {
      add: Math.max(4, Math.min(C.NUM_RANGES.add[band] || C.NUM_RANGES.add.medium, 20)),
      mul: Math.max(2, Math.min(C.NUM_RANGES.mul[band] || C.NUM_RANGES.mul.medium, 20)),
      div: Math.max(2, Math.min(C.NUM_RANGES.div[band] || C.NUM_RANGES.div.medium, 20))
    };
  }

  // Order-of-operations problems use German notation: "·" for times and ":" for divide.
  function makeOrderProblem(band) {
    const r = orderRanges(band);
    const ra = r.add;
    const rm = r.mul;
    const rd = r.div;
    const half = Math.max(2, Math.floor(ra / 2));

    const templates = [
      function () {
        const a = rnd(1, ra);
        const b = rnd(2, rm);
        const c = rnd(2, rm);
        return { text: a + " + " + b + " \u00b7 " + c, answer: a + b * c };
      },
      function () {
        const a = rnd(2, rm);
        const b = rnd(2, rm);
        const c = rnd(1, ra);
        return { text: a + " \u00b7 " + b + " + " + c, answer: a * b + c };
      },
      function () {
        const a = rnd(2, rm);
        const b = rnd(2, rm);
        const c = rnd(1, Math.max(1, Math.min(ra, a * b - 1)));
        return { text: a + " \u00b7 " + b + " - " + c, answer: a * b - c };
      },
      function () {
        const c = rnd(2, rd);
        const q = rnd(1, rd);
        const a = rnd(1, ra);
        return { text: a + " + " + (c * q) + " : " + c, answer: a + q };
      },
      function () {
        const b = rnd(2, rd);
        const q = rnd(1, rd);
        const c = rnd(1, ra);
        return { text: (b * q) + " : " + b + " + " + c, answer: q + c };
      },
      function () {
        const a = rnd(1, half);
        const b = rnd(1, half);
        const c = rnd(2, rm);
        return { text: "(" + a + " + " + b + ") \u00b7 " + c, answer: (a + b) * c };
      },
      function () {
        const a = rnd(2, ra);
        const b = rnd(1, a - 1);
        const c = rnd(2, rm);
        return { text: "(" + a + " - " + b + ") \u00b7 " + c, answer: (a - b) * c };
      },
      function () {
        const a = rnd(2, rm);
        const b = rnd(1, half);
        const c = rnd(1, half);
        return { text: a + " \u00b7 (" + b + " + " + c + ")", answer: a * (b + c) };
      },
      function () {
        const c = rnd(2, rd);
        const q = rnd(1, rd);
        const s = c * q;
        const a = rnd(1, s - 1);
        const b = s - a;
        return { text: "(" + a + " + " + b + ") : " + c, answer: q };
      },
      function () {
        const b = rnd(1, half);
        const c = rnd(1, half);
        const s = b + c;
        const q = rnd(1, rd);
        return { text: (s * q) + " : (" + b + " + " + c + ")", answer: q };
      },
      function () {
        const a = rnd(2, rm);
        const b = rnd(2, rm);
        const c = rnd(2, rm);
        const d = rnd(2, rm);
        return { text: a + " \u00b7 " + b + " + " + c + " \u00b7 " + d, answer: a * b + c * d };
      },
      function () {
        const a = rnd(2, rm);
        const b = rnd(2, rm);
        const lhs = a * b;
        if (lhs < 6) return null;
        const c = rnd(2, Math.min(rm, Math.floor((lhs - 1) / 2)));
        const d = rnd(2, Math.max(2, Math.min(rm, Math.floor((lhs - 1) / c))));
        if (c * d >= lhs) return null;
        return { text: a + " \u00b7 " + b + " - " + c + " \u00b7 " + d, answer: lhs - c * d };
      }
    ];

    let p = null;
    for (let guard = 0; !p && guard < 50; guard++) {
      p = templates[rnd(0, templates.length - 1)]();
    }
    if (!p) {
      const a = rnd(1, ra);
      const b = rnd(2, rm);
      const c = rnd(2, rm);
      p = { text: a + " + " + b + " \u00b7 " + c, answer: a + b * c };
    }
    p.op = "order";
    p.band = band;
    p.options = pickAnswer(p);
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
    if (opHint === "order") return makeOrderProblem(band || "easy");
    const op = opHint || randomOp();
    const p = makeOne(op, band || "easy");
    p.options = pickAnswer(p);
    return p;
  }

  return { makeProblem: makeProblem, makeOrderProblem: makeOrderProblem, randomOp: randomOp };
})();
