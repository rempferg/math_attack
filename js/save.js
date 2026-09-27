window.MB = window.MB || {};

MB.save = (function () {
  "use strict";

  const KEY = "math-blaster-save-v1";
  const SCORE_KEY = "math-attack-score-v1";

  // TESTING ONLY (preview branch): on the first load, seed a 400k-star endgame
  // state (stars + enemy fleet) once, then stars and missions progress normally.
  // Set TEST_SEED to null to disable.
  const TEST_SEED = {
    score: 400000,
    difficulty: "hard",
    mission: 50,
    enemyBoost: 6.88,
    enemyArmy: { grunt: 57, brute: 28, queen: 17 },
    enemyBaseHp: 4472
  };

  function defaults() {
    return {
      version: 1,
      settings: {
        ops: { add: true, sub: true, mul: true, div: true, divR: true },
        difficulty: "easy",
        spelling: true
      },
      army: { drone: 0, fighter: 0, cruiser: 0, dreadnought: 0, carrier: 0 },
      battlesWon: 0,
      battlesLost: 0,
      enemiesDestroyed: 0,
      baseDestroyed: false,
      mission: 1,
      pendingProblems: {},
      upgrades: { damage: 0, fireRate: 0, range: 0, sniperLaser: 0, torpedoLauncher: 0, invisibility: 0, clusterMunitions: 0 },
      enemyArmy: null,
      enemyBoost: 1,
      enemyBaseHp: 0
    };
  }

  function load() {
    let state;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        state = defaults();
      } else {
        const data = JSON.parse(raw);
        const base = defaults();
        const dataSettings = data.settings || {};
        const mergedSettings = Object.assign({}, base.settings, dataSettings);
        mergedSettings.ops = Object.assign({}, base.settings.ops, dataSettings.ops || {});
        state = {
          version: base.version,
          settings: mergedSettings,
          army: Object.assign({}, base.army, data.army || {}),
          battlesWon: data.battlesWon || 0,
          battlesLost: data.battlesLost || 0,
          enemiesDestroyed: data.enemiesDestroyed || 0,
          baseDestroyed: !!data.baseDestroyed,
          mission: data.mission || 1,
          pendingProblems: (typeof data.pendingProblems === "object" && data.pendingProblems !== null) ? data.pendingProblems : {},
          upgrades: Object.assign({}, base.upgrades, data.upgrades || {}),
          enemyArmy: data.enemyArmy || null,
          enemyBoost: data.enemyBoost || 1,
          enemyBaseHp: data.enemyBaseHp || 0,
          testSeedV1: !!data.testSeedV1
        };
      }
    } catch (e) {
      state = defaults();
    }
    if (TEST_SEED && !state.testSeedV1) {
      state.testSeedV1 = true;
      state.settings.difficulty = TEST_SEED.difficulty;
      state.mission = TEST_SEED.mission;
      state.enemyBoost = TEST_SEED.enemyBoost;
      state.enemyArmy = Object.assign({}, TEST_SEED.enemyArmy);
      state.enemyBaseHp = TEST_SEED.enemyBaseHp;
      state.baseDestroyed = false;
      state.pendingProblems = {};
      scoreSet(TEST_SEED.score);
      save(state);
    }
    return state;
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // storage unavailable — ignore
    }
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      // ignore
    }
  }

  function newMission(state) {
    if (state.enemyArmy) {
      state.mission = (state.mission || 1) + 1;
    }
    const m = state.mission || 1;
    const boost = 1 + (m - 1) * 0.12;
    const army = MB.config.ENEMY_ARMIES[state.settings.difficulty];
    state.enemyBoost = boost;
    state.enemyArmy = {
      grunt: army.grunt + (m - 1),
      brute: army.brute + Math.floor((m - 1) / 2),
      queen: army.queen + Math.floor((m - 1) / 3)
    };
    state.enemyBaseHp = Math.round(army.baseHp * boost);
    state.baseDestroyed = false;
    return state;
  }

  function scoreLoad() {
    try {
      const n = parseInt(localStorage.getItem(SCORE_KEY), 10);
      return isNaN(n) || n < 0 ? 0 : n;
    } catch (e) {
      return 0;
    }
  }

  function scoreSet(n) {
    const total = Math.max(0, Math.floor(n));
    try {
      localStorage.setItem(SCORE_KEY, String(total));
    } catch (e) {
      // ignore
    }
    return total;
  }

  function scoreAdd(n) {
    const total = scoreLoad() + Math.max(0, Math.floor(n));
    try {
      localStorage.setItem(SCORE_KEY, String(total));
    } catch (e) {
      // ignore
    }
    return total;
  }

  return { defaults: defaults, load: load, save: save, clear: clear, newMission: newMission, scoreLoad: scoreLoad, scoreAdd: scoreAdd };
})();
