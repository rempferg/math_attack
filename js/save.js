window.MB = window.MB || {};

MB.save = (function () {
  "use strict";

  const KEY = "math-blaster-save-v1";

  function defaults() {
    return {
      version: 1,
      settings: {
        ops: { add: true, sub: true, mul: true, div: true },
        difficulty: "easy"
      },
      army: { drone: 0, fighter: 0, cruiser: 0, dreadnought: 0 },
      battlesWon: 0,
      battlesLost: 0,
      enemiesDestroyed: 0,
      baseDestroyed: false,
      mission: 1,
      enemyArmy: null,
      enemyBoost: 1,
      enemyBaseHp: 0
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const data = JSON.parse(raw);
      const base = defaults();
      const merged = {
        version: base.version,
        settings: Object.assign({}, base.settings, data.settings || {}),
        army: Object.assign({}, base.army, data.army || {}),
        battlesWon: data.battlesWon || 0,
        battlesLost: data.battlesLost || 0,
        enemiesDestroyed: data.enemiesDestroyed || 0,
        baseDestroyed: !!data.baseDestroyed,
        mission: data.mission || 1,
        enemyArmy: data.enemyArmy || null,
        enemyBoost: data.enemyBoost || 1,
        enemyBaseHp: data.enemyBaseHp || 0
      };
      return merged;
    } catch (e) {
      return defaults();
    }
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

  return { defaults: defaults, load: load, save: save, clear: clear };
})();
