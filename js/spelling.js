window.MB = window.MB || {};

MB.spelling = (function () {
  "use strict";

  const C = MB.config;
  const CACHE_KEY = "math-blaster-spelling-cache-v2";
  const CHILD_KEY = "math-blaster-spelling-child-v1";

  let loading = false;
  let retryTimer = null;
  let roundUsedUrl = false;
  let lastActivity = Date.now();
  let idleReinitDone = false;

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return null;
      const valid = data.filter(function (q) {
        return q && typeof q.sentence === "string" && typeof q.answer === "string" &&
          Array.isArray(q.misspellings) && q.misspellings.length === 3;
      });
      return valid.length > 0 ? valid : null;
    } catch (e) {
      return null;
    }
  }

  function saveCache(list) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    } catch (e) {
      // storage unavailable — ignore
    }
  }

  let items = loadCache();

  function validChildId(id) {
    return typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id);
  }

  function storedChildId() {
    try {
      const v = localStorage.getItem(CHILD_KEY);
      return validChildId(v) ? v : null;
    } catch (e) {
      return null;
    }
  }

  function saveChildId(id) {
    try {
      localStorage.setItem(CHILD_KEY, id);
    } catch (e) {
      // storage unavailable — ignore
    }
  }

  function urlChildId() {
    try {
      const v = new URLSearchParams(window.location.search).get("id");
      if (typeof v !== "string") return "";
      return v.trim();
    } catch (e) {
      return "";
    }
  }

  function fetchJSON(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.timeout = timeoutMs;
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error("HTTP " + xhr.status));
        }
      };
      xhr.onerror = function () { reject(new Error("network error")); };
      xhr.ontimeout = function () { reject(new Error("timeout")); };
      xhr.send();
    });
  }

  function buildItems(list) {
    const out = [];
    if (!Array.isArray(list)) return out;
    list.forEach(function (el) {
      if (!el || typeof el.word !== "string" || !el.word.length) return;
      if (typeof el.sentence !== "string" || !el.sentence.length) return;
      const wrong = Array.isArray(el.misspellings)
        ? el.misspellings.filter(function (m) { return typeof m === "string" && m.trim().length > 0; })
        : [];
      if (wrong.length < 3) return;
      const idx = el.sentence.indexOf(el.word);
      if (idx < 0) return;
      const gapLens = [el.word.length];
      wrong.forEach(function (m) { gapLens.push(m.length); });
      out.push({
        sentence: el.sentence.slice(0, idx) + " ".repeat(gapLens[Math.floor(Math.random() * gapLens.length)]) + el.sentence.slice(idx + el.word.length),
        answer: el.word,
        misspellings: wrong.slice(0, 3)
      });
    });
    return out;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function attemptRound(triesLeft, target) {
    let id, fromUrl;
    if (target) {
      id = target.id;
      fromUrl = target.fromUrl;
    } else {
      if (!roundUsedUrl && validChildId(urlChildId())) {
        id = urlChildId();
        fromUrl = true;
        roundUsedUrl = true;
      } else {
        id = storedChildId();
        fromUrl = false;
      }
      if (!id) {
        loading = false;
        return;
      }
      loading = true;
    }
    const url = C.SPELLING_URL + encodeURIComponent(id) + "?limit=" + C.SPELLING_LIMIT;
    fetchJSON(url, C.SPELLING_TIMEOUT_MS).then(function (list) {
      loading = false;
      saveChildId(id);
      const built = buildItems(list);
      if (built.length > 0) {
        items = built;
        saveCache(built);
      }
    }).catch(function () {
      if (triesLeft > 1) {
        attemptRound(triesLeft - 1, { id: id, fromUrl: fromUrl });
        return;
      }
      if (fromUrl) {
        const stored = storedChildId();
        if (stored && stored !== id) {
          attemptRound(C.SPELLING_TRIES); // URL id rejected — fall back to stored id
          return;
        }
      }
      loading = false;
      scheduleRetry();
    });
  }

  function scheduleRetry() {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(function () {
      retryTimer = null;
      init();
    }, C.SPELLING_RETRY_DELAY_MS);
  }

  function init() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (loading) return;
    roundUsedUrl = false;
    lastActivity = Date.now();
    idleReinitDone = false;
    attemptRound(C.SPELLING_TRIES);
  }

  function markActivity() {
    lastActivity = Date.now();
    idleReinitDone = false;
  }

  ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"].forEach(function (evt) {
    window.addEventListener(evt, markActivity, true);
  });

  setInterval(function () {
    if (!idleReinitDone && Date.now() - lastActivity >= C.SPELLING_IDLE_MS) {
      idleReinitDone = true;
      init();
    }
  }, 30000);

  function isReady() {
    return !!(items && items.length > 0);
  }

  function pick() {
    if (!isReady()) return null;
    const q = items[Math.floor(Math.random() * items.length)];
    const options = shuffle([q.answer].concat(q.misspellings.slice()));
    return { spelling: true, sentence: q.sentence, answer: q.answer, options: options };
  }

  return { init: init, isReady: isReady, pick: pick };
})();
