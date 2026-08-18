window.MB = window.MB || {};

MB.config = (function () {
  "use strict";

  const WIDTH = 960;
  const HEIGHT = 540;

  const FONT = '"Press Start 2P", "Courier New", monospace';

  const OPS = ["add", "sub", "mul", "div"];
  const OP_LABELS = {
    add: "+",
    sub: "\u2212",
    mul: "\u00d7",
    div: ":"
  };
  const OP_NAMES = { add: "Addition", sub: "Subtraction", mul: "Multiplication", div: "Division" };

  const DIFFICULTIES = ["easy", "medium", "hard"];
  const DIFFICULTY_NAMES = { easy: "Easy", medium: "Medium", hard: "Hard" };
  const DIFFICULTY_INFO = {
    easy: "Small numbers. You can build Scout Drones.",
    medium: "Medium numbers. Unlocks Fighters.",
    hard: "Big numbers. Unlocks Cruisers and Dreadnoughts."
  };

  const BANDS = ["easy", "medium", "hard", "veryHard", "elite"];
  const BAND_NAMES = { easy: "Easy", medium: "Medium", hard: "Hard", veryHard: "Very Hard", elite: "Elite" };

  const NUM_RANGES = {
    add: { easy: 10, medium: 20, hard: 50, veryHard: 100, elite: 150 },
    sub: { easy: 10, medium: 20, hard: 50, veryHard: 100, elite: 150 },
    mul: { easy: 5, medium: 10, hard: 12, veryHard: 15, elite: 20 },
    div: { easy: 5, medium: 9, hard: 12, veryHard: 15, elite: 20 }
  };

  const UNITS = {
    drone: {
      id: "drone",
      name: "Scout Drone",
      band: "easy",
      hp: 20,
      damage: 5,
      speed: 120,
      fireRate: 850,
      range: 95,
      size: 10,
      color: 0x7cc8ff,
      desc: "Quick, cheap, weak."
    },
    fighter: {
      id: "fighter",
      name: "Fighter",
      band: "medium",
      hp: 45,
      damage: 11,
      speed: 135,
      fireRate: 750,
      range: 105,
      size: 13,
      color: 0x4dffd2,
      desc: "Fast striker."
    },
    cruiser: {
      id: "cruiser",
      name: "Cruiser",
      band: "hard",
      hp: 95,
      damage: 19,
      speed: 100,
      fireRate: 950,
      range: 120,
      size: 16,
      color: 0xb39dff,
      desc: "Heavy guns."
    },
    dreadnought: {
      id: "dreadnought",
      name: "Dreadnought",
      band: "veryHard",
      hp: 180,
      damage: 30,
      speed: 85,
      fireRate: 1100,
      range: 135,
      size: 19,
      color: 0xffd24d,
      desc: "Tank of the fleet."
    }
  };

  const TIER_ORDER = ["drone", "fighter", "cruiser", "dreadnought"];

  const CAP_TIERS = {
    easy: ["drone"],
    medium: ["drone", "fighter"],
    hard: ["drone", "fighter", "cruiser", "dreadnought"]
  };

  const ENEMY_UNITS = {
    grunt: { name: "Grunt", hp: 32, damage: 5, speed: 50, fireRate: 1000, range: 85, size: 11, color: 0x6dff6d },
    brute: { name: "Brute", hp: 85, damage: 13, speed: 42, fireRate: 1100, range: 95, size: 15, color: 0x4daf4d },
    queen: { name: "Queen", hp: 220, damage: 22, speed: 34, fireRate: 1400, range: 110, size: 19, color: 0xff7ad9 }
  };

  const ENEMY_ARMIES = {
    easy: { grunt: 3, brute: 0, queen: 0, baseHp: 200 },
    medium: { grunt: 5, brute: 2, queen: 0, baseHp: 350 },
    hard: { grunt: 8, brute: 4, queen: 1, baseHp: 650 }
  };

  const UPGRADE_ORDER = ["damage", "fireRate", "range"];
  const STAR_UPGRADE_ORDER = ["sniperLaser", "torpedoLauncher"];
  const UPGRADES = {
    damage: {
      id: "damage",
      name: "Damage Boost",
      perLevel: 0.2,
      chains: [4, 5, 6],
      desc: "All ships deal +20% damage per level",
      icon: "damage"
    },
    fireRate: {
      id: "fireRate",
      name: "Fire Rate Boost",
      perLevel: 0.1,
      chains: [4, 5, 6],
      desc: "Ships fire 10% faster per level",
      icon: "fireRate"
    },
    range: {
      id: "range",
      name: "Range Boost",
      perLevel: 0.12,
      chains: [4, 5, 6],
      desc: "Weapons reach 12% farther per level",
      icon: "range"
    },
    sniperLaser: {
      id: "sniperLaser",
      name: "Sniper Laser",
      unlockStars: 7500,
      beamDuration: 2000,
      beamTick: 200,
      chains: [5, 6, 7],
      levels: [
        { damage: 30, range: 350, cooldown: 12000 },
        { damage: 69, range: 500, cooldown: 9000 },
        { damage: 144, range: 480, cooldown: 9000 }
      ],
      desc: "Dreadnoughts fire a sustained beam that melts one target",
      icon: "sniperLaser"
    },
    torpedoLauncher: {
      id: "torpedoLauncher",
      name: "Torpedo Launcher",
      unlockStars: 50000,
      chains: [6, 7, 8],
      initialDelay: 4,
      levels: [
        { damage: 40, aoeRadius: 60, clusterRadius: 100, cooldown: 10000 },
        { damage: 40, aoeRadius: 70, clusterRadius: 130, cooldown: 8000 },
        { damage: 40, aoeRadius: 80, clusterRadius: 160, cooldown: 7000 }
      ],
      desc: "Cruisers fire homing torpedoes at enemy clusters",
      icon: "torpedoLauncher"
    }
  };
  const UPGRADE_LEVELS = 3;

  const SCORE_WEIGHTS = { grunt: 10, brute: 25, queen: 50 };

  return {
    WIDTH: WIDTH,
    HEIGHT: HEIGHT,
    FONT: FONT,
    OPS: OPS,
    OP_LABELS: OP_LABELS,
    OP_NAMES: OP_NAMES,
    DIFFICULTIES: DIFFICULTIES,
    DIFFICULTY_NAMES: DIFFICULTY_NAMES,
    DIFFICULTY_INFO: DIFFICULTY_INFO,
    BANDS: BANDS,
    BAND_NAMES: BAND_NAMES,
    NUM_RANGES: NUM_RANGES,
    UNITS: UNITS,
    TIER_ORDER: TIER_ORDER,
    CAP_TIERS: CAP_TIERS,
    ENEMY_UNITS: ENEMY_UNITS,
    ENEMY_ARMIES: ENEMY_ARMIES,
    UPGRADE_ORDER: UPGRADE_ORDER,
    STAR_UPGRADE_ORDER: STAR_UPGRADE_ORDER,
    UPGRADES: UPGRADES,
    UPGRADE_LEVELS: UPGRADE_LEVELS,
    SCORE_WEIGHTS: SCORE_WEIGHTS
  };
})();
