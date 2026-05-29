const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const WORLD_SIZE_PRESETS = {
  small: { label: "Small", cols: 30, rows: 80 },
  medium: { label: "Medium", cols: 50, rows: 160 },
  large: { label: "Large", cols: 80, rows: 300 },
};
const selectedWorldSize = localStorage.getItem("driftMinerWorldSize") ?? "large";
const activeWorldSize = WORLD_SIZE_PRESETS[selectedWorldSize] ? selectedWorldSize : "large";
const worldSize = WORLD_SIZE_PRESETS[activeWorldSize];
const TILE = 32;
const COLS = worldSize.cols;
const ROWS = worldSize.rows;
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
const CAMERA_ZOOM_LEVELS = [16, 24, 40, COLS];
const SURFACE_ROWS = 4;
const MIN_RELIC_DEPTH = 8;
const BASE_CENTER_TILE_X = Math.floor(COLS / 2);
const BASE_TILE_Y = SURFACE_ROWS - 1;
const BASE_MIN_TILE_X = BASE_CENTER_TILE_X - 4;
const BASE_MAX_TILE_X = BASE_CENTER_TILE_X + 3;
const BASE_MAX_TILE_Y = SURFACE_ROWS - 1;
const LEVEL_ONE_SPEED = 56;
const LEVEL_ONE_DRILL_DAMAGE = 0.75;
const TREASURE_CARRY_SPEED_MULTIPLIER = 0.25;
const HULL_MAX_PER_UPGRADE = 2;
const HULL_HARDENING_REDUCTION_PER_LEVEL = 0.06;
const MAX_HULL_HARDENING_REDUCTION = 0.6;

const keys = new Set();
const GAMEPAD_DEADZONE = 0.22;
const gamepadState = {
  index: null,
  connected: false,
  previousButtons: [],
  axes: { x: 0, y: 0 },
  blasterHeld: false,
};
const resources = {
  copper: 0,
  silver: 0,
  gold: 0,
  diamond: 0,
  alienCarapace: 0,
};

const cargo = {
  copper: 0,
  silver: 0,
  gold: 0,
  diamond: 0,
  alienCarapace: 0,
};

const pickups = [];
const flares = [];
const blasts = [];
const explosions = [];
const feedbackEffects = [];
const radiationBursts = [];
const swordArcs = [];
const monsters = [];
const specialRooms = [];
const revealedTiles = new Set();
const treasureChest = {
  x: 0,
  y: 0,
  tileX: 0,
  tileY: 0,
  placed: false,
  carried: false,
  delivered: false,
  hover: false,
  instructionsShown: false,
  instructionsDismissed: false,
};
const base = {
  health: 200,
  maxHealth: 200,
};
const idolStatue = {
  carried: false,
  delivered: false,
};

const OPEN_VISIBILITY_RADIUS = 1;
const FLARE_VISIBILITY_RADIUS = 7;
const MAX_UPGRADE_LEVEL = 10;
const MAX_RELIC_LEVEL = 4;
const MONSTER_SPAWN_INTERVAL = 100;
const MIN_MONSTER_SPAWN_INTERVAL = 60;
const MONSTER_SPAWN_INTERVAL_STEP = 2;
const MAX_MONSTERS = 4;
const MONSTER_ATTACK_COOLDOWN = 1.15;
const MONSTER_REPATH_INTERVAL = 0.45;
const MONSTER_MAX_PROGRESS_LEVEL = 6;
const MONSTER_LEVEL_DEPTH_THRESHOLDS = [0, 0.15, 0.3, 0.45, 0.6, 0.75];
const MONSTER_LEVEL_6_TIME_BY_WORLD = {
  small: 30 * 60,
  medium: 45 * 60,
  large: 60 * 60,
};
const MONSTER_BASE_HP = 14;
const MONSTER_HP_PER_LEVEL = 11;
const MONSTER_BASE_ATTACK_DAMAGE = 5;
const MONSTER_ATTACK_DAMAGE_PER_LEVEL = 2;
const BASE_MONSTER_DAMAGE_REFERENCE_LEVEL = 6;
const BASE_MONSTER_REFERENCE_DESTROY_TIME = 60;
const BASE_MONSTER_DAMAGE_LEVEL_SCALE = 0.16;
const MONSTER_COMPANION_AGGRO_RADIUS = TILE * 6;
const HELPER_RADIUS = 10;
const HELPER_SPEED_MULTIPLIER = 0.25;
const HELPER_FEAR_RADIUS = TILE * 7;
const HELPER_FLEE_SPEED_MULTIPLIER = 0.55;
const BLASTER_MONSTER_DAMAGE_MULTIPLIER = 1.4;
const BLASTER_BLOCK_DAMAGE_MULTIPLIER = 0.1;
const RADIATION_TICK_INTERVAL = 0.1;
const RADIATION_RADIUS = TILE * 3.2;
const RADIATION_BURST_LIFE = 0.7;
const HULL_BREACH_COOLDOWN = 10;
const ROCKET_DAMAGE = LEVEL_ONE_DRILL_DAMAGE * 18;
const ROCKET_MONSTER_DAMAGE = LEVEL_ONE_DRILL_DAMAGE * 45;
const MAGNET_RADIUS = TILE * 8;
const MAGNET_PULL_SPEED = 72;
const SEGMENT_SPAWN_CHANCE = 0.009;
const MAX_HULL_UPGRADE_HEALTH = 125;
const HULL_UPGRADE_ROOM_BONUS = 25;
const BASE_HEAL_RATE = 0.02;
const BASE_REPAIR_CARAPACE_COST = 2;
const BASE_REPAIR_AMOUNT = 50;
const HEALING_SPRING_RATE = BASE_HEAL_RATE;
const POISON_ROOM_TICK_INTERVAL = 10;
const POISON_ROOM_HULL_DAMAGE = 1;
const POISON_ROOM_MONSTER_TICK_INTERVAL = RADIATION_TICK_INTERVAL;
const POISON_ROOM_MONSTER_DAMAGE = LEVEL_ONE_DRILL_DAMAGE;
const VEIN_ROOM_SPAWN_INTERVAL = 50;
const IDOL_BOULDER_DAMAGE = 70;
const ROOM_DEFS = {
  A: {
    minWorld: "small",
    minY: SURFACE_ROWS + 40,
    maxY: SURFACE_ROWS + 80,
    width: 3,
    height: 3,
    kind: "monster",
    contents: "quick monster",
    description: "Something fast and vicious is waiting in this cramped passage.",
  },
  B: {
    minWorld: "small",
    width: 3,
    height: 3,
    kind: "spring",
    title: "Healing Spring",
    contents: "healing spring",
    description: "Clear mineral water glows from below, humming softly against the hull.",
  },
  C: {
    minWorld: "small",
    width: 3,
    height: 3,
    kind: "hullUpgrade",
    title: "Hull Reinforcement",
    contents: "hull upgrade",
    description: "You find a slick alien gel and apply it to the drill housing. Somehow, the hull feels more durable.",
  },
  D: { minWorld: "small", width: 3, height: 3, kind: "vein", resource: "gold", title: "Gold Vein", contents: "gold vein", description: "Gold seeps from the walls in slow, glittering beads." },
  E: { minWorld: "medium", width: 3, height: 3, kind: "vein", resource: "diamond", title: "Diamond Vein", contents: "diamond vein", description: "Cold blue crystal growths crackle in the stone." },
  F: { minWorld: "medium", width: 3, height: 3, kind: "monsterSpawner", title: "Monster Spawn", contents: "monster spawn", description: "The floor pulses like a heartbeat. Monsters will appear here with the regular monster timer." },
  G: { minWorld: "medium", minY: SURFACE_ROWS + 80, width: 3, height: 3, kind: "teleporter", title: "Teleporter", contents: "teleporter", description: "A humming field folds around the miner and snaps you back to base." },
  H: { minWorld: "large", width: 3, height: 3, kind: "loot", contents: "rare pile", description: "A hidden cache of rare resources is tucked into this open pocket." },
  I: { minWorld: "large", width: 3, height: 3, kind: "loot", contents: "rare pile", description: "A hidden cache of rare resources is tucked into this open pocket." },
  J: { minWorld: "large", width: 3, height: 3, kind: "loot", contents: "rare pile", description: "A hidden cache of rare resources is tucked into this open pocket." },
  K: { minWorld: "small", minY: SURFACE_ROWS + 40, width: 3, height: 3, kind: "alarm", title: "Warning System", contents: "alarm", description: "An ancient alarm shrieks through the mine. Five stronger monsters answer from somewhere in the dark." },
  L: { minWorld: "small", minY: SURFACE_ROWS + 40, width: 3, height: 3, kind: "idol", title: "Idol Room", contents: "idol statue", description: "A statue in the middle of the room looks exactly like you. It might be extremely valuable." },
  M: { minWorld: "small", minY: SURFACE_ROWS + 40, width: 3, height: 3, kind: "vein", resource: "copper", title: "Copper Vein", contents: "copper vein", description: "Copper knots push through the room's walls." },
  N: { minWorld: "small", minY: SURFACE_ROWS + 40, width: 3, height: 3, kind: "vein", resource: "silver", title: "Silver Vein", contents: "silver vein", description: "Silver threads shimmer across the stone." },
  O: {
    minWorld: "small",
    minY: Math.floor(ROWS * 0.5),
    width: 3,
    height: 3,
    kind: "monster",
    contents: "level 7 monsters",
    description: "This long chamber feels dangerous. Heavy movement echoes nearby.",
  },
  P: {
    minWorld: "small",
    minY: SURFACE_ROWS + 25,
    width: 3,
    height: 3,
    kind: "poison",
    title: "Poison Gas",
    contents: "poison gas",
    description: "Poison gas hangs over alien remains. Exposure causes lingering hull damage, and monsters passing through it sizzle under radiation-like burns.",
  },
  Z: {
    minWorld: "small",
    minY: Math.floor(ROWS * 0.75),
    width: 3,
    height: 3,
    kind: "treasure",
    title: "Treasure Room",
    contents: "treasure chest",
    description: "The ancient treasure rests here. Bring it back to base.",
  },
};

const resourceColors = {
  copper: "#cf7a43",
  silver: "#cad4da",
  gold: "#f2c45b",
  diamond: "#86f0ff",
  alienCarapace: "#b7ff6d",
};

const resourceNames = {
  copper: "Copper",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
  alienCarapace: "Alien Carapace",
};

const blockDefs = [
  { biome: "Topsoil", color: "#6c5640", hp: 2, depth: 0 },
  { biome: "Claystone", color: "#845f48", hp: 5, depth: 14 },
  { biome: "Basalt", color: "#4b4e57", hp: 9, depth: 30 },
  { biome: "Crystal Vein", color: "#334d65", hp: 15, depth: 52 },
];

const oreDefs = [
  { type: "copper", color: "#cf7a43", minDepth: 5, veinChance: 0.015, minVein: 2, maxVein: 6 },
  { type: "silver", color: "#cad4da", minDepth: 14, veinChance: 0.01, minVein: 1, maxVein: 4 },
  { type: "gold", color: "#f2c45b", minDepth: 24, veinChance: 0.007, minVein: 1, maxVein: 3 },
  { type: "diamond", color: "#86f0ff", minDepth: 43, veinChance: 0.004, minVein: 1, maxVein: 3 },
];

const relicDefs = {
  impact: {
    label: "Impact Drill",
    color: "#ffdf74",
    duration: 15,
    cooldown: 120,
  },
  speed: {
    label: "Speed Burst",
    color: "#82f5ff",
    duration: 30,
    cooldown: 120,
  },
  flare: {
    label: "Flare",
    color: "#ff6a48",
    duration: 30,
    cooldown: 120,
  },
  blaster: {
    label: "Blaster",
    color: "#b7ff6d",
  },
  bomb: {
    label: "Bomb",
    color: "#ff8a3d",
    duration: 0,
    cooldown: 120,
  },
  mouse: {
    label: "Mouse",
    color: "#d8c6a4",
  },
  dog: {
    label: "Dog",
    color: "#c98b5c",
  },
  radiation: {
    label: "Radiation",
    color: "#9dff5b",
    duration: 6,
    cooldown: 120,
  },
  rocket: {
    label: "Rocket Launcher",
    color: "#ff5f45",
    duration: 0,
    cooldown: 120,
  },
  magnet: {
    label: "Magnet",
    color: "#b474ff",
    duration: 20,
    cooldown: 120,
  },
  thirdEye: {
    label: "3rd Eye",
    color: "#c8a8ff",
  },
  laserSword: {
    label: "Laser Sword",
    color: "#ff7de9",
    cooldown: 120,
  },
  converter: {
    label: "Resource Converter",
    color: "#68d6c7",
    cooldown: 120,
  },
};

const upgradeDefs = {
  power: {
    label: "Drill Power",
    description: "Increases the power of the drill to dig blocks faster.",
    recipe: (level) => ({
      copper: scaledCopperCost(level, 3),
      silver: Math.max(0, level - 1) + Math.max(0, level - 5) + Math.max(0, level - 6),
      gold: Math.max(0, level - 3) + Math.max(0, level - 7) + Math.max(0, level - 6),
      diamond: Math.max(0, level - 5) + Math.floor(Math.max(0, level - 8) / 2) + Math.floor(Math.max(0, level - 6) / 2),
    }),
  },
  speed: {
    label: "Thruster Speed",
    description: "Increases your movement speed while mining and hauling resources.",
    recipe: (level) => ({
      copper: scaledCopperCost(level, 3),
      silver: Math.max(0, level - 1) * 2 + Math.max(0, level - 5) + Math.max(0, level - 6),
      gold: Math.max(0, level - 4) + Math.max(0, level - 7) + Math.max(0, level - 6),
      diamond: Math.max(0, level - 6) + Math.floor(Math.max(0, level - 9) / 2) + Math.floor(Math.max(0, level - 6) / 2),
    }),
  },
  capacity: {
    label: "Cargo Bay",
    description: "Increases how many resources you can carry before returning to base.",
    recipe: (level) => ({
      copper: scaledCopperCost(level, 4),
      silver: Math.max(0, level - 1) + Math.max(0, level - 5) + Math.max(0, level - 6),
      gold: Math.max(0, level - 3) + Math.max(0, level - 7) + Math.max(0, level - 6),
      diamond: Math.max(0, level - 5) + Math.floor(Math.max(0, level - 8) / 2) + Math.floor(Math.max(0, level - 6) / 2),
    }),
  },
  hardening: {
    label: "Hull Hardening",
    description: "Reduces damage taken from monster attacks.",
    recipe: (level) => ({
      copper: scaledCopperCost(level, 3),
      silver: Math.max(0, level - 2) + Math.max(0, level - 6),
      gold: Math.max(0, level - 5) + Math.max(0, level - 8),
      diamond: Math.max(0, level - 7),
    }),
  },
};
const baseRepairDescription = "Spends Alien Carapace to restore base HP.";

const relicDescriptions = {
  impact: "Provides extra power for your drill for a period of time. Cooldown after use.",
  speed: "Temporarily boosts your movement speed. Cooldown after use.",
  flare: "Places a bright flare that reveals nearby dark tiles for a period of time.",
  blaster: "Fires energy shots that damage monsters and chip away at blocks.",
  bomb: "Detonates a stronger short-range blast that clears nearby blocks and scales sharply with upgrades.",
  mouse: "Summons a helper that digs nearby visible blocks on its own.",
  dog: "Summons a helper that gathers dropped resources and brings them back to base.",
  radiation: "Creates a damaging radiation field around you for a short time.",
  rocket: "Launches a rocket that explodes on impact.",
  magnet: "Creates a resonating field around you that pulls nearby dropped resources toward the miner.",
  thirdEye: "Permanently improves how much open space is revealed around you.",
  laserSword: "Swings a sweeping blade that damages monsters and blocks it overlaps.",
  converter: "Converts stored resources into rarer materials while you are at base.",
};

let relicToastTimer = 0;
let roomToastTimer = 0;
let audioContext = null;
let digSoundBuffer = null;
let digSoundLoading = null;
let digSoundOffsets = [];
let lastDigSoundAt = 0;
let lastMonsterScreamAt = 0;
let lastMonsterDeathScreamAt = 0;

function scaledCopperCost(level, earlyMultiplier) {
  const peakLevel = Math.min(level, 6);
  const peakCost = Math.ceil(peakLevel * earlyMultiplier + Math.max(0, peakLevel - 5) * Math.max(1, earlyMultiplier - 2) * 0.6);
  if (level <= 6) return peakCost;
  const lateReduction = Math.max(0, level - 6) * Math.max(2, earlyMultiplier);
  return Math.max(earlyMultiplier * 2, peakCost - lateReduction);
}

let carried = 0;
let messageTimer = 0;
let elapsedTime = 0;
let deepestMinerDepth = 0;
let healingFeedbackTimer = 0;
let monsterSpawnTimer = MONSTER_SPAWN_INTERVAL;
let monsterSpawnInterval = MONSTER_SPAWN_INTERVAL;
let debugMode = false;
let gameStarted = false;
let gamePaused = false;
let gameOver = false;
let finalGameOver = false;
let gameWon = false;
let gameOverTimer = 0;
let baseAttackWarningActive = false;
let cameraZoomIndex = 0;
let lastTime = performance.now();
const camera = { x: 0, y: 0 };
const relics = {
  impact: { unlocked: false, active: 0, cooldown: 0 },
  speed: { unlocked: false, active: 0, cooldown: 0 },
  flare: { unlocked: false, active: 0, cooldown: 0 },
  blaster: { unlocked: false, charge: 100, shotCooldown: 0, overheat: 0 },
  bomb: { unlocked: false, active: 0, cooldown: 0 },
  mouse: { unlocked: false },
  dog: { unlocked: false },
  radiation: { unlocked: false, active: 0, cooldown: 0, tick: 0 },
  rocket: { unlocked: false, active: 0, cooldown: 0 },
  magnet: { unlocked: false, active: 0, cooldown: 0 },
  thirdEye: { unlocked: false },
  laserSword: { unlocked: false, cooldown: 0, swings: 5 },
  converter: { unlocked: false, cooldown: 0 },
};
for (const relic of Object.values(relics)) relic.level = 1;
const mouseHelper = {
  x: BASE_CENTER_TILE_X * TILE - 24,
  y: 64,
  target: null,
  path: [],
  mode: "idle",
  drillCooldown: 0,
  searchCooldown: 0,
  stuckTimer: 0,
  lastX: BASE_CENTER_TILE_X * TILE - 24,
  lastY: 64,
  health: 12,
  maxHealth: 12,
  initialized: false,
};
const dogHelper = {
  x: BASE_CENTER_TILE_X * TILE + 24,
  y: 64,
  target: null,
  path: [],
  mode: "idle",
  cargo: {
    copper: 0,
    silver: 0,
    gold: 0,
    diamond: 0,
    alienCarapace: 0,
  },
  carried: 0,
  maxCarry: 5,
  health: 16,
  maxHealth: 16,
  initialized: false,
};

const miner = {
  x: BASE_CENTER_TILE_X * TILE,
  y: 64,
  radius: 9,
  vx: 0,
  vy: 0,
  speed: LEVEL_ONE_SPEED,
  power: LEVEL_ONE_DRILL_DAMAGE,
  drillCooldown: 0,
  facingX: 1,
  facingY: 0,
  capacity: 3,
  health: 100,
  maxHealth: 100,
  repairs: 0,
  poisoned: false,
  poisonTimer: 0,
  upgrades: {
    power: 0,
    speed: 0,
    capacity: 0,
    hardening: 0,
  },
};

const world = Array.from({ length: ROWS }, (_, y) =>
  Array.from({ length: COLS }, (_, x) => createTile(x, y)),
);
generateOreVeins();
generateRelics();
generateWorldSegments();
revealAround(BASE_CENTER_TILE_X, BASE_TILE_Y, getOpenRevealRadius());

function createTile(x, y) {
  if (y < SURFACE_ROWS) {
    if (isBaseTile(x, y)) return null;
    return createUndiggableSurfaceTile();
  }
  const definition = [...blockDefs].reverse().find((block) => y >= block.depth) ?? blockDefs[0];
  const tile = {
    hp: definition.hp + Math.floor(Math.random() * 2),
    maxHp: definition.hp,
    color: definition.color,
    biome: definition.biome,
    ore: null,
    relic: null,
    unbreakable: false,
  };

  if (x < 2 || x > COLS - 3) tile.hp *= 2;
  return tile;
}

function createUndiggableSurfaceTile() {
  return {
    hp: Infinity,
    maxHp: Infinity,
    color: "#1d2227",
    biome: "Sealed Surface",
    ore: null,
    relic: null,
    unbreakable: true,
  };
}

function generateRelics() {
  blockDefs.forEach((zone, index) => {
    const minY = Math.max(SURFACE_ROWS + MIN_RELIC_DEPTH, zone.depth);
    const maxY = (blockDefs[index + 1]?.depth ?? ROWS) - 1;
    for (let i = 0; i < 2; i++) {
      placeRelicInZone(minY, maxY);
    }
  });
}

function placeRelicInZone(minY, maxY) {
  for (let attempt = 0; attempt < 120; attempt++) {
    const x = 2 + Math.floor(Math.random() * (COLS - 4));
    const y = minY + Math.floor(Math.random() * Math.max(1, maxY - minY + 1));
    const tile = world[y]?.[x];
    if (!tile || tile.ore || tile.relic) continue;
    tile.relic = true;
    tile.hp = tile.maxHp * 10;
    tile.maxHp = tile.hp;
    return;
  }
}

function generateOreVeins() {
  for (let y = SURFACE_ROWS; y < ROWS; y++) {
    for (let x = 2; x < COLS - 2; x++) {
      const ore = chooseOreForVein(y);
      if (!ore) continue;
      growOreVein(x, y, ore, getVeinSize(ore));
    }
  }
}

function chooseOreForVein(y) {
  for (const ore of [...oreDefs].reverse()) {
    if (y >= ore.minDepth && Math.random() < getOreVeinChance(ore, y)) return ore;
  }
  return null;
}

function getOreVeinChance(ore, y) {
  const depthPastStart = Math.max(0, y - ore.minDepth);
  const deepProgress = clamp(depthPastStart / 90, 0, 1);
  const multipliers = {
    copper: Math.max(0.18, 1 - deepProgress * 0.82),
    silver: 1 + deepProgress * 0.75,
    gold: 1 + deepProgress * 1.15,
    diamond: 1 + deepProgress * 1.6,
  };
  return ore.veinChance * (multipliers[ore.type] ?? 1);
}

function getVeinSize(ore) {
  return ore.minVein + Math.floor(Math.random() * (ore.maxVein - ore.minVein + 1));
}

function growOreVein(startX, startY, ore, size) {
  const frontier = [{ x: startX, y: startY }];
  const placed = new Set();

  while (frontier.length > 0 && placed.size < size) {
    const index = Math.floor(Math.random() * frontier.length);
    const current = frontier.splice(index, 1)[0];
    const key = `${current.x},${current.y}`;
    if (placed.has(key)) continue;

    const tile = world[current.y]?.[current.x];
    if (!tile || tile.ore || current.y < ore.minDepth) continue;
    if (touchesMatchingOre(current.x, current.y, ore.type, placed)) continue;

    tile.ore = { ...ore, yield: 1 + Math.floor(Math.random() * 2) };
    tile.hp = Math.round(tile.hp * 1.22);
    placed.add(key);

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ].sort(() => Math.random() - 0.5);

    frontier.push(...neighbors);
  }
}

function touchesMatchingOre(x, y, oreType, placed) {
  const neighbors = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];

  return neighbors.some((neighbor) => {
    const key = `${neighbor.x},${neighbor.y}`;
    if (placed.has(key)) return false;
    return world[neighbor.y]?.[neighbor.x]?.ore?.type === oreType;
  });
}

function generateWorldSegments() {
  const segmentCount = Math.max(2, Math.floor((COLS * ROWS * SEGMENT_SPAWN_CHANCE) / 10));
  const openCount = Math.max(2, Math.floor(segmentCount * 0.52));
  const unbreakableCount = Math.max(1, segmentCount - openCount);
  const roomLabels = getSpecialRoomLabels();

  for (let i = 0; i < unbreakableCount; i++) {
    growWorldSegment(12, 38, placeUnbreakableTile);
  }
  for (let i = 0; i < openCount; i++) {
    growWorldSegment(4, 14, clearSegmentTile);
  }
  for (const label of roomLabels) {
    placeSpecialRoom(label);
  }
  placeEndgameRoom();
}

function getSpecialRoomLabels() {
  return Object.entries(ROOM_DEFS)
    .filter(([, roomDef]) => isWorldAtLeast(roomDef.minWorld))
    .map(([label]) => label);
}

function isWorldAtLeast(sizeName) {
  const order = ["small", "medium", "large"];
  return order.indexOf(activeWorldSize) >= order.indexOf(sizeName);
}

function growWorldSegment(minSize, maxSize, applyTile) {
  const start = getRandomSegmentStart();
  if (!start) return;

  const targetSize = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
  const frontier = [start];
  const placed = new Set();

  while (frontier.length > 0 && placed.size < targetSize) {
    const index = Math.floor(Math.random() * frontier.length);
    const current = frontier.splice(index, 1)[0];
    const key = `${current.x},${current.y}`;
    if (placed.has(key) || !canModifySegmentTile(current.x, current.y)) continue;

    applyTile(current.x, current.y);
    placed.add(key);

    [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ].forEach((neighbor) => {
      if (canModifySegmentTile(neighbor.x, neighbor.y)) frontier.push(neighbor);
    });
  }
}

function getRandomSegmentStart() {
  for (let attempt = 0; attempt < 120; attempt++) {
    const x = 3 + Math.floor(Math.random() * Math.max(1, COLS - 6));
    const y = SURFACE_ROWS + 6 + Math.floor(Math.random() * Math.max(1, ROWS - SURFACE_ROWS - 8));
    if (canModifySegmentTile(x, y)) return { x, y };
  }

  return null;
}

function canModifySegmentTile(x, y) {
  if (x < 2 || x >= COLS - 2 || y < SURFACE_ROWS + 3 || y >= ROWS - 1) return false;
  if (isBaseTile(x, y)) return false;
  const tile = world[y]?.[x];
  return !!tile && !tile.relic;
}

function placeUnbreakableTile(x, y) {
  const tile = world[y]?.[x];
  if (!tile) return;
  tile.ore = null;
  tile.relic = null;
  tile.unbreakable = true;
  tile.hp = Infinity;
  tile.maxHp = Infinity;
  tile.color = "#202329";
}

function clearSegmentTile(x, y) {
  world[y][x] = null;
}

function placeSpecialRoom(label, options = {}) {
  const definition = options.definition ?? ROOM_DEFS[label] ?? {};
  const width = options.width ?? definition.width ?? 3;
  const height = options.height ?? definition.height ?? 3;
  const minRoomY = options.minY ?? definition.minY ?? SURFACE_ROWS + 8;
  const maxRoomY = options.maxY ?? definition.maxY ?? ROWS - 4;
  for (let attempt = 0; attempt < 500; attempt++) {
    const x = attempt === 0 && typeof options.preferredX === "number" ? options.preferredX : getRoomStartX(width);
    const y = getRoomStartY(height, minRoomY, maxRoomY);
    if (!canPlaceSpecialRoom(x, y, width, height)) continue;

    for (let yy = y; yy < y + height; yy++) {
      for (let xx = x; xx < x + width; xx++) {
        world[yy][xx] = null;
      }
    }

    const room = {
      x: x + Math.floor(width / 2),
      y: y + Math.floor(height / 2),
      startX: x,
      startY: y,
      width,
      height,
      label,
      kind: options.kind ?? definition.kind ?? "loot",
      title: options.title ?? definition.title ?? "",
      contents: options.contents ?? definition.contents ?? "",
      description: options.description ?? definition.description ?? "",
      resource: options.resource ?? definition.resource ?? null,
      used: false,
      described: false,
      poisonTimer: 0,
      spawnTimer: 0,
    };
    specialRooms.push(room);
    populateSpecialRoom(room, options);
    return room;
  }

  return null;
}

function getRoomStartX(width) {
  return 2 + Math.floor(Math.random() * Math.max(1, COLS - width - 3));
}

function getRoomStartY(height, minY, maxY) {
  const minStartY = clamp(minY, SURFACE_ROWS + 3, ROWS - height - 1);
  const maxStartY = clamp(maxY - height + 1, minStartY, ROWS - height - 1);
  return minStartY + Math.floor(Math.random() * Math.max(1, maxStartY - minStartY + 1));
}

function populateSpecialRoom(room, options = {}) {
  if (options.treasure || room.kind === "treasure") {
    placeTreasureChest(room.x, room.y);
    return;
  }

  if (room.kind === "loot") {
    dropRareRoomPile(room.x, room.y);
    return;
  }

  if (room.label === "A") {
    createMonster({ x: room.x, y: room.y }, {
      level: 2,
      hp: 12,
      speedMultiplier: 1.75,
      damageMultiplier: 3,
      radius: 9,
      name: "Quick monster",
      color: "#ffcf5f",
      loot: "alienCarapace",
      quiet: true,
      dormant: true,
      roomLabel: room.label,
    });
    return;
  }

  if (room.label === "O") {
    createMonster({ x: room.startX, y: room.y }, { level: 7, name: "Level 7 room monster", loot: "alienCarapace", quiet: true, dormant: true, roomLabel: room.label });
    createMonster({ x: room.startX + room.width - 1, y: room.y }, { level: 7, name: "Level 7 room monster", loot: "alienCarapace", quiet: true, dormant: true, roomLabel: room.label });
    return;
  }

  if (room.kind === "poison") {
    addRoomResourcePile("alienCarapace", room.x, room.y, 5, room.label);
    return;
  }

  if (room.kind === "vein") {
    addRoomResourcePile(room.resource ?? "gold", room.x, room.y, 4, room.label);
    return;
  }

  if (room.kind === "idol") {
    addRoomResourcePile("idol", room.x, room.y, 1, room.label);
  }
}

function addRoomResourcePile(type, tileX, tileY, amount, roomLabel = null) {
  for (let i = 0; i < amount; i++) {
    const offset = getPileOffset(i, amount);
    pickups.push({
      type,
      x: tileX * TILE + TILE / 2 + offset.x,
      y: tileY * TILE + TILE - 7 + offset.y,
      rotation: Math.random() * 0.28 - 0.14,
      roomLabel,
    });
  }
}

function dropRoomResource(type, tileX, tileY) {
  pickups.push({
    type,
    x: tileX * TILE + TILE / 2,
    y: tileY * TILE + TILE - 7,
    rotation: Math.random() * 0.28 - 0.14,
  });
}

function spawnRoomMonsterIn(room, level) {
  const openTiles = [];
  for (let y = room.startY; y < room.startY + room.height; y++) {
    for (let x = room.startX; x < room.startX + room.width; x++) {
      if (isMonsterOpenTile(x, y)) openTiles.push({ x, y });
    }
  }
  const tile = openTiles[Math.floor(Math.random() * openTiles.length)] ?? { x: room.x, y: room.y };
  createMonster(tile, { level });
}

function placeEndgameRoom() {
  const minY = Math.max(SURFACE_ROWS + 8, Math.floor(ROWS * 0.75));
  const room = placeSpecialRoom("Z", {
    minY,
    maxY: ROWS - 4,
    treasure: true,
  });
  if (room) return;

  const fallbackX = 3 + Math.floor(Math.random() * Math.max(1, COLS - 6));
  const fallbackY = minY + Math.floor(Math.random() * Math.max(1, ROWS - minY - 3));
  for (let yy = fallbackY - 1; yy <= fallbackY + 1; yy++) {
    for (let xx = fallbackX - 1; xx <= fallbackX + 1; xx++) {
      world[yy][xx] = null;
    }
  }
  specialRooms.push({
    x: fallbackX,
    y: fallbackY,
    startX: fallbackX - 1,
    startY: fallbackY - 1,
    width: 3,
    height: 3,
    label: "Z",
    kind: "treasure",
    contents: "treasure chest",
    description: "The ancient treasure rests here. Bring it back to base.",
    used: false,
    described: false,
    poisonTimer: 0,
  });
  placeTreasureChest(fallbackX, fallbackY);
}

function placeTreasureChest(tileX, tileY) {
  treasureChest.tileX = tileX;
  treasureChest.tileY = tileY;
  treasureChest.x = tileX * TILE + TILE / 2;
  treasureChest.y = tileY * TILE + TILE - 10;
  treasureChest.placed = true;
  treasureChest.carried = false;
  treasureChest.delivered = false;
  treasureChest.hover = false;
  treasureChest.instructionsShown = false;
  treasureChest.instructionsDismissed = false;
}

function canPlaceSpecialRoom(startX, startY, width = 3, height = 3) {
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (!canModifySegmentTile(x, y)) return false;
    }
  }

  return true;
}

function dropRareRoomPile(tileX, tileY) {
  const rareTypes = ["gold", "gold", "diamond"];
  for (let i = 0; i < 8; i++) {
    const type = rareTypes[i % rareTypes.length];
    const offset = getPileOffset(i, 8);
    pickups.push({
      type,
      x: tileX * TILE + TILE / 2 + offset.x,
      y: tileY * TILE + TILE - 7 + offset.y,
      rotation: Math.random() * 0.28 - 0.14,
    });
  }
}

function update(dt) {
  updateGamepadInput();

  if (!gameStarted) {
    updateCamera();
    updateHud();
    return;
  }

  if (gamePaused) {
    updateCamera();
    updateHud();
    return;
  }

  if (gameWon) {
    updateTreasureChest(dt);
    updateCamera();
    return;
  }

  if (gameOver) {
    elapsedTime += dt;
    gameOverTimer += dt;
    if (!finalGameOver) updateMonsters(dt);
    updateExplosions(dt);
    updateTileEffects(dt);
    if (!finalGameOver) updateHullBreachCooldown();
    updateHud();
    return;
  }

  messageTimer = Math.max(0, messageTimer - dt);
  elapsedTime += dt;
  deepestMinerDepth = Math.max(deepestMinerDepth, getMinerDepthTiles());
  miner.drillCooldown = Math.max(0, miner.drillCooldown - dt);
  updateRelics(dt);
  updateFlares(dt);
  updateBlaster(dt);
  updateRadiation(dt);
  updateExplosions(dt);
  updateMonsters(dt);
  updateMouse(dt);
  updateDog(dt);
  updateTileEffects(dt);
  updateFeedbackEffects(dt);
  updateSpecialRoomEffects(dt);
  updatePoisonEffect(dt);
  const { x: inputX, y: inputY } = getMovementInput();
  const length = Math.hypot(inputX, inputY) || 1;
  if (inputX !== 0 || inputY !== 0) {
    miner.facingX = inputX / length;
    miner.facingY = inputY / length;
  }

  const currentSpeed = miner.speed * getSpeedMultiplier() * (treasureChest.carried ? TREASURE_CARRY_SPEED_MULTIPLIER : 1);
  miner.vx = (inputX / length) * currentSpeed;
  miner.vy = (inputY / length) * currentSpeed;

  moveMiner(miner.vx * dt, miner.vy * dt, dt);
  if (miner.health <= 0) {
    triggerGameOver();
    updateCamera();
    updateHud();
    return;
  }
  updateMagnets(dt);
  collectPickups();
  handleBase(dt);
  updateTreasureChest(dt);
  updateCamera();
  updateMonsterSightingSounds();
  updateHud();
}

function updateMonsters(dt) {
  monsterSpawnTimer -= dt;
  if (monsterSpawnTimer <= 0) {
    const level = getMonsterSpawnLevel();
    spawnMonsterWave(level);
    monsterSpawnTimer = monsterSpawnInterval;
  }

  for (const monster of monsters) {
    if (monster.dormant) continue;
    monster.hitFlash = Math.max(0, monster.hitFlash - dt);
    monster.attackFlash = Math.max(0, monster.attackFlash - dt);
    monster.attackCooldown = Math.max(0, monster.attackCooldown - dt);
    monster.repathTimer = Math.max(0, monster.repathTimer - dt);
    const target = getMonsterTarget(monster);
    if (monster.targetKind !== target.kind) {
      monster.path = [];
      monster.repathTimer = 0;
      monster.targetKind = target.kind;
    }
    followMonsterPath(monster, dt, target);
    const dx = target.x - monster.x;
    const dy = target.y - monster.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= monster.radius + target.radius + 3) {
      attackMonsterTarget(monster, target, dx, dy, distance);
    }
  }
}

function spawnMonsterWave(level) {
  let spawned = 0;
  if (spawnMonster(level, { targetMode: "miner" })) spawned += 1;
  if (level >= 6 && spawnMonster(level, { targetMode: "base", ignoreLimit: true })) spawned += 1;
  return spawned;
}

function reduceMonsterSpawnInterval(spawnedCount) {
  if (spawnedCount <= 0) return;
  monsterSpawnInterval = Math.max(MIN_MONSTER_SPAWN_INTERVAL, monsterSpawnInterval - MONSTER_SPAWN_INTERVAL_STEP * spawnedCount);
}

function spawnMonster(level = getMonsterSpawnLevel(), options = {}) {
  if (!options.ignoreLimit && monsters.length >= MAX_MONSTERS) return false;

  const openTiles = getMonsterSpawnTiles();
  if (openTiles.length === 0) return false;

  const spawnTile = openTiles[Math.floor(Math.random() * openTiles.length)];
  createMonster(spawnTile, { level, targetMode: options.targetMode });
  if (!options.skipCooldownReduction) reduceMonsterSpawnInterval(1);
  return true;
}

function getMonsterSpawnLevel() {
  return Math.max(getDepthBasedMonsterLevel(), getTimeBasedMonsterLevel());
}

function getDepthBasedMonsterLevel() {
  const mineDepth = Math.max(1, ROWS - SURFACE_ROWS);
  const progress = clamp(deepestMinerDepth / mineDepth, 0, 1);
  let level = 1;
  for (let i = 0; i < MONSTER_LEVEL_DEPTH_THRESHOLDS.length; i++) {
    if (progress >= MONSTER_LEVEL_DEPTH_THRESHOLDS[i]) level = i + 1;
  }
  return clamp(level, 1, MONSTER_MAX_PROGRESS_LEVEL);
}

function getTimeBasedMonsterLevel() {
  const levelSixTime = MONSTER_LEVEL_6_TIME_BY_WORLD[activeWorldSize] ?? MONSTER_LEVEL_6_TIME_BY_WORLD.large;
  const progress = clamp(elapsedTime / levelSixTime, 0, 1);
  return clamp(1 + Math.floor(progress * (MONSTER_MAX_PROGRESS_LEVEL - 1)), 1, MONSTER_MAX_PROGRESS_LEVEL);
}

function getMinerDepthTiles() {
  return Math.max(0, miner.y / TILE - SURFACE_ROWS);
}

function createMonster(spawnTile, options = {}) {
  const level = options.level ?? getMonsterLevel(spawnTile.y);
  const maxHp = options.hp ?? getMonsterMaxHp(level);
  monsters.push({
    x: spawnTile.x * TILE + TILE / 2,
    y: spawnTile.y * TILE + TILE / 2,
    radius: options.radius ?? 11,
    level,
    hp: maxHp,
    maxHp,
    speedMultiplier: options.speedMultiplier ?? 1,
    damageMultiplier: options.damageMultiplier ?? 1,
    name: options.name ?? `Level ${level} monster`,
    color: options.color ?? null,
    loot: options.loot ?? "alienCarapace",
    dormant: Boolean(options.dormant),
    roomLabel: options.roomLabel ?? null,
    targetMode: options.targetMode ?? "auto",
    hitFlash: 0,
    attackFlash: 0,
    attackCooldown: 1,
    path: [],
    pathTarget: null,
    targetKind: "miner",
    repathTimer: 0,
    screamedOnScreen: false,
  });
  if (!options.quiet) setMessage(`${options.name ?? `Level ${level} monster`} detected.`);
}

function getMonsterSpawnTiles() {
  const minerTile = { x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) };
  const start = getNearestMonsterOpenTile(minerTile, 12);
  if (!start) return [];

  const reachable = getMonsterReachableOpenTiles(start);
  const deepestDugY = getDeepestReachableDugY(reachable);
  const minY = Math.max(SURFACE_ROWS, deepestDugY - 2);
  const openTiles = [];

  for (let y = deepestDugY; y >= minY; y--) {
    for (let x = 0; x < COLS; x++) {
      if (!isMonsterOpenTile(x, y)) continue;
      if (!reachable.has(`${x},${y}`)) continue;
      if (Math.hypot(x - minerTile.x, y - minerTile.y) < 8) continue;
      openTiles.push({ x, y });
    }
  }

  return openTiles;
}

function getDeepestReachableDugY(reachable) {
  let deepest = SURFACE_ROWS - 1;
  for (const key of reachable.keys()) {
    const [, yText] = key.split(",");
    const y = Number(yText);
    if (y > deepest) deepest = y;
  }
  return deepest;
}

function getDeepestDugY() {
  let deepest = SURFACE_ROWS - 1;
  for (let y = SURFACE_ROWS; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (isOpenTile(x, y)) deepest = y;
    }
  }
  return deepest;
}

function getMonsterLevel(tileY) {
  let level = 1;
  for (let i = 0; i < blockDefs.length; i++) {
    if (tileY >= blockDefs[i].depth) level = i + 1;
  }
  return level;
}

function getMonsterMaxHp(level) {
  return MONSTER_BASE_HP + level * MONSTER_HP_PER_LEVEL;
}

function getMonsterTarget(monster) {
  if (monster.targetMode === "base" && canMonsterReachBase(monster)) return getBaseMonsterTarget();
  if (monster.targetMode === "miner") {
    return {
      kind: "miner",
      x: miner.x,
      y: miner.y,
      radius: miner.radius,
    };
  }

  const start = getNearestMonsterOpenTile(getMonsterTile(monster), 3);
  const reachable = start ? getMonsterReachableOpenTiles(start) : null;
  const targets = [
    {
      kind: "miner",
      x: miner.x,
      y: miner.y,
      radius: miner.radius,
    },
  ];

  if (relics.mouse.unlocked && isHelperTargetable(mouseHelper)) {
    const distance = Math.hypot(mouseHelper.x - monster.x, mouseHelper.y - monster.y);
    if (distance <= MONSTER_COMPANION_AGGRO_RADIUS && isReachableTarget(reachable, mouseHelper)) {
      targets.push({
        kind: "mouse",
        x: mouseHelper.x,
        y: mouseHelper.y,
        radius: HELPER_RADIUS,
      });
    }
  }

  if (relics.dog.unlocked && isHelperTargetable(dogHelper)) {
    const distance = Math.hypot(dogHelper.x - monster.x, dogHelper.y - monster.y);
    if (distance <= MONSTER_COMPANION_AGGRO_RADIUS && isReachableTarget(reachable, dogHelper)) {
      targets.push({
        kind: "dog",
        x: dogHelper.x,
        y: dogHelper.y,
        radius: HELPER_RADIUS,
      });
    }
  }

  return targets.reduce((best, target) => {
    const bestDistance = Math.hypot(best.x - monster.x, best.y - monster.y);
    const targetDistance = Math.hypot(target.x - monster.x, target.y - monster.y);
    return targetDistance < bestDistance ? target : best;
  });
}

function getBaseMonsterTarget() {
  return {
    kind: "base",
    x: BASE_CENTER_TILE_X * TILE,
    y: (BASE_MAX_TILE_Y + 1) * TILE + TILE / 2,
    radius: TILE * 0.8,
  };
}

function getBaseAttackTile() {
  return {
    x: BASE_CENTER_TILE_X,
    y: BASE_MAX_TILE_Y + 1,
  };
}

function canMonsterReachBase(monster) {
  if (monster.dormant || monster.targetMode !== "base") return false;
  const attackTile = getBaseAttackTile();
  if (!isMonsterOpenTile(attackTile.x, attackTile.y)) return false;
  const start = getNearestMonsterOpenTile(getMonsterTile(monster), 3);
  if (!start) return false;
  return getMonsterReachableOpenTiles(start).has(`${attackTile.x},${attackTile.y}`);
}

function isReachableTarget(reachable, target) {
  if (!reachable) return false;
  const targetTile = {
    x: Math.floor(target.x / TILE),
    y: Math.floor(target.y / TILE),
  };
  return !!getNearestReachableTileFromMap(reachable, targetTile, 2);
}

function isHelperTargetable(helper) {
  const tileX = Math.floor(helper.x / TILE);
  const tileY = Math.floor(helper.y / TILE);
  return isOpenTile(tileX, tileY) && !isBaseTile(tileX, tileY);
}

function attackMonsterTarget(monster, target, dx, dy, distance) {
  if (target.kind === "miner") {
    attackMiner(monster, dx, dy, distance);
    return;
  }
  if (target.kind === "base") {
    attackBase(monster);
    return;
  }

  attackHelper(monster, target.kind, dx, dy, distance);
}

function attackBase(monster) {
  if (monster.attackCooldown > 0 || base.health <= 0) return;

  monster.attackCooldown = MONSTER_ATTACK_COOLDOWN;
  monster.attackFlash = 0.18;
  base.health = Math.max(0, base.health - getMonsterBaseDamage(monster));
  setMessage(base.health <= 0 ? "Base breached." : "Monster damaged the base.");
  if (base.health <= 0) triggerGameOver("base");
}

function attackMiner(monster, dx, dy, distance) {
  if (gameOver) return;
  if (monster.attackCooldown > 0) return;

  monster.attackCooldown = MONSTER_ATTACK_COOLDOWN;
  monster.attackFlash = 0.18;
  miner.health = Math.max(0, miner.health - getMonsterDamage(monster) * getHullDamageTakenMultiplier());

  const force = distance || 1;
  const knockback = 12 + monster.level * 2;
  moveIfOpen(
    clamp(miner.x + (dx / force) * knockback, miner.radius, COLS * TILE - miner.radius),
    clamp(miner.y + (dy / force) * knockback, miner.radius, ROWS * TILE - miner.radius),
  ) || separateMinerFromMonster(monster);
  bounceMonsterFromMiner(monster, dx, dy, force);

  setMessage(miner.health <= 0 ? "Hull breached. Return to base." : "Monster damaged the hull.");
  if (miner.health <= 0) triggerGameOver();
}

function attackHelper(monster, type, dx, dy, distance) {
  if (monster.attackCooldown > 0 || !relics[type].unlocked) return;

  monster.attackCooldown = MONSTER_ATTACK_COOLDOWN;
  monster.attackFlash = 0.18;
  damageHelper(type, getMonsterDamage(monster), "monster");
  if (!relics[type].unlocked) return;

  const helper = type === "mouse" ? mouseHelper : dogHelper;
  const force = distance || 1;
  const knockback = 10 + monster.level * 2;
  const nextX = clamp(helper.x + (dx / force) * knockback, HELPER_RADIUS, COLS * TILE - HELPER_RADIUS);
  const nextY = clamp(helper.y + (dy / force) * knockback, HELPER_RADIUS, ROWS * TILE - HELPER_RADIUS);
  if (!isMonsterBlockedAt({ radius: HELPER_RADIUS }, nextX, nextY)) {
    helper.x = nextX;
    helper.y = nextY;
  }
  bounceMonsterFromMiner(monster, dx, dy, force);

  if (relics[type].unlocked) {
    setMessage(`Monster damaged the ${type}.`);
  }
}

function getMonsterDamage(monster) {
  return (MONSTER_BASE_ATTACK_DAMAGE + monster.level * MONSTER_ATTACK_DAMAGE_PER_LEVEL) * (monster.damageMultiplier ?? 1);
}

function getHullDamageTakenMultiplier() {
  const reduction = Math.min(MAX_HULL_HARDENING_REDUCTION, miner.upgrades.hardening * HULL_HARDENING_REDUCTION_PER_LEVEL);
  return 1 - reduction;
}

function getMonsterBaseDamage(monster) {
  const referenceDamage = (base.maxHealth * MONSTER_ATTACK_COOLDOWN) / BASE_MONSTER_REFERENCE_DESTROY_TIME;
  const levelBonus = Math.max(0, monster.level - BASE_MONSTER_DAMAGE_REFERENCE_LEVEL) * BASE_MONSTER_DAMAGE_LEVEL_SCALE;
  return referenceDamage * (1 + levelBonus) * (monster.damageMultiplier ?? 1);
}

function bounceMonsterFromMiner(monster, dx, dy, force) {
  const bounce = 22 + monster.level * 3;
  const nextX = clamp(monster.x - (dx / force) * bounce, monster.radius, COLS * TILE - monster.radius);
  const nextY = clamp(monster.y - (dy / force) * bounce, monster.radius, ROWS * TILE - monster.radius);

  if (!isMonsterBlockedAt(monster, nextX, nextY)) {
    monster.x = nextX;
    monster.y = nextY;
  } else if (!isMonsterBlockedAt(monster, nextX, monster.y)) {
    monster.x = nextX;
  } else if (!isMonsterBlockedAt(monster, monster.x, nextY)) {
    monster.y = nextY;
  }

  monster.path = [];
  monster.repathTimer = 0;
}

function followMonsterPath(monster, dt, chaseTarget) {
  const start = getNearestMonsterOpenTile(getMonsterTile(monster), 3);
  if (!start) return;

  const currentTile = getMonsterTile(monster);
  if (!isMonsterOpenTile(currentTile.x, currentTile.y)) {
    monster.x = start.x * TILE + TILE / 2;
    monster.y = start.y * TILE + TILE / 2;
    monster.path = [];
    return;
  }

  const reachable = getMonsterReachableOpenTiles(start);
  const targetTile = getNearestReachableTileFromMap(reachable, getTargetTile(chaseTarget), 4);
  if (!targetTile) {
    moveMonsterToward(monster, chaseTarget.x, chaseTarget.y, dt);
    return;
  }

  const path = reconstructPathFromMap(reachable, start, targetTile);
  const next = path[0];
  monster.path = path;
  monster.pathTarget = targetTile;
  if (!next) {
    moveMonsterToward(monster, chaseTarget.x, chaseTarget.y, dt);
    return;
  }

  moveMonsterToward(monster, next.x * TILE + TILE / 2, next.y * TILE + TILE / 2, dt);
}

function getTargetTile(target) {
  return {
    x: Math.floor(target.x / TILE),
    y: Math.floor(target.y / TILE),
  };
}

function moveMonsterToward(monster, x, y, dt) {
  const dx = x - monster.x;
  const dy = y - monster.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return true;

  const speed = (32 + monster.level * 2.5) * (monster.speedMultiplier ?? 1);
  const step = Math.min(distance, speed * dt);
  const nextX = monster.x + (dx / distance) * step;
  const nextY = monster.y + (dy / distance) * step;

  if (!isMonsterBlockedAt(monster, nextX, nextY)) {
    monster.x = nextX;
    monster.y = nextY;
    return true;
  } else if (Math.abs(dx) > Math.abs(dy) && !isMonsterBlockedAt(monster, nextX, monster.y)) {
    monster.x = nextX;
    return true;
  } else if (!isMonsterBlockedAt(monster, monster.x, nextY)) {
    monster.y = nextY;
    return true;
  } else {
    centerMonsterInOpenTile(monster);
    monster.path = [];
    monster.repathTimer = 0;
    return false;
  }
}

function centerMonsterInOpenTile(monster) {
  const tile = getNearestMonsterOpenTile(getMonsterTile(monster), 2);
  if (!tile) return;
  monster.x = tile.x * TILE + TILE / 2;
  monster.y = tile.y * TILE + TILE / 2;
}

function isMonsterBlockedAt(monster, x, y) {
  const checks = [
    [x - monster.radius, y - monster.radius],
    [x + monster.radius, y - monster.radius],
    [x - monster.radius, y + monster.radius],
    [x + monster.radius, y + monster.radius],
  ];

  return checks.some(([px, py]) => {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    return isSolidTile(tx, ty) || isBaseTile(tx, ty);
  });
}

function getMonsterTile(monster) {
  return {
    x: Math.floor(monster.x / TILE),
    y: Math.floor(monster.y / TILE),
  };
}

function isMonsterOpenTile(x, y) {
  return isOpenTile(x, y) && !isBaseTile(x, y);
}

function isBaseTile(x, y) {
  return x >= BASE_MIN_TILE_X && x <= BASE_MAX_TILE_X && y >= 0 && y <= BASE_MAX_TILE_Y;
}

function getNearestMonsterOpenTile(origin, maxRadius = 12) {
  if (isMonsterOpenTile(origin.x, origin.y)) return origin;

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let y = origin.y - radius; y <= origin.y + radius; y++) {
      for (let x = origin.x - radius; x <= origin.x + radius; x++) {
        if (Math.max(Math.abs(origin.x - x), Math.abs(origin.y - y)) !== radius) continue;
        if (isMonsterOpenTile(x, y)) return { x, y };
      }
    }
  }

  return null;
}

function getMonsterReachableOpenTiles(start) {
  const queue = [start];
  const cameFrom = new Map([[`${start.x},${start.y}`, null]]);
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = `${next.x},${next.y}`;
      if (cameFrom.has(key) || !isMonsterOpenTile(next.x, next.y)) continue;
      cameFrom.set(key, current);
      queue.push(next);
    }
  }

  return cameFrom;
}

function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].life -= dt;
    if (explosions[i].life <= 0) explosions.splice(i, 1);
  }

  for (let i = radiationBursts.length - 1; i >= 0; i--) {
    radiationBursts[i].life -= dt;
    if (radiationBursts[i].life <= 0) radiationBursts.splice(i, 1);
  }

  for (let i = swordArcs.length - 1; i >= 0; i--) {
    updateSwordArcHit(swordArcs[i], dt);
    if (swordArcs[i].life <= 0) swordArcs.splice(i, 1);
  }
}

function updateRelics(dt) {
  for (const relic of Object.values(relics)) {
    if ("active" in relic) relic.active = Math.max(0, relic.active - dt);
    if ("cooldown" in relic) relic.cooldown = Math.max(0, relic.cooldown - dt);
  }
  if (relics.laserSword.unlocked && relics.laserSword.cooldown <= 0 && relics.laserSword.swings <= 0) {
    relics.laserSword.swings = getLaserSwordMaxSwings();
  }
}

function updateBlaster(dt) {
  const blaster = relics.blaster;
  blaster.shotCooldown = Math.max(0, blaster.shotCooldown - dt);
  if (blaster.overheat > 0) {
    blaster.overheat = Math.max(0, blaster.overheat - dt);
    if (blaster.overheat === 0) blaster.charge = 100;
  } else {
    blaster.charge = Math.min(100, blaster.charge + 0.5 * dt);
  }
  for (let i = blasts.length - 1; i >= 0; i--) {
    const blast = blasts[i];
    blast.life -= dt;
    if (blast.life <= 0) {
      if (blast.kind === "rocket") {
        detonateAt(
          clamp(Math.floor(blast.x / TILE), 0, COLS - 1),
          clamp(Math.floor(blast.y / TILE), 0, ROWS - 1),
          blast.radius ?? getRocketRadius(),
          blast.damage ?? getRocketDamage(),
          { damageMiner: true, monsterDamage: blast.monsterDamage ?? getRocketMonsterDamage() },
        );
      }
      blasts.splice(i, 1);
      continue;
    }
    blast.x += blast.vx * dt;
    blast.y += blast.vy * dt;
    if (updateBlastHit(blast)) blasts.splice(i, 1);
  }

  if ((keys.has(" ") || gamepadState.blasterHeld) && blaster.unlocked) fireBlaster();
}

function getMovementInput() {
  const keyboardX = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
  const keyboardY = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0);
  const x = keyboardX || gamepadState.axes.x;
  const y = keyboardY || gamepadState.axes.y;
  const length = Math.hypot(x, y);
  if (length <= 1) return { x, y };
  return { x: x / length, y: y / length };
}

function updateRadiation(dt) {
  const radiation = relics.radiation;
  if (!radiation.unlocked || radiation.active <= 0) return;

  radiation.tick -= dt;
  while (radiation.tick <= 0 && radiation.active > 0) {
    radiation.tick += RADIATION_TICK_INTERVAL;
    pulseRadiation();
  }
}

function pulseRadiation() {
  const damage = getRadiationDamage();
  radiationBursts.push({
    x: miner.x,
    y: miner.y,
    radius: RADIATION_RADIUS,
    life: RADIATION_BURST_LIFE,
    maxLife: RADIATION_BURST_LIFE,
  });

  for (const monster of [...monsters]) {
    if (Math.hypot(monster.x - miner.x, monster.y - miner.y) <= RADIATION_RADIUS + monster.radius) {
      damageMonster(monster, damage);
    }
  }

  if (relics.radiation.level < 4) {
    if (relics.mouse.unlocked && isHelperInRadiation(mouseHelper)) {
      damageHelper("mouse", damage, "radiation");
    }
    if (relics.dog.unlocked && isHelperInRadiation(dogHelper)) {
      damageHelper("dog", damage, "radiation");
    }
  }
}

function isHelperInRadiation(helper) {
  return Math.hypot(helper.x - miner.x, helper.y - miner.y) <= RADIATION_RADIUS + 10;
}

function damageHelper(type, amount, source = "damage") {
  const helper = type === "mouse" ? mouseHelper : dogHelper;
  helper.health = Math.max(0, helper.health - amount);
  if (helper.health > 0) return;

  killHelper(type, source);
}

function killHelper(type, source = "damage") {
  relics[type].unlocked = false;
  if (type === "dog") {
    dropDogCargo();
    resetDogHelper();
    if (source === "monster") {
      setMessage("The dog was eaten.");
    } else if (source === "blast") {
      setMessage("Dog was caught in the blast.");
    } else {
      setMessage("Dog was lost to radiation.");
    }
    return;
  }

  resetMouseHelper();
  if (source === "monster") {
    setMessage("The mouse was eaten.");
  } else if (source === "blast") {
    setMessage("Mouse was caught in the blast.");
  } else {
    setMessage("Mouse was lost to radiation.");
  }
}

function resetMouseHelper() {
  mouseHelper.x = miner.x - 22;
  mouseHelper.y = miner.y + 18;
  mouseHelper.target = null;
  mouseHelper.path = [];
  mouseHelper.mode = "idle";
  mouseHelper.drillCooldown = 0;
  mouseHelper.searchCooldown = 0;
  mouseHelper.stuckTimer = 0;
  mouseHelper.lastX = mouseHelper.x;
  mouseHelper.lastY = mouseHelper.y;
  mouseHelper.health = mouseHelper.maxHealth;
  mouseHelper.initialized = false;
}

function resetDogHelper() {
  dogHelper.x = miner.x + 22;
  dogHelper.y = miner.y + 18;
  dogHelper.target = null;
  dogHelper.path = [];
  dogHelper.mode = "idle";
  for (const type of Object.keys(dogHelper.cargo)) dogHelper.cargo[type] = 0;
  dogHelper.carried = 0;
  dogHelper.health = dogHelper.maxHealth;
  dogHelper.initialized = false;
}

function updateMagnets(dt) {
  if (relics.magnet.active <= 0) return;
  pullPickupsToMagnet({
    x: miner.x,
    y: miner.y,
    radius: getMagnetRadius(),
    speed: Math.hypot(miner.vx, miner.vy),
  }, dt);
}

function pullPickupsToMagnet(magnet, dt) {
  const radius = magnet.radius ?? MAGNET_RADIUS;
  const magnetSpeed = MAGNET_PULL_SPEED + (magnet.speed ?? 0) * 1.65;
  for (const pickup of pickups) {
    if (!isPickupVisible(pickup)) continue;
    const dx = magnet.x - pickup.x;
    const dy = magnet.y - pickup.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1 || distance > radius) continue;

    const pullFalloff = 0.45 + (1 - distance / radius) * 0.75;
    const pullStrength = magnetSpeed * pullFalloff;
    const step = Math.min(distance, Math.max(36, pullStrength) * dt);
    const nextX = pickup.x + (dx / distance) * step;
    const nextY = pickup.y + (dy / distance) * step;
    movePickupToward(pickup, nextX, nextY, dx, dy);
  }
}

function movePickupToward(pickup, nextX, nextY, dx, dy) {
  if (isPickupSpaceOpen(nextX, nextY)) {
    pickup.x = nextX;
    pickup.y = nextY;
    return;
  }

  const tryX = isPickupSpaceOpen(nextX, pickup.y);
  const tryY = isPickupSpaceOpen(pickup.x, nextY);
  if (tryX && (!tryY || Math.abs(dx) >= Math.abs(dy))) {
    pickup.x = nextX;
  } else if (tryY) {
    pickup.y = nextY;
  } else {
    const slide = getMagnetSlideStep(pickup, dx, dy);
    if (slide) {
      pickup.x = slide.x;
      pickup.y = slide.y;
    }
  }
}

function getMagnetSlideStep(pickup, dx, dy) {
  const slideDistance = 1.8;
  const candidates = Math.abs(dx) > Math.abs(dy)
    ? [
        { x: pickup.x, y: pickup.y + Math.sign(dy || 1) * slideDistance },
        { x: pickup.x, y: pickup.y - Math.sign(dy || 1) * slideDistance },
      ]
    : [
        { x: pickup.x + Math.sign(dx || 1) * slideDistance, y: pickup.y },
        { x: pickup.x - Math.sign(dx || 1) * slideDistance, y: pickup.y },
      ];

  return candidates.find((candidate) => isPickupSpaceOpen(candidate.x, candidate.y)) ?? null;
}

function isPickupSpaceOpen(x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  return isOpenTile(tx, ty);
}

function fireBlaster() {
  const blaster = relics.blaster;
  if (blaster.overheat > 0 || blaster.charge <= 0 || blaster.shotCooldown > 0) return;

  blaster.charge = Math.max(0, blaster.charge - 1);
  blaster.shotCooldown = 0.4;
  if (blaster.charge === 0) blaster.overheat = 30;
  blasts.push({
    x: miner.x + miner.facingX * 14,
    y: miner.y + miner.facingY * 14,
    vx: miner.facingX * 420,
    vy: miner.facingY * 420,
    life: 0.7,
    damageBonus: getBlasterDamageBonus(),
  });
}

function swingLaserSword() {
  const sword = relics.laserSword;
  if (!sword.unlocked) return false;
  if (sword.cooldown > 0) {
    setMessage("Laser Sword is cooling down.");
    return false;
  }
  if (sword.swings <= 0) {
    sword.cooldown = getRelicCooldown("laserSword");
    sword.swings = getLaserSwordMaxSwings();
    setMessage("Laser Sword is recharging.");
    return false;
  }

  const damage = getLaserSwordDamage();
  const range = TILE * 2.4;
  const facingLength = Math.hypot(miner.facingX, miner.facingY) || 1;
  const fx = miner.facingX / facingLength;
  const fy = miner.facingY / facingLength;

  sword.swings -= 1;
  playLaserSwordSound();
  swordArcs.push({
    x: miner.x,
    y: miner.y,
    facingX: fx,
    facingY: fy,
    range,
    damage,
    life: 0.34,
    maxLife: 0.34,
    hitMonsters: new Set(),
    hitTiles: new Set(),
  });

  if (sword.swings <= 0) sword.cooldown = getRelicCooldown("laserSword");
  setMessage(sword.swings > 0 ? `Laser Sword swings left: ${sword.swings}.` : "Laser Sword depleted. Recharging.");
  updateHud();
  return true;
}

function updateSwordArcHit(arc, dt) {
  arc.life = Math.max(0, arc.life - dt);
  const blade = getSwordBlade(arc);

  for (const monster of [...monsters]) {
    if (arc.hitMonsters.has(monster)) continue;
    const hit = getPointToSegmentHit(monster.x, monster.y, blade.startX, blade.startY, blade.endX, blade.endY);
    if (!hit || hit.distance > monster.radius + 7) continue;
    arc.hitMonsters.add(monster);
    damageMonster(monster, arc.damage);
    const pushX = monster.x - arc.x;
    const pushY = monster.y - arc.y;
    const pushLength = Math.hypot(pushX, pushY) || 1;
    monster.x += (pushX / pushLength) * 18;
    monster.y += (pushY / pushLength) * 18;
  }

  const samples = Math.ceil(arc.range / 8);
  for (let i = 2; i <= samples; i++) {
    const t = i / samples;
    const x = blade.startX + (blade.endX - blade.startX) * t;
    const y = blade.startY + (blade.endY - blade.startY) * t;
    const tileX = Math.floor(x / TILE);
    const tileY = Math.floor(y / TILE);
    const key = `${tileX},${tileY}`;
    if (arc.hitTiles.has(key)) continue;
    if (!world[tileY]?.[tileX]) continue;
    arc.hitTiles.add(key);
    damageTile(tileX, tileY, arc.damage, 0.16, true);
  }
}

function getSwordBlade(arc) {
  const progress = 1 - arc.life / arc.maxLife;
  const baseAngle = Math.atan2(arc.facingY, arc.facingX);
  const sweepAngle = baseAngle + (-0.95 + progress * 1.9);
  const dirX = Math.cos(sweepAngle);
  const dirY = Math.sin(sweepAngle);
  const startDistance = 12;
  return {
    angle: sweepAngle,
    progress,
    startX: arc.x + dirX * startDistance,
    startY: arc.y + dirY * startDistance,
    endX: arc.x + dirX * arc.range,
    endY: arc.y + dirY * arc.range,
  };
}

function getPointToSegmentHit(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const lengthSq = vx * vx + vy * vy;
  if (lengthSq <= 0) return null;
  const projection = clamp(((px - ax) * vx + (py - ay) * vy) / lengthSq, 0, 1);
  const closestX = ax + vx * projection;
  const closestY = ay + vy * projection;
  return {
    projection,
    distance: Math.hypot(px - closestX, py - closestY),
  };
}

function activateConverter() {
  const converter = relics.converter;
  if (!converter.unlocked) return false;
  if (!isMinerAtBase()) {
    setMessage("Return to base to run the converter.");
    return false;
  }
  if (converter.cooldown > 0) {
    setMessage("Resource Converter is cooling down.");
    return false;
  }

  const gains = getConverterGains();
  for (const [type, amount] of Object.entries(gains)) resources[type] += amount;
  converter.cooldown = getRelicCooldown("converter");
  setMessage(`Converter produced ${formatRecipe(gains)}.`);
  updateHud();
  return true;
}

function getConverterGains() {
  const amount = relics.converter.level * 2;
  return {
    copper: amount,
    silver: relics.converter.level >= 2 ? amount : 0,
    gold: relics.converter.level >= 3 ? amount : 0,
  };
}

function updateBlastHit(blast) {
  if (blast.kind === "rocket" && isBlastOutOfBounds(blast)) {
    detonateAt(
      clamp(Math.floor(blast.x / TILE), 0, COLS - 1),
      clamp(Math.floor(blast.y / TILE), 0, ROWS - 1),
      blast.radius ?? getRocketRadius(),
      blast.damage ?? getRocketDamage(),
      { damageMiner: true, monsterDamage: blast.monsterDamage ?? getRocketMonsterDamage() },
    );
    return true;
  }

  const monster = findMonsterAt(blast.x, blast.y);
  if (monster) {
    if (blast.kind === "rocket") {
      detonateAt(Math.floor(monster.x / TILE), Math.floor(monster.y / TILE), blast.radius ?? getRocketRadius(), blast.damage ?? getRocketDamage(), {
        damageMiner: true,
        monsterDamage: blast.monsterDamage ?? getRocketMonsterDamage(),
      });
    } else {
      damageMonster(monster, blast.monsterDamage ?? blast.damage ?? LEVEL_ONE_DRILL_DAMAGE * BLASTER_MONSTER_DAMAGE_MULTIPLIER + (blast.damageBonus ?? 0));
    }
    return true;
  }

  const x = Math.floor(blast.x / TILE);
  const y = Math.floor(blast.y / TILE);
  const tile = world[y]?.[x];
  if (!tile) return false;

  if (blast.kind === "rocket") {
    detonateAt(x, y, blast.radius ?? getRocketRadius(), blast.damage ?? getRocketDamage(), {
      damageMiner: true,
      monsterDamage: blast.monsterDamage ?? getRocketMonsterDamage(),
    });
  } else {
    damageTile(x, y, blast.damage ?? miner.power * getDamageMultiplier() * BLASTER_BLOCK_DAMAGE_MULTIPLIER + (blast.damageBonus ?? 0), 0.12);
  }
  return true;
}

function isBlastOutOfBounds(blast) {
  return blast.x < 0 || blast.y < 0 || blast.x >= COLS * TILE || blast.y >= ROWS * TILE;
}

function updateMouse(dt) {
  if (!relics.mouse.unlocked) return;
  if (!mouseHelper.initialized) {
    mouseHelper.x = miner.x - 22;
    mouseHelper.y = miner.y + 18;
    mouseHelper.lastX = mouseHelper.x;
    mouseHelper.lastY = mouseHelper.y;
    mouseHelper.initialized = true;
  }
  ensureMouseInOpenTile();
  updateMouseStuckState(dt);

  const threat = getVisibleMonsterThreat(mouseHelper);
  if (threat) {
    fleeMouseFromMonster(threat, dt);
    return;
  }
  if (mouseHelper.mode === "flee") {
    mouseHelper.mode = "idle";
    mouseHelper.path = [];
  }

  mouseHelper.drillCooldown = Math.max(0, mouseHelper.drillCooldown - dt);
  mouseHelper.searchCooldown = Math.max(0, mouseHelper.searchCooldown - dt);
  if (!mouseHelper.target || !world[mouseHelper.target.y]?.[mouseHelper.target.x]) {
    mouseHelper.target = findMouseTarget();
  }
  if (mouseHelper.target && mouseHelper.mode === "relocate") {
    mouseHelper.mode = "idle";
    mouseHelper.path = [];
  }

  if (!mouseHelper.target) {
    if (mouseHelper.searchCooldown <= 0 || mouseHelper.mode !== "relocate" || mouseHelper.path.length === 0) {
      setMouseRelocationPath();
      mouseHelper.searchCooldown = 0.75;
    }
    if (mouseHelper.path.length > 0) {
      followMousePath(dt, Math.max(0.35, getHelperSpeedMultiplier("mouse")));
      return;
    }
    moveMouseToward(miner.x - 22, miner.y + 18, dt, Math.max(0.35, getHelperSpeedMultiplier("mouse")));
    return;
  }

  const tx = mouseHelper.target.x * TILE + TILE / 2;
  const ty = mouseHelper.target.y * TILE + TILE / 2;
  if (Math.hypot(tx - mouseHelper.x, ty - mouseHelper.y) > TILE * 0.72) {
    moveMouseToward(tx, ty, dt);
    return;
  }

  mouseDrill(mouseHelper.target.x, mouseHelper.target.y);
}

function setMouseRelocationPath() {
  const start = getNearestOpenTile(getMouseTile());
  if (!start) {
    mouseHelper.path = [];
    mouseHelper.mode = "relocate";
    return;
  }

  const destination = getMouseRelocationDestination(start);
  mouseHelper.path = destination ? findOpenPath(start, destination) : [];
  mouseHelper.mode = "relocate";
}

function ensureMouseInOpenTile() {
  const tile = getMouseTile();
  if (isOpenTile(tile.x, tile.y)) return;

  const open = getNearestOpenTile(tile, 18) ?? getNearestOpenTile({ x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) }, 18);
  if (!open) return;
  mouseHelper.x = open.x * TILE + TILE / 2;
  mouseHelper.y = open.y * TILE + TILE / 2;
  resetMouseNavigation("relocate");
}

function updateMouseStuckState(dt) {
  const moved = Math.hypot(mouseHelper.x - mouseHelper.lastX, mouseHelper.y - mouseHelper.lastY);
  const hasWork = !!mouseHelper.target || mouseHelper.mode === "relocate" || mouseHelper.mode === "flee";
  if (hasWork && moved < 0.2) {
    mouseHelper.stuckTimer += dt;
  } else {
    mouseHelper.stuckTimer = 0;
  }

  mouseHelper.lastX = mouseHelper.x;
  mouseHelper.lastY = mouseHelper.y;

  if (mouseHelper.stuckTimer < 1.6) return;
  const fallback = getNearestOpenTile(getMouseTile(), 18) ?? getNearestOpenTile({ x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) }, 18);
  if (fallback) {
    mouseHelper.x = fallback.x * TILE + TILE / 2;
    mouseHelper.y = fallback.y * TILE + TILE / 2;
  }
  resetMouseNavigation("relocate");
}

function resetMouseNavigation(mode = "idle") {
  mouseHelper.target = null;
  mouseHelper.path = [];
  mouseHelper.mode = mode;
  mouseHelper.searchCooldown = 0;
  mouseHelper.stuckTimer = 0;
  mouseHelper.lastX = mouseHelper.x;
  mouseHelper.lastY = mouseHelper.y;
}

function getMouseRelocationDestination(start) {
  const reachable = getReachableOpenTiles(start);
  let best = null;
  let bestScore = -Infinity;
  for (const key of reachable.keys()) {
    const [xText, yText] = key.split(",");
    const tile = { x: Number(xText), y: Number(yText) };
    if (isBaseTile(tile.x, tile.y)) continue;
    const visibleSolidNeighbors = countVisibleSolidNeighbors(tile.x, tile.y);
    const distanceFromMouse = Math.hypot(tile.x - start.x, tile.y - start.y);
    const distanceFromMiner = Math.hypot(tile.x - Math.floor(miner.x / TILE), tile.y - Math.floor(miner.y / TILE));
    const score = visibleSolidNeighbors * 8 + Math.min(distanceFromMouse, 18) - distanceFromMiner * 0.12 + Math.random() * 2;
    if (score > bestScore) {
      best = tile;
      bestScore = score;
    }
  }

  return best;
}

function countVisibleSolidNeighbors(x, y) {
  let count = 0;
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  for (const direction of directions) {
    const tx = x + direction.x;
    const ty = y + direction.y;
    if (world[ty]?.[tx] && isTileVisible(tx, ty)) count += 1;
  }
  return count;
}

function fleeMouseFromMonster(threat, dt) {
  mouseHelper.target = null;
  mouseHelper.drillCooldown = 0;
  const fleeTile = getFleeDestination(getMouseTile(), threat);
  setMousePathToTile(fleeTile.x, fleeTile.y, "flee");
  if (mouseHelper.path.length === 0) {
    nudgeMouseAwayFromThreat(threat, dt);
    return;
  }
  followMousePath(dt, Math.max(HELPER_FLEE_SPEED_MULTIPLIER, getHelperSpeedMultiplier("mouse")));
}

function findMouseTarget() {
  const originX = Math.floor(mouseHelper.x / TILE);
  const originY = Math.floor(mouseHelper.y / TILE);
  let best = null;
  let bestDistance = Infinity;

  for (let y = originY - 8; y <= originY + 8; y++) {
    for (let x = originX - 8; x <= originX + 8; x++) {
      const tile = world[y]?.[x];
      if (!tile || !isTileVisible(x, y)) continue;
      const distance = Math.hypot(x - originX, y - originY);
      if (distance < bestDistance) {
        best = { x, y };
        bestDistance = distance;
      }
    }
  }

  return best;
}

function setMousePathToTile(x, y, mode) {
  if (mouseHelper.mode === mode && mouseHelper.path.length > 0) return;
  const start = getNearestOpenTile(getMouseTile());
  const end = start ? getNearestReachableTile(start, { x, y }) : null;
  mouseHelper.path = start && end ? findOpenPath(start, end) : [];
  mouseHelper.mode = mode;
}

function followMousePath(dt, speedMultiplier = getHelperSpeedMultiplier("mouse")) {
  if (mouseHelper.path.length === 0) {
    moveMouseToward(BASE_CENTER_TILE_X * TILE, BASE_TILE_Y * TILE, dt, speedMultiplier);
    return;
  }

  const next = mouseHelper.path[0];
  const x = next.x * TILE + TILE / 2;
  const y = next.y * TILE + TILE / 2;
  moveMouseToward(x, y, dt, speedMultiplier);
  if (Math.hypot(mouseHelper.x - x, mouseHelper.y - y) < 3) mouseHelper.path.shift();
}

function getMouseTile() {
  return {
    x: Math.floor(mouseHelper.x / TILE),
    y: Math.floor(mouseHelper.y / TILE),
  };
}

function moveMouseToward(x, y, dt, speedMultiplier = getHelperSpeedMultiplier("mouse")) {
  const dx = x - mouseHelper.x;
  const dy = y - mouseHelper.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const speed = LEVEL_ONE_SPEED * speedMultiplier;
  const step = Math.min(distance, speed * dt);
  mouseHelper.x = clamp(mouseHelper.x + (dx / distance) * step, HELPER_RADIUS, COLS * TILE - HELPER_RADIUS);
  mouseHelper.y = clamp(mouseHelper.y + (dy / distance) * step, HELPER_RADIUS, ROWS * TILE - HELPER_RADIUS);
}

function mouseDrill(x, y) {
  if (mouseHelper.drillCooldown > 0) return;
  const tile = world[y]?.[x];
  if (!tile) {
    mouseHelper.target = null;
    return;
  }
  if (tile.unbreakable) {
    mouseHelper.target = null;
    return;
  }

  mouseHelper.drillCooldown = 0.42;
  tile.hp -= getMouseDrillDamage();
  tile.hitFlash = 0.12;
  if (tile.hp <= 0) {
    breakTile(x, y, tile, true);
    mouseHelper.target = null;
  }
}

function getVisibleMonsterThreat(helper) {
  return monsters.find((monster) => {
    if (monster.dormant) return false;
    const distance = Math.hypot(monster.x - helper.x, monster.y - helper.y);
    return distance <= HELPER_FEAR_RADIUS && hasLineOfSight(helper.x, helper.y, monster.x, monster.y);
  });
}

function hasLineOfSight(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (TILE / 4)));

  for (let i = 1; i < steps; i++) {
    const x = startX + (dx * i) / steps;
    const y = startY + (dy * i) / steps;
    const tileX = Math.floor(x / TILE);
    const tileY = Math.floor(y / TILE);
    if (isSolidTile(tileX, tileY)) return false;
  }

  return true;
}

function getFleeDestination(start, threat) {
  const openStart = getNearestOpenTile(start) ?? start;
  const reachable = getReachableOpenTiles(openStart);
  const threatTile = {
    x: Math.floor(threat.x / TILE),
    y: Math.floor(threat.y / TILE),
  };
  const awayX = openStart.x - threatTile.x;
  const awayY = openStart.y - threatTile.y;
  const awayLength = Math.hypot(awayX, awayY) || 1;
  let best = openStart;
  let bestScore = -Infinity;
  for (const key of reachable.keys()) {
    const [xText, yText] = key.split(",");
    const tile = { x: Number(xText), y: Number(yText) };
    if (isBaseTile(tile.x, tile.y)) continue;
    const path = reconstructPathFromMap(reachable, openStart, tile);
    if (doesPathApproachThreat(path, openStart, threat)) continue;

    const distanceFromThreat = Math.hypot(tile.x * TILE + TILE / 2 - threat.x, tile.y * TILE + TILE / 2 - threat.y);
    const distanceFromStart = Math.hypot(tile.x - openStart.x, tile.y - openStart.y);
    const tileAwayX = tile.x - openStart.x;
    const tileAwayY = tile.y - openStart.y;
    const awayScore = (tileAwayX * awayX + tileAwayY * awayY) / awayLength;
    const score = distanceFromThreat + awayScore * TILE * 2 - distanceFromStart * 2;
    if (score > bestScore) {
      best = tile;
      bestScore = score;
    }
  }

  return best;
}

function nudgeMouseAwayFromThreat(threat, dt) {
  const dx = mouseHelper.x - threat.x;
  const dy = mouseHelper.y - threat.y;
  const distance = Math.hypot(dx, dy) || 1;
  const step = LEVEL_ONE_SPEED * Math.max(HELPER_FLEE_SPEED_MULTIPLIER, getHelperSpeedMultiplier("mouse")) * dt;
  const candidates = [
    {
      x: mouseHelper.x + (dx / distance) * step,
      y: mouseHelper.y + (dy / distance) * step,
    },
    {
      x: mouseHelper.x + (dy / distance) * step,
      y: mouseHelper.y - (dx / distance) * step,
    },
    {
      x: mouseHelper.x - (dy / distance) * step,
      y: mouseHelper.y + (dx / distance) * step,
    },
  ];

  const next = candidates.find((candidate) => !isHelperBlockedAt(candidate.x, candidate.y));
  if (!next) return;
  mouseHelper.x = clamp(next.x, HELPER_RADIUS, COLS * TILE - HELPER_RADIUS);
  mouseHelper.y = clamp(next.y, HELPER_RADIUS, ROWS * TILE - HELPER_RADIUS);
}

function isHelperBlockedAt(x, y) {
  const checks = [
    [x - HELPER_RADIUS, y - HELPER_RADIUS],
    [x + HELPER_RADIUS, y - HELPER_RADIUS],
    [x - HELPER_RADIUS, y + HELPER_RADIUS],
    [x + HELPER_RADIUS, y + HELPER_RADIUS],
  ];

  return checks.some(([px, py]) => {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    return isSolidTile(tx, ty);
  });
}

function doesPathApproachThreat(path, start, threat) {
  if (path.length === 0) return false;
  const currentDistance = Math.hypot(start.x * TILE + TILE / 2 - threat.x, start.y * TILE + TILE / 2 - threat.y);
  const firstSteps = path.slice(0, Math.min(4, path.length));
  return firstSteps.some((tile, index) => {
    const distance = Math.hypot(tile.x * TILE + TILE / 2 - threat.x, tile.y * TILE + TILE / 2 - threat.y);
    return index < 2 && distance < currentDistance - TILE * 0.35;
  });
}

function updateDog(dt) {
  if (!relics.dog.unlocked) return;
  if (!dogHelper.initialized) {
    dogHelper.x = miner.x + 22;
    dogHelper.y = miner.y + 18;
    dogHelper.initialized = true;
  }
  ensureDogInOpenTile();

  const threat = getVisibleMonsterThreat(dogHelper);
  if (threat) {
    dogHelper.target = null;
    const fleeTile = getFleeDestination(getDogTile(), threat);
    setDogPathToTile(fleeTile.x, fleeTile.y, "flee", true);
    followDogPath(dt, Math.max(HELPER_FLEE_SPEED_MULTIPLIER, getHelperSpeedMultiplier("dog")));
    if (dogHelper.carried > 0 && Math.hypot(dogHelper.x - BASE_CENTER_TILE_X * TILE, dogHelper.y - BASE_TILE_Y * TILE) < TILE * 0.75) {
      depositDogCargo();
    }
    return;
  }

  const baseX = BASE_CENTER_TILE_X * TILE;
  const baseY = BASE_TILE_Y * TILE;
  const shouldDeposit = dogHelper.carried >= dogHelper.maxCarry || (dogHelper.carried > 0 && pickups.length === 0);

  if (shouldDeposit) {
    setDogPathToTile(BASE_CENTER_TILE_X, BASE_TILE_Y, "base", true);
    followDogPath(dt);
    if (Math.hypot(dogHelper.x - baseX, dogHelper.y - baseY) < TILE * 0.75) depositDogCargo();
    return;
  }

  if (!dogHelper.target || !pickups.includes(dogHelper.target) || dogHelper.mode !== "pickup") {
    const target = findDogPickup();
    dogHelper.target = target?.pickup ?? null;
    dogHelper.path = target?.path ?? [];
    dogHelper.mode = dogHelper.target ? "pickup" : "idle";
  }

  if (!dogHelper.target) {
    const followTile = getNearestReachableTile(getDogTile(), { x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) });
    if (followTile) setDogPathToTile(followTile.x, followTile.y, "idle");
    followDogPath(dt);
    return;
  }

  followDogPath(dt);
  if (canDogReachPickup(dogHelper.target)) {
    collectDogPickup(dogHelper.target);
    dogHelper.target = null;
    dogHelper.path = [];
    dogHelper.mode = "idle";
  } else if (dogHelper.path.length === 0) {
    dogHelper.target = null;
    dogHelper.mode = "idle";
  }
}

function canDogReachPickup(pickup) {
  const distance = Math.hypot(dogHelper.x - pickup.x, dogHelper.y - pickup.y);
  if (distance < TILE * 0.7) return true;

  const dogTile = getDogTile();
  const pickupTile = { x: Math.floor(pickup.x / TILE), y: Math.floor(pickup.y / TILE) };
  return dogTile.x === pickupTile.x && dogTile.y === pickupTile.y;
}

function findDogPickup() {
  let best = null;
  let bestPath = [];
  let bestLength = Infinity;
  const start = getNearestOpenTile(getDogTile());
  if (!start) return null;
  const reachable = getReachableOpenTiles(start);

  for (const pickup of pickups) {
    if (pickup.type === "idol") continue;
    if (!isPickupVisible(pickup)) continue;
    const end = getNearestReachableTileFromMap(reachable, {
      x: Math.floor(pickup.x / TILE),
      y: Math.floor(pickup.y / TILE),
    });
    if (!end) continue;
    const path = reconstructPathFromMap(reachable, start, end);
    if (path.length > 0 && path.length < bestLength) {
      best = pickup;
      bestPath = path;
      bestLength = path.length;
    }
  }

  return best ? { pickup: best, path: bestPath } : null;
}

function setDogPathToTile(x, y, mode, force = false) {
  if (dogHelper.mode === mode && dogHelper.path.length > 0) return;
  const start = getNearestOpenTile(getDogTile());
  const end = start ? getNearestReachableTile(start, { x, y }) : null;
  dogHelper.path = start && end ? findOpenPath(start, end) : [];
  dogHelper.mode = mode;
  if (force && dogHelper.path.length === 0 && start) {
    dogHelper.x = start.x * TILE + TILE / 2;
    dogHelper.y = start.y * TILE + TILE / 2;
  }
}

function followDogPath(dt, speedMultiplier = getHelperSpeedMultiplier("dog")) {
  if (dogHelper.path.length === 0) return;
  const next = dogHelper.path[0];
  const x = next.x * TILE + TILE / 2;
  const y = next.y * TILE + TILE / 2;
  moveDogToward(x, y, dt, speedMultiplier);
  if (Math.hypot(dogHelper.x - x, dogHelper.y - y) < 3) dogHelper.path.shift();
}

function moveDogToward(x, y, dt, speedMultiplier = getHelperSpeedMultiplier("dog")) {
  const dx = x - dogHelper.x;
  const dy = y - dogHelper.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const speed = LEVEL_ONE_SPEED * speedMultiplier;
  const step = Math.min(distance, speed * dt);
  dogHelper.x += (dx / distance) * step;
  dogHelper.y += (dy / distance) * step;
}

function getDogTile() {
  return {
    x: Math.floor(dogHelper.x / TILE),
    y: Math.floor(dogHelper.y / TILE),
  };
}

function ensureDogInOpenTile() {
  const tile = getDogTile();
  if (isOpenTile(tile.x, tile.y)) return;

  const open = getNearestOpenTile(tile);
  if (!open) return;
  dogHelper.x = open.x * TILE + TILE / 2;
  dogHelper.y = open.y * TILE + TILE / 2;
  dogHelper.path = [];
  dogHelper.mode = "idle";
}

function getNearestOpenTile(origin, maxRadius = 12) {
  if (isOpenTile(origin.x, origin.y)) return origin;

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let y = origin.y - radius; y <= origin.y + radius; y++) {
      for (let x = origin.x - radius; x <= origin.x + radius; x++) {
        if (Math.max(Math.abs(origin.x - x), Math.abs(origin.y - y)) !== radius) continue;
        if (isOpenTile(x, y)) return { x, y };
      }
    }
  }

  return null;
}

function getReachableOpenTiles(start) {
  const queue = [start];
  const cameFrom = new Map([[`${start.x},${start.y}`, null]]);
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = `${next.x},${next.y}`;
      if (cameFrom.has(key) || !isOpenTile(next.x, next.y)) continue;
      cameFrom.set(key, current);
      queue.push(next);
    }
  }

  return cameFrom;
}

function getNearestReachableTile(start, target, maxRadius = 12) {
  const reachable = getReachableOpenTiles(start);
  return getNearestReachableTileFromMap(reachable, target, maxRadius);
}

function getNearestReachableTileFromMap(reachable, target, maxRadius = 12) {
  const directKey = `${target.x},${target.y}`;
  if (reachable.has(directKey)) return target;

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let y = target.y - radius; y <= target.y + radius; y++) {
      for (let x = target.x - radius; x <= target.x + radius; x++) {
        if (Math.max(Math.abs(target.x - x), Math.abs(target.y - y)) !== radius) continue;
        if (reachable.has(`${x},${y}`)) return { x, y };
      }
    }
  }

  return null;
}

function reconstructPathFromMap(reachable, start, end) {
  const path = [];
  let current = end;
  while (current && !(current.x === start.x && current.y === start.y)) {
    path.unshift(current);
    current = reachable.get(`${current.x},${current.y}`);
  }
  return path;
}

function findOpenPath(start, end) {
  if (!isOpenTile(start.x, start.y) || !isOpenTile(end.x, end.y)) return [];

  const queue = [start];
  const cameFrom = new Map([[`${start.x},${start.y}`, null]]);
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.x === end.x && current.y === end.y) break;

    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = `${next.x},${next.y}`;
      if (cameFrom.has(key) || !isOpenTile(next.x, next.y)) continue;
      cameFrom.set(key, current);
      queue.push(next);
    }
  }

  const endKey = `${end.x},${end.y}`;
  if (!cameFrom.has(endKey)) return [];

  const path = [];
  let current = end;
  while (current && !(current.x === start.x && current.y === start.y)) {
    path.unshift(current);
    current = cameFrom.get(`${current.x},${current.y}`);
  }
  return path;
}

function isOpenTile(x, y) {
  return x >= 0 && y >= 0 && x < COLS && y < ROWS && !isSolidTile(x, y);
}

function isSolidTile(x, y) {
  return x < 0 || y < 0 || x >= COLS || y >= ROWS || !!world[y]?.[x];
}

function collectDogPickup(pickup) {
  if (pickup.type === "idol") return;
  if (dogHelper.carried >= dogHelper.maxCarry) return;
  const index = pickups.indexOf(pickup);
  if (index < 0) return;

  dogHelper.cargo[pickup.type] += 1;
  dogHelper.carried += 1;
  pickups.splice(index, 1);
}

function dropDogCargo() {
  if (dogHelper.carried <= 0) return;

  const dogTile = getDogTile();
  const dropTile = getNearestOpenTile(dogTile) ?? dogTile;
  const tileX = dropTile.x;
  const tileY = dropTile.y;
  let dropped = 0;
  for (const [type, amount] of Object.entries(dogHelper.cargo)) {
    for (let i = 0; i < amount; i++) {
      const offset = getPileOffset(dropped, dogHelper.carried);
      pickups.push({
        type,
        x: tileX * TILE + TILE / 2 + offset.x,
        y: tileY * TILE + TILE - 7 + offset.y,
        rotation: Math.random() * 0.28 - 0.14,
      });
      dropped += 1;
    }
    dogHelper.cargo[type] = 0;
  }
  dogHelper.carried = 0;
}

function depositDogCargo() {
  if (dogHelper.carried <= 0) return;
  for (const [type, amount] of Object.entries(dogHelper.cargo)) {
    resources[type] += amount;
    dogHelper.cargo[type] = 0;
  }
  dogHelper.carried = 0;
  dogHelper.path = [];
  dogHelper.mode = "idle";
  setMessage("Dog delivered resources.");
}

function updateFlares(dt) {
  for (let i = flares.length - 1; i >= 0; i--) {
    flares[i].timeLeft -= dt;
    if (flares[i].timeLeft <= 0) flares.splice(i, 1);
  }
}

function updateTileEffects(dt) {
  for (const row of world) {
    for (const tile of row) {
      if (tile?.hitFlash) tile.hitFlash = Math.max(0, tile.hitFlash - dt);
    }
  }
}

function updateFeedbackEffects(dt) {
  for (let i = feedbackEffects.length - 1; i >= 0; i--) {
    const effect = feedbackEffects[i];
    effect.life -= dt;
    effect.x += effect.vx * dt;
    effect.y += effect.vy * dt;
    if (effect.life <= 0) feedbackEffects.splice(i, 1);
  }
}

function updateSpecialRoomEffects(dt) {
  for (const room of specialRooms) {
    if (room.kind === "vein" && room.described) updateVeinRoom(room, dt);
    if (room.kind === "monsterSpawner" && room.described) updateMonsterSpawnerRoom(room, dt);
    if (room.kind === "poison") updatePoisonRoomMonsterDamage(room, dt);

    if (!isMinerInRoom(room)) continue;
    describeSpecialRoom(room);
    wakeRoomMonsters(room);

    if (room.kind === "spring") {
      healAtSpring(dt);
    } else if (room.kind === "hullUpgrade") {
      collectHullUpgrade(room);
    } else if (room.kind === "poison") {
      updatePoisonRoom(room);
    } else if (room.kind === "alarm") {
      triggerAlarmRoom(room);
    } else if (room.kind === "teleporter") {
      teleportMinerToBase();
    }
  }
}

function describeSpecialRoom(room) {
  if (room.described) return;
  room.described = true;
  if (!room.description) return;
  showRoomToast(room);
  setMessage(room.description);
}

function showRoomToast(room) {
  const toast = document.querySelector("#roomToast");
  if (!toast) return;

  document.querySelector("#roomToastKicker").textContent = "Special room";
  document.querySelector("#roomToastTitle").textContent = room.title ?? getRoomTitle(room);
  document.querySelector("#roomToastDescription").textContent = room.description;

  toast.hidden = false;
  toast.classList.remove("is-visible");
  void toast.offsetWidth;
  toast.classList.add("is-visible");

  window.clearTimeout(roomToastTimer);
  roomToastTimer = window.setTimeout(() => {
    toast.hidden = true;
    toast.classList.remove("is-visible");
  }, 4200);
}

function getRoomTitle(room) {
  if (room.kind === "spring") return "Healing Spring";
  if (room.kind === "hullUpgrade") return "Hull Reinforcement";
  if (room.kind === "poison") return "Poison Gas";
  if (room.kind === "vein") return room.title || "Resource Vein";
  if (room.kind === "monsterSpawner") return "Monster Spawn";
  if (room.kind === "alarm") return "Warning System";
  if (room.kind === "idol") return "Idol Room";
  if (room.kind === "teleporter") return "Teleporter";
  if (room.kind === "monster") return "Monster Room";
  if (room.kind === "treasure") return "Treasure Room";
  return "Hidden Room";
}

function updateVeinRoom(room, dt) {
  room.spawnTimer += dt;
  if (room.spawnTimer < VEIN_ROOM_SPAWN_INTERVAL) return;

  room.spawnTimer = 0;
  dropRoomResource(room.resource ?? "gold", room.x, room.y);
  setMessage(`${getResourceName(room.resource ?? "gold")} formed in the vein room.`);
}

function updateMonsterSpawnerRoom(room, dt) {
  room.spawnTimer += dt;
  if (room.spawnTimer < monsterSpawnInterval) return;

  room.spawnTimer = 0;
  spawnRoomMonsterIn(room, getMonsterSpawnLevel());
  setMessage("The spawn room called another monster.");
}

function triggerAlarmRoom(room) {
  if (room.used) return;
  room.used = true;
  for (let i = 0; i < 5; i++) spawnMonster(getMonsterSpawnLevel() + 1, { ignoreLimit: true });
  setMessage("Alarm triggered. Five stronger monsters heard the call.");
}

function updatePoisonRoomMonsterDamage(room, dt) {
  room.poisonTimer += dt;
  if (room.poisonTimer < POISON_ROOM_MONSTER_TICK_INTERVAL) return;

  room.poisonTimer = 0;
  for (const monster of [...monsters]) {
    if (monster.dormant || !isMonsterInRoom(monster, room)) continue;
    damageMonster(monster, POISON_ROOM_MONSTER_DAMAGE);
  }
}

function isMonsterInRoom(monster, room) {
  const tileX = Math.floor(monster.x / TILE);
  const tileY = Math.floor(monster.y / TILE);
  return tileX >= room.startX && tileX < room.startX + room.width && tileY >= room.startY && tileY < room.startY + room.height;
}

function teleportMinerToBase() {
  miner.x = BASE_CENTER_TILE_X * TILE;
  miner.y = BASE_TILE_Y * TILE;
  miner.vx = 0;
  miner.vy = 0;
  setMessage("Teleporter snapped you back to base.");
  updateCamera();
}

function wakeRoomMonsters(room) {
  const waking = monsters.filter((monster) => monster.dormant && monster.roomLabel === room.label);
  if (waking.length === 0) return;

  for (const monster of waking) {
    monster.dormant = false;
    monster.repathTimer = 0;
    monster.attackCooldown = 0.35;
  }
  setMessage(`${room.contents || "Room"} awakened.`);
}

function isMinerInRoom(room) {
  const tileX = Math.floor(miner.x / TILE);
  const tileY = Math.floor(miner.y / TILE);
  return tileX >= room.startX && tileX < room.startX + room.width && tileY >= room.startY && tileY < room.startY + room.height;
}

function healAtSpring(dt) {
  if (miner.health >= miner.maxHealth) return;
  const previousHealth = miner.health;
  miner.health = Math.min(miner.maxHealth, miner.health + miner.maxHealth * HEALING_SPRING_RATE * dt);
  if (miner.health > previousHealth) spawnHealingFeedback(dt);
}

function collectHullUpgrade(room) {
  if (room.used) return;
  if (miner.maxHealth >= MAX_HULL_UPGRADE_HEALTH) {
    room.used = true;
    setMessage("Hull reinforcement already installed.");
    return;
  }

  const previousMaxHealth = miner.maxHealth;
  miner.maxHealth = Math.min(MAX_HULL_UPGRADE_HEALTH, miner.maxHealth + HULL_UPGRADE_ROOM_BONUS);
  miner.health = Math.min(miner.maxHealth, miner.health + (miner.maxHealth - previousMaxHealth));
  room.used = true;
  setMessage("The alien gel hardened the hull. Maximum integrity increased.");
}

function updatePoisonRoom(room) {
  if (miner.poisoned) return;
  miner.poisoned = true;
  miner.poisonTimer = 0;
  setMessage("Poison exposure: lose 1 hull every 10 seconds.");
}

function updatePoisonEffect(dt) {
  if (!miner.poisoned) return;
  miner.poisonTimer += dt;
  if (miner.poisonTimer < POISON_ROOM_TICK_INTERVAL) return;

  miner.poisonTimer -= POISON_ROOM_TICK_INTERVAL;
  miner.health = Math.max(0, miner.health - POISON_ROOM_HULL_DAMAGE);
  spawnPoisonStrike();
  playPoisonDamageSound();
  if (miner.health <= 0) {
    setMessage("Poison breached the hull.");
    triggerGameOver();
    return;
  }
  setMessage("Poison dealt 1 hull damage.");
}

function moveMiner(dx, dy, dt) {
  const nextX = clamp(miner.x + dx, miner.radius, COLS * TILE - miner.radius);
  const nextY = clamp(miner.y + dy, miner.radius, ROWS * TILE - miner.radius);
  const currentMonster = findMonsterAt(miner.x, miner.y, miner.radius);
  const monster = findMonsterAt(nextX, nextY, miner.radius);
  if (monster) {
    if (isDrillingTowardMonster(monster, dx, dy)) {
      drillMonster(monster);
      applyDrillBounce(dx, dy);
    } else if (monster === currentMonster && isMovingAwayFromMonster(monster, dx, dy) && !findCollision(nextX, nextY)) {
      miner.x = nextX;
      miner.y = nextY;
      separateMinerFromMonster(monster);
    }
    return;
  }
  const hit = findCollision(nextX, nextY);

  if (!hit) {
    miner.x = nextX;
    miner.y = nextY;
    return;
  }

  const drillResult = drill(hit.x, hit.y);
  if (drillResult === "broke") {
    moveIfOpen(nextX, nextY);
    return;
  }
  if (drillResult === "hit") {
    miner.health = Math.max(0, miner.health - 0.35);
    applyDrillBounce(dx, dy);
  }
  if (drillResult === "blocked") {
    slideAlongBlock(nextX, nextY, dx, dy);
    return;
  }
  slideAlongBlock(nextX, nextY, dx, dy);
}

function applyDrillBounce(dx, dy) {
  const force = Math.hypot(dx, dy);
  if (force <= 0) return;

  const bounce = 6;
  const bounceX = clamp(miner.x - (dx / force) * bounce, miner.radius, COLS * TILE - miner.radius);
  const bounceY = clamp(miner.y - (dy / force) * bounce, miner.radius, ROWS * TILE - miner.radius);
  moveIfOpen(bounceX, bounceY) || moveIfOpen(bounceX, miner.y) || moveIfOpen(miner.x, bounceY);
}

function slideAlongBlock(nextX, nextY, dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    moveIfOpen(miner.x, nextY);
  } else {
    moveIfOpen(nextX, miner.y);
  }
}

function moveIfOpen(x, y) {
  if (findCollision(x, y)) return false;
  miner.x = x;
  miner.y = y;
  return true;
}

function drillMonster(monster) {
  if (miner.drillCooldown > 0 || miner.health <= 0) return;
  miner.drillCooldown = 0.42;
  miner.health = Math.max(0, miner.health - miner.maxHealth * 0.05);
  damageMonster(monster, miner.power * getDamageMultiplier());
  if (miner.health <= 0) triggerGameOver();
}

function isDrillingTowardMonster(monster, dx, dy) {
  const inputForce = Math.hypot(dx, dy);
  if (inputForce <= 0) return false;

  const toMonsterX = monster.x - miner.x;
  const toMonsterY = monster.y - miner.y;
  const monsterDistance = Math.hypot(toMonsterX, toMonsterY);
  if (monsterDistance <= 0) return false;

  const moveX = dx / inputForce;
  const moveY = dy / inputForce;
  const targetX = toMonsterX / monsterDistance;
  const targetY = toMonsterY / monsterDistance;
  return moveX * targetX + moveY * targetY > 0.72;
}

function isMovingAwayFromMonster(monster, dx, dy) {
  const inputForce = Math.hypot(dx, dy);
  if (inputForce <= 0) return false;

  const awayX = miner.x - monster.x;
  const awayY = miner.y - monster.y;
  const awayLength = Math.hypot(awayX, awayY) || 1;
  return (dx / inputForce) * (awayX / awayLength) + (dy / inputForce) * (awayY / awayLength) > 0.12;
}

function separateMinerFromMonster(monster) {
  const dx = miner.x - monster.x;
  const dy = miner.y - monster.y;
  const distance = Math.hypot(dx, dy) || 1;
  const targetDistance = miner.radius + monster.radius + 2;
  if (distance >= targetDistance) return true;

  const push = targetDistance - distance;
  const nextX = clamp(miner.x + (dx / distance) * push, miner.radius, COLS * TILE - miner.radius);
  const nextY = clamp(miner.y + (dy / distance) * push, miner.radius, ROWS * TILE - miner.radius);
  return moveIfOpen(nextX, nextY) || moveIfOpen(nextX, miner.y) || moveIfOpen(miner.x, nextY);
}

function findMonsterAt(x, y, radius = 0) {
  return monsters.find((monster) => !monster.dormant && Math.hypot(monster.x - x, monster.y - y) <= monster.radius + radius);
}

function damageTile(x, y, amount, flash = 0.18, quiet = false) {
  const tile = world[y]?.[x];
  if (!tile) return false;
  if (tile.unbreakable) {
    tile.hitFlash = flash;
    if (!quiet) setMessage("Unbreakable formation.");
    return false;
  }

  tile.hp -= amount;
  tile.hitFlash = flash;
  if (tile.hp <= 0) {
    breakTile(x, y, tile, quiet);
    return true;
  }
  return false;
}

function damageMonster(monster, amount) {
  monster.hp -= amount;
  monster.hitFlash = 0.18;
  if (monster.hp <= 0) {
    playMonsterDeathScreamSound(monster);
    const index = monsters.indexOf(monster);
    if (index >= 0) monsters.splice(index, 1);
    dropMonsterLoot(monster);
    setMessage("Monster defeated.");
  }
}

function dropMonsterLoot(monster) {
  if (monster.loot === "none") return;
  const tileX = Math.floor(monster.x / TILE);
  const tileY = Math.floor(monster.y / TILE);
  dropResource(monster.loot ?? "alienCarapace", tileX, tileY, 1);
}

function findCollision(x, y) {
  const checks = [
    [x - miner.radius, y - miner.radius],
    [x + miner.radius, y - miner.radius],
    [x - miner.radius, y + miner.radius],
    [x + miner.radius, y + miner.radius],
  ];

  for (const [px, py] of checks) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (world[ty]?.[tx]) return { x: tx, y: ty };
  }
  return null;
}

function drill(x, y) {
  const tile = world[y]?.[x];
  if (!tile) return false;
  if (miner.drillCooldown > 0) return false;
  if (miner.health <= 0) {
    setMessage("Hull is fully damaged. Return to base for repairs.");
    return false;
  }
  if (tile.unbreakable) {
    tile.hitFlash = 0.2;
    playClinkSound();
    return "blocked";
  }

  miner.drillCooldown = 0.42;
  tile.hp -= miner.power * getDamageMultiplier();
  tile.hitFlash = 0.2;
  if (tile.hp > 0) {
    playDigSound("hit");
    return "hit";
  }

  breakTile(x, y, tile);
  playDigSound("break");
  return "broke";
}

function breakTile(x, y, tile, quiet = false) {
  world[y][x] = null;
  revealAround(x, y, getOpenRevealRadius());
  if (tile.relic) {
    unlockRandomRelic();
  } else if (tile.ore) {
    dropResource(tile.ore.type, x, y, tile.ore.yield);
  } else if (!quiet) {
    setMessage("Dirt cleared.");
  }
}

function unlockRandomRelic() {
  const relicTypes = Object.keys(relicDefs).filter((type) => !relics[type].unlocked);
  if (relicTypes.length === 0) {
    setMessage("Relic cache empty.");
    return;
  }
  const type = relicTypes[Math.floor(Math.random() * relicTypes.length)];
  unlockRelic(type);
}

function unlockRelic(type) {
  const relic = relics[type];
  relic.unlocked = true;
  relic.cooldown = 0;
  if (type === "mouse") resetMouseHelper();
  if (type === "dog") resetDogHelper();
  if (type === "thirdEye") expandExistingReveals();
  if (type === "laserSword") relic.swings = getLaserSwordMaxSwings();
  setMessage(`Ancient Relic "${relicDefs[type].label}" found!`);
  showRelicToast(type);
}

function dropResource(type, tileX, tileY, amount = 1) {
  for (let i = 0; i < amount; i++) {
    const offset = getPileOffset(i, amount);
    pickups.push({
      type,
      x: tileX * TILE + TILE / 2 + offset.x,
      y: tileY * TILE + TILE - 7 + offset.y,
      rotation: Math.random() * 0.28 - 0.14,
    });
  }
  setMessage(`${amount} ${type} dropped.`);
}

function getPileOffset(index, amount) {
  if (amount <= 1) return { x: 0, y: 0 };
  const spacing = 7;
  const centeredIndex = index - (amount - 1) / 2;
  return {
    x: centeredIndex * spacing,
    y: Math.abs(centeredIndex) % 2 === 0 ? 0 : 2,
  };
}

function collectPickups() {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pickup = pickups[i];
    if (!isPickupVisible(pickup)) continue;
    const distance = Math.hypot(miner.x - pickup.x, miner.y - pickup.y);
    if (distance > miner.radius + 12) continue;

    if (pickup.type === "idol") {
      collectIdolStatue(pickup, i);
      continue;
    }

    if (carried >= miner.capacity) {
      setMessage("Cargo full. Resources will wait here.");
      continue;
    }

    cargo[pickup.type] += 1;
    carried += 1;
    pickups.splice(i, 1);
    setMessage(`Picked up ${getResourceName(pickup.type)}.`);
  }
}

function collectIdolStatue(pickup, index) {
  if (idolStatue.carried || idolStatue.delivered) return;
  pickups.splice(index, 1);
  idolStatue.carried = true;
  miner.health = Math.max(0, miner.health - IDOL_BOULDER_DAMAGE);
  setMessage("You took the idol. A boulder rushed toward the pedestal and slammed the hull.");
  if (miner.health <= 0) triggerGameOver();
}

function updateTreasureChest(dt) {
  maybeShowTreasureInstructions();
  if (!treasureChest.placed || treasureChest.delivered || !treasureChest.carried) return;

  const facingLength = Math.hypot(miner.facingX, miner.facingY) || 1;
  const behindX = miner.x - (miner.facingX / facingLength) * 30;
  const behindY = miner.y - (miner.facingY / facingLength) * 30 + 6;
  const dx = behindX - treasureChest.x;
  const dy = behindY - treasureChest.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const step = Math.min(distance, Math.max(90, miner.speed * 1.15) * dt);
  treasureChest.x += (dx / distance) * step;
  treasureChest.y += (dy / distance) * step;
}

function maybeShowTreasureInstructions() {
  if (
    !treasureChest.placed ||
    treasureChest.delivered ||
    treasureChest.instructionsShown ||
    treasureChest.instructionsDismissed ||
    !isTreasureRoomDiscovered() ||
    !isTileVisible(treasureChest.tileX, treasureChest.tileY)
  ) {
    return;
  }

  const minerTileX = Math.floor(miner.x / TILE);
  const minerTileY = Math.floor(miner.y / TILE);
  const inRoomZ = Math.abs(minerTileX - treasureChest.tileX) <= 2 && Math.abs(minerTileY - treasureChest.tileY) <= 2;
  if (!inRoomZ) return;

  treasureChest.instructionsShown = true;
  document.querySelector("#treasureBubble").hidden = false;
}

function hideTreasureInstructions(dismiss = false) {
  const bubble = document.querySelector("#treasureBubble");
  if (bubble) bubble.hidden = true;
  if (dismiss) treasureChest.instructionsDismissed = true;
}

function tryPickupTreasure() {
  if (!canPickupTreasure()) return false;
  treasureChest.carried = true;
  treasureChest.hover = false;
  hideTreasureInstructions();
  setMessage("Treasure chest secured. Drag it back to base!");
  return true;
}

function dropTreasure() {
  if (!treasureChest.carried || treasureChest.delivered) return false;
  releaseTreasureAt(miner.x - miner.facingX * 22, miner.y - miner.facingY * 22 + 8);
  setMessage("Treasure chest dropped.");
  return true;
}

function releaseTreasureAt(x, y) {
  treasureChest.carried = false;
  treasureChest.x = clamp(x, 0, COLS * TILE - 1);
  treasureChest.y = clamp(y, 0, ROWS * TILE - 1);
  treasureChest.tileX = clamp(Math.floor(treasureChest.x / TILE), 0, COLS - 1);
  treasureChest.tileY = clamp(Math.floor(treasureChest.y / TILE), 0, ROWS - 1);
  treasureChest.hover = false;
}

function toggleTreasureCarry() {
  return treasureChest.carried ? dropTreasure() : tryPickupTreasure();
}

function canPickupTreasure() {
  if (!treasureChest.placed || treasureChest.carried || treasureChest.delivered) return false;
  if (!isTreasureRoomDiscovered()) return false;
  if (!isTileVisible(treasureChest.tileX, treasureChest.tileY)) return false;
  return Math.hypot(miner.x - treasureChest.x, miner.y - treasureChest.y) <= TILE * 1.25;
}

function updateTreasureHover(event) {
  if (!treasureChest.placed || treasureChest.carried || treasureChest.delivered) {
    treasureChest.hover = false;
    canvas.style.cursor = "";
    return;
  }

  const point = getCanvasWorldPoint(event);
  treasureChest.hover = isTreasurePoint(point.x, point.y) && canPickupTreasure();
  canvas.style.cursor = treasureChest.hover ? "pointer" : "";
}

function isTreasurePoint(x, y) {
  return Math.abs(x - treasureChest.x) <= 15 && Math.abs(y - treasureChest.y) <= 12;
}

function getCanvasWorldPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = getCameraScale();
  return {
    x: (event.clientX - rect.left) / scale + camera.x,
    y: (event.clientY - rect.top) / scale + camera.y,
  };
}

function handleBase(dt) {
  if (!isMinerAtBase()) return;

  if (treasureChest.carried && !treasureChest.delivered) {
    triggerWin();
    return;
  }

  if (idolStatue.carried && !idolStatue.delivered) {
    idolStatue.carried = false;
    idolStatue.delivered = true;
    resources.gold += 5;
    resources.diamond += 5;
    setMessage("Idol secured. Gained 5 Gold and 5 Diamond.");
  }

  if (carried > 0) {
    const secured = carried;
    for (const [type, amount] of Object.entries(cargo)) {
      resources[type] += amount;
      cargo[type] = 0;
    }
    carried = 0;
    setMessage(`Secured ${secured} resources in storage.`);
  }

  if (miner.health < miner.maxHealth) {
    miner.health = Math.min(miner.maxHealth, miner.health + miner.maxHealth * 0.02 * dt);
  }
}

function isMinerAtBase() {
  return miner.y < SURFACE_ROWS * TILE && miner.x > BASE_MIN_TILE_X * TILE && miner.x < (BASE_MAX_TILE_X + 1) * TILE;
}

function buyUpgrade(type) {
  if (!isMinerAtBase()) {
    setMessage("Return to base to install upgrades.");
    return;
  }
  if (miner.upgrades[type] >= MAX_UPGRADE_LEVEL) {
    setMessage(`${upgradeDefs[type].label} is already max level.`);
    return;
  }

  const recipe = getUpgradeRecipe(type);
  if (!canAfford(recipe)) {
    setMessage(`Need ${formatRecipe(recipe)} for ${upgradeDefs[type].label}.`);
    return;
  }

  spendResources(recipe);
  applyUpgrade(type);
  increaseMaxHullFromUpgrade();
  setMessage(`${upgradeDefs[type].label} upgraded.`);
  updateHud();
}

function applyUpgrade(type) {
  if (miner.upgrades[type] >= MAX_UPGRADE_LEVEL) return;
  miner.upgrades[type] += 1;
  if (type === "power") miner.power += 1;
  if (type === "speed") miner.speed += 22;
  if (type === "capacity") miner.capacity += 3;
}

function increaseMaxHullFromUpgrade() {
  miner.maxHealth += HULL_MAX_PER_UPGRADE;
  miner.health = Math.min(miner.maxHealth, miner.health + HULL_MAX_PER_UPGRADE);
}

function activateRelic(type) {
  const relic = relics[type];
  const definition = relicDefs[type];
  const duration = getRelicDuration(type);
  const cooldown = getRelicCooldown(type);
  if (!relic.unlocked) {
    setMessage(`${definition.label} is still buried.`);
    return;
  }
  if (type === "blaster") {
    setMessage("Hold Space to fire the blaster.");
    return;
  }
  if (type === "mouse") {
    setMessage("Mouse is already digging on its own.");
    return;
  }
  if (type === "dog") {
    setMessage("Dog is already gathering resources.");
    return;
  }
  if (type === "thirdEye") {
    setMessage("3rd Eye permanently improves open-area reveal.");
    return;
  }
  if (type === "laserSword") {
    swingLaserSword();
    return;
  }
  if (type === "converter") {
    activateConverter();
    return;
  }
  if (relic.active > 0) {
    setMessage(`${definition.label} is already active.`);
    return;
  }
  if (relic.cooldown > 0) {
    setMessage(`${definition.label} is cooling down.`);
    return;
  }

  if (type === "flare" && !canPlaceRelicFlare()) return;

  if (type === "bomb") {
    detonateBomb();
  } else if (type === "rocket") {
    fireRocket();
  } else {
    relic.active = duration;
  }
  relic.cooldown = cooldown;
  if (type === "flare") placeRelicFlare(duration, getFlareRadius());
  if (type === "radiation") relic.tick = 0;
  setMessage(`${definition.label} activated.`);
}

function upgradeRelic(type) {
  const relic = relics[type];
  if (!relic.unlocked) {
    setMessage(`${relicDefs[type].label} is still buried.`);
    return;
  }
  if (!isMinerAtBase()) {
    setMessage("Return to base to upgrade relics.");
    return;
  }
  if (relic.level >= MAX_RELIC_LEVEL) {
    setMessage(`${relicDefs[type].label} is already max level.`);
    return;
  }

  const cost = getRelicUpgradeCost(type);
  if (resources.alienCarapace < cost.alienCarapace) {
    setMessage(`Need ${formatRecipe(cost)} to upgrade ${relicDefs[type].label}.`);
    return;
  }

  resources.alienCarapace -= cost.alienCarapace;
  const previousMaxHealth = getHelperMaxHealth(type);
  relic.level += 1;
  applyRelicUpgradeEffects(type, previousMaxHealth);
  setMessage(`${relicDefs[type].label} relic upgraded to Lv ${relic.level}.`);
  updateHud();
}

function getRelicUpgradeCost(type) {
  if (relics[type].level >= MAX_RELIC_LEVEL) return {};
  return {
    alienCarapace: Math.min(4, relics[type].level),
  };
}

const relicUpgradeDescriptions = {
  impact: ["Lasts +15s", "Damage x6", "Cooldown -30s"],
  speed: ["Lasts +15s", "Speed x3", "Cooldown -30s"],
  flare: ["Radius +3 tiles", "Lasts +20s", "Cooldown -30s"],
  blaster: ["Damage +1", "Damage +2", "Damage +4"],
  bomb: ["Damage scales harder", "Radius +3 tiles, more damage", "Cooldown -30s, strongest damage scaling"],
  mouse: ["Dig +1, HP +3", "Speed +1, HP +5", "HP +10"],
  dog: ["Cargo +1, speed +1, HP +4", "Speed +2, HP +8", "Cargo +1, speed +2, HP +14"],
  radiation: ["Lasts +10s", "Damage up", "Damage up, +10s, safe companions, cooldown -30s"],
  rocket: ["Damage x2", "Radius +3 tiles", "Cooldown -30s"],
  magnet: ["Radius +4 tiles", "Lasts +25s", "Cooldown -30s"],
  thirdEye: ["3x3 reveal radius", "4x4 reveal radius", "5x5 reveal radius"],
  laserSword: ["Damage +4", "Ammo +5 swings", "Cooldown -30s"],
  converter: ["Output +2 per unlocked resource, adds Silver", "Output +2 per unlocked resource, adds Gold", "Output +2 per unlocked resource, cooldown -30s"],
};

function getRelicUpgradeDescription(type) {
  if (relics[type].level >= MAX_RELIC_LEVEL) return "Max level";
  return relicUpgradeDescriptions[type]?.[relics[type].level - 1] ?? "Upgrade";
}

function getDamageMultiplier() {
  if (relics.impact.active <= 0) return 1;
  return relics.impact.level >= 3 ? 6 : 3;
}

function getSpeedMultiplier() {
  if (relics.speed.active <= 0) return 1;
  return relics.speed.level >= 3 ? 3 : 2;
}

function getRelicDuration(type) {
  const level = relics[type].level;
  if (type === "impact") return relicDefs.impact.duration + (level >= 2 ? 15 : 0);
  if (type === "speed") return relicDefs.speed.duration + (level >= 2 ? 15 : 0);
  if (type === "flare") return relicDefs.flare.duration + (level >= 3 ? 20 : 0);
  if (type === "radiation") return relicDefs.radiation.duration + (level >= 2 ? 10 : 0) + (level >= 4 ? 10 : 0);
  if (type === "magnet") return relicDefs.magnet.duration + (level >= 3 ? 25 : 0);
  return relicDefs[type].duration ?? 0;
}

function getRelicCooldown(type) {
  const base = relicDefs[type].cooldown ?? 0;
  if (!base) return 0;
  const level = relics[type].level;
  return level >= 4 ? Math.max(0, base - 30) : base;
}

function getOpenRevealRadius() {
  if (!relics.thirdEye.unlocked) return OPEN_VISIBILITY_RADIUS;
  return OPEN_VISIBILITY_RADIUS + relics.thirdEye.level;
}

function getFlareRadius() {
  return FLARE_VISIBILITY_RADIUS + (relics.flare.level >= 2 ? 3 : 0);
}

function getBlasterDamageBonus() {
  if (relics.blaster.level >= 4) return 4;
  if (relics.blaster.level >= 3) return 2;
  if (relics.blaster.level >= 2) return 1;
  return 0;
}

function getBombRadius() {
  return 3 + (relics.bomb.level >= 3 ? 3 : 0);
}

function getBombDamage() {
  const level = relics.bomb.level;
  const powerScale = 7 + level;
  const flatBonus = Math.max(0, level - 1) * 6;
  return miner.power * powerScale + flatBonus;
}

function getRadiationDamage() {
  if (relics.radiation.level >= 4) return LEVEL_ONE_DRILL_DAMAGE * 3;
  if (relics.radiation.level >= 3) return LEVEL_ONE_DRILL_DAMAGE * 2;
  return LEVEL_ONE_DRILL_DAMAGE;
}

function getRocketRadius() {
  return 3 + (relics.rocket.level >= 3 ? 3 : 0);
}

function getRocketDamage() {
  return ROCKET_DAMAGE * (relics.rocket.level >= 2 ? 2 : 1);
}

function getRocketMonsterDamage() {
  return ROCKET_MONSTER_DAMAGE * (relics.rocket.level >= 2 ? 2 : 1);
}

function getMagnetRadius() {
  return MAGNET_RADIUS + (relics.magnet.level >= 2 ? TILE * 4 : 0);
}

function getLaserSwordMaxSwings() {
  return 5 + (relics.laserSword.level >= 3 ? 5 : 0);
}

function getLaserSwordDamage() {
  const level = relics.laserSword.level;
  return 12 + Math.max(0, level - 1) * 4;
}

function getHelperSpeedMultiplier(type) {
  const relic = relics[type];
  let bonus = 0;
  if (type === "mouse" && relic.level >= 3) bonus += 0.1;
  if (type === "dog") bonus += Math.max(0, relic.level - 1) * 0.09;
  return HELPER_SPEED_MULTIPLIER + bonus;
}

function getMouseDrillDamage() {
  return LEVEL_ONE_DRILL_DAMAGE * 0.5 + (relics.mouse.level >= 2 ? 1 : 0);
}

function getDogCarryCapacity() {
  return 5 + (relics.dog.level >= 2 ? 1 : 0) + (relics.dog.level >= 4 ? 1 : 0);
}

function getHelperMaxHealth(type) {
  if (type === "mouse") {
    return 12 + (relics.mouse.level >= 2 ? 3 : 0) + (relics.mouse.level >= 3 ? 5 : 0) + (relics.mouse.level >= 4 ? 10 : 0);
  }
  if (type === "dog") {
    return 16 + (relics.dog.level >= 2 ? 4 : 0) + (relics.dog.level >= 3 ? 8 : 0) + (relics.dog.level >= 4 ? 14 : 0);
  }
  return null;
}

function applyRelicUpgradeEffects(type, previousMaxHealth) {
  if (type === "bomb" && relics.bomb.level === 4) {
    miner.power += 1;
    miner.speed += 22;
  }
  if (type === "mouse") {
    const nextMax = getHelperMaxHealth("mouse");
    mouseHelper.maxHealth = nextMax;
    mouseHelper.health = Math.min(nextMax, mouseHelper.health + Math.max(0, nextMax - previousMaxHealth));
  }
  if (type === "dog") {
    const nextMax = getHelperMaxHealth("dog");
    dogHelper.maxHealth = nextMax;
    dogHelper.maxCarry = getDogCarryCapacity();
    dogHelper.health = Math.min(nextMax, dogHelper.health + Math.max(0, nextMax - previousMaxHealth));
  }
  if (type === "thirdEye") {
    expandExistingReveals();
  }
  if (type === "laserSword") {
    relics.laserSword.swings = getLaserSwordMaxSwings();
  }
}

function repairBase() {
  if (!isMinerAtBase()) {
    setMessage("Return to base to repair the base.");
    return;
  }
  if (base.health >= base.maxHealth) {
    setMessage("Base is already fully repaired.");
    return;
  }
  if (resources.alienCarapace < BASE_REPAIR_CARAPACE_COST) {
    setMessage(`Need ${BASE_REPAIR_CARAPACE_COST} Alien Carapace to repair the base.`);
    return;
  }

  resources.alienCarapace -= BASE_REPAIR_CARAPACE_COST;
  base.health = Math.min(base.maxHealth, base.health + BASE_REPAIR_AMOUNT);
  setMessage(`Base repaired by ${BASE_REPAIR_AMOUNT} HP.`);
  updateHud();
}

function canPlaceRelicFlare() {
  const x = Math.floor(miner.x / TILE);
  const y = Math.floor(miner.y / TILE);
  if (world[y]?.[x]) {
    setMessage("Flare can only be used in open space.");
    return false;
  }

  if (flares.some((flare) => flare.x === x && flare.y === y)) {
    setMessage("There is already a flare here.");
    return false;
  }

  return true;
}

function placeRelicFlare(duration, radius) {
  flares.push({
    x: Math.floor(miner.x / TILE),
    y: Math.floor(miner.y / TILE),
    timeLeft: duration,
    radius,
  });
}

function fireRocket() {
  blasts.push({
    x: miner.x + miner.facingX * 16,
    y: miner.y + miner.facingY * 16,
    vx: miner.facingX * 520,
    vy: miner.facingY * 520,
    life: 1.15,
    damage: getRocketDamage(),
    monsterDamage: getRocketMonsterDamage(),
    radius: getRocketRadius(),
    kind: "rocket",
  });
}

function detonateBomb() {
  const centerX = Math.floor(miner.x / TILE);
  const centerY = Math.floor(miner.y / TILE);
  detonateAt(centerX, centerY, getBombRadius(), getBombDamage());
}

function detonateAt(centerX, centerY, radius, damage, options = {}) {
  explosions.push({
    x: centerX * TILE + TILE / 2,
    y: centerY * TILE + TILE / 2,
    radius,
    life: 0.42,
    maxLife: 0.42,
  });
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (Math.abs(centerX - x) + Math.abs(centerY - y) > radius) continue;
      revealAround(x, y, getOpenRevealRadius());
      const tile = world[y]?.[x];
      if (!tile) continue;
      if (tile.unbreakable) {
        tile.hitFlash = 0.25;
        continue;
      }
      tile.hp -= damage;
      tile.hitFlash = 0.25;
      if (tile.hp <= 0) breakTile(x, y, tile);
    }
  }

  for (const monster of [...monsters]) {
    const monsterX = Math.floor(monster.x / TILE);
    const monsterY = Math.floor(monster.y / TILE);
    if (Math.abs(centerX - monsterX) + Math.abs(centerY - monsterY) <= radius) {
      damageMonster(monster, options.monsterDamage ?? damage);
    }
  }

  damageBlastCompanions(centerX, centerY, radius, damage);
  if (options.damageMiner && isEntityInBlast(centerX, centerY, miner, radius)) {
    miner.health = Math.max(0, miner.health - damage);
    setMessage(miner.health <= 0 ? "Rocket blast breached the hull." : "Rocket blast damaged the hull.");
    if (miner.health <= 0) triggerGameOver();
  }
}

function damageBlastCompanions(centerX, centerY, radius, damage) {
  if (relics.mouse.unlocked && isEntityInBlast(centerX, centerY, mouseHelper, radius)) {
      damageHelper("mouse", damage, "blast");
  }
  if (relics.dog.unlocked && isEntityInBlast(centerX, centerY, dogHelper, radius)) {
      damageHelper("dog", damage, "blast");
  }
}

function isEntityInBlast(centerX, centerY, entity, radius) {
  const entityX = Math.floor(entity.x / TILE);
  const entityY = Math.floor(entity.y / TILE);
  return Math.abs(centerX - entityX) + Math.abs(centerY - entityY) <= radius;
}

function revealAround(centerX, centerY, radius) {
  const newlyRevealed = [];
  addRevealAround(centerX, centerY, radius, newlyRevealed);
  for (const tile of newlyRevealed) {
    revealOpenAreaFrom(tile.x, tile.y);
  }
}

function expandExistingReveals() {
  const openReveals = [...revealedTiles]
    .map((key) => {
      const [x, y] = key.split(",").map(Number);
      return { x, y };
    })
    .filter((tile) => !world[tile.y]?.[tile.x]);

  for (const tile of openReveals) {
    addRevealAround(tile.x, tile.y, getOpenRevealRadius());
  }
}

function addRevealAround(centerX, centerY, radius, newlyRevealed = null) {
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
      const key = `${x},${y}`;
      if (!revealedTiles.has(key) && newlyRevealed) newlyRevealed.push({ x, y });
      revealedTiles.add(key);
    }
  }
}

function revealOpenAreaFrom(startX, startY) {
  if (world[startY]?.[startX]) return;

  const queue = [{ x: startX, y: startY }];
  const visited = new Set();
  while (queue.length > 0 && visited.size < 180) {
    const current = queue.shift();
    const key = `${current.x},${current.y}`;
    if (visited.has(key) || world[current.y]?.[current.x]) continue;
    visited.add(key);
    addRevealAround(current.x, current.y, getOpenRevealRadius());
    [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ].forEach((neighbor) => {
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= COLS || neighbor.y >= ROWS) return;
      if (!visited.has(`${neighbor.x},${neighbor.y}`) && !world[neighbor.y]?.[neighbor.x]) queue.push(neighbor);
    });
  }
}

function getUpgradeRecipe(type) {
  if (miner.upgrades[type] >= MAX_UPGRADE_LEVEL) return {};
  const nextLevel = miner.upgrades[type] + 1;
  return upgradeDefs[type].recipe(nextLevel);
}

function canAfford(recipe) {
  return Object.entries(recipe).every(([type, amount]) => resources[type] >= amount);
}

function spendResources(recipe) {
  for (const [type, amount] of Object.entries(recipe)) {
    resources[type] -= amount;
  }
}

function formatRecipe(recipe) {
  return Object.entries(recipe)
    .filter(([, amount]) => amount > 0)
    .map(([type, amount]) => `${amount} ${getResourceName(type)}`)
    .join(", ");
}

function getResourceName(type) {
  return resourceNames[type] ?? type;
}

function updateCamera() {
  const viewWidth = getCameraViewWidth();
  const viewHeight = getCameraViewHeight();
  camera.x = clamp(miner.x - viewWidth / 2, 0, Math.max(0, COLS * TILE - viewWidth));
  camera.y = clamp(miner.y - viewHeight / 2, 0, Math.max(0, ROWS * TILE - viewHeight));
}

function getCameraScale() {
  return VIEW_W / (CAMERA_ZOOM_LEVELS[cameraZoomIndex] * TILE);
}

function getCameraViewWidth() {
  return VIEW_W / getCameraScale();
}

function getCameraViewHeight() {
  return VIEW_H / getCameraScale();
}

function updateMonsterSightingSounds() {
  for (const monster of monsters) {
    if (monster.dormant || monster.screamedOnScreen) continue;
    if (!isMonsterVisibleOnScreen(monster)) continue;
    monster.screamedOnScreen = true;
    playMonsterScreamSound(monster);
  }
}

function isMonsterVisibleOnScreen(monster) {
  const tileX = Math.floor(monster.x / TILE);
  const tileY = Math.floor(monster.y / TILE);
  if (!isTileVisible(tileX, tileY)) return false;
  const margin = monster.radius + 4;
  return (
    monster.x >= camera.x - margin &&
    monster.x <= camera.x + getCameraViewWidth() + margin &&
    monster.y >= camera.y - margin &&
    monster.y <= camera.y + getCameraViewHeight() + margin
  );
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.scale(getCameraScale(), getCameraScale());
  drawSky();
  drawTiles();
  drawSpecialRooms();
  drawFlares();
  drawMagnets();
  drawExplosions();
  drawRadiationBursts();
  drawSwordArcs();
  drawBlasts();
  drawPickups();
  drawTreasureChest();
  drawBase();
  drawMonsters();
  drawDog();
  drawMouse();
  drawMiner();
  drawFeedbackEffects();
  drawVignette();
  ctx.restore();
}

function drawSky() {
  const viewHeight = getCameraViewHeight();
  const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
  gradient.addColorStop(0, "#17272d");
  gradient.addColorStop(0.4, "#111417");
  gradient.addColorStop(1, "#08090a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, getCameraViewWidth(), viewHeight);
}

function drawTiles() {
  const viewWidth = getCameraViewWidth();
  const viewHeight = getCameraViewHeight();
  const startX = Math.floor(camera.x / TILE);
  const endX = Math.ceil((camera.x + viewWidth) / TILE);
  const startY = Math.floor(camera.y / TILE);
  const endY = Math.ceil((camera.y + viewHeight) / TILE);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world[y]?.[x];
      if (!isTileVisible(x, y)) {
        drawFogTile(x, y);
        continue;
      }
      if (!tile) continue;
      const sx = x * TILE - camera.x;
      const sy = y * TILE - camera.y;
      ctx.fillStyle = tile.color;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.24)";
      ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);

      if (tile.unbreakable) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.moveTo(sx + 7, sy + 16);
        ctx.lineTo(sx + 16, sy + 7);
        ctx.lineTo(sx + 25, sy + 16);
        ctx.lineTo(sx + 16, sy + 25);
        ctx.closePath();
        ctx.fill();
      }

      if (!tile.unbreakable && tile.hp < tile.maxHp) {
        drawBlockDamagePixels(sx, sy, 1 - tile.hp / tile.maxHp);
      }

      if (tile.ore) {
        ctx.fillStyle = tile.ore.color;
        ctx.beginPath();
        ctx.arc(sx + 10, sy + 11, 3.5, 0, Math.PI * 2);
        ctx.arc(sx + 22, sy + 21, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tile.relic) {
        drawRelicBlock(sx, sy, tile.relic);
      }

      if (tile.hitFlash > 0) {
        ctx.fillStyle = `rgba(255, 245, 198, ${tile.hitFlash * 2.8})`;
        ctx.fillRect(sx, sy, TILE, TILE);
      }
    }
  }
}

function drawBlockDamagePixels(x, y, damageRatio) {
  const stage = Math.min(4, Math.floor(clamp(damageRatio, 0, 0.999) * 5));
  paintBlockDamagePixels(ctx, x, y, stage);
}

function paintBlockDamagePixels(targetCtx, x, y, stage) {
  const spacing = [6, 4, 3, 2, 2][stage];
  const pixelSize = [1, 1, 1, 1, 2][stage];
  const alpha = [0.16, 0.2, 0.25, 0.3, 0.34][stage];

  targetCtx.fillStyle = `rgba(5, 5, 5, ${alpha})`;
  for (let py = 2; py < TILE - 2; py++) {
    for (let px = 2; px < TILE - 2; px++) {
      const chip = (px * 17 + py * 31 + px * py) % spacing === 0;
      const checker = stage >= 3 && (px + py) % 3 === 0;
      const heavy = stage >= 4 && (px * 3 + py * 5) % 5 === 0;
      if (!chip && !checker && !heavy) continue;
      targetCtx.fillRect(x + px, y + py, pixelSize, pixelSize);
    }
  }

  targetCtx.fillStyle = `rgba(255, 238, 184, ${alpha * 0.55})`;
  for (let py = 3; py < TILE - 3; py += spacing) {
    for (let px = 3; px < TILE - 3; px += spacing) {
      if ((px * 13 + py * 19) % 5 === 0) targetCtx.fillRect(x + px, y + py, 1, 1);
    }
  }
}

function drawSpecialRooms() {
  for (const room of specialRooms) {
    if (!isTileVisible(room.x, room.y)) continue;
    if (!room.described) continue;
    const left = room.startX * TILE - camera.x;
    const top = room.startY * TILE - camera.y;
    const width = room.width * TILE;
    const height = room.height * TILE;
    drawSpecialRoomContents(room, left, top, width, height);
  }
}

function drawSpecialRoomContents(room, left, top, width, height) {
  if (room.kind === "spring") {
    drawHealingSpring(left + width / 2, top + height / 2);
  } else if (room.kind === "hullUpgrade") {
    drawHullUpgradeSprite(left + width / 2, top + height / 2, room.used);
  } else if (room.kind === "poison") {
    drawPoisonRoom(left, top, width, height);
  } else if (room.kind === "vein") {
    drawVeinRoom(left, top, width, height, room.resource);
  } else if (room.kind === "monsterSpawner") {
    drawSpawnerRoom(left, top, width, height);
  } else if (room.kind === "alarm") {
    drawAlarmRoom(left, top, width, height, room.used);
  } else if (room.kind === "teleporter") {
    drawTeleporterRoom(left, top, width, height);
  }
}

function drawVeinRoom(left, top, width, height, resource) {
  const color = resourceColors[resource] ?? "#f2c45b";
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(left + width / 2, top + height / 2, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSpawnerRoom(left, top, width, height) {
  const pulse = 0.45 + Math.sin(performance.now() / 200) * 0.18;
  ctx.strokeStyle = `rgba(255, 122, 102, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(left + width / 2, top + height / 2, 14, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAlarmRoom(left, top, width, height, used) {
  ctx.fillStyle = used ? "rgba(255, 122, 102, 0.25)" : "rgba(242, 196, 91, 0.48)";
  ctx.beginPath();
  ctx.moveTo(left + width / 2, top + height / 2 - 14);
  ctx.lineTo(left + width / 2 + 12, top + height / 2 + 10);
  ctx.lineTo(left + width / 2 - 12, top + height / 2 + 10);
  ctx.closePath();
  ctx.fill();
}

function drawTeleporterRoom(left, top, width, height) {
  const pulse = 0.45 + Math.sin(performance.now() / 160) * 0.18;
  const x = left + width / 2;
  const y = top + height / 2;
  ctx.strokeStyle = `rgba(104, 214, 199, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHealingSpring(x, y) {
  const pulse = 0.7 + Math.sin(performance.now() / 220) * 0.18;
  ctx.fillStyle = `rgba(104, 214, 199, ${0.2 * pulse})`;
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#24343a";
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#68d6c7";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#86f0ff";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHullUpgradeSprite(x, y, used) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = used ? 0.42 : 1;
  ctx.fillStyle = "#f2c45b";
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(16, -8);
  ctx.lineTo(12, 15);
  ctx.lineTo(0, 22);
  ctx.lineTo(-12, 15);
  ctx.lineTo(-16, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#24343a";
  ctx.fillRect(-4, -8, 8, 19);
  ctx.fillRect(-10, -2, 20, 7);
  ctx.restore();
}

function drawPoisonRoom(left, top, width, height) {
  const time = performance.now() / 500;
  ctx.fillStyle = "rgba(157, 255, 91, 0.08)";
  for (let i = 0; i < 8; i++) {
    const x = left + ((i * 29 + Math.sin(time + i) * 8) % width);
    const y = top + ((i * 17 + Math.cos(time * 0.8 + i) * 7 + height) % height);
    ctx.beginPath();
    ctx.arc(x, y, 10 + (i % 3) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#d8c6a4";
  drawAlienBones(left + width * 0.32, top + height * 0.68);
  drawAlienBones(left + width * 0.66, top + height * 0.38);
}

function drawAlienBones(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.35);
  ctx.fillRect(-12, -2, 24, 4);
  ctx.beginPath();
  ctx.arc(-14, 0, 5, 0, Math.PI * 2);
  ctx.arc(14, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRelicBlock(x, y) {
  const pulse = 0.55 + Math.sin(performance.now() / 180) * 0.25;
  ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 5);
  ctx.lineTo(x + 20, y + 16);
  ctx.lineTo(x + 16, y + 27);
  ctx.lineTo(x + 12, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffdf74";
  ctx.beginPath();
  ctx.arc(x + 10, y + 9, 2, 0, Math.PI * 2);
  ctx.arc(x + 23, y + 12, 2.4, 0, Math.PI * 2);
  ctx.arc(x + 21, y + 24, 2, 0, Math.PI * 2);
  ctx.fill();
}

function isTileVisible(x, y) {
  for (const flare of flares) {
    if (Math.max(Math.abs(flare.x - x), Math.abs(flare.y - y)) <= (flare.radius ?? FLARE_VISIBILITY_RADIUS)) {
      return true;
    }
  }

  return revealedTiles.has(`${x},${y}`);
}

function drawFogTile(x, y) {
  const sx = x * TILE - camera.x;
  const sy = y * TILE - camera.y;
  ctx.fillStyle = "#050607";
  ctx.fillRect(sx, sy, TILE, TILE);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
}

function drawFlares() {
  for (const flare of flares) {
    if (!isTileVisible(flare.x, flare.y)) continue;
    const x = flare.x * TILE + TILE / 2 - camera.x;
    const y = flare.y * TILE + TILE / 2 - camera.y;
    const glow = ctx.createRadialGradient(x, y, 2, x, y, TILE * 5.5);
    glow.addColorStop(0, "rgba(255, 106, 72, 0.58)");
    glow.addColorStop(1, "rgba(255, 204, 96, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - TILE * 6, y - TILE * 6, TILE * 12, TILE * 12);
    ctx.fillStyle = "#ff6a48";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff4b0";
    ctx.font = "700 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.ceil(flare.timeLeft)}`, x, y - 10);
    ctx.textAlign = "start";
  }
}

function drawSwordArcs() {
  for (const arc of swordArcs) {
    const x = arc.x - camera.x;
    const y = arc.y - camera.y;
    const angle = Math.atan2(arc.facingY, arc.facingX);
    const alpha = Math.max(0, arc.life / arc.maxLife);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = `rgba(255, 125, 233, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, arc.range, -0.65, 0.65);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 244, 176, ${alpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, arc.range - 5, -0.58, 0.58);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBlasts() {
  for (const blast of blasts) {
    const x = blast.x - camera.x;
    const y = blast.y - camera.y;
    const isRocket = blast.kind === "rocket";
    ctx.fillStyle = isRocket ? "#ff5f45" : "#b7ff6d";
    ctx.beginPath();
    ctx.arc(x, y, isRocket ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isRocket ? "rgba(255, 95, 69, 0.45)" : "rgba(183, 255, 109, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x - blast.vx * (isRocket ? 0.04 : 0.025), y - blast.vy * (isRocket ? 0.04 : 0.025));
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawRadiationBursts() {
  for (const burst of radiationBursts) {
    const progress = 1 - burst.life / burst.maxLife;
    const x = burst.x - camera.x;
    const y = burst.y - camera.y;
    const radius = burst.radius * (0.35 + progress * 0.65);
    const alpha = Math.max(0, 1 - progress);

    ctx.strokeStyle = `rgba(157, 255, 91, ${0.55 * alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(157, 255, 91, ${0.08 * alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMagnets() {
  if (relics.magnet.active <= 0) return;
  const x = miner.x - camera.x;
  const y = miner.y - camera.y;
  const pulse = 0.45 + Math.sin(performance.now() / 180) * 0.18;
  const ringRadius = getMagnetRadius() * (0.88 + pulse * 0.08);

  ctx.strokeStyle = `rgba(180, 116, 255, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#d8c6ff";
  ctx.font = "700 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.ceil(relics.magnet.active)}s`, x, y - 22);
  ctx.textAlign = "start";
}

function drawMonsters() {
  for (const monster of monsters) {
    if (monster.dormant) continue;
    const tileX = Math.floor(monster.x / TILE);
    const tileY = Math.floor(monster.y / TILE);
    if (!isTileVisible(tileX, tileY)) continue;

    const x = monster.x - camera.x;
    const y = monster.y - camera.y;
    const flash = monster.hitFlash > 0;
    ctx.fillStyle = monster.attackFlash > 0 ? "#ff9b4f" : flash ? "#fff0b8" : monster.color ?? "#c44d5c";
    ctx.beginPath();
    ctx.arc(x, y, monster.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#35171d";
    ctx.beginPath();
    ctx.arc(x - 4, y - 2, 2, 0, Math.PI * 2);
    ctx.arc(x + 4, y - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    const hpWidth = 24;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(x - hpWidth / 2, y - 19, hpWidth, 4);
    ctx.fillStyle = "#ff7a66";
    ctx.fillRect(x - hpWidth / 2, y - 19, hpWidth * Math.max(0, monster.hp / monster.maxHp), 4);
    ctx.fillStyle = "#f4f0e8";
    ctx.font = "700 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`L${monster.level}`, x, y + 22);
    ctx.textAlign = "start";
  }
}

function drawExplosions() {
  for (const explosion of explosions) {
    const progress = 1 - explosion.life / explosion.maxLife;
    const x = explosion.x - camera.x;
    const y = explosion.y - camera.y;
    const size = TILE * (1 + explosion.radius * progress);
    const alpha = Math.max(0, 1 - progress);

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = `rgba(255, 138, 61, ${0.38 * alpha})`;
    ctx.strokeStyle = `rgba(255, 232, 149, ${0.75 * alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 244, 176, ${0.7 * alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(4, size * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function spawnHealingFeedback(dt) {
  healingFeedbackTimer -= dt;
  if (healingFeedbackTimer > 0) return;
  healingFeedbackTimer = 0.28;

  feedbackEffects.push({
    kind: "heal",
    x: miner.x + (Math.random() - 0.5) * 24,
    y: miner.y - 8 + (Math.random() - 0.5) * 14,
    vx: (Math.random() - 0.5) * 12,
    vy: -28 - Math.random() * 12,
    life: 0.85,
    maxLife: 0.85,
    size: 12 + Math.random() * 4,
  });
}

function spawnPoisonStrike() {
  feedbackEffects.push({
    kind: "poison",
    x: miner.x,
    y: miner.y - 6,
    vx: 0,
    vy: -10,
    life: 0.32,
    maxLife: 0.32,
    size: 34,
  });
}

function drawFeedbackEffects() {
  for (const effect of feedbackEffects) {
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.max(0, 1 - progress);
    const x = effect.x - camera.x;
    const y = effect.y - camera.y;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;

    if (effect.kind === "heal") {
      const size = effect.size;
      ctx.strokeStyle = "#7eea89";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-size / 2, 0);
      ctx.lineTo(size / 2, 0);
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(0, size / 2);
      ctx.stroke();
    } else if (effect.kind === "poison") {
      const size = effect.size;
      ctx.strokeStyle = "#8cff5f";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(140, 255, 95, 0.75)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, -size * 0.25);
      ctx.lineTo(size * 0.05, size * 0.06);
      ctx.lineTo(-size * 0.08, size * 0.06);
      ctx.lineTo(size * 0.35, size * 0.36);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawBase() {
  const x = BASE_MIN_TILE_X * TILE - camera.x;
  const y = 2 * TILE - camera.y;
  ctx.fillStyle = "#25343b";
  ctx.fillRect(x, y, 8 * TILE, TILE * 1.5);
  ctx.fillStyle = "#68d6c7";
  ctx.fillRect(x + 12, y + 10, 8 * TILE - 24, 8);
  ctx.fillStyle = "#f4f0e8";
  ctx.font = "700 14px system-ui";
  ctx.fillText("BASE", x + 100, y + 34);
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(x + 12, y + 44, 8 * TILE - 24, 5);
  ctx.fillStyle = base.health <= 50 ? "#ff7a66" : "#68d6c7";
  ctx.fillRect(x + 12, y + 44, (8 * TILE - 24) * Math.max(0, base.health / base.maxHealth), 5);
}

function drawPickups() {
  for (const pickup of pickups) {
    if (!isPickupVisible(pickup)) continue;
    const x = pickup.x - camera.x;
    const y = pickup.y - camera.y;
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(x, y + 3, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    drawOrePickup(x, y, pickup.type, pickup.rotation);
  }
}

function drawTreasureChest() {
  if (!treasureChest.placed || treasureChest.delivered) return;
  if (!treasureChest.carried && !isTreasureRoomDiscovered()) return;
  if (!treasureChest.carried && !isTileVisible(treasureChest.tileX, treasureChest.tileY)) return;

  const x = treasureChest.x - camera.x;
  const y = treasureChest.y - camera.y;

  if (treasureChest.carried) {
    ctx.strokeStyle = "rgba(242, 196, 91, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(miner.x - camera.x, miner.y - camera.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(x, y);
  if (treasureChest.carried) ctx.rotate(Math.sin(performance.now() / 180) * 0.08);

  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.ellipse(0, 11, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7b4a2d";
  ctx.fillRect(-14, -6, 28, 17);
  ctx.fillStyle = "#a96738";
  ctx.fillRect(-14, -10, 28, 7);
  ctx.fillStyle = "#4b2f24";
  ctx.fillRect(-14, -3, 28, 3);
  ctx.fillStyle = "#f2c45b";
  ctx.fillRect(-2, -5, 4, 8);
  ctx.fillRect(-13, -8, 26, 2);
  ctx.fillRect(-13, 7, 26, 2);

  if (treasureChest.hover) {
    ctx.strokeStyle = "#fff4b0";
    ctx.lineWidth = 2;
    ctx.strokeRect(-17, -13, 34, 27);
    ctx.fillStyle = "#fff4b0";
    ctx.font = "700 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Click / E", 0, -18);
    ctx.textAlign = "start";
  }

  ctx.restore();
}

function isTreasureRoomDiscovered() {
  return isRoomDescribed("Z") || treasureChest.carried || treasureChest.instructionsShown || treasureChest.delivered;
}

function isPickupVisible(pickup) {
  if (pickup.roomLabel && !isRoomDescribed(pickup.roomLabel)) return false;
  return isTileVisible(Math.floor(pickup.x / TILE), Math.floor(pickup.y / TILE));
}

function isRoomDescribed(label) {
  return !!specialRooms.find((room) => room.label === label)?.described;
}

function drawOrePickup(x, y, type, rotation = 0) {
  if (type === "idol") {
    drawIdolPickup(x, y, rotation);
    return;
  }

  const color = resourceColors[type] ?? "#ffffff";

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = "#2a2522";
  ctx.beginPath();
  ctx.moveTo(-8, 1);
  ctx.lineTo(-4, -6);
  ctx.lineTo(5, -6);
  ctx.lineTo(9, 0);
  ctx.lineTo(5, 6);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(-2, -4);
  ctx.lineTo(4, -4);
  ctx.lineTo(6, 0);
  ctx.lineTo(2, 4);
  ctx.lineTo(-5, 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.beginPath();
  ctx.moveTo(-2, -4);
  ctx.lineTo(4, -4);
  ctx.lineTo(1, -1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, 4);
  ctx.lineTo(1, -1);
  ctx.lineTo(7, 1);
  ctx.stroke();
  ctx.restore();
}

function drawIdolPickup(x, y, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = "#f2c45b";
  ctx.beginPath();
  ctx.arc(0, -6, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-5, -1, 10, 13);
  ctx.fillStyle = "#24343a";
  ctx.fillRect(-2, 2, 4, 8);
  ctx.restore();
}

function drawMiner() {
  const x = miner.x - camera.x;
  const y = miner.y - camera.y;
  ctx.save();
  ctx.translate(x, y);
  if (gameOver) {
    drawBrokenMiner();
    ctx.restore();
    return;
  }
  ctx.scale(0.72, 0.72);
  ctx.rotate(Math.atan2(miner.facingY, miner.facingX));
  ctx.fillStyle = "#e9eef1";
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-10, -11);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#68d6c7";
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f2c45b";
  ctx.fillRect(-17, -4, 7, 8);
  ctx.restore();
}

function drawBrokenMiner() {
  const shake = Math.max(0, 1 - gameOverTimer / 1.2) * 4;
  ctx.translate(Math.sin(gameOverTimer * 48) * shake, Math.cos(gameOverTimer * 35) * shake);
  ctx.scale(0.72, 0.72);
  ctx.rotate(-0.7 + Math.sin(gameOverTimer * 18) * 0.08);

  ctx.fillStyle = "#8e979a";
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-12, -10);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#1b2024";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -7);
  ctx.lineTo(4, 0);
  ctx.lineTo(-2, 7);
  ctx.stroke();

  ctx.fillStyle = "#ff7a66";
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f2c45b";
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const angle = gameOverTimer * 8 + i * 1.7;
    const pulse = 12 + ((gameOverTimer * 90 + i * 9) % 18);
    const alpha = Math.max(0, 1 - gameOverTimer / 1.5) * (0.45 + (i % 2) * 0.25);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 12, Math.sin(angle) * 9);
    ctx.lineTo(Math.cos(angle) * pulse, Math.sin(angle) * pulse);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#2d3438";
  ctx.fillRect(-20, -5, 8, 10);
}

function drawMouse() {
  if (!relics.mouse.unlocked) return;
  const x = mouseHelper.x - camera.x;
  const y = mouseHelper.y - camera.y;
  const angle = mouseHelper.target
    ? Math.atan2(mouseHelper.target.y * TILE + TILE / 2 - mouseHelper.y, mouseHelper.target.x * TILE + TILE / 2 - mouseHelper.x)
    : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#d8c6a4";
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f1e6ce";
  ctx.beginPath();
  ctx.arc(7, -3, 2.5, 0, Math.PI * 2);
  ctx.arc(7, 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#b59a76";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-15, 4);
  ctx.stroke();
  ctx.restore();
}

function drawDog() {
  if (!relics.dog.unlocked) return;
  const x = dogHelper.x - camera.x;
  const y = dogHelper.y - camera.y;
  const angle = dogHelper.target
    ? Math.atan2(dogHelper.target.y - dogHelper.y, dogHelper.target.x - dogHelper.x)
    : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#c98b5c";
  ctx.beginPath();
  ctx.roundRect(-10, -6, 18, 12, 4);
  ctx.fill();
  ctx.fillStyle = "#e4b287";
  ctx.beginPath();
  ctx.arc(9, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6f3f2a";
  ctx.beginPath();
  ctx.arc(12, -2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6f3f2a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, 2);
  ctx.lineTo(-15, -2);
  ctx.stroke();
  if (dogHelper.carried > 0) {
    ctx.fillStyle = "#68d6c7";
    ctx.fillRect(-5, -12, 10, 5);
  }
  ctx.restore();
}

function drawVignette() {
  const depth = Math.max(0, miner.y / TILE - SURFACE_ROWS);
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.48, depth / 115)})`;
  ctx.fillRect(0, 0, getCameraViewWidth(), getCameraViewHeight());
}

function updateHud() {
  const atBase = isMinerAtBase();
  const baseUnderAttack = isBaseUnderAttack();
  document.querySelector("#depthStat").textContent = `${Math.max(0, Math.floor((miner.y - SURFACE_ROWS * TILE) / TILE))}m`;
  document.querySelector("#cargoStat").textContent = `${carried} / ${miner.capacity}`;
  document.querySelector("#healthStat").textContent = `${Math.ceil(miner.health)} / ${Math.round(miner.maxHealth)}`;
  document.querySelector("#upgradeStat").textContent = `${Object.values(miner.upgrades).reduce((sum, level) => sum + level, 0)}`;
  document.querySelector("#timeStat").textContent = formatElapsedTime(elapsedTime);
  document.querySelector("#baseStat").textContent = `${Math.ceil(base.health)} / ${base.maxHealth}`;
  document.querySelector("#baseWarning").hidden = !baseUnderAttack;
  document.querySelector("#baseWarning").parentElement.classList.toggle("is-warning", baseUnderAttack);
  updateBaseAttackWarningMessage(baseUnderAttack);

  for (const type of Object.keys(upgradeDefs)) {
    const recipe = getUpgradeRecipe(type);
    const button = document.querySelector(`[data-upgrade="${type}"]`);
    const atMaxLevel = miner.upgrades[type] >= MAX_UPGRADE_LEVEL;
    const cost = atMaxLevel ? "Max level" : `Lv ${miner.upgrades[type] + 1}: ${formatRecipe(recipe)}`;
    document.querySelector(`#${type}Cost`).textContent = cost;
    button.disabled = atMaxLevel || !atBase || !canAfford(recipe);
  }

  const baseRepairButton = document.querySelector("[data-repair-base]");
  document.querySelector("#baseRepairCost").textContent = `${BASE_REPAIR_CARAPACE_COST} carapace`;
  baseRepairButton.disabled = !atBase || base.health >= base.maxHealth || resources.alienCarapace < BASE_REPAIR_CARAPACE_COST;

  updateRelicHud("impact");
  updateRelicHud("speed");
  updateRelicHud("flare");
  updateRelicHud("blaster");
  updateRelicHud("bomb");
  updateRelicHud("mouse");
  updateRelicHud("dog");
  updateRelicHud("radiation");
  updateRelicHud("rocket");
  updateRelicHud("magnet");
  updateRelicHud("thirdEye");
  updateRelicHud("laserSword");
  updateRelicHud("converter");
  for (const type of Object.keys(relicDefs)) updateRelicUpgradeHud(type, atBase);
  const hasRelic = Object.values(relics).some((relic) => relic.unlocked);
  document.querySelector("#relicPanel").hidden = !hasRelic;

  document.querySelector("#resourceList").innerHTML = Object.entries(resources)
    .map(([type, amount]) => {
      const cargoAmount = cargo[type];
      const cargoText = cargoAmount > 0 ? ` <span>(+${cargoAmount})</span>` : "";
      return `<dt>${getResourceName(type)}</dt><dd>${amount}${cargoText}</dd>`;
    })
    .join("");
}

function isBaseUnderAttack() {
  if (!gameStarted || finalGameOver) return false;
  return monsters.some((monster) => canMonsterReachBase(monster));
}

function updateBaseAttackWarningMessage(baseUnderAttack) {
  if (baseUnderAttack === baseAttackWarningActive) return;
  baseAttackWarningActive = baseUnderAttack;
  setMessage(baseUnderAttack ? "Warning: base is under attack." : "Base attack cleared.");
}

function setupWorldSizeSelect() {
  const select = document.querySelector("#worldSizeSelect");
  select.value = activeWorldSize;
  select.addEventListener("change", () => {
    localStorage.setItem("driftMinerWorldSize", select.value);
    window.location.reload();
  });
}

function setupStartOverlay() {
  const overlay = document.querySelector("#startOverlay");
  const select = document.querySelector("#startWorldSizeSelect");
  const button = document.querySelector("#startGameButton");
  if (!overlay || !select || !button) return;

  select.value = activeWorldSize;
  select.addEventListener("change", () => {
    localStorage.setItem("driftMinerWorldSize", select.value);
    window.location.reload();
  });

  button.addEventListener("click", () => {
    unlockAudio();
    gameStarted = true;
    gamePaused = false;
    overlay.hidden = true;
    document.querySelector("#pauseOverlay").hidden = true;
    lastTime = performance.now();
    setMessage("Launch from the pad and start digging.");
  });
}

function setupPanelMinimizeControls() {
  document.querySelectorAll(".panel-section").forEach((section, index) => {
    const heading = section.querySelector(":scope > h2");
    if (!heading) return;

    const title = heading.textContent.trim() || `Panel ${index + 1}`;
    const header = document.createElement("div");
    header.className = "panel-section-header";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "panel-minimize";
    button.setAttribute("aria-label", `Minimize ${title}`);
    button.setAttribute("aria-expanded", "true");
    button.textContent = "-";

    section.insertBefore(header, heading);
    header.append(heading, button);

    button.addEventListener("click", () => {
      const minimized = section.classList.toggle("is-minimized");
      button.textContent = minimized ? "+" : "-";
      button.setAttribute("aria-expanded", String(!minimized));
      button.setAttribute("aria-label", `${minimized ? "Expand" : "Minimize"} ${title}`);
    });
  });
}

function setupItemTooltips() {
  for (const [type, definition] of Object.entries(upgradeDefs)) {
    const button = document.querySelector(`[data-upgrade="${type}"]`);
    if (button) setTooltip(button, definition.description);
  }

  const baseRepairButton = document.querySelector("[data-repair-base]");
  if (baseRepairButton) setTooltip(baseRepairButton, baseRepairDescription);

  for (const [type, definition] of Object.entries(relicDefs)) {
    const control = document.querySelector(`[data-relic="${type}"]`);
    const upgrade = document.querySelector(`[data-relic-upgrade="${type}"]`);
    const description = relicDescriptions[type] ?? definition.label;
    if (control) setTooltip(control, description);
    if (upgrade) setTooltip(upgrade, `Upgrade ${definition.label}: ${getRelicUpgradeDescription(type)}.`);
  }
}

function setTooltip(element, text) {
  element.querySelector(".upgrade-description")?.remove();
  element.title = text;
}

function togglePause(force = null) {
  if (!gameStarted || gameOver || gameWon) return;
  gamePaused = force ?? !gamePaused;
  keys.clear();
  miner.vx = 0;
  miner.vy = 0;
  const overlay = document.querySelector("#pauseOverlay");
  const buttonStatus = document.querySelector("#pauseButton strong");
  if (overlay) overlay.hidden = !gamePaused;
  if (buttonStatus) buttonStatus.textContent = gamePaused ? "On" : "P";
  setMessage(gamePaused ? "Paused." : "Resumed.");
}

function showRelicToast(type) {
  const toast = document.querySelector("#relicToast");
  if (!toast) return;

  document.querySelector("#relicToastTitle").textContent = relicDefs[type].label;
  document.querySelector("#relicToastDescription").textContent = relicDescriptions[type] ?? "Ancient relic recovered.";
  toast.hidden = false;
  toast.classList.remove("is-visible");
  void toast.offsetWidth;
  toast.classList.add("is-visible");

  window.clearTimeout(relicToastTimer);
  relicToastTimer = window.setTimeout(() => {
    toast.hidden = true;
    toast.classList.remove("is-visible");
  }, 3600);
}

function triggerGameOver(cause = "miner") {
  if (gameOver) return;
  const droppedTreasure = treasureChest.carried && !treasureChest.delivered;
  if (droppedTreasure) releaseTreasureAt(treasureChest.x, treasureChest.y);
  finalGameOver = cause === "base";
  gameOver = true;
  gamePaused = false;
  gameOverTimer = 0;
  miner.health = 0;
  miner.vx = 0;
  miner.vy = 0;
  miner.x = BASE_CENTER_TILE_X * TILE;
  miner.y = BASE_TILE_Y * TILE;
  miner.facingX = 1;
  miner.facingY = 0;
  loseCarriedCargo();
  updateCamera();
  document.querySelector("#pauseOverlay").hidden = true;
  showGameOverOverlay(cause);
  if (!finalGameOver) updateHullBreachCooldown();
  setMessage(cause === "base" ? "Base destroyed. Game over." : droppedTreasure ? "Hull breached. Cargo lost. Treasure dropped." : "Hull breached. Cargo lost.");
}

function showGameOverOverlay(cause) {
  const isBaseDestroyed = cause === "base";
  const overlay = document.querySelector("#gameOverOverlay");
  const restartButton = document.querySelector("#restartButton");
  const countdown = document.querySelector("#breachCountdown");
  overlay.hidden = false;
  overlay.querySelector("p").textContent = isBaseDestroyed ? "Base destroyed" : "Cargo lost";
  overlay.querySelector("h2").textContent = isBaseDestroyed ? "Game Over" : "Hull Breached!";
  restartButton.hidden = !isBaseDestroyed;
  restartButton.style.display = isBaseDestroyed ? "" : "none";
  countdown.hidden = isBaseDestroyed;
  countdown.style.display = isBaseDestroyed ? "none" : "";
}

function updateHullBreachCooldown() {
  const remaining = Math.max(0, HULL_BREACH_COOLDOWN - gameOverTimer);
  document.querySelector("#breachCountdown").textContent = `${Math.ceil(remaining)}s`;
  if (remaining > 0) return;

  gameOver = false;
  gameOverTimer = 0;
  miner.health = miner.maxHealth;
  finalGameOver = false;
  document.querySelector("#gameOverOverlay").hidden = true;
  document.querySelector("#restartButton").hidden = true;
  document.querySelector("#restartButton").style.display = "none";
  document.querySelector("#breachCountdown").hidden = false;
  document.querySelector("#breachCountdown").style.display = "";
  setMessage("Hull patched. Launch when ready.");
}

function triggerWin() {
  if (gameWon) return;
  gameWon = true;
  treasureChest.carried = false;
  treasureChest.delivered = true;
  hideTreasureInstructions(true);
  miner.vx = 0;
  miner.vy = 0;
  document.querySelector("#gameOverOverlay").hidden = false;
  document.querySelector("#gameOverOverlay p").textContent = "Treasure recovered";
  document.querySelector("#gameOverOverlay h2").textContent = "You've found the Treasure!";
  document.querySelector("#breachCountdown").textContent = "Victory";
  document.querySelector("#breachCountdown").hidden = false;
  document.querySelector("#breachCountdown").style.display = "";
  document.querySelector("#restartButton").hidden = true;
  document.querySelector("#restartButton").style.display = "none";
  setMessage("You've found the Treasure!");
}

function loseCarriedCargo() {
  for (const type of Object.keys(cargo)) cargo[type] = 0;
  carried = 0;
}

function updateRelicHud(type) {
  const relic = relics[type];
  const row = document.querySelector(`[data-relic-row="${type}"]`);
  const button = document.querySelector(`[data-relic="${type}"]`);
  const status = document.querySelector(`#${type}Status`);
  const upgradeButton = document.querySelector(`[data-relic-upgrade="${type}"]`);
  const levelText = `Lv ${relic.level}`;

  if (!relic.unlocked) {
    status.textContent = "Locked";
    button.disabled = true;
    button.hidden = true;
    if (upgradeButton) {
      upgradeButton.disabled = true;
      upgradeButton.hidden = true;
    }
    if (row) row.hidden = true;
    return;
  }

  if (row) row.hidden = false;
  button.hidden = false;
  if (upgradeButton) upgradeButton.hidden = false;

  if (type === "blaster") {
    status.textContent = relic.overheat > 0 ? `${levelText} ${formatTime(relic.overheat)}` : `${levelText} ${Math.floor(relic.charge)}%`;
    button.disabled = true;
    return;
  }

  if (type === "mouse") {
    status.textContent = `${levelText} ${Math.ceil(mouseHelper.health)} / ${mouseHelper.maxHealth} hp`;
    button.disabled = true;
    return;
  }

  if (type === "dog") {
    status.textContent = `${levelText} ${dogHelper.carried} / ${dogHelper.maxCarry}, ${Math.ceil(dogHelper.health)} hp`;
    button.disabled = true;
    return;
  }

  if (type === "thirdEye") {
    status.textContent = `${levelText} ${getOpenRevealRadius()}x${getOpenRevealRadius()} reveal`;
    button.disabled = true;
    return;
  }

  if (type === "laserSword") {
    if (relic.cooldown > 0) {
      status.textContent = `${levelText} ${formatTime(relic.cooldown)}`;
      button.disabled = true;
    } else {
      status.textContent = `${levelText} ${relic.swings} / ${getLaserSwordMaxSwings()} swings`;
      button.disabled = false;
    }
    return;
  }

  if (type === "converter") {
    if (relic.cooldown > 0) {
      status.textContent = `${levelText} ${formatTime(relic.cooldown)}`;
      button.disabled = true;
    } else {
      status.textContent = isMinerAtBase() ? `${levelText} Convert` : `${levelText} Base`;
      button.disabled = !isMinerAtBase();
    }
    return;
  }

  if (relic.active > 0) {
    status.textContent = `${levelText} ${Math.ceil(relic.active)}s active`;
    button.disabled = true;
    return;
  }

  if (relic.cooldown > 0) {
    status.textContent = `${levelText} ${formatTime(relic.cooldown)}`;
    button.disabled = true;
    return;
  }

  status.textContent = `${levelText} Ready`;
  button.disabled = false;
}

function updateRelicUpgradeHud(type, atBase) {
  const relic = relics[type];
  const row = document.querySelector(`[data-relic-row="${type}"]`);
  const button = document.querySelector(`[data-relic-upgrade="${type}"]`);
  const status = document.querySelector(`#${type}UpgradeCost`);
  if (!button || !status) return;

  if (!relic.unlocked) {
    if (row) row.hidden = true;
    button.hidden = true;
    button.disabled = true;
    status.textContent = "Locked";
    button.title = "";
    return;
  }

  button.hidden = false;
  button.title = getRelicUpgradeDescription(type);
  if (relic.level >= MAX_RELIC_LEVEL) {
    status.textContent = "Lv 4 Max";
    button.disabled = true;
    return;
  }

  const cost = getRelicUpgradeCost(type);
  const costText = `Lv ${relic.level + 1}\n${formatRecipe(cost)}`;
  status.textContent = costText;
  button.disabled = !atBase || !canAfford(cost);
}

function toggleDebugMode(force) {
  debugMode = typeof force === "boolean" ? force : !debugMode;
  document.querySelector("#debugPanel").hidden = !debugMode;
  document.querySelector("#debugToggle strong").textContent = debugMode ? "On" : "Off";
  setMessage(debugMode ? "Debug mode enabled." : "Debug mode disabled.");
}

function debugGrantResources() {
  for (const type of Object.keys(resources)) resources[type] += 50;
  setMessage("Debug resources added.");
  updateHud();
}

function debugUpgrade(type) {
  if (miner.upgrades[type] >= MAX_UPGRADE_LEVEL) {
    setMessage(`${upgradeDefs[type].label} is already max level.`);
    updateHud();
    return;
  }
  applyUpgrade(type);
  increaseMaxHullFromUpgrade();
  setMessage(`Debug upgraded ${upgradeDefs[type].label}.`);
  updateHud();
}

function debugUnlockRelic(type) {
  unlockRelic(type);
  updateHud();
}

function debugUnlockAllRelics() {
  for (const type of Object.keys(relicDefs)) unlockRelic(type);
  setMessage("All relics unlocked.");
  updateHud();
}

function debugRepairHull() {
  miner.health = miner.maxHealth;
  setMessage("Hull fully repaired.");
  updateHud();
}

function debugSpawnMonster() {
  if (monsters.length >= MAX_MONSTERS) {
    setMessage("Monster limit reached.");
    return;
  }

  const tile = getDebugMonsterSpawnTile();
  if (!tile) {
    setMessage("No open tile for debug monster.");
    return;
  }

  createMonster(tile);
}

function debugRevealRooms() {
  if (specialRooms.length === 0) {
    setMessage("No special rooms generated.");
    return;
  }

  for (const room of specialRooms) {
    revealAround(room.x, room.y, 2);
  }
  setMessage(`${specialRooms.length} special rooms revealed.`);
}

function debugRevealMap() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      revealedTiles.add(`${x},${y}`);
    }
  }
  setMessage("Entire map revealed.");
}

function debugCycleZoom() {
  cameraZoomIndex = (cameraZoomIndex + 1) % CAMERA_ZOOM_LEVELS.length;
  updateCamera();
  updateDebugZoomStatus();
  setMessage(`Zoom set to ${CAMERA_ZOOM_LEVELS[cameraZoomIndex]} blocks wide.`);
}

function updateDebugZoomStatus() {
  document.querySelector("#debugZoomStatus").textContent = `${CAMERA_ZOOM_LEVELS[cameraZoomIndex]}x`;
}

function getDebugMonsterSpawnTile() {
  const origin = {
    x: Math.floor(miner.x / TILE),
    y: Math.floor(miner.y / TILE),
  };
  for (let radius = 2; radius <= 8; radius++) {
    for (let y = origin.y - radius; y <= origin.y + radius; y++) {
      for (let x = origin.x - radius; x <= origin.x + radius; x++) {
        if (Math.max(Math.abs(origin.x - x), Math.abs(origin.y - y)) !== radius) continue;
        if (!isMonsterOpenTile(x, y)) continue;
        return { x, y };
      }
    }
  }

  return getNearestMonsterOpenTile(origin, 14);
}

function formatTime(seconds) {
  const whole = Math.ceil(seconds);
  if (whole < 60) return `${whole}s`;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function formatElapsedTime(seconds) {
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function setMessage(text) {
  if (messageTimer > 0 && text.startsWith("Need")) return;
  document.querySelector("#messageLog").textContent = text;
  messageTimer = 1.1;
}

function unlockAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === "suspended") audioContext.resume();
  loadDigSound(audioContext);
  return audioContext;
}

function loadDigSound(ctx) {
  if (digSoundBuffer || digSoundLoading) return;
  digSoundLoading = fetch("assets/digging-dirt.mp3")
    .then((response) => response.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      digSoundBuffer = buffer;
      digSoundOffsets = getLoudDigSoundOffsets(buffer);
    })
    .catch(() => {
      digSoundLoading = null;
    });
}

function playDigSound(type = "hit") {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (now - lastDigSoundAt < 0.045) return;
  lastDigSoundAt = now;

  if (digSoundBuffer) {
    playDirtDigSample(ctx, type, now);
    return;
  }

  playSyntheticDigSound(ctx, type, now);
}

function playClinkSound() {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (now - lastDigSoundAt < 0.045) return;
  lastDigSoundAt = now;

  const duration = 0.24;
  const ping = ctx.createOscillator();
  const ring = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  ping.type = "triangle";
  ping.frequency.setValueAtTime(1180, now);
  ping.frequency.exponentialRampToValueAtTime(760, now + duration);
  ring.type = "sine";
  ring.frequency.setValueAtTime(1850, now);
  ring.frequency.exponentialRampToValueAtTime(1420, now + duration * 0.75);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1450, now);
  filter.Q.setValueAtTime(6.2, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  ping.connect(filter);
  ring.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  ping.start(now);
  ring.start(now);
  ping.stop(now + duration);
  ring.stop(now + duration * 0.75);
}

function playDirtDigSample(ctx, type, now) {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const sliceDuration = type === "break" ? 0.2 : 0.14;
  const maxOffset = Math.max(0, digSoundBuffer.duration - sliceDuration - 0.02);
  const offset = chooseDigSoundOffset(maxOffset);

  source.buffer = digSoundBuffer;
  source.playbackRate.setValueAtTime(type === "blocked" ? 1.9 : 1.7, now);
  filter.type = "highpass";
  filter.frequency.setValueAtTime(type === "blocked" ? 140 : 70, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(type === "break" ? 1.35 : 1.05, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + sliceDuration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now, offset, sliceDuration);
}

function getLoudDigSoundOffsets(buffer) {
  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const windowSize = Math.max(1, Math.floor(sampleRate * 0.16));
  const stepSize = Math.max(1, Math.floor(sampleRate * 0.05));
  const windows = [];

  for (let start = 0; start + windowSize < channel.length; start += stepSize) {
    let sum = 0;
    for (let i = start; i < start + windowSize; i++) sum += Math.abs(channel[i]);
    windows.push({ offset: start / sampleRate, level: sum / windowSize });
  }

  if (windows.length === 0) return [0];
  windows.sort((a, b) => b.level - a.level);
  const loudest = windows[0].level;
  return windows
    .filter((window) => window.level >= loudest * 0.45)
    .slice(0, 24)
    .map((window) => window.offset);
}

function chooseDigSoundOffset(maxOffset) {
  const usableOffsets = digSoundOffsets.filter((offset) => offset <= maxOffset);
  if (usableOffsets.length === 0) return maxOffset > 0 ? Math.random() * maxOffset : 0;
  return usableOffsets[Math.floor(Math.random() * usableOffsets.length)];
}

function playSyntheticDigSound(ctx, type, now) {
  const duration = type === "break" ? 0.18 : 0.11;
  const samples = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const noiseBuffer = ctx.createBuffer(1, samples, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    const fade = 1 - i / samples;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }

  const noise = ctx.createBufferSource();
  const crunchFilter = ctx.createBiquadFilter();
  const crunchGain = ctx.createGain();
  noise.buffer = noiseBuffer;
  crunchFilter.type = "bandpass";
  crunchFilter.frequency.setValueAtTime(type === "blocked" ? 960 : 520, now);
  crunchFilter.Q.setValueAtTime(type === "blocked" ? 3.6 : 2.4, now);
  crunchGain.gain.setValueAtTime(0.0001, now);
  crunchGain.gain.exponentialRampToValueAtTime(type === "break" ? 0.55 : 0.42, now + 0.008);
  crunchGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(crunchFilter);
  crunchFilter.connect(crunchGain);
  crunchGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration);
}

function playPoisonDamageSound() {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.58;
  const groan = ctx.createOscillator();
  const groanGain = ctx.createGain();
  const groanFilter = ctx.createBiquadFilter();

  groan.type = "sawtooth";
  groan.frequency.setValueAtTime(138, now);
  groan.frequency.exponentialRampToValueAtTime(62, now + duration);
  groanFilter.type = "lowpass";
  groanFilter.frequency.setValueAtTime(520, now);
  groanFilter.frequency.exponentialRampToValueAtTime(210, now + duration);
  groanGain.gain.setValueAtTime(0.0001, now);
  groanGain.gain.exponentialRampToValueAtTime(0.24, now + 0.045);
  groanGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  groan.connect(groanFilter);
  groanFilter.connect(groanGain);
  groanGain.connect(ctx.destination);
  groan.start(now);
  groan.stop(now + duration);

  const raspDuration = 0.22;
  const samples = Math.max(1, Math.floor(ctx.sampleRate * raspDuration));
  const raspBuffer = ctx.createBuffer(1, samples, ctx.sampleRate);
  const data = raspBuffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    const fade = 1 - i / samples;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }

  const rasp = ctx.createBufferSource();
  const raspFilter = ctx.createBiquadFilter();
  const raspGain = ctx.createGain();
  rasp.buffer = raspBuffer;
  raspFilter.type = "bandpass";
  raspFilter.frequency.setValueAtTime(280, now);
  raspFilter.Q.setValueAtTime(1.8, now);
  raspGain.gain.setValueAtTime(0.0001, now);
  raspGain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
  raspGain.gain.exponentialRampToValueAtTime(0.0001, now + raspDuration);

  rasp.connect(raspFilter);
  raspFilter.connect(raspGain);
  raspGain.connect(ctx.destination);
  rasp.start(now);
  rasp.stop(now + raspDuration);
}

function playLaserSwordSound() {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.36;
  const hum = ctx.createOscillator();
  const shimmer = ctx.createOscillator();
  const humGain = ctx.createGain();
  const shimmerGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  hum.type = "sawtooth";
  hum.frequency.setValueAtTime(92, now);
  hum.frequency.exponentialRampToValueAtTime(155, now + 0.08);
  hum.frequency.exponentialRampToValueAtTime(108, now + duration);

  shimmer.type = "triangle";
  shimmer.frequency.setValueAtTime(370, now);
  shimmer.frequency.exponentialRampToValueAtTime(690, now + 0.1);
  shimmer.frequency.exponentialRampToValueAtTime(420, now + duration);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(540, now);
  filter.frequency.exponentialRampToValueAtTime(900, now + 0.08);
  filter.frequency.exponentialRampToValueAtTime(420, now + duration);
  filter.Q.setValueAtTime(2.8, now);

  humGain.gain.setValueAtTime(0.0001, now);
  humGain.gain.exponentialRampToValueAtTime(0.2, now + 0.025);
  humGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  shimmerGain.gain.setValueAtTime(0.0001, now);
  shimmerGain.gain.exponentialRampToValueAtTime(0.12, now + 0.018);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.72);

  hum.connect(filter);
  filter.connect(humGain);
  humGain.connect(ctx.destination);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(ctx.destination);

  hum.start(now);
  shimmer.start(now);
  hum.stop(now + duration);
  shimmer.stop(now + duration * 0.72);
}

function playMonsterScreamSound(monster) {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (now - lastMonsterScreamAt < 1.2) return;
  lastMonsterScreamAt = now;

  const duration = 0.82;
  const levelPitch = Math.max(0, Math.min(5, monster.level - 1)) * 2;
  const throat = ctx.createOscillator();
  const growl = ctx.createOscillator();
  const wobble = ctx.createOscillator();
  const wobbleGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  throat.type = "triangle";
  throat.frequency.setValueAtTime(54 + levelPitch, now);
  throat.frequency.exponentialRampToValueAtTime(39 + levelPitch, now + duration);
  growl.type = "sawtooth";
  growl.frequency.setValueAtTime(31 + levelPitch * 0.25, now);
  growl.frequency.exponentialRampToValueAtTime(24 + levelPitch * 0.18, now + duration);
  wobble.type = "sine";
  wobble.frequency.setValueAtTime(13, now);
  wobbleGain.gain.setValueAtTime(8, now);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(260, now);
  filter.frequency.exponentialRampToValueAtTime(145, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.34, now + 0.08);
  gain.gain.setValueAtTime(0.3, now + 0.42);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  wobble.connect(wobbleGain);
  wobbleGain.connect(throat.frequency);
  wobbleGain.connect(growl.frequency);
  throat.connect(filter);
  growl.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  wobble.start(now);
  throat.start(now);
  growl.start(now);
  wobble.stop(now + duration);
  throat.stop(now + duration);
  growl.stop(now + duration);

  const raspDuration = 0.78;
  const samples = Math.max(1, Math.floor(ctx.sampleRate * raspDuration));
  const raspBuffer = ctx.createBuffer(1, samples, ctx.sampleRate);
  const data = raspBuffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    const progress = i / samples;
    const attack = Math.min(1, progress / 0.08);
    const release = Math.max(0, 1 - Math.max(0, progress - 0.48) / 0.52);
    data[i] = (Math.random() * 2 - 1) * attack * release;
  }

  const rasp = ctx.createBufferSource();
  const raspFilter = ctx.createBiquadFilter();
  const raspGain = ctx.createGain();
  rasp.buffer = raspBuffer;
  rasp.playbackRate.setValueAtTime(0.75, now);
  raspFilter.type = "lowpass";
  raspFilter.frequency.setValueAtTime(430, now);
  raspFilter.frequency.exponentialRampToValueAtTime(180, now + raspDuration);
  raspFilter.Q.setValueAtTime(0.8, now);
  raspGain.gain.setValueAtTime(0.0001, now);
  raspGain.gain.exponentialRampToValueAtTime(0.32, now + 0.08);
  raspGain.gain.exponentialRampToValueAtTime(0.0001, now + raspDuration);
  rasp.connect(raspFilter);
  raspFilter.connect(raspGain);
  raspGain.connect(ctx.destination);
  rasp.start(now + 0.05);
  rasp.stop(now + 0.05 + raspDuration);
}

function playMonsterDeathScreamSound(monster) {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (now - lastMonsterDeathScreamAt < 0.35) return;
  lastMonsterDeathScreamAt = now;

  const duration = 0.62;
  const levelPitch = Math.max(0, Math.min(5, monster.level - 1)) * 12;
  const scream = ctx.createOscillator();
  const squeal = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  scream.type = "sawtooth";
  scream.frequency.setValueAtTime(760 + levelPitch, now);
  scream.frequency.exponentialRampToValueAtTime(1180 + levelPitch, now + 0.11);
  scream.frequency.exponentialRampToValueAtTime(360 + levelPitch * 0.35, now + duration);
  squeal.type = "triangle";
  squeal.frequency.setValueAtTime(1180 + levelPitch, now);
  squeal.frequency.exponentialRampToValueAtTime(1640 + levelPitch, now + 0.08);
  squeal.frequency.exponentialRampToValueAtTime(620 + levelPitch * 0.4, now + duration * 0.7);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1050, now);
  filter.frequency.exponentialRampToValueAtTime(620, now + duration);
  filter.Q.setValueAtTime(5.5, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  scream.connect(filter);
  squeal.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  scream.start(now);
  squeal.start(now);
  scream.stop(now + duration);
  squeal.stop(now + duration * 0.7);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function showDamageSampleOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "damageSampleOverlay";
  overlay.style.cssText = [
    "position:fixed",
    "right:18px",
    "top:18px",
    "z-index:20",
    "width:292px",
    "padding:10px",
    "border:1px solid #5a6b74",
    "border-radius:8px",
    "background:rgba(17,20,23,.96)",
    "box-shadow:0 12px 40px rgba(0,0,0,.35)",
    "color:#f4f0e8",
    "font:12px system-ui",
  ].join(";");
  overlay.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <strong>Block damage sample</strong>
      <button type="button" aria-label="Close damage sample" style="border:1px solid #40505b;border-radius:6px;background:#263037;color:#f4f0e8;cursor:pointer;">x</button>
    </div>
    <canvas width="272" height="74" style="width:272px;height:74px;image-rendering:pixelated;background:#08090a;border:1px solid #303a40;"></canvas>
  `;
  document.body.appendChild(overlay);

  const sampleCanvas = overlay.querySelector("canvas");
  const sampleCtx = sampleCanvas.getContext("2d");
  const closeButton = overlay.querySelector("button");
  let frame = 0;
  let animationId = 0;

  closeButton.addEventListener("click", () => {
    cancelAnimationFrame(animationId);
    overlay.remove();
  });

  function animateSample() {
    const activeStage = Math.floor(frame / 34) % 6;
    sampleCtx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);

    for (let stage = 0; stage < 5; stage++) {
      const x = 12 + stage * 52;
      const y = 16;
      sampleCtx.fillStyle = "#6c5640";
      sampleCtx.fillRect(x, y, TILE, TILE);
      sampleCtx.strokeStyle = "rgba(0,0,0,.36)";
      sampleCtx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      paintBlockDamagePixels(sampleCtx, x, y, Math.min(stage, activeStage));
      sampleCtx.fillStyle = "#cf7a43";
      sampleCtx.beginPath();
      sampleCtx.arc(x + 10, y + 11, 3.5, 0, Math.PI * 2);
      sampleCtx.arc(x + 22, y + 21, 4.5, 0, Math.PI * 2);
      sampleCtx.fill();
      sampleCtx.fillStyle = "#b9c6c9";
      sampleCtx.font = "8px system-ui";
      sampleCtx.fillText(`stage ${stage + 1}`, x - 1, y + 46);
    }

    if (activeStage >= 5) {
      const x = 12 + 4 * 52;
      sampleCtx.fillStyle = "#08090a";
      sampleCtx.fillRect(x, 16, TILE, TILE);
      sampleCtx.fillStyle = "#ffdf74";
      sampleCtx.font = "9px system-ui";
      sampleCtx.fillText("destroyed", x - 4, 68);
    }

    frame += 1;
    animationId = requestAnimationFrame(animateSample);
  }

  animateSample();
}

function updateGamepadInput() {
  const gamepads = navigator.getGamepads?.() ?? [];
  let gamepad = gamepadState.index !== null ? gamepads[gamepadState.index] : null;
  if (!gamepad) {
    gamepad = [...gamepads].find(Boolean) ?? null;
    gamepadState.index = gamepad?.index ?? null;
  }

  if (!gamepad) {
    gamepadState.connected = false;
    gamepadState.axes.x = 0;
    gamepadState.axes.y = 0;
    gamepadState.blasterHeld = false;
    return;
  }

  gamepadState.connected = true;
  gamepadState.axes = getGamepadMoveAxes(gamepad);
  gamepadState.blasterHeld = isGamepadButtonHeld(gamepad, 2) || getGamepadButtonValue(gamepad, 7) > 0.35;

  gamepad.buttons.forEach((button, index) => {
    const pressed = button.pressed || button.value > 0.55;
    if (pressed && !gamepadState.previousButtons[index]) handleGamepadButtonPressed(index);
    gamepadState.previousButtons[index] = pressed;
  });
}

function getGamepadMoveAxes(gamepad) {
  let x = applyGamepadDeadzone(gamepad.axes[0] ?? 0);
  let y = applyGamepadDeadzone(gamepad.axes[1] ?? 0);
  x += (isGamepadButtonHeld(gamepad, 15) ? 1 : 0) - (isGamepadButtonHeld(gamepad, 14) ? 1 : 0);
  y += (isGamepadButtonHeld(gamepad, 13) ? 1 : 0) - (isGamepadButtonHeld(gamepad, 12) ? 1 : 0);
  const length = Math.hypot(x, y);
  if (length <= 1) return { x, y };
  return { x: x / length, y: y / length };
}

function applyGamepadDeadzone(value) {
  return Math.abs(value) < GAMEPAD_DEADZONE ? 0 : value;
}

function getGamepadButtonValue(gamepad, index) {
  return gamepad.buttons[index]?.value ?? 0;
}

function isGamepadButtonHeld(gamepad, index) {
  return !!gamepad.buttons[index]?.pressed || getGamepadButtonValue(gamepad, index) > 0.55;
}

function handleGamepadButtonPressed(index) {
  unlockAudio();
  if (!gameStarted) {
    if (index === 0 || index === 9) document.querySelector("#startGameButton")?.click();
    return;
  }
  if (index === 9 && !gameOver && !gameWon) {
    togglePause();
    return;
  }
  if (gameOver && finalGameOver) {
    if (index === 0 || index === 9) document.querySelector("#restartButton")?.click();
    return;
  }
  if (gameOver) return;
  if (gamePaused) return;

  if (index === 0) toggleTreasureCarry();
  if (index === 1) activateRelic("bomb");
  if (index === 3 || index === 5) swingLaserSword();
  if (index === 4) activateRelic("impact");
  if (index === 6) activateRelic("flare");
  if (index === 8) activateRelic("magnet");
  if (index === 10) activateRelic("speed");
  if (index === 11) activateRelic("rocket");
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  unlockAudio();
  if (!gameStarted) {
    if (event.key === "Enter") document.querySelector("#startGameButton")?.click();
    return;
  }
  if (event.key === " ") event.preventDefault();
  if (event.key.toLowerCase() === "p" && !event.repeat) {
    togglePause();
    return;
  }
  if (gamePaused) return;
  keys.add(event.key.toLowerCase());
  if (event.key.toLowerCase() === "r" && !event.repeat) swingLaserSword();
  if (event.key.toLowerCase() === "e") toggleTreasureCarry();
  if (event.key === "`" || event.key === "F10") toggleDebugMode();
  if (event.key === "1") activateRelic("impact");
  if (event.key === "2") activateRelic("speed");
  if (event.key === "3") activateRelic("flare");
  if (event.key === "4") activateRelic("bomb");
  if (event.key === "5") activateRelic("radiation");
  if (event.key === "6") activateRelic("rocket");
  if (event.key === "7") activateRelic("magnet");
  if (event.key === "8") activateRelic("converter");
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("gamepadconnected", (event) => {
  gamepadState.index = event.gamepad.index;
  gamepadState.connected = true;
  gamepadState.previousButtons = [];
  setMessage("Controller connected.");
});

window.addEventListener("gamepaddisconnected", (event) => {
  if (gamepadState.index !== event.gamepad.index) return;
  gamepadState.index = null;
  gamepadState.connected = false;
  gamepadState.axes = { x: 0, y: 0 };
  gamepadState.blasterHeld = false;
  gamepadState.previousButtons = [];
  setMessage("Controller disconnected.");
});

canvas.addEventListener("mousemove", updateTreasureHover);
canvas.addEventListener("mouseleave", () => {
  treasureChest.hover = false;
  canvas.style.cursor = "";
});
canvas.addEventListener("click", (event) => {
  unlockAudio();
  updateTreasureHover(event);
  if (treasureChest.hover) tryPickupTreasure();
});

document.querySelector("#treasureBubbleClose").addEventListener("click", () => hideTreasureInstructions(true));
document.querySelector("#restartButton").addEventListener("click", () => window.location.reload());
document.querySelector("#resumeButton").addEventListener("click", () => togglePause(false));
document.querySelector("#pauseButton").addEventListener("click", () => togglePause());
document.querySelector("[data-repair-base]").addEventListener("click", repairBase);

document.querySelectorAll(".upgrade").forEach((button) => {
  if (button.dataset.upgrade) {
    button.addEventListener("click", () => buyUpgrade(button.dataset.upgrade));
  }
});

document.querySelectorAll("[data-relic]").forEach((button) => {
  button.addEventListener("click", (event) => {
    if (event.shiftKey) {
      upgradeRelic(button.dataset.relic);
    } else {
      activateRelic(button.dataset.relic);
    }
  });
});

document.querySelectorAll("[data-relic-upgrade]").forEach((button) => {
  button.addEventListener("click", () => upgradeRelic(button.dataset.relicUpgrade));
});

document.querySelector("#debugToggle").addEventListener("click", () => toggleDebugMode());

document.querySelectorAll("[data-debug]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.debug === "resources") debugGrantResources();
    if (button.dataset.debug === "repair") debugRepairHull();
    if (button.dataset.debug === "monster") debugSpawnMonster();
    if (button.dataset.debug === "allRelics") debugUnlockAllRelics();
    if (button.dataset.debug === "rooms") debugRevealRooms();
    if (button.dataset.debug === "map") debugRevealMap();
    if (button.dataset.debug === "zoom") debugCycleZoom();
  });
});

document.querySelectorAll("[data-debug-upgrade]").forEach((button) => {
  button.addEventListener("click", () => debugUpgrade(button.dataset.debugUpgrade));
});

document.querySelectorAll("[data-debug-relic]").forEach((button) => {
  button.addEventListener("click", () => debugUnlockRelic(button.dataset.debugRelic));
});

setupWorldSizeSelect();
setupStartOverlay();
setupPanelMinimizeControls();
setupItemTooltips();
updateDebugZoomStatus();
updateHud();
if (new URLSearchParams(window.location.search).has("damageSample") || window.location.hash.includes("damageSample")) {
  showDamageSampleOverlay();
}
requestAnimationFrame(loop);
